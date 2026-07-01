// ── _lib/ls-plans.js ──────────────────────────────────────────────────────────
// Mapa de Variant IDs de Lemon Squeezy → plan de BIMS. Fuente de verdad única
// que usan create-ls-checkout (elige el variant a comprar) y lemonsqueezy-webhook
// (traduce el variant comprado a plan/licencia). Si cambias precios en LS, los
// Variant IDs NO cambian; solo si borras/recreas un variant hay que actualizarlos.
//
// Store: BIMS (id 421750). Variants confirmados vía API 2026-06-30:
//   1856678 Individual  Monthly  $16.90/mes
//   1856662 Individual  Yearly   $159/año
//   1856683 Profesional Monthly  $26.90/mes
//   1856682 Profesional Yearly   $269/año
// ─────────────────────────────────────────────────────────────────────────────

const VARIANTS = {
    '1856678': { plan: 'individual',  licenseType: 'Monthly', maxDevices: 1, duration: 'monthly' },
    '1856662': { plan: 'individual',  licenseType: 'Annual',  maxDevices: 1, duration: 'yearly'  },
    '1856683': { plan: 'profesional', licenseType: 'Monthly', maxDevices: 3, duration: 'monthly' },
    '1856682': { plan: 'profesional', licenseType: 'Annual',  maxDevices: 3, duration: 'yearly'  },
};

// Búsqueda inversa: (plan, duration) → variantId. La usa el checkout.
function variantIdFor(plan, duration) {
    const d = duration === 'yearly' || duration === 'annual' || duration === '12m' ? 'yearly' : 'monthly';
    const entry = Object.entries(VARIANTS).find(([, v]) => v.plan === plan && v.duration === d);
    return entry ? entry[0] : null;
}

function planForVariant(variantId) {
    return VARIANTS[String(variantId)] || null;
}

module.exports = { VARIANTS, variantIdFor, planForVariant, STORE_ID: '421750' };
