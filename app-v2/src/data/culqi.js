// ─────────────────────────────────────────────────────────────────────────────
// Configuración de planes Culqi — COPIA VERBATIM de la home actual.
// No modificar precios, checkoutUrl ni claves sin coordinar con el backend.
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
        checkoutUrl: 'https://mpago.la/14i7PE5',
      },
      '3m': {
        price: 160,
        period: 'pago único · licencia 3 meses',
        savingsNote: 'Equivale a S/53/mes — ahorras 11% vs mensual',
        checkoutUrl: 'https://mpago.la/2XXUumw',
      },
      '6m': {
        price: 300,
        period: 'pago único · licencia 6 meses',
        savingsNote: 'Equivale a S/50/mes — ahorras 17% vs mensual',
        checkoutUrl: 'https://mpago.la/1MfzQVu',
      },
      '12m': {
        price: 596,
        period: 'pago único · licencia 1 año',
        savingsNote: 'Equivale a S/49.7/mes — ahorras 17% vs mensual',
        checkoutUrl: 'https://mpago.la/12r2GZj',
      },
      subscription: {
        price: 60,
        period: 'por mes · suscripción recurrente',
        savingsNote: '',
        checkoutUrl:
          'https://www.mercadopago.com.pe/subscriptions/checkout?preapproval_plan_id=0e1debce8c694e73bfd93687b81cbd3e',
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
        checkoutUrl: 'https://mpago.la/1J6N5Mq',
      },
      '3m': {
        price: 268,
        period: 'pago único · licencia 3 meses',
        savingsNote: 'Equivale a S/89/mes — ahorras 11% vs mensual',
        checkoutUrl: 'https://mpago.la/1mg26VZ',
      },
      '6m': {
        price: 500,
        period: 'pago único · licencia 6 meses',
        savingsNote: 'Equivale a S/83/mes — ahorras 17% vs mensual',
        checkoutUrl: 'https://mpago.la/1WM53B1',
      },
      '12m': {
        price: 996,
        period: 'pago único · licencia 1 año',
        savingsNote: 'Equivale a S/83/mes — ahorras 17% vs mensual',
        checkoutUrl: 'https://mpago.la/2tJ9xJU',
      },
      subscription: {
        price: 100,
        period: 'por mes · suscripción recurrente',
        savingsNote: '',
        checkoutUrl:
          'https://www.mercadopago.com.pe/subscriptions/checkout?preapproval_plan_id=8329d236202b469183919db44dd5a235',
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
    priceFrom: 60,
    accent: 'brand',
    featured: false,
  },
  {
    key: 'profesional',
    badge: 'Profesional',
    name: 'BIMS Profesional',
    desc: 'Todo lo de Individual, para hasta 3 equipos. Soporte prioritario 24 h y acceso anticipado a funciones beta.',
    priceFrom: 100,
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
