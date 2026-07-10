// Checkout internacional (Lemon Squeezy) vía enlaces hospedados "buy/{slug}".
// NO requiere API key en el servidor (evita el límite de 4 KB de env vars de
// Netlify/Lambda): redirigimos directo al checkout de LS, que cobra con tarjeta
// internacional / wallets. Al pagar, el webhook (lemonsqueezy-webhook) provisiona
// la licencia mapeando el variant comprado → plan.
//
// Slugs (UUID) de los variants en modo LIVE del store 421750, obtenidos vía API
// 2026-07-09. Ver netlify/functions/_lib/ls-plans.js (mapa inverso del webhook).
//
// OJO: los slugs anteriores apuntaban a variants creados con la tienda en Test
// mode; LS separa por completo test y live, así que aquellos checkouts cobraban
// con Stripe de prueba (ninguna tarjeta real pasaba). Al recrear los productos
// en live cambiaron tanto los variant IDs como estos slugs.
const BUY_BASE = 'https://bims.lemonsqueezy.com/buy';
const BUY_SLUGS = {
  'individual|monthly':  'b12bee57-5b89-4649-813c-5d134bf07140',
  'individual|yearly':   '6bb19307-0438-43fa-8618-4bcfb088dee6',
  'profesional|monthly': '14eb7910-34cf-462f-927b-a9cf4aeca9e0',
  'profesional|yearly':  '2ae535aa-4d59-4c9c-b911-8c6d44debf9a',
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
