// ─────────────────────────────────────────────────────────────────────────────
// translations.js — Diccionario de textos de la landing en español e inglés.
//
// El español (`es`) es la fuente de verdad (copy verbatim de la home). El
// inglés (`en`) es la traducción profesional equivalente. Los datos NO textuales
// (precios, URLs de checkout, IDs de YouTube, números de los charts, iconos y
// acentos de color) viven en `src/data/*` y NO se duplican aquí: los componentes
// combinan la estructura de `data/` con el texto del idioma activo.
//
// Países de habla hispana (ISO-3166 alpha-2) → si la geolocalización por IP
// devuelve uno de estos, la página arranca en español; en cualquier otro caso,
// en inglés. La preferencia explícita del usuario (toggle) siempre manda.
// ─────────────────────────────────────────────────────────────────────────────
export const SPANISH_COUNTRIES = new Set([
  'ES', // España
  'MX', // México
  'AR', // Argentina
  'CO', // Colombia
  'PE', // Perú
  'VE', // Venezuela
  'CL', // Chile
  'EC', // Ecuador
  'GT', // Guatemala
  'CU', // Cuba
  'BO', // Bolivia
  'DO', // República Dominicana
  'HN', // Honduras
  'PY', // Paraguay
  'SV', // El Salvador
  'NI', // Nicaragua
  'CR', // Costa Rica
  'PA', // Panamá
  'UY', // Uruguay
  'PR', // Puerto Rico
  'GQ', // Guinea Ecuatorial
]);

export const translations = {
  // ───────────────────────────────────────────────────────────────────────────
  // ESPAÑOL
  // ───────────────────────────────────────────────────────────────────────────
  es: {
    langSwitch: { label: 'EN', aria: 'Ver la página en inglés', toGo: 'English' },

    meta: {
      title: 'BIMS — Automatiza encofrado, tarrajeo y planos DWG en Revit',
      description: 'BIMS — Add-in profesional para Autodesk Revit que automatiza encofrado, refuerzo, tarrajeo y exportación DWG. Compatible con Revit 2024, 2025, 2026 y 2027.',
    },

    announce: {
      gift: '🎁',
      free: '14 días GRATIS',
      desc: ' — Prueba BIMS sin tarjeta · Revit 2024/2025/2026/2027',
      cta: 'Empezar trial →',
    },

    nav: {
      links: [
        { href: '#video-demo', label: 'Demo' },
        { href: '#casos', label: 'Casos de uso' },
        { href: '#efectividad', label: 'Resultados' },
        { href: '#precios', label: 'Precios' },
        { href: '#faq', label: 'FAQ' },
        { href: '#contacto', label: 'Contacto' },
      ],
      cta: 'Prueba gratis →',
      download: 'Descargar',
      menu: 'Menú',
    },

    marquee: {
      heading: 'Más de 30 comandos en tu cinta de Revit',
      commands: [
        'Asignar Rejillas', 'Transferir Parámetros', 'Unir Parámetros', 'Transferir ID',
        'Marca Anfitrión', 'Asignar Host ID', 'Asignar Ambiente', 'Importar DWG',
        'Importar DWG (Independiente)', 'Exportar NWC', 'Calcular Volúmenes', 'Estilo de Notas',
        'Sólido → Masa', 'Agregar CAD a Selección', 'Resaltar Selección', 'Igualar Gráficos',
        'Exportar Planos a DWG', 'Encofrado Automatizado', 'Tarrajeo Habitación', 'Acero Columnas',
        'Estribos Columnas', 'Acero Vigas', 'Acero Muros', 'Acero Losas', 'Registros Sanitarios',
        'Calcular Longitud', 'Asignar Cota Tapa', 'Asignar Sector', 'Numerar Aparatos',
        'Escalar Sólido', 'Convertir a DirectShape', 'Exportar a Familia (.rfa)',
      ],
    },

    hero: {
      eyebrow: 'Add-in para Autodesk Revit',
      title: { pre: 'Lo que en Revit te toma ', h1: '4 horas', mid: ',', post: 'BIMS lo hace en ', h2: '4 minutos' },
      descPre: 'Add-in con ',
      descStrong: '30+ herramientas',
      descPost: ' para estructura, refuerzo, encofrado y exportación de planos a DWG con imágenes embebidas — único en su categoría.',
      cta: 'Empezar prueba gratis de 14 días →',
      subNote: 'Sin tarjeta de crédito · Activación instantánea · ',
      subNoteLink: 'Ver demo de 45 s',
      guarantee: 'Garantía de devolución del 100% en 7 días si no te convence',
      mockup: {
        title: 'Proyecto-Estructural.rvt — Autodesk Revit 2027',
        ribbon: [
          { icon: '🏗️', label: 'Encofrado' },
          { icon: '🔩', label: 'Acero' },
          { icon: '🎨', label: 'Tarrajeo' },
          { icon: '📐', label: 'DWG → NWC' },
          { icon: '📤', label: 'Exportar DWG' },
          { icon: '🧰', label: 'Utilidades' },
        ],
        console: [
          '> Ejecutando Encofrado…',
          '→ 142 elementos analizados',
          '✓ Paneles generados en 22 s',
          '> Exportar Planos a DWG…',
          '✓ 10 láminas · imágenes embebidas (OLE)',
        ],
        badgeValue: '−80%',
        badgeLabel: 'tiempo en tareas repetitivas',
        hint: '▶ Ver BIMS en acción',
      },
    },

    appStore: {
      // "Disponible en" (no "Verificado"): coincide con el badge oficial y evita
      // insinuar el Certified Apps Program, del que BIMS no forma parte.
      badge: 'Disponible en el Autodesk App Store',
    },

    midCta: {
      title: 'Deja de perder horas en tareas repetitivas de Revit',
      desc: 'Encofrado, refuerzo, tarrajeo y planos DWG — automatizados. Pruébalo gratis 14 días, sin tarjeta.',
      cta: 'Empezar prueba gratis →',
      note: 'Garantía de 7 días · Activación instantánea',
    },

    videoDemo: {
      title: 'Mira BIMS en acción (45 s)',
      subtitle: 'Demostración real en un proyecto estructural',
      iframeTitle: 'Demostración de BIMS en Revit',
      playAria: 'Reproducir demo de BIMS en Revit',
      thumbAlt: 'Demostración de BIMS en un proyecto real de Revit',
      ctaPre: '¿Listo para probarlo en tu propio proyecto? ',
      ctaLink: 'Activa tu prueba gratis →',
    },

    clips: {
      eyebrow: 'En acción',
      title: 'BIMS en acción, comando por comando',
      subtitle: 'Clips cortos: mira cada herramienta resolver una tarea real de Revit',
      soon: 'Video próximamente',
      close: 'Cerrar ✕',
      closeAria: 'Cerrar',
      items: [
        { title: 'Encofrado de todo el edificio en 1 clic', desc: 'Genera muros y suelos de encofrado sobre la estructura, automático.' },
        { title: 'Exporta planos a DWG con las imágenes adentro', desc: 'Las imágenes quedan incrustadas en el DWG, no como referencia externa.' },
        { title: 'Tarrajeo de todos los ambientes', desc: 'Crea el revestimiento de muros y pisos por habitación, listo para metrar.' },
        { title: 'Importa DWG, escala sólidos y exporta a familia .RFA', desc: 'Convierte los sólidos de un DWG en objetos editables de Revit: escálalos y expórtalos como familia .RFA.' },
        { title: 'Asigna rejillas a cientos de elementos', desc: 'Cada elemento recibe sus ejes más cercanos sin selección manual.' },
        { title: 'Refuerzo de columnas y vigas en minutos', desc: 'Calcula y coloca el acero estructural automáticamente.' },
      ],
    },

    bento: {
      eyebrow: 'Capacidades',
      title: 'Un add-in completo, comando por comando',
      subtitle: 'Flujos reales que automatizan tareas completas de documentación estructural.',
      items: {
        dwg: {
          badge: 'Único en su categoría',
          title: 'Exportar Planos a DWG con imágenes embebidas',
          desc: 'Exporta tus láminas (ViewSheets) a DWG insertando las imágenes dentro del propio archivo (OLE), no como referencias externas. El resultado es un DWG totalmente portátil que puedes enviar a un cliente o consultor sin que se rompan ni se pierdan las imágenes.',
          points: [
            'Selección múltiple de planos con vista previa',
            'Imágenes insertadas en el DWG (no como rutas externas)',
            'Mantiene escalas, estilos y configuración de exportación',
            'Un solo archivo portátil, ideal para el CDE',
          ],
        },
        encofrado: {
          title: 'Encofrado Automatizado',
          desc: 'Selecciona los elementos estructurales y BIMS clasifica cada uno por tipo y genera su encofrado como muros y suelos nativos de Revit, extruidos siempre hacia afuera y recortados automáticamente entre elementos contiguos. Queda listo para cuantificar.',
          points: [
            'Columnas → muros perimetrales',
            'Vigas → muros laterales + suelo de fondo',
            'Losas → suelo · Escaleras → muros + suelos inclinados',
            'Recortes automáticos, integrado con tablas de Revit',
          ],
        },
        acero: {
          title: 'Acero de Refuerzo',
          desc: 'Calcula y coloca la armadura en los elementos estructurales. En columnas genera el refuerzo longitudinal (rectangular o circular) y los estribos con sus zonas de confinamiento y ganchos a 135°, conforme a la normativa sismorresistente peruana.',
          points: [
            'Refuerzo longitudinal en columnas',
            'Estribos con zonas de confinamiento automáticas',
            'Ganchos a 135° según norma',
          ],
          tags: ['LOD 400', 'E.030', 'E.060'],
        },
        tarrajeo: {
          title: 'Tarrajeo por Habitación',
          desc: 'Selecciona una o varias habitaciones y BIMS detecta los muros y columnas que las limitan, generando muros de tarrajeo hacia el interior y el suelo (contrapiso) como elementos nativos cuantificables. Funciona también con modelos vinculados.',
          points: [
            'Selección múltiple de habitaciones',
            'Detecta elementos límite automáticamente',
            'Muros + contrapiso listos para metrar',
          ],
        },
        utilidades: {
          title: 'Importar y Convertir DWG',
          desc: 'Convierte y descompone los sólidos de un archivo DWG en objetos manipulables dentro de Revit (DirectShapes). Una vez convertidos, puedes escalarlos, exportarlos como familia .rfa editable o prepararlos para coordinación. Ideal para reutilizar geometría externa (DWG, SAT, IFC) sin depender del archivo original.',
          points: [
            'Importa y descompone sólidos del DWG a objetos de Revit',
            'Opción independiente: la geometría no se borra al quitar el DWG',
            'Luego escálalos, conviértelos o expórtalos a familia .rfa',
            'Calcula volúmenes y exporta NWC para Navisworks',
          ],
        },
        geometria: {
          title: 'Herramientas de Geometría',
          desc: 'Manipula la geometría de cualquier elemento con sólidos: escálalo con un factor configurable, conviértelo a DirectShape o expórtalo (uno o varios elementos) como familia .rfa con sólidos editables.',
          points: [
            'Escalar Sólido (factor configurable)',
            'Convertir a DirectShape',
            'Exportar a Familia (.rfa) editable',
          ],
        },
        general: {
          title: 'Productividad y Parámetros',
          desc: 'Acelera tareas repetitivas: asigna rejillas a cientos de elementos a la vez, transfiere o une parámetros, asigna ambientes a muros y suelos, e iguala gráficos entre elementos de una vista.',
          points: [
            'Asignar Rejillas a todo el modelo',
            'Transferir / Unir Parámetros',
            'Asignar Ambiente · Igualar Gráficos',
          ],
        },
        alcance: {
          title: '30+ comandos · Revit 2024-2027',
          desc: 'Un add-in completo para estructura, encofrado, tarrajeo, geometría y documentación, organizado en los paneles General, Estructuras y Geometría. Compatible con Windows 10/11 y Revit 2024 a 2027.',
          points: [],
        },
      },
    },

    useCases: {
      eyebrow: 'Casos de uso práctico',
      title: 'Flujos completos de principio a fin',
      subtitle: 'Elige una tarea y mira, paso a paso, cómo BIMS la resuelve dentro de Revit — desde la selección de elementos hasta el resultado listo para metrar o entregar.',
      complianceTitle: '📐 Aporte a las Normativas BIM',
      visuals: {
        encofrado: {
          caption: 'Resultado — Encofrado generado automáticamente',
          rows: ['Columna → muros', 'Viga → laterales + fondo', 'Losa → suelo'],
          withBims: 'con BIMS',
          manual: 'manual',
        },
        dwg: {
          caption: 'Antes vs. después — Exportación DWG (arrastra)',
          labelBefore: '❌ Nativa de Revit',
          labelAfter: '✓ Exportación BIMS',
          beforeTitle: 'Imágenes como archivos externos',
          beforeDesc: 'al mover el DWG, los enlaces se rompen',
          afterTitle: 'Imágenes embebidas (OLE)',
          afterDesc: 'un solo archivo portátil',
        },
        tarrajeo: {
          caption: 'Esquema — Tarrajeo generado en planta',
          svgRoom: 'Habitación',
          svgInner: 'tarrajeo hacia el interior',
          svgAria: 'Planta de habitación con tarrajeo',
        },
        acero: {
          caption: 'Esquema — Sección de columna reforzada',
          svgLabel: 'Columna reforzada',
          svgAria: 'Sección de columna con refuerzo',
          note: 'Barras longitudinales + estribos a 135° con confinamiento',
        },
        nwc: {
          caption: 'Flujo — DWG externo a modelo federado',
          steps: ['DWG externo', 'Objeto Revit', 'NWC Navisworks'],
        },
      },
      cases: {
        encofrado: {
          tab: '🏗️ Encofrado Automatizado',
          title: 'Encofrado Automatizado — De elementos estructurales a metrado, en minutos',
          intro: 'En lugar de modelar muro por muro el encofrado de cada columna, viga y losa, seleccionas los elementos estructurales y BIMS genera todo el encofrado clasificándolo por tipo, recortando las uniones y dejándolo listo para cuantificar.',
          steps: [
            { n: '01', t: 'Selecciona los tipos y los elementos', d: 'Eliges el tipo de muro y de suelo que se usarán como encofrado, y luego seleccionas las columnas, vigas, losas o escaleras del modelo (directamente o por filtros de categoría).' },
            { n: '02', t: 'BIMS clasifica y genera cada cara', d: 'El sistema identifica el tipo de cada elemento y crea el encofrado como muros y suelos nativos de Revit, extruidos siempre hacia afuera: columnas → muros perimetrales, vigas → muros laterales + suelo de fondo, losas → suelo, escaleras → muros verticales + suelos inclinados.' },
            { n: '03', t: 'Recortes automáticos entre elementos', d: 'BIMS detecta los elementos contiguos y elimina los solapamientos entre encofrados de vigas y columnas, preservando curvas y geometría compleja para que el área sea exacta, sin sobre-metrados.' },
            { n: '04', t: 'Listo para cuantificar', d: 'El encofrado queda integrado en el modelo como Wall/Floor nativos, cuantificable y detallable directamente en las tablas de Revit, sin pasos adicionales.' },
          ],
          compliance: [
            { k: 'LOD 300 → 400:', v: 'El encofrado pasa de representación conceptual a geometría de construcción detallada, validada y lista para cuantificación directa desde el modelo.' },
            { k: '5D BIM:', v: 'Las cantidades de encofrado (m² por tipo de elemento) se extraen directamente del modelo para presupuesto y control de costos, sin doble entrada de datos.' },
          ],
        },
        'dwg-export': {
          tab: '📤 Exportar Planos a DWG',
          title: 'Exportar Planos a DWG — Archivos portátiles con imágenes embebidas, sin referencias rotas',
          intro: 'La exportación nativa de Revit guarda las imágenes de tus láminas como archivos externos: al mover o enviar el DWG, los enlaces se rompen y las imágenes desaparecen. BIMS las inserta dentro del propio archivo (OLE), generando un DWG que viaja completo.',
          steps: [
            { n: '01', t: 'Selecciona las láminas a exportar', d: 'Eliges una o varias láminas (ViewSheets) de tu proyecto, con sus vistas, detalles e imágenes ya colocadas. Hay vista previa de selección múltiple.' },
            { n: '02', t: 'BIMS exporta a DWG con imágenes OLE', d: 'Cada lámina se convierte a DWG manteniendo escalas, estilos y tu configuración de exportación. Las imágenes se insertan dentro del archivo, no como rutas externas, eliminando los enlaces rotos típicos de la exportación nativa.' },
            { n: '03', t: 'Archivo portátil listo para compartir', d: 'Obtienes un único DWG con todo embebido: ábrelo en cualquier equipo o software CAD, o envíalo al CDE del cliente sin perder ninguna imagen.' },
          ],
          compliance: [
            { k: 'Entregables BIM (ISO 19650):', v: 'Garantiza que los planos enviados al CDE del cliente o a la obra no dependan de archivos externos, eliminando una causa frecuente de revisiones rechazadas por información incompleta.' },
            { k: 'Interoperabilidad:', v: 'El DWG resultante es compatible con cualquier software CAD, sin perder la fidelidad visual de las imágenes.' },
          ],
        },
        tarrajeo: {
          tab: '🧱 Tarrajeo por Habitación',
          title: 'Tarrajeo por Habitación — Acabados cuantificables desde los ambientes del modelo',
          intro: 'Modelar el tarrajeo cara por cara es lento y propenso a error. Con BIMS seleccionas las habitaciones y el sistema crea automáticamente el revestimiento de muros y el contrapiso de cada ambiente como elementos nativos y medibles.',
          steps: [
            { n: '01', t: 'Selecciona tipos y habitaciones', d: 'Eliges el tipo de muro y/o suelo para el tarrajeo y seleccionas una o varias habitaciones (rooms) del modelo arquitectónico, incluso desde modelos vinculados.' },
            { n: '02', t: 'BIMS detecta los límites y genera el tarrajeo', d: 'El sistema reconoce los muros y columnas que limitan cada habitación, crea muros de tarrajeo en las caras verticales internas y genera el suelo (contrapiso) siguiendo el contorno del ambiente, usando tipos nativos (Wall/Floor).' },
            { n: '03', t: 'Acabados listos para metrar', d: 'Cada superficie queda como elemento cuantificable, listo para el metrado de revestimientos y el presupuesto de acabados por ambiente.' },
          ],
          compliance: [
            { k: 'LOD 300 → 400:', v: 'Agrega la capa de acabado como elemento cuantificable, elevando el LOD del modelo arquitectónico al nivel de fabricación y obra.' },
            { k: 'Federación con vínculos:', v: 'Funciona sobre modelos donde la arquitectura/estructura está en archivos vinculados (ISO 19650), respetando el flujo BIM multidisciplinario.' },
          ],
        },
        acero: {
          tab: '🔩 Acero en Columna',
          title: 'Acero en Columna — Refuerzo longitudinal y estribos según norma',
          intro: 'BIMS calcula y coloca la armadura de tus columnas: genera las barras longitudinales y los estribos con sus zonas de confinamiento y ganchos a 135°, conforme a la normativa sismorresistente peruana, dejando el modelo de armadura listo para revisión.',
          steps: [
            { n: '01', t: 'Selecciona las columnas', d: 'Eliges una o varias columnas, rectangulares o circulares.' },
            { n: '02', t: 'Define el refuerzo', d: 'Configuras diámetros, cantidad de barras y la distribución de estribos con sus zonas de confinamiento.' },
            { n: '03', t: 'BIMS coloca la armadura', d: 'Genera las barras longitudinales y los estribos a 135°, con las zonas de confinamiento calculadas automáticamente según la norma sismorresistente, sobre el elemento estructural.' },
          ],
          compliance: [
            { k: 'LOD 400:', v: 'Barras longitudinales y estribos con posicionamiento exacto, ganchos a 135° y zonas de confinamiento definidas.' },
            { k: 'E.030 / E.060 (NTP):', v: 'Confinamiento y geometría conforme a las normas peruanas de diseño sismorresistente y concreto armado.' },
          ],
        },
        'dwg-nwc': {
          tab: '📐 Importación DWG → NWC',
          title: 'Importación DWG → NWC — Geometría externa lista para manipular y coordinar',
          intro: 'Convierte y descompone los sólidos de un archivo DWG en objetos nativos de Revit (DirectShapes) que puedes escalar, exportar a familia .rfa o preparar para coordinación. Ideal para integrar geometría de proveedores o especialidades sin depender del archivo original.',
          steps: [
            { n: '01', t: 'Importa el DWG externo', d: 'BIMS lee el archivo DWG y descompone sus sólidos en objetos nativos de Revit (DirectShapes). Con la opción independiente, la geometría no se elimina al borrar el DWG.' },
            { n: '02', t: 'Manipula la geometría en Revit', d: 'Una vez convertidos, los objetos son editables: puedes escalarlos con un factor, convertirlos a DirectShape o exportarlos como familia .rfa con sólidos editables, además de calcular sus volúmenes.' },
            { n: '03', t: 'Exporta a NWC para Navisworks', d: 'Convierte los DirectShapes a categorías compatibles (Mass / Generic Model) y prepara el modelo federado para coordinación y detección de interferencias en Navisworks.' },
          ],
          compliance: [
            { k: 'Federación de modelos (ISO 19650-3):', v: 'Integra disciplinas externas al modelo coordinado, habilitando la revisión multidisciplinaria desde una fuente única.' },
            { k: 'CDE:', v: 'Convierte archivos externos en objetos nativos del CDE del proyecto, manteniendo trazabilidad.' },
          ],
        },
      },
    },

    metrics: {
      eyebrow: 'Eficiencia cuantificada',
      title: 'BIMS vs. procesos manuales',
      subtitle: 'Cifras ancladas a tareas específicas, según el chart de tiempos comparados.',
      quickCaption: 'según chart de tiempos comparados',
      quickLabels: [
        'Asignar rejillas a 1000 elementos',
        'Encofrado de 1 nivel estructural',
        'Exportar 10 planos a DWG',
      ],
      timeTitle: 'Tiempo por tarea (minutos)',
      errorTitle: 'Tasa de error (%)',
      radarTitle: 'Nivel de automatización por módulo',
      timeLabels: ['Encofrado (1 nivel)', 'Exportar Planos a DWG (10 planos)', 'Asignar Rejillas (1000 elem)', 'Acero Columnas (50 col)'],
      errorLabels: ['Encofrado masivo', 'Exportar DWG (referencias)', 'Asignación de rejillas', 'Numeración de aparatos'],
      radarLabels: ['Encofrado', 'DWG (export)', 'Rejillas', 'Acero', 'Análisis', 'Geometría', 'DWG→Revit', 'Sanitarias'],
      dsManualTime: 'Sin BIMS (manual)',
      dsBims: 'Con BIMS',
      dsManualPct: 'Sin BIMS (%)',
      dsBimsPct: 'Con BIMS (%)',
      dsManualProcess: 'Proceso manual',
      unitMin: ' min',
    },

    roi: {
      title: 'Calcula cuánto te ahorrarías con BIMS',
      subtitle: 'Mueve los controles según tu carga real de trabajo',
      projects: 'Proyectos al mes',
      hours: 'Horas de documentación por proyecto',
      rate: 'Valor de tu hora profesional',
      hoursSuffix: ' h',
      ratePrefix: 'S/ ',
      note: { strong: 'Estimación orientativa.', rest: ' Asume una reducción del 80 % del tiempo en tareas automatizables por BIMS (encofrado, refuerzo, exportación a DWG, asignación de rejillas). El ahorro real depende del flujo de trabajo de cada estudio.' },
      resultLabel: 'Te ahorras al mes',
      resultHours: ' h',
      moneyPre: '= S/ ',
      moneyPost: ' en honorarios recuperados',
      paybackPre: 'La licencia se paga sola en ',
      paybackBold: '≈ {d} días',
      paybackPost: ' de trabajo.',
      cta: 'Probar gratis 14 días →',
      locale: 'es-PE',
    },

    pricing: {
      eyebrow: 'Planes y precios',
      title: 'Activa BIMS al instante',
      subtitle: 'Paga seguro con tarjeta a través de Culqi y recibe tu clave por email en minutos.',
      guaranteeStrong: 'Garantía de 7 días.',
      guaranteeRest: ' Si BIMS no te convence, escríbenos dentro de los 7 días siguientes a tu compra y te devolvemos el 100% de tu dinero. Sin preguntas.',
      priceFrom: 'desde ', // el símbolo de moneda (S/ o $) lo añade Pricing según la región de pago
      perMonth: ' /mes',
      custom: 'A medida',
      contactSales: 'Contactar ventas',
      contactNote: 'Cotización a medida · Respuesta el mismo día',
      buy: 'Comprar ',
      buyNote: 'Pago seguro con Culqi · Clave por email en minutos',
      orTrial: 'o prueba 14 días gratis →',
      footnotePre: 'Al comprar eliges la duración: ',
      footnoteDurations: '1, 3, 6 o 12 meses',
      footnoteMid: '. Mientras más larga la licencia, mayor el descuento — hasta ',
      footnoteDiscount: '−17%',
      footnotePost: ' frente al precio mensual.',
      regionAskIntl: '¿Ves precios en dólares por error? Cambiar a soles (Perú)',
      regionAskPe: '¿Pagas desde fuera de Perú? Ver precios en dólares',
      tableHead: 'Qué incluye',
      catalog: {
        individual: { badge: 'Individual', name: 'BIMS Individual', desc: 'Plugin completo para Revit, todos los paneles desbloqueados. Licencia para 1 equipo. Ideal para profesionales independientes.' },
        profesional: { badge: 'Profesional', name: 'BIMS Profesional', desc: 'Todo lo de Individual, para hasta 3 equipos. Soporte prioritario 24 h y acceso anticipado a funciones beta.', ribbon: '★ Más elegido' },
        empresa: { badge: 'Empresa', name: 'BIMS Empresa', desc: 'Licencias para todo tu equipo, facturación a nombre de la empresa y capacitación incluida.' },
      },
      compare: {
        cols: ['Individual', 'Profesional ⭐', 'Empresa'],
        rows: [
          { label: 'Todos los paneles BIMS desbloqueados', cells: ['✓', '✓', '✓'] },
          { label: 'Equipos (PCs) por licencia', cells: ['1', 'hasta 3', 'ilimitados'] },
          { label: 'Soporte por email', cells: ['48 h', 'prioritario 24 h', 'dedicado'] },
          { label: 'Acceso anticipado a funciones beta', cells: ['—', '✓', '✓'] },
          { label: 'Capacitación incluida', cells: ['—', '—', '✓'] },
          { label: 'Facturación a nombre de empresa', cells: ['—', '✓', '✓'] },
        ],
      },
    },

    culqiModal: {
      durations: [
        { key: '1m', label: '1 mes' },
        { key: '3m', label: '3 meses' },
        { key: '6m', label: '6 meses' },
        { key: '12m', label: '1 año' },
      ],
      onetime: 'Pago único',
      subscription: 'Suscripción mensual',
      subPeriod: '1er mes gratis · luego S/{price}/mes',
      emailLabel: 'Email para recibir tu clave',
      emailPlaceholder: 'tunombre@empresa.com',
      emailError: 'Ingresa un email válido.',
      closeAria: 'Cerrar',
      processing: 'Procesando…',
      subscribeBtn: 'Suscribirme — S/{price}/mes',
      payBtn: 'Pagar S/{price} con tarjeta',
      secureNote: 'Pago seguro con Culqi · Recibes tu clave por email',
      successUrl: '/success.html',
      errLoad: 'No se pudo cargar el checkout. Recarga la página.',
      errRejected: 'Pago rechazado',
      errPay: 'Error al procesar el pago. Intenta de nuevo.',
      // Selector de método de pago (Culqi Perú / Lemon Squeezy internacional)
      methodCulqi: '🇵🇪 Perú',
      methodIntl: '🌎 Internacional',
      methodCulqiHint: 'Tarjetas peruanas · soles (Culqi)',
      methodIntlHint: 'Tarjetas internacionales · USD (Lemon Squeezy)',
      // Pago internacional (Lemon Squeezy)
      intlOr: 'o',
      intlPay: '🌎 Pagar con tarjeta internacional (USD)',
      intlNote: 'Fuera de Perú · Visa / Mastercard / Amex vía Lemon Squeezy',
      intlMonthly: 'Mensual',
      intlYearly: 'Anual',
      intlPerMonth: '/mes',
      intlPerYear: '/año',
      intlPayBtn: 'Pagar ${price} con tarjeta',
      intlSecure: 'Pago internacional seguro vía Lemon Squeezy · recibes tu clave por email',
      intlYearNote: '2 meses gratis vs. mensual',
      plans: {
        individual: {
          features: ['Todos los paneles BIMS', '1 equipo / 1 usuario', 'Actualizaciones incluidas', 'Soporte por email (48 h)'],
          periods: {
            '1m': 'pago único · licencia 1 mes',
            '3m': 'pago único · licencia 3 meses',
            '6m': 'pago único · licencia 6 meses',
            '12m': 'pago único · licencia 1 año',
            subscription: 'por mes · suscripción recurrente',
          },
          savings: {
            '3m': 'Equivale a S/53/mes — ahorras 11% vs mensual',
            '6m': 'Equivale a S/50/mes — ahorras 17% vs mensual',
            '12m': 'Equivale a S/49.7/mes — ahorras 17% vs mensual',
          },
        },
        profesional: {
          features: ['Todos los paneles BIMS', 'Hasta 3 equipos / 1 usuario', 'Actualizaciones incluidas', 'Soporte prioritario (24 h)', 'Funciones beta anticipadas'],
          periods: {
            '1m': 'pago único · licencia 1 mes',
            '3m': 'pago único · licencia 3 meses',
            '6m': 'pago único · licencia 6 meses',
            '12m': 'pago único · licencia 1 año',
            subscription: 'por mes · suscripción recurrente',
          },
          savings: {
            '3m': 'Equivale a S/89/mes — ahorras 11% vs mensual',
            '6m': 'Equivale a S/83/mes — ahorras 17% vs mensual',
            '12m': 'Equivale a S/83/mes — ahorras 17% vs mensual',
          },
        },
      },
    },

    trial: {
      eyebrow: '14 días gratis',
      title: 'Prueba BIMS gratis durante 14 días',
      desc: 'Sin tarjeta. Sin compromiso. Activa los 30+ comandos en tu proyecto real y comprueba cuánto tiempo recuperas antes de pagar.',
      features: [
        'Todos los paneles desbloqueados (General · Estructuras · Geometría)',
        'Compatible con Revit 2024, 2025, 2026 y 2027',
        '1 equipo · Activación automática por email',
        'Si te convence, conservas tu cuenta al comprar',
      ],
      formTitle: 'Crea tu cuenta de trial',
      formSub: 'Listo en 30 segundos. Sin email de verificación — tu cuenta queda activa al instante.',
      emailLabel: 'Email profesional *',
      emailPlaceholder: 'tunombre@empresa.com',
      nameLabel: 'Nombre',
      namePlaceholder: 'Tu nombre',
      companyLabel: 'Empresa / Estudio (opcional)',
      companyPlaceholder: 'Constructora, estudio de ingeniería, freelance…',
      pwLabel: 'Contraseña *',
      pwHint: '(mínimo 8 caracteres)',
      pwPlaceholder: 'Mínimo 8 caracteres',
      pw2Label: 'Confirma contraseña *',
      pw2Placeholder: 'Repite la contraseña',
      show: 'Ver',
      hide: 'Ocultar',
      pwMatch: '✓ Las contraseñas coinciden',
      pwNoMatch: '✗ Las contraseñas no coinciden',
      honeypotLabel: 'Website (déjalo vacío)',
      submit: '🎁 Activar mi trial de 14 días',
      submitting: 'Procesando…',
      strength: ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Excelente'],
      errEmail: '✗ Por favor ingresa un email válido.',
      errPwLen: '✗ La contraseña debe tener al menos 8 caracteres.',
      errPwMatch: '✗ Las contraseñas no coinciden.',
      errGeneric: 'Hubo un error. Intenta de nuevo o escríbenos a soporte@bimsaddin.com',
      errConn: '✗ Error de conexión. Verifica tu internet e intenta de nuevo.',
      termsPre: 'Al continuar aceptas nuestros ',
      termsLink: 'términos',
      termsMid: ' y ',
      privacyLink: 'política de privacidad',
      termsPost: '. Tu email se usa solo para avisos de tu licencia.',
      termsHref: '/terminos.html',
      privacyHref: '/privacy-policy.html',
      successUrl: '/trial-success.html',
    },

    testimonials: {
      title: 'Aún estamos recogiendo las primeras reseñas',
      desc: 'BIMS es un producto reciente. En lugar de mostrar testimonios genéricos, preferimos esperar a tener reseñas reales con autorización para publicarlas. Si ya lo probaste y quieres ser de los primeros en compartir tu experiencia, nos encantaría leerte.',
      cta: '💬 Dejar mi reseña por WhatsApp',
      whatsappText: 'Hola%2C%20quiero%20dejar%20mi%20rese%C3%B1a%20sobre%20BIMS',
      footerPre: 'Mientras tanto, te invitamos a probar el plugin tú mismo con ',
      footerLink1: '14 días gratis',
      footerMid: ' y a revisar nuestros ',
      footerLink2: 'casos de uso documentados',
      footerPost: '.',
    },

    faq: {
      eyebrow: 'FAQ',
      title: 'Preguntas frecuentes',
      items: [
        { q: '¿Necesito tarjeta de crédito para empezar la prueba?', a: 'No. La prueba de 14 días no pide tarjeta. Solo te registras con tu email, eliges contraseña y tu cuenta queda activa al instante — sin email de verificación. Si te convence, compras un plan después; si no, la licencia se desactiva sola.' },
        { q: '¿Qué pasa al terminar los 14 días?', a: 'BIMS deja de ejecutar comandos, pero tus proyectos y modelos en Revit no se ven afectados — todo lo que hiciste durante la prueba queda intacto. Para seguir usándolo basta con elegir un plan y se reactiva en la misma cuenta.' },
        { q: '¿Es compatible con mi versión de Revit?', a: 'BIMS funciona en Revit 2024, 2025, 2026 y 2027 sobre Windows 10 / 11. La instalación toma menos de un minuto y no requiere configuración manual.' },
        { q: '¿Cómo es la garantía de devolución?', a: 'Si dentro de los primeros 7 días después de comprar decides que BIMS no es para ti, nos escribes a soporte@bimsaddin.com o por WhatsApp y te devolvemos el 100 % de tu dinero. Sin preguntas, sin formularios largos.' },
        { q: '¿Puedo cambiar de plan o instalar en varios equipos?', a: 'Sí. El plan Individual cubre 1 equipo, el Profesional hasta 3, y el plan Empresa no tiene límite. Puedes subir de plan en cualquier momento — solo pagas la diferencia prorrateada.' },
        { q: '¿Por qué Windows muestra una advertencia al instalar BIMS?', a: 'BIMS es un add-in nuevo y aún está en proceso de obtener su firma digital, por lo que Windows SmartScreen puede mostrar un aviso de “editor desconocido”. No es un virus. Para instalarlo: ejecuta BIMS_Setup.exe, si aparece la ventana azul haz clic en “Más información” y luego en “Ejecutar de todas formas”. Estamos tramitando la firma para eliminar este aviso en próximas versiones.' },
        { q: '¿BIMS funciona con modelos vinculados?', a: 'Sí. Varios comandos —en especial del módulo Encofrado y Tarrajeo por Habitación— están diseñados para trabajar con modelos vinculados, reconociendo muros, columnas y demás elementos de los documentos enlazados.' },
      ],
    },

    download: {
      title: '📥 Descarga BIMS',
      descStrong: '¿Aún no tienes licencia?',
      descRest: ' Empieza con el trial gratuito de 14 días — te enviamos tu clave al instante.',
      ctaTrial: '🎁 Activar trial gratis 14 días',
      ctaDownload: '⬇ Descargar instalador (requiere clave)',
      pills: ['Windows 10 / 11', 'Revit 2024', 'Revit 2025', 'Revit 2026', 'Revit 2027'],
      smartTitle: '¿Windows muestra un aviso al instalar? Es normal — así lo abres',
      smartDesc: { pre: 'BIMS es un add-in nuevo y todavía está en proceso de obtener su firma digital (certificado). Por eso, al ejecutar el instalador, ', strong: 'Windows SmartScreen', post: ' puede mostrar una advertencia azul de “editor desconocido”. No es un virus: solo significa que Microsoft aún no reconoce al editor. Para instalarlo igualmente:' },
      smartSteps: [
        'Ejecuta el archivo BIMS_Setup.exe que descargaste.',
        'Si aparece la ventana azul “Windows protegió tu PC”, haz clic en “Más información”.',
        'Pulsa el botón “Ejecutar de todas formas” que aparece abajo.',
        'Continúa con el instalador con normalidad — toma menos de un minuto.',
      ],
      smartFootPre: 'Estamos tramitando la firma digital para eliminar este aviso en próximas versiones. Si tienes cualquier duda, escríbenos a ',
      smartFootPost: ' o por WhatsApp.',
      privacyTitle: 'Privacidad y Seguridad',
      privacyDesc: 'BIMS solo recopila los datos estrictamente necesarios para activar tu licencia y entregar actualizaciones. Toda la información se almacena de forma segura en servidores de Google Cloud. Nunca vendemos ni compartimos tus datos con terceros para fines de marketing. ',
      privacyLink: '→ Leer la Política de Privacidad completa',
      privacyHref: '/privacy-policy.html',
    },

    footer: {
      tagline: 'Plugin profesional para Autodesk Revit',
      version: 'Versión 1.1.4',
      colProduct: 'Producto',
      colPricing: 'Precios',
      colLegal: 'Legal',
      colContact: 'Contacto',
      product: [
        { href: '#features', label: 'Capacidades' },
        { href: '#casos', label: 'Casos de uso' },
        { href: '#efectividad', label: 'Resultados' },
      ],
      pricing: [
        { href: '#precios', label: 'Desde S/60/mes' },
        { href: '#precios', label: 'Plan Profesional' },
      ],
      pricingEnterprise: 'Empresa — Consultar',
      enterpriseSubject: 'BIMS%20Licencia%20Empresa',
      legal: [
        { href: '/privacy-policy.html', label: 'Política de Privacidad' },
        { href: '/terminos.html', label: 'Términos y Condiciones' },
        { href: '/libro-reclamaciones.html', label: 'Libro de Reclamaciones' },
      ],
      copyright: '© 2026 BIMS. Todos los derechos reservados.',
      trademark: 'Autodesk y Revit son marcas registradas de Autodesk, Inc.',
    },

    backToTop: 'Volver arriba',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // ENGLISH
  // ───────────────────────────────────────────────────────────────────────────
  en: {
    langSwitch: { label: 'ES', aria: 'View the page in Spanish', toGo: 'Español' },

    meta: {
      title: 'BIMS — Automate formwork, plastering and DWG sheets in Revit',
      description: 'BIMS — Professional Autodesk Revit add-in that automates formwork, rebar, plastering and DWG export. Compatible with Revit 2024, 2025, 2026 and 2027.',
    },

    announce: {
      gift: '🎁',
      free: '14 days FREE',
      desc: ' — Try BIMS, no card required · Revit 2024/2025/2026/2027',
      cta: 'Start trial →',
    },

    nav: {
      links: [
        { href: '#video-demo', label: 'Demo' },
        { href: '#casos', label: 'Use cases' },
        { href: '#efectividad', label: 'Results' },
        { href: '#precios', label: 'Pricing' },
        { href: '#faq', label: 'FAQ' },
        { href: '#contacto', label: 'Contact' },
      ],
      cta: 'Free trial →',
      download: 'Download',
      menu: 'Menu',
    },

    marquee: {
      heading: 'Over 30 commands in your Revit ribbon',
      commands: [
        'Assign Grids', 'Transfer Parameters', 'Merge Parameters', 'Transfer ID',
        'Host Mark', 'Assign Host ID', 'Assign Room', 'Import DWG',
        'Import DWG (Standalone)', 'Export NWC', 'Calculate Volumes', 'Note Style',
        'Solid → Mass', 'Add CAD to Selection', 'Highlight Selection', 'Match Graphics',
        'Export Sheets to DWG', 'Automated Formwork', 'Room Plastering', 'Column Rebar',
        'Column Stirrups', 'Beam Rebar', 'Wall Rebar', 'Slab Rebar', 'Inspection Chambers',
        'Calculate Length', 'Assign Cover Level', 'Assign Sector', 'Number Fixtures',
        'Scale Solid', 'Convert to DirectShape', 'Export to Family (.rfa)',
      ],
    },

    hero: {
      eyebrow: 'Add-in for Autodesk Revit',
      title: { pre: 'What takes you ', h1: '4 hours', mid: ' in Revit,', post: 'BIMS does in ', h2: '4 minutes' },
      descPre: 'An add-in with ',
      descStrong: '30+ tools',
      descPost: ' for structure, rebar, formwork and sheet-to-DWG export with embedded images — one of a kind.',
      cta: 'Start your 14-day free trial →',
      subNote: 'No credit card · Instant activation · ',
      subNoteLink: 'Watch the 45s demo',
      guarantee: '100% money-back guarantee within 7 days if you’re not convinced',
      mockup: {
        title: 'Structural-Project.rvt — Autodesk Revit 2027',
        ribbon: [
          { icon: '🏗️', label: 'Formwork' },
          { icon: '🔩', label: 'Rebar' },
          { icon: '🎨', label: 'Plastering' },
          { icon: '📐', label: 'DWG → NWC' },
          { icon: '📤', label: 'Export DWG' },
          { icon: '🧰', label: 'Utilities' },
        ],
        console: [
          '> Running Formwork…',
          '→ 142 elements analyzed',
          '✓ Panels generated in 22 s',
          '> Export Sheets to DWG…',
          '✓ 10 sheets · embedded images (OLE)',
        ],
        badgeValue: '−80%',
        badgeLabel: 'time on repetitive tasks',
        hint: '▶ See BIMS in action',
      },
    },

    appStore: {
      // "Available on" (not "Verified"): matches the official badge and avoids
      // implying the Certified Apps Program, which BIMS is not part of.
      badge: 'Available on the Autodesk App Store',
    },

    midCta: {
      title: 'Stop losing hours on repetitive Revit tasks',
      desc: 'Formwork, rebar, plastering and DWG sheets — automated. Try it free for 14 days, no card.',
      cta: 'Start free trial →',
      note: '7-day guarantee · Instant activation',
    },

    videoDemo: {
      title: 'See BIMS in action (45s)',
      subtitle: 'A real demonstration on a structural project',
      iframeTitle: 'BIMS demonstration in Revit',
      playAria: 'Play BIMS demo in Revit',
      thumbAlt: 'BIMS demonstration on a real Revit project',
      ctaPre: 'Ready to try it on your own project? ',
      ctaLink: 'Activate your free trial →',
    },

    clips: {
      eyebrow: 'In action',
      title: 'BIMS in action, command by command',
      subtitle: 'Short clips: watch each tool solve a real Revit task',
      soon: 'Video coming soon',
      close: 'Close ✕',
      closeAria: 'Close',
      items: [
        { title: 'Formwork for the whole building in 1 click', desc: 'Generates formwork walls and floors over the structure, automatically.' },
        { title: 'Export sheets to DWG with the images inside', desc: 'Images stay embedded in the DWG, not as external references.' },
        { title: 'Plastering for every room', desc: 'Creates wall and floor finishes per room, ready to quantify.' },
        { title: 'Import DWG, scale solids and export to .RFA family', desc: 'Turns a DWG’s solids into editable Revit objects: scale them and export them as an .RFA family.' },
        { title: 'Assign grids to hundreds of elements', desc: 'Each element gets its nearest grids with no manual selection.' },
        { title: 'Column and beam reinforcement in minutes', desc: 'Calculates and places the structural rebar automatically.' },
      ],
    },

    bento: {
      eyebrow: 'Capabilities',
      title: 'A complete add-in, command by command',
      subtitle: 'Real workflows that automate entire structural documentation tasks.',
      items: {
        dwg: {
          badge: 'One of a kind',
          title: 'Export Sheets to DWG with embedded images',
          desc: 'Export your sheets (ViewSheets) to DWG with the images embedded inside the file itself (OLE), not as external references. The result is a fully portable DWG you can send to a client or consultant without the images breaking or going missing.',
          points: [
            'Multi-sheet selection with preview',
            'Images embedded in the DWG (not as external paths)',
            'Keeps scales, styles and export settings',
            'A single portable file, ideal for the CDE',
          ],
        },
        encofrado: {
          title: 'Automated Formwork',
          desc: 'Select the structural elements and BIMS classifies each one by type and generates its formwork as native Revit walls and floors, always extruded outward and automatically trimmed between adjacent elements. Ready to quantify.',
          points: [
            'Columns → perimeter walls',
            'Beams → side walls + bottom floor',
            'Slabs → floor · Stairs → walls + sloped floors',
            'Automatic trimming, integrated with Revit schedules',
          ],
        },
        acero: {
          title: 'Reinforcing Steel',
          desc: 'Calculates and places the rebar in structural elements. In columns it generates the longitudinal reinforcement (rectangular or circular) and the stirrups with their confinement zones and 135° hooks, compliant with Peruvian seismic-resistant code.',
          points: [
            'Longitudinal reinforcement in columns',
            'Stirrups with automatic confinement zones',
            '135° hooks per code',
          ],
          tags: ['LOD 400', 'E.030', 'E.060'],
        },
        tarrajeo: {
          title: 'Room-based Plastering',
          desc: 'Select one or more rooms and BIMS detects the bounding walls and columns, generating plaster walls toward the interior and the floor (screed) as native, quantifiable elements. It also works with linked models.',
          points: [
            'Multi-room selection',
            'Detects bounding elements automatically',
            'Walls + screed ready to quantify',
          ],
        },
        utilidades: {
          title: 'Import and Convert DWG',
          desc: 'Converts and decomposes the solids of a DWG file into objects you can manipulate inside Revit (DirectShapes). Once converted, you can scale them, export them as an editable .rfa family or prepare them for coordination. Ideal for reusing external geometry (DWG, SAT, IFC) without depending on the original file.',
          points: [
            'Imports and decomposes DWG solids into Revit objects',
            'Standalone option: geometry isn’t deleted when removing the DWG',
            'Then scale, convert or export them to an .rfa family',
            'Calculate volumes and export NWC for Navisworks',
          ],
        },
        geometria: {
          title: 'Geometry Tools',
          desc: 'Manipulate the geometry of any element with solids: scale it with a configurable factor, convert it to DirectShape or export it (one or several elements) as an .rfa family with editable solids.',
          points: [
            'Scale Solid (configurable factor)',
            'Convert to DirectShape',
            'Export to Family (.rfa), editable',
          ],
        },
        general: {
          title: 'Productivity and Parameters',
          desc: 'Speed up repetitive tasks: assign grids to hundreds of elements at once, transfer or merge parameters, assign rooms to walls and floors, and match graphics between elements in a view.',
          points: [
            'Assign Grids across the whole model',
            'Transfer / Merge Parameters',
            'Assign Room · Match Graphics',
          ],
        },
        alcance: {
          title: '30+ commands · Revit 2024-2027',
          desc: 'A complete add-in for structure, formwork, plastering, geometry and documentation, organized into the General, Structures and Geometry panels. Compatible with Windows 10/11 and Revit 2024 to 2027.',
          points: [],
        },
      },
    },

    useCases: {
      eyebrow: 'Practical use cases',
      title: 'Complete workflows, end to end',
      subtitle: 'Pick a task and watch, step by step, how BIMS solves it inside Revit — from selecting elements to a result ready to quantify or deliver.',
      complianceTitle: '📐 Contribution to BIM Standards',
      visuals: {
        encofrado: {
          caption: 'Result — Formwork generated automatically',
          rows: ['Column → walls', 'Beam → sides + bottom', 'Slab → floor'],
          withBims: 'with BIMS',
          manual: 'manual',
        },
        dwg: {
          caption: 'Before vs. after — DWG export (drag to compare)',
          labelBefore: '❌ Revit native',
          labelAfter: '✓ BIMS export',
          beforeTitle: 'Images as external files',
          beforeDesc: 'when you move the DWG, the links break',
          afterTitle: 'Embedded images (OLE)',
          afterDesc: 'a single portable file',
        },
        tarrajeo: {
          caption: 'Diagram — Plastering generated in plan',
          svgRoom: 'Room',
          svgInner: 'plaster toward the interior',
          svgAria: 'Room floor plan with plastering',
        },
        acero: {
          caption: 'Diagram — Reinforced column section',
          svgLabel: 'Reinforced column',
          svgAria: 'Column section with reinforcement',
          note: 'Longitudinal bars + 135° stirrups with confinement',
        },
        nwc: {
          caption: 'Flow — External DWG to federated model',
          steps: ['External DWG', 'Revit object', 'NWC Navisworks'],
        },
      },
      cases: {
        encofrado: {
          tab: '🏗️ Automated Formwork',
          title: 'Automated Formwork — From structural elements to quantities, in minutes',
          intro: 'Instead of modeling the formwork wall by wall for every column, beam and slab, you select the structural elements and BIMS generates all the formwork, classifying it by type, trimming the joints and leaving it ready to quantify.',
          steps: [
            { n: '01', t: 'Select the types and the elements', d: 'You choose the wall and floor types to use as formwork, then select the model’s columns, beams, slabs or stairs (directly or via category filters).' },
            { n: '02', t: 'BIMS classifies and generates each face', d: 'The system identifies each element’s type and creates the formwork as native Revit walls and floors, always extruded outward: columns → perimeter walls, beams → side walls + bottom floor, slabs → floor, stairs → vertical walls + sloped floors.' },
            { n: '03', t: 'Automatic trimming between elements', d: 'BIMS detects adjacent elements and removes overlaps between beam and column formwork, preserving curves and complex geometry so the area is exact, with no over-measurement.' },
            { n: '04', t: 'Ready to quantify', d: 'The formwork is integrated into the model as native Walls/Floors, quantifiable and detailable directly in Revit schedules, with no extra steps.' },
          ],
          compliance: [
            { k: 'LOD 300 → 400:', v: 'The formwork moves from a conceptual representation to detailed construction geometry, validated and ready for direct quantification from the model.' },
            { k: '5D BIM:', v: 'Formwork quantities (m² per element type) are pulled straight from the model for budgeting and cost control, with no duplicate data entry.' },
          ],
        },
        'dwg-export': {
          tab: '📤 Export Sheets to DWG',
          title: 'Export Sheets to DWG — Portable files with embedded images, no broken references',
          intro: 'Revit’s native export saves your sheets’ images as external files: when you move or send the DWG, the links break and the images disappear. BIMS embeds them inside the file itself (OLE), producing a DWG that travels complete.',
          steps: [
            { n: '01', t: 'Select the sheets to export', d: 'You pick one or more sheets (ViewSheets) from your project, with their views, details and images already placed. There’s a multi-selection preview.' },
            { n: '02', t: 'BIMS exports to DWG with OLE images', d: 'Each sheet is converted to DWG keeping scales, styles and your export settings. Images are embedded inside the file, not as external paths, eliminating the broken links typical of native export.' },
            { n: '03', t: 'A portable file ready to share', d: 'You get a single DWG with everything embedded: open it on any machine or CAD software, or send it to the client’s CDE without losing a single image.' },
          ],
          compliance: [
            { k: 'BIM deliverables (ISO 19650):', v: 'Ensures the drawings sent to the client’s CDE or to site don’t depend on external files, removing a frequent cause of revisions rejected for incomplete information.' },
            { k: 'Interoperability:', v: 'The resulting DWG is compatible with any CAD software, without losing the visual fidelity of the images.' },
          ],
        },
        tarrajeo: {
          tab: '🧱 Room-based Plastering',
          title: 'Room-based Plastering — Quantifiable finishes from the model’s rooms',
          intro: 'Modeling plaster face by face is slow and error-prone. With BIMS you select the rooms and the system automatically creates the wall finish and the screed of each room as native, measurable elements.',
          steps: [
            { n: '01', t: 'Select types and rooms', d: 'You choose the wall and/or floor type for the plaster and select one or more rooms from the architectural model, even from linked models.' },
            { n: '02', t: 'BIMS detects the boundaries and generates the plaster', d: 'The system recognizes the walls and columns bounding each room, creates plaster walls on the interior vertical faces and generates the floor (screed) following the room outline, using native types (Wall/Floor).' },
            { n: '03', t: 'Finishes ready to quantify', d: 'Each surface becomes a quantifiable element, ready for finish take-off and the finishes budget per room.' },
          ],
          compliance: [
            { k: 'LOD 300 → 400:', v: 'Adds the finish layer as a quantifiable element, raising the architectural model’s LOD to fabrication and site level.' },
            { k: 'Federation with links:', v: 'Works on models where architecture/structure live in linked files (ISO 19650), respecting the multidisciplinary BIM workflow.' },
          ],
        },
        acero: {
          tab: '🔩 Column Rebar',
          title: 'Column Rebar — Longitudinal reinforcement and stirrups per code',
          intro: 'BIMS calculates and places your columns’ rebar: it generates the longitudinal bars and the stirrups with their confinement zones and 135° hooks, compliant with Peruvian seismic-resistant code, leaving the rebar model ready for review.',
          steps: [
            { n: '01', t: 'Select the columns', d: 'You pick one or more columns, rectangular or circular.' },
            { n: '02', t: 'Define the reinforcement', d: 'You configure diameters, bar counts and the stirrup distribution with their confinement zones.' },
            { n: '03', t: 'BIMS places the rebar', d: 'It generates the longitudinal bars and the 135° stirrups, with confinement zones automatically calculated per the seismic-resistant code, on the structural element.' },
          ],
          compliance: [
            { k: 'LOD 400:', v: 'Longitudinal bars and stirrups with exact positioning, 135° hooks and defined confinement zones.' },
            { k: 'E.030 / E.060 (NTP):', v: 'Confinement and geometry compliant with Peruvian seismic-resistant design and reinforced-concrete standards.' },
          ],
        },
        'dwg-nwc': {
          tab: '📐 DWG → NWC Import',
          title: 'DWG → NWC Import — External geometry ready to manipulate and coordinate',
          intro: 'Converts and decomposes the solids of a DWG file into native Revit objects (DirectShapes) you can scale, export to an .rfa family or prepare for coordination. Ideal for integrating vendor or discipline geometry without depending on the original file.',
          steps: [
            { n: '01', t: 'Import the external DWG', d: 'BIMS reads the DWG file and decomposes its solids into native Revit objects (DirectShapes). With the standalone option, the geometry isn’t removed when you delete the DWG.' },
            { n: '02', t: 'Manipulate the geometry in Revit', d: 'Once converted, the objects are editable: you can scale them with a factor, convert them to DirectShape or export them as an .rfa family with editable solids, as well as calculate their volumes.' },
            { n: '03', t: 'Export to NWC for Navisworks', d: 'Convert the DirectShapes to compatible categories (Mass / Generic Model) and prepare the federated model for coordination and clash detection in Navisworks.' },
          ],
          compliance: [
            { k: 'Model federation (ISO 19650-3):', v: 'Integrates external disciplines into the coordinated model, enabling multidisciplinary review from a single source.' },
            { k: 'CDE:', v: 'Turns external files into native objects within the project’s CDE, keeping traceability.' },
          ],
        },
      },
    },

    metrics: {
      eyebrow: 'Quantified efficiency',
      title: 'BIMS vs. manual processes',
      subtitle: 'Figures tied to specific tasks, based on the time-comparison chart.',
      quickCaption: 'from the time-comparison chart',
      quickLabels: [
        'Assign grids to 1000 elements',
        'Formwork for 1 structural level',
        'Export 10 sheets to DWG',
      ],
      timeTitle: 'Time per task (minutes)',
      errorTitle: 'Error rate (%)',
      radarTitle: 'Automation level per module',
      timeLabels: ['Formwork (1 level)', 'Export Sheets to DWG (10 sheets)', 'Assign Grids (1000 elem)', 'Column Rebar (50 col)'],
      errorLabels: ['Mass formwork', 'DWG export (references)', 'Grid assignment', 'Fixture numbering'],
      radarLabels: ['Formwork', 'DWG (export)', 'Grids', 'Rebar', 'Analysis', 'Geometry', 'DWG→Revit', 'Plumbing'],
      dsManualTime: 'Without BIMS (manual)',
      dsBims: 'With BIMS',
      dsManualPct: 'Without BIMS (%)',
      dsBimsPct: 'With BIMS (%)',
      dsManualProcess: 'Manual process',
      unitMin: ' min',
    },

    roi: {
      title: 'Calculate how much you’d save with BIMS',
      subtitle: 'Move the sliders to match your real workload',
      projects: 'Projects per month',
      hours: 'Documentation hours per project',
      rate: 'Your professional hourly rate',
      hoursSuffix: ' h',
      ratePrefix: 'S/ ',
      note: { strong: 'Indicative estimate.', rest: ' Assumes an 80% time reduction on the tasks BIMS automates (formwork, rebar, DWG export, grid assignment). Actual savings depend on each firm’s workflow.' },
      resultLabel: 'You save per month',
      resultHours: ' h',
      moneyPre: '= S/ ',
      moneyPost: ' in recovered fees',
      paybackPre: 'The license pays for itself in ',
      paybackBold: '≈ {d} days',
      paybackPost: ' of work.',
      cta: 'Try free for 14 days →',
      locale: 'en-US',
    },

    pricing: {
      eyebrow: 'Plans and pricing',
      title: 'Activate BIMS instantly',
      subtitle: 'Pay securely by card through Culqi and receive your key by email in minutes.',
      guaranteeStrong: '7-day guarantee.',
      guaranteeRest: ' If BIMS doesn’t convince you, write to us within 7 days of your purchase and we’ll refund 100% of your money. No questions asked.',
      priceFrom: 'from ', // el símbolo de moneda (S/ o $) lo añade Pricing según la región de pago
      perMonth: ' /mo',
      custom: 'Custom',
      contactSales: 'Contact sales',
      contactNote: 'Custom quote · Same-day response',
      buy: 'Buy ',
      buyNote: 'Secure payment with Culqi · Key by email in minutes',
      orTrial: 'or try 14 days free →',
      footnotePre: 'When you buy you choose the duration: ',
      footnoteDurations: '1, 3, 6 or 12 months',
      footnoteMid: '. The longer the license, the bigger the discount — up to ',
      footnoteDiscount: '−17%',
      footnotePost: ' off the monthly price.',
      regionAskIntl: 'Seeing USD prices by mistake? Switch to soles (Peru)',
      regionAskPe: 'Paying from outside Peru? See prices in USD',
      tableHead: 'What’s included',
      catalog: {
        individual: { badge: 'Individual', name: 'BIMS Individual', desc: 'Complete Revit plugin, every panel unlocked. License for 1 machine. Ideal for independent professionals.' },
        profesional: { badge: 'Professional', name: 'BIMS Professional', desc: 'Everything in Individual, for up to 3 machines. Priority 24h support and early access to beta features.', ribbon: '★ Most chosen' },
        empresa: { badge: 'Enterprise', name: 'BIMS Enterprise', desc: 'Licenses for your whole team, invoicing in the company’s name and training included.' },
      },
      compare: {
        cols: ['Individual', 'Professional ⭐', 'Enterprise'],
        rows: [
          { label: 'All BIMS panels unlocked', cells: ['✓', '✓', '✓'] },
          { label: 'Machines (PCs) per license', cells: ['1', 'up to 3', 'unlimited'] },
          { label: 'Email support', cells: ['48 h', 'priority 24 h', 'dedicated'] },
          { label: 'Early access to beta features', cells: ['—', '✓', '✓'] },
          { label: 'Training included', cells: ['—', '—', '✓'] },
          { label: 'Invoicing in company name', cells: ['—', '✓', '✓'] },
        ],
      },
    },

    culqiModal: {
      durations: [
        { key: '1m', label: '1 month' },
        { key: '3m', label: '3 months' },
        { key: '6m', label: '6 months' },
        { key: '12m', label: '1 year' },
      ],
      onetime: 'One-time',
      subscription: 'Monthly subscription',
      subPeriod: '1st month free · then S/{price}/mo',
      emailLabel: 'Email to receive your key',
      emailPlaceholder: 'yourname@company.com',
      emailError: 'Enter a valid email.',
      closeAria: 'Close',
      processing: 'Processing…',
      subscribeBtn: 'Subscribe — S/{price}/mo',
      payBtn: 'Pay S/{price} by card',
      secureNote: 'Secure payment with Culqi · You receive your key by email',
      successUrl: '/success-en.html',
      errLoad: 'Couldn’t load the checkout. Please reload the page.',
      errRejected: 'Payment declined',
      errPay: 'Error processing the payment. Please try again.',
      // Payment method selector (Culqi Peru / Lemon Squeezy international)
      methodCulqi: '🇵🇪 Peru',
      methodIntl: '🌎 International',
      methodCulqiHint: 'Peruvian cards · soles (Culqi)',
      methodIntlHint: 'International cards · USD (Lemon Squeezy)',
      // International payment (Lemon Squeezy)
      intlOr: 'or',
      intlPay: '🌍 Pay by card',
      intlNote: 'Visa / Mastercard / Amex · billed in USD via Lemon Squeezy',
      intlMonthly: 'Monthly',
      intlYearly: 'Yearly',
      intlPerMonth: '/mo',
      intlPerYear: '/yr',
      intlPayBtn: 'Pay ${price} by card',
      intlSecure: 'Secure international payment via Lemon Squeezy · you receive your key by email',
      intlYearNote: '2 months free vs. monthly',
      plans: {
        individual: {
          features: ['All BIMS panels', '1 machine / 1 user', 'Updates included', 'Email support (48 h)'],
          periods: {
            '1m': 'one-time · 1-month license',
            '3m': 'one-time · 3-month license',
            '6m': 'one-time · 6-month license',
            '12m': 'one-time · 1-year license',
            subscription: 'per month · recurring subscription',
          },
          savings: {
            '3m': 'Equals S/53/mo — save 11% vs monthly',
            '6m': 'Equals S/50/mo — save 17% vs monthly',
            '12m': 'Equals S/49.7/mo — save 17% vs monthly',
          },
        },
        profesional: {
          features: ['All BIMS panels', 'Up to 3 machines / 1 user', 'Updates included', 'Priority support (24 h)', 'Early beta features'],
          periods: {
            '1m': 'one-time · 1-month license',
            '3m': 'one-time · 3-month license',
            '6m': 'one-time · 6-month license',
            '12m': 'one-time · 1-year license',
            subscription: 'per month · recurring subscription',
          },
          savings: {
            '3m': 'Equals S/89/mo — save 11% vs monthly',
            '6m': 'Equals S/83/mo — save 17% vs monthly',
            '12m': 'Equals S/83/mo — save 17% vs monthly',
          },
        },
      },
    },

    trial: {
      eyebrow: '14 days free',
      title: 'Try BIMS free for 14 days',
      desc: 'No card. No commitment. Activate the 30+ commands on your real project and see how much time you get back before paying.',
      features: [
        'All panels unlocked (General · Structures · Geometry)',
        'Compatible with Revit 2024, 2025, 2026 and 2027',
        '1 machine · Automatic activation by email',
        'If you’re convinced, you keep your account when you buy',
      ],
      formTitle: 'Create your trial account',
      formSub: 'Ready in 30 seconds. No verification email — your account is active instantly.',
      emailLabel: 'Work email *',
      emailPlaceholder: 'yourname@company.com',
      nameLabel: 'Name',
      namePlaceholder: 'Your name',
      companyLabel: 'Company / Firm (optional)',
      companyPlaceholder: 'Construction company, engineering firm, freelancer…',
      pwLabel: 'Password *',
      pwHint: '(minimum 8 characters)',
      pwPlaceholder: 'At least 8 characters',
      pw2Label: 'Confirm password *',
      pw2Placeholder: 'Repeat the password',
      show: 'Show',
      hide: 'Hide',
      pwMatch: '✓ Passwords match',
      pwNoMatch: '✗ Passwords don’t match',
      honeypotLabel: 'Website (leave it empty)',
      submit: '🎁 Activate my 14-day trial',
      submitting: 'Processing…',
      strength: ['Very weak', 'Weak', 'Acceptable', 'Good', 'Excellent'],
      errEmail: '✗ Please enter a valid email.',
      errPwLen: '✗ The password must be at least 8 characters.',
      errPwMatch: '✗ Passwords don’t match.',
      errGeneric: 'Something went wrong. Try again or write to us at soporte@bimsaddin.com',
      errConn: '✗ Connection error. Check your internet and try again.',
      termsPre: 'By continuing you accept our ',
      termsLink: 'terms',
      termsMid: ' and ',
      privacyLink: 'privacy policy',
      termsPost: '. Your email is used only for license notices.',
      termsHref: '/terminos-en.html',
      privacyHref: '/privacy-policy-en.html',
      successUrl: '/trial-success-en.html',
    },

    testimonials: {
      title: 'We’re still collecting our first reviews',
      desc: 'BIMS is a recent product. Instead of showing generic testimonials, we’d rather wait for real reviews with permission to publish them. If you’ve already tried it and want to be one of the first to share your experience, we’d love to hear from you.',
      cta: '💬 Leave my review on WhatsApp',
      whatsappText: 'Hi%2C%20I%20want%20to%20leave%20my%20review%20about%20BIMS',
      footerPre: 'In the meantime, we invite you to try the plugin yourself with ',
      footerLink1: '14 days free',
      footerMid: ' and to review our ',
      footerLink2: 'documented use cases',
      footerPost: '.',
    },

    faq: {
      eyebrow: 'FAQ',
      title: 'Frequently asked questions',
      items: [
        { q: 'Do I need a credit card to start the trial?', a: 'No. The 14-day trial doesn’t ask for a card. You just register with your email, choose a password and your account is active instantly — no verification email. If you like it, you buy a plan afterward; if not, the license deactivates on its own.' },
        { q: 'What happens when the 14 days end?', a: 'BIMS stops running commands, but your Revit projects and models are unaffected — everything you did during the trial stays intact. To keep using it, just choose a plan and it reactivates on the same account.' },
        { q: 'Is it compatible with my version of Revit?', a: 'BIMS works on Revit 2024, 2025, 2026 and 2027 on Windows 10 / 11. Installation takes less than a minute and requires no manual setup.' },
        { q: 'How does the money-back guarantee work?', a: 'If within the first 7 days after buying you decide BIMS isn’t for you, write to us at soporte@bimsaddin.com or via WhatsApp and we’ll refund 100% of your money. No questions, no long forms.' },
        { q: 'Can I change plans or install on several machines?', a: 'Yes. The Individual plan covers 1 machine, Professional up to 3, and the Enterprise plan has no limit. You can upgrade at any time — you only pay the prorated difference.' },
        { q: 'Why does Windows show a warning when installing BIMS?', a: 'BIMS is a new add-in and is still in the process of obtaining its digital signature, so Windows SmartScreen may show an “unknown publisher” notice. It’s not a virus. To install it: run BIMS_Setup.exe, if the blue window appears click “More info” and then “Run anyway”. We’re processing the signature to remove this notice in upcoming versions.' },
        { q: 'Does BIMS work with linked models?', a: 'Yes. Several commands —especially in the Formwork and Room Plastering modules— are designed to work with linked models, recognizing walls, columns and other elements from the linked documents.' },
      ],
    },

    download: {
      title: '📥 Download BIMS',
      descStrong: 'Don’t have a license yet?',
      descRest: ' Start with the free 14-day trial — we send your key instantly.',
      ctaTrial: '🎁 Activate free 14-day trial',
      ctaDownload: '⬇ Download installer (key required)',
      pills: ['Windows 10 / 11', 'Revit 2024', 'Revit 2025', 'Revit 2026', 'Revit 2027'],
      smartTitle: 'Does Windows show a warning on install? It’s normal — here’s how to open it',
      smartDesc: { pre: 'BIMS is a new add-in and is still in the process of obtaining its digital signature (certificate). That’s why, when you run the installer, ', strong: 'Windows SmartScreen', post: ' may show a blue “unknown publisher” warning. It’s not a virus: it just means Microsoft doesn’t recognize the publisher yet. To install it anyway:' },
      smartSteps: [
        'Run the BIMS_Setup.exe file you downloaded.',
        'If the blue “Windows protected your PC” window appears, click “More info”.',
        'Press the “Run anyway” button that appears below.',
        'Continue with the installer as usual — it takes less than a minute.',
      ],
      smartFootPre: 'We’re processing the digital signature to remove this notice in upcoming versions. If you have any questions, write to us at ',
      smartFootPost: ' or via WhatsApp.',
      privacyTitle: 'Privacy and Security',
      privacyDesc: 'BIMS only collects the data strictly necessary to activate your license and deliver updates. All information is stored securely on Google Cloud servers. We never sell or share your data with third parties for marketing purposes. ',
      privacyLink: '→ Read the full Privacy Policy',
      privacyHref: '/privacy-policy-en.html',
    },

    footer: {
      tagline: 'Professional plugin for Autodesk Revit',
      version: 'Version 1.1.4',
      colProduct: 'Product',
      colPricing: 'Pricing',
      colLegal: 'Legal',
      colContact: 'Contact',
      product: [
        { href: '#features', label: 'Capabilities' },
        { href: '#casos', label: 'Use cases' },
        { href: '#efectividad', label: 'Results' },
      ],
      pricing: [
        { href: '#precios', label: 'From S/60/mo' },
        { href: '#precios', label: 'Professional plan' },
      ],
      pricingEnterprise: 'Enterprise — Inquire',
      enterpriseSubject: 'BIMS%20Enterprise%20License',
      legal: [
        { href: '/privacy-policy-en.html', label: 'Privacy Policy' },
        { href: '/terminos-en.html', label: 'Terms & Conditions' },
        { href: '/libro-reclamaciones.html', label: 'Complaints Book' },
      ],
      copyright: '© 2026 BIMS. All rights reserved.',
      trademark: 'Autodesk and Revit are registered trademarks of Autodesk, Inc.',
    },

    backToTop: 'Back to top',
  },
};
