// Casos de uso práctico — SOLO pestañas activas en el sitio actual.
// (La pestaña "Planilla de Refuerzo (BBS)" está oculta hasta que los comandos
//  del panel Refuerzo estén activos, por eso NO aparece aquí.)
// Pasos y aportes normativos basados en los comandos reales de Application.cs.
export const USE_CASES = [
  {
    id: 'encofrado',
    tab: '🏗️ Encofrado Automatizado',
    title: 'Encofrado Automatizado — De elementos estructurales a metrado, en minutos',
    intro:
      'En lugar de modelar muro por muro el encofrado de cada columna, viga y losa, seleccionas los elementos estructurales y BIMS genera todo el encofrado clasificándolo por tipo, recortando las uniones y dejándolo listo para cuantificar.',
    steps: [
      { n: '01', t: 'Selecciona los tipos y los elementos', d: 'Eliges el tipo de muro y de suelo que se usarán como encofrado, y luego seleccionas las columnas, vigas, losas o escaleras del modelo (directamente o por filtros de categoría).' },
      { n: '02', t: 'BIMS clasifica y genera cada cara', d: 'El sistema identifica el tipo de cada elemento y crea el encofrado como muros y suelos nativos de Revit, extruidos siempre hacia afuera: columnas → muros perimetrales, vigas → muros laterales + suelo de fondo, losas → suelo, escaleras → muros verticales + suelos inclinados.' },
      { n: '03', t: 'Recortes automáticos entre elementos', d: 'BIMS detecta los elementos contiguos y elimina los solapamientos entre encofrados de vigas y columnas, preservando curvas y geometría compleja para que el área sea exacta, sin sobre-metrados.' },
      { n: '04', t: 'Listo para cuantificar', d: 'El encofrado queda integrado en el modelo como muros/suelos nativos, cuantificable y detallable directamente en las tablas de Revit, sin pasos adicionales.' },
    ],
    visual: 'encofrado',
    compliance: {
      title: '📐 Aporte a las Normativas BIM',
      items: [
        { k: 'LOD 300 → 400:', v: 'El encofrado pasa de representación conceptual a geometría de construcción detallada, validada y lista para cuantificación directa desde el modelo.' },
        { k: '5D BIM:', v: 'Las cantidades de encofrado (m² por tipo de elemento) se extraen directamente del modelo para presupuesto y control de costos, sin doble entrada de datos.' },
      ],
    },
  },
  {
    id: 'dwg-export',
    tab: '📤 Exportar Planos a DWG',
    title: 'Exportar Planos a DWG — Archivos portátiles con imágenes embebidas, sin referencias rotas',
    intro:
      'La exportación nativa de Revit guarda las imágenes de tus láminas como archivos externos: al mover o enviar el DWG, los enlaces se rompen y las imágenes desaparecen. BIMS las inserta dentro del propio archivo (OLE), generando un DWG que viaja completo.',
    steps: [
      { n: '01', t: 'Selecciona las láminas a exportar', d: 'Eliges una o varias láminas (ViewSheets) de tu proyecto, con sus vistas, detalles e imágenes ya colocadas. Hay vista previa de selección múltiple.' },
      { n: '02', t: 'BIMS exporta a DWG con imágenes OLE', d: 'Cada lámina se convierte a DWG manteniendo escalas, estilos y tu configuración de exportación. Las imágenes se insertan dentro del archivo, no como rutas externas, eliminando los enlaces rotos típicos de la exportación nativa.' },
      { n: '03', t: 'Archivo portátil listo para compartir', d: 'Obtienes un único DWG con todo embebido: ábrelo en cualquier equipo o software CAD, o envíalo al CDE del cliente sin perder ninguna imagen.' },
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
    intro:
      'Modelar el tarrajeo cara por cara es lento y propenso a error. Con BIMS seleccionas las habitaciones y el sistema crea automáticamente el revestimiento de muros y el contrapiso de cada ambiente como elementos nativos y medibles.',
    steps: [
      { n: '01', t: 'Selecciona tipos y habitaciones', d: 'Eliges el tipo de muro y/o suelo para el tarrajeo y seleccionas una o varias habitaciones (rooms) del modelo arquitectónico, incluso desde modelos vinculados.' },
      { n: '02', t: 'BIMS detecta los límites y genera el tarrajeo', d: 'El sistema reconoce los muros y columnas que limitan cada habitación, crea muros de tarrajeo en las caras verticales internas y genera el suelo (contrapiso) siguiendo el contorno del ambiente, usando tipos nativos (muros/suelos).' },
      { n: '03', t: 'Acabados listos para metrar', d: 'Cada superficie queda como elemento cuantificable, listo para el metrado de revestimientos y el presupuesto de acabados por ambiente.' },
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
    intro:
      'BIMS calcula y coloca la armadura de tus columnas: genera las barras longitudinales y los estribos con sus zonas de confinamiento y ganchos a 135°, conforme a la normativa sismorresistente peruana, dejando el modelo de armadura listo para revisión.',
    steps: [
      { n: '01', t: 'Selecciona las columnas', d: 'Eliges una o varias columnas, rectangulares o circulares.' },
      { n: '02', t: 'Define el refuerzo', d: 'Configuras diámetros, cantidad de barras y la distribución de estribos con sus zonas de confinamiento.' },
      { n: '03', t: 'BIMS coloca la armadura', d: 'Genera las barras longitudinales y los estribos a 135°, con las zonas de confinamiento calculadas automáticamente según la norma sismorresistente, sobre el elemento estructural.' },
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
    id: 'despiece',
    tab: '📋 Despiece de Acero',
    title: 'Despiece de Acero — De la armadura modelada a la planilla de corte, en un clic',
    intro:
      'El despiece se sigue rehaciendo a mano en una hoja aparte, y cada cambio del modelo lo deja desfasado. BIMS lee la armadura que ya está modelada, resuelve cómo cortarla a partir de barras comerciales minimizando la chatarra y entrega la planilla en Excel, lista para compras y para el fierrero.',
    steps: [
      { n: '01', t: 'Ejecuta sobre la selección o sobre todo el proyecto', d: 'Con elementos seleccionados despieza solo esos; sin selección, el modelo entero. Es un comando de solo lectura: no abre ninguna transacción ni modifica el proyecto, así que cancelar es seguro en cualquier punto.' },
      { n: '02', t: 'BIMS resuelve el corte y compara la barra', d: 'Agrupa las piezas por diámetro y calcula cómo obtenerlas de barras comerciales de 9 m dejando el mínimo desperdicio, y repite el cálculo con barras de 12 m para decidir la compra con criterio. Los pesos salen del catálogo de BIMS, no de los parámetros que cada quien haya modelado.' },
      { n: '03', t: 'Planilla en Excel, lista para obra', d: 'Un archivo con cinco hojas: Resumen (cuánto acero pedir y en qué barra), Por diámetro, Patrones de corte para el fierrero, Piezas para trazabilidad, y las piezas que no caben en la barra y exigen empalme. Nada se omite en silencio: lo que no se pudo despiezar se declara con su motivo.' },
    ],
    visual: 'despiece',
    compliance: {
      title: '📐 Aporte a las Normativas BIM',
      items: [
        { k: '5D BIM:', v: 'El metrado de acero (kg por diámetro y barras a comprar) se extrae del propio modelo, de modo que presupuesto, compras y geometría comparten una única fuente.' },
        { k: 'Trazabilidad:', v: 'Cada línea de la planilla se puede seguir hasta la pieza del modelo de la que salió, y las que quedan fuera se reportan con su causa en lugar de desaparecer del total.' },
      ],
    },
  },
  {
    id: 'dwg-nwc',
    tab: '📐 Importación DWG → NWC',
    title: 'Importación DWG → NWC — Geometría externa lista para manipular y coordinar',
    intro:
      'Convierte y descompone los sólidos de un archivo DWG en objetos nativos de Revit (modelos genéricos) que puedes escalar, exportar a familia .rfa o preparar para coordinación. Ideal para integrar geometría de proveedores o especialidades sin depender del archivo original.',
    steps: [
      { n: '01', t: 'Importa el DWG externo', d: 'BIMS lee el archivo DWG y descompone sus sólidos en objetos nativos de Revit (modelos genéricos). Con la opción independiente, la geometría no se elimina al borrar el DWG.' },
      { n: '02', t: 'Manipula la geometría en Revit', d: 'Una vez convertidos, los objetos son editables: puedes escalarlos con un factor, convertirlos a modelo genérico o exportarlos como familia .rfa con sólidos editables, además de calcular sus volúmenes.' },
      { n: '03', t: 'Exporta a NWC para Navisworks', d: 'Convierte los modelos genéricos a categorías compatibles (Mass / Generic Model) y prepara el modelo federado para coordinación y detección de interferencias en Navisworks.' },
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
