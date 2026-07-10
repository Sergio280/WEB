#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// activation-report.mjs — Medidor de ACTIVACIÓN de trials de BIMS.
//
// Responde la pregunta que decide si vale la pena comprar el certificado de
// firma de código: ¿cuánta gente se registra y NUNCA llega a instalar/activar?
// Esa brecha es, sobre todo, SmartScreen bloqueando el instalador sin firmar.
//
// LOS DOS EMBUDOS NO SON IGUALES (importante para interpretar el reporte):
//   • source='web-form' → el usuario se registra ANTES de instalar. Aquí
//     "registrado sin activar" SÍ mide la fuga de SmartScreen.
//   • source='plugin'   → ya instaló (y pasó SmartScreen) ANTES de registrarse.
//     Aquí la fuga es invisible: quien rebota nunca llega a registrarse. Para
//     medirla, compara estos registros contra las DESCARGAS que reporta el
//     portal de Autodesk (App Store).
//
// Uso:
//   npx firebase-tools database:get /users_v2 --project bims-8d507 \
//       --instance bims-8d507-default-rtdb > users.json
//   node scripts/activation-report.mjs users.json [--desde AAAA-MM-DD]
//
// El flag --desde limita el análisis a registros posteriores a esa fecha (útil
// para comparar antes/después de la publicación en el Autodesk App Store).
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs';

// Cuentas propias de Sergio (pruebas). Se excluyen para no falsear el ratio:
// mezclarlas fue justo lo que enturbió el análisis de tráfico US/EU.
const EXCLUIR_EMAILS = new Set([
    'bimsaddin@gmail.com',
    'salejoszap@ucvvirtual.edu.pe',
]);
const EXCLUIR_PATRONES = [
    /^alejoszapatas?e?rgio\d*@gmail\.com$/i, // alejoszapatasergioNN@ y el typo "segio"
    /^a\.z\.sergio@/i,
    /@autodesk\.com$/i, // el revisor del App Store: instala y prueba, nunca comprará
];

// Fecha en que se desplegó la secuencia de correos del trial (bienvenida +
// días 3/7/12). Los registros ANTERIORES no recibieron NINGÚN seguimiento, así
// que su conversión a pago no es una medida justa del producto.
const NURTURE_DESDE = Date.parse('2026-07-04');

// Supuestos del veredicto, explícitos para poder discutirlos.
const CERT_USD     = 139;  // Certum Cloud Code Signing Individual, 1 año
const RECUPERACION = 0.5;  // fracción de la fuga que firmar recuperaría (conservador:
                           // firmar NO elimina SmartScreen de golpe, sube reputación)

const esCuentaDePrueba = (email) =>
    !email ||
    EXCLUIR_EMAILS.has(email.toLowerCase()) ||
    EXCLUIR_PATRONES.some((rx) => rx.test(email));

// ── Entrada ──────────────────────────────────────────────────────────────────
const archivo = process.argv[2];
if (!archivo) {
    console.error('Uso: node scripts/activation-report.mjs <users.json> [--desde AAAA-MM-DD]');
    process.exit(1);
}
const iDesde = process.argv.indexOf('--desde');
const desdeMs = iDesde > -1 && process.argv[iDesde + 1] ? Date.parse(process.argv[iDesde + 1]) : null;

const users = JSON.parse(fs.readFileSync(archivo, 'utf8')) || {};

// ── Normalización ────────────────────────────────────────────────────────────
const filas = [];
for (const [uid, rec] of Object.entries(users)) {
    if (!rec || !rec.email) continue;
    if (esCuentaDePrueba(rec.email)) continue;

    const meta = rec.trialMeta || {};
    const creadoIso = meta.createdAt || rec.createdAt;
    const creadoMs = creadoIso ? Date.parse(creadoIso) : NaN;
    if (Number.isNaN(creadoMs)) continue;
    if (desdeMs && creadoMs < desdeMs) continue;

    // Activación = el plugin corrió y registró al menos un hardware.
    const acts = Object.values(rec.activations || {});
    const primeraAct = acts
        .map((a) => Date.parse(a.activatedAt))
        .filter((t) => !Number.isNaN(t))
        .sort((a, b) => a - b)[0];

    // Registros SIN trialMeta son anteriores al seguimiento (creados a mano o por
    // pasarela). Marcarlos 'legacy' y EXCLUIRLOS del veredicto: no sabemos si el
    // plugin de esa época escribía `activations`, así que contarlos como "nunca
    // instaló" inflaría la fuga y llevaría a comprar el certificado por una cifra
    // falsa. (Caso real: evelyn.7.1998, cliente de pago de marzo, sin activations.)
    const origen = meta.source || (rec.trialMeta ? '—' : 'legacy');

    filas.push({
        uid,
        email: rec.email,
        pais: meta.country || '—',
        origen,
        creadoMs,
        activo: acts.length > 0,
        horasHastaActivar: primeraAct ? (primeraAct - creadoMs) / 36e5 : null,
        // Un trial que pasó a plan pagado (o que nació pagado) = conversión.
        pago: rec.licenseType && rec.licenseType !== 'Trial',
    });
}

// ── Utilidades ───────────────────────────────────────────────────────────────
const pct = (a, b) => (b === 0 ? '—' : ((a / b) * 100).toFixed(1) + '%');
const mediana = (xs) => {
    const v = xs.filter((x) => x != null).sort((a, b) => a - b);
    if (!v.length) return null;
    const m = Math.floor(v.length / 2);
    return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};

function bloque(titulo, subconjunto) {
    const total = subconjunto.length;
    const act = subconjunto.filter((f) => f.activo).length;
    const pagos = subconjunto.filter((f) => f.pago).length;
    const med = mediana(subconjunto.map((f) => f.horasHastaActivar));
    console.log(`\n${titulo}`);
    console.log(`  registros            : ${total}`);
    console.log(`  activaron (instalaron): ${act}   → tasa de activación: ${pct(act, total)}`);
    console.log(`  NO activaron (fuga)  : ${total - act}   → fuga: ${pct(total - act, total)}`);
    console.log(`  convirtieron a pago  : ${pagos}   → ${pct(pagos, total)}`);
    if (med != null) console.log(`  mediana hasta activar: ${med.toFixed(1)} h`);
}

function tabla(titulo, clave) {
    const grupos = {};
    for (const f of filas) (grupos[f[clave]] ||= []).push(f);
    console.log(`\n${titulo}`);
    const orden = Object.entries(grupos).sort((a, b) => b[1].length - a[1].length);
    console.log('  ' + 'clave'.padEnd(12) + 'reg'.padStart(5) + 'act'.padStart(5) + 'tasa'.padStart(9) + '  pagos');
    for (const [k, v] of orden) {
        const act = v.filter((f) => f.activo).length;
        const pagos = v.filter((f) => f.pago).length;
        console.log('  ' + String(k).padEnd(12) + String(v.length).padStart(5) + String(act).padStart(5) + pct(act, v.length).padStart(9) + String(pagos).padStart(7));
    }
}

// ── Reporte ──────────────────────────────────────────────────────────────────
console.log('═'.repeat(72));
console.log(' MEDIDOR DE ACTIVACIÓN — BIMS' + (desdeMs ? `  (desde ${process.argv[iDesde + 1]})` : ''));
console.log(' Cuentas de prueba excluidas. "Activar" = el plugin corrió al menos una vez.');
console.log('═'.repeat(72));

bloque('▸ GLOBAL (todos los orígenes)', filas);

const web = filas.filter((f) => f.origen === 'web-form');
const plugin = filas.filter((f) => f.origen === 'plugin');

bloque('▸ EMBUDO WEB  (registra → descarga → SmartScreen → instala)', web);
console.log('  ↳ Esta "fuga" ES la fuga de SmartScreen. Es la que el certificado ataca.');

bloque('▸ EMBUDO PLUGIN / APP STORE  (instala → SmartScreen ya pasó → registra)', plugin);
console.log('  ↳ Aquí la fuga NO se ve: quien rebota en SmartScreen nunca se registra.');
console.log('  ↳ Compara estos registros con las DESCARGAS del portal de Autodesk.');

tabla('▸ POR PAÍS', 'pais');
tabla('▸ POR ORIGEN', 'origen');

const legacy = filas.filter((f) => f.origen === 'legacy');
if (legacy.length) {
    console.log(`\n▸ HEREDADOS (sin trialMeta, anteriores al seguimiento): ${legacy.length}`);
    console.log('  ↳ EXCLUIDOS del veredicto: no se sabe si su plugin escribía `activations`,');
    console.log('    así que contarlos como "nunca instaló" inflaría la fuga artificialmente.');
    for (const f of legacy) console.log(`    ${new Date(f.creadoMs).toISOString().slice(0, 10)}  ${f.email}${f.pago ? '  (PAGÓ)' : ''}`);
}

// Detalle de los que se registraron y nunca instalaron (el dinero que se fuga).
const fuga = filas.filter((f) => !f.activo && f.origen === 'web-form').sort((a, b) => b.creadoMs - a.creadoMs);
if (fuga.length) {
    console.log('\n▸ REGISTRADOS QUE NUNCA INSTALARON (embudo web)');
    for (const f of fuga) {
        console.log(`  ${new Date(f.creadoMs).toISOString().slice(0, 10)}  ${f.pais.padEnd(4)} ${f.email}`);
    }
}

// ── Veredicto sobre el certificado ───────────────────────────────────────────
// REGLA CENTRAL: el certificado solo ataca el paso registro→instalación. Si el
// paso siguiente (instalación→pago) convierte a 0%, firmar multiplica por cero.
// Una versión anterior de este script recomendaba comprar mirando SOLO la tasa
// de instalación; era una métrica mal calibrada.
const totalWeb   = web.length;
const instalaron = web.filter((f) => f.activo);
const fugaWeb    = totalWeb - instalaron.length;
const pagaron    = instalaron.filter((f) => f.pago).length;
const conNurture = web.filter((f) => f.creadoMs >= NURTURE_DESDE).length;

console.log('\n' + '─'.repeat(72));
console.log(` VEREDICTO SOBRE EL CERTIFICADO DE FIRMA ($${CERT_USD}/año)`);
console.log('─'.repeat(72));
console.log(` Embudo web: ${totalWeb} registros → ${instalaron.length} instalaron → ${pagaron} pagaron.`);
console.log(` (Revisor de Autodesk excluido: instala y prueba, pero nunca comprará.)`);

if (totalWeb < 10) {
    console.log(`\n MUESTRA INSUFICIENTE (${totalWeb} registros). Junta al menos 10 antes de decidir.`);
} else if (instalaron.length < 5) {
    console.log(`\n Solo ${instalaron.length} instalaciones: aún no se puede juzgar la conversión a pago.`);
    console.log(' Espera más instalaciones antes de decidir sobre el certificado.');
} else if (pagaron === 0) {
    console.log(`\n ❌ NO COMPRAR — todavía.`);
    console.log(` De los ${instalaron.length} que SÍ instalaron y usaron BIMS, pagaron ${pagaron}.`);
    console.log(' El cuello de botella NO es la instalación: es lo que pasa DESPUÉS.');
    console.log(' Firmar mete más gente por una puerta que hoy desemboca en 0 ventas.');
    if (conNurture < 5) {
        console.log(`\n ATENUANTE: solo ${conNurture} registro${conNurture === 1 ? ' es posterior' : 's son posteriores'} al ${new Date(NURTURE_DESDE).toISOString().slice(0, 10)},`);
        console.log(' cuando se desplegó la secuencia de correos del trial. Los demás NO recibieron');
        console.log(' ningún seguimiento, así que su 0% de conversión no juzga al producto.');
        console.log(' → Primero deja correr los correos y vuelve a medir. Cuesta $0.');
    }
    console.log('\n Acción de mayor valor ahora (gratis): preguntar a los que instalaron y no');
    console.log(' compraron qué les faltó, y a los que no instalaron qué los detuvo. Si dicen');
    console.log(' "me salió una alerta de Windows", ahí tienes la evidencia para comprar.');
} else {
    // Hay conversión real: se puede estimar el retorno del certificado.
    const convInstalados = pagaron / instalaron.length;
    const dias = (Math.max(...web.map((f) => f.creadoMs)) - Math.min(...web.map((f) => f.creadoMs))) / 864e5 || 1;
    const registrosAnio  = (totalWeb / dias) * 365;
    const fugaTasa       = fugaWeb / totalWeb;
    const instalExtraAnio = registrosAnio * fugaTasa * RECUPERACION;
    const clientesExtraAnio = instalExtraAnio * convInstalados;
    const breakEven = clientesExtraAnio > 0 ? CERT_USD / clientesExtraAnio : Infinity;

    console.log(`\n Conversión de los que instalan: ${pct(pagaron, instalaron.length)}`);
    console.log(` Ritmo actual: ~${registrosAnio.toFixed(0)} registros/año · fuga ${pct(fugaWeb, totalWeb)}`);
    console.log(` Si firmar recupera el ${(RECUPERACION * 100).toFixed(0)}% de la fuga:`);
    console.log(`   → ~${instalExtraAnio.toFixed(1)} instalaciones extra/año`);
    console.log(`   → ~${clientesExtraAnio.toFixed(2)} clientes extra/año`);
    console.log(`\n Punto de equilibrio: cada cliente extra debe valer ≥ $${breakEven.toFixed(0)} para pagar el certificado.`);
    console.log(breakEven < 100
        ? ' ✅ COMPRAR: el umbral está por debajo del valor de un cliente típico.'
        : ' ⚠️  DUDOSO: el umbral supera lo que vale un cliente. Sube el volumen o la conversión primero.');
}
console.log('');
