// ── usage-event.js ───────────────────────────────────────────────────────────
// Telemetría de USO (privacy-safe) para calibrar políticas del trial con DATOS
// en vez de a ojo. El plugin llama /api/usage (fire-and-forget) cuando corre un
// comando licenciado, enviando SOLO: nombre del comando, uid, versión y —cuando
// aplique— un conteo de elementos. NO se envía ningún dato del modelo de Revit
// ni PII más allá del uid (que es del propio usuario).
//
// Objetivo (Fase 1 de instrumentación): saber QUÉ funciones se usan, con qué
// frecuencia y por trial vs pago, para luego decidir con datos cuáles capar y
// con qué N. Ver scripts/uso-report.mjs y scripts/reciclaje-report.mjs.
//
// Aditivo: no toca ningún flujo existente. Best-effort: si algo falla, responde
// 200 igual (el plugin no debe reintentar ni bloquearse por telemetría).
// ─────────────────────────────────────────────────────────────────────────────

const admin = require('firebase-admin');

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

// Allowlist blanda de orígenes (el plugin manda Origin: https://bimsaddin.com).
const ALLOWED_ORIGINS = ['https://bimsaddin.com', 'https://www.bimsaddin.com', 'https://bimsapp.netlify.app'];

function ok(body) { return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }; }

function s(v, max) {
    if (v == null || typeof v !== 'string') return '';
    return v.trim().slice(0, max).replace(/[\x00-\x1f\x7f]/g, '');
}

exports.handler = async function (event) {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'method' };

    // Filtro suave: si viene Origin y no está en la allowlist, ignorar (200 igual).
    const origin = event.headers.origin || event.headers.Origin || '';
    if (origin && !ALLOWED_ORIGINS.includes(origin)) return ok({ ignored: 'origin' });

    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return ok({ ignored: 'body' }); }

    const func = s(body.func, 60);
    if (!func) return ok({ ignored: 'no-func' }); // sin función no hay nada que medir
    const uid = s(body.uid, 48);
    const ver = s(body.ver, 16);
    // Conteo de elementos: entero acotado, o null si no vino.
    let n = null;
    if (typeof body.n === 'number' && Number.isFinite(body.n)) {
        n = Math.max(0, Math.min(10000000, Math.trunc(body.n)));
    }

    // Resolver el tipo de licencia AL MOMENTO del uso (trial vs pago) — es el dato
    // que da valor al reporte. Best-effort; si no se puede, se guarda sin lic.
    let lic = '';
    if (uid) {
        try {
            const snap = await db.ref(`users_v2/${uid}/licenseType`).once('value');
            lic = s(snap.val(), 24);
        } catch { /* no bloquear la telemetría por esto */ }
    }

    try {
        await db.ref('usage_events').push({
            func,
            uid: uid || null,
            n,                      // conteo de elementos o null
            lic: lic || null,      // 'Trial' | 'Monthly' | 'Annual' | null
            ver: ver || null,
            at: new Date().toISOString(),
        });
    } catch (e) {
        return ok({ stored: false });
    }
    return ok({ stored: true });
};
