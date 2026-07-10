// ── lemonsqueezy-webhook.js ───────────────────────────────────────────────────
// Recibe y procesa webhooks de Lemon Squeezy (pasarela internacional).
// POST /api/lemonsqueezy-webhook
//
// SEGURIDAD: LS firma cada webhook con HMAC-SHA256 del cuerpo CRUDO usando el
// signing secret del webhook (env LEMONSQUEEZY_WEBHOOK_SECRET). Verificamos la
// firma del header X-Signature contra el cómputo local con timingSafeEqual. Sin
// eso, cualquiera podría forjar activaciones.
//
// Modelo: todos los planes son SUSCRIPCIÓN. El vencimiento de la licencia se fija
// en `renews_at` (fecha exacta del próximo cobro), así la licencia sigue la
// facturación real de LS en alta y renovaciones. Ver [[provision-license]].
// ─────────────────────────────────────────────────────────────────────────────

const crypto = require('crypto');
const { provisionLicense, cancelSubscription } = require('./_lib/provision-license');
const { planForVariant } = require('./_lib/ls-plans');

exports.handler = async function (event) {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
    if (!secret) {
        console.error('[ls-webhook] LEMONSQUEEZY_WEBHOOK_SECRET no configurado');
        return { statusCode: 500, body: '' };
    }

    // ── Cuerpo CRUDO (Netlify puede entregarlo en base64) ────────────────────
    const rawBody = event.isBase64Encoded
        ? Buffer.from(event.body || '', 'base64').toString('utf8')
        : (event.body || '');

    // ── Verificar firma HMAC-SHA256 ──────────────────────────────────────────
    const sigHeader = event.headers['x-signature'] || event.headers['X-Signature'] || '';
    const digest = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
    let signatureOk = false;
    try {
        const a = Buffer.from(sigHeader, 'utf8');
        const b = Buffer.from(digest, 'utf8');
        signatureOk = a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch { signatureOk = false; }
    if (!signatureOk) {
        console.warn('[ls-webhook] firma inválida — descartado');
        return { statusCode: 401, body: '' };
    }

    let payload;
    try { payload = JSON.parse(rawBody); } catch { return { statusCode: 400, body: '' }; }

    const eventName = payload?.meta?.event_name || '';
    const data  = payload?.data || {};
    const attrs = data.attributes || {};
    console.log(`[ls-webhook] evento=${eventName} id=${data.id} email=${attrs.user_email} status=${attrs.status} test=${attrs.test_mode}`);

    // ── Guard de modo de prueba ──────────────────────────────────────────────
    // Una compra en Test mode de Lemon Squeezy NO mueve dinero real (se paga con
    // tarjetas de prueba tipo 4242…), así que jamás debe provisionar una licencia
    // real. Sin esta guarda, cualquiera con el enlace de checkout podría obtener
    // una licencia gratis. Para probar el flujo a propósito, poner en Netlify
    // LS_ALLOW_TEST_MODE=true (nunca en producción).
    if (attrs.test_mode === true && process.env.LS_ALLOW_TEST_MODE !== 'true') {
        console.warn('[ls-webhook] evento en test_mode — ignorado (no se provisiona licencia)');
        return { statusCode: 200, body: 'ignored (test_mode)' };
    }

    try {
        // ── Cancelación / expiración ─────────────────────────────────────────
        if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
            await cancelSubscription(attrs.user_email);
            return { statusCode: 200, body: 'ok' };
        }

        // ── Alta / renovación / reanudación ──────────────────────────────────
        if (['subscription_created', 'subscription_updated', 'subscription_resumed', 'subscription_payment_success'].includes(eventName)) {
            // subscription_payment_success trae un objeto "invoice" (sin variant_id);
            // lo ignoramos porque created/updated ya cubren alta y renovación con
            // variant_id + renews_at.
            if (eventName === 'subscription_payment_success') return { statusCode: 200, body: 'ignored (invoice)' };

            const map = planForVariant(attrs.variant_id);
            if (!map) {
                console.warn(`[ls-webhook] variant desconocido: ${attrs.variant_id} — skip`);
                return { statusCode: 200, body: 'unknown variant' };
            }

            // Estados no vigentes → desactivar (no reactivar por un update tardío)
            if (['cancelled', 'expired', 'unpaid'].includes(attrs.status)) {
                await cancelSubscription(attrs.user_email);
                return { statusCode: 200, body: 'inactive status' };
            }

            await provisionLicense(attrs.user_email, {
                gateway:        'lemonsqueezy',
                licenseType:    map.licenseType,
                plan:           map.plan,
                maxDevices:     map.maxDevices,
                paymentType:    'subscription',
                subscriptionId: data.id,
                expiresAt:      attrs.renews_at || attrs.ends_at || null, // fecha exacta del próximo cobro
                months:         map.duration === 'yearly' ? 12 : 1,       // fallback si faltara renews_at
                currency:       'USD',
            });
            return { statusCode: 200, body: 'ok' };
        }

        console.log(`[ls-webhook] evento no manejado: ${eventName}`);
        return { statusCode: 200, body: 'ignored' };

    } catch (err) {
        console.error('[ls-webhook] error procesando:', err?.message || err);
        // 500 → LS reintenta (provisionLicense es idempotente por expiresAt/dedup)
        return { statusCode: 500, body: 'retry' };
    }
};
