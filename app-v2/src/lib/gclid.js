// Captura y persistencia del gclid (Google Click ID) que Google Ads agrega a la
// URL al hacer clic en un anuncio (?gclid=...). También cubre gbraid/wbraid
// (variantes para iOS/web sin cookies).
//
// Lo guardamos en localStorage al aterrizar y lo leemos al enviar el formulario
// de trial. Así el id sobrevive aunque el usuario navegue entre páginas (landing
// → sección de trial) antes de registrarse. El backend lo guarda en trialMeta y
// la función report-activations lo usa para atribuir la ACTIVACIÓN real como
// conversión offline en Google Ads.

const KEY = 'bims_gclid';
const TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 días: ventana de conversión de Google

// Lee el gclid de la URL actual y, si existe, lo persiste con timestamp.
// Idempotente: llamar en cada carga de página no hace daño.
export function captureGclid() {
  try {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('gclid') || params.get('gbraid') || params.get('wbraid');
    if (id && /^[A-Za-z0-9._-]+$/.test(id)) {
      localStorage.setItem(KEY, JSON.stringify({ id, at: Date.now() }));
    }
  } catch {
    /* localStorage puede fallar en modo privado; no rompemos la UI */
  }
}

// Devuelve el gclid guardado si no ha expirado, o '' si no hay/expiró.
export function getStoredGclid() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return '';
    const { id, at } = JSON.parse(raw);
    if (!id || !at || Date.now() - at > TTL_MS) return '';
    return id;
  } catch {
    return '';
  }
}
