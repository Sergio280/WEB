// ─────────────────────────────────────────────────────────────────────────────
// copy-legacy.mjs
// Tras `vite build` (que emite la landing nueva en dist/v2), este script copia
// el sitio estático EXISTENTE a la raíz de dist/ para que la home actual siga
// sirviéndose intacta en "/" y la nueva en "/v2".
//
// Copia:
//   · todos los *.html de la raíz del repo (index, success, terminos, etc.)
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

// 1) Páginas estáticas de la raíz (.html) — se sirven verbatim.
let htmlCount = 0;
for (const entry of readdirSync(repoRoot, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith('.html')) {
    cpSync(join(repoRoot, entry.name), join(dist, entry.name));
    htmlCount++;
  }
}

// 2) Carpetas de assets que la home y las funciones referencian por URL.
const assetDirs = ['icono', 'update'];
for (const d of assetDirs) {
  const src = join(repoRoot, d);
  if (existsSync(src)) {
    cpSync(src, join(dist, d), { recursive: true });
  }
}

console.log(`[copy-legacy] ${htmlCount} HTML + assets (${assetDirs.join(', ')}) copiados a dist/`);
