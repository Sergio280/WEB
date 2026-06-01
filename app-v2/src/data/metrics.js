// Métricas de eficiencia — cifras ancladas a tareas específicas (verbatim).
// Provienen del chart de tiempos comparados de la home actual.
export const QUICK_METRICS = [
  { label: 'Asignar rejillas a 1000 elementos', value: '8 h → 45 min', accent: 'brand' },
  { label: 'Encofrado de 1 nivel estructural', value: '6 h → 22 min', accent: 'emerald' },
  { label: 'Exportar 10 planos a DWG', value: '3 h → 12 min', accent: 'violet' },
];

// Datos para los charts (react-chartjs-2). Etiquetas y valores verbatim
// del bloque "Eficiencia Cuantificada" de la home.
export const CHART_TIME = {
  labels: ['Encofrado (1 nivel)', 'Exportar Planos a DWG (10 planos)', 'Asignar Rejillas (1000 elem)', 'Acero Columnas (50 col)'],
  manual: [360, 180, 480, 300], // minutos (proceso manual)
  bims: [22, 12, 45, 35], // minutos (con BIMS)
};

// Radar: cobertura por dimensión (0-100), comparando manual vs BIMS.
export const CHART_RADAR = {
  labels: ['Velocidad', 'Precisión', 'Cumplimiento normativo', 'Trazabilidad', 'Reusabilidad', 'Documentación'],
  manual: [35, 60, 55, 40, 30, 45],
  bims: [95, 92, 90, 88, 90, 93],
};

// Dona: distribución del tiempo recuperado.
export const CHART_DONUT = {
  labels: ['Tiempo automatizado por BIMS', 'Tiempo restante de revisión'],
  values: [80, 20],
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
