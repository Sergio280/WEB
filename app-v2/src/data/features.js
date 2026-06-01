// Bento de features — SOLO funciones activas para los usuarios.
// (El módulo Refuerzo / Planilla BBS está oculto en el sitio actual, por eso
//  no aparece aquí.) Todo el contenido proviene de comandos/claims ya
//  presentes y activos en la home.
export const BENTO = [
  {
    id: 'dwg',
    size: 'lg', // tarjeta grande destacada
    badge: 'Único en su categoría',
    icon: '📤',
    title: 'Exportar Planos a DWG con imágenes embebidas',
    desc: 'Las imágenes se insertan dentro del DWG (OLE) — sin archivos externos ni referencias rotas. Comparte un solo archivo portátil sin perder nada.',
    points: ['Mantiene escalas y estilos', 'Imágenes embebidas (OLE)', 'Archivo portátil para el CDE'],
    accent: 'brand',
  },
  {
    id: 'encofrado',
    size: 'md',
    icon: '🏗️',
    title: 'Encofrado Automatizado',
    desc: 'Genera paneles de encofrado clasificando cada elemento estructural.',
    points: ['Columnas → Muros', 'Vigas → Laterales + Suelos', 'Losas → Suelos', 'Recortes automáticos'],
    accent: 'emerald',
  },
  {
    id: 'acero',
    size: 'md',
    icon: '🔩',
    title: 'Acero de Refuerzo',
    desc: 'Distribuye y modela la armadura en los elementos estructurales conforme a normativas peruanas.',
    points: ['Acero en Columnas (rectangular y circular)', 'Estribos con zonas de confinamiento'],
    accent: 'violet',
    tags: ['LOD 400', 'E.030', 'E.060'],
  },
  {
    id: 'tarrajeo',
    size: 'sm',
    icon: '🎨',
    title: 'Tarrajeo por Habitación',
    desc: 'Muros y suelos de acabado desde las habitaciones — compatible con modelos vinculados.',
    points: [],
    accent: 'brand',
  },
  {
    id: 'utilidades',
    size: 'sm',
    icon: '🧰',
    title: 'Importar y Convertir DWG',
    desc: 'Convierte archivos DWG externos en objetos nativos de Revit y exporta NWC para coordinación.',
    points: [],
    accent: 'emerald',
  },
  {
    id: 'alcance',
    size: 'wide',
    icon: '⚡',
    title: '30+ comandos · Revit 2024-2027',
    desc: 'Un add-in completo para estructura, encofrado, tarrajeo y documentación. Compatible con Windows 10/11 y Revit 2024 a 2027.',
    points: [],
    accent: 'violet',
  },
];
