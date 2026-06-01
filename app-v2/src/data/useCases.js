// Casos de uso práctico — SOLO pestañas activas en el sitio actual.
// (La pestaña "Planilla de Refuerzo (BBS)" está oculta hasta que los comandos
//  del panel Refuerzo estén activos, por eso NO aparece aquí.)
// Pasos y aportes normativos copiados verbatim de los paneles de la home.
export const USE_CASES = [
  {
    id: 'encofrado',
    tab: '🏗️ Encofrado Automatizado',
    title: 'Encofrado Automatizado — De elementos estructurales a metrado, en minutos',
    steps: [
      { n: '01', t: 'Selecciona los elementos estructurales', d: 'Columnas, vigas, losas y escaleras del modelo — directamente o mediante filtros por categoría.' },
      { n: '02', t: 'BIMS clasifica y genera el encofrado', d: 'Cada elemento se procesa automáticamente: columnas → muros, vigas → laterales + fondo, losas → suelos.' },
      { n: '03', t: 'Recortes automáticos entre elementos', d: 'Las intersecciones se resuelven solas, sin solapes ni huecos — geometría lista para cuantificar.' },
      { n: '04', t: 'Metrado y tablas en Revit', d: 'El encofrado queda integrado con las tablas de cuantificación nativas de Revit para presupuesto.' },
    ],
    visual: 'encofrado',
    compliance: {
      title: '📐 Aporte a las Normativas BIM',
      items: [
        { k: 'LOD 300 → 400:', v: 'El encofrado pasa de representación conceptual a geometría de construcción detallada, validada y lista para cuantificación directa desde el modelo.' },
        { k: '5D BIM:', v: 'Los metrados de encofrado alimentan directamente el presupuesto y el control de costos de obra.' },
      ],
    },
  },
  {
    id: 'dwg-export',
    tab: '📤 Exportar Planos a DWG',
    title: 'Exportar Planos a DWG — Archivos portátiles con imágenes embebidas, sin referencias rotas',
    steps: [
      { n: '01', t: 'Selecciona las láminas a exportar', d: 'Una o varias láminas de tu proyecto Revit, con sus vistas, detalles e imágenes colocadas.' },
      { n: '02', t: 'BIMS exporta a DWG con imágenes OLE', d: 'Las imágenes se insertan dentro del archivo (no como rutas externas), evitando los enlaces rotos típicos de la exportación nativa.' },
      { n: '03', t: 'Archivo portátil listo para compartir', d: 'Un solo DWG con todo embebido: ábrelo en cualquier equipo o envíalo al CDE sin perder imágenes.' },
    ],
    visual: 'dwg',
    compliance: {
      title: '📐 Aporte a las Normativas BIM',
      items: [
        { k: 'Entregables BIM (ISO 19650):', v: 'Garantiza que los planos enviados al CDE del cliente o a la obra no dependan de archivos externos, eliminando una causa frecuente de revisiones rechazadas por información incompleta.' },
        { k: 'Interoperabilidad:', v: 'El DWG resultante es compatible con cualquier software CAD, sin perder la fidelidad visual de las imágenes.' },
      ],
    },
  },
  {
    id: 'tarrajeo',
    tab: '🧱 Tarrajeo por Habitación',
    title: 'Tarrajeo por Habitación — Acabados cuantificables desde los ambientes del modelo',
    steps: [
      { n: '01', t: 'Selecciona las habitaciones', d: 'Una o varias habitaciones (rooms) del modelo arquitectónico, incluso desde modelos vinculados.' },
      { n: '02', t: 'BIMS genera el tarrajeo', d: 'Crea muros de tarrajeo hacia el interior y suelos (contrapiso) automáticamente para cada ambiente.' },
      { n: '03', t: 'Acabados cuantificables', d: 'Cada superficie queda como elemento medible, listo para metrado y presupuesto.' },
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
  {
    id: 'acero',
    tab: '🔩 Acero en Columna',
    title: 'Acero en Columna — Refuerzo longitudinal y estribos según norma',
    steps: [
      { n: '01', t: 'Selecciona las columnas', d: 'Rectangulares o circulares; una o varias a la vez.' },
      { n: '02', t: 'Define el refuerzo', d: 'Diámetros, cantidad de barras y configuración de estribos con zonas de confinamiento.' },
      { n: '03', t: 'BIMS coloca la armadura', d: 'Genera barras longitudinales y estribos a 135° con las zonas de confinamiento según la normativa sismorresistente.' },
    ],
    visual: 'acero',
    compliance: {
      title: '📐 Aporte a las Normativas BIM',
      items: [
        { k: 'LOD 400:', v: 'Barras longitudinales y estribos con posicionamiento exacto, ganchos a 135° y zonas de confinamiento definidas.' },
        { k: 'E.030 / E.060 (NTP):', v: 'Confinamiento y geometría conforme a las normas peruanas de diseño sismorresistente y concreto armado.' },
      ],
    },
  },
  {
    id: 'dwg-nwc',
    tab: '📐 Importación DWG → NWC',
    title: 'Importación DWG → NWC — Geometría externa lista para coordinación',
    steps: [
      { n: '01', t: 'Importa el DWG externo', d: 'Convierte archivos DWG de proveedores o especialidades en objetos nativos de Revit.' },
      { n: '02', t: 'Convierte y posiciona', d: 'BIMS ubica la geometría en el nivel correcto y la prepara como elementos editables.' },
      { n: '03', t: 'Exporta a NWC para Navisworks', d: 'Prepara el modelo federado para coordinación y detección de interferencias.' },
    ],
    visual: 'nwc',
    compliance: {
      title: '📐 Aporte a las Normativas BIM',
      items: [
        { k: 'Federación de modelos (ISO 19650-3):', v: 'Integra disciplinas externas al modelo coordinado, habilitando la revisión multidisciplinaria desde una fuente única.' },
        { k: 'CDE:', v: 'Convierte archivos externos en objetos nativos del CDE del proyecto, manteniendo trazabilidad.' },
      ],
    },
  },
];
