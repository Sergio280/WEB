// ── _lib/spanish-countries.js ────────────────────────────────────────────────
// Países hispanohablantes (ISO-3166 alpha-2). Espejo EXACTO de SPANISH_COUNTRIES
// en `app-v2/src/i18n/translations.js`; se duplica porque el frontend es ESM y
// las functions son CommonJS. Si cambia una lista, actualizar la otra.
//
// Uso: deducir el idioma del usuario cuando el cliente NO envía `lang`. Es el
// caso del PLUGIN de Revit, cuyo payload es solo {email, password, name} y no
// puede recompilarse a demanda (la DLL ya está distribuida / en revisión de
// Autodesk). Sin esto, todo registro desde el plugin caía en español, y con la
// publicación en el Autodesk App Store el tráfico es global y mayormente inglés.
// ─────────────────────────────────────────────────────────────────────────────

const SPANISH_COUNTRIES = new Set([
    'ES', // España
    'MX', // México
    'AR', // Argentina
    'CO', // Colombia
    'PE', // Perú
    'VE', // Venezuela
    'CL', // Chile
    'EC', // Ecuador
    'GT', // Guatemala
    'CU', // Cuba
    'BO', // Bolivia
    'DO', // República Dominicana
    'HN', // Honduras
    'PY', // Paraguay
    'SV', // El Salvador
    'NI', // Nicaragua
    'CR', // Costa Rica
    'PA', // Panamá
    'UY', // Uruguay
    'PR', // Puerto Rico
    'GQ', // Guinea Ecuatorial
]);

// Idioma de los correos del trial.
//   - Si el cliente envió un `lang` válido ('es'|'en'), manda ese (lo hace la web).
//   - Si no (plugin), se deduce del país real: hispano → 'es'; resto → 'en'.
//   - Si tampoco hay país (geo indeterminada), se cae a 'es': la base instalada
//     es mayoritariamente peruana, así que es el fallback menos dañino.
function resolveLang(rawLang, country) {
    if (rawLang === 'en' || rawLang === 'es') return rawLang;
    if (!country) return 'es';
    return SPANISH_COUNTRIES.has(country) ? 'es' : 'en';
}

module.exports = { SPANISH_COUNTRIES, resolveLang };
