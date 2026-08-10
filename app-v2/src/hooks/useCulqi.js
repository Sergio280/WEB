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
        // Antes esto solo hacía console.warn y salía: el botón de la web se
        // quedaba en «Procesando…» (deshabilitado) para siempre y el usuario no
        // veía NINGÚN motivo. Volvía, pulsaba «Pagar» y no pasaba nada — es uno
        // de los dead clicks que salen en las grabaciones de Clarity.
        // Culqi manda el motivo en user_message (texto para el comprador) y
        // merchant_message (texto técnico); se prefiere el primero.
        const e = window.Culqi.error;
        console.warn('[Culqi] Error/cancelado:', e);
        if (ctx.onError) ctx.onError(e.user_message || e.merchant_message || ctx.errRejected || 'No se pudo procesar la tarjeta.');
        return;
      }
      // Sin token no hay nada que cobrar (el usuario cerró el formulario). Se
      // rearma el botón para que pueda volver a intentarlo.
      if (!window.Culqi.token) {
        if (ctx.onCancel) ctx.onCancel();
        return;
      }

      const token_id = window.Culqi.token.id;
      const email = ctx.email;
      const isSub = ctx.isSub;
      // Se avisa ANTES de cerrar el iframe: al cerrarlo, la web detecta que el
      // widget desapareció y rearma el botón de pagar (para el caso de que el
      // usuario lo cierre sin pagar). Aquí sí hay cobro en marcha, así que hay
      // que marcarlo primero o el botón parpadearía a «Pagar» durante la
      // confirmación.
      if (ctx.onProcessing) ctx.onProcessing();
      window.Culqi.close();

      const endpoint = isSub ? '/api/culqi-subscription' : '/api/culqi-charge';
      // `comprobante` lleva los datos fiscales del comprador (RUC/DNI + razón
      // social) para poder emitir factura o boleta. Va también en suscripciones.
      const body = isSub
        ? { token_id, email, plan: ctx.plan, comprobante: ctx.comprobante }
        : { token_id, email, plan: ctx.plan, duration: ctx.duration, comprobante: ctx.comprobante, codigo: ctx.codigo };

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
  comprobante,
  codigo,
  precio,
  title,
  description,
  successUrl,
  errLoad,
  errRejected,
  errPay,
  onProcessing,
  onError,
  onCancel,
}) {
  const plan = CULQI_CONFIG.plans[planKey];
  if (!plan || !window.Culqi) {
    if (onError) onError(errLoad || 'No se pudo cargar el checkout. Recarga la página.');
    return;
  }
  const item = isSub ? plan.subscription : plan[duration];
  // `precio` llega con la promoción ya aplicada (si la hay) para que el widget
  // de Culqi enseñe el mismo importe que se va a cobrar. Sin esto, el cliente
  // vería S/60 en el formulario de tarjeta y se le cobrarían S/40: aunque le
  // favorezca, es una discrepancia que destruye la confianza en el checkout.
  // El importe REAL lo recalcula el servidor; esto es solo la vitrina.
  const amountCentavos = Math.round((precio ?? item.price) * 100); // Culqi usa centavos

  window.Culqi.publicKey = CULQI_PUBLIC_KEY;
  window.Culqi.settings({
    title: title || 'BIMS — ' + plan.name,
    currency: 'PEN',
    description: description || (isSub ? 'Suscripción mensual' : item.period),
    amount: amountCentavos,
  });

  // El callback global window.culqi lee estos valores para la redirección y los
  // mensajes de error en el idioma correcto.
  window._culqiContext = { email, plan: planKey, isSub, duration, comprobante, codigo, successUrl, errRejected, errPay, onProcessing, onError, onCancel };
  window.Culqi.open({ email });
}
