// ── admin-delete-user.js ─────────────────────────────────────────────────────
// BORRADO COMPLETO de una cuenta, desde el panel de administración.
//
// ⚠️ POR QUÉ HACE FALTA ESTA FUNCIÓN
//   El panel es una web cliente: solo puede borrar `users_v2/{uid}`. Todo lo
//   demás sobrevive y hace que el correo siga "ya registrado":
//     1. el usuario de Firebase Auth  → solo el Admin SDK puede borrarlo;
//     2. `trial_email_normalized_index/{hash}` → alias-exists en el registro;
//     3. `trial_hardware_ledger` → el equipo sigue reclamado por ese uid;
//     4. `trials_by_ip_hash/{hash}` → la IP sigue gastada para el rate-limit;
//     5. `otp_codes/{clave}` → código pendiente.
//   Borrar solo la licencia dejaba la cuenta a medio existir. Esto la limpia
//   de raíz, para que el correo pueda volver a registrarse desde cero.
//
// Body: { uid, email, adminToken }
// Autorización: idToken del admin verificado + su correo en ADMIN_EMAILS
// (mismo esquema que admin-create-license.js).
// ─────────────────────────────────────────────────────────────────────────────

const crypto = require('crypto');
const admin  = require('firebase-admin');
const { emailNormHash } = require('./_lib/trial-abuse');

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

const CORS = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
};

// Clave con la que send-otp guarda los códigos (sha256 del correo en minúsculas).
function otpKey(email) {
    return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex').slice(0, 24);
}

// Quita el uid de todos los equipos del ledger. Si el equipo se queda sin
// cuentas, se elimina entero: así vuelve a estar libre para una prueba nueva.
async function limpiarLedger(uid) {
    const tocados = [];
    try {
        const snap = await db.ref('trial_hardware_ledger').once('value');
        const todo = snap.val() || {};
        for (const hw of Object.keys(todo)) {
            const nodo = todo[hw] || {};
            const uids = nodo.uids || {};
            if (!uids[uid] && nodo.firstUid !== uid) continue;

            delete uids[uid];
            const quedan = Object.keys(uids);
            if (quedan.length === 0) {
                await db.ref(`trial_hardware_ledger/${hw}`).remove();
            } else {
                await db.ref(`trial_hardware_ledger/${hw}`).update({
                    uids,
                    count:    quedan.length,
                    firstUid: nodo.firstUid === uid ? quedan[0] : nodo.firstUid,
                });
            }
            tocados.push(nodo.machineName || hw.slice(0, 12));
        }
    } catch (e) {
        console.warn('[admin-delete] ledger no limpiado:', e.message);
    }
    return tocados;
}

// Devuelve un trial al contador de la IP, para que borrar una cuenta de prueba
// no deje esa IP gastada.
async function devolverCupoIp(ipHash) {
    if (!ipHash) return false;
    try {
        await db.ref(`trials_by_ip_hash/${ipHash}`).transaction(cur => {
            if (!cur) return cur;
            return { ...cur, count: Math.max(0, (cur.count || 1) - 1) };
        });
        return true;
    } catch (e) {
        console.warn('[admin-delete] cupo de IP no devuelto:', e.message);
        return false;
    }
}

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
    if (event.httpMethod !== 'POST')    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Método no permitido' }) };

    let body;
    try { body = JSON.parse(event.body || '{}'); }
    catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'JSON inválido' }) }; }

    const { uid, email, adminToken } = body;
    if (!adminToken) return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'No autorizado' }) };
    if (!uid && !email) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Falta uid o email' }) };

    // ── Autorización: token de admin verificado + correo en la allowlist ──────
    try {
        const decoded = await auth.verifyIdToken(adminToken);
        if (!process.env.ADMIN_EMAILS)
            return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'ADMIN_EMAILS no configurado' }) };
        const adminEmails = process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase());
        if (!decoded.email || !adminEmails.includes(decoded.email.toLowerCase()))
            return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'No autorizado' }) };
    } catch (e) {
        return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'Token de administrador inválido' }) };
    }

    const pasos = [];
    let uidFinal   = uid || null;
    let emailFinal = email || null;
    let ipHash     = null;

    try {
        // ── Leer la ficha ANTES de borrarla: de ahí salen el correo y el ipHash ──
        if (uidFinal) {
            try {
                const snap = await db.ref(`users_v2/${uidFinal}`).once('value');
                const u = snap.val();
                if (u) {
                    emailFinal = emailFinal || u.email || u.Email || null;
                    ipHash     = u.trialMeta && u.trialMeta.ipHash ? u.trialMeta.ipHash : null;
                }
            } catch { /* no crítico */ }
        }

        // Si solo llegó el correo, resolver el uid por Auth.
        if (!uidFinal && emailFinal) {
            try {
                const rec = await auth.getUserByEmail(emailFinal);
                uidFinal = rec.uid;
            } catch { /* puede no existir en Auth */ }
        }

        // ── 1. Ficha de licencia ─────────────────────────────────────────────
        if (uidFinal) {
            await db.ref(`users_v2/${uidFinal}`).remove();
            pasos.push('licencia');
        }

        // ── 2. Usuario de Firebase Auth (lo que el panel NO podía borrar) ────
        if (uidFinal) {
            try {
                await auth.deleteUser(uidFinal);
                pasos.push('cuenta de acceso');
            } catch (e) {
                if (e.code !== 'auth/user-not-found')
                    console.warn('[admin-delete] Auth:', e.message);
            }
        }

        // ── 3. Índice de correos normalizados (el que da "ya registrado") ────
        if (emailFinal) {
            try {
                await db.ref(`trial_email_normalized_index/${emailNormHash(emailFinal)}`).remove();
                pasos.push('índice de correo');
            } catch (e) { console.warn('[admin-delete] índice:', e.message); }

            try { await db.ref(`otp_codes/${otpKey(emailFinal)}`).remove(); } catch { /* no crítico */ }
        }

        // ── 4. Ledger de hardware ────────────────────────────────────────────
        if (uidFinal) {
            const equipos = await limpiarLedger(uidFinal);
            if (equipos.length) pasos.push(`equipos liberados (${equipos.join(', ')})`);
        }

        // ── 5. Cupo de la IP ─────────────────────────────────────────────────
        if (await devolverCupoIp(ipHash)) pasos.push('cupo de IP');

        return {
            statusCode: 200,
            headers: CORS,
            body: JSON.stringify({
                success: true,
                uid: uidFinal,
                email: emailFinal,
                pasos,
                message: `Cuenta eliminada por completo: ${pasos.join(' · ')}.`,
            }),
        };
    } catch (e) {
        console.error('[admin-delete] error:', e);
        return {
            statusCode: 500,
            headers: CORS,
            body: JSON.stringify({ error: 'Error al eliminar: ' + e.message, pasos }),
        };
    }
};
