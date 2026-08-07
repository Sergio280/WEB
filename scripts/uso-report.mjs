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

// MAPEO param→función (vive AQUÍ, offline, NO en el plugin). El plugin solo manda
// el rastro crudo "trace:BIMS_*" (parámetros que BIMS ya deja visibles en el
// modelo). Aquí lo traducimos a nombres legibles. Si aparece un BIMS_* nuevo sin
// mapear, se muestra crudo (y se agrega aquí).
const MAPA = [
    [/^BIMS_Encf_/i,        'Metrado de Encofrado'],
    [/^BIMS_HostElementId/i,'Encofrado'],
    [/^BIMS_Area$/i,        'Encofrado'],   // encofrado genérico estampa HostElementId + Area
    [/^BIMS_[A-L]$/i,       'Escalar Sólido'],
    [/^BIMS_(Mark|Assignment|Layer)/i, 'Acero / Refuerzo'],
];
// cmd:<idBotón> → nombre legible (quita el sufijo "Button" y separa CamelCase).
// El mapeo es DERIVADO (no una tabla hardcodeada), así vive 100% offline.
function prettyCmd(id) {
    return id.replace(/Button$/, '').replace(/([a-z0-9])([A-Z])/g, '$1 $2').trim();
}
function aFuncion(func) {
    if (!func) return '(desconocida)';
    if (func.startsWith('cmd:')) return prettyCmd(func.slice(4)); // invocación real de comando
    if (!func.startsWith('trace:')) return func;                  // eventos con func explícito
    const param = func.slice('trace:'.length);
    for (const [rx, nombre] of MAPA) if (rx.test(param)) return nombre;
    return 'BIMS_ (sin mapear): ' + param;
}

// Separar eventos: cmd: = comando REALMENTE ejecutado por el usuario (señal directa);
// trace: = huella pasiva (params BIMS_ que existen en el modelo abierto).
const porCmd = {}, porTrace = {};
for (const e of events) {
    const esCmd = (e.func || '').startsWith('cmd:');
    const dest = esCmd ? porCmd : porTrace;
    const f = aFuncion(e.func);
    (dest[f] ||= { total: 0, trial: 0, pago: 0, ns: [] });
    dest[f].total++;
    if (e.lic === 'Trial') dest[f].trial++;
    else if (e.lic) dest[f].pago++;
    if (typeof e.n === 'number' && e.n > 0) dest[f].ns.push(e.n);
}

function tabla(titulo, obj) {
    const filas = Object.entries(obj).sort((a, b) => b[1].total - a[1].total);
    if (!filas.length) { console.log('\n' + titulo + '\n  (sin eventos de este tipo aún)'); return; }
    console.log('\n' + titulo);
    console.log('  ' + 'función'.padEnd(28) + 'usos'.padStart(6) + 'trial'.padStart(7) + 'pago'.padStart(6) + '   elementos (p50/p90/max)');
    for (const [f, s] of filas) {
        let dist = '—';
        if (s.ns.length) dist = `${pct(s.ns, 50)} / ${pct(s.ns, 90)} / ${Math.max(...s.ns)}  (n=${s.ns.length})`;
        console.log('  ' + f.slice(0, 27).padEnd(28) + String(s.total).padStart(6) + String(s.trial).padStart(7) + String(s.pago).padStart(6) + '   ' + dist);
    }
}

const nCmd = Object.values(porCmd).reduce((a, s) => a + s.total, 0);
const nTrace = Object.values(porTrace).reduce((a, s) => a + s.total, 0);

console.log('═'.repeat(74));
console.log(' TELEMETRÍA DE USO — BIMS  (solo lectura)');
console.log('═'.repeat(74));
console.log(` Eventos totales: ${events.length}   (comandos: ${nCmd} · rastros: ${nTrace})`);

tabla('▸ COMANDOS EJECUTADOS  (evento cmd: — señal DIRECTA de qué función se usa)', porCmd);
tabla('▸ HUELLA EN MODELOS  (evento trace: — pasivo; solo funciones que estampan BIMS_*)', porTrace);

console.log('\n▸ CÓMO LEERLO PARA FIJAR EL CAP');
console.log('  - Capar las funciones de ARRIBA (más usadas) y de mayor valor.');
console.log('  - Para el N: usar la distribución de elementos. Un N cerca del p50 deja');
console.log('    pasar la mitad de los usos (muestras) y frena los grandes (producción).');
console.log('  - Comparar trial vs pago: si los de PAGO procesan mucho más que los de');
console.log('    trial, confirma que el volumen es lo que se paga → capar por volumen.');
console.log('');
