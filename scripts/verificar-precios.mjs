#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// verificar-precios.mjs — Guarda contra la desincronización de precios.
//
// Los precios viven en DOS archivos que no se pueden unificar (el frontend es
// ESM bajo Vite; las Netlify Functions son CommonJS con su propio bundling):
//
//   app-v2/src/data/pricing.js        → lo que el cliente VE
//   netlify/functions/_lib/pricing.js → lo que al cliente se le COBRA
//
// Si se separan, el usuario ve un precio en la web y se le cobra otro. Este
// script compara ambos y falla con código 1 si no cuadran.
//
// Uso:
//   node scripts/verificar-precios.mjs
//
// Correrlo SIEMPRE antes de desplegar un cambio de precios.
// ─────────────────────────────────────────────────────────────────────────────

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const aquí = path.dirname(fileURLToPath(import.meta.url));
const raíz = path.resolve(aquí, '..');

const front = await import(
  'file://' + path.join(raíz, 'app-v2', 'src', 'data', 'pricing.js')
);
const back = require(path.join(raíz, 'netlify', 'functions', '_lib', 'pricing.js'));

// Validaciones del comprobante electrónico: también viven duplicadas (el
// navegador avisa temprano; el servidor es el que decide) y también pueden
// separarse en silencio.
const cpFront = await import(
  'file://' + path.join(raíz, 'app-v2', 'src', 'lib', 'comprobante.js')
);
const cpBack = require(path.join(raíz, 'netlify', 'functions', '_lib', 'comprobante.js'));

let errores = 0;
const fallo = (msg) => { console.error('  ✗ ' + msg); errores++; };

console.log('\n═══ Verificación de precios BIMS ═══\n');

// ── 1. La tasa de IGV debe ser la misma en ambos lados ───────────────────────
if (front.IGV_RATE !== back.IGV_RATE)
  fallo(`IGV_RATE difiere: frontend ${front.IGV_RATE} vs backend ${back.IGV_RATE}`);

// ── 2. Las tablas de precios deben ser idénticas ─────────────────────────────
const planes = new Set([...Object.keys(front.PRECIOS_PEN), ...Object.keys(back.PRECIOS_PEN)]);
for (const plan of planes) {
  const f = front.PRECIOS_PEN[plan];
  const b = back.PRECIOS_PEN[plan];
  if (!f) { fallo(`El plan "${plan}" existe en el backend pero no en el frontend`); continue; }
  if (!b) { fallo(`El plan "${plan}" existe en el frontend pero no en el backend`); continue; }

  const claves = new Set([...Object.keys(f), ...Object.keys(b)]);
  for (const k of claves) {
    if (f[k] !== b[k])
      fallo(`${plan}.${k}: frontend S/${f[k]} vs backend S/${b[k]}`);
  }
}

// ── 3. Los meses por duración deben coincidir ────────────────────────────────
for (const k of Object.keys(front.MESES_POR_DURACION)) {
  if (front.MESES_POR_DURACION[k] !== back.MESES_POR_DURACION[k])
    fallo(`MESES_POR_DURACION.${k}: frontend ${front.MESES_POR_DURACION[k]} vs backend ${back.MESES_POR_DURACION[k]}`);
}

// ── 4. Invariante del desglose: base + IGV debe dar el total EXACTO ──────────
// Es lo que exige SUNAT en el comprobante. Un céntimo de diferencia por
// redondear base e IGV por separado puede hacer que la factura sea rechazada.
for (const plan of Object.keys(front.PRECIOS_PEN)) {
  for (const [dur, total] of Object.entries(front.PRECIOS_PEN[plan])) {
    const df = front.desglosarIgv(total);
    const db = back.desglosarIgv(total);

    if (Math.abs(df.base + df.igv - total) > 1e-9)
      fallo(`${plan}.${dur}: base ${df.base} + IGV ${df.igv} = ${df.base + df.igv}, no cuadra con S/${total}`);
    if (df.base !== db.base || df.igv !== db.igv)
      fallo(`${plan}.${dur}: desglose distinto — frontend ${df.base}/${df.igv} vs backend ${db.base}/${db.igv}`);
  }
}

// ── 5. El monto que se cobra debe ser el precio de lista, en céntimos ────────
for (const plan of Object.keys(front.PRECIOS_PEN)) {
  for (const dur of front.DURACIONES) {
    const item = back.itemCobrable(plan, dur);
    if (!item) { fallo(`El backend no sabe cobrar ${plan}/${dur}`); continue; }
    const esperado = Math.round(front.PRECIOS_PEN[plan][dur] * 100);
    if (item.amount !== esperado)
      fallo(`${plan}.${dur}: se cobrarían ${item.amount} céntimos y el precio mostrado es ${esperado}`);
  }
}

// ── 6. Validaciones del comprobante: frontend y backend deben coincidir ──────
if (cpFront.UMBRAL_DNI_BOLETA !== cpBack.UMBRAL_DNI_BOLETA)
  fallo(`UMBRAL_DNI_BOLETA difiere: frontend ${cpFront.UMBRAL_DNI_BOLETA} vs backend ${cpBack.UMBRAL_DNI_BOLETA}`);

// RUCs de prueba. Los válidos llevan dígito verificador correcto (módulo 11);
// los inválidos cubren los fallos que se ven en producción: longitud incorrecta,
// prefijo inexistente, letras y dígito verificador equivocado.
const RUCS = [
  ['20100070970', true,  'persona jurídica real'],
  ['10724530708', true,  'persona natural con negocio (el de BIMS)'],
  ['20100070971', false, 'dígito verificador incorrecto'],
  ['2010007097',  false, '10 dígitos'],
  ['201000709700', false, '12 dígitos'],
  ['30100070970', false, 'prefijo 30 inexistente'],
  ['2010007097A', false, 'contiene una letra'],
  ['',            false, 'vacío'],
];
for (const [ruc, esperado, caso] of RUCS) {
  if (cpFront.rucValido(ruc) !== esperado) fallo(`rucValido("${ruc}") frontend: se esperaba ${esperado} (${caso})`);
  if (cpBack.rucValido(ruc)  !== esperado) fallo(`rucValido("${ruc}") backend: se esperaba ${esperado} (${caso})`);
}

const DNIS = [['12345678', true], ['1234567', false], ['123456789', false], ['1234567A', false], ['', false]];
for (const [dni, esperado] of DNIS) {
  if (cpFront.dniValido(dni) !== esperado) fallo(`dniValido("${dni}") frontend: se esperaba ${esperado}`);
  if (cpBack.dniValido(dni)  !== esperado) fallo(`dniValido("${dni}") backend: se esperaba ${esperado}`);
}

// El veredicto de aceptar/rechazar tiene que ser el mismo en ambos lados: si el
// navegador acepta algo que el servidor rechaza, el usuario ya metió su tarjeta
// cuando falla. Se comparan con las formas propias de cada capa.
const CASOS = [
  [{ tipo: 'factura', doc: '20100070970', razonSocial: 'Constructora Ejemplo S.A.C.' }, 60,  true,  'factura completa'],
  [{ tipo: 'factura', doc: '20100070970', razonSocial: '' },                            60,  false, 'factura sin razón social'],
  [{ tipo: 'factura', doc: '20100070971', razonSocial: 'Ejemplo S.A.C.' },              60,  false, 'factura con RUC inválido'],
  [{ tipo: 'boleta',  doc: '',            razonSocial: '' },                            60,  true,  'boleta pequeña sin DNI'],
  [{ tipo: 'boleta',  doc: '12345678',    razonSocial: '' },                            60,  true,  'boleta con DNI'],
  [{ tipo: 'boleta',  doc: '123',         razonSocial: '' },                            60,  false, 'boleta con DNI inválido'],
  [{ tipo: 'boleta',  doc: '12345678',    razonSocial: '' },                            996, true,  'boleta grande con DNI'],
];
for (const [datos, total, esperado, caso] of CASOS) {
  const f = cpFront.validarComprobante(datos, total).ok;
  const b = cpBack.validarComprobante(
    { tipo: datos.tipo, docNumero: datos.doc, razonSocial: datos.razonSocial },
    total
  ).ok;
  if (f !== esperado) fallo(`validarComprobante frontend (${caso}): se esperaba ${esperado} y dio ${f}`);
  if (b !== esperado) fallo(`validarComprobante backend (${caso}): se esperaba ${esperado} y dio ${b}`);
}

// ── Resumen legible de la tabla vigente ──────────────────────────────────────
console.log('  Tabla vigente (soles, IGV incluido):\n');
console.log('    plan          dur     total      base      IGV');
console.log('    ' + '─'.repeat(48));
for (const plan of Object.keys(front.PRECIOS_PEN)) {
  for (const [dur, total] of Object.entries(front.PRECIOS_PEN[plan])) {
    const { base, igv } = front.desglosarIgv(total);
    console.log(
      '    ' + plan.padEnd(14) + dur.padEnd(8) +
      ('S/' + total.toFixed(2)).padStart(9) +
      ('S/' + base.toFixed(2)).padStart(10) +
      ('S/' + igv.toFixed(2)).padStart(9)
    );
  }
}

console.log('');
if (errores) {
  console.error(`✗ ${errores} discrepancia${errores === 1 ? '' : 's'}. NO desplegar sin corregirlas.\n`);
  process.exit(1);
}
console.log('✓ Precios sincronizados · desglose de IGV exacto al céntimo · validaciones');
console.log('  de RUC/DNI idénticas en frontend y backend.\n');
