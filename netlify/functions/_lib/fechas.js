// ── _lib/fechas.js ────────────────────────────────────────────────────────────
// Aritmética de fechas para vencimientos de licencia.
//
// POR QUÉ EXISTE
// `fecha.setMonth(fecha.getMonth() + n)` es la forma obvia de sumar meses y está
// mal: JavaScript no recorta el día al final del mes, lo DESBORDA al siguiente.
//
//     new Date('2026-01-31').setMonth(0 + 1)   → 31 de febrero → 3 de MARZO
//
// Las dos pasarelas calculaban así el vencimiento, así que quien compraba un 29,
// 30 o 31 recibía dos o tres días de más. Siempre a favor del cliente y siempre
// en las mismas fechas, así que no salta a la vista; en una suscripción mensual
// el desfase se repite en cada renovación y la fecha de cobro y la de
// vencimiento se van separando sin que nadie cuadre la diferencia.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Suma meses de calendario recortando el día al último del mes destino.
 *
 *   31 ene + 1 mes  → 28 feb (29 en año bisiesto), no 3 de marzo
 *   31 ago + 6 meses → 28/29 feb
 *   15 mar + 3 meses → 15 jun (el caso normal no cambia)
 *
 * Conserva la hora del día: solo se tocan día, mes y año.
 *
 * @param {Date} base
 * @param {number} meses
 * @returns {Date} instancia nueva; `base` no se modifica.
 */
function sumarMeses(base, meses) {
    const d = new Date(base.getTime());
    const diaOriginal = d.getDate();

    // Se planta el día 1 ANTES de mover el mes: si no, el propio setMonth ya
    // desbordaría (estando a 31, pasar a febrero rebota a marzo antes de que
    // lleguemos a recortar nada).
    d.setDate(1);
    d.setMonth(d.getMonth() + meses);

    // Día 0 del mes siguiente = último día del mes actual, contando bisiestos.
    const ultimoDiaDelMes = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(diaOriginal, ultimoDiaDelMes));

    return d;
}

module.exports = { sumarMeses };
