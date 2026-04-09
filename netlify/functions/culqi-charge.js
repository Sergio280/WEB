// ── culqi-charge.js ───────────────────────────────────────────────────────────
// Crea un cobro único (pago único) via Culqi API v2.
// POST /api/culqi-charge
// Body: { token_id, email, plan, duration }
// ─────────────────────────────────────────────────────────────────────────────

const CATALOG = {
    individual: {
        '1m':  { title: 'BIMS Individual – 1 mes',    amount: 6000,  months: 1  },
        '3m':  { title: 'BIMS Individual – 3 meses',  amount: 16000, months: 3  },
        '6m':  { title: 'BIMS Individual – 6 meses',  amount: 30000, months: 6  },
        '12m': { title: 'BIMS Individual – 1 año',    amount: 59600, months: 12 },
    },
    profesional: {
        '1m':  { title: 'BIMS Profesional – 1 mes',   amount: 10000, months: 1  },
        '3m':  { title: 'BIMS Profesional – 3 meses', amount: 26800, months: 3  },
        '6m':  { title: 'BIMS Profesional – 6 meses', amount: 50000, months: 6  },
        '12m': { title: 'BIMS Profesional – 1 año',   amount: 99600, months: 12 },
    },
    test: {
        'test': { title: 'BIMS TEST – S/5', amount: 500, months: 1 },
    },
};

const PLAN_MAX_DEVICES = { individual: 1, profesional: 3 };

const CORS = {
    'Access-Control-Allow-Origin':  process.env.SITE_URL || '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

exports.handler = async function (event) {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
    if (event.httpMethod !== 'POST')    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Método no permitido' }) };

    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { body = {}; }

    const { token_id, email, plan, duration } = body;

    if (!token_id || !email || !plan || !duration)
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Faltan campos requeridos: token_id, email, plan, duration' }) };

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Email inválido' }) };

    const item = CATALOG[plan]?.[duration];
    if (!item)
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: `Plan/duración inválido: plan="${plan}", duration="${duration}"` }) };

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
                    maxDevices: String(PLAN_MAX_DEVICES[plan] || 1),
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
