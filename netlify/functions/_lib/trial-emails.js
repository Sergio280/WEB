// ── _lib/trial-emails.js ─────────────────────────────────────────────────────
// Plantillas de la secuencia de correos del trial de 14 días (ES/EN).
//
// Secuencia:
//   welcome (día 0, al registrarse) — bienvenida + ayuda SmartScreen. EL más
//     importante: ~60% de los registros nunca instala porque Windows bloquea el
//     .exe; este correo los guía a "Más información → Ejecutar de todas formas".
//   day3  — activación de valor (qué comando probar primero).
//   day7  — chequeo a mitad de camino + oferta de soporte.
//   day12 — cierre: el trial termina en 2 días + garantía de 7 días.
//
// getTrialEmail(key, lang, { name }) → { subject, html }.
// Los textos NO inventan métricas: 22 min/6 h y la garantía de 7 días son datos
// ya publicados en la propia web. Enlaces a bimsaddin.com.
// ─────────────────────────────────────────────────────────────────────────────

const SITE      = 'https://bimsaddin.com';
const WHATSAPP  = 'https://wa.me/51989455558';
const BRAND     = '#1a6fe0';

// Escapa el nombre para no romper el HTML si trae < > & (viene del formulario).
function esc(s) {
    return String(s || '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Shell HTML común: cabecera con logo textual, cuerpo y pie. Estilos inline
// (los clientes de correo ignoran <style> y clases). Ancho 600px, responsive.
function shell(bodyHtml, footerNote) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#eef1f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a2233;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f7;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(20,40,90,.08);">
<tr><td style="background:${BRAND};padding:22px 32px;">
<span style="color:#fff;font-size:22px;font-weight:800;letter-spacing:.5px;">BIMS</span>
<span style="color:rgba(255,255,255,.75);font-size:13px;"> · Add-in para Autodesk Revit</span>
</td></tr>
<tr><td style="padding:32px;font-size:15px;line-height:1.65;color:#2a3648;">
${bodyHtml}
</td></tr>
<tr><td style="padding:18px 32px;background:#f6f8fc;border-top:1px solid #e6ebf3;font-size:12px;line-height:1.5;color:#7a879c;">
${footerNote}
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function btn(href, label) {
    return `<a href="${href}" style="display:inline-block;background:${BRAND};color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 26px;border-radius:10px;">${label}</a>`;
}

// ── Contenido por (idioma, clave) ────────────────────────────────────────────
const T = {
    es: {
        footer: `Recibes este correo porque iniciaste una prueba gratuita de BIMS.<br>¿Dudas? Responde este correo o escríbenos a soporte@bimsaddin.com`,
        welcome: (n) => ({
            subject: 'Tu prueba de BIMS está lista — instálalo en 2 minutos (importante: Windows)',
            html: shell(`
<p style="margin:0 0 14px;">Hola ${n},</p>
<p style="margin:0 0 14px;">Tu prueba gratis de <strong>14 días</strong> ya está activa. Inicia sesión en BIMS con <strong>este mismo correo</strong> y la contraseña que elegiste.</p>
<p style="margin:0 0 22px;">${btn(SITE + '/#descargar', 'Descargar BIMS')}</p>
<div style="background:#fff8f0;border:1px solid #ffd9ad;border-radius:10px;padding:16px 18px;margin:0 0 18px;">
<p style="margin:0 0 8px;font-weight:700;color:#8a4b00;">⚠️ Windows mostrará un aviso azul de SmartScreen</p>
<p style="margin:0 0 8px;color:#6b4a1e;">Es normal en software nuevo y BIMS es 100% seguro. Para instalar:</p>
<p style="margin:0;color:#6b4a1e;">1. Haz clic en <strong>"Más información"</strong><br>2. Luego en <strong>"Ejecutar de todas formas"</strong></p>
</div>
<p style="margin:0 0 14px;color:#5a6a86;">Sin este paso, Windows bloquea la instalación — es el motivo #1 por el que la gente no llega a probar BIMS.</p>
<p style="margin:0;">¿Se traba algo? Respóndeme este correo o escríbeme por <a href="${WHATSAPP}" style="color:${BRAND};">WhatsApp</a> — te ayudo en minutos.</p>
<p style="margin:18px 0 0;">— Sergio, BIMS</p>`, T.es.footer),
        }),
        day3: (n) => ({
            subject: 'El comando que te ahorra la tarde entera en Revit',
            html: shell(`
<p style="margin:0 0 14px;">Hola ${n},</p>
<p style="margin:0 0 14px;">Si aún no lo probaste, empieza por <strong>Encofrado Automatizado</strong>: lo que a mano toma ~6 horas, BIMS lo hace en <strong>~22 minutos</strong>.</p>
<p style="margin:0 0 8px;">Otros favoritos:</p>
<ul style="margin:0 0 16px;padding-left:20px;color:#3a4a62;">
<li><strong>Exportar Planos a DWG</strong> con imágenes embebidas (OLE) — único en el mercado.</li>
<li><strong>Tarrajeo por Habitación</strong> — metrados listos en un clic.</li>
</ul>
<p style="margin:0 0 22px;">${btn(SITE + '/#video-demo', 'Ver la demo de 45 s')}</p>
<p style="margin:0;">¿Qué comando querías automatizar? Respóndeme y te digo si BIMS ya lo hace.</p>
<p style="margin:18px 0 0;">— Sergio, BIMS</p>`, T.es.footer),
        }),
        day7: (n) => ({
            subject: '¿Cómo va tu prueba de BIMS? (mitad de camino)',
            html: shell(`
<p style="margin:0 0 14px;">Hola ${n},</p>
<p style="margin:0 0 14px;">Vas por la mitad de tus 14 días. Una pregunta rápida: <strong>¿lograste correr tu primer comando en un proyecto real?</strong></p>
<p style="margin:0 0 14px;">Si sí — cuéntame qué tal salió.<br>Si te trabaste en algo (instalación, licencia, un comando) — respóndeme y lo resolvemos hoy. No quiero que pierdas tu prueba por un detalle técnico.</p>
<p style="margin:0;">— Sergio, BIMS</p>`, T.es.footer),
        }),
        day12: (n) => ({
            subject: 'Tu prueba de BIMS termina en 2 días',
            html: shell(`
<p style="margin:0 0 14px;">Hola ${n},</p>
<p style="margin:0 0 14px;">Tu acceso a BIMS vence en <strong>2 días</strong>. Si te sirvió, este es el momento de continuar sin cortar tu flujo de trabajo:</p>
<p style="margin:0 0 22px;">${btn(SITE + '/#precios', 'Ver planes')}</p>
<p style="margin:0 0 14px;">Recuerda: <strong>garantía de devolución del 100% en 7 días</strong>. Si compras y no te convence, te devolvemos todo — sin preguntas.</p>
<p style="margin:0;">¿Dudas antes de decidir? Respóndeme directamente.</p>
<p style="margin:18px 0 0;">— Sergio, BIMS</p>`, T.es.footer),
        }),
    },
    en: {
        footer: `You're receiving this because you started a free BIMS trial.<br>Questions? Just reply, or write to soporte@bimsaddin.com`,
        welcome: (n) => ({
            subject: 'Your BIMS trial is ready — install it in 2 minutes (important: Windows)',
            html: shell(`
<p style="margin:0 0 14px;">Hi ${n},</p>
<p style="margin:0 0 14px;">Your <strong>14-day</strong> free trial is active. Sign in to BIMS with <strong>this same email</strong> and the password you chose.</p>
<p style="margin:0 0 22px;">${btn(SITE + '/#descargar', 'Download BIMS')}</p>
<div style="background:#fff8f0;border:1px solid #ffd9ad;border-radius:10px;padding:16px 18px;margin:0 0 18px;">
<p style="margin:0 0 8px;font-weight:700;color:#8a4b00;">⚠️ Windows will show a blue SmartScreen warning</p>
<p style="margin:0 0 8px;color:#6b4a1e;">This is normal for new software and BIMS is 100% safe. To install:</p>
<p style="margin:0;color:#6b4a1e;">1. Click <strong>"More info"</strong><br>2. Then <strong>"Run anyway"</strong></p>
</div>
<p style="margin:0 0 14px;color:#5a6a86;">Without this step Windows blocks the install — it's the #1 reason people never get to try BIMS.</p>
<p style="margin:0;">Stuck on anything? Reply to this email or message me on <a href="${WHATSAPP}" style="color:${BRAND};">WhatsApp</a> — I'll help in minutes.</p>
<p style="margin:18px 0 0;">— Sergio, BIMS</p>`, T.en.footer),
        }),
        day3: (n) => ({
            subject: 'The one command that saves you a whole afternoon in Revit',
            html: shell(`
<p style="margin:0 0 14px;">Hi ${n},</p>
<p style="margin:0 0 14px;">If you haven't yet, start with <strong>Automated Formwork</strong>: what takes ~6 hours by hand, BIMS does in <strong>~22 minutes</strong>.</p>
<p style="margin:0 0 8px;">Other favorites:</p>
<ul style="margin:0 0 16px;padding-left:20px;color:#3a4a62;">
<li><strong>Export Sheets to DWG</strong> with embedded images (OLE) — one of a kind.</li>
<li><strong>Room Plastering</strong> — quantities ready in one click.</li>
</ul>
<p style="margin:0 0 22px;">${btn(SITE + '/#video-demo', 'Watch the 45s demo')}</p>
<p style="margin:0;">Which command were you hoping to automate? Reply and I'll tell you if BIMS already does it.</p>
<p style="margin:18px 0 0;">— Sergio, BIMS</p>`, T.en.footer),
        }),
        day7: (n) => ({
            subject: 'How is your BIMS trial going? (halfway there)',
            html: shell(`
<p style="margin:0 0 14px;">Hi ${n},</p>
<p style="margin:0 0 14px;">You're halfway through your 14 days. Quick question: <strong>did you manage to run your first command on a real project?</strong></p>
<p style="margin:0 0 14px;">If yes — tell me how it went.<br>If you got stuck on anything (install, license, a command) — reply and we'll fix it today. I don't want you to lose your trial over a technical detail.</p>
<p style="margin:0;">— Sergio, BIMS</p>`, T.en.footer),
        }),
        day12: (n) => ({
            subject: 'Your BIMS trial ends in 2 days',
            html: shell(`
<p style="margin:0 0 14px;">Hi ${n},</p>
<p style="margin:0 0 14px;">Your BIMS access expires in <strong>2 days</strong>. If it helped, now's the moment to keep going without breaking your workflow:</p>
<p style="margin:0 0 22px;">${btn(SITE + '/#precios', 'See plans')}</p>
<p style="margin:0 0 14px;">Remember: <strong>100% money-back guarantee within 7 days</strong>. If you buy and it's not for you, we refund everything — no questions.</p>
<p style="margin:0;">Questions before deciding? Just reply.</p>
<p style="margin:18px 0 0;">— Sergio, BIMS</p>`, T.en.footer),
        }),
    },
};

// Devuelve { subject, html } para la clave e idioma dados. Fallback a ES.
function getTrialEmail(key, lang, { name } = {}) {
    const L = T[lang === 'en' ? 'en' : 'es'];
    const builder = L[key];
    if (!builder) return null;
    // Nombre de cortesía: primer nombre si vino, si no "ingeniero(a)"/"there".
    const safeName = name ? esc(name.split(/\s+/)[0]) : (lang === 'en' ? 'there' : 'ingeniero(a)');
    return builder(safeName);
}

module.exports = { getTrialEmail };
