// ── culqi-webhook.js ──────────────────────────────────────────────────────────
// Recibe y procesa eventos webhook de Culqi.
// Activa/renueva licencias en Firebase según el evento.
//
// VERIFICACIÓN: Culqi v2 NO firma webhooks con header de hash. La autenticidad
// se valida consultando la API de Culqi con el chargeId/subscriptionId del
// payload usando CULQI_SECRET_KEY (que sólo tu backend conoce). Si Culqi
// confirma que el cargo existe y está exitoso, el webhook es legítimo.
// ─────────────────────────────────────────────────────────────────────────────

const crypto = require('crypto');
const admin  = require('firebase-admin');

// ── Firebase Admin (singleton) ────────────────────────────────────────────────
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

const db   = admin.database();
const auth = admin.auth();

const PLAN_MAX_DEVICES = { individual: 1, profesional: 3 };

const DURATION_MONTHS = {
    '1m': 1, '3m': 3, '6m': 6, '12m': 12,
};

// ── Handler principal ─────────────────────────────────────────────────────────
exports.handler = async function (event) {
    if (event.httpMethod !== 'POST') return { statusCode: 200, body: '' };

    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { body = {}; }

    // Culqi v2 puede enviar el objeto directamente (sin wrapper type/data)
    // o con wrapper { type, data }
    const type   = body.type || '';
    let   object = body.data || {};
    if (typeof object === 'string') {
        try { object = JSON.parse(object); } catch { object = {}; }
    }

    // Si no hay wrapper, el body ES el objeto (charge o subscription)
    const isDirectObject = !type && body.object;
    const objectType     = isDirectObject ? body.object : null;
    if (isDirectObject) object = body;

    console.log(`[culqi-webhook] Evento: "${type}" | object: "${objectType}" | id: ${object.id} | email: ${object.email}`);

    // ── Verificar autenticidad consultando la API de Culqi ────────────────────
    // En lugar de validar un hash en headers (Culqi v2 no envía firma), validamos
    // que el id existe en la API de Culqi usando CULQI_SECRET_KEY. Si la API
    // confirma el objeto y su estado es válido, el webhook es legítimo.
    if (!object.id) {
        console.warn('[culqi-webhook] Webhook sin id en el body — descartado');
        return { statusCode: 200, body: '' };
    }

    if (!process.env.CULQI_SECRET_KEY) {
        console.error('[culqi-webhook] CULQI_SECRET_KEY no configurado — no se puede verificar webhook');
        return { statusCode: 200, body: '' };
    }

    const isCharge = type === 'charge.creation.succeeded'
                  || type === 'charge.capture.succeeded'
                  || objectType === 'charge'
                  || (object.id && object.id.startsWith('chr_'));

    const isSubEvent = type.startsWith('subscription.')
                    || objectType === 'subscription'
                    || (object.id && object.id.startsWith('sxn_'));

    let verified = false;
    if (isCharge)         verified = await verifyChargeWithCulqi(object.id);
    else if (isSubEvent)  verified = await verifySubscriptionWithCulqi(object.id);
    else                  console.warn(`[culqi-webhook] Tipo desconocido para verificar: id=${object.id}`);

    if (!verified) {
        console.warn(`[culqi-webhook] Verificación de Culqi API falló para id=${object.id} — descartado`);
        return { statusCode: 200, body: '' };
    }
    console.log(`[culqi-webhook] ✓ Verificado contra API Culqi: ${object.id}`);

    try {
        // Suscripciones activas/renovadas
        const isSub = type === 'subscription.creation.succeeded'
                   || type === 'subscription.update.succeeded'
                   || (objectType === 'subscription' && object.status !== 'canceled');

        // Cancelación
        const isCancel = type === 'subscription.cancel.succeeded'
                      || (objectType === 'subscription' && object.status === 'canceled');

        if (isCharge)       await handleCharge(object);
        else if (isCancel)  await handleCancellation(object);
        else if (isSub)     await handleSubscription(object);
        else                console.log(`[culqi-webhook] Evento no manejado: type="${type}" object="${objectType}"`);

    } catch (err) {
        console.error('[culqi-webhook] Error procesando evento:', err?.message || err);
    }

    return { statusCode: 200, body: '' };
};

// ── Verificación contra API de Culqi ──────────────────────────────────────────
// Si Culqi confirma el cargo con outcome venta_exitosa, el webhook es legítimo.
async function verifyChargeWithCulqi(chargeId) {
    if (!chargeId) return false;
    try {
        const response = await fetch(`https://api.culqi.com/v2/charges/${chargeId}`, {
            headers: { 'Authorization': `Bearer ${process.env.CULQI_SECRET_KEY}` },
        });
        if (!response.ok) {
            console.warn(`[culqi-webhook] Culqi API charge ${chargeId}: HTTP ${response.status}`);
            return false;
        }
        const data = await response.json();
        const outcomeType = data?.outcome?.type;
        if (outcomeType !== 'venta_exitosa') {
            console.warn(`[culqi-webhook] Charge ${chargeId} outcome no exitoso: ${outcomeType}`);
            return false;
        }
        return true;
    } catch (err) {
        console.error('[culqi-webhook] verifyCharge exception:', err?.message || err);
        return false;
    }
}

// Si Culqi confirma la suscripción, el webhook es legítimo. Aceptamos cualquier
// estado (active/canceled) porque el handler decide qué hacer según el tipo.
async function verifySubscriptionWithCulqi(subId) {
    if (!subId) return false;
    try {
        const response = await fetch(`https://api.culqi.com/v2/subscriptions/${subId}`, {
            headers: { 'Authorization': `Bearer ${process.env.CULQI_SECRET_KEY}` },
        });
        if (!response.ok) {
            console.warn(`[culqi-webhook] Culqi API subscription ${subId}: HTTP ${response.status}`);
            return false;
        }
        return true;
    } catch (err) {
        console.error('[culqi-webhook] verifySubscription exception:', err?.message || err);
        return false;
    }
}

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
        await db.ref(`users_v2/${uid}/subscription/status`).set('canceled');
        await db.ref(`users_v2/${uid}/isActive`).set(false);
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
        console.log(`[culqi-webhook] Usuario existente: ${email} | uid: ${uid}`);
    } catch (authErr) {
        console.log(`[culqi-webhook] Usuario no encontrado (${authErr.code}), creando: ${email}`);
        const newUser = await auth.createUser({
            email,
            password:      crypto.randomBytes(14).toString('base64url'),
            emailVerified: false,
            displayName:   email.split('@')[0],
        });
        uid = newUser.uid;
        isNewUser = true;
        console.log(`[culqi-webhook] Usuario creado: ${email} | uid: ${uid}`);
    }

    if (!uid) {
        console.error(`[culqi-webhook] uid vacío para ${email} — abortando`);
        return;
    }

    const now = new Date();

    // ── Fix: Deduplicación de webhooks ────────────────────────────────────────
    // Cobro único: chargeId es globalmente único en Culqi — si ya existe en
    // payments, el webhook es un reintento y se ignora para evitar extender
    // la licencia múltiples veces.
    if (info.chargeId) {
        const dup = await db.ref(`users_v2/${uid}/payments/${info.chargeId}`).once('value');
        if (dup.val()) {
            console.log(`[culqi-webhook] Cobro ${info.chargeId} ya procesado — ignorado (duplicado)`);
            return;
        }
    }

    // Suscripción: si el mismo subscriptionId fue procesado hace < 5 minutos,
    // es un reintento de Culqi — ignorar.
    if (info.subscriptionId) {
        const subSnap = await db.ref(`users_v2/${uid}/subscription`).once('value');
        const subData = subSnap.val();
        if (subData?.subscriptionId === info.subscriptionId && subData?.lastWebhookAt) {
            const diffMs = now - new Date(subData.lastWebhookAt);
            if (diffMs < 5 * 60 * 1000) {
                console.log(`[culqi-webhook] Subscription ${info.subscriptionId} ya procesada hace ${Math.round(diffMs / 1000)}s — ignorado (duplicado)`);
                return;
            }
        }
    }

    // ── Fix: Calcular expiración sin acumular días de Trial gratuito ──────────
    // Si el usuario tiene un Trial de BIMS en Firebase, la suscripción paga
    // arranca desde HOY (no desde el vencimiento del trial), evitando que
    // el usuario acumule ~60 días gratis (30 trial + 30 primer mes Culqi).
    // Las renovaciones de licencias pagas sí extienden desde la fecha actual.
    const expSnap     = await db.ref(`users_v2/${uid}/expirationDate`).once('value');
    const currentExp  = expSnap.val();
    const licTypeSnap = await db.ref(`users_v2/${uid}/licenseType`).once('value');
    const existingLicType = licTypeSnap.val();

    let baseDate = new Date();

    // Extender desde vencimiento actual SOLO si la licencia existente es paga
    if (currentExp && existingLicType !== 'Trial') {
        const existing = new Date(currentExp);
        if (existing > now) baseDate = existing;
    }

    baseDate.setMonth(baseDate.getMonth() + info.months);
    const newExpDate = baseDate.toISOString();

    console.log(`[culqi-webhook] Escribiendo licencia en: users_v2/${uid}`);
    console.log(`[culqi-webhook] Tipo previo: ${existingLicType || 'ninguno'} | Base: ${baseDate.toISOString()} | Nuevo venc.: ${newExpDate}`);

    const updates = {
        userId:         uid,
        email:          email,
        isActive:       true,
        licenseType:    info.licenseType,
        expirationDate: newExpDate,
        maxDevices:     info.maxDevices,
        maxActivations: info.maxDevices,
        updatedAt:      now.toISOString(),
        ...(isNewUser && { createdAt: now.toISOString(), validationCount: 0, activations: {} }),
    };

    await db.ref(`users_v2/${uid}`).update(updates);

    if (info.chargeId) {
        await db.ref(`users_v2/${uid}/payments/${info.chargeId}`).set({
            plan: info.plan, duration: info.duration || null,
            amount: info.amount || 0, currency: 'PEN',
            date: now.toISOString(), type: 'onetime',
        });
    }

    if (info.subscriptionId) {
        await db.ref(`users_v2/${uid}/subscription`).set({
            subscriptionId: info.subscriptionId,
            plan:           info.plan,
            status:         'active',
            lastRenewal:    now.toISOString(),
            lastWebhookAt:  now.toISOString(), // timestamp para deduplicación
            nextBilling:    newExpDate,
        });
    }

    // Enviar email si es usuario nuevo O si es su primer pago (sin historial previo)
    const shouldSendEmail = isNewUser || !currentExp;
    if (shouldSendEmail) await sendActivationEmail(email);

    console.log(`✅ Licencia activada: ${email} | ${info.licenseType} | vence: ${newExpDate}`);
}

// ── Email de activación ───────────────────────────────────────────────────────
async function sendActivationEmail(email) {
    // FIREBASE_API_KEY es la misma clave pública usada en el frontend
    const apiKey = process.env.FIREBASE_API_KEY || 'AIzaSyASlVvR9ub9krxDJcVfqnBw88_qLhIMKwM';
    if (!apiKey) {
        console.warn('[culqi-webhook] FIREBASE_API_KEY no configurado');
        return;
    }

    try {
        const res = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
            {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ requestType: 'PASSWORD_RESET', email }),
            }
        );

        const resData = await res.json();
        if (res.ok) {
            console.log(`[culqi-webhook] Email de activación enviado a: ${email}`);
        } else {
            console.warn(`[culqi-webhook] Error email Firebase (${res.status}):`, JSON.stringify(resData?.error));
        }
    } catch (err) {
        console.warn('[culqi-webhook] sendActivationEmail error:', err?.message);
    }
}
