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

// Tope para los proxies de ANALÍTICA. Una visita dispara entre cinco y treinta
// beacons, así que 300/min/IP da margen para unos quince visitantes simultáneos
// saliendo por la misma IP pública — una constructora entera navegando a la vez.
// Sigue habiendo tope: esto son invocaciones de Lambda y se pagan.
const RL_ANALITICA = 300;
const _hits = new Map();

// `max` es configurable porque los dos usos de este módulo tienen escalas muy
// distintas. Un login del plugin es una petición aislada; una sola visita a la
// web dispara entre cinco y treinta beacons de analítica, y una constructora
// entera sale por una única IP pública (NAT). Con el tope pensado para el login,
// esa oficina perdía medición. Ver RL_ANALITICA.
//
// OJO: el cupo NO se comparte entre funciones. Cada function de Netlify es su
// propio Lambda y carga su propia copia de este módulo, así que `_hits` es
// independiente por proxy: la analítica no puede agotar el cupo del login.
function rateLimited(headers, max = RL_MAX) {
    const key = ipHash(clientIp(headers));
    const now = Date.now();
    const arr = (_hits.get(key) || []).filter((t) => now - t < RL_WINDOW_MS);
    arr.push(now);
    _hits.set(key, arr);
    // Limpieza oportunista para no crecer sin límite.
    if (_hits.size > 5000) _hits.clear();
    return arr.length > max;
}

// Reenvía la petición al destino ya validado. Preserva método, body y el
// Content-Type. Devuelve la respuesta de Google/Firebase VERBATIM (status +
// cuerpo), para que el plugin la procese igual que si viniera directa.
// `opts.reenviarCliente` añade las cabeceras que identifican al VISITANTE:
// su navegador, su IP y su idioma. Por defecto NO se reenvían, que es como
// funcionaban los proxies del plugin desde el principio y no se toca.
//
// Lo necesita la analítica, y no es un detalle: sin ellas, a Google le llegaba
// cada beacon con `user-agent: node` desde una IP de datacenter de Netlify en
// EE.UU. Eso rompe la geolocalización de TODO el tráfico —de ahí que existiera
// ya la propiedad `real_country` como parche— y es además la firma exacta de un
// bot, con el agravante de que el filtrado de bots de GA4 no se puede
// desactivar. El propio producto de Google para esto (server-side Tagging)
// reenvía obligatoriamente estas mismas cabeceras: es el contrato de un proxy
// de primera parte, y aquí no se estaba cumpliendo.
//
// La IP sale de `clientIp()`, que prefiere `x-nf-client-connection-ip` —la que
// pone el edge de Netlify y el cliente no puede falsear—, nunca del
// `x-forwarded-for` que mande el navegador.
//
// NO se reenvían cookies a propósito: gtag ya manda el client id dentro del
// payload (`cid`), así que pasarlas no aportaría nada y sería dar más de lo
// necesario.
async function forward(targetUrl, event, opts = {}) {
    const method = event.httpMethod;
    let body;
    if (method !== 'GET' && method !== 'HEAD' && event.body != null) {
        body = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body;
    }
    const contentType = event.headers['content-type'] || event.headers['Content-Type'] || 'application/json';

    let headers;
    if (body != null) headers = { 'Content-Type': contentType };
    if (opts.reenviarCliente) {
        const h = event.headers || {};
        const delCliente = {
            'User-Agent': h['user-agent'] || h['User-Agent'] || '',
            'X-Forwarded-For': clientIp(h),
            'Accept-Language': h['accept-language'] || h['Accept-Language'] || '',
            Referer: h.referer || h.Referer || '',
        };
        // Una cabecera vacía es peor que ninguna: se omiten las que no vengan.
        for (const [k, v] of Object.entries(delCliente)) {
            if (v && v !== 'unknown') headers = { ...(headers || {}), [k]: v };
        }
    }

    let upstream;
    try {
        upstream = await fetch(targetUrl, {
            method,
            headers,
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
// `opts.maxPorMinuto` sube el tope solo para quien lo pida; sin él se mantiene
// el de siempre (60), que es el que usan los proxies del plugin.
function gate(event, allowedMethods, opts = {}) {
    if (!allowedMethods.includes(event.httpMethod)) {
        return { statusCode: 405, body: 'method not allowed' };
    }
    if (!originAllowed(event)) {
        return { statusCode: 403, body: 'origin not allowed' };
    }
    if (rateLimited(event.headers, opts.maxPorMinuto)) {
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

module.exports = { forward, gate, subAfter, RL_ANALITICA };
