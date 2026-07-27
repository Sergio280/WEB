// ── ga-collect-proxy.js ──────────────────────────────────────────────────────
// Reenvía los "beacons" de medición de gtag.js (page_view, eventos custom del
// embudo) a google-analytics.com, entrando por bimsaddin.com.
//
// Se activa configurando `transport_url` en gtag('config', ...) — parámetro
// oficial de gtag.js pensado exactamente para este caso (servir la medición
// desde un dominio propio). gtag.js manda entonces sus beacons a
// bimsaddin.com/g/... en vez de a google-analytics.com directo, con lo que
// los bloqueadores que filtran por dominio dejan de interceptarlos.
//
// GET (beacon de imagen / sendBeacon con querystring) y POST (fetch keepalive
// con body) ambos posibles según el navegador; se reenvían ambos tal cual.
// Ver _lib/proxy-core.js para el diseño compartido.
// ─────────────────────────────────────────────────────────────────────────────
const { forward, gate, subAfter, RL_ANALYTICS } = require('./_lib/proxy-core');

exports.handler = async function (event) {
    // Tope alto a propósito: con el límite por defecto (60/min/IP), una oficina
    // detrás de NAT superaba la cuota con 10-15 personas navegando y GA4 perdía
    // hits en silencio. Aquí sólo queremos un freno anti-inundación.
    const blocked = gate(event, ['GET', 'POST'], RL_ANALYTICS);
    if (blocked) return blocked;

    let u;
    try { u = new URL(event.rawUrl); } catch { return { statusCode: 400, body: 'bad url' }; }

    // Acepta cualquier sub-path bajo /g/ (collect, g/collect, etc.) — gtag.js
    // decide el path exacto internamente; no lo restringimos por nombre, solo
    // reenviamos preservando estructura, tal como hace gauth-proxy con Firebase.
    const sub = subAfter(u.pathname, ['/g/', '/ga-collect-proxy/']);
    if (sub == null) return { statusCode: 400, body: 'bad path' };

    const target = `https://www.google-analytics.com/g/${sub}${u.search}`;
    return forward(target, event);
};
