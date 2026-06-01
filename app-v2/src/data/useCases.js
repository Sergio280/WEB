// Casos de uso práctico — pasos 01..05 + aporte normativo. Copia verbatim.
export const USE_CASES = [
  {
    id: 'bbs',
    tab: '📋 Planilla de Refuerzo (BBS)',
    title: 'Planilla de Despiece de Armadura — Del modelo Revit al archivo Excel',
    steps: [
      { n: '01', t: 'Selecciona los elementos con armadura', d: 'Columnas, vigas, losas o muros ya reforzados en tu modelo Revit.' },
      { n: '02', t: 'Ejecuta el comando BBS', d: 'BIMS recorre cada barra, detecta diámetros, ganchos y dobleces.' },
      { n: '03', t: 'Genera marcas automáticas', d: 'Agrupa barras idénticas y asigna marcas según norma.' },
      { n: '04', t: 'Exporta a Excel', d: 'Planilla completa con columnas A-L, imágenes de formas y totales.' },
      { n: '05', t: 'Listo para fabricación', d: 'Exporta también a BVBS para dobladoras CNC automáticas.' },
    ],
    visual: 'bbs',
    compliance: {
      title: '📐 Aporte a las Normativas BIM',
      items: [
        { k: 'LOD 400 → 500:', v: 'Cada barra queda numerada, dimensionada y con ganchos definidos — nivel de información suficiente para fabricación directa y control en obra.' },
        { k: 'LOIN (ISO 19650):', v: 'La planilla entrega exactamente los atributos requeridos por el BEP: marca, diámetro, longitud, ganchos y cantidad, sin información redundante.' },
      ],
    },
  },
  {
    id: 'encofrado',
    tab: '🏗️ Encofrado Automatizado',
    title: 'Encofrado Automatizado — De elementos estructurales a paneles de encofrado',
    steps: [
      { n: '01', t: 'Selecciona los elementos estructurales', d: 'Columnas, vigas, losas o escaleras de tu modelo.' },
      { n: '02', t: 'Ejecuta Encofrado', d: 'BIMS analiza la geometría y genera los paneles automáticamente.' },
      { n: '03', t: 'Recortes automáticos', d: 'Ajusta uniones entre elementos adyacentes sin solapes.' },
      { n: '04', t: 'Cuantificación integrada', d: 'Genera tablas de áreas y volúmenes de encofrado.' },
      { n: '05', t: 'Documentación lista', d: 'Planos de encofrado listos para obra.' },
    ],
    visual: 'encofrado',
    compliance: {
      title: '📐 Aporte a las Normativas BIM',
      items: [
        { k: 'LOD 300 → 400:', v: 'El encofrado pasa de representación conceptual a geometría de construcción detallada, validada y lista para cuantificación directa desde el modelo.' },
      ],
    },
  },
  {
    id: 'dwg-export',
    tab: '📤 Exportar Planos a DWG',
    title: 'Exportar Planos a DWG — Archivos portátiles con imágenes embebidas, sin referencias rotas',
    steps: [
      { n: '01', t: 'Selecciona las láminas a exportar', d: 'Una o varias láminas de tu proyecto Revit.' },
      { n: '02', t: 'Ejecuta Exportar DWG', d: 'BIMS convierte cada lámina manteniendo escalas y estilos.' },
      { n: '03', t: 'Imágenes embebidas (OLE)', d: 'Las imágenes se insertan dentro del DWG — sin archivos externos.' },
      { n: '04', t: 'Archivo portátil', d: 'Comparte un solo DWG sin perder imágenes ni referencias.' },
    ],
    visual: 'dwg',
    compliance: {
      title: '📐 Aporte a las Normativas BIM',
      items: [
        { k: 'Entregables BIM (ISO 19650):', v: 'Garantiza que los planos enviados al CDE del cliente o a la obra no dependan de archivos externos, eliminando una causa frecuente de revisiones rechazadas por información incompleta.' },
      ],
    },
  },
  {
    id: 'tarrajeo',
    tab: '🎨 Tarrajeo por Habitación',
    title: 'Tarrajeo por Habitación — Genera acabados desde las habitaciones del modelo',
    steps: [
      { n: '01', t: 'Selecciona las habitaciones', d: 'Una o varias habitaciones de tu modelo arquitectónico.' },
      { n: '02', t: 'Ejecuta Tarrajeo', d: 'BIMS detecta muros y suelos límite de cada habitación.' },
      { n: '03', t: 'Genera tarrajeo', d: 'Crea muros y suelos de acabado hacia el interior.' },
      { n: '04', t: 'Compatible con vínculos', d: 'Funciona con modelos vinculados y federados.' },
    ],
    visual: 'tarrajeo',
    compliance: {
      title: '📐 Aporte a las Normativas BIM',
      items: [
        { k: 'LOD 300 → 400:', v: 'Agrega la capa de acabado como elemento cuantificable, elevando el LOD del modelo arquitectónico al nivel de fabricación y obra.' },
        { k: 'Federación con vínculos:', v: 'Funciona sobre modelos donde la arquitectura/estructura está en archivos vinculados (ISO 19650), respetando el flujo BIM multidisciplinario.' },
      ],
    },
  },
];

// Filas demo de la planilla BBS (visual del caso de uso).
export const BBS_DEMO_ROWS = [
  ['M1', 'Ø1/2"', '24', '4.20', '┐___┌'],
  ['M2', 'Ø5/8"', '16', '6.15', '│___│'],
  ['M3', 'Ø3/8"', '48', '1.85', '⊐⊏'],
  ['M4', 'Ø1/2"', '32', '3.40', '┐__┘'],
  ['M5', 'Ø3/4"', '8', '8.00', '│____│'],
];
