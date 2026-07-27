import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// La landing nueva (React/Vite) es ahora la HOME: se sirve en "/".
// El bundle se emite a ../dist y luego copy-legacy.mjs copia el resto del
// sitio estático (páginas legales, /icono, /update) SIN sobreescribir el
// index.html nuevo. La home anterior se conserva como /legacy.html (rollback).
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Separar las dependencias grandes de nuestro código: el bundle era un
        // único archivo de ~574 KB, así que cualquier cambio en la landing
        // invalidaba también React y Framer Motion en la caché del navegador.
        // Con estos chunks, un deploy normal sólo obliga a re-descargar el
        // código propio. (Chart.js no aparece aquí: entra en su propio chunk
        // automáticamente por el import() dinámico de Metrics en App.jsx.)
        manualChunks: {
          react: ['react', 'react-dom'],
          motion: ['framer-motion'],
        },
      },
    },
  },
});
