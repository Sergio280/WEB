// ── _lib/trial-abuse.js ───────────────────────────────────────────────────────
// Defensas anti-abuso compartidas para la creación de trials. Replican la lógica
// probada de create-trial-license.js para que el camino OTP (send-otp/verify-otp)
// tenga las MISMAS barreras y no sea una puerta trasera para farmear trials.
//
// Cubre: normalización de email (alias Gmail/Outlook con "+" y "."), hash de IP
// no reversible, rate-limit por IP con transacción atómica, unicidad de email
// (Auth + índice normalizado) y escritura del índice.
//
// NO se refactorizó create-trial-license para usar este módulo: aquel maneja el
// alta ligada a pagos y no se toca sin necesidad. Este módulo es para las
// funciones nuevas.
// ─────────────────────────────────────────────────────────────────────────────

const crypto = require('crypto');

const MAX_TRIALS_PER_IP = 2;
const IP_WINDOW_DAYS     = 30;

// Proveedores que tratan "user+x@" y (Gmail) los puntos como el mismo buzón.
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
        local = local.split('+')[0];
        if (dom === 'gmail.com' || dom === 'googlemail.com') {
            local = local.replace(/\./g, '');
        }
    }
    return local + '@' + dom;
}

function emailNormHash(email) {
    return crypto.createHash('sha256')
        .update(normalizeEmailForUniqueness(email))
        .digest('hex').slice(0, 24);
}

function hashIp(ip) {
    const salt = process.env.IP_SALT || 'bims-trial-default-salt';
    return crypto.createHash('sha256').update(ip + salt).digest('hex').slice(0, 24);
}

// IP real del cliente. 'x-nf-client-connection-ip' la pone el edge de Netlify y
// NO es falsificable; 'x-forwarded-for' es solo respaldo.
function getClientIp(headers) {
    const nfIp = headers['x-nf-client-connection-ip'];
    if (nfIp && typeof nfIp === 'string') return nfIp.trim();
    const xff = headers['x-forwarded-for'];
    if (xff && typeof xff === 'string') return xff.split(',')[0].trim();
    return 'unknown';
}

// Rate-limit por IP con transacción atómica. Devuelve { limited, ipRef, ipHash }.
// limited=true → se alcanzó el máximo (rechazar). Si la RTDB falla, NO bloquea
// (disponibilidad > rate-limit perfecto; las otras capas siguen).
async function checkIpRateLimit(db, headers) {
    const ipHash = hashIp(getClientIp(headers));
    const ipRef  = db.ref(`trials_by_ip_hash/${ipHash}`);
    const windowMs = IP_WINDOW_DAYS * 86400 * 1000;
    const nowMs    = Date.now();
    let limited = false;
    try {
        const tx = await ipRef.transaction(current => {
            const existing = current || { count: 0, firstAt: nowMs };
            const windowExpired = nowMs - existing.firstAt > windowMs;
            if (!windowExpired && existing.count >= MAX_TRIALS_PER_IP) {
                limited = true;
                return current;
            }
            return {
                count:   windowExpired ? 1 : (existing.count + 1),
                firstAt: windowExpired ? nowMs : existing.firstAt,
                lastAt:  nowMs,
            };
        });
        if (!tx.committed) limited = limited || true;
    } catch (e) {
        console.warn('[trial-abuse] rate-limit tx falló (no bloqueante):', e.message);
        limited = false;
    }
    return { limited, ipRef, ipHash };
}

// Deshace el incremento del rate-limit cuando el registro se aborta después
// (email duplicado, fallo al crear, etc.) para no penalizar a la IP sin razón.
async function rollbackRateLimit(ipRef) {
    try {
        await ipRef.transaction(current => {
            if (!current) return current;
            return { ...current, count: Math.max(0, (current.count || 1) - 1) };
        });
    } catch { /* no crítico */ }
}

// Unicidad de email: contra Firebase Auth (tal cual) y contra el índice
// normalizado (alias). Devuelve { unique, reason }.
async function checkEmailUnique(auth, db, email) {
    // 1) ¿existe tal cual en Auth?
    try {
        await auth.getUserByEmail(email);
        return { unique: false, reason: 'exists' };
    } catch (e) {
        if (e.code !== 'auth/user-not-found') {
            return { unique: false, reason: 'lookup-error' };
        }
    }
    // 2) ¿alguna variante normalizada ya tiene índice?
    try {
        const snap = await db.ref(`trial_email_normalized_index/${emailNormHash(email)}`).once('value');
        if (snap.exists()) return { unique: false, reason: 'alias-exists' };
    } catch (e) {
        console.warn('[trial-abuse] índice normalizado no verificable (no bloqueante):', e.message);
    }
    return { unique: true, reason: null };
}

async function writeNormalizedIndex(db, email, uid) {
    try {
        await db.ref(`trial_email_normalized_index/${emailNormHash(email)}`)
            .set({ uid, createdAt: new Date().toISOString() });
    } catch (e) {
        console.warn('[trial-abuse] no se pudo escribir el índice normalizado (no crítico):', e.message);
    }
}

module.exports = {
    ALIAS_PROVIDERS, normalizeEmailForUniqueness, emailNormHash,
    hashIp, getClientIp,
    checkIpRateLimit, rollbackRateLimit,
    checkEmailUnique, writeNormalizedIndex,
    MAX_TRIALS_PER_IP, IP_WINDOW_DAYS,
};
