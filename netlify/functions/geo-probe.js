// ── geo-probe.js ─────────────────────────────────────────────────────────────
// TEMPORAL — sonda de diagnóstico. Responde qué señales de geolocalización ve
// una function con la firma LEGACY (exports.handler = async (event, context)),
// que es la que usa create-trial-license.js.
//
// Objetivo: confirmar si `event.headers['x-nf-geo']` existe y decodifica, porque
// de ello depende que resolveLang() pueda deducir el idioma del país cuando el
// plugin de Revit no envía `lang`. NO escribe nada ni envía correos.
//
// BORRAR tras el diagnóstico. Solo se despliega en deploy preview, nunca en main.
// ─────────────────────────────────────────────────────────────────────────────

exports.handler = async function (event, context) {
    const headers = event.headers || {};

    // Cabeceras candidatas a traer el país.
    const candidates = ['x-nf-geo', 'x-country', 'x-nf-client-connection-ip', 'x-geo-country'];
    const seen = {};
    for (const h of candidates) seen[h] = headers[h] ? 'PRESENTE' : 'ausente';

    // ¿Decodifica x-nf-geo como JSON base64?
    let decodedGeo = null;
    let decodeError = null;
    if (headers['x-nf-geo']) {
        try {
            decodedGeo = JSON.parse(Buffer.from(headers['x-nf-geo'], 'base64').toString('utf8'));
        } catch (e) {
            decodeError = e.message;
        }
    }

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            candidatas: seen,
            // Todas las cabeceras x-* que llegan (para descubrir el nombre real).
            headers_x: Object.keys(headers).filter((k) => k.toLowerCase().startsWith('x-')).sort(),
            geo_decodificada: decodedGeo,
            geo_country_code: decodedGeo && decodedGeo.country && decodedGeo.country.code,
            decode_error: decodeError,
            // ¿La firma legacy expone geo en el context?
            context_keys: context ? Object.keys(context) : null,
            context_geo: context && context.geo ? context.geo : 'no existe',
        }, null, 1),
    };
};
