#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// reciclaje-report.mjs — Mide el ABUSO de trials (mismo equipo/red, varias
// cuentas). Solo LECTURA: no modifica ni bloquea nada.
//
// Detecta la señal de reciclaje que SÍ es visible en los datos actuales:
//   - machineId compartido por >1 correo  → misma laptop, varios trials.
//   - ipHash compartido por >1 correo      → misma red (NO detecta a quien cambia
//     de WiFi: el ipHash cambia; por eso el fix real ancla al hardware).
//
// LIMITACIÓN HONESTA: quien recicla cambiando de WiFi Y de correo Y sin activar
// no aparece aquí. Por eso, además de este reporte, la Fase 1 instrumenta el
// hardware en la activación (ver plan). "0 colisiones" = o no hay abuso, o el
// abuso evade estas señales.
//
// Uso:
//   npx firebase-tools database:get /users_v2 --project bims-8d507 \
//       --instance bims-8d507-default-rtdb > users.json
//   node scripts/reciclaje-report.mjs users.json
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs';

// Cuentas propias de Sergio + el revisor de Autodesk (se excluyen del conteo).
const EXCLUIR = [
    /^alejoszapata[a-z]*\d*@gmail\.com$/i,
    /^a\.z\.sergio@/i,
    /@autodesk\.com$/i,
    /^bimsaddin@gmail/i,
    /^salejoszap@ucvvirtual/i,
];
const esPropia = (email) => !email || EXCLUIR.some((rx) => rx.test(email));

const archivo = process.argv[2];
if (!archivo) { console.error('Uso: node scripts/reciclaje-report.mjs <users.json>'); process.exit(1); }

const users = JSON.parse(fs.readFileSync(archivo, 'utf8').replace(/^﻿/, '')) || {};

const filas = [];
for (const [uid, r] of Object.entries(users)) {
    if (!r || !r.email || esPropia(r.email)) continue;
    const meta = r.trialMeta || {};
    const actKeys = Object.keys(r.activations || {});
    filas.push({
        uid,
        email: r.email,
        machineId: r.machineId || r.MachineId || actKeys[0] || '',
        ipHash: meta.ipHash || '',
        emailNormHash: meta.emailNormHash || '',
        activo: actKeys.length > 0,
    });
}

// Agrupa por una huella y devuelve solo los grupos con >1 correo DISTINTO.
function colisiones(field) {
    const m = {};
    for (const f of filas) {
        if (!f[field]) continue;
        (m[f[field]] ||= new Set()).add(f.email);
    }
    return Object.entries(m).filter(([, set]) => set.size > 1).map(([k, set]) => [k, [...set]]);
}

console.log('═'.repeat(70));
console.log(' MEDIDOR DE RECICLAJE DE TRIALS — BIMS  (solo lectura)');
console.log('═'.repeat(70));
console.log(` Usuarios reales analizados: ${filas.length} (excluidas cuentas propias/revisor)`);

for (const [titulo, field, nota] of [
    ['▸ MISMA LAPTOP (machineId) con varios correos', 'machineId', 'Señal fuerte de reciclaje en el mismo equipo.'],
    ['▸ MISMA RED (ipHash) con varios correos', 'ipHash', 'Ojo: NO detecta a quien cambia de WiFi.'],
]) {
    const col = colisiones(field);
    console.log(`\n${titulo}`);
    console.log(`  ${nota}`);
    if (col.length === 0) {
        console.log('  → 0 colisiones.');
    } else {
        for (const [k, correos] of col) {
            console.log(`  → ${k.slice(0, 10)}… : ${correos.length} cuentas → ${correos.join(', ')}`);
        }
    }
}

console.log('\n' + '─'.repeat(70));
const totalCol = colisiones('machineId').length + colisiones('ipHash').length;
if (totalCol === 0) {
    console.log(' VEREDICTO: sin evidencia de reciclaje en los datos actuales.');
    console.log(' Puede significar (a) no hay abuso, o (b) el abuso evade estas señales');
    console.log(' (cambio de WiFi/correo sin activar). El ledger de hardware en la');
    console.log(' activación es lo que cerraría esa brecha de medición.');
} else {
    console.log(` VEREDICTO: ${totalCol} grupo(s) con reciclaje detectado. El ledger de`);
    console.log(' hardware (bloqueo, empezar en modo log) tiene justificación con datos.');
}
console.log('');
