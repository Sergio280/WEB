// ── _lib/mailer.js ───────────────────────────────────────────────────────────
// Envío de correos transaccionales vía Resend (https://resend.com).
//
// Por qué Resend: free tier generoso (3k/mes), verificación de dominio simple y
// API HTTP directa (sin SDK pesado que engorde el bundle de la function). Se
// llama con fetch nativo (Node 20 en Netlify ya lo trae).
//
// Requiere en Netlify:
//   RESEND_API_KEY   — API key de Resend (Settings → API Keys)
//   MAIL_FROM        — remitente verificado, ej. "Sergio de BIMS <soporte@bimsaddin.com>"
//                      (el dominio bimsaddin.com debe estar VERIFICADO en Resend:
//                       registros SPF/DKIM en el DNS, si no Resend rechaza el envío)
//
// Si RESEND_API_KEY no está configurada, sendEmail() no falla: registra un aviso
// y devuelve { skipped:true }. Así el registro de trial nunca se rompe por email.
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_FROM = 'BIMS <soporte@bimsaddin.com>';

// Envía un correo. Nunca lanza: devuelve { ok } | { skipped } | { ok:false, error }
// para que quien llama decida, pero jamás tumbe el flujo principal (registro/cron).
async function sendEmail({ to, subject, html, replyTo }) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.warn('[mailer] RESEND_API_KEY no configurada — email omitido:', subject);
        return { skipped: true };
    }
    if (!to || !subject || !html) {
        console.warn('[mailer] Falta to/subject/html — email omitido');
        return { skipped: true };
    }

    const payload = {
        from:    process.env.MAIL_FROM || DEFAULT_FROM,
        to:      [to],
        subject,
        html,
    };
    // Responder al correo llega directo a soporte (mejora la conversación 1-a-1).
    if (replyTo) payload.reply_to = replyTo;

    try {
        const r = await fetch('https://api.resend.com/emails', {
            method:  'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type':  'application/json',
            },
            body: JSON.stringify(payload),
        });
        if (!r.ok) {
            const text = await r.text().catch(() => '');
            console.error('[mailer] Resend rechazó el envío:', r.status, text.slice(0, 300));
            return { ok: false, error: `resend_${r.status}` };
        }
        const data = await r.json().catch(() => ({}));
        return { ok: true, id: data.id };
    } catch (e) {
        console.error('[mailer] Error de red enviando email:', e.message);
        return { ok: false, error: 'network' };
    }
}

module.exports = { sendEmail };
