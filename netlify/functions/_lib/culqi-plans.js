// ── _lib/culqi-plans.js ──────────────────────────────────────────────────────
// Catálogo de planes de Culqi: fuente de verdad ÚNICA del importe que se cobra
// y de los términos de la licencia que ese importe compra.
//
// Antes vivía duplicado dentro de culqi-charge.js (importes) y culqi-webhook.js
// (meses y dispositivos se leían de la metadata del webhook). Unificarlo permite
// que el webhook derive la licencia del par plan+duración VERIFICADO y compruebe
// que el importe realmente cobrado coincide con el del catálogo, en vez de creer
// lo que venga en `metadata.months`.
//
// SKU de prueba: la entrada `test` (S/5) sólo existe si ALLOW_TEST_SKU === 'true'.
// Estaba permanentemente activa en producción, y como el endpoint de cobro sólo
// filtra por Origin (falsificable), cualquiera podía comprar una licencia mensual
// completa por S/5 en vez de S/60.
// ─────────────────────────────────────────────────────────────────────────────

const PLAN_MAX_DEVICES = { individual: 1, profesional: 3 };

// amount en CENTAVOS de sol (lo que espera la API de Culqi).
const CATALOG = {
    individual: {
        '1m':  { title: 'BIMS Individual – 1 mes',    amount: 6000,  months: 1  },
        '3m':  { title: 'BIMS Individual – 3 meses',  amount: 16000, months: 3  },
        '6m':  { title: 'BIMS Individual – 6 meses',  amount: 30000, months: 6  },
        '12m': { title: 'BIMS Individual – 1 año',    amount: 59600, months: 12 },
    },
    profesional: {
        '1m':  { title: 'BIMS Profesional – 1 mes',   amount: 10000, months: 1  },
        '3m':  { title: 'BIMS Profesional – 3 meses', amount: 26800, months: 3  },
        '6m':  { title: 'BIMS Profesional – 6 meses', amount: 50000, months: 6  },
        '12m': { title: 'BIMS Profesional – 1 año',   amount: 99600, months: 12 },
    },
};

// SKU de prueba de S/5 — SOLO bajo variable de entorno explícita, nunca en prod.
if (process.env.ALLOW_TEST_SKU === 'true') {
    CATALOG.test = { 'test': { title: 'BIMS TEST – S/5', amount: 500, months: 1 } };
}

// Devuelve el item del catálogo o null si el par plan/duración no existe.
function getPlanItem(plan, duration) {
    if (typeof plan !== 'string' || typeof duration !== 'string') return null;
    return (CATALOG[plan] && CATALOG[plan][duration]) || null;
}

// Dispositivos permitidos por plan (1 si el plan no está en el mapa).
function maxDevicesFor(plan) {
    return PLAN_MAX_DEVICES[plan] || 1;
}

// Tipo de licencia según los meses comprados.
function licenseTypeForMonths(months) {
    return months >= 12 ? 'Annual' : 'Monthly';
}

module.exports = { CATALOG, PLAN_MAX_DEVICES, getPlanItem, maxDevicesFor, licenseTypeForMonths };
