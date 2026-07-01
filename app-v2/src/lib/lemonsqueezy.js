// Checkout internacional (Lemon Squeezy). Pide al backend la URL del checkout
// hospedado para el plan/duración y redirige. Lanza con mensaje si algo falla,
// para mostrarlo en el modal. El cobro en sí lo hace la página hospedada de LS
// (tarjetas internacionales / wallets); al pagar, el webhook provisiona la licencia.
export async function openLsCheckout({ plan, duration, email }) {
  const r = await fetch('/api/ls-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, duration, email }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data.url) {
    throw new Error(data.error || 'No se pudo iniciar el pago internacional. Intenta de nuevo.');
  }
  window.location.href = data.url; // redirige al checkout de Lemon Squeezy
}
