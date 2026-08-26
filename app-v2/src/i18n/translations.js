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
// La lista de países hispanohablantes se mudó a su propio archivo para que
// pueda importarla también la edge function que reparte idioma (no puede
// cargar este archivo entero). Se re-exporta para no tocar a quien ya la
// importaba desde aquí.
export { SPANISH_COUNTRIES } from './paises-hispanos.js';

export const translations = {
  // ───────────────────────────────────────────────────────────────────────────
  // ESPAÑOL
  // ───────────────────────────────────────────────────────────────────────────
  es: {
    langSwitch: { label: 'EN', aria: 'Ver la página en inglés', toGo: 'English' },

    meta: {
      title: 'BIMS — Automatiza encofrado, tarrajeo y planos DWG en Revit',
      description: 'BIMS — Add-in profesional para Autodesk Revit que automatiza encofrado, metrados, refuerzo, despiece de acero, tarrajeo y exportación DWG. Compatible con Revit 2024, 2025, 2026 y 2027.',
    },

    announce: {
      gift: '🎁',
      free: '14 días GRATIS',
      desc: ' — Prueba BIMS sin tarjeta · Revit 2024/2025/2026/2027',
      cta: 'Empezar trial →',
      version: 'Ya disponible la versión 1.2.1',
      versionDetail: 'Despiece de acero · Metrado de encofrado · Importar IFC (beta)',
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
        'Exportar Planos a DWG', 'Encofrado Automatizado', 'Metrado de Encofrado', 'Tarrajeo Habitación',
        'Acero Columnas', 'Estribos Columnas', 'Acero Vigas', 'Acero Muros', 'Acero Losas', 'Despiece',
        'Registros Sanitarios',
        'Calcular Longitud', 'Asignar Cota Tapa', 'Asignar Sector', 'Numerar Aparatos',
        'Escalar Sólido', 'Convertir a modelo genérico', 'Exportar a Familia (.rfa)',
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
      // El recuento va SIEMPRE con la media: «5,0» a secas insinúa un respaldo
      // que dos reseñas todavía no dan. La fuente se oculta en pantallas
      // estrechas —donde el sello no cabe entero— pero el recuento nunca.
      ratingCount: '{n} reseñas',
      ratingSource: 'en el Autodesk App Store',
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

    saltarAlContenido: 'Saltar al contenido',
    langBanner: {
      es: {
        msg: 'Esta página también está en español.',
        cta: 'Ver en español',
        dismiss: 'Cerrar aviso',
      },
      en: {
        msg: 'This page is also available in English.',
        cta: 'View in English',
        dismiss: 'Dismiss',
      },
    },
    clips: {
      eyebrow: 'En acción',
      title: 'BIMS en acción, comando por comando',
      subtitle: 'Clips cortos: mira cada herramienta resolver una tarea real de Revit',
      soon: 'Video próximamente',
      close: 'Cerrar ✕',
      closeAria: 'Cerrar',
      items: {
        encofrado: { title: 'Encofrado de todo el edificio en 1 clic', desc: 'Genera muros y suelos de encofrado sobre la estructura, automático.' },
        dwg: { title: 'Exporta planos a DWG con las imágenes adentro', desc: 'Las imágenes quedan incrustadas en el DWG, no como referencia externa.' },
        tarrajeo: { title: 'Tarrajeo de todos los ambientes', desc: 'Crea el revestimiento de muros y pisos por habitación, listo para metrar.' },
        rfa: { title: 'Importa DWG, escala sólidos y exporta a familia .RFA', desc: 'Convierte los sólidos de un DWG en objetos editables de Revit: escálalos y expórtalos como familia .RFA.' },
        rejillas: { title: 'Asigna rejillas a cientos de elementos', desc: 'Cada elemento recibe sus ejes más cercanos sin selección manual.' },
        refuerzo: { title: 'Refuerzo de columnas y vigas en minutos', desc: 'Calcula y coloca el acero estructural automáticamente.' },
      },
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
        metrado: {
          badge: 'Nuevo en 1.2.1',
          title: 'Metrado de Encofrado en tablas de Revit',
          desc: 'Una vez generado el encofrado, BIMS crea las tablas de planificación con el área de contacto agrupada por la categoría del elemento anfitrión —columnas, vigas, losas, muros, escaleras y cimentación—, con subtotales por nivel y una tabla RESUMEN. El metrado sale del propio modelo, no de una hoja aparte.',
          points: [
            'Una tabla por categoría + RESUMEN con subtotales',
            'Área de contacto sumable, con total por nivel y general',
            'Verifica la conservación: nada se pierde ni se cuenta dos veces',
            'Los paños no metrables se listan con su motivo y se seleccionan',
          ],
        },
        acero: {
          badge: 'Nuevo en 1.2.1',
          title: 'Acero de Refuerzo automático (E.060 · marco ACI 318)',
          desc: 'Calcula y coloca la armadura de todo el esqueleto: columnas, vigas, muros, losas, cimentación, escaleras y losa aligerada. El detallado —longitud de desarrollo, traslapes clase B, confinamiento y ganchos a 135°— sale de la E.060, que adopta el marco de la ACI 318; f’c y fy son datos de entrada, así que el cálculo se ajusta a los materiales de cada proyecto.',
          points: [
            'Vigas por eje continuo, sin empalmar en el apoyo (21.5.2.3)',
            'Longitud de desarrollo y traslapes clase B del marco ACI 318',
            'Confinamiento y ganchos a 135° del capítulo sismorresistente',
            'Malla en muros y losas, escaleras y losa aligerada (viguetas)',
          ],
          tags: ['LOD 400', 'E.060', 'ACI 318', 'E.030'],
        },
        despiece: {
          badge: 'Nuevo en 1.2.1',
          title: 'Despiece de Acero y planilla de corte en Excel',
          desc: 'Lee la armadura ya modelada y resuelve cómo cortarla a partir de barras comerciales minimizando la chatarra. Entrega un Excel con el resumen para compras, el detalle por diámetro, los patrones de corte para el fierrero y la trazabilidad pieza a pieza. Solo lee el modelo: no lo modifica.',
          points: [
            'Compara la barra de 9 m con la de 12 m para decidir la compra',
            'Declara el mínimo teórico: cuánto margen queda de verdad',
            'Avisa de las piezas que no caben en la barra y exigen empalme',
            'Con selección despieza solo eso; sin selección, todo el proyecto',
          ],
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
          desc: 'Convierte y descompone los sólidos de un archivo DWG en objetos manipulables dentro de Revit (modelos genéricos). Una vez convertidos, puedes escalarlos, exportarlos como familia .rfa editable o prepararlos para coordinación. Ideal para reutilizar geometría externa (DWG, SAT, IFC) sin depender del archivo original.',
          points: [
            'Importa y descompone sólidos del DWG a objetos de Revit',
            'Opción independiente: la geometría no se borra al quitar el DWG',
            'Luego escálalos, conviértelos o expórtalos a familia .rfa',
            'Calcula volúmenes y exporta NWC para Navisworks',
          ],
        },
        geometria: {
          title: 'Herramientas de Geometría',
          desc: 'Manipula la geometría de cualquier elemento con sólidos: escálalo con un factor configurable, conviértelo a modelo genérico o expórtalo (uno o varios elementos) como familia .rfa con sólidos editables.',
          points: [
            'Escalar Sólido (factor configurable)',
            'Convertir a modelo genérico',
            'Exportar a Familia (.rfa) editable',
          ],
        },
        ifc: {
          badge: 'Nuevo en 1.2.1 · Beta',
          title: 'Importar IFC a elementos nativos',
          desc: 'La novedad grande de la 1.2.1. El vínculo IFC de Revit trae geometría que no se edita ni se cuantifica por tipo: sirve para mirar, no para trabajar. BIMS lee los datos paramétricos del archivo —niveles, ejes y perfiles— y coloca muros, vigas, columnas, losas y escaleras nativos. Cada elemento creado se audita contra el sólido del IFC antes de darlo por bueno.',
          points: [
            'De CYPE, Tekla o ArchiCAD; o de Revit, recargando sus familias',
            'Auditoría de fidelidad: 1 mm de posición y 1 % de volumen',
            'Reanudable: repetirlo no duplica lo que ya se importó',
            'Beta: acceso anticipado de los planes Profesional y Empresa',
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
          desc: 'Un add-in completo para estructura, encofrado, metrados, tarrajeo, geometría y documentación, organizado en los paneles General, Estructuras, Geometría y Sistema. La interfaz se muestra en el idioma en que esté instalado Revit. Compatible con Windows 10/11 y Revit 2024 a 2027.',
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
        despiece: {
          caption: 'Esquema — Patrón de corte sobre una barra comercial',
          barLabel: 'Barra de 9 m troceada en piezas del modelo',
          scrapLabel: '↯ retal',
          bar9: 'estándar peruano',
          bar12: 'comparativa para la compra',
          sheets: ['Resumen', 'Por diámetro', 'Patrones', 'Piezas', 'No caben'],
          note: 'Esquema ilustrativo: el reparto real lo calcula BIMS con la armadura de tu modelo.',
        },
        ifc: {
          caption: 'Flujo — De IFC a elementos nativos de Revit',
          steps: ['IFC de CYPE / Tekla', 'BIMS lee ejes y perfiles', 'Muros, vigas y columnas nativos'],
          auditLabel: 'Auditoría de cada elemento',
          auditValue: 'posición ≤ 1 mm · volumen ≤ 1 %',
          note: 'Nuevo en 1.2.1, en beta — acceso anticipado en los planes Profesional y Empresa.',
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
            { n: '04', t: 'Listo para cuantificar', d: 'El encofrado queda integrado en el modelo como muros/suelos nativos, cuantificable y detallable directamente en las tablas de Revit, sin pasos adicionales.' },
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
            { n: '02', t: 'BIMS detecta los límites y genera el tarrajeo', d: 'El sistema reconoce los muros y columnas que limitan cada habitación, crea muros de tarrajeo en las caras verticales internas y genera el suelo (contrapiso) siguiendo el contorno del ambiente, usando tipos nativos (muros/suelos).' },
            { n: '03', t: 'Acabados listos para metrar', d: 'Cada superficie queda como elemento cuantificable, listo para el metrado de revestimientos y el presupuesto de acabados por ambiente.' },
          ],
          compliance: [
            { k: 'LOD 300 → 400:', v: 'Agrega la capa de acabado como elemento cuantificable, elevando el LOD del modelo arquitectónico al nivel de fabricación y obra.' },
            { k: 'Federación con vínculos:', v: 'Funciona sobre modelos donde la arquitectura/estructura está en archivos vinculados (ISO 19650), respetando el flujo BIM multidisciplinario.' },
          ],
        },
        acero: {
          tab: '🔩 Acero de Refuerzo',
          title: 'Acero de Refuerzo — La armadura de todo el esqueleto, calculada con la E.060',
          intro: 'BIMS no dibuja barras: aplica la norma. Calcula y coloca la armadura de columnas, vigas, muros, losas, cimientos, escaleras y losa aligerada, deduciendo longitudes de desarrollo, ganchos, traslapes y zonas de confinamiento de la E.060, artículo por artículo.',
          steps: [
            { n: '01', t: 'Elige los elementos y su acero', d: 'Seleccionas columnas, vigas, muros, losas y cimientos, escaleras o losa aligerada, y defines diámetros, recubrimiento y separaciones. Los valores por defecto ya son los de obra: f’c 210 kg/cm² y acero grado 60.' },
            { n: '02', t: 'La viga se arma por eje continuo, no tramo a tramo', d: 'BIMS reconoce las vigas alineadas y consecutivas que en obra se arman como una sola: el fierro longitudinal atraviesa las columnas de lado a lado. Armar cada tramo por separado cortaría las barras justo en el apoyo, donde el momento negativo es máximo y donde la norma prohíbe empalmar.' },
            { n: '03', t: 'Confinamiento, ganchos y traslapes por norma', d: 'Las zonas de confinamiento, el espaciamiento de estribos y los ganchos a 135° salen del capítulo sismorresistente; los traslapes se calculan como clase B a partir de la longitud de desarrollo. Son las expresiones del marco ACI 318 que la E.060 adopta, resueltas con la f’c y la fy que declares. En muros y losas la malla va en las dos direcciones, con las barras de refuerzo alrededor de las aberturas.' },
            { n: '04', t: 'Armadura nativa, viva y cuantificable', d: 'Las barras son objetos de armadura de Revit y los empalmes son empalmes reales: aparecen en las tablas, se recorren en cadena y se mantienen si el elemento cambia. De ahí sale directo el despiece a Excel.' },
          ],
          compliance: [
            { k: 'LOD 400:', v: 'Barras y estribos con posicionamiento exacto, ganchos a 135°, zonas de confinamiento definidas y empalmes como objetos reales del modelo.' },
            { k: 'E.030 / E.060 (NTP):', v: 'Longitud de desarrollo, traslapes clase B, confinamiento y veto de empalmes en zona sísmica calculados con la norma peruana, no estimados a ojo.' },
          ],
        },
        despiece: {
          tab: '📋 Despiece de Acero',
          title: 'Despiece de Acero — De la armadura modelada a la planilla de corte, en un clic',
          intro: 'El despiece se sigue rehaciendo a mano en una hoja aparte, y cada cambio del modelo lo deja desfasado. BIMS lee la armadura que ya está modelada, resuelve cómo cortarla a partir de barras comerciales minimizando la chatarra y entrega la planilla en Excel, lista para compras y para el fierrero.',
          steps: [
            { n: '01', t: 'Ejecuta sobre la selección o sobre todo el proyecto', d: 'Con elementos seleccionados despieza solo esos; sin selección, el modelo entero. Es un comando de solo lectura: no abre ninguna transacción ni modifica el proyecto, así que cancelar es seguro en cualquier punto.' },
            { n: '02', t: 'BIMS resuelve el corte y compara la barra', d: 'Agrupa las piezas por diámetro y calcula cómo obtenerlas de barras comerciales de 9 m dejando el mínimo desperdicio, y repite el cálculo con barras de 12 m para decidir la compra con criterio. Los pesos salen del catálogo de BIMS, no de los parámetros que cada quien haya modelado.' },
            { n: '03', t: 'Planilla en Excel, lista para obra', d: 'Un archivo con cinco hojas: Resumen (cuánto acero pedir y en qué barra), Por diámetro, Patrones de corte para el fierrero, Piezas para trazabilidad, y las piezas que no caben en la barra y exigen empalme. Nada se omite en silencio: lo que no se pudo despiezar se declara con su motivo.' },
          ],
          compliance: [
            { k: '5D BIM:', v: 'El metrado de acero (kg por diámetro y barras a comprar) se extrae del propio modelo, de modo que presupuesto, compras y geometría comparten una única fuente.' },
            { k: 'Trazabilidad:', v: 'Cada línea de la planilla se puede seguir hasta la pieza del modelo de la que salió, y las que quedan fuera se reportan con su causa en lugar de desaparecer del total.' },
          ],
        },
        ifc: {
          tab: '🔁 Importar IFC (Nuevo · Beta)',
          title: 'Importar IFC a nativo — Del bloque que no se puede tocar al elemento de Revit',
          intro: 'Nuevo en la versión 1.2.1. Vincular un IFC en Revit da geometría que no se edita ni se cuantifica por tipo: sirve para mirar, no para trabajar. BIMS lee los datos paramétricos del archivo y reconstruye el modelo con elementos nativos. Llega en beta: se entrega con el acceso anticipado de los planes Profesional y Empresa.',
          steps: [
            { n: '01', t: 'Dile de dónde viene el archivo', d: 'De otro programa (CYPE, Tekla, ArchiCAD…), y la reconstrucción se hace por geometría exacta; o de un Revit exportado con «Exportar IFC» de BIMS, que deja junto al archivo las familias originales para recargarlas tal cual — incluso si el modelo venía de una versión de Revit distinta.' },
            { n: '02', t: 'BIMS reconstruye el modelo', d: 'Crea niveles, columnas, vigas, muros, losas, escaleras con sus descansos, zapatas, instalaciones, puertas, ventanas y rejillas. Lo que no tiene lectura paramétrica cae a geometría exacta en vez de perderse, y los empalmes de pocos centímetros que dejan los modelos de cálculo se filtran en lugar de ensuciar el modelo.' },
            { n: '03', t: 'Con auditoría, no con fe', d: 'Cada elemento creado se compara contra el sólido del IFC: posición dentro de 1 mm y volumen dentro del 1 %. Lo que no pasa se reporta con su motivo en un log, la importación se puede cancelar a mitad, y repetirla no duplica lo ya creado.' },
          ],
          compliance: [
            { k: 'Interoperabilidad (openBIM / IFC):', v: 'El modelo de la especialidad externa deja de ser una referencia muerta y pasa a ser modelo editable, medible y coordinable dentro de Revit.' },
            { k: 'Trazabilidad de la conversión:', v: 'Cada elemento importado queda auditado contra la geometría original y lo que no pasa se declara en el log, en lugar de darse por bueno en silencio.' },
          ],
        },
        'dwg-nwc': {
          tab: '📐 Importación DWG → NWC',
          title: 'Importación DWG → NWC — Geometría externa lista para manipular y coordinar',
          intro: 'Convierte y descompone los sólidos de un archivo DWG en objetos nativos de Revit (modelos genéricos) que puedes escalar, exportar a familia .rfa o preparar para coordinación. Ideal para integrar geometría de proveedores o especialidades sin depender del archivo original.',
          steps: [
            { n: '01', t: 'Importa el DWG externo', d: 'BIMS lee el archivo DWG y descompone sus sólidos en objetos nativos de Revit (modelos genéricos). Con la opción independiente, la geometría no se elimina al borrar el DWG.' },
            { n: '02', t: 'Manipula la geometría en Revit', d: 'Una vez convertidos, los objetos son editables: puedes escalarlos con un factor, convertirlos a modelo genérico o exportarlos como familia .rfa con sólidos editables, además de calcular sus volúmenes.' },
            { n: '03', t: 'Exporta a NWC para Navisworks', d: 'Convierte los modelos genéricos a categorías compatibles (Mass / Generic Model) y prepara el modelo federado para coordinación y detección de interferencias en Navisworks.' },
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
      note: { strong: 'Estimación orientativa.', rest: ' Asume una reducción del 80 % del tiempo en tareas automatizables por BIMS (encofrado, refuerzo, exportación a DWG, asignación de rejillas). El ahorro real depende del flujo de trabajo de cada estudio.' },
      resultLabel: 'Te ahorras al mes',
      resultHours: ' h',
      moneyPre: '= ',
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
      footnoteDiscount: '−{pct}%', // {pct} lo calcula Pricing con ahorroMaximoPct()
      footnotePost: ' frente al precio mensual.',
      // Nota equivalente para la región de pago internacional: Lemon Squeezy
      // solo vende mensual y anual, así que prometer 1/3/6/12 meses ahí sería
      // ofrecer algo que su checkout no puede darle.
      footnoteIntlPre: 'Al comprar eliges la periodicidad: ',
      footnoteIntlDurations: 'mensual o anual',
      footnoteIntlMid: '. El plan anual sale hasta ',
      footnoteIntlDiscount: '−{pct}%', // {pct} lo calcula Pricing con ahorroMaximoPctUsd()
      footnoteIntlPost: ' más barato que pagar mes a mes.',
      // Solo se muestra en la región Perú (Culqi/soles). Fuera de Perú cobra
      // Lemon Squeezy como Merchant of Record y los impuestos los gestiona él.
      igvNote: 'Precios en soles con IGV incluido.',
      promoBadge: '🎁 Promoción — ahorras S/{ahorro}',
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
      // Plantilla del texto de ahorro. Los números ({mensual} y {pct}) los
      // calcula CulqiModal desde data/pricing.js, para que nunca contradigan al
      // precio mostrado. Antes estaban escritos a mano y duplicados por plan y
      // por idioma: seis strings que había que recordar actualizar a la vez.
      savingsTpl: 'Equivale a S/{mensual}/mes — ahorras {pct}% vs mensual',
      igvNote: 'IGV incluido',
      promoApplied: '🎁 Promoción aplicada — ahorras S/{ahorro}',
      // Bloque de datos para el comprobante electrónico (solo pagos en Perú).
      cpTitle: '¿Necesitas comprobante?',
      cpBoleta: 'Boleta',
      cpFactura: 'Factura (empresa)',
      cpRucLabel: 'RUC de la empresa',
      cpRucPlaceholder: '20123456789',
      cpRazonLabel: 'Razón social',
      cpRazonPlaceholder: 'Constructora Ejemplo S.A.C.',
      cpDniLabel: 'DNI (opcional)',
      cpDniPlaceholder: '12345678',
      cpDniRequiredLabel: 'DNI',
      cpHintBoleta: 'Para persona natural. Recibes la boleta por email.',
      cpHintBoletaReq: 'Desde S/700 la SUNAT exige identificar al comprador.',
      cpHintFactura: 'Recibes la factura electrónica por email, con IGV desagregado.',
      cpErrRuc: 'Ingresa un RUC válido de 11 dígitos.',
      cpErrRazon: 'Ingresa la razón social de la empresa.',
      cpErrDni: 'Ingresa un DNI válido de 8 dígitos.',
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
      errCaptcha: '✗ Completa la verificación de seguridad para continuar.',
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
      eyebrow: 'Lo que dicen',
      title: 'Reseñas verificadas en el Autodesk App Store',
      desc: 'Las únicas que publicamos: las que cualquiera puede ir a comprobar en la ficha oficial, con nombre y fecha. Ni recogidas por privado ni reescritas.',
      summary: 'Media de {n} reseñas en el Autodesk App Store',
      starsAria: '{n} de 5 estrellas',
      verify: 'Verla en el Autodesk App Store',
      source: 'Autodesk App Store',
      inviteDesc: '¿Ya usas BIMS? Una reseña tuya ayuda al siguiente ingeniero a decidirse.',
      inviteAppStore: 'Dejar reseña en el App Store',
      cta: '💬 Contarnos por WhatsApp',
      whatsappText: 'Hola%2C%20quiero%20dejar%20mi%20rese%C3%B1a%20sobre%20BIMS',
      footerPre: 'También puedes probar el plugin tú mismo con ',
      footerLink1: '14 días gratis',
      footerMid: ' o revisar nuestros ',
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
        { q: '¿Por qué Windows muestra una advertencia al instalar BIMS?', a: 'BIMS está firmado digitalmente, así que Windows muestra un editor verificado en lugar de “editor desconocido”. Como el certificado es reciente, SmartScreen todavía puede mostrar un aviso hasta que acumule descargas: si aparece, haz clic en “Más información” y luego en “Ejecutar de todas formas”. El instalador está firmado y su firma se puede comprobar en las propiedades del archivo.' },
        { q: '¿En qué se diferencia importar un IFC con BIMS de vincularlo en Revit?', a: 'El vínculo de Revit trae la geometría como bloques que no se editan ni se cuantifican por tipo. BIMS lee los datos paramétricos del IFC y crea elementos nativos —muros, vigas, columnas, losas, escaleras— que se editan, se miden y entran en tus tablas. Cada elemento se audita contra la geometría original (1 mm de posición, 1 % de volumen) y lo que no pasa se reporta en un log. La función está en beta: se entrega con el acceso anticipado de los planes Profesional y Empresa.' },
        { q: '¿El despiece de acero y el metrado de encofrado modifican mi modelo?', a: 'No. El despiece es de solo lectura: lee la armadura ya modelada y escribe un Excel aparte, sin tocar el proyecto. El metrado de encofrado tampoco cambia la geometría: crea tablas de planificación en el Navegador de proyectos con el área de contacto agrupada por categoría, y te avisa de los paños que no pudo medir en lugar de omitirlos del total.' },
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
      smartDesc: { pre: 'BIMS está firmado digitalmente, así que Windows muestra el nombre del editor verificado, no “editor desconocido”. Como el certificado es reciente, ', strong: 'Windows SmartScreen', post: ' todavía puede mostrar un aviso azul hasta que acumule descargas. Si aparece, para instalarlo:' },
      smartSteps: [
        'Ejecuta el archivo BIMS.msi que descargaste.',
        'Si aparece la ventana azul “Windows protegió tu PC”, haz clic en “Más información”.',
        'Pulsa el botón “Ejecutar de todas formas” que aparece abajo.',
        'Continúa con el instalador con normalidad — toma menos de un minuto.',
      ],
      smartFootPre: 'La firma se puede comprobar en las propiedades del archivo, y el aviso desaparece a medida que crecen las descargas. Si tienes cualquier duda, escríbenos a ',
      smartFootPost: ' o por WhatsApp.',
      privacyTitle: 'Privacidad y Seguridad',
      privacyDesc: 'BIMS solo recopila los datos estrictamente necesarios para activar tu licencia y entregar actualizaciones. Toda la información se almacena de forma segura en servidores de Google Cloud. Nunca vendemos ni compartimos tus datos con terceros para fines de marketing. ',
      privacyLink: '→ Leer la Política de Privacidad completa',
      privacyHref: '/privacy-policy.html',
    },

    footer: {
      tagline: 'Plugin profesional para Autodesk Revit',
      version: 'Versión {v}', // {v} lo rellena Footer desde PLUGIN_VERSION (data/nav.js)
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
        { href: '#precios', label: 'Desde S/{price}/mes' }, // {price} lo rellena Footer desde pricing.js
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
      description: 'BIMS — Professional Autodesk Revit add-in that automates formwork, quantities, rebar, cutting lists, plastering and DWG export. Compatible with Revit 2024, 2025, 2026 and 2027.',
    },

    announce: {
      gift: '🎁',
      free: '14 days FREE',
      desc: ' — Try BIMS, no card required · Revit 2024/2025/2026/2027',
      cta: 'Start trial →',
      version: 'Version 1.2.1 now available',
      versionDetail: 'Rebar cutting list · Formwork quantities · IFC import (beta)',
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
        'Export Sheets to DWG', 'Automated Formwork', 'Formwork Quantities', 'Room Plastering',
        'Column Rebar', 'Column Stirrups', 'Beam Rebar', 'Wall Rebar', 'Slab Rebar', 'Cutting List',
        'Inspection Chambers',
        'Calculate Length', 'Assign Cover Level', 'Assign Sector', 'Number Fixtures',
        'Scale Solid', 'Convert to generic model', 'Export to Family (.rfa)',
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
      // The count always travels with the average: a bare "5.0" implies a
      // backing that two reviews don't yet give. The source is hidden on narrow
      // screens — where the badge doesn't fit — but the count never is.
      ratingCount: '{n} reviews',
      ratingSource: 'on the Autodesk App Store',
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

    saltarAlContenido: 'Skip to content',
    langBanner: {
      es: {
        msg: 'Esta página también está en español.',
        cta: 'Ver en español',
        dismiss: 'Cerrar aviso',
      },
      en: {
        msg: 'This page is also available in English.',
        cta: 'View in English',
        dismiss: 'Dismiss',
      },
    },
    clips: {
      eyebrow: 'In action',
      title: 'BIMS in action, command by command',
      subtitle: 'Short clips: watch each tool solve a real Revit task',
      soon: 'Video coming soon',
      close: 'Close ✕',
      closeAria: 'Close',
      items: {
        encofrado: { title: 'Formwork for the whole building in 1 click', desc: 'Generates formwork walls and floors over the structure, automatically.' },
        dwg: { title: 'Export sheets to DWG with the images inside', desc: 'Images stay embedded in the DWG, not as external references.' },
        tarrajeo: { title: 'Plastering for every room', desc: 'Creates wall and floor finishes per room, ready to quantify.' },
        rfa: { title: 'Import DWG, scale solids and export to .RFA family', desc: 'Turns a DWG’s solids into editable Revit objects: scale them and export them as an .RFA family.' },
        rejillas: { title: 'Assign grids to hundreds of elements', desc: 'Each element gets its nearest grids with no manual selection.' },
        refuerzo: { title: 'Column and beam reinforcement in minutes', desc: 'Calculates and places the structural rebar automatically.' },
      },
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
        metrado: {
          badge: 'New in 1.2.1',
          title: 'Formwork Quantities as Revit schedules',
          desc: 'Once the formwork is generated, BIMS builds the schedules with the contact area grouped by the host element category — columns, beams, slabs, walls, stairs and foundations — with subtotals per level and a SUMMARY schedule. The take-off comes from the model itself, not from a separate sheet.',
          points: [
            'One schedule per category + SUMMARY with subtotals',
            'Contact area that adds up, with totals per level and overall',
            'Conservation check: nothing is lost or counted twice',
            'Panels that cannot be measured are listed with their reason',
          ],
        },
        acero: {
          badge: 'New in 1.2.1',
          title: 'Automatic rebar (E.060 · ACI 318 framework)',
          desc: 'Calculates and places the rebar for the whole frame: columns, beams, walls, slabs, foundations, stairs and ribbed slabs. The detailing — development length, class B laps, confinement and 135° hooks — comes from Peruvian code E.060, which adopts the ACI 318 framework; f’c and fy are inputs, so the calculation follows the materials of each project.',
          points: [
            'Beams along the continuous axis, never spliced at the support',
            'Development length and class B laps from the ACI 318 framework',
            'Confinement zones and 135° hooks from the seismic chapter',
            'Mesh in walls and slabs, stairs and ribbed slabs (joists)',
          ],
          tags: ['LOD 400', 'E.060', 'ACI 318', 'E.030'],
        },
        despiece: {
          badge: 'New in 1.2.1',
          title: 'Rebar Cutting List in Excel',
          desc: 'It reads the rebar already modelled and works out how to cut it from commercial bars while minimising scrap. You get an Excel file with the purchasing summary, the breakdown per diameter, the cutting patterns for the steel fixer and piece-by-piece traceability. It only reads the model: it never modifies it.',
          points: [
            'Compares the 9 m bar against the 12 m one before you buy',
            'States the theoretical minimum: how much margin is really left',
            'Flags pieces that do not fit the bar and need a splice',
            'With a selection it cuts only that; with none, the whole project',
          ],
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
          desc: 'Converts and decomposes the solids of a DWG file into objects you can manipulate inside Revit (generic models). Once converted, you can scale them, export them as an editable .rfa family or prepare them for coordination. Ideal for reusing external geometry (DWG, SAT, IFC) without depending on the original file.',
          points: [
            'Imports and decomposes DWG solids into Revit objects',
            'Standalone option: geometry isn’t deleted when removing the DWG',
            'Then scale, convert or export them to an .rfa family',
            'Calculate volumes and export NWC for Navisworks',
          ],
        },
        geometria: {
          title: 'Geometry Tools',
          desc: 'Manipulate the geometry of any element with solids: scale it with a configurable factor, convert it to generic model or export it (one or several elements) as an .rfa family with editable solids.',
          points: [
            'Scale Solid (configurable factor)',
            'Convert to generic model',
            'Export to Family (.rfa), editable',
          ],
        },
        ifc: {
          badge: 'New in 1.2.1 · Beta',
          title: 'IFC import into native elements',
          desc: 'The headline addition in 1.2.1. A Revit IFC link brings in geometry you cannot edit or schedule by type: fine to look at, useless to work with. BIMS reads the parametric data in the file — levels, axes and profiles — and places native walls, beams, columns, slabs and stairs. Every element created is audited against the IFC solid before it is accepted.',
          points: [
            'From CYPE, Tekla or ArchiCAD; or from Revit, reloading its families',
            'Fidelity audit: 1 mm on position and 1 % on volume',
            'Resumable: running it again does not duplicate what was imported',
            'Beta: early access on the Professional and Company plans',
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
          desc: 'A complete add-in for structure, formwork, quantities, plastering, geometry and documentation, organized into the General, Structures, Geometry and System panels. The interface follows the language Revit is installed in. Compatible with Windows 10/11 and Revit 2024 to 2027.',
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
        despiece: {
          caption: 'Diagram — Cutting pattern on a commercial bar',
          barLabel: '9 m bar split into pieces from the model',
          scrapLabel: '↯ off-cut',
          bar9: 'Peruvian standard',
          bar12: 'comparison before buying',
          sheets: ['Summary', 'Per diameter', 'Patterns', 'Pieces', 'Do not fit'],
          note: 'Illustrative diagram: the real split is computed by BIMS from the rebar in your model.',
        },
        ifc: {
          caption: 'Flow — From IFC to native Revit elements',
          steps: ['IFC from CYPE / Tekla', 'BIMS reads axes and profiles', 'Native walls, beams, columns'],
          auditLabel: 'Audit on every element',
          auditValue: 'position ≤ 1 mm · volume ≤ 1 %',
          note: 'New in 1.2.1, in beta — early access on the Professional and Company plans.',
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
            { n: '02', t: 'BIMS detects the boundaries and generates the plaster', d: 'The system recognizes the walls and columns bounding each room, creates plaster walls on the interior vertical faces and generates the floor (screed) following the room outline, using native types (walls/floors).' },
            { n: '03', t: 'Finishes ready to quantify', d: 'Each surface becomes a quantifiable element, ready for finish take-off and the finishes budget per room.' },
          ],
          compliance: [
            { k: 'LOD 300 → 400:', v: 'Adds the finish layer as a quantifiable element, raising the architectural model’s LOD to fabrication and site level.' },
            { k: 'Federation with links:', v: 'Works on models where architecture/structure live in linked files (ISO 19650), respecting the multidisciplinary BIM workflow.' },
          ],
        },
        acero: {
          tab: '🔩 Reinforcing Steel',
          title: 'Reinforcing Steel — The rebar for the whole frame, computed with code E.060',
          intro: 'BIMS does not draw bars: it applies the code. It calculates and places the rebar for columns, beams, walls, slabs, footings, stairs and ribbed slabs, deriving development lengths, hooks, lap splices and confinement zones from E.060, article by article.',
          steps: [
            { n: '01', t: 'Pick the elements and their steel', d: 'You select columns, beams, walls, slabs and footings, stairs or ribbed slabs, and set diameters, cover and spacing. The defaults are the ones used on site: f’c 210 kg/cm² and grade 60 steel.' },
            { n: '02', t: 'Beams are reinforced along the axis, not span by span', d: 'BIMS recognises the aligned, consecutive beams that are tied as a single one on site: the longitudinal bars run right through the columns. Reinforcing each span separately would cut the bars at the support — exactly where the hogging moment peaks and where the code forbids splicing.' },
            { n: '03', t: 'Confinement, hooks and laps from the code', d: 'Confinement zones, stirrup spacing and 135° hooks come from the seismic chapter; laps are computed as class B from the development length. These are the ACI 318 framework expressions that E.060 adopts, solved with the f’c and fy you declare. In walls and slabs the mesh runs both ways, with trimmer bars around the openings.' },
            { n: '04', t: 'Native rebar, live and quantifiable', d: 'The bars are Revit rebar objects and the splices are real splices: they appear in schedules, can be walked as a chain and survive changes to the element. The Excel cutting list comes straight out of them.' },
          ],
          compliance: [
            { k: 'LOD 400:', v: 'Bars and stirrups placed exactly, 135° hooks, defined confinement zones and lap splices as real model objects.' },
            { k: 'E.030 / E.060 (Peruvian code):', v: 'Development length, class B laps, confinement and the ban on splicing in the seismic zone are computed from the code, not eyeballed.' },
          ],
        },
        despiece: {
          tab: '📋 Rebar Cutting List',
          title: 'Rebar Cutting List — From modelled rebar to the cutting schedule in one click',
          intro: 'Cutting lists are still rebuilt by hand in a separate sheet, and every model change leaves them out of date. BIMS reads the rebar already modelled, works out how to cut it from commercial bars with the least scrap, and delivers the schedule in Excel, ready for purchasing and for the steel fixer.',
          steps: [
            { n: '01', t: 'Run it on a selection or on the whole project', d: 'With elements selected it processes only those; with nothing selected, the entire model. It is a read-only command: it opens no transaction and does not modify the project, so cancelling is safe at any point.' },
            { n: '02', t: 'BIMS solves the cut and compares the bar', d: 'It groups pieces by diameter and works out how to obtain them from 9 m commercial bars with the least waste, then repeats the calculation with 12 m bars so the purchase can be decided on evidence. Weights come from the BIMS catalogue, not from whatever parameters were modelled.' },
            { n: '03', t: 'Excel schedule, ready for site', d: 'A file with five sheets: Summary (how much steel to order and in which bar), Per diameter, Cutting patterns for the steel fixer, Pieces for traceability, and the pieces that do not fit the bar and need a splice. Nothing is dropped silently: whatever could not be cut is reported with its reason.' },
          ],
          compliance: [
            { k: '5D BIM:', v: 'The steel take-off (kg per diameter and bars to purchase) is extracted from the model itself, so budgeting, purchasing and geometry share a single source.' },
            { k: 'Traceability:', v: 'Every line of the schedule can be traced back to the model piece it came from, and whatever falls outside is reported with its cause instead of vanishing from the total.' },
          ],
        },
        ifc: {
          tab: '🔁 IFC Import (New · Beta)',
          title: 'IFC import into native elements — From untouchable block to Revit element',
          intro: 'New in version 1.2.1. Linking an IFC in Revit gives you geometry you cannot edit or schedule by type: fine to look at, useless to work with. BIMS reads the parametric data in the file and rebuilds the model with native elements. It arrives in beta: it ships with the early access of the Professional and Company plans.',
          steps: [
            { n: '01', t: 'Tell it where the file comes from', d: 'From another program (CYPE, Tekla, ArchiCAD…), where the rebuild is done from the exact geometry; or from a Revit model exported with the BIMS “Export IFC”, which leaves the original families next to the file so they can be reloaded as they are — even if the model came from a different Revit version.' },
            { n: '02', t: 'BIMS rebuilds the model', d: 'It creates levels, columns, beams, walls, slabs, stairs with their landings, footings, services, doors, windows and grids. Whatever has no parametric reading falls back to exact geometry instead of being lost, and the few-centimetre stubs that analysis models leave behind are filtered out rather than cluttering the model.' },
            { n: '03', t: 'With an audit, not on faith', d: 'Every element created is compared against the IFC solid: position within 1 mm and volume within 1 %. Whatever fails is reported with its reason in a log, the import can be cancelled halfway, and running it again does not duplicate what was already created.' },
          ],
          compliance: [
            { k: 'Interoperability (openBIM / IFC):', v: 'The external discipline’s model stops being a dead reference and becomes an editable, measurable, coordinatable model inside Revit.' },
            { k: 'Traceability of the conversion:', v: 'Every imported element is audited against the original geometry, and whatever fails is declared in the log instead of being silently accepted.' },
          ],
        },
        'dwg-nwc': {
          tab: '📐 DWG → NWC Import',
          title: 'DWG → NWC Import — External geometry ready to manipulate and coordinate',
          intro: 'Converts and decomposes the solids of a DWG file into native Revit objects (generic models) you can scale, export to an .rfa family or prepare for coordination. Ideal for integrating vendor or discipline geometry without depending on the original file.',
          steps: [
            { n: '01', t: 'Import the external DWG', d: 'BIMS reads the DWG file and decomposes its solids into native Revit objects (generic models). With the standalone option, the geometry isn’t removed when you delete the DWG.' },
            { n: '02', t: 'Manipulate the geometry in Revit', d: 'Once converted, the objects are editable: you can scale them with a factor, convert them to generic model or export them as an .rfa family with editable solids, as well as calculate their volumes.' },
            { n: '03', t: 'Export to NWC for Navisworks', d: 'Convert the generic models to compatible categories (Mass / Generic Model) and prepare the federated model for coordination and clash detection in Navisworks.' },
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
      note: { strong: 'Indicative estimate.', rest: ' Assumes an 80% time reduction on the tasks BIMS automates (formwork, rebar, DWG export, grid assignment). Actual savings depend on each firm’s workflow.' },
      resultLabel: 'You save per month',
      resultHours: ' h',
      moneyPre: '= ',
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
      footnoteDiscount: '−{pct}%', // {pct} lo calcula Pricing con ahorroMaximoPct()
      footnotePost: ' off the monthly price.',
      // Same note for the international payment region: Lemon Squeezy only
      // sells monthly and yearly.
      footnoteIntlPre: 'When you buy you choose the billing period: ',
      footnoteIntlDurations: 'monthly or yearly',
      footnoteIntlMid: '. The yearly plan works out up to ',
      footnoteIntlDiscount: '−{pct}%', // {pct} lo calcula Pricing con ahorroMaximoPctUsd()
      footnoteIntlPost: ' cheaper than paying month to month.',
      // Ver nota de la versión en español: solo aplica a la región Perú.
      igvNote: 'Prices in soles include Peruvian VAT (IGV).',
      promoBadge: '🎁 Promo — you save S/{ahorro}',
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
      // Ver la nota de la versión en español: los números los calcula CulqiModal
      // desde data/pricing.js; aquí solo vive el texto.
      savingsTpl: 'Equals S/{mensual}/mo — save {pct}% vs monthly',
      igvNote: 'VAT (IGV) included',
      promoApplied: '🎁 Promo applied — you save S/{ahorro}',
      // Tax receipt block (Peru payments only). Kept in English for consistency
      // with the rest of the UI, but the documents themselves are Peruvian.
      cpTitle: 'Need a tax receipt?',
      cpBoleta: 'Boleta',
      cpFactura: 'Factura (company)',
      cpRucLabel: 'Company RUC',
      cpRucPlaceholder: '20123456789',
      cpRazonLabel: 'Legal name',
      cpRazonPlaceholder: 'Constructora Ejemplo S.A.C.',
      cpDniLabel: 'DNI (optional)',
      cpDniPlaceholder: '12345678',
      cpDniRequiredLabel: 'DNI',
      cpHintBoleta: 'For individuals. You receive the boleta by email.',
      cpHintBoletaReq: 'From S/700 SUNAT requires identifying the buyer.',
      cpHintFactura: 'You receive the electronic factura by email, with VAT broken out.',
      cpErrRuc: 'Enter a valid 11-digit RUC.',
      cpErrRazon: 'Enter the company legal name.',
      cpErrDni: 'Enter a valid 8-digit DNI.',
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
      errCaptcha: '✗ Complete the security check to continue.',
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
      eyebrow: 'What people say',
      title: 'Verified reviews on the Autodesk App Store',
      desc: 'The only ones we publish: the ones anyone can go and check on the official listing, with a name and a date. Not collected privately, not rewritten.',
      summary: 'Average of {n} reviews on the Autodesk App Store',
      starsAria: '{n} out of 5 stars',
      verify: 'See it on the Autodesk App Store',
      source: 'Autodesk App Store',
      inviteDesc: 'Already using BIMS? Your review helps the next engineer make up their mind.',
      inviteAppStore: 'Leave a review on the App Store',
      cta: '💬 Tell us on WhatsApp',
      whatsappText: 'Hi%2C%20I%20want%20to%20leave%20my%20review%20about%20BIMS',
      footerPre: 'You can also try the plugin yourself with ',
      footerLink1: '14 days free',
      footerMid: ' or review our ',
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
        { q: 'Why does Windows show a warning when installing BIMS?', a: 'BIMS is digitally signed, so Windows shows a verified publisher instead of “unknown publisher”. Because the certificate is recent, SmartScreen may still show a notice until it builds download reputation: if it appears, click “More info” and then “Run anyway”. The installer is signed and its signature can be verified in the file’s properties.' },
        { q: 'How is importing an IFC with BIMS different from linking it in Revit?', a: 'A Revit link brings the geometry in as blocks you cannot edit or schedule by type. BIMS reads the parametric data in the IFC and creates native elements — walls, beams, columns, slabs, stairs — that you can edit, measure and put in your schedules. Every element is audited against the original geometry (1 mm on position, 1 % on volume) and whatever fails is reported in a log. The feature is in beta: it ships with the early access of the Professional and Company plans.' },
        { q: 'Do the rebar cutting list and the formwork quantities modify my model?', a: 'No. The cutting list is read-only: it reads the rebar already modelled and writes a separate Excel file without touching the project. Formwork quantities do not change the geometry either: they create schedules in the Project Browser with the contact area grouped by category, and report the panels that could not be measured instead of dropping them from the total.' },
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
      smartDesc: { pre: 'BIMS is digitally signed, so Windows shows the verified publisher name, not “unknown publisher”. Because the certificate is recent, ', strong: 'Windows SmartScreen', post: ' may still show a blue notice until it builds download reputation. If it appears, to install it:' },
      smartSteps: [
        'Run the BIMS.msi file you downloaded.',
        'If the blue “Windows protected your PC” window appears, click “More info”.',
        'Press the “Run anyway” button that appears below.',
        'Continue with the installer as usual — it takes less than a minute.',
      ],
      smartFootPre: 'The signature can be verified in the file’s properties, and the notice fades as downloads grow. If you have any questions, write to us at ',
      smartFootPost: ' or via WhatsApp.',
      privacyTitle: 'Privacy and Security',
      privacyDesc: 'BIMS only collects the data strictly necessary to activate your license and deliver updates. All information is stored securely on Google Cloud servers. We never sell or share your data with third parties for marketing purposes. ',
      privacyLink: '→ Read the full Privacy Policy',
      privacyHref: '/privacy-policy-en.html',
    },

    footer: {
      tagline: 'Professional plugin for Autodesk Revit',
      version: 'Version {v}', // {v} lo rellena Footer desde PLUGIN_VERSION (data/nav.js)
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
        { href: '#precios', label: 'From S/{price}/mo' }, // {price} lo rellena Footer desde pricing.js
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
