// ── verify-otp.js ─────────────────────────────────────────────────────────────
// Paso 2 del login/registro SIN CONTRASEÑA. Valida el código de 6 dígitos que
// envió send-otp.js; si es correcto:
//   - Si el usuario NO existe → lo crea (trial 14 días, igual que create-trial).
//   - Si YA existe (hizo trial o compró) → lo respeta tal cual.
//   - Marca la cuenta como CORPORATIVA si el dominio no es webmail personal, y
//     avisa a soporte@ (canal de empresa).
//   - Devuelve un Firebase CUSTOM TOKEN → el plugin inicia sesión SIN contraseña.
//
// La contraseña NO desaparece: quien ya la tenga sigue pudiendo usarla; y el
// usuario web puede crearla por el flujo de "restablecer contraseña" de siempre.
// Este endpoint solo añade el camino passwordless.
// ─────────────────────────────────────────────────────────────────────────────

const crypto = require('crypto');
const admin  = require('firebase-admin');
const { sendEmail }        = require('./_lib/mailer');
const { isCorporateDomain } = require('./_lib/personal-email-domains');
const { emailNormHash, checkIpRateLimit, rollbackRateLimit, writeNormalizedIndex } = require('./_lib/trial-abuse');

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

const MAX_ATTEMPTS = 5;      // intentos por código antes de invalidarlo
const TRIAL_DAYS   = 14;

// ── Allowlist de orígenes (idéntica a send-otp / create-trial) ───────────────
const SITE_URL = process.env.SITE_URL || 'https://bimsaddin.com';
const ALLOWED_ORIGIN_PATTERNS = [
    SITE_URL, 'https://bimsaddin.com', 'https://www.bimsaddin.com',
    'https://bimsapp.netlify.app',
    /^https:\/\/deploy-preview-\d+--bimsapp\.netlify\.app$/,
    /^https:\/\/[a-z0-9-]+--bimsapp\.netlify\.app$/,
];
function isOriginAllowed(o){ if(!o) return false; return ALLOWED_ORIGIN_PATTERNS.some(p => typeof p==='string'?p===o:p.test(o)); }
function corsHeadersFor(o){ const h={'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'}; if(isOriginAllowed(o)) h['Access-Control-Allow-Origin']=o; return h; }
function resp(sc, body, o){ return { statusCode:sc, headers:{'Content-Type':'application/json',...corsHeadersFor(o)}, body:JSON.stringify(body) }; }

function emailKey(email){ return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex').slice(0,24); }
function hashCode(code){ return crypto.createHash('sha256').update(String(code)).digest('hex'); }

// Aviso a soporte de un registro corporativo (canal de empresa).
async function avisarCorporativo(email, isNew) {
    const dom = email.split('@')[1];
    await sendEmail({
        to:      'soporte@bimsaddin.com',
        subject: `🏢 Registro corporativo en BIMS: @${dom}`,
        html:    `<!DOCTYPE html><html><body style="font-family:Segoe UI,system-ui,sans-serif;color:#1f2937;line-height:1.6;">
<p><strong>Nuevo lead corporativo</strong> (${isNew ? 'cuenta nueva' : 'cuenta existente'}):</p>
<ul>
  <li>Correo: <strong>${email}</strong></li>
  <li>Dominio: <strong>@${dom}</strong></li>
  <li>Fecha: ${new Date().toISOString()}</li>
</ul>
<p>Contáctalo mientras el interés está caliente para ofrecer un <strong>plan de equipo</strong> (licencias por asientos).</p>
</body></html>`,
        replyTo: email,
    }).catch(e => console.warn('[otp:verify] aviso corporativo falló:', e.message));
}

exports.handler = async (event) => {
    const origin  = event.headers.origin || event.headers.Origin || '';
    const referer = event.headers.referer || event.headers.Referer || '';

    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeadersFor(origin), body: '' };
    if (event.httpMethod !== 'POST')    return resp(405, { error: 'Método no permitido' }, origin);

    const refOk = ALLOWED_ORIGIN_PATTERNS.some(p => typeof p==='string' ? referer.startsWith(p) : p.test(referer));
    if (!isOriginAllowed(origin) && !refOk)
        return resp(403, { error: 'Origen no autorizado' }, origin);

    let email, code, name;
    try {
        const b = JSON.parse(event.body || '{}');
        email = (b.email || '').trim().toLowerCase();
        code  = String(b.code || '').trim();
        name  = (b.name || '').trim();
    } catch { return resp(400, { error: 'Body inválido' }, origin); }

    if (!email || !code)              return resp(400, { error: 'Correo y código requeridos' }, origin);
    if (!/^\d{6}$/.test(code))        return resp(400, { error: 'El código debe ser de 6 dígitos' }, origin);

    const ref  = db.ref(`otp_codes/${emailKey(email)}`);
    const snap = await ref.once('value');
    const rec  = snap.val();

    if (!rec)                          return resp(400, { error: 'No hay un código activo para este correo. Solicita uno nuevo.' }, origin);
    if (Date.now() > rec.expiresAt)  { await ref.remove(); return resp(400, { error: 'El código caducó. Solicita uno nuevo.' }, origin); }
    if ((rec.attempts || 0) >= MAX_ATTEMPTS) { await ref.remove(); return resp(429, { error: 'Demasiados intentos. Solicita un código nuevo.' }, origin); }

    // Comparación en tiempo constante del hash.
    const ok = crypto.timingSafeEqual(Buffer.from(hashCode(code)), Buffer.from(rec.codeHash));
    if (!ok) {
        await ref.update({ attempts: (rec.attempts || 0) + 1 });
        return resp(401, { error: 'Código incorrecto. Verifica e intenta de nuevo.' }, origin);
    }

    // Código correcto → consumirlo (un solo uso).
    await ref.remove();

    // ── Buscar o crear el usuario ────────────────────────────────────────────
    let uid, isNewUser = false, licenseType = 'Trial';
    try {
        const u = await auth.getUserByEmail(email);
        uid = u.uid;
        // Respetar la licencia existente (si compró, sigue de pago).
        try {
            const lt = await db.ref(`users_v2/${uid}/licenseType`).once('value');
            if (lt.exists()) licenseType = lt.val();
        } catch {}
    } catch (e) {
        if (e.code !== 'auth/user-not-found') {
            console.error('[otp:verify] lookup error:', e.message);
            return resp(500, { error: 'Error consultando usuarios. Intenta de nuevo.' }, origin);
        }
        // ── El usuario NO existe → crear trial nuevo, con las MISMAS defensas
        // anti-abuso que create-trial-license (unicidad por alias + rate-limit IP).
        // El código ya se envió (send-otp filtró desechables), pero un correo REAL
        // no debe poder farmear trials con alias de Gmail ni desde una IP saturada.

        // (a) Unicidad por email normalizado (alias "user+x" / puntos de gmail).
        //     getUserByEmail ya descartó el email exacto; esto cubre los alias.
        try {
            const idx = await db.ref(`trial_email_normalized_index/${emailNormHash(email)}`).once('value');
            if (idx.exists())
                return resp(409, { error: 'Ya existe una cuenta para este correo (o una variante con + o puntos). Escríbenos a soporte@bimsaddin.com si necesitas ayuda.' }, origin);
        } catch (idxErr) {
            console.warn('[otp:verify] índice normalizado no verificable (no bloqueante):', idxErr.message);
        }

        // (b) Rate-limit por IP (2/IP/30d). Solo al CREAR (no al iniciar sesión).
        const rl = await checkIpRateLimit(db, event.headers);
        if (rl.limited)
            return resp(429, { error: 'Se alcanzó el máximo de pruebas desde esta red. Si necesitas más licencias para tu equipo, escríbenos a soporte@bimsaddin.com' }, origin);

        try {
            const newUser = await auth.createUser({
                email,
                password:      crypto.randomBytes(14).toString('base64url'), // random oculta; el usuario podrá fijarla luego
                emailVerified: true,   // el OTP demostró que controla el correo
                displayName:   name || email.split('@')[0],
            });
            uid = newUser.uid;
            isNewUser = true;
            const now = new Date();
            const expiresAt = new Date(now.getTime() + TRIAL_DAYS * 86400 * 1000);
            await db.ref(`users_v2/${uid}`).set({
                email,
                displayName:  name || email.split('@')[0],
                licenseType:  'Trial',
                isActive:     true,
                expirationDate: expiresAt.toISOString(),
                maxActivations: 1,
                createdAt:    now.toISOString(),
                createdVia:   'otp',
            });
            // Índice normalizado: impide farmear con alias en el futuro.
            await writeNormalizedIndex(db, email, uid);
        } catch (e2) {
            console.error('[otp:verify] createUser falló:', e2.code || e2.message);
            await rollbackRateLimit(rl.ipRef);   // no penalizar la IP si no se creó
            return resp(500, { error: 'No se pudo crear la cuenta. Intenta de nuevo.' }, origin);
        }
    }

    // ── Canal de empresa: marcar corporativo + avisar a soporte ──────────────
    if (isCorporateDomain(email)) {
        try {
            await db.ref(`users_v2/${uid}`).update({
                accountType: 'corporate',
                company:     email.split('@')[1],
            });
        } catch (e) { console.warn('[otp:verify] no se pudo marcar corporativo:', e.message); }
        // Avisar solo en cuentas nuevas (no en cada login) para no saturar soporte.
        if (isNewUser) await avisarCorporativo(email, isNewUser);
    }

    // ── Custom token → el plugin inicia sesión SIN contraseña ────────────────
    let customToken;
    try {
        customToken = await auth.createCustomToken(uid);
    } catch (e) {
        console.error('[otp:verify] createCustomToken falló:', e.message);
        return resp(500, { error: 'No se pudo iniciar sesión. Intenta de nuevo.' }, origin);
    }

    return resp(200, {
        ok: true,
        customToken,
        uid,
        email,
        licenseType,
        isNewUser,
        corporate: isCorporateDomain(email),
    }, origin);
};
