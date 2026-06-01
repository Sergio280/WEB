import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// La landing nueva vive bajo /v2 (sin tocar la home actual en /).
// El bundle se emite a ../dist/v2 y luego copy-legacy.mjs copia el sitio
// estático existente (index.html, páginas legales, /icono, /update) a ../dist.
export default defineConfig({
  base: '/v2/',
  plugins: [react()],
  build: {
    outDir: '../dist/v2',
    emptyOutDir: true,
  },
});
