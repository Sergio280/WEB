// ─────────────────────────────────────────────────────────────────────────────
// copy-legacy.mjs
// La landing nueva (React/Vite) es ahora la HOME: `vite build` ya emitió el
// nuevo index.html + assets a dist/. Este script copia el RESTO del sitio
// estático sin pisar ese index nuevo:
//   · páginas estáticas .html de la raíz, EXCEPTO index.html (la home antigua),
//     que NO se publica. Ver más abajo.
//   · las carpetas de assets: icono/ y update/
// NO toca app-v2, node_modules, netlify/functions ni .git.
// ─────────────────────────────────────────────────────────────────────────────
import { cpSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..'); // app-v2/scripts -> app-v2 -> repo root
const dist = join(repoRoot, 'dist');

mkdirSync(dist, { recursive: true });

// 1) Páginas estáticas de la raíz (.html), preservando el index nuevo de Vite.
let htmlCount = 0;
for (const entry of readdirSync(repoRoot, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.html')) continue;

  if (entry.name === 'index.html') {
    // LA HOME ANTIGUA NO SE PUBLICA.
    //
    // Durante un tiempo se copiaba a dist/legacy.html «por si acaso», y eso
    // dejaba en producción una SEGUNDA implementación completa del checkout —
    // con su propia integración de Culqi, su propio formulario de prueba y sus
    // propios precios escritos a mano, fuera de scripts/verificar-precios.mjs.
    // Nadie la mantenía y nadie la verificaba, pero cualquier enlace viejo o
    // resultado de búsqueda podía llevar a alguien a comprar por ahí y ver una
    // tarifa que ya no existe.
    //
    // El rollback NO depende de que esté publicada: el archivo sigue en el
    // repositorio (raíz, index.html) y en el historial de git. Para volver a
    // servirla basta con reponer aquí el cpSync a 'legacy.html' y desplegar.
    continue;
  }
  cpSync(join(repoRoot, entry.name), join(dist, entry.name));
  htmlCount++;
}

// 2) Carpetas de assets que la web y las funciones referencian por URL.
const assetDirs = ['icono', 'update'];
for (const d of assetDirs) {
  const src = join(repoRoot, d);
  if (existsSync(src)) {
    cpSync(src, join(dist, d), { recursive: true });
  }
}

console.log(
  `[copy-legacy] ${htmlCount} HTML estáticas + assets (${assetDirs.join(', ')}) copiados a dist/ · la home antigua NO se publica`
);
