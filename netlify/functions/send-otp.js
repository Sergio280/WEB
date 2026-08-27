// ── send-otp.js ───────────────────────────────────────────────────────────────
// Paso 1 del login/registro SIN CONTRASEÑA (passwordless).
// Recibe un correo, genera un código de 6 dígitos, lo guarda con TTL y lo envía
// por email (Resend). El paso 2 (verify-otp.js) valida el código, crea/loguea al
// usuario y devuelve un Firebase custom token.
//
// Seguridad:
//   0. Allowlist de Origin/Referer (bloquea curl/script externo).       [CAPA 0]
//   1. Formato de email + blocklist de dominios desechables.            [CAPA 1]
//   2. Rate-limit de envíos por correo (evita spam de códigos).         [CAPA 2]
//   El código se guarda HASHEADO (sha256), nunca en claro. TTL 10 min.
// ─────────────────────────────────────────────────────────────────────────────

const crypto = require('crypto');
const admin  = require('firebase-admin');
const { isDisposable } = require('./_lib/disposable-emails');
const { sendEmail }    = require('./_lib/mailer');
const { hashIp, getClientIp } = require('./_lib/trial-abuse');

// ── Firebase Admin (singleton, idéntico al resto de functions) ───────────────
if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            clientEmail: `firebase-adminsdk-fbsvc@${projectId}.iam.gserviceaccount.com`,
            privateKey:  (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        }),
        databaseURL: `https://${projectId}-default-rtdb.firebaseio.com`,
    });
}
const db = admin.database();

// ── Parámetros ────────────────────────────────────────────────────────────────
const OTP_TTL_MS         = 10 * 60 * 1000;   // el código vive 10 minutos
const MAX_SENDS_PER_HR   = 5;                // máx. 5 códigos por CORREO por hora
const MAX_SENDS_PER_IP   = 15;               // máx. 15 códigos por IP por hora (anti-spam a terceros)
const SEND_WINDOW_MS     = 60 * 60 * 1000;

// ── Allowlist de orígenes (idéntica a create-trial-license) ──────────────────
const SITE_URL = process.env.SITE_URL || 'https://bimsaddin.com';
const ALLOWED_ORIGIN_PATTERNS = [
    SITE_URL,
    'https://bimsaddin.com',
    'https://www.bimsaddin.com',
    'https://bimsapp.netlify.app',                     // plugins ya instalados; NO eliminar
    /^https:\/\/deploy-preview-\d+--bimsapp\.netlify\.app$/,
    /^https:\/\/[a-z0-9-]+--bimsapp\.netlify\.app$/,
];
function isOriginAllowed(origin) {
    if (!origin) return false;
    for (const p of ALLOWED_ORIGIN_PATTERNS) {
        if (typeof p === 'string' && p === origin) return true;
        if (p instanceof RegExp && p.test(origin)) return true;
    }
    return false;
}
function corsHeadersFor(origin) {
    const headers = {
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin',
    };
    if (isOriginAllowed(origin)) headers['Access-Control-Allow-Origin'] = origin;
    return headers;
}
function resp(statusCode, bodyObj, origin) {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json', ...corsHeadersFor(origin) },
        body: JSON.stringify(bodyObj),
    };
}

// Clave estable (no reversible) para indexar el correo en la RTDB.
function emailKey(email) {
    return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex').slice(0, 24);
}
function hashCode(code) {
    return crypto.createHash('sha256').update(String(code)).digest('hex');
}

// Cuerpo del correo con el código (texto claro, sin rastreadores ni imágenes).
function otpEmailHtml(code) {
    return `<!DOCTYPE html><html><body style="font-family:Segoe UI,system-ui,sans-serif;color:#1f2937;line-height:1.6;">
<p>Tu código para entrar en <strong>BIMS</strong> es:</p>
<p style="font-size:34px;font-weight:700;letter-spacing:8px;color:#0f172a;margin:18px 0;">${code}</p>
<p style="color:#6b7280;">Escríbelo en la ventana de BIMS. El código caduca en 10 minutos.</p>
<p style="color:#6b7280;">Si no intentaste entrar, ignora este correo.</p>
<hr style="border:none;border-top:1px solid #e5e7eb;margin:22px 0;">
<p style="color:#9ca3af;font-size:13px;">BIMS · <a href="https://bimsaddin.com" style="color:#2563eb;">bimsaddin.com</a></p>
</body></html>`;
}

exports.handler = async (event) => {
    const origin  = event.headers.origin || event.headers.Origin || '';
    const referer = event.headers.referer || event.headers.Referer || '';

    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeadersFor(origin), body: '' };
    if (event.httpMethod !== 'POST')    return resp(405, { error: 'Método no permitido' }, origin);

    // ── CAPA 0: Origin/Referer ───────────────────────────────────────────────
    const refOk = ALLOWED_ORIGIN_PATTERNS.some(p =>
        typeof p === 'string' ? referer.startsWith(p) : p.test(referer));
    if (!isOriginAllowed(origin) && !refOk) {
        console.warn('[otp:send] Origin/Referer no permitido:', origin, referer);
        return resp(403, { error: 'Origen no autorizado' }, origin);
    }

    // ── Body ─────────────────────────────────────────────────────────────────
    let email;
    try {
        const b = JSON.parse(event.body || '{}');
        email = (b.email || '').trim().toLowerCase();
    } catch { return resp(400, { error: 'Body inválido' }, origin); }

    if (!email)                                return resp(400, { error: 'Correo requerido' }, origin);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return resp(400, { error: 'Formato de correo inválido' }, origin);

    // ── CAPA 1: dominios desechables ─────────────────────────────────────────
    if (isDisposable(email.split('@')[1]))
        return resp(400, { error: 'Por favor usa tu correo profesional o personal real (no temporal). Si tienes dudas, escríbenos a soporte@bimsaddin.com' }, origin);

    const key    = emailKey(email);
    const ref    = db.ref(`otp_codes/${key}`);
    const nowMs  = Date.now();

    // ── CAPA 1.b: rate-limit por IP (anti-spam de códigos a correos ajenos) ───
    // Sin esto, alguien podría pedir códigos para direcciones de terceros (5 por
    // cada una) sin límite global. Tope por IP y hora, con la IP no falsificable
    // del edge de Netlify. Best-effort: si la RTDB falla, no bloqueamos.
    try {
        const ipH    = hashIp(getClientIp(event.headers));
        const ipRef  = db.ref(`otp_ip_sends/${ipH}`);
        const snap   = await ipRef.once('value');
        const prev   = (snap.val() && snap.val().t) || [];
        const recientes = prev.filter(t => nowMs - t < SEND_WINDOW_MS);
        if (recientes.length >= MAX_SENDS_PER_IP)
            return resp(429, { error: 'Demasiadas solicitudes desde esta red. Espera unos minutos e intenta de nuevo.' }, origin);
        await ipRef.set({ t: recientes.concat(nowMs) });
    } catch (e) {
        console.warn('[otp:send] rate-limit por IP no verificable (no bloqueante):', e.message);
    }

    // ── CAPA 2: rate-limit de envíos por correo ──────────────────────────────
    try {
        const snap = await ref.once('value');
        const cur  = snap.val();
        if (cur && cur.sends) {
            const recientes = (cur.sends || []).filter(t => nowMs - t < SEND_WINDOW_MS);
            if (recientes.length >= MAX_SENDS_PER_HR)
                return resp(429, { error: 'Pediste demasiados códigos. Espera unos minutos e intenta de nuevo.' }, origin);
        }
    } catch (e) {
        console.warn('[otp:send] lectura rate-limit falló (no bloqueante):', e.message);
    }

    // ── Generar código de 6 dígitos y guardarlo (hasheado, con TTL) ──────────
    const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    try {
        const snap = await ref.once('value');
        const cur  = snap.val() || {};
        const sends = ((cur.sends || []).filter(t => nowMs - t < SEND_WINDOW_MS)).concat(nowMs);
        await ref.set({
            codeHash:  hashCode(code),
            expiresAt: nowMs + OTP_TTL_MS,
            attempts:  0,
            sends,
            createdAt: nowMs,
        });
    } catch (e) {
        console.error('[otp:send] no se pudo guardar el código:', e.message);
        return resp(500, { error: 'No se pudo generar el código. Intenta de nuevo.' }, origin);
    }

    // ── Enviar el código por correo ──────────────────────────────────────────
    const r = await sendEmail({
        to:      email,
        subject: `Tu código de BIMS: ${code}`,
        html:    otpEmailHtml(code),
        replyTo: 'soporte@bimsaddin.com',
    });
    if (!r || r.ok === false) {
        console.error('[otp:send] envío falló:', r && r.error);
        return resp(502, { error: 'No se pudo enviar el código a tu correo. Verifica la dirección e intenta de nuevo.' }, origin);
    }

    return resp(200, { ok: true, message: 'Código enviado. Revisa tu correo.' }, origin);
};
