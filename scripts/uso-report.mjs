#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// uso-report.mjs — Resume la telemetría de USO (usage_events) para decidir con
// DATOS qué funciones capar en el trial y con qué N. Solo LECTURA.
//
// Responde: ¿qué funciones se usan más? ¿por trial vs pago? y —cuando haya
// conteos de elementos— ¿cuál es la distribución (percentiles) para fijar un N
// que deje pasar "muestra" y frene "producción"?
//
// Uso:
//   npx firebase-tools database:get /usage_events --project bims-8d507 \
//       --instance bims-8d507-default-rtdb > usage.json
//   node scripts/uso-report.mjs usage.json
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs';

const archivo = process.argv[2];
if (!archivo) { console.error('Uso: node scripts/uso-report.mjs <usage.json>'); process.exit(1); }

const raw = fs.readFileSync(archivo, 'utf8').replace(/^﻿/, '');
const data = JSON.parse(raw || 'null');
const events = data ? Object.values(data) : [];

if (events.length === 0) {
    console.log('Sin eventos de uso todavía. Cuando los usuarios corran comandos con la');
    console.log('versión instrumentada, /api/usage los irá acumulando en usage_events.');
    process.exit(0);
}

const pct = (arr, p) => {
    const v = arr.slice().sort((a, b) => a - b);
    if (!v.length) return null;
    return v[Math.min(v.length - 1, Math.floor((p / 100) * v.length))];
};

// Agrupar por función.
const porFunc = {};
for (const e of events) {
    const f = e.func || '(desconocida)';
    (porFunc[f] ||= { total: 0, trial: 0, pago: 0, ns: [] });
    porFunc[f].total++;
    if (e.lic === 'Trial') porFunc[f].trial++;
    else if (e.lic) porFunc[f].pago++;
    if (typeof e.n === 'number' && e.n > 0) porFunc[f].ns.push(e.n);
}

console.log('═'.repeat(74));
console.log(' TELEMETRÍA DE USO — BIMS  (solo lectura)');
console.log('═'.repeat(74));
console.log(` Eventos totales: ${events.length}`);

console.log('\n▸ FUNCIONES POR FRECUENCIA (usos · trial / pago · elementos si hay)');
const filas = Object.entries(porFunc).sort((a, b) => b[1].total - a[1].total);
console.log('  ' + 'función'.padEnd(28) + 'usos'.padStart(6) + 'trial'.padStart(7) + 'pago'.padStart(6) + '   elementos (p50/p90/max)');
for (const [f, s] of filas) {
    let dist = '—';
    if (s.ns.length) dist = `${pct(s.ns, 50)} / ${pct(s.ns, 90)} / ${Math.max(...s.ns)}  (n=${s.ns.length})`;
    console.log('  ' + f.slice(0, 27).padEnd(28) + String(s.total).padStart(6) + String(s.trial).padStart(7) + String(s.pago).padStart(6) + '   ' + dist);
}

console.log('\n▸ CÓMO LEERLO PARA FIJAR EL CAP');
console.log('  - Capar las funciones de ARRIBA (más usadas) y de mayor valor.');
console.log('  - Para el N: usar la distribución de elementos. Un N cerca del p50 deja');
console.log('    pasar la mitad de los usos (muestras) y frena los grandes (producción).');
console.log('  - Comparar trial vs pago: si los de PAGO procesan mucho más que los de');
console.log('    trial, confirma que el volumen es lo que se paga → capar por volumen.');
console.log('');
