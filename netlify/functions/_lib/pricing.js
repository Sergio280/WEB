// ─────────────────────────────────────────────────────────────────────────────
// FUENTE ÚNICA DE PRECIOS (backend).
//
// Este archivo fija el monto que REALMENTE se le cobra al cliente en Culqi.
// El frontend (app-v2/src/data/pricing.js) solo MUESTRA precios; el cobro se
// arma aquí, del lado del servidor, para que nadie pueda manipularlo desde el
// navegador.
//
// ⚠️ GEMELO EN EL FRONTEND: app-v2/src/data/pricing.js
//    Los dos archivos deben contener exactamente la misma tabla de precios. No
//    pueden unificarse en un módulo porque el frontend es ESM (Vite) y las
//    functions son CommonJS con su propio bundling.
//    ANTES DE DESPLEGAR UN CAMBIO DE PRECIOS, correr:
//        node scripts/verificar-precios.mjs
//    Compara ambos archivos y falla si difieren. Si se desincronizan, el
//    cliente ve un precio en la web y se le cobra otro.
// ─────────────────────────────────────────────────────────────────────────────

// Tasa de IGV vigente en Perú (16% IGV + 2% IPM).
const IGV_RATE = 0.18;

// ⚠️ PRECIOS EN SOLES, IGV INCLUIDO. Ver el comentario extenso del gemelo en el
// frontend para el porqué de absorber el IGV en vez de sumarlo (decisión del
// 2026-07-30, al quedar afecto a IGV desde el 01/08/2026).
const PRECIOS_PEN = {
    individual:  { '1m': 60,  '3m': 160, '6m': 300, '12m': 596, sub: 60  },
    profesional: { '1m': 100, '3m': 268, '6m': 500, '12m': 996, sub: 100 },
};

const MESES_POR_DURACION = { '1m': 1, '3m': 3, '6m': 6, '12m': 12 };

const PLAN_MAX_DEVICES = { individual: 1, profesional: 3 };

// Nombre comercial de cada plan, para la descripción del cobro y del comprobante.
const NOMBRE_PLAN = { individual: 'BIMS Individual', profesional: 'BIMS Profesional' };

const ETIQUETA_DURACION = {
    '1m':  '1 mes',
    '3m':  '3 meses',
    '6m':  '6 meses',
    '12m': '1 año',
};

/**
 * Separa un total (IGV incluido) en base imponible + IGV.
 *
 * El IGV se obtiene por DIFERENCIA en vez de redondear cada componente por
 * separado, para garantizar que `base + igv === total` exacto al céntimo. Es lo
 * que exige SUNAT en el comprobante: si difieren en un céntimo, la factura
 * puede ser rechazada.
 *
 * @param {number} total Monto final que paga el cliente, en soles.
 * @returns {{ total: number, base: number, igv: number }} montos en soles.
 */
function desglosarIgv(total) {
    const base = Math.round((total / (1 + IGV_RATE)) * 100) / 100;
    const igv  = Math.round((total - base) * 100) / 100;
    return { total, base, igv };
}

/** Convierte soles a céntimos, que es la unidad que espera la API de Culqi. */
function aCentimos(soles) {
    return Math.round(soles * 100);
}

/**
 * Devuelve el ítem cobrable de un plan/duración, o null si no existe.
 * Sustituye al CATALOG que antes estaba escrito a mano en culqi-charge.js.
 *
 * @returns {{ title, amount, months, maxDevices, totalSoles, base, igv } | null}
 *          `amount` va en CÉNTIMOS (Culqi); `totalSoles`/`base`/`igv`, en soles.
 */
function itemCobrable(plan, duration) {
    // Plan de prueba histórico: cobro simbólico de S/5 usado para validar la
    // pasarela end-to-end sin mover precios reales. Se conserva a propósito.
    if (plan === 'test' && duration === 'test') {
        const d = desglosarIgv(5);
        return { title: 'BIMS TEST – S/5', amount: 500, months: 1, maxDevices: 1, totalSoles: 5, base: d.base, igv: d.igv };
    }

    const total = PRECIOS_PEN[plan] && PRECIOS_PEN[plan][duration];
    const meses = MESES_POR_DURACION[duration];
    if (total == null || !meses) return null;

    const d = desglosarIgv(total);
    return {
        title:      `${NOMBRE_PLAN[plan]} – ${ETIQUETA_DURACION[duration]}`,
        amount:     aCentimos(total),
        months:     meses,
        maxDevices: PLAN_MAX_DEVICES[plan] || 1,
        totalSoles: total,
        base:       d.base,
        igv:        d.igv,
    };
}

module.exports = {
    IGV_RATE,
    PRECIOS_PEN,
    MESES_POR_DURACION,
    PLAN_MAX_DEVICES,
    NOMBRE_PLAN,
    ETIQUETA_DURACION,
    desglosarIgv,
    aCentimos,
    itemCobrable,
};
