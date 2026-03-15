// ── culqi-webhook.js ──────────────────────────────────────────────────────────
// Recibe y procesa eventos webhook de Culqi.
// Activa/renueva licencias en Firebase según el evento.
// ─────────────────────────────────────────────────────────────────────────────

const crypto = require('crypto');
const admin  = require('firebase-admin');

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

const PLAN_MAX_DEVICES = { individual: 1, profesional: 3 };

const DURATION_MONTHS = {
    '1m': 1, '3m': 3, '6m': 6, '12m': 12,
};

// ── Handler principal ─────────────────────────────────────────────────────────
exports.handler = async function (event) {
    if (event.httpMethod !== 'POST') return { statusCode: 200, body: '' };

    // Verificar firma Culqi
    if (process.env.CULQI_WEBHOOK_SECRET) {
        if (!verifySignature(event, process.env.CULQI_WEBHOOK_SECRET)) {
            console.warn('[culqi-webhook] Firma inválida — descartado');
            return { statusCode: 200, body: '' };
        }
    }

    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { body = {}; }

    const type   = body.type   || '';
    const object = body.data   || {};

    console.log(`[culqi-webhook] Evento: ${type}`);

    try {
        switch (type) {
            // ── Cobro único aprobado ──────────────────────────────────────────
            case 'charge.succeeded':
            case 'charge.capture':
                await handleCharge(object);
                break;

            // ── Suscripción activada / renovada ───────────────────────────────
            case 'subscription.active':
            case 'subscription.succeeded':
            case 'subscription.renewal':
            case 'subscription.renewal.succeeded':
            case 'subscription.update':
            case 'subscription.update.succeeded':
                await handleSubscription(object);
                break;

            // ── Suscripción cancelada ─────────────────────────────────────────
            case 'subscription.cancel':
            case 'subscription.canceled':
            case 'subscription.cancellation.succeeded':
                await handleCancellation(object);
                break;

            default:
                console.log(`[culqi-webhook] Evento ignorado: ${type}`);
        }
    } catch (err) {
        console.error('[culqi-webhook] Error procesando evento:', err?.message || err);
    }

    return { statusCode: 200, body: '' };
};

// ── Cobro único ───────────────────────────────────────────────────────────────
async function handleCharge(charge) {
    const email    = charge.email;
    const meta     = charge.metadata || {};
    const plan     = meta.plan     || 'individual';
    const duration = meta.duration || '1m';
    const months   = parseInt(meta.months || DURATION_MONTHS[duration] || 1);
    const maxDev   = parseInt(meta.maxDevices || PLAN_MAX_DEVICES[plan] || 1);

    if (!email) { console.warn('[culqi-webhook] Charge sin email'); return; }

    await activateLicense(email, {
        licenseType: months >= 12 ? 'Annual' : 'Monthly',
        months,
        maxDevices:  maxDev,
        chargeId:    charge.id,
        plan, duration,
        amount:      charge.amount,
        paymentType: 'onetime',
    });
}

// ── Suscripción activa/renovada ───────────────────────────────────────────────
async function handleSubscription(sub) {
    const email  = sub.metadata?.email || sub.email;
    const plan   = sub.metadata?.plan  || 'individual';
    const maxDev = parseInt(sub.metadata?.maxDevices || PLAN_MAX_DEVICES[plan] || 1);

    if (!email) { console.warn('[culqi-webhook] Subscription sin email'); return; }

    await activateLicense(email, {
        licenseType:    'Monthly',
        months:         1,
        maxDevices:     maxDev,
        subscriptionId: sub.id,
        plan,
        amount:         sub.plan?.amount || 0,
        paymentType:    'subscription',
    });
}

// ── Suscripción cancelada ─────────────────────────────────────────────────────
async function handleCancellation(sub) {
    const email = sub.metadata?.email || sub.email;
    if (!email) return;

    try {
        const uid = (await auth.getUserByEmail(email)).uid;
        await db.ref(`users/${uid}/subscription/status`).set('canceled');
        console.log(`[culqi-webhook] Suscripción cancelada: ${email}`);
    } catch (err) {
        console.warn('[culqi-webhook] No se pudo cancelar:', err?.message);
    }
}

// ── Activar / extender licencia en Firebase ───────────────────────────────────
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
        console.log(`[culqi-webhook] Usuario creado: ${email}`);
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

    if (info.chargeId) {
        await db.ref(`users/${uid}/payments/${info.chargeId}`).set({
            plan: info.plan, duration: info.duration || null,
            amount: info.amount || 0, currency: 'PEN',
            date: now.toISOString(), type: 'onetime',
        });
    }

    if (info.subscriptionId) {
        await db.ref(`users/${uid}/subscription`).set({
            subscriptionId: info.subscriptionId,
            plan:           info.plan,
            status:         'active',
            lastRenewal:    now.toISOString(),
            nextBilling:    newExpDate,
        });
    }

    if (isNewUser) await sendActivationEmail(email);

    console.log(`✅ Licencia activada: ${email} | ${info.licenseType} | vence: ${newExpDate}`);
}

// ── Email de activación ───────────────────────────────────────────────────────
async function sendActivationEmail(email) {
    const apiKey = process.env.FIREBASE_API_KEY;
    if (!apiKey) return;

    try {
        const res = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
            {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ requestType: 'PASSWORD_RESET', email }),
            }
        );
        if (res.ok) console.log(`[culqi-webhook] Email enviado a: ${email}`);
        else        console.warn('[culqi-webhook] Error email:', (await res.json())?.error?.message);
    } catch (err) {
        console.warn('[culqi-webhook] sendActivationEmail error:', err?.message);
    }
}

// ── Verificar firma Culqi ─────────────────────────────────────────────────────
function verifySignature(event, secret) {
    try {
        const signature = event.headers['x-culqi-signature'] || '';
        if (!signature) return true; // si no viene firma, aceptar (desarrollo)

        const payload  = event.body || '';
        const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
        const received = Buffer.from(signature, 'hex');
        const expected2 = Buffer.from(expected, 'hex');

        if (received.length !== expected2.length) return false;
        return crypto.timingSafeEqual(received, expected2);
    } catch {
        return false;
    }
}
