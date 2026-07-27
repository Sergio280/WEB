// ─────────────────────────────────────────────────────────────────────────────
// Configuración de planes Culqi — COPIA VERBATIM de la home actual.
// ─────────────────────────────────────────────────────────────────────────────
export const CULQI_PUBLIC_KEY = 'pk_live_aenMPO2MOHaDprCT';

export const CULQI_CONFIG = {
  publicKey: CULQI_PUBLIC_KEY,
  plans: {
    individual: {
      name: 'Individual',
      badge: 'Plan Individual',
      featured: false,
      '1m': {
        price: 60,
        period: 'pago único · licencia 1 mes',
        savingsNote: '',
      },
      '3m': {
        price: 160,
        period: 'pago único · licencia 3 meses',
        savingsNote: 'Equivale a S/53/mes — ahorras 11% vs mensual',
      },
      '6m': {
        price: 300,
        period: 'pago único · licencia 6 meses',
        savingsNote: 'Equivale a S/50/mes — ahorras 17% vs mensual',
      },
      '12m': {
        price: 596,
        period: 'pago único · licencia 1 año',
        savingsNote: 'Equivale a S/49.7/mes — ahorras 17% vs mensual',
      },
      subscription: {
        price: 60,
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
      '1m': {
        price: 100,
        period: 'pago único · licencia 1 mes',
        savingsNote: '',
      },
      '3m': {
        price: 268,
        period: 'pago único · licencia 3 meses',
        savingsNote: 'Equivale a S/89/mes — ahorras 11% vs mensual',
      },
      '6m': {
        price: 500,
        period: 'pago único · licencia 6 meses',
        savingsNote: 'Equivale a S/83/mes — ahorras 17% vs mensual',
      },
      '12m': {
        price: 996,
        period: 'pago único · licencia 1 año',
        savingsNote: 'Equivale a S/83/mes — ahorras 17% vs mensual',
      },
      subscription: {
        price: 100,
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
// SOLO datos no traducibles: el badge, el nombre, la descripción y el lazo
// ("★ Más elegido") salen de t.pricing.catalog[key] en el idioma activo — antes
// también estaban aquí, pero Pricing.jsx los ignoraba por completo.
export const CATALOG = [
  {
    key: 'individual',
    priceFrom: 60,
    accent: 'brand',
    featured: false,
  },
  {
    key: 'profesional',
    priceFrom: 100,
    accent: 'violet',
    featured: true,
  },
  {
    key: 'empresa',
    priceFrom: null, // "A medida"
    accent: 'emerald',
    featured: false,
    whatsapp:
      'https://wa.me/51989455558?text=Hola%2C%20quiero%20una%20cotizaci%C3%B3n%20de%20BIMS%20Empresa',
  },
];

// ── Precios en USD (región de pago internacional, Lemon Squeezy) ─────────────
// Fuente ÚNICA: antes estaban duplicados en CulqiModal.jsx (mensual + anual) y
// en Pricing.jsx (sólo mensual), así que un cambio de precio obligaba a tocar
// tres archivos. Deben coincidir con los variants LIVE de Lemon Squeezy —
// ver netlify/functions/_lib/ls-plans.js, que es el mapa inverso del webhook.
export const USD_PRICES = {
  individual:  { monthly: '16.90', yearly: '159' },
  profesional: { monthly: '26.90', yearly: '269' },
};
