// ── _lib/policy-update-email.js ──────────────────────────────────────────────
// Aviso de ACTUALIZACIÓN DE TÉRMINOS Y POLÍTICA DE PRIVACIDAD (23-ago-2026).
//
// Tono deliberadamente NEUTRO: va a toda la base, y la inmensa mayoría no tiene
// nada que ver con el uso indebido de la prueba. Informa del cambio, no acusa
// ni advierte. Reutiliza la estética dark de trial-emails.js (nada de cabeceras
// azules planas ni bordes de plantilla).
// ─────────────────────────────────────────────────────────────────────────────

const C = {
    bg:        '#060a14',
    card:      '#0e1525',
    cardEdge:  'rgba(255,255,255,.08)',
    head:      '#f2f6fc',
    text:      '#c4cfdf',
    muted:     '#7e8ba3',
    brand:     '#2d7dff',
    brandDk:   '#0f4d9e',
    brandSoft: '#7db3ff',
};

function esc(s) {
    return String(s || '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function p(html, extra = '') {
    return `<p style="margin:0 0 15px;color:${C.text};font-size:15px;line-height:1.65;${extra}">${html}</p>`;
}

function h(text) {
    return `<p style="margin:0 0 16px;color:${C.head};font-size:20px;font-weight:700;line-height:1.35;">${text}</p>`;
}

function btn(href, label) {
    return `<a href="${href}" style="display:inline-block;background:linear-gradient(135deg,${C.brand},${C.brandDk});color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 30px;border-radius:11px;box-shadow:0 10px 26px -10px rgba(45,125,255,.6);">${label}</a>`;
}

// Lista de cambios en clave sobria (sin recuadro de alerta: no es una advertencia).
function changeList(items) {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 20px;">
<tr><td style="background:rgba(255,255,255,.03);border:1px solid ${C.cardEdge};border-radius:12px;padding:18px 20px;">
${items.map(i => `<p style="margin:0 0 10px;color:${C.text};font-size:14px;line-height:1.62;">
<span style="color:${C.brandSoft};font-weight:700;">·</span> ${i}</p>`).join('')}
</td></tr></table>`;
}

function shell(bodyHtml, footerNote) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${C.card};border:1px solid ${C.cardEdge};border-radius:18px;overflow:hidden;">
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

const ES = (nombre) => ({
    subject: 'Hemos actualizado los Términos y la Política de Privacidad de BIMS',
    html: shell([
        h('Actualizamos nuestros términos y nuestra política de privacidad'),
        p(`Hola${nombre ? ' ' + esc(nombre) : ''},`),
        p('Te escribimos para informarte de que el <strong style="color:#f2f6fc;">23 de agosto de 2026</strong> hemos actualizado los Términos y Condiciones y la Política de Privacidad de BIMS. Queremos que sepas qué cambia y por qué.'),
        p('<strong style="color:#f2f6fc;">Qué cambia</strong>'),
        changeList([
            'Hemos precisado que la <strong style="color:#f2f6fc;">prueba gratuita se concede una vez por persona, empresa y equipo</strong>, y que no se admiten los correos temporales ni las cuentas múltiples para encadenar pruebas sucesivas.',
            'Para poder aplicarlo, guardamos un <strong style="color:#f2f6fc;">código no reversible del equipo</strong> donde se estrena una prueba. Ese registro no contiene tu correo ni nada de tus proyectos, y <strong style="color:#f2f6fc;">no se aplica a las licencias de pago</strong>.',
            'Hemos corregido la duración del período de prueba en los Términos, que decía 30 días por error: <strong style="color:#f2f6fc;">son 14 días</strong>, como siempre ha sido en la práctica.',
        ]),
        p('<strong style="color:#f2f6fc;">Qué NO cambia</strong>'),
        p('Nada de lo que ya usas. Seguimos <strong style="color:#f2f6fc;">sin recoger tu modelo BIM ni ningún contenido de tu trabajo</strong>, tu licencia sigue igual y no tienes que hacer nada.'),
        p('Si compartes un ordenador en una oficina, en obra o en un laboratorio de universidad, o si cambiaste de correo y algo deja de funcionarte, escríbenos y lo resolvemos: nos interesa que puedas probar BIMS con tranquilidad.'),
        `<div style="margin:24px 0 8px;">${btn('https://bimsaddin.com/terminos.html', 'Leer los términos actualizados')}</div>`,
        p(`<a href="https://bimsaddin.com/privacy-policy.html" style="color:${C.brandSoft};text-decoration:none;">Ver la política de privacidad →</a>`, 'font-size:14px;'),
        p('— Sergio, BIMS', 'margin-top:22px;'),
    ].join(''),
    `Recibes este correo porque tienes una cuenta en BIMS. Si tienes cualquier duda sobre estos cambios, responde a este mensaje o escribe a <a href="mailto:soporte@bimsaddin.com" style="color:${C.brandSoft};text-decoration:none;">soporte@bimsaddin.com</a>.`),
});

const EN = (nombre) => ({
    subject: 'We have updated the BIMS Terms and Privacy Policy',
    html: shell([
        h('We have updated our terms and privacy policy'),
        p(`Hello${nombre ? ' ' + esc(nombre) : ''},`),
        p('We are writing to let you know that on <strong style="color:#f2f6fc;">23 August 2026</strong> we updated the BIMS Terms and Conditions and Privacy Policy. Here is what changes and why.'),
        p('<strong style="color:#f2f6fc;">What changes</strong>'),
        changeList([
            'We have clarified that the <strong style="color:#f2f6fc;">free trial is granted once per person, company and machine</strong>, and that temporary email addresses and multiple accounts used to chain one trial after another are not permitted.',
            'To enforce this, we store a <strong style="color:#f2f6fc;">non-reversible code for the machine</strong> where a trial is started. That record contains neither your email nor anything from your projects, and <strong style="color:#f2f6fc;">does not apply to paid licenses</strong>.',
            'We corrected the trial length stated in the Terms, which said 30 days by mistake: it is <strong style="color:#f2f6fc;">14 days</strong>, as it has always been in practice.',
        ]),
        p('<strong style="color:#f2f6fc;">What does NOT change</strong>'),
        p('Nothing you already use. We still <strong style="color:#f2f6fc;">do not collect your BIM model or any content from your work</strong>, your license is unaffected, and there is nothing you need to do.'),
        p('If you share a computer in an office, on site or in a university lab, or if you changed your email address and something stops working, just write to us and we will sort it out.'),
        `<div style="margin:24px 0 8px;">${btn('https://bimsaddin.com/terminos-en.html', 'Read the updated terms')}</div>`,
        p(`<a href="https://bimsaddin.com/privacy-policy-en.html" style="color:${C.brandSoft};text-decoration:none;">View the privacy policy →</a>`, 'font-size:14px;'),
        p('— Sergio, BIMS', 'margin-top:22px;'),
    ].join(''),
    `You are receiving this email because you have a BIMS account. If you have any questions about these changes, reply to this message or write to <a href="mailto:soporte@bimsaddin.com" style="color:${C.brandSoft};text-decoration:none;">soporte@bimsaddin.com</a>.`),
});

function getPolicyUpdateEmail(lang, nombre) {
    return (String(lang || 'es').toLowerCase().startsWith('en') ? EN : ES)(nombre);
}

module.exports = { getPolicyUpdateEmail };
