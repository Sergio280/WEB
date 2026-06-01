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
  },
});
