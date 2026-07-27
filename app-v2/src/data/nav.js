export const WHATSAPP_URL = 'https://wa.me/51989455558';
export const EMAIL = 'soporte@bimsaddin.com';
export const YOUTUBE_ID = 'U9LvemehIkQ';

// Fichas oficiales de BIMS en el Autodesk App Store (publicado 2026-07-10).
// El sello usa la del idioma activo (la web es bilingüe por geo). Sirve de señal
// de confianza — "Autodesk revisó y aprobó este plugin" — que combate la duda
// de legitimidad / el aviso de SmartScreen. NO reemplaza el CTA de prueba.
export const APPSTORE_URL = {
  es: 'https://marketplace.autodesk.com/apps/dd59c0cc-37cc-4630-9aea-7418e84006b8',
  en: 'https://marketplace.autodesk.com/apps/534cf400-2d5e-42ff-b43b-7b8a579b052c',
};

// Galería de clips cortos — SOLO los IDs de YouTube, en el mismo ORDEN que
// t.clips.items (i18n/translations.js), de donde salen título y descripción en
// el idioma activo. Antes este array también llevaba title/desc, pero Clips.jsx
// los descartaba (`{ yt: c.yt, ...t.clips.items[i] }`): eran texto duplicado
// destinado a desincronizarse del que se muestra de verdad.
//
// Cadena vacía => tarjeta "Próximamente" (sin reproducción).
export const CLIPS = [
  { yt: 'U9LvemehIkQ' }, // Encofrado de todo el edificio en 1 clic
  { yt: 'no7dvQfRitI' }, // Exportar planos a DWG con imágenes embebidas
  { yt: 'b-g0enh0D6o' }, // Tarrajeo de todos los ambientes
  { yt: 'LHT5X_6WhLE' }, // Importar DWG, escalar sólidos y exportar a .RFA
  { yt: '' },            // Asignar rejillas — próximamente
  { yt: '' },            // Refuerzo de columnas y vigas — próximamente
];
