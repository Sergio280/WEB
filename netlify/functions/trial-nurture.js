// ── trial-nurture.js ─────────────────────────────────────────────────────────
// Función PROGRAMADA (scheduled, @daily) que envía la secuencia de correos del
// trial: día 3 (activación de valor), día 7 (chequeo) y día 12 (cierre).
//
// El correo de bienvenida (día 0) NO lo manda este cron: lo envía
// create-trial-license.js al registrarse. Aquí solo van los seguimientos.
//
// Idempotencia:
//   Cada hito enviado se marca en users_v2/{uid}/trialMeta/nurture/{key}. En la
//   siguiente corrida ya no se reenvía. La marca se escribe SOLO si Resend aceptó
//   el envío (o lo omitió por falta de API key), nunca ante un fallo de red.
//
// Robustez de orden (si el cron estuvo caído varios días):
//   Por usuario se envía UN SOLO hito por corrida — el MÁS RECIENTE que ya venció
//   y sigue pendiente — y los hitos anteriores pendientes se marcan como
//   "omitidos" (skipped) para que un correo viejo (ej. "empieza por Encofrado")
//   nunca llegue tarde y fuera de contexto. Así, en el flujo normal (cron diario)
//   cada quien recibe día 3, luego 7, luego 12; y ante una caída se recupera con
//   el correo correcto a su etapa actual.
//
// Programación: ver netlify.toml → [functions."trial-nurture"] schedule.
// ─────────────────────────────────────────────────────────────────────────────

const admin = require('firebase-admin');
const { sendEmail }     = require('./_lib/mailer');
const { getTrialEmail } = require('./_lib/trial-emails');

// ── Init Firebase Admin (singleton, idéntico a las otras functions) ──────────
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

const db = admin.database();

// Hitos de la secuencia. threshold = días desde el registro para que venza;
// maxAge = tope superior para no enviar un hito ya sin sentido (p.ej. el día 12
// no tiene sentido pasada la expiración del trial de 14 días).
const MILESTONES = [
    { key: 'day3',  threshold: 3,  maxAge: Infinity },
    { key: 'day7',  threshold: 7,  maxAge: Infinity },
    { key: 'day12', threshold: 12, maxAge: 15 },  // trial vence a los 14; +1 de gracia
];

const DAY_MS = 86400 * 1000;

exports.handler = async function () {
    let snapshot;
    try {
        snapshot = await db.ref('users_v2').once('value');
    } catch (e) {
        console.error('[trial-nurture] error leyendo users_v2:', e.message);
        return { statusCode: 500, body: 'db read error' };
    }

    const now = Date.now();
    let sent = 0, skipped = 0, scanned = 0;

    const users = snapshot.val() || {};
    for (const [uid, rec] of Object.entries(users)) {
        if (!rec || rec.licenseType !== 'Trial') continue;         // solo licencias de tipo Trial
        const meta = rec.trialMeta || {};
        const createdIso = meta.createdAt || rec.createdAt;
        if (!createdIso) continue;
        const createdMs = Date.parse(createdIso);
        if (Number.isNaN(createdMs)) continue;

        // No nutrir trials YA VENCIDOS: mandarle "vas por la mitad de tus 14 días"
        // o "termina en 2 días" a alguien cuyo trial expiró hace semanas es
        // incorrecto y confunde. Los seguimientos solo tienen sentido durante el
        // trial activo (el día 12 igual cae 2 días antes de expirar, dentro de plazo).
        const expIso = rec.expirationDate || rec.ExpirationDate;
        const expMs  = expIso ? Date.parse(expIso) : NaN;
        if (!Number.isNaN(expMs) && expMs <= now) continue;

        scanned++;
        const ageDays  = (now - createdMs) / DAY_MS;
        const nurture  = meta.nurture || {};
        const lang     = meta.lang === 'en' ? 'en' : 'es';
        const email    = rec.email;
        if (!email) continue;

        // Hitos que ya vencieron, están dentro de su ventana y aún no se enviaron.
        const due = MILESTONES.filter(m =>
            ageDays >= m.threshold && ageDays <= m.maxAge && !nurture[m.key]);
        if (due.length === 0) continue;

        // El más reciente (mayor threshold) es el que se envía; los anteriores
        // pendientes se marcan como omitidos para no mandarlos tarde.
        due.sort((a, b) => b.threshold - a.threshold);
        const target = due[0];
        const toSkip = due.slice(1);

        const mail = getTrialEmail(target.key, lang, { name: meta.name });
        if (!mail) continue;

        const res = await sendEmail({ to: email, subject: mail.subject, html: mail.html, replyTo: 'soporte@bimsaddin.com' });

        // Solo marcamos si el envío se aceptó (ok) o se omitió a propósito
        // (skipped = sin API key: no reintentar en bucle infinito). Ante fallo de
        // red/Resend, dejamos el hito pendiente para la próxima corrida.
        if (res && (res.ok || res.skipped)) {
            const nowIso  = new Date(now).toISOString();
            const updates = { [`users_v2/${uid}/trialMeta/nurture/${target.key}`]: nowIso };
            for (const m of toSkip) updates[`users_v2/${uid}/trialMeta/nurture/${m.key}`] = 'skipped';
            await db.ref().update(updates).catch(err =>
                console.warn('[trial-nurture] no se pudo marcar nurture:', err.message));
            if (res.ok) sent++;
            skipped += toSkip.length;
        }
    }

    console.log(`[trial-nurture] trials escaneados: ${scanned} · enviados: ${sent} · hitos omitidos: ${skipped}`);
    return { statusCode: 200, body: `sent ${sent}` };
};
