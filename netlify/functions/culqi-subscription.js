// ── culqi-subscription.js ─────────────────────────────────────────────────────
// Crea una suscripción mensual via Culqi API v2.
// POST /api/culqi-subscription
// Body: { token_id, email, plan }
// ─────────────────────────────────────────────────────────────────────────────

const PLAN_IDS = {
    individual:  () => process.env.CULQI_PLAN_INDIVIDUAL,
    profesional: () => process.env.CULQI_PLAN_PROFESIONAL,
};

const PLAN_MAX_DEVICES = { individual: 1, profesional: 3 };
const PLAN_AMOUNTS     = { individual: 6000, profesional: 10000 };

const CORS = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

exports.handler = async function (event) {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
    if (event.httpMethod !== 'POST')    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Método no permitido' }) };

    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { body = {}; }

    const { token_id, email, plan } = body;

    if (!token_id || !email || !plan)
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Faltan campos: token_id, email, plan' }) };

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Email inválido' }) };

    const planId = PLAN_IDS[plan]?.();
    if (!planId)
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: `Plan inválido: "${plan}". Configure CULQI_PLAN_INDIVIDUAL / CULQI_PLAN_PROFESIONAL en Netlify.` }) };

    try {
        // 1. Crear o reusar Customer en Culqi
        const customerRes = await fetch('https://api.culqi.com/v2/customers', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.CULQI_SECRET_KEY}`,
                'Content-Type':  'application/json',
            },
            body: JSON.stringify({
                email,
                first_name: email.split('@')[0],
                last_name:  'BIMS',
                address:    'Lima',
                address_city: 'Lima',
                country_code: 'PE',
                phone_number: '999999999',
            }),
        });

        const customer = await customerRes.json();
        if (!customerRes.ok && customer.object === 'error') {
            // Si el customer ya existe, lo buscamos
            if (customer.code !== 'customer_duplicated') {
                console.error('[culqi-sub] Error creando customer:', customer);
                return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: customer.user_message || 'Error al crear cliente' }) };
            }
        }

        const customerId = customer.id;

        // 2. Crear Card en Culqi (asociar token al customer)
        const cardRes = await fetch('https://api.culqi.com/v2/cards', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.CULQI_SECRET_KEY}`,
                'Content-Type':  'application/json',
            },
            body: JSON.stringify({ customer_id: customerId, token_id }),
        });

        const card = await cardRes.json();
        if (!cardRes.ok || card.object === 'error') {
            console.error('[culqi-sub] Error creando card:', card);
            return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: card.user_message || 'Error al registrar tarjeta' }) };
        }

        // 3. Crear Suscripción
        const subRes = await fetch('https://api.culqi.com/v2/recurrent/subscriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.CULQI_SECRET_KEY}`,
                'Content-Type':  'application/json',
            },
            body: JSON.stringify({
                card_id:  card.id,
                plan_id:  planId,
                metadata: {
                    email,
                    plan,
                    maxDevices: String(PLAN_MAX_DEVICES[plan] || 1),
                    amount:     String(PLAN_AMOUNTS[plan] || 0),
                },
            }),
        });

        const sub = await subRes.json();
        if (!subRes.ok || sub.object === 'error') {
            console.error('[culqi-sub] Error creando suscripción:', sub);
            return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: sub.user_message || 'Error al crear suscripción' }) };
        }

        console.log(`[culqi-sub] Suscripción creada: ${email} | plan: ${plan} | sub_id: ${sub.id}`);

        return {
            statusCode: 200,
            headers: CORS,
            body: JSON.stringify({ success: true, subscription_id: sub.id }),
        };

    } catch (err) {
        console.error('[culqi-sub] Error:', err?.message || err);
        return {
            statusCode: 500,
            headers: CORS,
            body: JSON.stringify({ error: 'Error interno del servidor' }),
        };
    }
};
