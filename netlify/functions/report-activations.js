// ── report-activations.js ────────────────────────────────────────────────────
// Función PROGRAMADA (scheduled) que reporta a Google Ads las ACTIVACIONES
// reales del plugin como conversiones offline.
//
// Por qué así (y no un trigger):
//   La activación la escribe el plugin DIRECTAMENTE en RTDB
//   (users_v2/{uid}/activations/{hardwareId}); no pasa por ningún endpoint del
//   servidor. Y este backend NO usa Firebase Functions. Por eso reconciliamos:
//   esta función corre cada hora, busca activaciones aún no reportadas y las
//   sube. Las conversiones offline de Google admiten retraso (hasta 90 días),
//   así que el desfase de hasta 1h es irrelevante.
//
// Idempotencia:
//   Cada activación reportada se marca con adsConversionSent=true (+ ...At). En
//   la siguiente corrida ya no se vuelve a enviar. La marca se escribe SOLO si la
//   subida fue aceptada por la API, para no perder conversiones por un fallo.
//
// Programación: ver netlify.toml → [functions."report-activations"] schedule.
// ─────────────────────────────────────────────────────────────────────────────

const admin = require('firebase-admin');
const { uploadActivationConversions } = require('./_lib/google-ads');

// ── Init Firebase Admin (singleton, idéntico a las otras functions) ──────────
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

// No reportamos activaciones más viejas que esto (límite duro de la API de
// Google para conversiones offline). Evita intentar subir histórico inválido.
const MAX_AGE_DAYS = 90;

exports.handler = async function () {
    let snapshot;
    try {
        snapshot = await db.ref('users_v2').once('value');
    } catch (e) {
        console.error('[report-activations] error leyendo users_v2:', e.message);
        return { statusCode: 500, body: 'db read error' };
    }

    const cutoff = Date.now() - MAX_AGE_DAYS * 86400 * 1000;

    // Recolectar activaciones pendientes (sin adsConversionSent).
    // pending: [{ uid, hardwareId, email, gclid, activatedAt }]
    const pending = [];
    snapshot.forEach((child) => {
        const uid = child.key;
        const lic = child.val() || {};
        const activations = lic.activations || {};
        const email = lic.email || lic.Email || null;
        const gclid = (lic.trialMeta && lic.trialMeta.gclid) || lic.gclid || null;

        for (const [hardwareId, act] of Object.entries(activations)) {
            if (!act || typeof act !== 'object') continue;
            if (act.adsConversionSent) continue;               // ya reportada
            const activatedAt = act.activatedAt || act.lastSeen;
            if (!activatedAt) continue;
            if (new Date(activatedAt).getTime() < cutoff) continue; // demasiado vieja
            pending.push({ uid, hardwareId, email, gclid, activatedAt });
        }
    });

    if (pending.length === 0) {
        console.log('[report-activations] sin activaciones pendientes');
        return { statusCode: 200, body: 'nothing to report' };
    }

    console.log(`[report-activations] activaciones pendientes: ${pending.length}`);

    // Subir en un solo batch (la API acepta múltiples conversiones por request).
    let result;
    try {
        result = await uploadActivationConversions(
            pending.map((p) => ({ gclid: p.gclid, email: p.email, activatedAt: p.activatedAt }))
        );
    } catch (e) {
        // Fallo global (auth/red/config): no marcamos nada → se reintenta la
        // próxima corrida. Mejor reintentar que perder la conversión.
        console.error('[report-activations] subida falló (se reintentará):', e.message);
        return { statusCode: 502, body: 'upload failed: ' + e.message };
    }

    if (result.partialFailureError) {
        // Algunas conversiones individuales pudieron ser rechazadas. Lo dejamos en
        // logs; aun así marcamos las enviadas (el rechazo suele ser por gclid
        // expirado / sin match, no algo que se arregle reintentando).
        console.warn('[report-activations] partialFailure:',
            JSON.stringify(result.partialFailureError).slice(0, 800));
    }

    // Marcar como reportadas las que entraron en la subida (las saltadas por
    // fecha inválida / sin identificador no se marcan; quedarán fuera por sí solas).
    const sentAt = new Date().toISOString();
    const updates = {};
    for (const p of pending) {
        if (!p.email && !p.gclid) continue; // fue saltada en el lib
        updates[`users_v2/${p.uid}/activations/${p.hardwareId}/adsConversionSent`]   = true;
        updates[`users_v2/${p.uid}/activations/${p.hardwareId}/adsConversionSentAt`] = sentAt;
    }
    try {
        if (Object.keys(updates).length) await db.ref().update(updates);
    } catch (e) {
        console.error('[report-activations] no se pudo marcar como enviadas:', e.message);
        // Riesgo de doble envío la próxima vez; aceptable frente a perder el dato.
    }

    console.log(`[report-activations] reportadas=${result.uploaded} saltadas=${result.skipped}`);
    return { statusCode: 200, body: `reported ${result.uploaded}` };
};
