// ─────────────────────────────────────────────────────────────────────────────
// Datos del comprobante de pago (frontend).
//
// Desde el 01/08/2026 BIMS emite comprobantes electrónicos, así que el checkout
// tiene que capturar a quién se le factura. Antes solo pedía el email, con lo
// cual una venta a una constructora era incobrable en la práctica: sin RUC y
// razón social no se puede emitir la factura que su área de compras exige.
//
// Reglas que implementa este módulo:
//   • FACTURA → RUC (11 dígitos, con dígito verificador válido) + razón social.
//   • BOLETA  → DNI (8 dígitos). Obligatorio solo a partir de S/700, que es el
//     umbral desde el cual SUNAT exige identificar al comprador en una boleta.
//
// ⚠️ GEMELO EN EL BACKEND: netlify/functions/_lib/comprobante.js
//    Estas validaciones se repiten en el servidor porque el cliente NO es de
//    fiar: cualquiera puede saltarse el formulario y llamar a la función
//    directamente. `scripts/verificar-precios.mjs` comprueba que ambas
//    implementaciones den el mismo veredicto sobre una batería de casos.
// ─────────────────────────────────────────────────────────────────────────────

// Monto desde el cual SUNAT exige identificar al comprador en una boleta.
export const UMBRAL_DNI_BOLETA = 700;

/**
 * Valida un RUC peruano: 11 dígitos, tipo de contribuyente conocido y dígito
 * verificador correcto (módulo 11).
 *
 * Se valida el dígito verificador y no solo la longitud porque un RUC mal
 * tecleado que "parece" válido produce una factura emitida a un contribuyente
 * equivocado — y eso se corrige con nota de crédito, no borrando.
 *
 * Los dos primeros dígitos indican el tipo: 10 y 15 personas naturales,
 * 17 sucesiones/otros, 20 personas jurídicas.
 */
export function rucValido(ruc) {
  const v = String(ruc || '').trim();
  if (!/^\d{11}$/.test(v)) return false;
  if (!['10', '15', '17', '20'].includes(v.slice(0, 2))) return false;

  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let suma = 0;
  for (let i = 0; i < 10; i++) suma += Number(v[i]) * pesos[i];

  let esperado = 11 - (suma % 11);
  if (esperado === 10) esperado = 0;
  if (esperado === 11) esperado = 1;

  return esperado === Number(v[10]);
}

/** Valida un DNI peruano: exactamente 8 dígitos. */
export function dniValido(dni) {
  return /^\d{8}$/.test(String(dni || '').trim());
}

/**
 * Valida el bloque completo de datos del comprobante para un monto dado.
 *
 * @param {{ tipo:'boleta'|'factura', doc:string, razonSocial:string }} datos
 * @param {number} total Monto de la operación en soles (define si el DNI es obligatorio).
 * @returns {{ ok:boolean, campo?:'doc'|'razonSocial', motivo?:string }}
 *          `campo` indica dónde marcar el error; `motivo` es una CLAVE, no un
 *          texto: el mensaje visible lo pone la capa de idioma.
 */
export function validarComprobante(datos, total) {
  const tipo = datos?.tipo === 'factura' ? 'factura' : 'boleta';
  const doc = String(datos?.doc || '').trim();
  const razon = String(datos?.razonSocial || '').trim();

  if (tipo === 'factura') {
    if (!rucValido(doc)) return { ok: false, campo: 'doc', motivo: 'rucInvalido' };
    if (razon.length < 3) return { ok: false, campo: 'razonSocial', motivo: 'razonRequerida' };
    return { ok: true };
  }

  // Boleta: el DNI solo es obligatorio a partir del umbral. Por debajo se
  // permite dejarlo vacío para no añadir fricción en las compras pequeñas.
  if (!doc && total < UMBRAL_DNI_BOLETA) return { ok: true };
  if (!dniValido(doc)) return { ok: false, campo: 'doc', motivo: 'dniInvalido' };
  return { ok: true };
}

/**
 * Normaliza los datos para enviarlos al backend. Devuelve null si no hay nada
 * que enviar (boleta sin DNI en una compra pequeña).
 */
export function normalizarComprobante(datos) {
  const tipo = datos?.tipo === 'factura' ? 'factura' : 'boleta';
  const doc = String(datos?.doc || '').trim();
  const razon = String(datos?.razonSocial || '').trim();
  if (!doc && tipo === 'boleta') return null;
  return {
    tipo,
    docTipo: tipo === 'factura' ? 'RUC' : 'DNI',
    docNumero: doc,
    razonSocial: tipo === 'factura' ? razon : razon || null,
  };
}
