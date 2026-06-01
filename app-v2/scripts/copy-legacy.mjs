// ─────────────────────────────────────────────────────────────────────────────
// copy-legacy.mjs
// La landing nueva (React/Vite) es ahora la HOME: `vite build` ya emitió el
// nuevo index.html + assets a dist/. Este script copia el RESTO del sitio
// estático sin pisar ese index nuevo:
//   · páginas estáticas .html de la raíz, EXCEPTO index.html (la home antigua).
//     La home antigua (index.html del repo) se guarda como dist/legacy.html
//     para poder hacer rollback rápido apuntando a /legacy.html.
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
    // La home antigua NO debe pisar el index nuevo (la landing React).
    // Se conserva accesible como /legacy.html para rollback de emergencia.
    cpSync(join(repoRoot, entry.name), join(dist, 'legacy.html'));
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
  `[copy-legacy] ${htmlCount} HTML estáticas + home antigua -> legacy.html + assets (${assetDirs.join(', ')}) copiados a dist/`
);
