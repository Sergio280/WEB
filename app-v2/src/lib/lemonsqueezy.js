// Checkout internacional (Lemon Squeezy) vía enlaces hospedados "buy/{slug}".
// NO requiere API key en el servidor (evita el límite de 4 KB de env vars de
// Netlify/Lambda): redirigimos directo al checkout de LS, que cobra con tarjeta
// internacional / wallets. Al pagar, el webhook (lemonsqueezy-webhook) provisiona
// la licencia mapeando el variant comprado → plan.
//
// Slugs (UUID) obtenidos vía API del store 421750. NO cambian salvo que se
// borre/recree el variant. Ver netlify/functions/_lib/ls-plans.js (mapa inverso
// que usa el webhook).
const BUY_BASE = 'https://bims.lemonsqueezy.com/buy';
const BUY_SLUGS = {
  'individual|monthly':  'b8e4dab0-ee5d-4215-87b5-9500c6dfade9',
  'individual|yearly':   '79743f1a-3b8d-4654-8086-9c3438568c67',
  'profesional|monthly': '0ec235c5-2c2a-49b6-b745-f0f8506f78c8',
  'profesional|yearly':  '20a8681a-2554-4801-85d6-2b230d031acf',
};

// Redirige al checkout de LS del plan/duración. Lanza si el plan no está mapeado.
export function openLsCheckout({ plan, duration, email }) {
  const d = duration === 'yearly' ? 'yearly' : 'monthly';
  const slug = BUY_SLUGS[`${plan}|${d}`];
  if (!slug) throw new Error('Este plan no está disponible para pago internacional.');
  // Brackets literales: LS espera checkout[email]. Solo prellenamos el email;
  // el vencimiento/plan los resuelve el webhook por el variant comprado.
  const q = email ? `?checkout[email]=${encodeURIComponent(email)}` : '';
  window.location.href = `${BUY_BASE}/${slug}${q}`;
}
