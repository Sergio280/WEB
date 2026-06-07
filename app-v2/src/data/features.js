// Bento de features — SOLO funciones activas para los usuarios.
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
    id: 'acero',
    size: 'md',
    icon: '🔩',
    title: 'Acero de Refuerzo',
    desc: 'Calcula y coloca la armadura en los elementos estructurales. En columnas genera el refuerzo longitudinal (rectangular o circular) y los estribos con sus zonas de confinamiento y ganchos a 135°, conforme a la normativa sismorresistente peruana.',
    points: [
      'Refuerzo longitudinal en columnas',
      'Estribos con zonas de confinamiento automáticas',
      'Ganchos a 135° según norma',
    ],
    accent: 'violet',
    tags: ['LOD 400', 'E.030', 'E.060'],
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
    id: 'utilidades',
    size: 'md',
    icon: '🧰',
    title: 'Importar y Convertir DWG',
    desc: 'Convierte y descompone los sólidos de un archivo DWG en objetos manipulables dentro de Revit (DirectShapes). Una vez convertidos, puedes escalarlos, exportarlos como familia .rfa editable o prepararlos para coordinación. Ideal para reutilizar geometría externa (DWG, SAT, IFC) sin depender del archivo original.',
    points: [
      'Importa y descompone sólidos del DWG a objetos de Revit',
      'Opción independiente: la geometría no se borra al quitar el DWG',
      'Luego escálalos, conviértelos o expórtalos a familia .rfa',
      'Calcula volúmenes y exporta NWC para Navisworks',
    ],
    accent: 'emerald',
  },
  {
    id: 'geometria',
    size: 'sm',
    icon: '📐',
    title: 'Herramientas de Geometría',
    desc: 'Manipula la geometría de cualquier elemento con sólidos: escálalo con un factor configurable, conviértelo a DirectShape o expórtalo (uno o varios elementos) como familia .rfa con sólidos editables.',
    points: [
      'Escalar Sólido (factor configurable)',
      'Convertir a DirectShape',
      'Exportar a Familia (.rfa) editable',
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
    id: 'alcance',
    size: 'wide',
    icon: '⚡',
    title: '30+ comandos · Revit 2024-2027',
    desc: 'Un add-in completo para estructura, encofrado, tarrajeo, geometría y documentación, organizado en los paneles General, Estructuras y Geometría. Compatible con Windows 10/11 y Revit 2024 a 2027.',
    points: [],
    accent: 'violet',
  },
];
