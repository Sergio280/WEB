// ── ga-script-proxy.js ───────────────────────────────────────────────────────
// Sirve el script de gtag.js DESDE bimsaddin.com en vez de googletagmanager.com.
//
// POR QUÉ: la mayoría de bloqueadores de anuncios (uBlock, AdGuard, Brave por
// defecto, Safari ITP) bloquean el DOMINIO googletagmanager.com — el script de
// GA4 nunca llega a cargar, así que GA4 no ve la visita aunque el navegador sí
// abrió la página (confirmado: Clarity registra visitas que GA4 no reporta,
// mezcladas en varios países → no es un firewall corporativo puntual, es
// bloqueo de dominio genérico). Sirviendo el MISMO script desde un dominio
// propio, los bloqueadores (que filtran por dominio, no por contenido) dejan
// de detectarlo.
//
// Ver netlify/functions/_lib/proxy-core.js para el diseño compartido (mismo
// patrón que gauth-proxy/gdb-proxy, ya validado en producción).
// ─────────────────────────────────────────────────────────────────────────────
const { forward, gate, RL_ANALITICA } = require('./_lib/proxy-core');

// El measurement ID de GA4 del sitio (público por diseño, va en el HTML igual).
const GA_MEASUREMENT_ID = 'G-P5ZL4FBL4S';

exports.handler = async function (event) {
    // Con el tope del plugin (60/min/IP), una oficina donde muchos abren la web
    // a la vez recibía 429 AQUÍ: gtag.js no llegaba a cargar y esas visitas no
    // se medían en absoluto. El script se cachea una hora, así que el gasto real
    // de subir el tope es mínimo.
    const blocked = gate(event, ['GET'], { maxPorMinuto: RL_ANALITICA });
    if (blocked) return blocked;

    // gtag.js se sirve siempre para el mismo measurement ID de este sitio;
    // no reenviamos ningún id arbitrario que llegue por query (evita que este
    // proxy se use para servir el script de OTRO sitio).
    const target = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    const res = await forward(target, event);

    // El script es JS, no JSON: forward() ya respeta el Content-Type del
    // upstream, pero cacheamos agresivo del lado del cliente (Google también
    // lo hace) para no pagar el proxy en cada carga de página.
    return {
        ...res,
        headers: { ...res.headers, 'Cache-Control': 'public, max-age=3600' },
    };
};
