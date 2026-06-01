// Métricas de eficiencia — cifras ancladas a tareas específicas (verbatim).
// Provienen de los charts ACTIVOS de "Eficiencia Cuantificada" de la home.
// (La dona de peso de acero pertenece al panel BBS oculto, por eso NO se usa.)
export const QUICK_METRICS = [
  { label: 'Asignar rejillas a 1000 elementos', value: '8 h → 45 min', accent: 'brand' },
  { label: 'Encofrado de 1 nivel estructural', value: '6 h → 22 min', accent: 'emerald' },
  { label: 'Exportar 10 planos a DWG', value: '3 h → 12 min', accent: 'violet' },
];

// Chart 1 — Tiempo de ejecución (minutos). Labels y valores verbatim.
export const CHART_TIME = {
  labels: ['Encofrado (1 nivel)', 'Exportar Planos a DWG (10 planos)', 'Asignar Rejillas (1000 elem)', 'Acero Columnas (50 col)'],
  manual: [360, 180, 480, 90],
  bims: [22, 12, 45, 8],
};

// Chart 2 — Tasa de error (%). Labels y valores verbatim.
export const CHART_ERROR = {
  labels: ['Encofrado masivo', 'Exportar DWG (referencias)', 'Asignación de rejillas', 'Numeración de aparatos'],
  manual: [10, 18, 15, 12],
  bims: [0.2, 0.0, 0.4, 0.0],
};

// Chart 3 — Radar: nivel de automatización por módulo. Verbatim.
export const CHART_RADAR = {
  labels: ['Encofrado', 'DWG (export)', 'Rejillas', 'Acero', 'Análisis', 'Geometría', 'DWG→Revit', 'Sanitarias'],
  manual: [15, 18, 20, 30, 12, 10, 22, 35],
  bims: [96, 95, 95, 98, 92, 86, 82, 94],
};

// Marquee — solo claims verificables ya presentes en el sitio.
export const MARQUEE_CLAIMS = [
  'Revit 2024',
  'Revit 2025',
  'Revit 2026',
  '−80% de tiempo en tareas repetitivas',
  '30+ comandos especializados',
  'Sin tarjeta de crédito',
  'Activación instantánea',
  'Garantía de 7 días',
  'Imágenes embebidas en DWG (OLE)',
];
