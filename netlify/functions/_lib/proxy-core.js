// ── _lib/proxy-core.js ───────────────────────────────────────────────────────
// Núcleo compartido de los proxies de Firebase (gauth-proxy, gdb-proxy).
//
// POR QUÉ EXISTEN ESTOS PROXIES: el plugin de Revit habla directo con Google
// (identitytoolkit / securetoken / *.firebaseio.com) para login y licencia. Las
// redes corporativas (constructoras: Terrazul, Eiffage, Cumbra, TPF…) bloquean
// Google en bloque → el login falla con "Error al enviar la solicitud". El
// plugin 1.1.5 intenta Google directo y, si la red lo bloquea, reintenta contra
// bimsaddin.com/api/gauth|gdb, que reenvía la petición a Google desde los
// servidores de Netlify (fuera del firewall). Así el firewall solo ve un `.com`
// desconocido, que casi nunca bloquea.
//
// SEGURIDAD (claves):
//   - Se REENVÍA la credencial del cliente tal cual (?key=API_KEY para auth,
//     ?auth=idToken para RTDB). NUNCA se usa el Admin SDK: así las reglas de
//     Firebase siguen aplicando y esto no es un gateway abierto a la base.
//   - Allowlist estricta de host (auth) y de path (RTDB): nada fuera de lo
//     que el plugin realmente necesita.
//   - Origin/Referer del propio sitio (filtro suave; el plugin lo envía).
//   - Rate-limit por hash de IP (evita abusar del proxy como brute-force de
//     login saliendo desde nuestra IP de Netlify).
//   - NUNCA se loggea el body: pasan contraseñas (signIn) y tokens (idToken).
// ─────────────────────────────────────────────────────────────────────────────

const crypto = require('crypto');

// Orígenes permitidos: el plugin envía Origin/Referer = https://bimsaddin.com.
// Se aceptan también los dominios históricos por si un build viejo los manda.
const ALLOWED_ORIGINS = [
    'https://bimsaddin.com',
    'https://www.bimsaddin.com',
    'https://bimsapp.netlify.app',
];

function originAllowed(event) {
    const o = event.headers.origin || event.headers.Origin || '';
    const r = event.headers.referer || event.headers.Referer || '';
    if (!o && !r) return true; // el plugin puede no mandar Origin en algunos casos; el filtro fuerte es host/path allowlist + rate-limit
    if (ALLOWED_ORIGINS.includes(o)) return true;
    return ALLOWED_ORIGINS.some((a) => r.startsWith(a));
}

function clientIp(headers) {
    const nf = headers['x-nf-client-connection-ip'];
    if (nf) return String(nf).trim();
    const xff = headers['x-forwarded-for'];
    return xff ? String(xff).split(',')[0].trim() : 'unknown';
}

function ipHash(ip) {
    const salt = process.env.IP_SALT || 'bims-proxy-salt';
    return crypto.createHash('sha256').update(ip + salt).digest('hex').slice(0, 24);
}

// Rate-limit en memoria por instancia de función (best-effort). No es perfecto
// entre instancias, pero corta ráfagas de abuso sin depender de Firebase (que es
// justo lo que este proxy protege). Ventana deslizante simple.
const RL_WINDOW_MS = 60 * 1000;
const RL_MAX = 60; // 60 req/min/IP por instancia — holgado para uso legítimo
const _hits = new Map();

function rateLimited(headers) {
    const key = ipHash(clientIp(headers));
    const now = Date.now();
    const arr = (_hits.get(key) || []).filter((t) => now - t < RL_WINDOW_MS);
    arr.push(now);
    _hits.set(key, arr);
    // Limpieza oportunista para no crecer sin límite.
    if (_hits.size > 5000) _hits.clear();
    return arr.length > RL_MAX;
}

// Reenvía la petición al destino ya validado. Preserva método, body y el
// Content-Type. Devuelve la respuesta de Google/Firebase VERBATIM (status +
// cuerpo), para que el plugin la procese igual que si viniera directa.
async function forward(targetUrl, event) {
    const method = event.httpMethod;
    let body;
    if (method !== 'GET' && method !== 'HEAD' && event.body != null) {
        body = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body;
    }
    const contentType = event.headers['content-type'] || event.headers['Content-Type'] || 'application/json';

    let upstream;
    try {
        upstream = await fetch(targetUrl, {
            method,
            headers: body != null ? { 'Content-Type': contentType } : undefined,
            body,
        });
    } catch (e) {
        // Falla la salida a Google DESDE Netlify (raro). No exponer detalles.
        return { statusCode: 502, headers: { 'Content-Type': 'application/json' }, body: '{"error":"upstream_unreachable"}' };
    }

    const text = await upstream.text();
    return {
        statusCode: upstream.status,
        headers: {
            'Content-Type': upstream.headers.get('content-type') || 'application/json',
            'Cache-Control': 'no-store',
        },
        body: text,
    };
}

// Barrera común: método permitido, origen, rate-limit. Devuelve una respuesta de
// error si algo falla, o null si puede continuar.
function gate(event, allowedMethods) {
    if (!allowedMethods.includes(event.httpMethod)) {
        return { statusCode: 405, body: 'method not allowed' };
    }
    if (!originAllowed(event)) {
        return { statusCode: 403, body: 'origin not allowed' };
    }
    if (rateLimited(event.headers)) {
        return { statusCode: 429, body: 'rate limited' };
    }
    return null;
}

// Extrae el sub-path después del primer marcador que aparezca. Robusto a que
// Netlify entregue el path ORIGINAL (/api/gxxx/…) o el REESCRITO (/xxx-proxy/…)
// según la versión del runtime. Devuelve null si ningún marcador está presente.
function subAfter(pathname, markers) {
    for (const m of markers) {
        const i = pathname.indexOf(m);
        if (i >= 0) return pathname.slice(i + m.length);
    }
    return null;
}

module.exports = { forward, gate, subAfter };
