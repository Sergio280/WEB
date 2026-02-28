const { MercadoPagoConfig, Preference } = require('mercadopago');

const CATALOG = {
    individual: {
        '1m':  { title: 'BIMS Individual – 1 mes',    price: 15,  months: 1  },
        '3m':  { title: 'BIMS Individual – 3 meses',  price: 40,  months: 3  },
        '6m':  { title: 'BIMS Individual – 6 meses',  price: 75,  months: 6  },
        '12m': { title: 'BIMS Individual – 1 año',    price: 149, months: 12 },
    },
    profesional: {
        '1m':  { title: 'BIMS Profesional – 1 mes',   price: 25,  months: 1  },
        '3m':  { title: 'BIMS Profesional – 3 meses', price: 67,  months: 3  },
        '6m':  { title: 'BIMS Profesional – 6 meses', price: 125, months: 6  },
        '12m': { title: 'BIMS Profesional – 1 año',   price: 249, months: 12 },
    },
};

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

    const { email, plan, duration } = body;

    if (!email || !plan || !duration)
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Se requieren: email, plan y duration' }) };

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Email inválido' }) };

    const item = CATALOG[plan]?.[duration];
    if (!item)
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: `Combinación inválida: plan="${plan}", duration="${duration}"` }) };

    try {
        const client = new MercadoPagoConfig({
            accessToken: process.env.MP_ACCESS_TOKEN,
            options: { timeout: 8000 },
        });

        const siteUrl    = (process.env.SITE_URL || '').replace(/\/$/, '');
        const webhookUrl = `${siteUrl}/api/webhook`;
        const extRef     = JSON.stringify({ e: email, p: plan, d: duration });

        const pref = await new Preference(client).create({
            body: {
                items: [{
                    id:          `bims-${plan}-${duration}`,
                    title:       item.title,
                    unit_price:  item.price,
                    quantity:    1,
                    currency_id: process.env.MP_CURRENCY || 'USD',
                }],
                payer:              { email },
                external_reference: extRef,
                back_urls: {
                    success: `${siteUrl}/success.html`,
                    failure: `${siteUrl}/?pago=error`,
                    pending: `${siteUrl}/?pago=pendiente`,
                },
                auto_return:          'approved',
                notification_url:     webhookUrl,
                statement_descriptor: 'BIMS Revit Plugin',
            },
        });

        return {
            statusCode: 200,
            headers: CORS,
            body: JSON.stringify({
                init_point:  pref.init_point,
                sandbox_url: pref.sandbox_init_point,
            }),
        };

    } catch (err) {
        console.error('[create-preference] Error MP:', err?.message || err);
        return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'No se pudo crear la preferencia de pago' }) };
    }
};
