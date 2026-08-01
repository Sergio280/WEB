// ─────────────────────────────────────────────────────────────────────────────
// Códigos de promoción.
//
// REGLA DE ORO: el navegador NUNCA dice cuánto se cobra. Manda el CÓDIGO y el
// servidor decide el precio. Si el descuento se aplicara en el cliente,
// cualquiera abriría las herramientas de desarrollo y se pagaría S/1.
//
// Por eso el código se valida DOS veces:
//   1. En /api/validar-descuento, solo para MOSTRAR el precio rebajado.
//   2. Otra vez en culqi-charge.js, que es quien fija el monto real del cobro.
// La primera es cosmética; la segunda es la que manda.
//
// ── Dónde se definen los códigos ─────────────────────────────────────────────
// En la variable de entorno DESCUENTOS de Netlify, como un JSON. Así se crean y
// se caducan códigos SIN desplegar:
//
//   [
//     {
//       "codigo": "BIENVENIDA40",
//       "precioFinal": 40,          // precio final en soles, IGV incluido
//       "planes": ["individual"],   // opcional; si falta, vale para todos
//       "duraciones": ["1m"],       // opcional; si falta, vale para todas
//       "vence": "2026-08-31",      // opcional, inclusive (fin de ese día UTC)
//       "usosMax": 1,               // opcional; si falta, ilimitado
//       "email": "persona@empresa.com"  // opcional; ver abajo
//     }
//   ]
//
// En vez de `precioFinal` se puede usar `descuentoPct` (p. ej. 30 = −30%).
// `precioFinal` manda si están los dos.
//
// ── Promociones para UNA persona concreta ────────────────────────────────────
// Con `email` el código solo se aplica si el comprador escribe ESE correo. Si
// el enlace se filtra o se comparte, quien lo abra verá el precio de lista en
// cuanto ponga su propio correo, y el servidor cobra lista aunque intente
// saltarse la web. Combínalo con un código impredecible (algo tipo
// "p7f3k9x2m4qz") en vez de una palabra adivinable, y con `usosMax: 1`.
//
// `email` acepta también una lista: ["ana@x.com", "luis@y.com"].
// ─────────────────────────────────────────────────────────────────────────────

const { desglosarIgv } = require('./pricing');

/** Lee y parsea la tabla de códigos. Nunca lanza: sin códigos, no hay promos. */
function cargarCodigos() {
    const crudo = process.env.DESCUENTOS;
    if (!crudo) return [];
    try {
        const arr = JSON.parse(crudo);
        return Array.isArray(arr) ? arr : [];
    } catch (e) {
        // Un JSON mal escrito NO debe tumbar el checkout: se ignora la promoción
        // y todo el mundo paga precio de lista, que es el fallo seguro.
        console.error('[descuentos] DESCUENTOS no es un JSON válido:', e?.message || e);
        return [];
    }
}

/** Normaliza para comparar: sin espacios, en mayúsculas. */
const norm = (s) => String(s || '').trim().toUpperCase();

/** Correos a los que está reservada una promo, normalizados. [] = a nadie en concreto. */
function correosDe(promo) {
    const e = promo.email ?? promo.emails;
    if (!e) return [];
    return (Array.isArray(e) ? e : [e]).map((x) => String(x).trim().toLowerCase()).filter(Boolean);
}

/**
 * Busca un código y comprueba que aplique a este plan/duración y siga vigente.
 * NO comprueba el número de usos: eso necesita leer Firebase y lo hace
 * `usosDisponibles`, que solo se llama donde hace falta.
 *
 * @param {string} email  Correo del comprador. Puede venir vacío: al abrir el
 *   modal aún no lo ha escrito. En ese caso una promo reservada se considera
 *   aplicable «de momento» y se devuelve `requiereEmail`, para que la web
 *   enseñe el precio rebajado desde el principio y lo revise al teclearlo.
 *   `estricto: true` desactiva esa cortesía — lo usa el cobro, donde el correo
 *   ya se conoce y no hay nada que suponer.
 *
 * @returns {{ ok:boolean, motivo?:string, promo?:object, requiereEmail?:boolean }}
 */
function buscarCodigo(codigo, plan, duration, email = '', estricto = false) {
    const c = norm(codigo);
    if (!c) return { ok: false, motivo: 'vacio' };

    const promo = cargarCodigos().find((p) => norm(p.codigo) === c);
    if (!promo) return { ok: false, motivo: 'inexistente' };

    if (Array.isArray(promo.planes) && promo.planes.length && !promo.planes.includes(plan))
        return { ok: false, motivo: 'plan_no_aplica' };

    if (Array.isArray(promo.duraciones) && promo.duraciones.length && !promo.duraciones.includes(duration))
        return { ok: false, motivo: 'duracion_no_aplica' };

    if (promo.vence) {
        // Vigente durante TODO el día indicado: se compara contra su final.
        const fin = Date.parse(promo.vence + 'T23:59:59Z');
        if (!Number.isNaN(fin) && Date.now() > fin) return { ok: false, motivo: 'caducado' };
    }

    // Promoción reservada a uno o varios correos concretos.
    const reservada = correosDe(promo);
    if (reservada.length) {
        const e = String(email || '').trim().toLowerCase();
        if (!e) {
            if (estricto) return { ok: false, motivo: 'otro_email' };
            return { ok: true, promo, requiereEmail: true };
        }
        if (!reservada.includes(e)) return { ok: false, motivo: 'otro_email' };
    }

    return { ok: true, promo };
}

/**
 * Aplica la promoción a un total y devuelve el nuevo importe con su desglose.
 * El precio nunca baja de S/1 (mínimo razonable para la pasarela) ni sube.
 */
function aplicar(promo, totalOriginal) {
    let total;
    if (promo.precioFinal != null) {
        total = Number(promo.precioFinal);
    } else if (promo.descuentoPct != null) {
        const pct = Math.min(100, Math.max(0, Number(promo.descuentoPct)));
        total = Math.round(totalOriginal * (1 - pct / 100) * 100) / 100;
    } else {
        total = totalOriginal;
    }

    if (!Number.isFinite(total) || total < 1) total = 1;
    if (total > totalOriginal) total = totalOriginal; // una promo nunca encarece

    const { base, igv } = desglosarIgv(total);
    return { total, base, igv, ahorro: Math.round((totalOriginal - total) * 100) / 100 };
}

/**
 * Comprueba en Firebase cuántas veces se usó el código y si queda cupo.
 * Se le pasa la referencia a la base para no obligar a este módulo a inicializar
 * firebase-admin (cada función ya lo tiene montado a su manera).
 *
 * @param {object} db  admin.database() ya inicializado.
 * @returns {Promise<{ ok:boolean, usos:number }>}
 */
async function usosDisponibles(db, promo) {
    if (promo.usosMax == null) return { ok: true, usos: 0 };
    try {
        const snap = await db.ref(`descuentos/${norm(promo.codigo)}/usos`).once('value');
        const usos = Number(snap.val() || 0);
        return { ok: usos < Number(promo.usosMax), usos };
    } catch (e) {
        // Si no se puede leer el contador, se deja pasar: preferimos cobrar de
        // menos una vez a rechazar un pago legítimo por un fallo de Firebase.
        console.warn('[descuentos] no se pudo leer el contador de usos:', e?.message || e);
        return { ok: true, usos: 0 };
    }
}

/** Suma uno al contador de usos. Best-effort: nunca rompe el cobro. */
async function registrarUso(db, codigo, datos = {}) {
    const c = norm(codigo);
    if (!c) return;
    try {
        await db.ref(`descuentos/${c}/usos`).transaction((n) => (Number(n) || 0) + 1);
        await db.ref(`descuentos/${c}/historial`).push({ ...datos, fecha: new Date().toISOString() });
    } catch (e) {
        console.warn('[descuentos] no se pudo registrar el uso de', c, e?.message || e);
    }
}

module.exports = { cargarCodigos, buscarCodigo, aplicar, usosDisponibles, registrarUso, norm, correosDe };
