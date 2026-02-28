const crypto = require('crypto');
const { MercadoPagoConfig, Payment, PreApproval } = require('mercadopago');
const admin = require('firebase-admin');

// ── Firebase Admin (singleton) ────────────────────────────────────────────────
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId:   process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey:  (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
}

const db   = admin.database();
const auth = admin.auth();

const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
    options: { timeout: 8000 },
});

const DURATION_MONTHS  = { '1m': 1, '3m': 3, '6m': 6, '12m': 12 };
const DURATION_LICENSE = { '1m': 'Monthly', '3m': 'Monthly', '6m': 'Monthly', '12m': 'Annual' };
const PLAN_MAX_DEVICES = { individual: 1, profesional: 3 };

// ── Handler principal ─────────────────────────────────────────────────────────
exports.handler = async function (event) {
    if (event.httpMethod !== 'POST') return { statusCode: 200, body: '' };

    try {
        const body  = JSON.parse(event.body || '{}');
        const query = event.queryStringParameters || {};

        if (process.env.MP_WEBHOOK_SECRET) {
            if (!verifySignature(event, process.env.MP_WEBHOOK_SECRET)) {
                console.warn('[webhook] Firma inválida — descartado');
                return { statusCode: 200, body: '' };
            }
        }

        const topic = body.type || query.topic || '';
        const id    = String(body.data?.id || query.id || '');

        if (!topic || !id) {
            console.warn('[webhook] Sin topic/id:', { topic, id });
            return { statusCode: 200, body: '' };
        }

        console.log(`[webhook] Evento: topic=${topic} id=${id}`);

        if (topic === 'payment') {
            await handlePayment(id);
        } else if (topic === 'preapproval' || topic === 'subscription_preapproval') {
            await handleSubscription(id);
        } else if (topic === 'subscription_authorized_payment') {
            await handleSubscriptionRenewal(id);
        }

    } catch (err) {
        console.error('[webhook] Error:', err?.message || err);
    }

    return { statusCode: 200, body: '' };
};

// ── Pago único ────────────────────────────────────────────────────────────────
async function handlePayment(paymentId) {
    const payment = await new Payment(mpClient).get({ id: paymentId });
    if (payment.status !== 'approved') return;

    let ref;
    try { ref = JSON.parse(payment.external_reference || '{}'); } catch { ref = {}; }

    const { e: email, p: plan = 'individual', d: duration = '1m' } = ref;
    if (!email) { console.warn('[webhook] Pago sin email'); return; }

    await activateLicense(email, {
        licenseType: DURATION_LICENSE[duration] || 'Monthly',
        months:      DURATION_MONTHS[duration]  || 1,
        maxDevices:  PLAN_MAX_DEVICES[plan]     || 1,
        paymentId:   String(paymentId),
        plan, duration,
        amount:      payment.transaction_amount,
        currency:    payment.currency_id,
        paymentType: 'onetime',
    });
}

// ── Suscripción nueva ─────────────────────────────────────────────────────────
async function handleSubscription(preapprovalId) {
    const presub = await new PreApproval(mpClient).get({ id: preapprovalId });
    if (presub.status !== 'authorized') return;

    const email = presub.payer_email;
    if (!email) { console.warn('[webhook] Suscripción sin payer_email'); return; }

    const amount     = presub.auto_recurring?.transaction_amount || 0;
    const plan       = amount >= 25 ? 'profesional' : 'individual';

    await activateLicense(email, {
        licenseType:   'Monthly',
        months:        1,
        maxDevices:    PLAN_MAX_DEVICES[plan],
        preapprovalId: String(preapprovalId),
        plan, amount,
        currency:      presub.auto_recurring?.currency_id || 'USD',
        paymentType:   'subscription',
    });
}

// ── Renovación mensual ────────────────────────────────────────────────────────
async function handleSubscriptionRenewal(authorizedPaymentId) {
    const res  = await fetch(
        `https://api.mercadopago.com/v1/subscription_authorized_payments/${authorizedPaymentId}`,
        { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` } }
    );
    if (!res.ok) return;

    const data = await res.json();
    if (data.status !== 'processed') return;
    if (data.preapproval_id) await handleSubscription(data.preapproval_id);
}

// ── Activar / extender licencia ───────────────────────────────────────────────
async function activateLicense(email, info) {
    let uid, isNewUser = false;

    try {
        uid = (await auth.getUserByEmail(email)).uid;
    } catch {
        const newUser = await auth.createUser({
            email,
            password:      crypto.randomBytes(14).toString('base64url'),
            emailVerified: false,
            displayName:   email.split('@')[0],
        });
        uid = newUser.uid;
        isNewUser = true;
        console.log(`[webhook] Usuario creado: ${email}`);
    }

    const now        = new Date();
    const expSnap    = await db.ref(`users/${uid}/ExpirationDate`).once('value');
    const currentExp = expSnap.val();
    let   baseDate   = new Date();

    if (currentExp) {
        const existing = new Date(currentExp);
        if (existing > now) baseDate = existing;
    }

    baseDate.setMonth(baseDate.getMonth() + info.months);
    const newExpDate = baseDate.toISOString();

    const updates = {
        Email:          email,
        IsActive:       true,
        LicenseType:    info.licenseType,
        ExpirationDate: newExpDate,
        MaxDevices:     info.maxDevices,
        UpdatedAt:      now.toISOString(),
        ...(isNewUser && { CreatedAt: now.toISOString(), ValidationCount: 0, activations: {} }),
    };

    await db.ref(`users/${uid}`).update(updates);

    if (info.paymentId) {
        await db.ref(`users/${uid}/payments/${info.paymentId}`).set({
            plan: info.plan, duration: info.duration || null,
            amount: info.amount || 0, currency: info.currency || 'USD',
            date: now.toISOString(), type: info.paymentType,
        });
    }

    if (info.preapprovalId) {
        await db.ref(`users/${uid}/subscription`).set({
            preapprovalId: info.preapprovalId, plan: info.plan,
            status: 'authorized', lastRenewal: now.toISOString(), nextBilling: newExpDate,
        });
    }

    if (isNewUser) await sendActivationEmail(email);

    console.log(`✅ Licencia activada: ${email} | ${info.licenseType} | vence: ${newExpDate}`);
}

// ── Email de activación ───────────────────────────────────────────────────────
async function sendActivationEmail(email) {
    const apiKey = process.env.FIREBASE_API_KEY;
    if (!apiKey) { console.warn('[webhook] FIREBASE_API_KEY no configurada'); return; }

    try {
        const res = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
            {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ requestType: 'PASSWORD_RESET', email }),
            }
        );
        if (res.ok) console.log(`[webhook] Email enviado a: ${email}`);
        else console.warn('[webhook] Error email:', (await res.json())?.error?.message);
    } catch (err) {
        console.warn('[webhook] Error sendActivationEmail:', err?.message);
    }
}

// ── Verificar firma MP ────────────────────────────────────────────────────────
function verifySignature(event, secret) {
    try {
        const xSignature = event.headers['x-signature']  || '';
        const xRequestId = event.headers['x-request-id'] || '';
        if (!xSignature) return true;

        const parts    = Object.fromEntries(xSignature.split(',').map(p => p.trim().split('=')));
        const ts       = parts.ts || '';
        const hash     = parts.v1 || '';
        const body     = JSON.parse(event.body || '{}');
        const id       = body.data?.id || event.queryStringParameters?.id || '';
        const manifest = `id:${id};request-id:${xRequestId};ts:${ts};`;
        const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

        return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expected, 'hex'));
    } catch {
        return false;
    }
}
