// ─────────────────────────────────────────────────────────────────────────────
// Países hispanohablantes (ISO-3166 alpha-2).
//
// Vive en su propio archivo, y no dentro de translations.js, porque lo importa
// también la edge function que decide en qué idioma entra un visitante nuevo
// (netlify/edge-functions/idioma.js). Esa corre en Deno y no puede cargarse el
// archivo de traducciones entero —1300 líneas de textos— para leer una lista de
// veintiún códigos de país.
//
// ⚠️ GEMELO EN EL BACKEND: netlify/functions/_lib/spanish-countries.js
//    Se duplica porque las Netlify Functions son CommonJS y esto es ESM. Si
//    cambia una lista, cambiar la otra.
// ─────────────────────────────────────────────────────────────────────────────
export const SPANISH_COUNTRIES = new Set([
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
