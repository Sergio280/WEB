// ── enviar-aviso-politica.mjs ────────────────────────────────────────────────
// Envía el aviso de actualización de Términos y Política de Privacidad
// (23-ago-2026) a los usuarios registrados.
//
// USO
//   node scripts/enviar-aviso-politica.mjs --test      → 1 correo a soporte@ (ES+EN)
//   node scripts/enviar-aviso-politica.mjs --dry       → lista destinatarios, NO envía
//   node scripts/enviar-aviso-politica.mjs --enviar    → ENVÍO REAL a toda la base
//
// Requiere la clave de Resend en D:\repos\Sergio280\.Resend-api
// y un volcado de usuarios: node scripts/enviar-aviso-politica.mjs --dump
//
// ⚠️ El envío real es IRREVERSIBLE. Por eso --enviar es explícito y el script
// imprime el recuento y espera 5 segundos antes de empezar.
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { getPolicyUpdateEmail } = require('../netlify/functions/_lib/policy-update-email.js');

const MODO = process.argv.find(a => a.startsWith('--')) || '--dry';
const RESEND_KEY_PATH = 'D:\\repos\\Sergio280\\.Resend-api';
const USERS_JSON = process.argv.find(a => a.endsWith('.json'))
    || path.join(process.cwd(), 'usuarios.json');
const FROM = 'BIMS <soporte@bimsaddin.com>';

// Cuentas internas de pruebas: nunca reciben el aviso.
// Prefijos, no coincidencia exacta: las cuentas internas son alejoszapatasergio00,
// alejoszapatasegio09, bimsaddins, etc. Exigir la "@" justo detrás las dejaba pasar.
const EXCLUIR = /^(alejoszapat|salejoszap|bimsaddin|soporte|sergioalejosz)/i;

function leerClave() {
    const k = fs.readFileSync(RESEND_KEY_PATH, 'utf8').trim();
    if (!k) throw new Error('La clave de Resend está vacía');
    return k;
}

async function enviar(apiKey, to, subject, html) {
    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(body)}`);
    return body.id || 'sin-id';
}

function destinatarios() {
    // El volcado de usuarios NO se conserva en el repo: contiene datos personales
    // de toda la base. Se genera al vuelo cuando hace falta y se borra después.
    if (!fs.existsSync(USERS_JSON)) {
        throw new Error(
            `No existe el volcado de usuarios (${USERS_JSON}).\n` +
            `  Es intencionado: lleva datos personales y no se guarda en el repo.\n` +
            `  Regenéralo con:\n` +
            `    npx firebase-tools database:get /users_v2 --project bims-8d507 --output usuarios.json\n` +
            `  y BÓRRALO en cuanto termines el envío.`
        );
    }
    const raw = JSON.parse(fs.readFileSync(USERS_JSON, 'utf8'));
    const vistos = new Set();
    const out = [];
    for (const uid of Object.keys(raw)) {
        const u = raw[uid] || {};
        const email = (u.email || u.Email || '').trim();
        if (!email || !email.includes('@')) continue;
        if (EXCLUIR.test(email)) continue;
        const key = email.toLowerCase();
        if (vistos.has(key)) continue;          // un correo, un aviso
        vistos.add(key);
        const meta = u.trialMeta || {};
        out.push({
            email,
            nombre: (meta.name || u.displayName || '').split(' ')[0] || '',
            lang:   meta.lang || 'es',
            tipo:   u.licenseType || u.LicenseType || '?',
        });
    }
    return out.sort((a, b) => a.email.localeCompare(b.email));
}

const espera = ms => new Promise(r => setTimeout(r, ms));

async function main() {
    if (MODO === '--test') {
        const apiKey = leerClave();
        for (const lang of ['es', 'en']) {
            const { subject, html } = getPolicyUpdateEmail(lang, 'Sergio');
            const id = await enviar(apiKey, 'soporte@bimsaddin.com',
                `[PRUEBA ${lang.toUpperCase()}] ${subject}`, html);
            console.log(`  prueba ${lang.toUpperCase()} enviada → ${id}`);
        }
        console.log('\nRevisa soporte@bimsaddin.com. Si el render está bien, lanza --enviar.');
        return;
    }

    const lista = destinatarios();
    console.log(`Destinatarios: ${lista.length}`);
    for (const d of lista) console.log(`  ${d.email.padEnd(40)} ${d.lang}  ${d.tipo}`);

    if (MODO !== '--enviar') {
        console.log('\n(simulación — no se ha enviado nada; usa --enviar para el envío real)');
        return;
    }

    const apiKey = leerClave();
    console.log('\n⚠️  ENVÍO REAL en 5 segundos. Ctrl+C para abortar.');
    await espera(5000);

    let ok = 0, fallos = 0;
    for (const d of lista) {
        const { subject, html } = getPolicyUpdateEmail(d.lang, d.nombre);
        try {
            const id = await enviar(apiKey, d.email, subject, html);
            ok++;
            console.log(`  ✓ ${d.email} → ${id}`);
        } catch (e) {
            fallos++;
            console.log(`  ✗ ${d.email} → ${e.message}`);
        }
        await espera(600);   // ~2 envíos/s: por debajo del límite de Resend
    }
    console.log(`\nEnviados: ${ok} · Fallidos: ${fallos}`);
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
