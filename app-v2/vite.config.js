import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// El paquete es ESM ("type": "module"), así que aquí no hay __dirname.
const desdeAqui = (rel) => fileURLToPath(new URL(rel, import.meta.url));

// La landing nueva (React/Vite) es ahora la HOME: se sirve en "/".
// El bundle se emite a ../dist y luego copy-legacy.mjs copia el resto del
// sitio estático (páginas legales, /icono, /update) SIN sobreescribir el
// index.html nuevo. La home anterior se conserva como /legacy.html (rollback).
//
// DOS ENTRADAS, UN SOLO BUNDLE: index.html (español, "/") y en/index.html
// (inglés, "/en/"). Comparten el mismo /src/main.jsx y por tanto los mismos
// assets; lo único distinto es el HTML que envuelve — idioma, <title>,
// description, canonical y hreflang. Sin esto el inglés no existía para un
// buscador: los dos idiomas vivían en la misma URL y el cambio lo hacía React
// ya en el navegador, así que el HTML servido estaba siempre en español.
//
// Los archivos de public/ (robots.txt, sitemap.xml) se copian tal cual a la
// raíz de dist.
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: desdeAqui('./index.html'),
        en:   desdeAqui('./en/index.html'),
      },
    },
  },
});
