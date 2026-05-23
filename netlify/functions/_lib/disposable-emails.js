// ── disposable-emails.js ─────────────────────────────────────────────────────
// Lista de dominios de email desechables/temporales. Si un usuario intenta
// registrarse para el trial con uno de estos, se rechaza el registro.
//
// Mantenimiento: agregar nuevos dominios al final del array. NO eliminar
// dominios (puede crear inconsistencias con trials ya creados).
//
// Fuente inicial: combinación de las listas más usadas en el ecosistema
// anti-abuso (disposable-email-domains, mailchecker, etc.).
// ─────────────────────────────────────────────────────────────────────────────

const DISPOSABLE_DOMAINS = [
    // 10minutemail family
    '10minutemail.com', '10minutemail.net', '20minutemail.com',
    // mailinator family
    'mailinator.com', 'mailinator.net', 'mailinator.org', 'mailinator2.com',
    // yopmail family
    'yopmail.com', 'yopmail.fr', 'yopmail.net',
    // guerrillamail family
    'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org',
    'guerrillamail.biz', 'guerrillamail.de', 'sharklasers.com',
    // tempmail family
    'tempmail.com', 'tempmail.net', 'temp-mail.org', 'temp-mail.io',
    'tempr.email', 'tempmailaddress.com', 'tempinbox.com',
    // throwaway / fake
    'throwawaymail.com', 'fakeinbox.com', 'fakemailgenerator.com',
    'maildrop.cc', 'trashmail.com', 'trashmail.net', 'trashmail.de',
    'dispostable.com', 'mintemail.com', 'mytrashmail.com',
    // generic temp services
    'getairmail.com', 'getnada.com', 'nada.email',
    'inboxbear.com', 'spambox.us', 'spam4.me',
    'mohmal.com', 'emailondeck.com', 'emkei.cz',
    // ru/ua disposables
    'mail-temporaire.fr', 'jetable.org', 'rhyta.com',
    // newer 2024-2025 disposables
    'mailpoof.com', 'tempmail.us.com', 'mailtemp.uk',
    'tmpmail.org', 'tmpmail.net', 'tmpeml.com',
    'discard.email', 'discardmail.com', 'discardmail.de',
    'mailcatch.com', 'mailnesia.com', 'mailnull.com',
    'mvrht.net', 'mvrht.com', 'getairmail.net',
    'smailpro.com', 'cuirushi.org', 'rootfest.net',
    'mailtm.com', 'developermail.com',
    // edu/test patterns (NO bloquear .edu reales)
    'example.com', 'example.org', 'example.net', 'test.com',
];

// Set para lookup O(1)
const DISPOSABLE_SET = new Set(DISPOSABLE_DOMAINS.map(d => d.toLowerCase()));

/**
 * Verifica si un dominio está en la lista de desechables.
 * @param {string} domain - parte del email después del @ (case-insensitive)
 * @returns {boolean}
 */
function isDisposable(domain) {
    if (!domain || typeof domain !== 'string') return false;
    return DISPOSABLE_SET.has(domain.trim().toLowerCase());
}

module.exports = { isDisposable, DISPOSABLE_DOMAINS };
