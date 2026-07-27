// ── culqi-webhook.js ──────────────────────────────────────────────────────────
// Recibe y procesa eventos webhook de Culqi.
// Activa/renueva licencias en Firebase según el evento.
//
// VERIFICACIÓN: Culqi v2 NO firma webhooks con header de hash. La autenticidad
// se valida consultando la API de Culqi con el chargeId/subscriptionId del
// payload usando CULQI_SECRET_KEY (que sólo tu backend conoce). Si Culqi
// confirma que el cargo existe y está exitoso, el webhook es legítimo.
//
// IMPORTANTE — fuente de verdad: del body del webhook se toma ÚNICAMENTE el
// `id` (para consultarlo). TODO lo que determina la licencia —email, plan,
// meses, maxDevices, importe— sale del objeto que devuelve la API de Culqi.
// Antes se verificaba el id pero se provisionaba con el body: bastaba con
// conocer un chr_ válido (p. ej. de una compra propia) para reenviar un webhook
// forjado con `metadata.months: 120` y otro email, y obtener una licencia
// arbitraria. El endpoint es público y no puede autenticarse, así que la única
// defensa posible es no confiar en nada del cuerpo.
// ─────────────────────────────────────────────────────────────────────────────

const crypto = require('crypto');
const admin  = require('firebase-admin');
const { maskEmail, addMonths } = require('./_lib/log-safe');
const { getPlanItem, maxDevicesFor, licenseTypeForMonths } = require('./_lib/culqi-plans');

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

    console.log(`[culqi-webhook] Evento: "${type}" | object: "${objectType}" | id: ${object.id}`);

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

    // `trusted` es el objeto tal y como lo tiene Culqi (no el del body). A partir
    // de aquí NADA se lee de `object` salvo para decidir la RUTA del evento.
    let trusted = null;
    if (isCharge)         trusted = await verifyChargeWithCulqi(object.id);
    else if (isSubEvent)  trusted = await verifySubscriptionWithCulqi(object.id);
    else                  console.warn(`[culqi-webhook] Tipo desconocido para verificar: id=${object.id}`);

    if (!trusted) {
        console.warn(`[culqi-webhook] Verificación de Culqi API falló para id=${object.id} — descartado`);
        return { statusCode: 200, body: '' };
    }
    console.log(`[culqi-webhook] ✓ Verificado contra API Culqi: ${object.id}`);

    try {
        // El estado de la suscripción también se toma del objeto verificado: un
        // body forjado no puede hacer pasar por activa una suscripción cancelada
        // (ni al revés).
        const trustedStatus = trusted.status || '';

        const isCancel = type === 'subscription.cancel.succeeded'
                      || trustedStatus === 'canceled'
                      || trustedStatus === 'cancelled';

        const isSub = !isCancel && (
                      type === 'subscription.creation.succeeded'
                   || type === 'subscription.update.succeeded'
                   || objectType === 'subscription'
                   || isSubEvent);

        if (isCharge)       await handleCharge(trusted);
        else if (isCancel)  await handleCancellation(trusted);
        else if (isSub)     await handleSubscription(trusted);
        else                console.log(`[culqi-webhook] Evento no manejado: type="${type}" object="${objectType}"`);

    } catch (err) {
        console.error('[culqi-webhook] Error procesando evento:', err?.message || err);
    }

    return { statusCode: 200, body: '' };
};

// ── Verificación contra API de Culqi ──────────────────────────────────────────
// Devuelven el OBJETO de Culqi (fuente de verdad) o null si no se pudo validar.
// No devuelven un booleano a propósito: quien llama debe quedarse con el objeto
// verificado, no con el del body (ver nota de seguridad en la cabecera).

// Sanea el id antes de meterlo en la URL: sólo el formato que emite Culqi.
// Evita que un id con '../' o query se convierta en otra ruta de la API.
function isValidCulqiId(id, prefix) {
    return typeof id === 'string' && new RegExp(`^${prefix}[A-Za-z0-9_-]{1,64}$`).test(id);
}

async function verifyChargeWithCulqi(chargeId) {
    if (!isValidCulqiId(chargeId, 'chr_')) {
        console.warn('[culqi-webhook] charge id con formato inválido — descartado');
        return null;
    }
    try {
        const response = await fetch(`https://api.culqi.com/v2/charges/${chargeId}`, {
            headers: { 'Authorization': `Bearer ${process.env.CULQI_SECRET_KEY}` },
        });
        if (!response.ok) {
            console.warn(`[culqi-webhook] Culqi API charge ${chargeId}: HTTP ${response.status}`);
            return null;
        }
        const data = await response.json();
        const outcomeType = data?.outcome?.type;
        if (outcomeType !== 'venta_exitosa') {
            console.warn(`[culqi-webhook] Charge ${chargeId} outcome no exitoso: ${outcomeType}`);
            return null;
        }
        return data;
    } catch (err) {
        console.error('[culqi-webhook] verifyCharge exception:', err?.message || err);
        return null;
    }
}

// Aceptamos cualquier estado (active/canceled): el handler decide qué hacer
// según el `status` DEL OBJETO VERIFICADO, no según el del body.
async function verifySubscriptionWithCulqi(subId) {
    if (!isValidCulqiId(subId, 'sxn_')) {
        console.warn('[culqi-webhook] subscription id con formato inválido — descartado');
        return null;
    }
    try {
        const response = await fetch(`https://api.culqi.com/v2/subscriptions/${subId}`, {
            headers: { 'Authorization': `Bearer ${process.env.CULQI_SECRET_KEY}` },
        });
        if (!response.ok) {
            console.warn(`[culqi-webhook] Culqi API subscription ${subId}: HTTP ${response.status}`);
            return null;
        }
        return await response.json();
    } catch (err) {
        console.error('[culqi-webhook] verifySubscription exception:', err?.message || err);
        return null;
    }
}

// ── Cobro único ───────────────────────────────────────────────────────────────
// `charge` es el objeto VERIFICADO que devolvió la API de Culqi. Su `metadata`
// la escribió culqi-charge.js al crear el cobro, así que es de confianza para
// identificar QUÉ se compró (plan + duración) — pero los TÉRMINOS de la licencia
// (meses, dispositivos) se derivan del catálogo del servidor, nunca de la
// metadata, y se comprueba que el importe cobrado sea el del catálogo.
async function handleCharge(charge) {
    const email    = charge.email;
    const meta     = charge.metadata || {};
    const plan     = meta.plan     || 'individual';
    const duration = meta.duration || '1m';

    if (!email) { console.warn('[culqi-webhook] Charge sin email'); return; }

    const item = getPlanItem(plan, duration);
    if (!item) {
        console.warn(`[culqi-webhook] Charge ${charge.id}: plan/duración fuera de catálogo (plan="${plan}", duration="${duration}") — descartado`);
        return;
    }

    // El importe realmente cobrado debe coincidir con el del catálogo. Si no,
    // algo se manipuló entre la creación del cobro y el webhook: no provisionar.
    if (Number(charge.amount) !== item.amount) {
        console.warn(`[culqi-webhook] Charge ${charge.id}: importe ${charge.amount} ≠ catálogo ${item.amount} para ${plan}/${duration} — descartado`);
        return;
    }

    await activateLicense(email, {
        licenseType: licenseTypeForMonths(item.months),
        months:      item.months,
        maxDevices:  maxDevicesFor(plan),
        chargeId:    charge.id,
        plan, duration,
        amount:      charge.amount,
        paymentType: 'onetime',
    });
}

// ── Suscripción activa/renovada ───────────────────────────────────────────────
// `sub` es el objeto VERIFICADO de la API de Culqi. El plan se acepta sólo si
// existe en el catálogo; los dispositivos salen del catálogo, no de la metadata.
async function handleSubscription(sub) {
    const email = sub.metadata?.email || sub.email;
    const plan  = sub.metadata?.plan  || 'individual';

    if (!email) { console.warn('[culqi-webhook] Subscription sin email'); return; }

    // Las suscripciones de Culqi son siempre mensuales (ver culqi-subscription.js).
    if (!getPlanItem(plan, '1m')) {
        console.warn(`[culqi-webhook] Subscription ${sub.id}: plan "${plan}" fuera de catálogo — descartado`);
        return;
    }

    await activateLicense(email, {
        licenseType:    'Monthly',
        months:         1,
        maxDevices:     maxDevicesFor(plan),
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
        console.log(`[culqi-webhook] Suscripción cancelada: ${maskEmail(email)}`);
    } catch (err) {
        console.warn('[culqi-webhook] No se pudo cancelar:', err?.message);
    }
}

// ── Activar / extender licencia en Firebase ───────────────────────────────────
async function activateLicense(email, info) {
    let uid, isNewUser = false;

    try {
        uid = (await auth.getUserByEmail(email)).uid;
        console.log(`[culqi-webhook] Usuario existente: ${maskEmail(email)} | uid: ${uid}`);
    } catch (authErr) {
        console.log(`[culqi-webhook] Usuario no encontrado (${authErr.code}), creando: ${maskEmail(email)}`);
        const newUser = await auth.createUser({
            email,
            password:      crypto.randomBytes(14).toString('base64url'),
            emailVerified: false,
            displayName:   email.split('@')[0],
        });
        uid = newUser.uid;
        isNewUser = true;
        console.log(`[culqi-webhook] Usuario creado: ${maskEmail(email)} | uid: ${uid}`);
    }

    if (!uid) {
        console.error(`[culqi-webhook] uid vacío para ${maskEmail(email)} — abortando`);
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

    // addMonths (no setMonth): comprar un 31 daba el 2-3 del mes siguiente al
    // siguiente, porque "31 de febrero" se normaliza hacia adelante.
    const newExpDate = addMonths(baseDate, info.months).toISOString();

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

    console.log(`✅ Licencia activada: ${maskEmail(email)} | ${info.licenseType} | vence: ${newExpDate}`);
}

// ── Email de activación ───────────────────────────────────────────────────────
async function sendActivationEmail(email) {
    // FIREBASE_API_KEY es la misma clave pública usada en el frontend.
    // Fail-fast si no está configurada — evita reintroducir un fallback hardcoded
    // que sobreviva silenciosamente a rotaciones de credenciales.
    const apiKey = process.env.FIREBASE_API_KEY;
    if (!apiKey) {
        console.warn('[culqi-webhook] FIREBASE_API_KEY no configurado — email no enviado');
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
            console.log(`[culqi-webhook] Email de activación enviado a: ${maskEmail(email)}`);
        } else {
            console.warn(`[culqi-webhook] Error email Firebase (${res.status}):`, JSON.stringify(resData?.error));
        }
    } catch (err) {
        console.warn('[culqi-webhook] sendActivationEmail error:', err?.message);
    }
}
