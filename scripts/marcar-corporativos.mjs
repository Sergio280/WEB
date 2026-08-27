// ── marcar-corporativos.mjs ──────────────────────────────────────────────────
// Marca `accountType: "corporate"` en las cuentas YA existentes cuyo dominio es
// de empresa. La detección solo se aplicaba al registrarse, así que todos los
// usuarios anteriores (TMS incluido) están sin clasificar.
//
// Sirve para dos cosas:
//   1. Cuando el plugin 1.2.0 llegue a los clientes, el CTA de plan de equipo
//      encontrará el dato ya puesto en vez de empezar de cero.
//   2. Poder filtrar el canal de empresa en el panel desde hoy.
//
// NO envía correos: son cuentas antiguas, avisar ahora de leads de hace meses
// sería ruido. El aviso solo se dispara en registros nuevos.
//
// USO
//   node scripts/marcar-corporativos.mjs            → simulación (no escribe)
//   node scripts/marcar-corporativos.mjs --aplicar  → escribe en Firebase
//
// Requiere el volcado: npx firebase-tools database:get /users_v2 --project bims-8d507 --output usuarios.json
// ⚠️ BORRA usuarios.json al terminar: contiene datos personales de toda la base.
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { isCorporateDomain } = require('../netlify/functions/_lib/personal-email-domains.js');

const APLICAR = process.argv.includes('--aplicar');
const USERS_JSON = path.join(process.cwd(), 'usuarios.json');
const PROJECT = 'bims-8d507';

if (!fs.existsSync(USERS_JSON)) {
    console.error(
        `No existe ${USERS_JSON}.\n` +
        `  Genéralo con:\n` +
        `    npx firebase-tools database:get /users_v2 --project ${PROJECT} --output usuarios.json\n` +
        `  y BÓRRALO al terminar (lleva datos personales).`);
    process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(USERS_JSON, 'utf8'));
const candidatos = [];

for (const uid of Object.keys(raw)) {
    const u = raw[uid] || {};
    const email = (u.email || u.Email || '').trim();
    if (!email) continue;
    if (!isCorporateDomain(email)) continue;
    if (u.accountType === 'corporate') continue;   // ya marcado
    candidatos.push({
        uid,
        email,
        tipo:  u.licenseType || u.LicenseType || '?',
        pais:  (u.trialMeta && u.trialMeta.country) || '—',
    });
}

console.log(`Cuentas a marcar como corporativas: ${candidatos.length}\n`);
for (const c of candidatos) {
    console.log(`  ${c.email.padEnd(38)} ${c.tipo.padEnd(8)} ${c.pais}`);
}

if (!APLICAR) {
    console.log('\n(simulación — no se ha escrito nada; usa --aplicar para confirmar)');
    process.exit(0);
}

console.log('\nEscribiendo en Firebase…');
let ok = 0, fallos = 0;
for (const c of candidatos) {
    try {
        // database:set sobre la hoja concreta: no toca ningún otro campo del usuario.
        const tmp = path.join(process.cwd(), '.tmp-accounttype.json');
        fs.writeFileSync(tmp, '"corporate"');
        execFileSync('npx', ['firebase-tools', 'database:set',
            `/users_v2/${c.uid}/accountType`, tmp,
            '--project', PROJECT, '--force'], { stdio: 'pipe', shell: true });
        fs.unlinkSync(tmp);
        ok++;
        console.log(`  ✓ ${c.email}`);
    } catch (e) {
        fallos++;
        console.log(`  ✗ ${c.email} → ${e.message.split('\n')[0]}`);
    }
}
console.log(`\nMarcadas: ${ok} · Fallidas: ${fallos}`);
console.log('Recuerda borrar usuarios.json.');
