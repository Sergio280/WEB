// ── gauth-proxy.js ───────────────────────────────────────────────────────────
// Proxy de Firebase Authentication para redes que bloquean Google.
// Rutea /api/gauth/{service}/{restoDelPath}?{query} → https://{service}.googleapis.com/...
// Solo se permiten los servicios que el login/registro del plugin realmente usa.
// Ver netlify/functions/_lib/proxy-core.js para el diseño y la seguridad.
// ─────────────────────────────────────────────────────────────────────────────
const { forward, gate, subAfter } = require('./_lib/proxy-core');

// identitytoolkit: signIn / signUp / update / sendOobCode ; securetoken: refresh.
const ALLOWED_SERVICES = new Set(['identitytoolkit', 'securetoken']);

exports.handler = async function (event) {
    const blocked = gate(event, ['POST']);
    if (blocked) return blocked;

    let u;
    try { u = new URL(event.rawUrl); } catch { return { statusCode: 400, body: 'bad url' }; }

    const sub = subAfter(u.pathname, ['/api/gauth/', '/gauth-proxy/']); // p.ej. identitytoolkit/v1/accounts:signInWithPassword
    if (sub == null) return { statusCode: 400, body: 'bad path' };
    const slash = sub.indexOf('/');
    if (slash < 0) return { statusCode: 400, body: 'bad path' };

    const service = sub.slice(0, slash);
    const rest = sub.slice(slash + 1);
    if (!ALLOWED_SERVICES.has(service)) return { statusCode: 403, body: 'service not allowed' };

    // Reconstruye la URL de Google preservando el path (con ':' de los métodos)
    // y el query (?key=API_KEY). El API key de Firebase es público por diseño.
    const target = `https://${service}.googleapis.com/${rest}${u.search}`;
    return forward(target, event);
};
