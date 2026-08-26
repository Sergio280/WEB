// Enlaces de navegación (anclas internas de la landing /v2).
export const NAV_LINKS = [
  { href: '#video-demo', label: 'Demo' },
  { href: '#casos', label: 'Casos de uso' },
  { href: '#efectividad', label: 'Resultados' },
  { href: '#precios', label: 'Precios' },
  { href: '#faq', label: 'FAQ' },
  { href: '#contacto', label: 'Contacto' },
];

export const WHATSAPP_URL = 'https://wa.me/51989455558';
export const EMAIL = 'soporte@bimsaddin.com';
export const YOUTUBE_ID = 'U9LvemehIkQ';

// Versión del plugin que se ofrece en la web. Vive aquí y NO en los textos
// traducidos porque es un dato, no una frase: escrito a mano en cada idioma se
// olvidaba actualizar uno de los dos y la web anunciaba versiones distintas
// según se viera en español o en inglés.
//
// Debe coincidir con `updates/latest.json` en Firebase, que es lo que el plugin
// consulta para avisar de actualizaciones, y con el instalador que sirve
// GitHub Releases. Ojo: la ficha del Autodesk App Store lleva su propio número
// y se actualiza aparte, al subir el bundle a revisión.
export const PLUGIN_VERSION = '1.2.1';

// Fichas oficiales de BIMS en el Autodesk App Store (publicado 2026-07-10).
// El sello usa la del idioma activo (la web es bilingüe por geo). Sirve de señal
// de confianza — "Autodesk revisó y aprobó este plugin" — que combate la duda
// de legitimidad / el aviso de SmartScreen. NO reemplaza el CTA de prueba.
export const APPSTORE_URL = {
  es: 'https://marketplace.autodesk.com/apps/dd59c0cc-37cc-4630-9aea-7418e84006b8',
  en: 'https://marketplace.autodesk.com/apps/534cf400-2d5e-42ff-b43b-7b8a579b052c',
};

// Galería de clips cortos. Aquí vive SOLO lo que no es texto: el identificador
// del clip y su vídeo de YouTube. Los títulos y descripciones están en
// i18n/translations.js (clips.items), emparejados por ESE identificador.
//
// Antes se emparejaban por posición en el array —CLIPS[i] con items[i]— y
// además este archivo arrastraba una copia en español de los textos que ya no
// se usaba: la pisaba la traducción. Añadir un clip aquí y olvidarlo allí
// dejaba items[i] en undefined y la sección entera reventaba al leer el título.
//
// yt vacío => tarjeta "Próximamente" (sin reproducción).
export const CLIPS = [
  { id: 'encofrado', yt: 'U9LvemehIkQ' },
  { id: 'dwg',       yt: 'no7dvQfRitI' },
  { id: 'tarrajeo',  yt: 'b-g0enh0D6o' },
  { id: 'rfa',       yt: 'LHT5X_6WhLE' },
  { id: 'rejillas',  yt: '' },
  { id: 'refuerzo',  yt: '' },
];
