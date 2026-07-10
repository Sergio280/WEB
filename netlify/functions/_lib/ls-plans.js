// ── _lib/ls-plans.js ──────────────────────────────────────────────────────────
// Mapa de Variant IDs de Lemon Squeezy → plan de BIMS. Fuente de verdad única
// que usan create-ls-checkout (elige el variant a comprar) y lemonsqueezy-webhook
// (traduce el variant comprado a plan/licencia). Si cambias precios en LS, los
// Variant IDs NO cambian; solo si borras/recreas un variant hay que actualizarlos.
//
// Store: BIMS (id 421750). Variants de PRODUCCIÓN (modo LIVE), confirmados vía
// API 2026-07-09 (test_mode:false, is_subscription:true, published):
//   1890938 Individual  Monthly  $16.90/mes
//   1890933 Individual  Yearly   $159/año
//   1890946 Profesional Monthly  $26.90/mes
//   1890947 Profesional Yearly   $269/año
//
// OJO: Lemon Squeezy mantiene objetos SEPARADOS para test y live. Los variants
// antiguos (1856678/1856662/1856683/1856682) se crearon con la tienda en Test
// mode y NO existen en live; quedaron obsoletos al activar la tienda.
// ─────────────────────────────────────────────────────────────────────────────

const VARIANTS = {
    '1890938': { plan: 'individual',  licenseType: 'Monthly', maxDevices: 1, duration: 'monthly' },
    '1890933': { plan: 'individual',  licenseType: 'Annual',  maxDevices: 1, duration: 'yearly'  },
    '1890946': { plan: 'profesional', licenseType: 'Monthly', maxDevices: 3, duration: 'monthly' },
    '1890947': { plan: 'profesional', licenseType: 'Annual',  maxDevices: 3, duration: 'yearly'  },
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
