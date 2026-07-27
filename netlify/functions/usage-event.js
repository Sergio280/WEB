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
const crypto = require('crypto');

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

// Allowlist de orígenes (el plugin manda Origin: https://bimsaddin.com).
const ALLOWED_ORIGINS = ['https://bimsaddin.com', 'https://www.bimsaddin.com', 'https://bimsapp.netlify.app'];

function ok(body) { return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }; }

function s(v, max) {
    if (v == null || typeof v !== 'string') return '';
    return v.trim().slice(0, max).replace(/[\x00-\x1f\x7f]/g, '');
}

// ── Rate-limit en memoria por instancia (best-effort) ────────────────────────
// Este endpoint escribe en la RTDB con el Admin SDK, así que sin límite era una
// vía abierta para inflar la base (coste + cuota) y para envenenar los datos con
// los que se decide qué funciones capar en el trial. 120/min por IP es holgado:
// un usuario real dispara un evento por comando ejecutado en Revit.
const RL_WINDOW_MS = 60 * 1000;
const RL_MAX = 120;
const _hits = new Map();

function ipHash(headers) {
    const nf = headers['x-nf-client-connection-ip'];
    const xff = headers['x-forwarded-for'];
    const ip = nf ? String(nf).trim() : (xff ? String(xff).split(',')[0].trim() : 'unknown');
    return crypto.createHash('sha256').update(ip + (process.env.IP_SALT || 'bims-usage-salt')).digest('hex').slice(0, 24);
}

function rateLimited(headers) {
    const key = ipHash(headers);
    const now = Date.now();
    const arr = (_hits.get(key) || []).filter((t) => now - t < RL_WINDOW_MS);
    arr.push(now);
    _hits.set(key, arr);
    // Poda por antigüedad (no un clear() global, que resetearía a todos a la vez).
    if (_hits.size > 5000) {
        for (const [k, v] of _hits) {
            if (!v.length || now - v[v.length - 1] > RL_WINDOW_MS) _hits.delete(k);
        }
    }
    return arr.length > RL_MAX;
}

exports.handler = async function (event) {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'method' };

    // Origin OBLIGATORIO y en la allowlist. Antes era `if (origin && ...)`, así
    // que bastaba con omitir el header para saltarse el filtro por completo.
    const origin = event.headers.origin || event.headers.Origin || '';
    if (!ALLOWED_ORIGINS.includes(origin)) return ok({ ignored: 'origin' });

    if (rateLimited(event.headers)) return ok({ ignored: 'rate' });

    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return ok({ ignored: 'body' }); }

    const func = s(body.func, 60);
    if (!func) return ok({ ignored: 'no-func' }); // sin función no hay nada que medir
    const uid = s(body.uid, 48);
    const ver = s(body.ver, 16);

    // El uid debe corresponder a un usuario REAL. Sin esto cualquiera podía
    // atribuir eventos a uids inventados (o ajenos) y falsear los reportes.
    // Sólo se comprueba la EXISTENCIA del nodo, que es lo que ya se leía abajo
    // para resolver el tipo de licencia: no añade lecturas extra.
    if (!uid || !/^[A-Za-z0-9_-]{20,48}$/.test(uid)) return ok({ ignored: 'uid' });
    // Conteo de elementos: entero acotado, o null si no vino.
    let n = null;
    if (typeof body.n === 'number' && Number.isFinite(body.n)) {
        n = Math.max(0, Math.min(10000000, Math.trunc(body.n)));
    }

    // Resolver el tipo de licencia AL MOMENTO del uso (trial vs pago) — es el dato
    // que da valor al reporte. La misma lectura sirve para confirmar que el uid
    // existe: si no hay nodo, el evento se descarta en vez de guardarse huérfano.
    let lic = '';
    try {
        const snap = await db.ref(`users_v2/${uid}/licenseType`).once('value');
        if (!snap.exists()) return ok({ ignored: 'unknown-uid' });
        lic = s(snap.val(), 24);
    } catch {
        // Fallo de RTDB: no bloqueamos la telemetría legítima por esto.
    }

    try {
        await db.ref('usage_events').push({
            func,
            uid,
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
