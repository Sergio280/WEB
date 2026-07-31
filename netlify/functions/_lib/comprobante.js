// ─────────────────────────────────────────────────────────────────────────────
// Datos del comprobante de pago (backend).
//
// Gemelo CommonJS de app-v2/src/lib/comprobante.js. Existe por separado porque
// la validación del navegador NO es una garantía: cualquiera puede llamar a
// /api/culqi-charge directamente con un RUC inventado. Lo que se guarda para
// emitir el comprobante tiene que validarse aquí.
//
// `scripts/verificar-precios.mjs` comprueba que ambas implementaciones den el
// mismo veredicto sobre una batería de casos, para que no se separen.
// ─────────────────────────────────────────────────────────────────────────────

// Monto desde el cual SUNAT exige identificar al comprador en una boleta.
const UMBRAL_DNI_BOLETA = 700;

/**
 * Valida un RUC peruano: 11 dígitos, tipo de contribuyente conocido y dígito
 * verificador correcto (módulo 11). Ver el gemelo del frontend para el porqué
 * de validar el dígito verificador y no solo la longitud.
 */
function rucValido(ruc) {
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
function dniValido(dni) {
    return /^\d{8}$/.test(String(dni || '').trim());
}

/**
 * Valida y normaliza los datos de comprobante que llegan del checkout.
 *
 * Es tolerante a propósito: si no vienen datos, devuelve `{ ok:true, datos:null }`
 * en lugar de rechazar el cobro. Un pago legítimo NO debe fallar porque falte
 * el dato fiscal — se cobra igual y el comprobante se emite después con lo que
 * haya. Lo que sí se rechaza es un dato PRESENTE pero INVÁLIDO, porque
 * guardarlo produciría un comprobante emitido a un contribuyente equivocado.
 *
 * @param {object|null|undefined} entrada  Lo que mandó el cliente.
 * @param {number} totalSoles              Monto de la operación.
 * @returns {{ ok:boolean, error?:string, datos?:object|null }}
 */
function validarComprobante(entrada, totalSoles) {
    if (!entrada || typeof entrada !== 'object') return { ok: true, datos: null };

    const tipo = entrada.tipo === 'factura' ? 'factura' : 'boleta';
    const doc = String(entrada.docNumero || '').trim();
    const razon = String(entrada.razonSocial || '').trim().slice(0, 200);

    if (tipo === 'factura') {
        if (!rucValido(doc)) return { ok: false, error: 'RUC inválido' };
        if (razon.length < 3) return { ok: false, error: 'Razón social requerida para factura' };
        return { ok: true, datos: { tipo, docTipo: 'RUC', docNumero: doc, razonSocial: razon } };
    }

    if (!doc) {
        // Sin DNI: aceptable solo por debajo del umbral. Por encima se avisa,
        // pero tampoco se bloquea el cobro (ver nota de arriba): se deja
        // constancia para que quien emita el comprobante lo pida después.
        if (totalSoles >= UMBRAL_DNI_BOLETA)
            return { ok: true, datos: { tipo, docTipo: null, docNumero: null, razonSocial: razon || null, faltaDni: true } };
        return { ok: true, datos: null };
    }

    if (!dniValido(doc)) return { ok: false, error: 'DNI inválido' };
    return { ok: true, datos: { tipo, docTipo: 'DNI', docNumero: doc, razonSocial: razon || null } };
}

module.exports = { UMBRAL_DNI_BOLETA, rucValido, dniValido, validarComprobante };
