import { useEffect } from 'react';
import { CULQI_CONFIG, CULQI_PUBLIC_KEY } from '../data/culqi.js';

// Hook que replica EXACTAMENTE el flujo de pago Culqi de la home actual:
//  - usa el global window.Culqi (script v4 cargado en index.html)
//  - registra el callback global window.culqi
//  - pago único  → POST /api/culqi-charge        → /success.html
//  - suscripción → POST /api/culqi-subscription   → /success.html
export function useCulqi() {
  useEffect(() => {
    // Callback global que Culqi invoca al obtener el token de tarjeta.
    window.culqi = function () {
      const ctx = window._culqiContext || {};
      if (window.Culqi.error) {
        console.warn('[Culqi] Error/cancelado:', window.Culqi.error);
        return;
      }
      if (!window.Culqi.token) return;

      const token_id = window.Culqi.token.id;
      const email = ctx.email;
      const isSub = ctx.isSub;
      window.Culqi.close();

      const endpoint = isSub ? '/api/culqi-subscription' : '/api/culqi-charge';
      const body = isSub
        ? { token_id, email, plan: ctx.plan }
        : { token_id, email, plan: ctx.plan, duration: ctx.duration };

      if (ctx.onProcessing) ctx.onProcessing();

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            window.location.href = ctx.successUrl || '/success.html';
          } else {
            throw new Error(data.error || ctx.errRejected || 'Pago rechazado');
          }
        })
        .catch((err) => {
          console.error('[BIMS] Error de pago:', err);
          if (ctx.onError) ctx.onError(err.message || ctx.errPay || 'Error al procesar el pago. Intenta de nuevo.');
        });
    };

    return () => {
      // No removemos window.culqi para no romper un checkout en vuelo.
    };
  }, []);
}

// Abre el checkout de Culqi para un plan/duración/tipo concretos.
export function openCulqiCheckout({
  planKey,
  duration,
  isSub,
  email,
  title,
  description,
  successUrl,
  errLoad,
  errRejected,
  errPay,
  onProcessing,
  onError,
}) {
  const plan = CULQI_CONFIG.plans[planKey];
  if (!plan || !window.Culqi) {
    if (onError) onError(errLoad || 'No se pudo cargar el checkout. Recarga la página.');
    return;
  }
  const item = isSub ? plan.subscription : plan[duration];
  const amountCentavos = item.price * 100; // Culqi usa centavos

  window.Culqi.publicKey = CULQI_PUBLIC_KEY;
  window.Culqi.settings({
    title: title || 'BIMS — ' + plan.name,
    currency: 'PEN',
    description: description || (isSub ? 'Suscripción mensual' : item.period),
    amount: amountCentavos,
  });

  // El callback global window.culqi lee estos valores para la redirección y los
  // mensajes de error en el idioma correcto.
  window._culqiContext = { email, plan: planKey, isSub, duration, successUrl, errRejected, errPay, onProcessing, onError };
  window.Culqi.open({ email });
}
