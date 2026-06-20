// ── _lib/google-ads.js ───────────────────────────────────────────────────────
// Cliente MÍNIMO de la Google Ads API para subir CONVERSIONES OFFLINE de la
// acción "Activación BIMS".
//
// Por qué existe:
//   El evento que Google Ads cuenta hoy como "conversión" es el registro del
//   formulario de trial (create-trial-license). Pero un registro NO es una
//   instalación real: muchos usuarios se registran y nunca llegan a ejecutar el
//   plugin (SmartScreen, fricción, etc.). Aquí reportamos a Google la ACTIVACIÓN
//   real (cuando el plugin corre por primera vez en una máquina) para que el
//   algoritmo de pujas optimice hacia instalaciones, no hacia formularios vacíos.
//
// Atribución (estrategia "ambos", máxima cobertura):
//   - gclid           → si lo capturamos en la landing al venir del anuncio.
//   - hashedEmail     → Enhanced Conversions for Leads como RESPALDO (SHA-256 del
//                       email normalizado). Cubre los casos sin gclid.
//
// Requisitos de cuenta (variables de entorno en Netlify):
//   GOOGLE_ADS_DEVELOPER_TOKEN     Token de desarrollador (API Center de Google Ads)
//   GOOGLE_ADS_CLIENT_ID           OAuth client id (Google Cloud Console)
//   GOOGLE_ADS_CLIENT_SECRET       OAuth client secret
//   GOOGLE_ADS_REFRESH_TOKEN       Refresh token offline del usuario que administra la cuenta
//   GOOGLE_ADS_CUSTOMER_ID         ID de la cuenta SIN guiones (ej. 3867751388)
//   GOOGLE_ADS_LOGIN_CUSTOMER_ID   (opcional) ID del MCC administrador, SIN guiones
//   GOOGLE_ADS_CONVERSION_ACTION_ID  ID numérico de la acción de conversión "Activación BIMS"
//
// Nota: requiere Node 18+ por usar fetch global (Netlify corre Node 20).
// ─────────────────────────────────────────────────────────────────────────────

const crypto = require('crypto');

const API_VERSION = process.env.GOOGLE_ADS_API_VERSION || 'v18';

// ── Normalización + hash de email para Enhanced Conversions ──────────────────
// Google exige: quitar espacios al inicio/fin y pasar a minúsculas, luego
// SHA-256 en hex minúsculas. (No exige quitar puntos/alias de Gmail; con
// trim+lowercase basta para que Google haga el match contra el clic.)
function hashEmail(email) {
    if (!email || typeof email !== 'string') return null;
    const norm = email.trim().toLowerCase();
    if (!norm) return null;
    return crypto.createHash('sha256').update(norm, 'utf8').digest('hex');
}

// ── ISO 8601 → formato que exige la Google Ads API ───────────────────────────
// La API quiere "yyyy-MM-dd HH:mm:ss+HH:mm". Nuestras fechas vienen en ISO UTC
// (ej. "2026-06-13T04:20:54.965Z"). Convertimos a UTC con offset "+00:00".
function toAdsDateTime(isoString) {
    const d = isoString ? new Date(isoString) : new Date();
    if (isNaN(d.getTime())) return null;
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ` +
           `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}+00:00`;
}

// ── Intercambio de refresh token por access token (OAuth2) ───────────────────
async function getAccessToken() {
    const { GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN } = process.env;
    if (!GOOGLE_ADS_CLIENT_ID || !GOOGLE_ADS_CLIENT_SECRET || !GOOGLE_ADS_REFRESH_TOKEN) {
        throw new Error('Faltan credenciales OAuth de Google Ads (CLIENT_ID/SECRET/REFRESH_TOKEN)');
    }
    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id:     GOOGLE_ADS_CLIENT_ID,
            client_secret: GOOGLE_ADS_CLIENT_SECRET,
            refresh_token: GOOGLE_ADS_REFRESH_TOKEN,
            grant_type:    'refresh_token',
        }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) {
        throw new Error(`OAuth token falló (${res.status}): ${data.error_description || data.error || 'sin detalle'}`);
    }
    return data.access_token;
}

// ── Verifica que toda la configuración necesaria esté presente ───────────────
function getConfig() {
    const customerId       = (process.env.GOOGLE_ADS_CUSTOMER_ID || '').replace(/-/g, '');
    const loginCustomerId  = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '').replace(/-/g, '');
    const developerToken   = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    const conversionAction = process.env.GOOGLE_ADS_CONVERSION_ACTION_ID;

    const missing = [];
    if (!customerId)       missing.push('GOOGLE_ADS_CUSTOMER_ID');
    if (!developerToken)   missing.push('GOOGLE_ADS_DEVELOPER_TOKEN');
    if (!conversionAction) missing.push('GOOGLE_ADS_CONVERSION_ACTION_ID');
    if (missing.length) throw new Error('Config de Google Ads incompleta: ' + missing.join(', '));

    return {
        customerId,
        loginCustomerId,
        developerToken,
        conversionActionResource: `customers/${customerId}/conversionActions/${conversionAction}`,
    };
}

// ── Subida de conversiones offline ───────────────────────────────────────────
// items: [{ gclid?, email?, activatedAt (ISO), value?, currency? }]
// Devuelve { uploaded, skipped, partialFailureError, raw } y NO lanza por fallos
// parciales (usamos partialFailure:true) — así una conversión rechazada no tumba
// las demás. Lanza solo si la request entera falla (auth, red, config).
async function uploadActivationConversions(items) {
    const cfg = getConfig();

    // Construir cada ClickConversion. Necesita al menos gclid O un userIdentifier.
    const conversions = [];
    const skipped = [];
    for (const it of items) {
        const conversionDateTime = toAdsDateTime(it.activatedAt);
        if (!conversionDateTime) { skipped.push({ item: it, why: 'fecha-invalida' }); continue; }

        const conv = {
            conversionAction:   cfg.conversionActionResource,
            conversionDateTime,
            conversionValue:    typeof it.value === 'number' ? it.value : 1,
            currencyCode:       it.currency || 'PEN',
        };
        if (it.gclid) conv.gclid = it.gclid;

        const hashed = hashEmail(it.email);
        if (hashed) conv.userIdentifiers = [{ hashedEmail: hashed }];

        // Sin gclid y sin email no hay forma de atribuir → saltar.
        if (!conv.gclid && !conv.userIdentifiers) { skipped.push({ item: it, why: 'sin-gclid-ni-email' }); continue; }

        conversions.push(conv);
    }

    if (conversions.length === 0) {
        return { uploaded: 0, skipped: skipped.length, partialFailureError: null, raw: null };
    }

    const accessToken = await getAccessToken();
    const url = `https://googleads.googleapis.com/${API_VERSION}/customers/${cfg.customerId}:uploadClickConversions`;
    const headers = {
        'Authorization':  `Bearer ${accessToken}`,
        'developer-token': cfg.developerToken,
        'Content-Type':   'application/json',
    };
    if (cfg.loginCustomerId) headers['login-customer-id'] = cfg.loginCustomerId;

    const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ conversions, partialFailure: true }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(`uploadClickConversions falló (${res.status}): ${JSON.stringify(data).slice(0, 500)}`);
    }

    // partialFailureError describe conversiones individuales rechazadas (si hubo).
    return {
        uploaded: conversions.length,
        skipped: skipped.length,
        partialFailureError: data.partialFailureError || null,
        raw: data,
    };
}

module.exports = { uploadActivationConversions, hashEmail, toAdsDateTime, getAccessToken };
