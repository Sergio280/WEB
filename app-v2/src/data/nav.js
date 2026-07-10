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

// Fichas oficiales de BIMS en el Autodesk App Store (publicado 2026-07-10).
// El sello usa la del idioma activo (la web es bilingüe por geo). Sirve de señal
// de confianza — "Autodesk revisó y aprobó este plugin" — que combate la duda
// de legitimidad / el aviso de SmartScreen. NO reemplaza el CTA de prueba.
export const APPSTORE_URL = {
  es: 'https://marketplace.autodesk.com/apps/dd59c0cc-37cc-4630-9aea-7418e84006b8',
  en: 'https://marketplace.autodesk.com/apps/534cf400-2d5e-42ff-b43b-7b8a579b052c',
};

// Galería de clips cortos — IDs de YouTube verbatim de la home original.
// yt vacío => tarjeta "Próximamente" (sin reproducción).
export const CLIPS = [
  {
    yt: 'U9LvemehIkQ',
    title: 'Encofrado de todo el edificio en 1 clic',
    desc: 'Genera muros y suelos de encofrado sobre la estructura, automático.',
  },
  {
    yt: 'no7dvQfRitI',
    title: 'Exporta planos a DWG con las imágenes adentro',
    desc: 'Las imágenes quedan incrustadas en el DWG, no como referencia externa.',
  },
  {
    yt: 'b-g0enh0D6o',
    title: 'Tarrajeo de todos los ambientes',
    desc: 'Crea el revestimiento de muros y pisos por habitación, listo para metrar.',
  },
  {
    yt: 'LHT5X_6WhLE',
    title: 'Importa DWG, escala sólidos y exporta a familia .RFA',
    desc: 'Convierte los sólidos de un DWG en objetos editables de Revit: escálalos y expórtalos como familia .RFA.',
  },
  {
    yt: '',
    title: 'Asigna rejillas a cientos de elementos',
    desc: 'Cada elemento recibe sus ejes más cercanos sin selección manual.',
  },
  {
    yt: '',
    title: 'Refuerzo de columnas y vigas en minutos',
    desc: 'Calcula y coloca el acero estructural automáticamente.',
  },
];
