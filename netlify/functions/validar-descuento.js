// ── validar-descuento.js ──────────────────────────────────────────────────────
// Devuelve el precio rebajado de un código, SOLO para mostrarlo en la web.
// POST /api/validar-descuento
// Body: { codigo, plan, duration }
//
// ⚠️ Esto NO autoriza nada. El monto que se cobra lo vuelve a decidir
// culqi-charge.js validando el mismo código por su cuenta. Si alguien llama
// aquí directamente lo único que consigue es saber cuánto costaría — que es
// justo lo que la web le va a enseñar de todas formas.
// ─────────────────────────────────────────────────────────────────────────────

const admin = require('firebase-admin');
const { itemCobrable } = require('./_lib/pricing');
const { buscarCodigo, aplicar, usosDisponibles } = require('./_lib/descuentos');

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

// Misma allowlist que el resto de endpoints del checkout.
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

exports.handler = async function (event) {
    const origin = event.headers.origin || event.headers.Origin || '';
    const CORS = corsHeadersFor(origin);

    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
    if (event.httpMethod !== 'POST')
        return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Método no permitido' }) };

    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { body = {}; }

    // `email` es opcional: al abrir el modal el visitante aún no lo ha escrito.
    // Sirve para promociones reservadas a una persona concreta.
    const { codigo, plan, duration, email } = body;

    const item = itemCobrable(plan, duration);
    if (!item)
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Plan o duración inválidos' }) };

    const r = buscarCodigo(codigo, plan, duration, email);
    // Un código inválido NO es un error del servidor: se responde 200 con
    // `valido:false` para que la web muestre un aviso amable en vez de romperse.
    if (!r.ok)
        return { statusCode: 200, headers: CORS, body: JSON.stringify({ valido: false, motivo: r.motivo }) };

    const cupo = await usosDisponibles(db, r.promo);
    if (!cupo.ok)
        return { statusCode: 200, headers: CORS, body: JSON.stringify({ valido: false, motivo: 'agotado' }) };

    const d = aplicar(r.promo, item.totalSoles);

    return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({
            valido: true,
            totalOriginal: item.totalSoles,
            total: d.total,
            ahorro: d.ahorro,
            base: d.base,
            igv: d.igv,
            // La promo está reservada a un correo y aún no se ha escrito: la web
            // muestra el precio rebajado pero volverá a preguntar al teclearlo.
            requiereEmail: !!r.requiereEmail,
        }),
    };
};
