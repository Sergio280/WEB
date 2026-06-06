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
