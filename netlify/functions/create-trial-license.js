// ── create-trial-license.js ──────────────────────────────────────────────────
// Endpoint público que crea una licencia TRIAL de 14 días en Firebase.
// POST /api/trial
// Body: { email, name?, company?, honeypot?, turnstileToken? }
//
// Reutiliza el mismo schema users_v2/{uid} que admin-create-license.js,
// con licenseType: "Trial" y expirationDate: now + 14 días.
// El validador del plugin (LicensedCommand) lo trata exactamente igual que
// una licencia pagada, solo que vence en 14 días.
//
// CAPAS ANTI-ABUSO (en orden de evaluación):
//   1. Honeypot: campo oculto que solo bots llenan → falla silenciosamente
//   2. Validación de formato de email
//   3. Blocklist de dominios desechables (yopmail, tempmail, etc.)
//   4. Cloudflare Turnstile (si TURNSTILE_SECRET está configurado)
//   5. Rate limit por hash de IP (max 2 trials / IP / 30 días)
//   6. Unicidad de email vía Firebase Auth
//   7. maxActivations=1 (hardware único — manejado por el plugin)
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

const CORS = {
    'Access-Control-Allow-Origin':  process.env.SITE_URL || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function resp(statusCode, body) {
    return { statusCode, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

function sanitize(str, maxLen) {
    if (!str || typeof str !== 'string') return '';
    return str.trim().slice(0, maxLen).replace(/[\x00-\x1f\x7f]/g, '');
}

function hashIp(ip) {
    const salt = process.env.IP_SALT || 'bims-trial-default-salt';
    return crypto.createHash('sha256').update(ip + salt).digest('hex').slice(0, 24);
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
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
    if (event.httpMethod !== 'POST')    return resp(405, { error: 'Método no permitido' });

    let body;
    try { body = JSON.parse(event.body || '{}'); }
    catch { return resp(400, { error: 'Body inválido' }); }

    const { email: rawEmail, name: rawName, company: rawCompany, honeypot, turnstileToken } = body;

    // ── CAPA 1: Honeypot ─────────────────────────────────────────────────────
    // Si el campo oculto llegó con contenido, fue un bot. Fingir éxito para
    // no entrenar al atacante (responde 200 sin crear nada).
    if (honeypot && honeypot.length > 0) {
        console.log('[trial] Honeypot triggered, IP hash:', hashIp(event.headers['x-forwarded-for'] || 'unknown'));
        return resp(200, { success: true });
    }

    // ── CAPA 2: Validación de email ──────────────────────────────────────────
    if (!rawEmail || typeof rawEmail !== 'string')
        return resp(400, { error: 'Email requerido' });

    const email = rawEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
        return resp(400, { error: 'Formato de email inválido' });

    const domain = email.split('@')[1];

    // ── CAPA 3: Blocklist de dominios desechables ────────────────────────────
    if (isDisposable(domain))
        return resp(400, { error: 'Por favor usa tu correo profesional o personal real (no temporal). Si tienes dudas, escríbenos a bimsaddin@gmail.com' });

    // ── CAPA 4: Turnstile (opcional, activable con env var) ──────────────────
    const ip = (event.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    const turnstileOk = await verifyTurnstile(turnstileToken, ip);
    if (!turnstileOk)
        return resp(403, { error: 'Verificación de seguridad falló. Recarga la página e intenta de nuevo.' });

    // ── CAPA 5: Rate limit por hash de IP ────────────────────────────────────
    const ipH      = hashIp(ip);
    const ipRef    = db.ref(`trials_by_ip_hash/${ipH}`);
    const windowMs = IP_WINDOW_DAYS * 86400 * 1000;
    const nowMs    = Date.now();

    try {
        const ipSnap = await ipRef.once('value');
        const ipData = ipSnap.val() || { count: 0, firstAt: nowMs };

        // ¿la ventana de 30d sigue abierta y ya pasaron el límite?
        if (nowMs - ipData.firstAt < windowMs && ipData.count >= MAX_TRIALS_PER_IP) {
            console.log(`[trial] Rate limit hit for ipHash ${ipH}`);
            return resp(429, { error: 'Se alcanzó el máximo de trials desde esta red. Si necesitas más licencias, escríbenos a bimsaddin@gmail.com' });
        }
    } catch (e) {
        console.warn('[trial] No se pudo leer rate limit (no bloqueante):', e.message);
    }

    // ── CAPA 6: Unicidad por email ───────────────────────────────────────────
    try {
        await auth.getUserByEmail(email);
        // Usuario existe → ya tuvo trial o pagó. NO le damos otro trial.
        return resp(409, { error: 'Ya existe una cuenta con este email. Si nunca usaste BIMS o necesitas extender tu trial, escríbenos a bimsaddin@gmail.com' });
    } catch (e) {
        if (e.code !== 'auth/user-not-found') {
            console.error('[trial] Firebase auth lookup error:', e.message);
            return resp(500, { error: 'Error consultando usuarios. Intenta de nuevo.' });
        }
        // user-not-found → continuamos normalmente
    }

    // ── Crear usuario + licencia Trial ───────────────────────────────────────
    const name    = sanitize(rawName, MAX_NAME_LENGTH);
    const company = sanitize(rawCompany, MAX_COMPANY_LENGTH);

    let uid;
    try {
        const newUser = await auth.createUser({
            email,
            password:      crypto.randomBytes(16).toString('base64url'),
            emailVerified: false,
            displayName:   name || email.split('@')[0],
        });
        uid = newUser.uid;
    } catch (e) {
        console.error('[trial] createUser failed:', e.message);
        return resp(500, { error: 'No se pudo crear el usuario. Intenta de nuevo.' });
    }

    const now        = new Date();
    const expiresAt  = new Date(now.getTime() + TRIAL_DAYS * 86400 * 1000);

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
            ipHash:    ipH,
            source:    'web-form',
            createdAt: now.toISOString(),
        },
    };

    try {
        await db.ref(`users_v2/${uid}`).set(licenseRecord);
    } catch (e) {
        // Rollback: si no se pudo crear la licencia, eliminar el usuario auth
        console.error('[trial] db write failed, rolling back:', e.message);
        try { await auth.deleteUser(uid); } catch {}
        return resp(500, { error: 'No se pudo crear la licencia trial. Intenta de nuevo.' });
    }

    // ── Actualizar contador IP (fire-and-forget, no bloquea respuesta) ───────
    try {
        const ipSnap   = await ipRef.once('value');
        const existing = ipSnap.val();
        const windowExpired = !existing || (nowMs - existing.firstAt > windowMs);
        await ipRef.set({
            count:   windowExpired ? 1 : (existing.count + 1),
            firstAt: windowExpired ? nowMs : existing.firstAt,
            lastAt:  nowMs,
        });
    } catch (e) {
        console.warn('[trial] No se pudo actualizar contador IP (no crítico):', e.message);
    }

    // ── Enviar email "Set password" vía Firebase (mismo flow que paga) ───────
    const apiKey = process.env.FIREBASE_API_KEY;
    let emailSent = false;
    if (apiKey) {
        try {
            const r = await fetch(
                `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
                {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ requestType: 'PASSWORD_RESET', email }),
                }
            );
            const data = await r.json();
            emailSent = !!data.email;
            if (!emailSent) console.warn('[trial] Firebase email response:', JSON.stringify(data));
        } catch (e) {
            console.warn('[trial] Email send failed (no bloqueante):', e.message);
        }
    } else {
        console.warn('[trial] FIREBASE_API_KEY no configurada — email NO enviado');
    }

    console.log(`[trial] OK · ${email} · uid=${uid} · vence=${expiresAt.toISOString()} · email=${emailSent}`);

    return resp(200, {
        success:   true,
        emailSent,
        expiresAt: expiresAt.toISOString(),
        message:   emailSent
            ? 'Tu trial de 14 días está listo. Revisa tu correo para crear tu contraseña y descargar BIMS.'
            : 'Tu trial fue creado pero hubo un problema enviando el correo. Escríbenos a bimsaddin@gmail.com',
    });
};
