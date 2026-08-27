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

// Suma de meses que no desborda al mes siguiente cuando el día no existe en el
// destino (31 de enero + 1 mes → 28 de febrero, no 3 de marzo).
const { sumarMeses } = require('./fechas');
const { isCorporateDomain } = require('./personal-email-domains');
const { sendEmail } = require('./mailer');

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
    //
    // La licencia previa se lee SIEMPRE, tanto si hace falta para calcular la
    // fecha como si no: el paso 6 la necesita para saber si este es el primer
    // pago de esta persona y decidir si le manda el correo de activación.
    const [expSnap, licTypeSnap] = await Promise.all([
        db.ref(`users_v2/${uid}/expirationDate`).once('value'),
        db.ref(`users_v2/${uid}/licenseType`).once('value'),
    ]);
    const currentExp = expSnap.val();
    const existingLicType = licTypeSnap.val();

    let newExpDate;
    if (info.expiresAt && !isNaN(Date.parse(info.expiresAt))) {
        newExpDate = new Date(info.expiresAt).toISOString();
    } else {
        let baseDate = new Date();
        if (currentExp && existingLicType !== 'Trial') {
            const existing = new Date(currentExp);
            if (existing > now) baseDate = existing;
        }
        // Recorta el día al final del mes en vez de desbordarlo: 31 de enero
        // + 1 mes es 28 de febrero, no 3 de marzo. Ver _lib/fechas.js.
        newExpDate = sumarMeses(baseDate, info.months || 1).toISOString();
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
        // Canal de empresa: si el correo es de un dominio corporativo, marcarlo
        // para el seguimiento comercial (planes por asientos). No afecta la licencia.
        ...(isCorporateDomain(email) && { accountType: 'corporate', company: email.split('@')[1] }),
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

    // 6) Email de activación al usuario nuevo O en su primer pago
    //
    // Antes bastaba con `isNewUser`, y eso dejaba fuera un caso real: la cuenta
    // de un comprador puede existir ya con una CONTRASEÑA ALEATORIA que él
    // nunca vio — la crea este mismo archivo (y culqi-webhook) con
    // crypto.randomBytes cuando llega un pago de alguien sin cuenta. Si aquel
    // correo de activación se perdió y ahora compra por la vía internacional,
    // no recibía nada: licencia activa y sin poder entrar a su cuenta.
    //
    // Mismo criterio que culqi-webhook. Mandar un correo de más aquí es barato;
    // no mandarlo deja a un cliente que ya pagó sin forma de entrar.
    if (isNewUser || !currentExp) await sendActivationEmail(email);

    // 7) Canal de empresa: avisar a soporte cuando COMPRA alguien de un dominio
    // corporativo (lead de mayor valor que un trial: ya pagó → oportunidad de
    // vender asientos para el resto del equipo). Solo en el primer pago.
    if (isCorporateDomain(email) && (isNewUser || !currentExp)) {
        await sendEmail({
            to:      'soporte@bimsaddin.com',
            subject: `💰🏢 Compra corporativa en BIMS: @${email.split('@')[1]}`,
            html:    `<!DOCTYPE html><html><body style="font-family:Segoe UI,system-ui,sans-serif;color:#1f2937;line-height:1.6;">
<p><strong>Un correo corporativo acaba de COMPRAR una licencia.</strong></p>
<ul>
  <li>Correo: <strong>${email}</strong></li>
  <li>Dominio: <strong>@${email.split('@')[1]}</strong></li>
  <li>Plan: <strong>${info.licenseType} / ${info.plan || '—'}</strong> · ${info.gateway || ''}</li>
</ul>
<p>Es el mejor momento para ofrecer un <strong>plan de equipo</strong> (más asientos para su oficina).</p>
</body></html>`,
            replyTo: email,
        }).catch(e => console.warn('[provision] aviso compra corporativa falló:', e.message));
    }

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
