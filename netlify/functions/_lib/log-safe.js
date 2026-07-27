// ── _lib/log-safe.js ─────────────────────────────────────────────────────────
// Utilidades transversales de las funciones: enmascarado de PII para logs y
// aritmética de fechas sin desbordamiento de mes.
//
// POR QUÉ EXISTE: create-trial-license.js ya enmascaraba emails con su propia
// copia de esta función, pero el resto de funciones (culqi-*, lemonsqueezy-*,
// admin-create-license, provision-license) escribía el email COMPLETO en los
// logs de Netlify. Centralizarlo aquí evita que la política dependa de que cada
// archivo recuerde aplicarla.
// ─────────────────────────────────────────────────────────────────────────────

// Enmascara un email para logs: "juan.perez@gmail.com" → "ju***z@gmail.com".
// Conserva el dominio (útil para depurar) y lo justo del local-part para
// correlacionar dos líneas del mismo usuario, sin exponer la dirección.
function maskEmail(email) {
    if (!email || typeof email !== 'string') return '***';
    const at = email.indexOf('@');
    if (at < 2) return '***@***';
    const local = email.slice(0, at);
    const dom   = email.slice(at + 1);
    const masked = local.length <= 3
        ? local[0] + '**'
        : local.slice(0, 2) + '***' + local.slice(-1);
    return masked + '@' + dom;
}

// Suma meses a una fecha SIN el desbordamiento de Date.setMonth().
//
// El problema: new Date('2026-01-31').setMonth(getMonth() + 1) da el 3 de MARZO,
// porque "31 de febrero" no existe y JS lo normaliza hacia adelante. Toda compra
// hecha un día 29-31 regalaba 1-3 días de licencia.
//
// Aquí, si el día original no existe en el mes destino, se ancla al ÚLTIMO día
// de ese mes (31 ene + 1 mes = 28/29 feb), que es el comportamiento que espera
// cualquiera que compre una licencia mensual.
function addMonths(date, months) {
    const d = new Date(date.getTime());
    const day = d.getDate();
    d.setDate(1);                       // evita el desbordamiento al mover el mes
    d.setMonth(d.getMonth() + months);
    // Último día del mes destino: día 0 del mes siguiente.
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, lastDay));
    return d;
}

module.exports = { maskEmail, addMonths };
