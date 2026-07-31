// ─────────────────────────────────────────────────────────────────────────────
// Configuración de planes Culqi.
//
// Los NÚMEROS ya no viven aquí: se derivan de data/pricing.js, la fuente única
// de precios del frontend. Este archivo se queda solo con lo que es propio del
// checkout de Culqi (llave pública) y con la descripción comercial de los
// planes (features, textos del catálogo, tabla comparativa).
//
// La forma de los objetos exportados NO cambió respecto a la versión anterior,
// para no tocar a sus consumidores (CulqiModal, Pricing, useCulqi).
// ─────────────────────────────────────────────────────────────────────────────
import {
  PRECIOS_PEN,
  DURACIONES,
  precioPen,
  precioDesde,
  equivalenteMensual,
  ahorroPct,
} from './pricing.js';

export const CULQI_PUBLIC_KEY = 'pk_live_aenMPO2MOHaDprCT';

const ETIQUETA_DURACION = {
  '1m': 'licencia 1 mes',
  '3m': 'licencia 3 meses',
  '6m': 'licencia 6 meses',
  '12m': 'licencia 1 año',
};

// Construye las entradas por duración de un plan a partir de la tabla de
// precios. `savingsNote` se calcula (no se escribe a mano) para que nunca
// contradiga al precio: antes decía "Equivale a S/53/mes" en un archivo y el
// precio vivía en otro, así que un cambio en uno dejaba mintiendo al otro.
function entradasDeDuracion(planKey) {
  const out = {};
  for (const dur of DURACIONES) {
    const pct = ahorroPct(planKey, dur);
    out[dur] = {
      price: precioPen(planKey, dur),
      period: `pago único · ${ETIQUETA_DURACION[dur]}`,
      savingsNote:
        pct > 0 ? `Equivale a S/${equivalenteMensual(planKey, dur)}/mes — ahorras ${pct}% vs mensual` : '',
    };
  }
  return out;
}

export const CULQI_CONFIG = {
  publicKey: CULQI_PUBLIC_KEY,
  plans: {
    individual: {
      name: 'Individual',
      badge: 'Plan Individual',
      featured: false,
      ...entradasDeDuracion('individual'),
      subscription: {
        price: PRECIOS_PEN.individual.sub,
        period: 'por mes · suscripción recurrente',
        savingsNote: '',
      },
      features: [
        'Todos los paneles BIMS',
        '1 equipo / 1 usuario',
        'Actualizaciones incluidas',
        'Soporte por email (48 h)',
      ],
    },
    profesional: {
      name: 'Profesional',
      badge: 'Plan Profesional',
      featured: true,
      ...entradasDeDuracion('profesional'),
      subscription: {
        price: PRECIOS_PEN.profesional.sub,
        period: 'por mes · suscripción recurrente',
        savingsNote: '',
      },
      features: [
        'Todos los paneles BIMS',
        'Hasta 3 equipos / 1 usuario',
        'Actualizaciones incluidas',
        'Soporte prioritario (24 h)',
        'Funciones beta anticipadas',
      ],
    },
  },
};

// Catálogo visible de planes (tarjetas de la sección Precios).
export const CATALOG = [
  {
    key: 'individual',
    badge: 'Individual',
    name: 'BIMS Individual',
    desc: 'Plugin completo para Revit, todos los paneles desbloqueados. Licencia para 1 equipo. Ideal para profesionales independientes.',
    priceFrom: precioDesde('individual'),
    accent: 'brand',
    featured: false,
  },
  {
    key: 'profesional',
    badge: 'Profesional',
    name: 'BIMS Profesional',
    desc: 'Todo lo de Individual, para hasta 3 equipos. Soporte prioritario 24 h y acceso anticipado a funciones beta.',
    priceFrom: precioDesde('profesional'),
    accent: 'violet',
    featured: true,
    ribbon: '★ Más elegido',
  },
  {
    key: 'empresa',
    badge: 'Empresa',
    name: 'BIMS Empresa',
    desc: 'Licencias para todo tu equipo, facturación a nombre de la empresa y capacitación incluida.',
    priceFrom: null, // "A medida"
    accent: 'emerald',
    featured: false,
    whatsapp:
      'https://wa.me/51989455558?text=Hola%2C%20quiero%20una%20cotizaci%C3%B3n%20de%20BIMS%20Empresa',
  },
];

// Comparativa de planes (tabla) — verbatim.
export const PLAN_COMPARE = {
  cols: ['Individual', 'Profesional ⭐', 'Empresa'],
  rows: [
    { label: 'Todos los paneles BIMS desbloqueados', cells: ['✓', '✓', '✓'] },
    { label: 'Equipos (PCs) por licencia', cells: ['1', 'hasta 3', 'ilimitados'] },
    { label: 'Soporte por email', cells: ['48 h', 'prioritario 24 h', 'dedicado'] },
    { label: 'Acceso anticipado a funciones beta', cells: ['—', '✓', '✓'] },
    { label: 'Capacitación incluida', cells: ['—', '—', '✓'] },
    { label: 'Facturación a nombre de empresa', cells: ['—', '✓', '✓'] },
  ],
};
