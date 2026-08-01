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

// Códigos de promoción. Se revalidan AQUÍ aunque la web ya los haya consultado
// en /api/validar-descuento: aquella llamada solo sirve para mostrar el precio,
// esta es la que fija lo que se cobra de verdad.
const admin = require('firebase-admin');
const { buscarCodigo, aplicar, usosDisponibles, registrarUso } = require('./_lib/descuentos');

if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            clientEmail: `firebase-adminsdk-fbsvc@${projectId}.iam.gserviceaccount.com`,
            privateKey:  (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        }),
        databaseURL: `https://${projectId}-default-rtdb.firebaseio.com`,
    });
}
const db = admin.database();

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

    const { token_id, email, plan, duration, comprobante, codigo } = body;

    if (!token_id || !email || !plan || !duration)
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Faltan campos requeridos: token_id, email, plan, duration' }) };

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Email inválido' }) };

    const item = itemCobrable(plan, duration);
    if (!item)
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: `Plan/duración inválido: plan="${plan}", duration="${duration}"` }) };

    // ── Promoción ────────────────────────────────────────────────────────────
    // Se recalcula el importe DESDE CERO con el código que llegó, sin confiar en
    // ningún monto enviado por el navegador. Un código inválido o agotado no
    // corta el pago: simplemente no se aplica y se cobra precio de lista. Es
    // preferible cobrar de más (y devolver la diferencia) a rechazar una compra.
    let cobrado = { total: item.totalSoles, base: item.base, igv: item.igv, ahorro: 0 };
    let promoAplicada = null;

    if (codigo) {
        // `estricto: true` — aquí el correo YA se conoce, así que una promoción
        // reservada a otra persona no se aplica. Es la comprobación que hace que
        // un enlace filtrado no sirva de nada aunque se salten la web.
        const bc = buscarCodigo(codigo, plan, duration, email, true);
        if (bc.ok) {
            const cupo = await usosDisponibles(db, bc.promo);
            if (cupo.ok) {
                cobrado = aplicar(bc.promo, item.totalSoles);
                promoAplicada = bc.promo;
            } else {
                console.warn(`[culqi-charge] código "${codigo}" agotado; se cobra precio de lista`);
            }
        } else {
            console.warn(`[culqi-charge] código "${codigo}" no aplicable (${bc.motivo}); se cobra precio de lista`);
        }
    }

    const montoCentimos = Math.round(cobrado.total * 100);

    // Datos fiscales del comprador. Un dato inválido SÍ corta el cobro (mejor
    // que emitir el comprobante a un contribuyente equivocado); su ausencia no.
    // Se valida contra el importe REALMENTE cobrado, que es el que decide si el
    // DNI es obligatorio en una boleta (umbral de S/700).
    const vc = validarComprobante(comprobante, cobrado.total);
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
                amount:        montoCentimos,
                currency_code: 'PEN',
                email,
                source_id:     token_id,
                description:   promoAplicada ? `${item.title} (promo)` : item.title,
                metadata: {
                    plan,
                    duration,
                    email,
                    months:     String(item.months),
                    maxDevices: String(item.maxDevices),
                    // Desglose para el comprobante electrónico, calculado sobre
                    // el importe REALMENTE cobrado (con promoción aplicada si la
                    // hubo). El precio ya incluye IGV, así que aquí se guarda
                    // cuánto de ese total es base imponible y cuánto impuesto.
                    // Se congela en el momento del cobro con la tasa de ese día,
                    // por si el IGV cambiara más adelante. Culqi exige strings.
                    baseImponible: cobrado.base.toFixed(2),
                    igv:           cobrado.igv.toFixed(2),
                    // Trazabilidad de la promoción, para saber después qué se
                    // vendió con descuento y por qué el importe no es el de lista.
                    ...(promoAplicada
                        ? { promoCodigo: String(promoAplicada.codigo), promoAhorro: cobrado.ahorro.toFixed(2) }
                        : {}),
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

        console.log(
            `[culqi-charge] Cobro exitoso: ${email} | ${item.title} | S/${cobrado.total}` +
            (promoAplicada ? ` (promo ${promoAplicada.codigo}, -S/${cobrado.ahorro})` : '') +
            ` | charge_id: ${data.id}`
        );

        // El uso se cuenta SOLO cuando el cobro se aprobó. Si se contara antes,
        // una tarjeta rechazada consumiría el cupo de un código de un solo uso.
        if (promoAplicada) {
            await registrarUso(db, promoAplicada.codigo, {
                email, plan, duration,
                chargeId: data.id,
                total: cobrado.total,
                ahorro: cobrado.ahorro,
            });
        }

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
