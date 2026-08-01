// ─────────────────────────────────────────────────────────────────────────────
// Promoción por enlace: bimsaddin.com/?promo=CODIGO
//
// Se eligió el parámetro de URL en vez de un campo «tengo un cupón» porque los
// códigos se reparten uno a uno: se manda el enlace y el cliente ve ya el precio
// rebajado, sin nada que teclear ni que explicar. Un campo visible además invita
// a buscar cupones por internet y abandonar el checkout al no encontrarlos.
//
// El código se guarda en sessionStorage para que sobreviva a la navegación por
// la página (el visitante llega al enlace, se pasea, y compra diez minutos
// después). No se usa localStorage a propósito: no queremos que una promoción
// siga aplicándose semanas más tarde en visitas nuevas.
//
// ⚠️ Aquí NO se decide ningún precio. Este módulo solo pregunta al servidor
// cuánto costaría, para poder enseñarlo. El importe real lo fija culqi-charge.
// ─────────────────────────────────────────────────────────────────────────────

const CLAVE = 'bims_promo';

/** Lee ?promo= de la URL, lo memoriza para la sesión y lo devuelve. */
export function leerPromo() {
  try {
    const url = new URLSearchParams(window.location.search).get('promo');
    if (url) {
      const c = url.trim().toUpperCase().slice(0, 40);
      sessionStorage.setItem(CLAVE, c);
      return c;
    }
    return sessionStorage.getItem(CLAVE) || null;
  } catch {
    // Navegación privada muy restrictiva puede bloquear sessionStorage: en ese
    // caso la promoción vale solo mientras dure la página, que es aceptable.
    try {
      return new URLSearchParams(window.location.search).get('promo');
    } catch {
      return null;
    }
  }
}

/**
 * Pregunta al servidor el precio con el código aplicado.
 * @returns {Promise<null | { total, totalOriginal, ahorro }>} null si no aplica.
 */
export async function consultarPromo({ codigo, plan, duration }) {
  if (!codigo) return null;
  try {
    const r = await fetch('/api/validar-descuento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo, plan, duration }),
    });
    if (!r.ok) return null;
    const d = await r.json();
    if (!d.valido) return null;
    return { total: d.total, totalOriginal: d.totalOriginal, ahorro: d.ahorro };
  } catch {
    // Sin red o con el endpoint caído no se aplica descuento y se muestra el
    // precio de lista. Nunca se bloquea la compra por esto.
    return null;
  }
}
