// ── _lib/personal-email-domains.js ───────────────────────────────────────────
// Dominios de correo PERSONALES (webmail de consumo). Se usan para distinguir un
// registro personal de uno CORPORATIVO: si el dominio del correo NO está en esta
// lista (y no es desechable), lo tratamos como empresa → se marca la cuenta como
// corporativa y se avisa a soporte para el seguimiento comercial (canal de empresa).
//
// Filosofía: preferimos FALSOS NEGATIVOS (marcar como personal algo que era de
// empresa) a falsos positivos ruidosos. La lista cubre los webmail masivos; todo
// lo demás (constructora.com, eiffage.com, cumbra.com.pe…) cae en "corporativo".
// Mantenimiento: agregar al final; NO quitar (rompería la clasificación histórica).
// ─────────────────────────────────────────────────────────────────────────────

const PERSONAL_EMAIL_DOMAINS = new Set([
    // Google
    'gmail.com', 'googlemail.com',
    // Microsoft
    'hotmail.com', 'hotmail.es', 'hotmail.co.uk', 'hotmail.fr', 'hotmail.it',
    'outlook.com', 'outlook.es', 'outlook.fr', 'live.com', 'live.com.mx',
    'msn.com', 'windowslive.com',
    // Yahoo
    'yahoo.com', 'yahoo.es', 'yahoo.com.mx', 'yahoo.com.ar', 'yahoo.fr',
    'yahoo.co.uk', 'ymail.com', 'rocketmail.com',
    // Apple
    'icloud.com', 'me.com', 'mac.com',
    // Otros webmail de consumo comunes en LatAm/EU
    'aol.com', 'protonmail.com', 'proton.me', 'gmx.com', 'gmx.net', 'gmx.es',
    'zoho.com', 'yandex.com', 'mail.com', 'mail.ru',
    'terra.com.pe', 'terra.com', 'hotmail.com.pe', 'yahoo.com.pe',
]);

// ── Dominios ACADÉMICOS ──────────────────────────────────────────────────────
// Una universidad NO es un lead corporativo: quien escribe desde unprg.edu.pe o
// urp.edu.pe casi siempre es un estudiante, y un estudiante no compra licencias
// de equipo. Marcarlo como "empresa" ensucia el canal comercial con avisos que
// no llevan a ninguna venta. Se detecta por patrón, no por lista: los dominios
// académicos son reservados y siguen convenciones estables en todo el mundo
// (.edu, .edu.pe, .ac.uk, .edu.mx…).
const ACADEMIC_PATTERNS = [
    /\.edu$/,                 // harvard.edu
    /\.edu\.[a-z]{2}$/,       // unprg.edu.pe, unam.edu.mx
    /\.ac\.[a-z]{2}$/,        // cam.ac.uk, u-tokyo.ac.jp
    /\.uni-[a-z-]+\.[a-z]{2,}$/, // uni-muenchen.de
];

function isAcademicDomain(domain) {
    return ACADEMIC_PATTERNS.some(p => p.test(domain));
}

// ¿El dominio del correo es de una EMPRESA? (true = corporativo).
//
// Devuelve false para webmail personal, para dominios académicos y para correos
// desechables.
//
// ⚠️ Lo de los desechables NO es redundante con la capa que los rechaza al
// registrarse, aunque lo parezca. Esa capa es una lista fija de ~70 dominios y
// el ecosistema real tiene más de 75 000, rotando constantemente: los que no
// están en la lista SÍ llegan hasta aquí. Sin esta comprobación, un buzón
// temporal como prodbits.com se marcaría como "empresa" y dispararía un aviso
// de lead caliente — el peor falso positivo posible, porque invita a escribirle
// a una dirección que no es de nadie.
function isCorporateDomain(email) {
    if (!email || typeof email !== 'string') return false;
    const at = email.lastIndexOf('@');
    if (at < 0) return false;
    const domain = email.slice(at + 1).toLowerCase().trim();
    if (!domain) return false;

    if (PERSONAL_EMAIL_DOMAINS.has(domain)) return false;
    if (isAcademicDomain(domain)) return false;

    // Import perezoso: evita acoplar este módulo al de desechables en el arranque
    // y lo mantiene utilizable de forma aislada (p. ej. desde scripts sueltos).
    try {
        const { isDisposable } = require('./disposable-emails');
        if (isDisposable(domain)) return false;
    } catch { /* si el módulo no está disponible, no bloquea la clasificación */ }

    return true;
}

module.exports = { PERSONAL_EMAIL_DOMAINS, isCorporateDomain, isAcademicDomain };
