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
//
// ESTÉTICA: identidad "dark premium" de BIMS (misma paleta que la web/plugin,
// tailwind.config.js): fondo ink `#060a14`, tarjeta ink-800 `#0e1525` con borde
// sutil, azul de marca `#2d7dff`, acento verde `#4ade80`. NADA de cabecera azul
// plana ni bordes azules "de plantilla" — se busca que se sienta parte de BIMS.
// Estilos 100% inline (los clientes de correo ignoran <style> y clases).
// ─────────────────────────────────────────────────────────────────────────────

const SITE     = 'https://bimsaddin.com';
const WHATSAPP  = 'https://wa.me/51989455558';

// Paleta BIMS (espejo de tailwind.config.js)
const C = {
    bg:        '#060a14',  // ink-950 — fondo base
    card:      '#0e1525',  // ink-800 — tarjeta
    cardEdge:  'rgba(255,255,255,.08)',
    head:      '#f2f6fc',  // títulos
    text:      '#c4cfdf',  // cuerpo
    muted:     '#7e8ba3',  // pie / secundario
    brand:     '#2d7dff',  // azul principal
    brandDk:   '#0f4d9e',
    brandSoft: '#7db3ff',  // enlaces sobre oscuro
    green:     '#4ade80',
    amber:     '#fbbf24',
    amberText: '#e8d6a8',  // texto ámbar legible sobre oscuro
};

// Escapa el nombre para no romper el HTML si trae < > & (viene del formulario).
function esc(s) {
    return String(s || '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Párrafo de cuerpo con el color/interlineado estándar (color explícito por
// elemento: algunos clientes no heredan bien el color del <td> contenedor).
function p(html, extra = '') {
    return `<p style="margin:0 0 15px;color:${C.text};font-size:15px;line-height:1.65;${extra}">${html}</p>`;
}

// Botón CTA: relleno con degradado de marca + glow sutil. Sin borde: el usuario
// rechaza los "bordes azules típicos"; esto se ve como un botón sólido premium.
function btn(href, label) {
    return `<a href="${href}" style="display:inline-block;background:linear-gradient(135deg,${C.brand},${C.brandDk});color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 30px;border-radius:11px;box-shadow:0 10px 26px -10px rgba(45,125,255,.6);">${label}</a>`;
}

// Aviso de SmartScreen en clave oscura (ámbar tenue sobre la tarjeta), no un
// recuadro claro con borde llamativo.
function warnBox(title, lines) {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 18px;">
<tr><td style="background:rgba(251,191,36,.07);border:1px solid rgba(251,191,36,.24);border-radius:12px;padding:16px 18px;">
<p style="margin:0 0 8px;color:${C.amber};font-size:14px;font-weight:700;">${title}</p>
${lines.map(l => `<p style="margin:0 0 6px;color:${C.amberText};font-size:14px;line-height:1.6;">${l}</p>`).join('')}
</td></tr></table>`;
}

// Shell HTML común: cabecera con wordmark, cuerpo y pie, todo en oscuro.
function shell(bodyHtml, footerNote) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${C.card};border:1px solid ${C.cardEdge};border-radius:18px;overflow:hidden;">
<!-- Hairline de marca en el borde superior (degradado), en vez de un bloque azul -->
<tr><td style="height:3px;line-height:3px;font-size:0;background:linear-gradient(90deg,${C.brand},${C.brandSoft},${C.brandDk});">&nbsp;</td></tr>
<tr><td style="padding:26px 34px 6px;">
<span style="color:#ffffff;font-size:23px;font-weight:800;letter-spacing:.6px;">BIMS</span>
<span style="color:${C.muted};font-size:13px;"> · Add-in para Autodesk Revit</span>
</td></tr>
<tr><td style="padding:20px 34px 30px;">
${bodyHtml}
</td></tr>
<tr><td style="padding:18px 34px;background:rgba(255,255,255,.02);border-top:1px solid ${C.cardEdge};font-size:12px;line-height:1.6;color:${C.muted};">
${footerNote}
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

// Firma reutilizable
function sign(name) { return p(`— ${name}`, 'margin-top:20px;'); }

// ── Contenido por (idioma, clave) ────────────────────────────────────────────
const T = {
    es: {
        footer: `Recibes este correo porque iniciaste una prueba gratuita de BIMS.<br>¿Dudas? Responde este correo o escríbenos a <a href="mailto:soporte@bimsaddin.com" style="color:${C.brandSoft};text-decoration:none;">soporte@bimsaddin.com</a>`,
        welcome: (n) => ({
            subject: 'Tu prueba de BIMS está lista — instálalo en 2 minutos (importante: Windows)',
            html: shell(
                p(`Hola ${n},`) +
                p(`Tu prueba gratis de <strong style="color:${C.head};">14 días</strong> ya está activa. Inicia sesión en BIMS con <strong style="color:${C.head};">este mismo correo</strong> y la contraseña que elegiste.`) +
                `<p style="margin:6px 0 22px;">${btn(SITE + '/#descargar', 'Descargar BIMS')}</p>` +
                warnBox('⚠️ Windows mostrará un aviso azul de SmartScreen', [
                    'Es normal en software nuevo y BIMS es 100% seguro. Para instalar:',
                    '1. Haz clic en <strong>"Más información"</strong>',
                    '2. Luego en <strong>"Ejecutar de todas formas"</strong>',
                ]) +
                p(`Sin este paso, Windows bloquea la instalación — es el motivo #1 por el que la gente no llega a probar BIMS.`, `color:${C.muted};font-size:14px;`) +
                p(`¿Se traba algo? Respóndeme este correo o escríbeme por <a href="${WHATSAPP}" style="color:${C.brandSoft};text-decoration:none;">WhatsApp</a> — te ayudo en minutos.`) +
                sign('Sergio, BIMS'),
                T.es.footer),
        }),
        day3: (n) => ({
            subject: 'El comando que te ahorra la tarde entera en Revit',
            html: shell(
                p(`Hola ${n},`) +
                p(`Si aún no lo probaste, empieza por <strong style="color:${C.head};">Encofrado Automatizado</strong>: lo que a mano toma ~6 horas, BIMS lo hace en <strong style="color:${C.head};">~22 minutos</strong>.`) +
                p(`Otros favoritos:`) +
                `<ul style="margin:0 0 18px;padding-left:20px;color:${C.text};font-size:15px;line-height:1.7;">
<li style="margin-bottom:6px;"><strong style="color:${C.head};">Exportar Planos a DWG</strong> con imágenes embebidas (OLE) — único en el mercado.</li>
<li><strong style="color:${C.head};">Tarrajeo por Habitación</strong> — metrados listos en un clic.</li>
</ul>` +
                `<p style="margin:6px 0 22px;">${btn(SITE + '/#video-demo', 'Ver la demo de 45 s')}</p>` +
                p(`¿Qué comando querías automatizar? Respóndeme y te digo si BIMS ya lo hace.`) +
                sign('Sergio, BIMS'),
                T.es.footer),
        }),
        day7: (n) => ({
            subject: '¿Cómo va tu prueba de BIMS? (mitad de camino)',
            html: shell(
                p(`Hola ${n},`) +
                p(`Vas por la mitad de tus 14 días. Una pregunta rápida: <strong style="color:${C.head};">¿lograste correr tu primer comando en un proyecto real?</strong>`) +
                p(`Si sí — cuéntame qué tal salió.<br>Si te trabaste en algo (instalación, licencia, un comando) — respóndeme y lo resolvemos hoy. No quiero que pierdas tu prueba por un detalle técnico.`) +
                sign('Sergio, BIMS'),
                T.es.footer),
        }),
        day12: (n) => ({
            subject: 'Tu prueba de BIMS termina en 2 días',
            html: shell(
                p(`Hola ${n},`) +
                p(`Tu acceso a BIMS vence en <strong style="color:${C.head};">2 días</strong>. Si te sirvió, este es el momento de continuar sin cortar tu flujo de trabajo:`) +
                `<p style="margin:6px 0 22px;">${btn(SITE + '/#precios', 'Ver planes')}</p>` +
                p(`Recuerda: <strong style="color:${C.green};">garantía de devolución del 100% en 7 días</strong>. Si compras y no te convence, te devolvemos todo — sin preguntas.`) +
                p(`¿Dudas antes de decidir? Respóndeme directamente.`) +
                sign('Sergio, BIMS'),
                T.es.footer),
        }),
    },
    en: {
        footer: `You're receiving this because you started a free BIMS trial.<br>Questions? Just reply, or write to <a href="mailto:soporte@bimsaddin.com" style="color:${C.brandSoft};text-decoration:none;">soporte@bimsaddin.com</a>`,
        welcome: (n) => ({
            subject: 'Your BIMS trial is ready — install it in 2 minutes (important: Windows)',
            html: shell(
                p(`Hi ${n},`) +
                p(`Your <strong style="color:${C.head};">14-day</strong> free trial is active. Sign in to BIMS with <strong style="color:${C.head};">this same email</strong> and the password you chose.`) +
                `<p style="margin:6px 0 22px;">${btn(SITE + '/#descargar', 'Download BIMS')}</p>` +
                warnBox('⚠️ Windows will show a blue SmartScreen warning', [
                    'This is normal for new software and BIMS is 100% safe. To install:',
                    '1. Click <strong>"More info"</strong>',
                    '2. Then <strong>"Run anyway"</strong>',
                ]) +
                p(`Without this step Windows blocks the install — it's the #1 reason people never get to try BIMS.`, `color:${C.muted};font-size:14px;`) +
                p(`Stuck on anything? Reply to this email or message me on <a href="${WHATSAPP}" style="color:${C.brandSoft};text-decoration:none;">WhatsApp</a> — I'll help in minutes.`) +
                sign('Sergio, BIMS'),
                T.en.footer),
        }),
        day3: (n) => ({
            subject: 'The one command that saves you a whole afternoon in Revit',
            html: shell(
                p(`Hi ${n},`) +
                p(`If you haven't yet, start with <strong style="color:${C.head};">Automated Formwork</strong>: what takes ~6 hours by hand, BIMS does in <strong style="color:${C.head};">~22 minutes</strong>.`) +
                p(`Other favorites:`) +
                `<ul style="margin:0 0 18px;padding-left:20px;color:${C.text};font-size:15px;line-height:1.7;">
<li style="margin-bottom:6px;"><strong style="color:${C.head};">Export Sheets to DWG</strong> with embedded images (OLE) — one of a kind.</li>
<li><strong style="color:${C.head};">Room Plastering</strong> — quantities ready in one click.</li>
</ul>` +
                `<p style="margin:6px 0 22px;">${btn(SITE + '/#video-demo', 'Watch the 45s demo')}</p>` +
                p(`Which command were you hoping to automate? Reply and I'll tell you if BIMS already does it.`) +
                sign('Sergio, BIMS'),
                T.en.footer),
        }),
        day7: (n) => ({
            subject: 'How is your BIMS trial going? (halfway there)',
            html: shell(
                p(`Hi ${n},`) +
                p(`You're halfway through your 14 days. Quick question: <strong style="color:${C.head};">did you manage to run your first command on a real project?</strong>`) +
                p(`If yes — tell me how it went.<br>If you got stuck on anything (install, license, a command) — reply and we'll fix it today. I don't want you to lose your trial over a technical detail.`) +
                sign('Sergio, BIMS'),
                T.en.footer),
        }),
        day12: (n) => ({
            subject: 'Your BIMS trial ends in 2 days',
            html: shell(
                p(`Hi ${n},`) +
                p(`Your BIMS access expires in <strong style="color:${C.head};">2 days</strong>. If it helped, now's the moment to keep going without breaking your workflow:`) +
                `<p style="margin:6px 0 22px;">${btn(SITE + '/#precios', 'See plans')}</p>` +
                p(`Remember: <strong style="color:${C.green};">100% money-back guarantee within 7 days</strong>. If you buy and it's not for you, we refund everything — no questions.`) +
                p(`Questions before deciding? Just reply.`) +
                sign('Sergio, BIMS'),
                T.en.footer),
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
