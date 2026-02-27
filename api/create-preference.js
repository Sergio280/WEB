/**
 * POST /api/create-preference
 *
 * Crea una preferencia de MercadoPago con el email, plan y duración del usuario.
 * El external_reference lleva esos datos para recuperarlos en el webhook.
 *
 * Body JSON esperado:
 *   { email: string, plan: "individual"|"profesional", duration: "1m"|"3m"|"6m"|"12m" }
 *
 * Responde con:
 *   { init_point: string }  ← URL de checkout de MP a la que redirigir al usuario
 */

const { MercadoPagoConfig, Preference } = require('mercadopago');

// ── Catálogo de planes ────────────────────────────────────────────────────────
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

// ── Handler ───────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
    // Preflight CORS
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST')    return res.status(405).json({ error: 'Método no permitido' });

    const { email, plan, duration } = req.body || {};

    // ── Validar parámetros ────────────────────────────────────────────────────
    if (!email || !plan || !duration) {
        return res.status(400).json({ error: 'Se requieren: email, plan y duration' });
    }

    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(email)) {
        return res.status(400).json({ error: 'Email inválido' });
    }

    const item = CATALOG[plan]?.[duration];
    if (!item) {
        return res.status(400).json({
            error: `Combinación inválida: plan="${plan}", duration="${duration}"`,
        });
    }

    // ── Crear preferencia en MP ───────────────────────────────────────────────
    try {
        const client = new MercadoPagoConfig({
            accessToken: process.env.MP_ACCESS_TOKEN,
            options: { timeout: 8000 },
        });

        const prefAPI  = new Preference(client);
        const siteUrl  = (process.env.SITE_URL || '').replace(/\/$/, '');
        const webhookUrl = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}/api/webhook`
            : `${siteUrl}/api/webhook`;

        // external_reference: payload compacto que el webhook decodificará
        const extRef = JSON.stringify({ e: email, p: plan, d: duration });

        const pref = await prefAPI.create({
            body: {
                items: [{
                    id:         `bims-${plan}-${duration}`,
                    title:      item.title,
                    unit_price: item.price,
                    quantity:   1,
                    currency_id: process.env.MP_CURRENCY || 'USD',
                }],
                payer: { email },
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

        return res.status(200).json({
            init_point:  pref.init_point,        // producción
            sandbox_url: pref.sandbox_init_point, // sandbox (útil en dev)
        });

    } catch (err) {
        console.error('[create-preference] Error MP:', err?.message || err);
        return res.status(500).json({ error: 'No se pudo crear la preferencia de pago' });
    }
};
