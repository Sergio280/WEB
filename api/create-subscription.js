/**
 * POST /api/create-subscription
 *
 * Crea una suscripción mensual en MercadoPago con el primer mes GRATIS.
 * El usuario ingresa su tarjeta en la pantalla de MP para autorizar;
 * el cobro real comienza el 2do mes.
 *
 * Body JSON:
 *   { email: string, plan: "individual"|"profesional" }
 *
 * Responde con:
 *   { init_point: string }  ← URL de autorización MP
 */

const { MercadoPagoConfig, PreApproval } = require('mercadopago');

const SUBSCRIPTION_PRICES = {
    individual:  15,
    profesional: 25,
};

const SUBSCRIPTION_TITLES = {
    individual:  'BIMS Individual — Suscripción mensual',
    profesional: 'BIMS Profesional — Suscripción mensual',
};

module.exports = async function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST')    return res.status(405).json({ error: 'Método no permitido' });

    const { email, plan } = req.body || {};

    if (!email || !plan) {
        return res.status(400).json({ error: 'Se requieren: email y plan' });
    }

    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(email)) {
        return res.status(400).json({ error: 'Email inválido' });
    }

    const price = SUBSCRIPTION_PRICES[plan];
    if (!price) {
        return res.status(400).json({ error: `Plan inválido: "${plan}"` });
    }

    try {
        const client = new MercadoPagoConfig({
            accessToken: process.env.MP_ACCESS_TOKEN,
            options: { timeout: 8000 },
        });

        const preAPI   = new PreApproval(client);
        const siteUrl  = (process.env.SITE_URL || '').replace(/\/$/, '');
        const webhookUrl = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}/api/webhook`
            : `${siteUrl}/api/webhook`;

        const extRef = JSON.stringify({ e: email, p: plan, t: 'subscription' });

        const result = await preAPI.create({
            body: {
                reason:             SUBSCRIPTION_TITLES[plan],
                payer_email:        email,
                back_url:           `${siteUrl}/success.html`,
                external_reference: extRef,
                auto_recurring: {
                    frequency:          1,
                    frequency_type:     'months',
                    transaction_amount: price,
                    currency_id:        process.env.MP_CURRENCY || 'USD',
                    // Primer mes completamente gratis
                    free_trial: {
                        frequency:      1,
                        frequency_type: 'months',
                    },
                },
                notification_url: webhookUrl,
            },
        });

        return res.status(200).json({ init_point: result.init_point });

    } catch (err) {
        console.error('[create-subscription] Error MP:', err?.message || err);
        return res.status(500).json({ error: 'No se pudo crear la suscripción' });
    }
};
