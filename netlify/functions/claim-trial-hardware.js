// ── claim-trial-hardware.js ──────────────────────────────────────────────────
// Reclama una MÁQUINA para un trial, en el momento de la ACTIVACIÓN.
//
// El plugin llama aquí justo antes de activar hardware. El servidor decide:
//   - Licencia de PAGO           → siempre permitido, ni se registra.
//   - Modo 'off'                 → siempre permitido, ni se registra.
//   - Modo 'log'   (INICIAL)     → registra, avisa a soporte@ si detecta
//                                  reciclaje, pero SIEMPRE permite.
//   - Modo 'enforce'             → deniega si otro uid ya estrenó esa máquina.
//
// El modo se cambia desde el AdminPanel (config/trial_caps/hardwareLedger) sin
// recompilar el plugin: si algo sale mal, se apaga en un clic.
//
// ⚠️ FAIL-OPEN: cualquier error (token, RTDB, red) devuelve allowed:true. Es
// preferible colar un trial reciclado a dejar sin trabajar a alguien legítimo.
// ─────────────────────────────────────────────────────────────────────────────

const admin = require('firebase-admin');
const { sendEmail } = require('./_lib/mailer');
const { hashHardware, readMode, claimHardware, lookupEmail } = require('./_lib/hardware-ledger');

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

// ── Allowlist de orígenes (idéntica a verify-otp / send-otp / create-trial) ──
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

// Respuesta permisiva estándar. `reason` es solo para diagnóstico del plugin.
function permitir(origin, reason, extra = {}) {
    return resp(200, { allowed: true, reason, ...extra }, origin);
}

// Aviso a soporte cuando se detecta una máquina que estrena su segundo trial.
async function avisarReciclaje({ emailNuevo, emailPrimero, machineName, count, firstAt, modo }) {
    const desde = firstAt ? new Date(firstAt).toISOString().slice(0, 10) : '—';
    await sendEmail({
        to:      'soporte@bimsaddin.com',
        subject: `🔁 Trial reciclado en la misma máquina (${modo})`,
        html:    `<!DOCTYPE html><html><body style="font-family:Segoe UI,system-ui,sans-serif;color:#1f2937;line-height:1.6;">
<p>Una máquina que ya había estrenado un trial acaba de activar <strong>otro</strong>.</p>
<ul>
  <li>Cuenta nueva: <strong>${emailNuevo || '(desconocida)'}</strong></li>
  <li>Primera cuenta en esa máquina: <strong>${emailPrimero || '(desconocida)'}</strong> (desde ${desde})</li>
  <li>Equipo: <strong>${machineName || '(sin nombre)'}</strong></li>
  <li>Trials distintos en esta máquina: <strong>${count}</strong></li>
  <li>Modo del ledger: <strong>${modo}</strong>${modo === 'log' ? ' — <em>solo registrado, NO se ha bloqueado</em>' : ' — <em>bloqueado</em>'}</li>
</ul>
<p>Ojo antes de concluir que es abuso: un PC compartido de oficina o de laboratorio
universitario produce exactamente esta señal, igual que alguien que cambia su correo
personal por el corporativo.</p>
</body></html>`,
    }).catch(e => console.warn('[hw-ledger] aviso de reciclaje falló:', e.message));
}

exports.handler = async (event) => {
    const origin  = event.headers.origin  || event.headers.Origin  || '';
    const referer = event.headers.referer || event.headers.Referer || '';

    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeadersFor(origin), body: '' };
    if (event.httpMethod !== 'POST')    return resp(405, { error: 'Método no permitido' }, origin);

    const refOk = ALLOWED_ORIGIN_PATTERNS.some(p => typeof p==='string' ? referer.startsWith(p) : p.test(referer));
    if (!isOriginAllowed(origin) && !refOk) return resp(403, { error: 'Origen no permitido' }, origin);

    let body;
    try { body = JSON.parse(event.body || '{}'); }
    catch { return permitir(origin, 'body-invalido'); }

    const { hardwareId, idToken, machineName } = body;
    if (!hardwareId || !idToken) return permitir(origin, 'faltan-datos');

    try {
        // 1) Autenticar al llamador. El uid sale del token verificado por el
        //    Admin SDK, NUNCA del body: así el cliente no puede suplantar a otro.
        let decoded;
        try {
            decoded = await auth.verifyIdToken(idToken);
        } catch (e) {
            console.warn('[hw-ledger] idToken inválido (fail-open):', e.message);
            return permitir(origin, 'token-invalido');
        }
        const uid = decoded.uid;

        // 2) El ledger es SOLO para trials. Una licencia de pago no se toca
        //    jamás: quien pagó puede instalar donde quiera dentro de su cupo.
        const tipoSnap = await db.ref(`users_v2/${uid}/licenseType`).once('value');
        const tipo = String(tipoSnap.val() || '').toLowerCase();
        if (tipo && tipo !== 'trial') return permitir(origin, 'licencia-de-pago');

        // 3) Modo activo (editable en caliente desde el AdminPanel).
        const modo = await readMode(db);
        if (modo === 'off') return permitir(origin, 'ledger-apagado');

        // 4) Reclamar la máquina.
        const hwHash = hashHardware(hardwareId);
        const r = await claimHardware(db, hwHash, uid, { machineName });
        if (r.error) return permitir(origin, 'ledger-no-disponible');

        if (!r.reused) return permitir(origin, r.known ? 'misma-cuenta' : 'maquina-nueva');

        // 5) Reciclaje detectado: avisar siempre, bloquear solo en 'enforce'.
        const emailNuevo   = decoded.email || await lookupEmail(db, uid);
        const emailPrimero = await lookupEmail(db, r.firstUid);
        await avisarReciclaje({
            emailNuevo, emailPrimero, machineName,
            count: r.count, firstAt: r.firstAt, modo,
        });

        if (modo === 'enforce') {
            return resp(200, {
                allowed: false,
                reason:  'hardware-reciclado',
                message: 'Este equipo ya disfrutó de una prueba gratuita de BIMS. '
                       + 'Para seguir usándolo, activa una licencia.',
            }, origin);
        }

        // Modo 'log': queda registrado y avisado, pero el usuario NO se entera.
        return permitir(origin, 'reciclaje-registrado', { logged: true });

    } catch (e) {
        console.error('[hw-ledger] error inesperado (fail-open):', e);
        return permitir(origin, 'error-interno');
    }
};
