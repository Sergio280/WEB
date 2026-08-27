// ── disposable-emails.js ─────────────────────────────────────────────────────
// Lista de dominios de email desechables/temporales. Si un usuario intenta
// registrarse para el trial con uno de estos, se rechaza el registro.
//
// Mantenimiento: agregar nuevos dominios al final del array. NO eliminar
// dominios (puede crear inconsistencias con trials ya creados).
//
// ⚠️ ANTES DE AMPLIAR ESTA LISTA, LEER ESTO (medido el 2026-08-16)
//   El coste de un FALSO POSITIVO hoy es muy superior al de un falso negativo.
//   En agosto se crearon 4 trials externos EN TODO EL MES. A ese volumen,
//   rechazar a un interesado real cuesta un 25 % del embudo; colar a un
//   abusador no cuesta casi nada, porque maxActivations=1 ya limita el daño.
//   Dato concreto: el único registro que se coló por un dominio desechable
//   (applamos.com) fue de los usuarios MÁS enganchados del mes — activó y
//   volvió cuatro días después. Y `cesar.urbina.8.2026@yopmail.com` descargó
//   desde el Autodesk App Store el 10-ago y la lista lo rechazó; nunca volvió.
//   Mientras el problema sea la ESCASEZ de trials y no el abuso, endurecer
//   esta lista empuja en la dirección contraria. Ver la propuesta de pasar de
//   rechazo duro a "marcar y dejar pasar" en trialMeta.
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
    // 2026-08: se coló en un registro real (narot43042@applamos.com, 6-ago).
    // Se añade por COHERENCIA con yopmail, no porque bloquear sea gratis:
    // ese usuario activó y volvió 4 días después, o sea que era de los
    // más enganchados del mes. Leer la nota de abajo antes de ampliar la lista.
    'applamos.com',
    // 2026-08-23: se coló en un registro real (sogovek870@prodbits.com, 23-ago).
    // Verificado: riesgo 91/100, operado por temp-mail.org. Comparte la huella de
    // applamos (NS a granel dnsowl, SPF falso con -all, sin web en el ápice).
    // Se añade tras la actualización de términos que prohíbe expresamente los
    // correos temporales. ⚠️ Sigue siendo un parche: el clúster al que pertenece
    // tenía 916 dominios dados de alta entre abril y agosto de 2026 — una lista
    // fija nunca alcanza a un proveedor que ROTA de dominio.
    'prodbits.com',
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
