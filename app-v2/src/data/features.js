// Bento de features — funciones activas para los usuarios, más las que están
// en BETA y se entregan con el acceso anticipado de los planes Profesional y
// Empresa (marcadas con su distintivo: no prometas en la cinta lo que aún no
// está en la cinta de todos).
// Orden y tamaños cuadran la rejilla de 3 columnas: lg=2, wide=3, resto=1.
// Cada fila es una tarjeta ancha + una estrecha; suman 15 celdas antes de
// 'alcance', así que no queda ningún hueco.
// (El módulo Refuerzo / Planilla BBS está oculto en el sitio actual, por eso
//  no aparece aquí.) Descripciones basadas en los tooltips reales de cada
//  comando en Application.cs del add-in.
export const BENTO = [
  {
    id: 'dwg',
    size: 'lg', // tarjeta grande destacada
    badge: 'Único en su categoría',
    icon: '📤',
    title: 'Exportar Planos a DWG con imágenes embebidas',
    desc: 'Exporta tus láminas (ViewSheets) a DWG insertando las imágenes dentro del propio archivo (OLE), no como referencias externas. El resultado es un DWG totalmente portátil que puedes enviar a un cliente o consultor sin que se rompan ni se pierdan las imágenes.',
    points: [
      'Selección múltiple de planos con vista previa',
      'Imágenes insertadas en el DWG (no como rutas externas)',
      'Mantiene escalas, estilos y configuración de exportación',
      'Un solo archivo portátil, ideal para el CDE',
    ],
    accent: 'brand',
  },
  {
    id: 'encofrado',
    size: 'md',
    icon: '🏗️',
    title: 'Encofrado Automatizado',
    desc: 'Selecciona los elementos estructurales y BIMS clasifica cada uno por tipo y genera su encofrado como muros y suelos nativos de Revit, extruidos siempre hacia afuera y recortados automáticamente entre elementos contiguos. Queda listo para cuantificar.',
    points: [
      'Columnas → muros perimetrales',
      'Vigas → muros laterales + suelo de fondo',
      'Losas → suelo · Escaleras → muros + suelos inclinados',
      'Recortes automáticos, integrado con tablas de Revit',
    ],
    accent: 'emerald',
  },
  {
    id: 'metrado',
    size: 'lg', // 2 columnas: es la salida del encofrado, va junto a él
    badge: 'Nuevo en 1.2.1',
    icon: '📊',
    title: 'Metrado de Encofrado en tablas de Revit',
    desc: 'Una vez generado el encofrado, BIMS crea las tablas de planificación con el área de contacto agrupada por la categoría del elemento anfitrión —columnas, vigas, losas, muros, escaleras y cimentación—, con subtotales por nivel y una tabla RESUMEN. El metrado sale del propio modelo, no de una hoja aparte.',
    points: [
      'Una tabla por categoría + RESUMEN con subtotales',
      'Área de contacto sumable, con total por nivel y general',
      'Verifica la conservación: nada se pierde ni se cuenta dos veces',
      'Los paños no metrables se listan con su motivo y se seleccionan',
    ],
    accent: 'emerald',
  },
  {
    id: 'tarrajeo',
    size: 'sm',
    icon: '🎨',
    title: 'Tarrajeo por Habitación',
    desc: 'Selecciona una o varias habitaciones y BIMS detecta los muros y columnas que las limitan, generando muros de tarrajeo hacia el interior y el suelo (contrapiso) como elementos nativos cuantificables. Funciona también con modelos vinculados.',
    points: [
      'Selección múltiple de habitaciones',
      'Detecta elementos límite automáticamente',
      'Muros + contrapiso listos para metrar',
    ],
    accent: 'brand',
  },
  {
    id: 'acero',
    size: 'lg', // 2 columnas: cubre TODO el esqueleto, no solo columnas
    icon: '🔩',
    title: 'Acero de Refuerzo automático según la E.060',
    desc: 'Calcula y coloca la armadura de todo el esqueleto: columnas, vigas, muros, losas, cimentación, escaleras y losa aligerada. Las vigas se arman por eje continuo —el fierro atraviesa los apoyos de lado a lado, como en obra— y los empalmes se crean como objetos nativos de Revit, así que salen en las tablas y sobreviven a los cambios del modelo.',
    points: [
      'Vigas por eje continuo, sin empalmar en el apoyo (21.5.2.3)',
      'Confinamiento y ganchos a 135° del capítulo sismorresistente',
      'Malla en muros, losas y cimientos, con barras en las aberturas',
      'Escaleras y losa aligerada (viguetas + acero de temperatura)',
    ],
    accent: 'violet',
    tags: ['LOD 400', 'E.030', 'E.060'],
  },
  {
    id: 'geometria',
    size: 'sm',
    icon: '📐',
    title: 'Herramientas de Geometría',
    desc: 'Manipula la geometría de cualquier elemento con sólidos: escálalo con un factor configurable, conviértelo a modelo genérico o expórtalo (uno o varios elementos) como familia .rfa con sólidos editables.',
    points: [
      'Escalar Sólido (factor configurable)',
      'Convertir a modelo genérico',
      'Exportar a Familia (.rfa) editable',
    ],
    accent: 'violet',
  },
  {
    id: 'despiece',
    size: 'lg', // 2 columnas: entregable completo (Excel), no una utilidad suelta
    badge: 'Nuevo en 1.2.1',
    icon: '📋',
    title: 'Despiece de Acero y planilla de corte en Excel',
    desc: 'Lee la armadura ya modelada y resuelve cómo cortarla a partir de barras comerciales minimizando la chatarra. Entrega un Excel con el resumen para compras, el detalle por diámetro, los patrones de corte para el fierrero y la trazabilidad pieza a pieza. Solo lee el modelo: no lo modifica.',
    points: [
      'Compara la barra de 9 m con la de 12 m para decidir la compra',
      'Declara el mínimo teórico: cuánto margen queda de verdad',
      'Avisa de las piezas que no caben en la barra y exigen empalme',
      'Con selección despieza solo eso; sin selección, todo el proyecto',
    ],
    accent: 'violet',
  },
  {
    id: 'general',
    size: 'sm',
    icon: '🎯',
    title: 'Productividad y Parámetros',
    desc: 'Acelera tareas repetitivas: asigna rejillas a cientos de elementos a la vez, transfiere o une parámetros, asigna ambientes a muros y suelos, e iguala gráficos entre elementos de una vista.',
    points: [
      'Asignar Rejillas a todo el modelo',
      'Transferir / Unir Parámetros',
      'Asignar Ambiente · Igualar Gráficos',
    ],
    accent: 'brand',
  },
  {
    id: 'ifc',
    size: 'lg', // 2 columnas: es la novedad grande, y necesita explicar el matiz
    badge: 'Beta',
    icon: '🔁',
    title: 'Importar IFC a elementos nativos',
    desc: 'El vínculo IFC de Revit trae geometría que no se edita ni se cuantifica por tipo: sirve para mirar, no para trabajar. BIMS lee los datos paramétricos del archivo —niveles, ejes y perfiles— y coloca muros, vigas, columnas, losas y escaleras nativos. Cada elemento creado se audita contra el sólido del IFC antes de darlo por bueno.',
    points: [
      'De CYPE, Tekla o ArchiCAD; o de Revit, recargando sus familias',
      'Auditoría de fidelidad: 1 mm de posición y 1 % de volumen',
      'Reanudable: repetirlo no duplica lo que ya se importó',
      'Beta: acceso anticipado de los planes Profesional y Empresa',
    ],
    accent: 'brand',
  },
  {
    id: 'utilidades',
    size: 'md',
    icon: '🧰',
    title: 'Importar y Convertir DWG',
    desc: 'Convierte y descompone los sólidos de un archivo DWG en objetos manipulables dentro de Revit (modelos genéricos). Una vez convertidos, puedes escalarlos, exportarlos como familia .rfa editable o prepararlos para coordinación. Ideal para reutilizar geometría externa (DWG, SAT, IFC) sin depender del archivo original.',
    points: [
      'Importa y descompone sólidos del DWG a objetos de Revit',
      'Opción independiente: la geometría no se borra al quitar el DWG',
      'Luego escálalos, conviértelos o expórtalos a familia .rfa',
      'Calcula volúmenes y exporta NWC para Navisworks',
    ],
    accent: 'emerald',
  },
  {
    id: 'alcance',
    size: 'wide',
    icon: '⚡',
    title: '30+ comandos · Revit 2024-2027',
    desc: 'Un add-in completo para estructura, encofrado, metrados, tarrajeo, geometría y documentación, organizado en los paneles General, Estructuras, Geometría y Sistema. La interfaz se muestra en el idioma en que esté instalado Revit. Compatible con Windows 10/11 y Revit 2024 a 2027.',
    points: [],
    accent: 'violet',
  },
];
