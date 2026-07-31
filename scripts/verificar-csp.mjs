#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// verificar-csp.mjs — Comprueba que la CSP permita TODO lo que el sitio carga.
//
// Por qué existe: entre el 2026-05-24 y el 2026-07-31 la CSP tuvo los dos
// dominios de Culqi en las directivas equivocadas (el iframe del checkout en
// ninguna, y la API de tokenización en frame-src). Consecuencia: al pulsar
// «Pagar», Chrome bloqueaba el iframe y NADIE podía pagar con Culqi. No hubo
// ningún síntoma en el servidor —ni un error, ni un log— porque el bloqueo
// ocurre en el navegador del usuario. Diez semanas de pagos rotos.
//
// Este script genera una página con la CSP REAL de netlify.toml, intenta cargar
// cada recurso externo del sitio y falla si alguno queda bloqueado.
//
// Uso:
//   node scripts/verificar-csp.mjs            (usa Chrome instalado)
//
// Correrlo SIEMPRE que se toque la CSP o se añada un servicio de terceros.
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';

const raíz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ── 1. Extraer la CSP tal cual está en netlify.toml ──────────────────────────
const toml = readFileSync(path.join(raíz, 'netlify.toml'), 'utf8');
const m = toml.match(/Content-Security-Policy\s*=\s*"([^"]+)"/);
if (!m) {
  console.error('✗ No se encontró la cabecera Content-Security-Policy en netlify.toml');
  process.exit(1);
}
const csp = m[1];

// ── 2. Recursos que el sitio carga de verdad ─────────────────────────────────
// `tipo` decide cómo se prueba: frame → <iframe>, script → <script>,
// connect → fetch(), style/font/img → su etiqueta.
const RECURSOS = [
  // El iframe del checkout de Culqi: ESTE es el que estuvo bloqueado.
  { tipo: 'frame',   url: 'https://checkout.culqi.com/v4?pk=demo',            nota: 'iframe del checkout de Culqi' },
  { tipo: 'script',  url: 'https://checkout.culqi.com/js/v4',                 nota: 'script de Culqi' },
  { tipo: 'connect', url: 'https://secure.culqi.com/tokens',                  nota: 'tokenización de tarjeta' },
  { tipo: 'connect', url: 'https://api.culqi.com/v2/validate-iin?iin=411111', nota: 'validación de BIN' },
  { tipo: 'frame',   url: 'https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/b/turnstile', nota: 'iframe de Turnstile' },
  { tipo: 'script',  url: 'https://challenges.cloudflare.com/turnstile/v0/api.js', nota: 'script de Turnstile' },
  { tipo: 'frame',   url: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', nota: 'vídeos incrustados' },
  { tipo: 'script',  url: 'https://www.googletagmanager.com/gtag/js?id=G-TEST', nota: 'GA4' },
  { tipo: 'script',  url: 'https://www.clarity.ms/tag/test',                  nota: 'Clarity' },
  { tipo: 'script',  url: 'https://cdn.jsdelivr.net/npm/chart.js',            nota: 'jsDelivr' },
  { tipo: 'style',   url: 'https://fonts.googleapis.com/css2?family=Inter',   nota: 'Google Fonts (hoja)' },
  { tipo: 'connect', url: 'https://bims-8d507-default-rtdb.firebaseio.com/.json', nota: 'Firebase RTDB' },
  { tipo: 'connect', url: 'https://identitytoolkit.googleapis.com/v1/test',   nota: 'Firebase Auth' },
];

// ── 3. Página de prueba ──────────────────────────────────────────────────────
// Se escucha `securitypolicyviolation`, que dispara el propio navegador cuando
// la CSP bloquea algo. Es la única señal fiable: un recurso bloqueado no lanza
// error de red ni deja rastro en el servidor.
const html = `<!doctype html>
<html><head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${csp.replace(/"/g, '&quot;')}">
<title>pendiente</title>
</head><body>
<script>
  window.__violaciones = [];
  document.addEventListener('securitypolicyviolation', function (e) {
    window.__violaciones.push(e.effectiveDirective + '|' + e.blockedURI);
  });
<\/script>
${RECURSOS.map((r, i) => {
  if (r.tipo === 'frame')  return `<iframe src="${r.url}" width="10" height="10" data-i="${i}"></iframe>`;
  if (r.tipo === 'script') return `<script src="${r.url}" data-i="${i}"><\/script>`;
  if (r.tipo === 'style')  return `<link rel="stylesheet" href="${r.url}" data-i="${i}">`;
  if (r.tipo === 'img')    return `<img src="${r.url}" data-i="${i}" width="5" height="5">`;
  return '';
}).join('\n')}
<script>
  // Los 'connect' se prueban con fetch. Un fallo de red (404, CORS) NO importa:
  // solo interesa si la CSP lo bloquea, y eso lo reporta el evento de arriba.
  var conectar = ${JSON.stringify(RECURSOS.filter((r) => r.tipo === 'connect').map((r) => r.url))};
  conectar.forEach(function (u) { fetch(u, { mode: 'no-cors' }).catch(function () {}); });
  setTimeout(function () {
    document.body.setAttribute('data-res', JSON.stringify(window.__violaciones));
    document.title = 'listo';
  }, 6000);
<\/script>
</body></html>`;

const tmp = path.join(os.tmpdir(), 'bims-csp-check');
if (!existsSync(tmp)) mkdirSync(tmp, { recursive: true });
const página = path.join(tmp, 'csp.html');
writeFileSync(página, html, 'utf8');

// ── 4. Ejecutar en Chrome ────────────────────────────────────────────────────
const CHROMES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];
const chrome = CHROMES.find((p) => existsSync(p));
if (!chrome) {
  console.error('✗ No se encontró Chrome ni Edge para ejecutar la comprobación.');
  process.exit(1);
}

console.log('\n═══ Verificación de CSP — BIMS ═══\n');
console.log('  Probando ' + RECURSOS.length + ' recursos externos contra la CSP de netlify.toml\n');

let dom;
try {
  dom = execFileSync(chrome, [
    '--headless', '--disable-gpu', '--no-sandbox',
    '--virtual-time-budget=12000', '--dump-dom',
    'file:///' + página.replace(/\\/g, '/'),
  ], { encoding: 'utf8', timeout: 90000, maxBuffer: 64 * 1024 * 1024 });
} catch (e) {
  dom = e.stdout || '';
}

const res = dom.match(/data-res="([^"]*)"/);
if (!res) {
  console.error('✗ La página de prueba no devolvió resultados (¿Chrome no pudo abrirla?).');
  process.exit(1);
}

const violaciones = JSON.parse(res[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));

// ── 5. Informe ───────────────────────────────────────────────────────────────
// Se compara por ORIGEN: el navegador reporta el blockedURI recortado al origen.
const bloqueados = new Set(violaciones.map((v) => {
  const [dir, uri] = v.split('|');
  try { return dir + ' ' + new URL(uri).origin; } catch { return dir + ' ' + uri; }
}));

let fallos = 0;
for (const r of RECURSOS) {
  const origen = new URL(r.url).origin;
  const dir = { frame: 'frame-src', script: 'script-src', connect: 'connect-src', style: 'style-src', img: 'img-src' }[r.tipo];
  const malo = [...bloqueados].some((b) => b.startsWith(dir) && b.endsWith(origen));
  console.log('  ' + (malo ? '✗' : '✓') + '  ' + dir.padEnd(12) + origen.padEnd(46) + r.nota);
  if (malo) fallos++;
}

rmSync(tmp, { recursive: true, force: true });

console.log('');
if (fallos) {
  console.error(`✗ ${fallos} recurso${fallos === 1 ? '' : 's'} BLOQUEADO${fallos === 1 ? '' : 'S'} por la CSP.`);
  console.error('  Añádelo a la directiva correcta en netlify.toml antes de desplegar.\n');
  process.exit(1);
}
console.log('✓ La CSP permite todos los recursos que el sitio necesita.\n');
