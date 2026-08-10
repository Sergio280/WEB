// Helper único de analítica. Envía el mismo evento a GA4 (gtag) y a Clarity
// si están disponibles. Centraliza el embudo para no repetir el typeof check.
//
// Eventos del embudo (mismos nombres que ya usa GA4 en la home actual):
//   hero_cta_click · view_pricing · select_plan · begin_checkout ·
//   download_click · video_play · clip_play · faq_click · whatsapp_click ·
//   trial_signup · trial_activated
export function track(event, params = {}) {
  try {
    if (typeof window.gtag === 'function') window.gtag('event', event, params);
    if (typeof window.clarity === 'function') window.clarity('event', event);
  } catch {
    /* nunca romper la UI por analítica */
  }
}

// Plazo máximo de espera antes de navegar, en ms. Corto a propósito: es tiempo
// que el usuario pasa mirando un botón que ya pulsó.
const PLAZO_ENVIO = 300;

/**
 * Dispara un evento y NAVEGA cuando ya se ha enviado — o al vencer un plazo
 * corto, lo que ocurra primero.
 *
 * POR QUÉ HACE FALTA
 * Varios de los eventos más valiosos del embudo se disparan justo antes de
 * abandonar la página: `trial_signup` y `trial_activated` antes de ir a la
 * página de bienvenida, `begin_checkout` antes de saltar a Lemon Squeezy,
 * `lang_switch` antes de cambiar de landing. Con `track()` a secas, el evento
 * queda a merced de que la petición salga antes de que el navegador tire la
 * página: GA4 usa sendBeacon y suele llegar, pero Clarity encola el evento y lo
 * sube en su propio momento, así que ahí se pierde con facilidad.
 *
 * Y no es teórico para el idioma: `toggleLang` antes solo cambiaba el estado de
 * React —sin navegar— así que `lang_switch` se registraba siempre. Al pasar el
 * cambio de idioma a una navegación real (cada idioma es ahora su propia
 * página), el evento quedó expuesto.
 *
 * GA4 avisa del envío con `event_callback`; `event_timeout` es su propia red de
 * seguridad, y el temporizador de aquí cubre el caso de que gtag esté bloqueado
 * por una extensión y el callback no llegue nunca.
 *
 * @param {string} event
 * @param {object} params
 * @param {() => void} navegar Lo que hay que hacer DESPUÉS de enviar.
 */
export function trackYNavegar(event, params, navegar) {
  let yaFue = false;
  const seguir = () => {
    if (yaFue) return;
    yaFue = true;
    navegar();
  };

  const plazo = setTimeout(seguir, PLAZO_ENVIO);

  try {
    // Clarity primero: solo encola, no bloquea.
    if (typeof window.clarity === 'function') window.clarity('event', event);

    if (typeof window.gtag === 'function') {
      window.gtag('event', event, {
        ...params,
        event_callback: () => {
          clearTimeout(plazo);
          seguir();
        },
        event_timeout: PLAZO_ENVIO,
      });
    } else {
      clearTimeout(plazo);
      seguir();
    }
  } catch {
    // La analítica no puede impedir que el usuario llegue a donde iba.
    clearTimeout(plazo);
    seguir();
  }
}
