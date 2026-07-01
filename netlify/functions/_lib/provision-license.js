// ── _lib/provision-license.js ─────────────────────────────────────────────────
// Provisión/renovación de licencias en Firebase, AGNÓSTICA de pasarela.
// La usa lemonsqueezy-webhook.js (y en el futuro podría migrarse culqi-webhook a
// ella). Replica la lógica probada de culqi-webhook `activateLicense`:
//   - busca/crea el usuario en Firebase Auth
//   - deduplica webhooks reintentados (por externalId o subscriptionId)
//   - calcula el vencimiento SIN acumular días de Trial gratuito
//   - escribe la licencia + registro de pago/suscripción
//   - envía email de activación (password reset) a usuarios nuevos / primer pago
//
// NO se modifica culqi-webhook.js para no arriesgar los pagos en vivo; esta es
// una implementación paralela y limpia para la nueva pasarela internacional.
// ─────────────────────────────────────────────────────────────────────────────

const crypto = require('crypto');
const admin  = require('firebase-admin');

// ── Firebase Admin (singleton, idéntico al resto de functions) ───────────────
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

// ── Provisiona / extiende una licencia ────────────────────────────────────────
// email: correo del comprador (viene del payload de la pasarela).
// info: {
//   gateway:        'lemonsqueezy' | 'culqi' | ...   (para el registro)
//   licenseType:    'Monthly' | 'Annual'
//   plan:           'individual' | 'profesional'
//   maxDevices:     number
//   paymentType:    'subscription' | 'onetime'
//   externalId:     id único de pago/orden/invoice (dedup)  [opcional]
//   subscriptionId: id de la suscripción (nodo subscription) [opcional]
//   expiresAt:      ISO exacto del vencimiento (ej. renews_at de LS) [opcional]
//   months:         nº de meses a sumar si NO se pasa expiresAt   [opcional]
//   amount, currency
// }
async function provisionLicense(email, info) {
    if (!email) { console.warn('[provision] sin email — abortado'); return; }

    const maxDevices = info.maxDevices || PLAN_MAX_DEVICES[info.plan] || 1;

    // 1) Buscar o crear el usuario de Firebase Auth
    let uid, isNewUser = false;
    try {
        uid = (await auth.getUserByEmail(email)).uid;
    } catch (e) {
        const newUser = await auth.createUser({
            email,
            password:      crypto.randomBytes(14).toString('base64url'),
            emailVerified: false,
            displayName:   email.split('@')[0],
        });
        uid = newUser.uid;
        isNewUser = true;
        console.log(`[provision] usuario creado: ${email} | uid=${uid}`);
    }
    if (!uid) { console.error(`[provision] uid vacío para ${email}`); return; }

    const now = new Date();

    // 2) Deduplicación de webhooks reintentados
    if (info.externalId) {
        const dup = await db.ref(`users_v2/${uid}/payments/${info.externalId}`).once('value');
        if (dup.val()) {
            console.log(`[provision] pago ${info.externalId} ya procesado — ignorado (dup)`);
            return;
        }
    }
    if (info.subscriptionId && !info.externalId) {
        // Sin externalId (ej. evento de suscripción sin invoice): dedup por tiempo.
        const subSnap = await db.ref(`users_v2/${uid}/subscription`).once('value');
        const subData = subSnap.val();
        if (subData?.subscriptionId === String(info.subscriptionId) && subData?.lastWebhookAt) {
            const diffMs = now - new Date(subData.lastWebhookAt);
            if (diffMs < 5 * 60 * 1000) {
                console.log(`[provision] sub ${info.subscriptionId} procesada hace ${Math.round(diffMs/1000)}s — ignorado (dup)`);
                return;
            }
        }
    }

    // 3) Calcular el vencimiento
    //    - Preferimos expiresAt explícito (ej. LS renews_at: fecha exacta del
    //      próximo cobro → alinea la licencia con la facturación real).
    //    - Si no, sumamos meses a la base, SIN acumular el Trial gratuito
    //      (un Trial no extiende; una licencia paga vigente sí).
    let newExpDate;
    if (info.expiresAt && !isNaN(Date.parse(info.expiresAt))) {
        newExpDate = new Date(info.expiresAt).toISOString();
    } else {
        const [expSnap, licTypeSnap] = await Promise.all([
            db.ref(`users_v2/${uid}/expirationDate`).once('value'),
            db.ref(`users_v2/${uid}/licenseType`).once('value'),
        ]);
        const currentExp = expSnap.val();
        const existingLicType = licTypeSnap.val();
        let baseDate = new Date();
        if (currentExp && existingLicType !== 'Trial') {
            const existing = new Date(currentExp);
            if (existing > now) baseDate = existing;
        }
        baseDate.setMonth(baseDate.getMonth() + (info.months || 1));
        newExpDate = baseDate.toISOString();
    }

    // 4) Escribir licencia
    const updates = {
        userId:         uid,
        email,
        isActive:       true,
        licenseType:    info.licenseType,
        expirationDate: newExpDate,
        maxDevices,
        maxActivations: maxDevices,
        updatedAt:      now.toISOString(),
        ...(isNewUser && { createdAt: now.toISOString(), validationCount: 0, activations: {} }),
    };
    await db.ref(`users_v2/${uid}`).update(updates);

    // 5) Registro de pago / suscripción
    if (info.externalId) {
        await db.ref(`users_v2/${uid}/payments/${info.externalId}`).set({
            gateway: info.gateway || 'lemonsqueezy',
            plan:    info.plan,
            amount:  info.amount || 0,
            currency: info.currency || 'USD',
            date:    now.toISOString(),
            type:    info.paymentType || 'subscription',
        });
    }
    if (info.subscriptionId) {
        await db.ref(`users_v2/${uid}/subscription`).set({
            gateway:        info.gateway || 'lemonsqueezy',
            subscriptionId: String(info.subscriptionId),
            plan:           info.plan,
            status:         'active',
            lastRenewal:    now.toISOString(),
            lastWebhookAt:  now.toISOString(),
            nextBilling:    newExpDate,
        });
    }

    // 6) Email de activación al usuario nuevo o primer pago
    if (isNewUser) await sendActivationEmail(email);

    console.log(`✅ [provision] licencia ${info.gateway}: ${email} | ${info.licenseType} | vence ${newExpDate}`);
}

// ── Cancelar / desactivar una suscripción ─────────────────────────────────────
async function cancelSubscription(email) {
    if (!email) return;
    try {
        const uid = (await auth.getUserByEmail(email)).uid;
        await db.ref(`users_v2/${uid}/subscription/status`).set('canceled');
        // No desactivamos isActive de inmediato: el usuario conserva acceso hasta
        // el vencimiento ya pagado (expirationDate). LS deja de renovar y la
        // licencia caduca sola en verify-license por fecha.
        console.log(`[provision] suscripción marcada cancelada: ${email}`);
    } catch (err) {
        console.warn('[provision] cancelSubscription:', err?.message);
    }
}

// ── Email de activación (password reset vía Identity Toolkit) ─────────────────
async function sendActivationEmail(email) {
    const apiKey = process.env.FIREBASE_API_KEY;
    if (!apiKey) { console.warn('[provision] FIREBASE_API_KEY no configurada — email no enviado'); return; }
    try {
        const res = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
            {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ requestType: 'PASSWORD_RESET', email }),
            }
        );
        if (res.ok) console.log(`[provision] email de activación enviado: ${email}`);
        else console.warn(`[provision] email Firebase HTTP ${res.status}`);
    } catch (err) {
        console.warn('[provision] sendActivationEmail:', err?.message);
    }
}

module.exports = { provisionLicense, cancelSubscription };
