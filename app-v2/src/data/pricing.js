// ─────────────────────────────────────────────────────────────────────────────
// FUENTE ÚNICA DE PRECIOS (frontend).
//
// Antes el mismo número estaba escrito a mano en seis sitios: culqi.js, los
// textos de ahorro de translations.js (duplicados en ES y EN), el enlace de
// navegación, la home legacy y el catálogo del backend. Cambiar un precio
// obligaba a acordarse de todos, y tarde o temprano se desincronizaban: el
// usuario veía un precio en la tarjeta y se le cobraba otro.
//
// A partir de aquí, TODO precio mostrado en el frontend sale de este archivo.
//
// ⚠️ EXISTE UN GEMELO EN EL BACKEND: netlify/functions/_lib/pricing.js
//    Es el que fija el monto que REALMENTE se cobra en Culqi. No pueden vivir
//    en un solo archivo porque el frontend es ESM (Vite) y las functions son
//    CommonJS con su propio bundling. Para que no se separen en silencio hay
//    un verificador: `node scripts/verificar-precios.mjs` compara ambos y falla
//    si difieren. Correrlo antes de desplegar un cambio de precios.
// ─────────────────────────────────────────────────────────────────────────────

// Tasa de IGV vigente en Perú (16% IGV + 2% IPM).
export const IGV_RATE = 0.18;

// ⚠️ LOS PRECIOS EN SOLES INCLUYEN IGV.
//
// Decisión tomada el 2026-07-30, al pasar a persona natural con negocio en
// Régimen MYPE Tributario (afecto a IGV desde el 01/08/2026): se ABSORBE el
// IGV en lugar de sumarlo al precio de lista. Es decir, el cliente sigue
// pagando S/60 y de ahí S/9.15 son IGV que se le traslada a SUNAT.
//
// Por qué se absorbió: (a) el precio nunca se validó contra el mercado, así que
// subirlo 18% antes de tener una sola conversión sería optimizar el número
// equivocado; (b) a las empresas con RUC el IGV no les cuesta (lo toman como
// crédito fiscal), y son el mejor prospecto actual; (c) al independiente sí le
// costaría, y es justo el que más duda.
//
// Además, en Perú el precio mostrado al consumidor debe ser el FINAL, con IGV
// incluido — no se puede publicar "S/60 + IGV" en la web.
export const PRECIOS_PEN = {
  individual:  { '1m': 60,  '3m': 160, '6m': 300, '12m': 596, sub: 60  },
  profesional: { '1m': 100, '3m': 268, '6m': 500, '12m': 996, sub: 100 },
};

// Precios internacionales (Lemon Squeezy, USD). NO llevan IGV: Lemon Squeezy es
// Merchant of Record — vende a su nombre, gestiona los impuestos de cada país y
// nos liquida a nosotros. Nuestro cliente es LS, no el usuario final.
// Estos valores son SOLO para mostrar: los cobra LS según su propio panel.
// NÚMEROS, no texto. Estuvieron guardados como cadenas ('16.90', '159') para
// que al mostrarlos no se perdiera el segundo decimal, pero eso convertía en
// trampa cualquier cuenta que se hiciera con ellos: '16.90' * 12 cuela, y
// '159' + algo concatena en vez de sumar, sin avisar. El formateo es cosa de la
// vista: para eso está `formatoUsd`.
export const PRECIOS_USD = {
  individual:  { monthly: 16.90, yearly: 159 },
  profesional: { monthly: 26.90, yearly: 269 },
};

/**
 * Formatea un importe en dólares para enseñarlo: dos decimales si los tiene,
 * ninguno si es redondo. 16.9 → "16.90"; 159 → "159". Es la regla que seguían
 * los valores cuando eran texto, ahora en un solo sitio.
 */
export function formatoUsd(valor) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return '';
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

// Meses de licencia que otorga cada duración.
export const MESES_POR_DURACION = { '1m': 1, '3m': 3, '6m': 6, '12m': 12 };

// Duraciones de pago único, en el orden en que se muestran.
export const DURACIONES = ['1m', '3m', '6m', '12m'];

/**
 * Separa un total (IGV incluido) en base imponible + IGV.
 *
 * Se calcula la base y el IGV se obtiene por DIFERENCIA, no redondeando cada
 * uno por separado. Así `base + igv === total` siempre, exacto al céntimo, que
 * es lo que SUNAT exige en el comprobante. Redondear ambos por separado puede
 * dejar una diferencia de un céntimo y hacer que la factura sea rechazada.
 *
 * @param {number} total Monto final que paga el cliente, en soles.
 * @returns {{ total: number, base: number, igv: number }}
 */
export function desglosarIgv(total) {
  const base = Math.round((total / (1 + IGV_RATE)) * 100) / 100;
  const igv  = Math.round((total - base) * 100) / 100;
  return { total, base, igv };
}

/** Precio total (IGV incluido) de un plan y duración. `dur` puede ser 'sub'. */
export function precioPen(plan, dur) {
  const tabla = PRECIOS_PEN[plan];
  if (!tabla) return null;
  return tabla[dur] ?? null;
}

/**
 * Equivalente mensual de una licencia de varios meses, para el texto de ahorro.
 * Se redondea a un decimal y se quita el ".0" sobrante: 50.0 → "50", 49.67 → "49.7".
 */
export function equivalenteMensual(plan, dur) {
  const total = precioPen(plan, dur);
  const meses = MESES_POR_DURACION[dur];
  if (total == null || !meses) return null;
  const v = Math.round((total / meses) * 10) / 10;
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

/** Ahorro porcentual de una duración frente a pagar mes a mes. Entero. */
export function ahorroPct(plan, dur) {
  const total   = precioPen(plan, dur);
  const mensual = precioPen(plan, '1m');
  const meses   = MESES_POR_DURACION[dur];
  if (total == null || !mensual || !meses) return 0;
  return Math.round((1 - total / meses / mensual) * 100);
}

/** Mayor descuento disponible, para la nota al pie de la sección de precios. */
export function ahorroMaximoPct() {
  let max = 0;
  for (const plan of Object.keys(PRECIOS_PEN))
    for (const dur of DURACIONES) max = Math.max(max, ahorroPct(plan, dur));
  return max;
}

/**
 * Mayor descuento del PAGO INTERNACIONAL: anual frente a doce mensualidades.
 *
 * Existe aparte de `ahorroMaximoPct` porque las dos ofertas no se parecen. En
 * soles se venden cuatro duraciones (1/3/6/12 meses) y el mejor descuento ronda
 * el 17 %; Lemon Squeezy solo tiene mensual y anual, y ahí el anual de
 * Individual baja un 22 %. La nota al pie de Precios anunciaba a TODO el mundo
 * las cuatro duraciones y el porcentaje en soles, así que a quien compraba
 * fuera de Perú se le prometían opciones que su checkout no tiene y un
 * descuento que no era el suyo.
 */
export function ahorroMaximoPctUsd() {
  let max = 0;
  for (const plan of Object.keys(PRECIOS_USD)) {
    const mensual = PRECIOS_USD[plan].monthly;
    const anual   = PRECIOS_USD[plan].yearly;
    if (!mensual || !anual) continue;
    max = Math.max(max, Math.round((1 - anual / (mensual * 12)) * 100));
  }
  return max;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRECIO DE LISTA — SOLO VITRINA, NUNCA SE COBRA.
//
// Es el número TACHADO que se enseña al lado del precio real. No entra en
// ningún cobro: el importe que se cobra sale de PRECIOS_PEN / PRECIOS_USD y lo
// recalcula el servidor, así que este bloque no puede desincronizar un cargo.
// Por eso vive aquí y NO en netlify/functions/_lib/pricing.js: el backend no
// tiene por qué conocer un número que no cobra.
//
// LA BASE ES S/120 AL MES. De ahí sale todo lo demás, en vez de escribir doce
// números a mano que se contradirían al primer cambio de tarifa:
//
//   factor        = 120 / mensual de Individual (hoy S/60) = 2
//   lista mensual = mensual del plan × factor    (Individual 120, Profesional 200)
//   lista de N meses = lista mensual × N         (sin descuento por duración:
//                      el ahorro por comprar largo es justamente lo que se
//                      quiere enseñar)
//
// Si mañana cambia una tarifa, el tachado se recalcula solo y mantiene la misma
// proporción. Si se quiere otra base, se toca SOLO la constante de abajo.
//
// ⚠️ Un precio de referencia tachado debe corresponder a un precio real de
//    lista del producto. Quien publica es el titular del negocio.
export const PRECIO_LISTA_BASE_PEN = 120;

/** Cuántas veces el precio de lista es mayor que el precio real. */
export const FACTOR_LISTA = PRECIO_LISTA_BASE_PEN / PRECIOS_PEN.individual['1m'];

/** Precio de lista mensual de un plan, en soles. Redondeado a sol entero. */
export function precioListaMensualPen(plan) {
  const mensual = precioPen(plan, '1m');
  if (mensual == null) return null;
  return Math.round(mensual * FACTOR_LISTA);
}

/**
 * Precio de lista tachado de un plan y duración, en soles.
 * `dur` puede ser 'sub' (suscripción), que se compara contra el mensual.
 */
export function precioListaPen(plan, dur) {
  const mensual = precioListaMensualPen(plan);
  if (mensual == null) return null;
  if (dur === 'sub') return mensual;
  const meses = MESES_POR_DURACION[dur];
  return meses ? mensual * meses : null;
}

/**
 * Precio de lista tachado en dólares. Mismo criterio que en soles: el factor
 * sobre el mensual, y el anual son doce mensualidades de lista.
 * `ciclo` es 'monthly' o 'yearly'.
 */
export function precioListaUsd(plan, ciclo) {
  const tabla = PRECIOS_USD[plan];
  if (!tabla?.monthly) return null;
  const mensual = Math.round(tabla.monthly * FACTOR_LISTA * 100) / 100;
  return ciclo === 'yearly' ? Math.round(mensual * 12 * 100) / 100 : mensual;
}

/** Descuento que enseña el tachado, en entero. 0 si no hay precio de lista. */
export function descuentoListaPct(plan, dur) {
  const lista = precioListaPen(plan, dur);
  const real  = precioPen(plan, dur);
  if (!lista || real == null) return 0;
  return Math.round((1 - real / lista) * 100);
}

/** Precio "desde" de un plan (el mensual), para tarjetas y navegación. */
export function precioDesde(plan) {
  return precioPen(plan, '1m');
}
