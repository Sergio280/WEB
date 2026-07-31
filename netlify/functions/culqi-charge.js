// ── culqi-charge.js ───────────────────────────────────────────────────────────
// Crea un cobro único (pago único) via Culqi API v2.
// POST /api/culqi-charge
// Body: { token_id, email, plan, duration }
// ─────────────────────────────────────────────────────────────────────────────

// El catálogo de precios (que antes estaba escrito a mano aquí, en céntimos)
// vive ahora en _lib/pricing.js, la fuente única del backend. `itemCobrable`
// devuelve título, monto en céntimos, meses de licencia, equipos permitidos y
// el desglose base imponible / IGV.
const { itemCobrable } = require('./_lib/pricing');

// Validación de los datos fiscales del comprador (RUC/DNI + razón social) que
// se necesitan para emitir el comprobante electrónico. Se revalida en servidor
// porque la validación del navegador se puede saltar.
const { validarComprobante } = require('./_lib/comprobante');

// ── Allowlist de orígenes (consistente con /api/trial) ───────────────────────
// Producción + Deploy Previews + branch deploys del mismo proyecto Netlify.
// Se permiten AMBOS dominios de producción de forma EXPLÍCITA: los plugins ya
// distribuidos mandan Origin: https://bimsapp.netlify.app compilado en la DLL,
// y la web nueva vive en https://bimsaddin.com. Eliminar el subdominio netlify
// rompería el checkout de los usuarios ya instalados.
const SITE_URL = process.env.SITE_URL || 'https://bimsaddin.com';
const ALLOWED_ORIGIN_PATTERNS = [
    SITE_URL,
    'https://bimsaddin.com',
    'https://www.bimsaddin.com',
    'https://bimsapp.netlify.app',                     // plugins ya instalados; NO eliminar
    /^https:\/\/deploy-preview-\d+--bimsapp\.netlify\.app$/,
    /^https:\/\/[a-z0-9-]+--bimsapp\.netlify\.app$/,
];

function isOriginAllowed(origin) {
    if (!origin) return false;
    for (const p of ALLOWED_ORIGIN_PATTERNS) {
        if (typeof p === 'string' && p === origin) return true;
        if (p instanceof RegExp && p.test(origin)) return true;
    }
    return false;
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

exports.handler = async function (event) {
    const origin  = event.headers.origin  || event.headers.Origin  || '';
    const referer = event.headers.referer || event.headers.Referer || '';
    const CORS    = corsHeadersFor(origin);

    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
    if (event.httpMethod !== 'POST')    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Método no permitido' }) };

    // ── Validación de Origin/Referer ─────────────────────────────────────────
    // Bloquea scripts externos que intenten usar token_id robados. No es
    // protección CSRF estricta (no usamos cookies/sesión) pero filtra abuso
    // automatizado que no setea Origin/Referer válido.
    const refOk = referer && ALLOWED_ORIGIN_PATTERNS.some(p =>
        typeof p === 'string' ? referer.startsWith(p)
                              : p.test(referer.replace(/^(https:\/\/[^\/]+).*$/, '$1'))
    );
    if (!isOriginAllowed(origin) && !refOk) {
        console.warn('[culqi-charge] Origin/Referer no permitido. Origin:', origin, 'Referer:', referer);
        return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'Origen no autorizado' }) };
    }

    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { body = {}; }

    const { token_id, email, plan, duration, comprobante } = body;

    if (!token_id || !email || !plan || !duration)
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Faltan campos requeridos: token_id, email, plan, duration' }) };

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Email inválido' }) };

    const item = itemCobrable(plan, duration);
    if (!item)
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: `Plan/duración inválido: plan="${plan}", duration="${duration}"` }) };

    // Datos fiscales del comprador. Un dato inválido SÍ corta el cobro (mejor
    // que emitir el comprobante a un contribuyente equivocado); su ausencia no.
    const vc = validarComprobante(comprobante, item.totalSoles);
    if (!vc.ok)
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: vc.error }) };

    try {
        const response = await fetch('https://api.culqi.com/v2/charges', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.CULQI_SECRET_KEY}`,
                'Content-Type':  'application/json',
            },
            body: JSON.stringify({
                amount:        item.amount,
                currency_code: 'PEN',
                email,
                source_id:     token_id,
                description:   item.title,
                metadata: {
                    plan,
                    duration,
                    email,
                    months:     String(item.months),
                    maxDevices: String(item.maxDevices),
                    // Desglose para el comprobante electrónico. El precio de
                    // lista YA incluye IGV, así que aquí se guarda cuánto de
                    // ese total es base imponible y cuánto impuesto. Se calcula
                    // en el momento del cobro y no después, para que quede
                    // congelado con la tasa vigente ese día aunque el IGV
                    // cambie más adelante. Culqi exige strings en metadata.
                    baseImponible: item.base.toFixed(2),
                    igv:           item.igv.toFixed(2),
                    // Datos del comprobante. Culqi solo admite strings en
                    // metadata, así que el objeto viaja serializado; el webhook
                    // lo vuelve a parsear para guardarlo en Firebase.
                    ...(vc.datos ? { comprobante: JSON.stringify(vc.datos) } : {}),
                },
            }),
        });

        const data = await response.json();

        if (!response.ok || data.object === 'error') {
            console.error('[culqi-charge] Error:', data);
            return {
                statusCode: 400,
                headers: CORS,
                body: JSON.stringify({ error: data.user_message || data.merchant_message || 'Error al procesar el pago' }),
            };
        }

        if (data.outcome?.type !== 'venta_exitosa') {
            return {
                statusCode: 400,
                headers: CORS,
                body: JSON.stringify({ error: data.outcome?.user_message || 'Pago no aprobado' }),
            };
        }

        console.log(`[culqi-charge] Cobro exitoso: ${email} | ${item.title} | charge_id: ${data.id}`);

        return {
            statusCode: 200,
            headers: CORS,
            body: JSON.stringify({ success: true, charge_id: data.id }),
        };

    } catch (err) {
        console.error('[culqi-charge] Error:', err?.message || err);
        return {
            statusCode: 500,
            headers: CORS,
            body: JSON.stringify({ error: 'Error interno del servidor' }),
        };
    }
};
