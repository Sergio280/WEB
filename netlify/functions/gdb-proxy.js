// ── gdb-proxy.js ─────────────────────────────────────────────────────────────
// Proxy de la Realtime Database para redes que bloquean Google.
// Rutea /api/gdb/{path}?{query} → https://bims-8d507-default-rtdb.firebaseio.com/{path}?{query}
//
// SEGURIDAD: se reenvía el ?auth={idToken} del cliente tal cual → las reglas de
// Firebase siguen decidiendo qué uid puede leer/escribir. NO se usa Admin SDK.
// Además, allowlist ESTRICTA de paths: solo lo que el plugin toca (la licencia
// del propio usuario, sus activaciones, y el feed público de updates). Así este
// endpoint no se puede usar como gateway abierto a toda la base.
// ─────────────────────────────────────────────────────────────────────────────
const { forward, gate, subAfter } = require('./_lib/proxy-core');

const RTDB = 'https://bims-8d507-default-rtdb.firebaseio.com';

// users_v2/{uid}.json
// users_v2/{uid}/activations/{hwId}.json
// users_v2/{uid}/activations/{hwId}/lastSeen.json
// updates/latest.json
const ALLOWED_PATH = /^(users_v2\/[A-Za-z0-9_-]+(\/activations\/[A-Za-z0-9]+(\/lastSeen)?)?\.json|updates\/latest\.json)$/;

exports.handler = async function (event) {
    const blocked = gate(event, ['GET', 'PUT', 'PATCH', 'DELETE']);
    if (blocked) return blocked;

    let u;
    try { u = new URL(event.rawUrl); } catch { return { statusCode: 400, body: 'bad url' }; }

    const sub = subAfter(u.pathname, ['/api/gdb/', '/gdb-proxy/']); // p.ej. users_v2/UID.json
    if (sub == null) return { statusCode: 400, body: 'bad path' };
    if (!ALLOWED_PATH.test(sub)) return { statusCode: 403, body: 'path not allowed' };

    // Reenvía path + query (incluye ?auth={idToken}). Firebase aplica sus reglas.
    const target = `${RTDB}/${sub}${u.search}`;
    return forward(target, event);
};
