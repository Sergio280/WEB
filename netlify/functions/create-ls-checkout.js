// ── create-ls-checkout.js ─────────────────────────────────────────────────────
// Crea una sesión de checkout en Lemon Squeezy y devuelve la URL para redirigir.
// POST /api/ls-checkout   Body: { plan, duration, email? }
//
// Es el equivalente internacional de culqi-charge: el frontend llama aquí, obtiene
// la URL del checkout hospedado de LS y redirige. LS cobra con tarjeta
// internacional / wallets, y al pagar dispara el webhook → provisiona la licencia.
// La API key de LS vive solo en el servidor (env LEMONSQUEEZY_API_KEY).
// ─────────────────────────────────────────────────────────────────────────────

const { variantIdFor, STORE_ID } = require('./_lib/ls-plans');

// ── Allowlist de orígenes (idéntica al resto de functions) ───────────────────
const SITE_URL = process.env.SITE_URL || 'https://bimsaddin.com';
const ALLOWED_ORIGIN_PATTERNS = [
    SITE_URL,
    'https://bimsaddin.com',
    'https://www.bimsaddin.com',
    'https://bimsapp.netlify.app',
    /^https:\/\/deploy-preview-\d+--bimsapp\.netlify\.app$/,
    /^https:\/\/[a-z0-9-]+--bimsapp\.netlify\.app$/,
];
function isOriginAllowed(origin) {
    if (!origin) return false;
    return ALLOWED_ORIGIN_PATTERNS.some(p =>
        (typeof p === 'string' && p === origin) || (p instanceof RegExp && p.test(origin)));
}
function corsHeadersFor(origin) {
    const headers = {
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin',
    };
    if (isOriginAllowed(origin)) headers['Access-Control-Allow-Origin'] = origin;
    return headers;
}
function resp(statusCode, body, origin) {
    return { statusCode, headers: { ...corsHeadersFor(origin), 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

exports.handler = async function (event) {
    const origin = event.headers.origin || event.headers.Origin || '';
    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeadersFor(origin), body: '' };
    if (event.httpMethod !== 'POST')    return resp(405, { error: 'Método no permitido' }, origin);
    if (!isOriginAllowed(origin))       return resp(403, { error: 'Origen no autorizado' }, origin);

    if (!process.env.LEMONSQUEEZY_API_KEY)
        return resp(500, { error: 'LEMONSQUEEZY_API_KEY no configurada' }, origin);

    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return resp(400, { error: 'Body inválido' }, origin); }

    const { plan, duration, email } = body;
    const variantId = variantIdFor(plan, duration);
    if (!variantId) return resp(400, { error: `Plan/duración inválido: plan="${plan}", duration="${duration}"` }, origin);

    // Cuerpo JSON:API que espera LS para crear un checkout.
    const checkoutBody = {
        data: {
            type: 'checkouts',
            attributes: {
                checkout_data: {
                    ...(email ? { email } : {}),
                    custom: { plan: String(plan), duration: String(duration) },
                },
                product_options: {
                    redirect_url: `${SITE_URL}/success.html`,
                    receipt_button_text: 'Descargar BIMS',
                    receipt_thank_you_note: 'Revisa tu correo para fijar tu contraseña e inicia sesión en el plugin.',
                },
            },
            relationships: {
                store:   { data: { type: 'stores',   id: String(STORE_ID) } },
                variant: { data: { type: 'variants', id: String(variantId) } },
            },
        },
    };

    try {
        const r = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
                'Accept':        'application/vnd.api+json',
                'Content-Type':  'application/vnd.api+json',
            },
            body: JSON.stringify(checkoutBody),
        });
        const data = await r.json();
        const url = data?.data?.attributes?.url;
        if (!r.ok || !url) {
            console.error('[ls-checkout] error LS:', JSON.stringify(data).slice(0, 500));
            return resp(502, { error: 'No se pudo crear el checkout' }, origin);
        }
        return resp(200, { url }, origin);
    } catch (err) {
        console.error('[ls-checkout] excepción:', err?.message || err);
        return resp(500, { error: 'Error interno' }, origin);
    }
};
