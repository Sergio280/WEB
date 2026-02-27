/**
 * POST /api/webhook
 *
 * Recibe las notificaciones IPN de MercadoPago y activa / extiende
 * la licencia del usuario en Firebase Realtime Database.
 *
 * Eventos manejados:
 *   - payment                       → pago único aprobado
 *   - preapproval                   → suscripción mensual autorizada
 *   - subscription_authorized_payment → cargo mensual renovado
 *
 * Flujo:
 *   1. Verificar firma del webhook (si MP_WEBHOOK_SECRET está configurado)
 *   2. Consultar detalles del pago/suscripción en la API de MP
 *   3. Buscar al usuario en Firebase Auth por email
 *      → Si no existe: crear usuario y enviar email de activación
 *   4. Calcular nueva ExpirationDate (extiende si ya hay licencia vigente)
 *   5. Escribir en Firebase: IsActive, LicenseType, ExpirationDate, MaxDevices
 *   6. Registrar el pago en users/{uid}/payments/{paymentId}
 */

const crypto = require('crypto');
const { MercadoPagoConfig, Payment, PreApproval } = require('mercadopago');
const admin = require('firebase-admin');

// ── Inicializar Firebase Admin (singleton) ────────────────────────────────────
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

// ── Cliente MP ────────────────────────────────────────────────────────────────
const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
    options: { timeout: 8000 },
});

// ── Tablas de conversión ──────────────────────────────────────────────────────
const DURATION_MONTHS = { '1m': 1, '3m': 3, '6m': 6, '12m': 12 };
const DURATION_LICENSE = { '1m': 'Monthly', '3m': 'Monthly', '6m': 'Monthly', '12m': 'Annual' };
const PLAN_MAX_DEVICES = { individual: 1, profesional: 3 };

// ── Handler principal ─────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
    // MP espera 200 rápido; el procesamiento ocurre después
    res.status(200).end();

    if (req.method !== 'POST') return;

    try {
        // ── Verificar firma (si está configurada) ─────────────────────────────
        if (process.env.MP_WEBHOOK_SECRET) {
            if (!verifySignature(req, process.env.MP_WEBHOOK_SECRET)) {
                console.warn('[webhook] Firma inválida — descartado');
                return;
            }
        }

        // ── Determinar topic e id ─────────────────────────────────────────────
        // MP envía en dos formatos: body JSON (nuevo) o query params (legacy IPN)
        const body  = req.body || {};
        const topic = body.type || req.query.topic || '';
        const id    = String(body.data?.id || req.query.id || '');

        if (!topic || !id) {
            console.warn('[webhook] Sin topic/id:', { topic, id });
            return;
        }

        console.log(`[webhook] Evento recibido: topic=${topic} id=${id}`);

        if (topic === 'payment') {
            await handlePayment(id);
        } else if (topic === 'preapproval' || topic === 'subscription_preapproval') {
            await handleSubscription(id);
        } else if (topic === 'subscription_authorized_payment') {
            await handleSubscriptionRenewal(id);
        }

    } catch (err) {
        console.error('[webhook] Error no capturado:', err?.message || err);
    }
};

// ── Pago único ────────────────────────────────────────────────────────────────
async function handlePayment(paymentId) {
    const paymentAPI = new Payment(mpClient);
    const payment    = await paymentAPI.get({ id: paymentId });

    if (payment.status !== 'approved') {
        console.log(`[webhook] Pago ${paymentId} no aprobado (status=${payment.status})`);
        return;
    }

    // Decodificar external_reference: { e, p, d }
    let ref;
    try { ref = JSON.parse(payment.external_reference || '{}'); } catch { ref = {}; }

    const email    = ref.e;
    const plan     = ref.p || 'individual';
    const duration = ref.d || '1m';

    if (!email) {
        console.warn('[webhook] Pago sin email en external_reference:', payment.external_reference);
        return;
    }

    const months      = DURATION_MONTHS[duration] || 1;
    const licenseType = DURATION_LICENSE[duration] || 'Monthly';
    const maxDevices  = PLAN_MAX_DEVICES[plan]    || 1;

    await activateLicense(email, {
        licenseType,
        months,
        maxDevices,
        paymentId:   String(paymentId),
        plan,
        duration,
        amount:      payment.transaction_amount,
        currency:    payment.currency_id,
        paymentType: 'onetime',
    });
}

// ── Suscripción nueva autorizada ──────────────────────────────────────────────
async function handleSubscription(preapprovalId) {
    const preAPI  = new PreApproval(mpClient);
    const presub  = await preAPI.get({ id: preapprovalId });

    if (presub.status !== 'authorized') {
        console.log(`[webhook] Suscripción ${preapprovalId} no autorizada (status=${presub.status})`);
        return;
    }

    const email  = presub.payer_email;
    if (!email) {
        console.warn('[webhook] Suscripción sin payer_email');
        return;
    }

    // Inferir plan por monto
    const amount     = presub.auto_recurring?.transaction_amount || 0;
    const plan       = amount >= 25 ? 'profesional' : 'individual';
    const maxDevices = PLAN_MAX_DEVICES[plan];

    await activateLicense(email, {
        licenseType:    'Monthly',
        months:         1,
        maxDevices,
        preapprovalId:  String(preapprovalId),
        plan,
        amount,
        currency:       presub.auto_recurring?.currency_id || 'USD',
        paymentType:    'subscription',
    });
}

// ── Renovación mensual de suscripción ────────────────────────────────────────
async function handleSubscriptionRenewal(authorizedPaymentId) {
    // El authorized_payment tiene referencia al preapproval padre
    const endpoint = `https://api.mercadopago.com/v1/subscription_authorized_payments/${authorizedPaymentId}`;
    const mpRes    = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    });

    if (!mpRes.ok) {
        console.warn('[webhook] No se pudo obtener authorized_payment:', authorizedPaymentId);
        return;
    }

    const data          = await mpRes.json();
    const preapprovalId = data.preapproval_id;
    const status        = data.status;

    if (status !== 'processed') {
        console.log(`[webhook] Renovación ${authorizedPaymentId} no procesada (${status})`);
        return;
    }

    // Reusar lógica de suscripción para extender 1 mes más
    if (preapprovalId) await handleSubscription(preapprovalId);
}

// ── Activar / extender licencia en Firebase ───────────────────────────────────
async function activateLicense(email, info) {
    // 1. Buscar o crear usuario en Firebase Auth
    let uid;
    let isNewUser = false;

    try {
        const userRecord = await auth.getUserByEmail(email);
        uid = userRecord.uid;
    } catch {
        // Usuario no existe → crear con contraseña temporal
        const tempPass   = crypto.randomBytes(14).toString('base64url');
        const newUser    = await auth.createUser({
            email,
            password:      tempPass,
            emailVerified: false,
            displayName:   email.split('@')[0],
        });
        uid       = newUser.uid;
        isNewUser = true;
        console.log(`[webhook] Usuario creado: ${email} (uid=${uid})`);
    }

    // 2. Calcular nueva ExpirationDate
    //    Si tiene licencia vigente → extender desde su vencimiento actual
    const expSnap   = await db.ref(`users/${uid}/ExpirationDate`).once('value');
    const currentExp = expSnap.val();

    const now      = new Date();
    let   baseDate = new Date();

    if (currentExp) {
        const existingExp = new Date(currentExp);
        if (existingExp > now) baseDate = existingExp; // extender desde el vencimiento
    }

    baseDate.setMonth(baseDate.getMonth() + info.months);
    const newExpDate = baseDate.toISOString();

    // 3. Actualizar registro en Realtime Database
    const updates = {
        Email:          email,
        IsActive:       true,
        LicenseType:    info.licenseType,
        ExpirationDate: newExpDate,
        MaxDevices:     info.maxDevices,
        UpdatedAt:      now.toISOString(),
    };

    // Si es usuario nuevo, inicializar campos base
    if (isNewUser) {
        updates.CreatedAt       = now.toISOString();
        updates.ValidationCount = 0;
        updates.activations     = {};
    }

    await db.ref(`users/${uid}`).update(updates);

    // 4. Registrar el pago en el historial
    if (info.paymentId) {
        await db.ref(`users/${uid}/payments/${info.paymentId}`).set({
            plan:        info.plan,
            duration:    info.duration || null,
            amount:      info.amount   || 0,
            currency:    info.currency || 'USD',
            date:        now.toISOString(),
            type:        info.paymentType,
        });
    }

    // 5. Guardar datos de la suscripción activa (para gestión y renovaciones)
    if (info.preapprovalId) {
        await db.ref(`users/${uid}/subscription`).set({
            preapprovalId: info.preapprovalId,
            plan:          info.plan,
            status:        'authorized',
            lastRenewal:   now.toISOString(),
            nextBilling:   newExpDate,
        });
    }

    // 6. Si es usuario nuevo, enviar email de activación vía Firebase Auth REST
    if (isNewUser) {
        await sendActivationEmail(email);
    }

    console.log(
        `✅ [webhook] Licencia activada: ${email} | ` +
        `${info.licenseType} | ${info.months}m | vence: ${newExpDate}`
    );
}

// ── Enviar email de activación ────────────────────────────────────────────────
async function sendActivationEmail(email) {
    try {
        // Firebase Auth REST API: envía el email de "restablecer contraseña"
        // con la plantilla configurada en Firebase Console → Authentication → Templates
        const apiKey = process.env.FIREBASE_API_KEY;
        if (!apiKey) {
            console.warn('[webhook] FIREBASE_API_KEY no configurada — email no enviado');
            return;
        }

        const res = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
            {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                    requestType: 'PASSWORD_RESET',
                    email,
                }),
            }
        );

        if (res.ok) {
            console.log(`[webhook] Email de activación enviado a: ${email}`);
        } else {
            const err = await res.json();
            console.warn('[webhook] Error enviando email:', err?.error?.message);
        }
    } catch (err) {
        console.warn('[webhook] Error en sendActivationEmail:', err?.message);
    }
}

// ── Verificar firma de webhook MP ─────────────────────────────────────────────
function verifySignature(req, secret) {
    try {
        const xSignature  = req.headers['x-signature']  || '';
        const xRequestId  = req.headers['x-request-id'] || '';

        if (!xSignature) return true; // MP antiguo no firma

        const parts = Object.fromEntries(
            xSignature.split(',').map(p => p.trim().split('='))
        );
        const ts   = parts.ts  || '';
        const hash = parts.v1  || '';

        const id       = req.body?.data?.id || req.query?.id || '';
        const manifest = `id:${id};request-id:${xRequestId};ts:${ts};`;
        const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

        return crypto.timingSafeEqual(
            Buffer.from(hash,     'hex'),
            Buffer.from(expected, 'hex')
        );
    } catch {
        return false;
    }
}
