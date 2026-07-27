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
//
// El límite se pasa por parámetro porque los dos usos son muy distintos:
//   · gauth/gdb  → 60/min: protege contra fuerza bruta de login. Ajustado a
//     propósito.
//   · beacons GA → un límite bajo aquí DESCARTA ANALÍTICA en silencio. Una
//     oficina detrás de NAT comparte una IP pública: con 10-15 personas
//     navegando se superaban los 60/min y GA4 perdía hits — justo el tráfico
//     corporativo que motivó estos proxies. Ver RL_ANALYTICS.
const RL_WINDOW_MS = 60 * 1000;
const RL_DEFAULT = 60;        // gauth / gdb — sensible, es superficie de login
const RL_ANALYTICS = 3000;    // beacons GA — sólo como tope anti-inundación
const _hits = new Map();

function rateLimited(headers, max = RL_DEFAULT) {
    const key = ipHash(clientIp(headers));
    const now = Date.now();
    const arr = (_hits.get(key) || []).filter((t) => now - t < RL_WINDOW_MS);
    arr.push(now);
    _hits.set(key, arr);
    // Poda por antigüedad. Antes era _hits.clear(), que reseteaba la ventana de
    // TODOS los clientes de golpe y hacía el límite errático.
    if (_hits.size > 5000) {
        for (const [k, v] of _hits) {
            if (!v.length || now - v[v.length - 1] > RL_WINDOW_MS) _hits.delete(k);
        }
    }
    return arr.length > max;
}

// Reenvía la petición al destino ya validado. Preserva método, body, el
// Content-Type y —importante— la identidad del CLIENTE (User-Agent, idioma, IP).
// Devuelve la respuesta de Google/Firebase VERBATIM (status + cuerpo), para que
// el plugin la procese igual que si viniera directa.
//
// POR QUÉ SE REENVÍA EL User-Agent Y LA IP: antes sólo se mandaba Content-Type,
// así que los beacons de GA4 llegaban a Google con el User-Agent de Node y la IP
// del datacenter de Netlify. Resultado: dispositivo, navegador, SO y geo quedaban
// inservibles en TODOS los informes de GA4 desde que se activó el proxy. La geo
// ya se había parcheado a mano mandando `real_country` como user property; esto
// arregla el resto en origen. Para gauth/gdb no cambia nada funcional (Google
// ignora estos headers en las APIs REST) pero mantiene el proxy transparente.
async function forward(targetUrl, event) {
    const method = event.httpMethod;
    let body;
    if (method !== 'GET' && method !== 'HEAD' && event.body != null) {
        body = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body;
    }
    const h = event.headers || {};
    const contentType = h['content-type'] || h['Content-Type'] || 'application/json';

    const outHeaders = {};
    if (body != null) outHeaders['Content-Type'] = contentType;

    const ua = h['user-agent'] || h['User-Agent'];
    if (ua) outHeaders['User-Agent'] = ua;

    const al = h['accept-language'] || h['Accept-Language'];
    if (al) outHeaders['Accept-Language'] = al;

    // IP real del visitante para que la geolocalización de Google funcione.
    // x-nf-client-connection-ip la pone el edge de Netlify y no es falsificable.
    const ip = clientIp(h);
    if (ip && ip !== 'unknown') outHeaders['X-Forwarded-For'] = ip;

    let upstream;
    try {
        upstream = await fetch(targetUrl, {
            method,
            headers: Object.keys(outHeaders).length ? outHeaders : undefined,
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
// error si algo falla, o null si puede continuar. `maxPerMin` permite a los
// proxies de analítica pedir un tope mucho más alto (ver RL_ANALYTICS).
function gate(event, allowedMethods, maxPerMin = RL_DEFAULT) {
    if (!allowedMethods.includes(event.httpMethod)) {
        return { statusCode: 405, body: 'method not allowed' };
    }
    if (!originAllowed(event)) {
        return { statusCode: 403, body: 'origin not allowed' };
    }
    if (rateLimited(event.headers, maxPerMin)) {
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

module.exports = { forward, gate, subAfter, RL_ANALYTICS };
