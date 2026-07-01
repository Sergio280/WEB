// ── create-trial-license.js ──────────────────────────────────────────────────
// Endpoint público que crea una licencia TRIAL de 14 días en Firebase.
// POST /api/trial
// Body: { email, name?, company?, password, honeypot?, turnstileToken? }
//
// Reutiliza el mismo schema users_v2/{uid} que admin-create-license.js,
// con licenseType: "Trial" y expirationDate: now + 14 días.
// El validador del plugin (LicensedCommand) lo trata exactamente igual que
// una licencia pagada, solo que vence en 14 días.
//
// CAPAS DE SEGURIDAD (en orden de evaluación):
//   0. Origin/Referer allowlist (bloquea curl/script externo)
//   1. Honeypot: campo oculto que solo bots llenan → falla silenciosamente
//   2. Validación de formato de email
//   3. Blocklist de dominios desechables (yopmail, tempmail, etc.)
//   4. Validación de contraseña (min 8 chars, max 128)
//   5. Cloudflare Turnstile (si TURNSTILE_SECRET está configurado)
//   6. Rate limit por hash de IP (atómico via transaction, IP NO spoofable
//      tomada de x-nf-client-connection-ip)
//   7. Unicidad de email exacta + normalizada (bloquea Gmail "+", puntos, etc.)
//   8. maxActivations=1 (hardware único — manejado por el plugin)
//
// PII en logs: emails se enmascaran (ju***n@gmail.com). IPs solo se hashean.
// ─────────────────────────────────────────────────────────────────────────────

const crypto = require('crypto');
const admin  = require('firebase-admin');
const { isDisposable } = require('./_lib/disposable-emails');

// ── Inicialización Firebase Admin (singleton) ────────────────────────────────
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

const db   = admin.database();
const auth = admin.auth();

// ── Constantes de configuración ──────────────────────────────────────────────
const TRIAL_DAYS         = 14;
const MAX_TRIALS_PER_IP  = 2;
const IP_WINDOW_DAYS     = 30;
const MAX_NAME_LENGTH    = 80;
const MAX_COMPANY_LENGTH = 120;
const MIN_PASSWORD_LEN   = 8;
const MAX_PASSWORD_LEN   = 128;

// ── Allowlist de orígenes ────────────────────────────────────────────────────
// Producción + cualquier Deploy Preview del mismo proyecto Netlify. NO usar '*':
// si alguien borra SITE_URL por accidente, no queremos quedar abiertos al mundo.
// Se permiten AMBOS dominios de producción de forma EXPLÍCITA: los plugins ya
// distribuidos mandan Origin: https://bimsapp.netlify.app compilado en la DLL,
// y la web nueva vive en https://bimsaddin.com. Eliminar el subdominio netlify
// rompería el trial/licencia de los usuarios ya instalados, por eso se conserva
// para siempre además de SITE_URL.
const SITE_URL = process.env.SITE_URL || 'https://bimsaddin.com';
const ALLOWED_ORIGIN_PATTERNS = [
    SITE_URL,
    'https://bimsaddin.com',
    'https://www.bimsaddin.com',
    'https://bimsapp.netlify.app',                     // plugins ya instalados; NO eliminar
    /^https:\/\/deploy-preview-\d+--bimsapp\.netlify\.app$/,
    /^https:\/\/[a-z0-9-]+--bimsapp\.netlify\.app$/,   // branch deploys
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
    // Reflejar el Origin solo si pasa la allowlist. Si no, no incluir el header
    // (el browser bloqueará la respuesta — opción más segura que '*' o SITE_URL fija).
    const headers = {
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin',
    };
    if (isOriginAllowed(origin)) headers['Access-Control-Allow-Origin'] = origin;
    return headers;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function resp(statusCode, body, origin) {
    return {
        statusCode,
        headers: { ...corsHeadersFor(origin), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    };
}

function sanitize(str, maxLen) {
    if (!str || typeof str !== 'string') return '';
    return str.trim().slice(0, maxLen).replace(/[\x00-\x1f\x7f]/g, '');
}

// Sanitiza el gclid (Google Click ID) que captura la landing al venir del
// anuncio. Solo permitimos caracteres URL-safe propios del id (alfanuméricos,
// '-', '_', '.'); cualquier otra cosa la descartamos para no almacenar basura.
// Vacío si no aplica (tráfico orgánico/directo). Sirve también para gbraid/wbraid.
function sanitizeGclid(str) {
    if (!str || typeof str !== 'string') return '';
    const clean = str.trim().slice(0, 200);
    return /^[A-Za-z0-9._-]+$/.test(clean) ? clean : '';
}

function hashIp(ip) {
    const salt = process.env.IP_SALT || 'bims-trial-default-salt';
    return crypto.createHash('sha256').update(ip + salt).digest('hex').slice(0, 24);
}

// ── Obtención SEGURA de IP del cliente ───────────────────────────────────────
// Netlify provee 'x-nf-client-connection-ip' que SIEMPRE es la IP real del
// cliente y NO es modificable por el cliente (la setea el edge de Netlify
// después de procesar el request, sobrescribiendo cualquier header del cliente).
// 'x-forwarded-for' es spoofable porque el cliente puede agregar elementos antes
// del IP real cuando Netlify hace prepend. Lo usamos solo como fallback.
function getClientIp(headers) {
    const nfIp = headers['x-nf-client-connection-ip'];
    if (nfIp && typeof nfIp === 'string') return nfIp.trim();
    const xff = headers['x-forwarded-for'];
    if (xff && typeof xff === 'string') {
        // Netlify prepend la IP real al inicio, pero si el header falta o cambia
        // el comportamiento, esto es spoofable. Por eso es solo fallback.
        return xff.split(',')[0].trim();
    }
    return 'unknown';
}

// ── Normalización de email contra Gmail/Outlook "+" y "." tricks ─────────────
// Gmail, Outlook y otros tratan "user+anything@gmail.com" como "user@gmail.com".
// Gmail también ignora puntos en el local-part. Para impedir múltiples trials
// con el mismo email real, comparamos contra una versión normalizada.
const ALIAS_PROVIDERS = new Set([
    'gmail.com', 'googlemail.com',
    'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
    'yahoo.com', 'yahoo.es', 'yahoo.com.ar', 'yahoo.com.mx',
    'icloud.com', 'me.com', 'mac.com',
    'proton.me', 'protonmail.com',
]);

function normalizeEmailForUniqueness(email) {
    const at = email.lastIndexOf('@');
    if (at < 0) return email;
    let local  = email.slice(0, at).toLowerCase();
    const dom  = email.slice(at + 1).toLowerCase();
    if (ALIAS_PROVIDERS.has(dom)) {
        local = local.split('+')[0];           // ignorar alias "user+foo"
        if (dom === 'gmail.com' || dom === 'googlemail.com') {
            local = local.replace(/\./g, '');  // gmail ignora puntos
        }
    }
    return local + '@' + dom;
}

// ── Sanitización de PII para logs ────────────────────────────────────────────
// Mantiene un mínimo de info para debugging sin exponer el email completo.
function logSafeEmail(email) {
    const at = email.indexOf('@');
    if (at < 2) return '***@***';
    const local = email.slice(0, at);
    const dom   = email.slice(at + 1);
    const masked = local.length <= 3
        ? local[0] + '**'
        : local.slice(0, 2) + '***' + local.slice(-1);
    return masked + '@' + dom;
}

async function verifyTurnstile(token, ip) {
    if (!process.env.TURNSTILE_SECRET) return true;  // no configurado → skip
    if (!token) return false;
    try {
        const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET, response: token, remoteip: ip || '' }),
        });
        const data = await r.json();
        return data.success === true;
    } catch (e) {
        console.warn('[trial] Turnstile verify failed:', e.message);
        return false;
    }
}

// ── Handler principal ────────────────────────────────────────────────────────
exports.handler = async function (event) {
    const origin = event.headers.origin || event.headers.Origin || '';

    // Preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers: corsHeadersFor(origin), body: '' };
    }
    if (event.httpMethod !== 'POST') return resp(405, { error: 'Método no permitido' }, origin);

    // ── CAPA 0: Validación de Origin/Referer ─────────────────────────────────
    // Bloquea requests que no vienen del propio sitio. No es protección CSRF
    // estricta (no usamos cookies/sesión) pero filtra abuso vía curl/script
    // externo que no setea Origin. Bots avanzados pueden fakear Origin pero
    // sube la barrera y nos da otra señal para logging.
    const referer = event.headers.referer || event.headers.Referer || '';
    const refOk   = referer && ALLOWED_ORIGIN_PATTERNS.some(p =>
        typeof p === 'string' ? referer.startsWith(p)
                              : p.test(referer.replace(/^(https:\/\/[^\/]+).*$/, '$1'))
    );
    if (!isOriginAllowed(origin) && !refOk) {
        console.warn('[trial] Origin/Referer no permitido. Origin:', origin, 'Referer:', referer);
        return resp(403, { error: 'Origen no autorizado' }, origin);
    }

    let body;
    try { body = JSON.parse(event.body || '{}'); }
    catch { return resp(400, { error: 'Body inválido' }, origin); }

    const { email: rawEmail, name: rawName, company: rawCompany, password: rawPassword, honeypot, turnstileToken, gclid: rawGclid } = body;

    // IP segura desde el inicio (la usamos en muchos lugares)
    const ip  = getClientIp(event.headers);
    const ipH = hashIp(ip);

    // ── CAPA 1: Honeypot ─────────────────────────────────────────────────────
    if (honeypot && honeypot.length > 0) {
        console.log('[trial] Honeypot triggered. IP hash:', ipH);
        return resp(200, { success: true }, origin);
    }

    // ── CAPA 2: Validación de email ──────────────────────────────────────────
    if (!rawEmail || typeof rawEmail !== 'string')
        return resp(400, { error: 'Email requerido' }, origin);

    const email = rawEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
        return resp(400, { error: 'Formato de email inválido' }, origin);

    const domain = email.split('@')[1];

    // ── CAPA 3: Blocklist de dominios desechables ────────────────────────────
    if (isDisposable(domain))
        return resp(400, { error: 'Por favor usa tu correo profesional o personal real (no temporal). Si tienes dudas, escríbenos a soporte@bimsaddin.com' }, origin);

    // ── Validación de contraseña (server-side) ───────────────────────────────
    if (!rawPassword || typeof rawPassword !== 'string')
        return resp(400, { error: 'Contraseña requerida' }, origin);
    if (rawPassword.length < MIN_PASSWORD_LEN)
        return resp(400, { error: `La contraseña debe tener al menos ${MIN_PASSWORD_LEN} caracteres` }, origin);
    if (rawPassword.length > MAX_PASSWORD_LEN)
        return resp(400, { error: 'Contraseña demasiado larga' }, origin);

    // ── CAPA 4: Turnstile (opcional) ─────────────────────────────────────────
    const turnstileOk = await verifyTurnstile(turnstileToken, ip);
    if (!turnstileOk)
        return resp(403, { error: 'Verificación de seguridad falló. Recarga la página e intenta de nuevo.' }, origin);

    // ── CAPA 5: Rate limit por hash de IP (con transaction atómico) ──────────
    const ipRef    = db.ref(`trials_by_ip_hash/${ipH}`);
    const windowMs = IP_WINDOW_DAYS * 86400 * 1000;
    const nowMs    = Date.now();

    let rateLimitHit = false;
    try {
        const txResult = await ipRef.transaction(current => {
            const existing = current || { count: 0, firstAt: nowMs };
            const windowExpired = nowMs - existing.firstAt > windowMs;

            if (!windowExpired && existing.count >= MAX_TRIALS_PER_IP) {
                rateLimitHit = true;
                return current;   // no modificar
            }
            return {
                count:   windowExpired ? 1 : (existing.count + 1),
                firstAt: windowExpired ? nowMs : existing.firstAt,
                lastAt:  nowMs,
            };
        });
        if (!txResult.committed || rateLimitHit) {
            console.log('[trial] Rate limit hit · ipHash:', ipH);
            return resp(429, { error: 'Se alcanzó el máximo de trials desde esta red. Si necesitas más licencias, escríbenos a soporte@bimsaddin.com' }, origin);
        }
    } catch (e) {
        console.warn('[trial] Rate limit transaction failed (no bloqueante):', e.message);
        // En caso de fallo de RTDB, no bloqueamos al usuario legítimo. Trade-off
        // consciente: priorizar disponibilidad sobre rate limit perfecto. Las
        // otras capas (unicidad email, disposable, honeypot) siguen activas.
    }

    // ── CAPA 6: Unicidad por email (normalizado contra "+" y "." tricks) ─────
    // Verificamos tanto el email tal cual como su forma normalizada para impedir
    // que la misma persona se registre múltiples veces con alias de Gmail.
    const emailNorm = normalizeEmailForUniqueness(email);
    const emailNormHash = crypto.createHash('sha256').update(emailNorm).digest('hex').slice(0, 24);
    const normIdxRef = db.ref(`trial_email_normalized_index/${emailNormHash}`);

    try {
        // Check 1: email tal cual ya tiene cuenta
        await auth.getUserByEmail(email);
        // Si llegamos aquí, existe — rechazar
        await rollbackRateLimit(ipRef, ipH);
        return resp(409, { error: 'Ya existe una cuenta con este email. Si nunca usaste BIMS o necesitas extender tu trial, escríbenos a soporte@bimsaddin.com' }, origin);
    } catch (e) {
        if (e.code !== 'auth/user-not-found') {
            console.error('[trial] Firebase auth lookup error:', e.message);
            await rollbackRateLimit(ipRef, ipH);
            return resp(500, { error: 'Error consultando usuarios. Intenta de nuevo.' }, origin);
        }
        // OK, no existe → seguir
    }

    // Check 2: alguna variante del email normalizado ya existe
    try {
        const normSnap = await normIdxRef.once('value');
        if (normSnap.exists()) {
            await rollbackRateLimit(ipRef, ipH);
            return resp(409, { error: 'Ya existe una cuenta para este email (o una variante con + o puntos). Escríbenos a soporte@bimsaddin.com si necesitas ayuda.' }, origin);
        }
    } catch (e) {
        console.warn('[trial] Normalized index check failed (no bloqueante):', e.message);
    }

    // ── Crear usuario + licencia Trial ───────────────────────────────────────
    const name    = sanitize(rawName, MAX_NAME_LENGTH);
    const company = sanitize(rawCompany, MAX_COMPANY_LENGTH);
    const gclid   = sanitizeGclid(rawGclid);

    let uid;
    try {
        const newUser = await auth.createUser({
            email,
            password:      rawPassword,
            emailVerified: false,
            displayName:   name || email.split('@')[0],
        });
        uid = newUser.uid;
    } catch (e) {
        console.error('[trial] createUser failed:', e.code || 'unknown', '·', logSafeEmail(email));
        await rollbackRateLimit(ipRef, ipH);
        if (e.code === 'auth/email-already-exists')
            return resp(409, { error: 'Ya existe una cuenta con este email.' }, origin);
        if (e.code === 'auth/weak-password')
            return resp(400, { error: 'Contraseña demasiado débil. Usa al menos 8 caracteres con letras y números.' }, origin);
        if (e.code === 'auth/invalid-email')
            return resp(400, { error: 'Formato de email inválido' }, origin);
        return resp(500, { error: 'No se pudo crear el usuario. Intenta de nuevo.' }, origin);
    }

    const now       = new Date();
    const expiresAt = new Date(now.getTime() + TRIAL_DAYS * 86400 * 1000);

    const licenseRecord = {
        userId:         uid,
        email,
        isActive:       true,
        licenseType:    'Trial',
        expirationDate: expiresAt.toISOString(),
        maxDevices:     1,
        maxActivations: 1,
        createdAt:      now.toISOString(),
        updatedAt:      now.toISOString(),
        validationCount: 0,
        trialMeta: {
            name, company,
            ipHash:        ipH,
            emailNormHash, // permite admin queries sin exponer el email
            source:        'web-form',
            createdAt:     now.toISOString(),
            // gclid del anuncio (si vino de Google Ads). Lo usa report-activations
            // para atribuir la ACTIVACIÓN real como conversión offline. Solo se
            // guarda si existe, para no ensuciar el registro del tráfico orgánico.
            ...(gclid ? { gclid } : {}),
        },
    };

    try {
        await db.ref(`users_v2/${uid}`).set(licenseRecord);
    } catch (e) {
        console.error('[trial] db write failed, rolling back:', e.message);
        // Rollback completo
        try { await auth.deleteUser(uid); } catch {}
        await rollbackRateLimit(ipRef, ipH);
        return resp(500, { error: 'No se pudo crear la licencia trial. Intenta de nuevo.' }, origin);
    }

    // Index del email normalizado para futuras verificaciones de unicidad
    try {
        await normIdxRef.set({ uid, createdAt: now.toISOString() });
    } catch (e) {
        console.warn('[trial] No se pudo escribir el indice normalizado (no critico):', e.message);
    }

    console.log(`[trial] OK · ${logSafeEmail(email)} · uid=${uid} · vence=${expiresAt.toISOString().slice(0,10)}`);

    return resp(200, {
        success:   true,
        expiresAt: expiresAt.toISOString(),
        message:   'Tu trial de 14 días está listo. Descarga BIMS e inicia sesión con tu email y contraseña.',
    }, origin);
};

// ── Rollback del rate limit cuando fallamos después de incrementarlo ─────────
async function rollbackRateLimit(ipRef, ipH) {
    try {
        await ipRef.transaction(current => {
            if (!current || current.count <= 0) return current;
            return { ...current, count: current.count - 1 };
        });
    } catch (e) {
        console.warn('[trial] Rollback de rate limit fallo (no critico):', e.message);
    }
}
