// ── _lib/version-gate.js ─────────────────────────────────────────────────────
// CIERRE A LAS VERSIONES ANTIGUAS DEL PLUGIN para las PRUEBAS gratuitas.
//
// ⚠️ POR QUÉ HACÍA FALTA
//   El control de «una prueba por equipo» (hardware-ledger.js) vive en el inicio
//   de sesión de la 1.2.x. Un plugin 1.1.x NUNCA reclama el equipo, así que usar
//   un instalador viejo es hoy la forma de saltárselo. Medido el 16-sep-2026: el
//   equipo DESKTOP-ESRA6P4 estrenó TRES pruebas con correos desechables
//   (prodbits, liondapt, jobscai), las dos últimas en días consecutivos, todas
//   desde la v1.1.8, y ninguna aparece en el ledger.
//
// ⚠️ POR QUÉ SE DECIDE AQUÍ (telemetría) Y NO EN verify-license
//   verify-license no recibe la versión del cliente. La única señal de versión
//   que ya existe en producción, y que manda también la 1.1.8, es /api/usage.
//   Y se DESACTIVA la licencia en vez de solo rechazar el veredicto porque el
//   plugin tiene DOS caminos de verificación: el veredicto firmado y el
//   verificador clásico que lee users_v2 directamente. Los dos respetan
//   isActive; solo uno pasaría por un rechazo en verify-license.
//
// ⚠️ LA GUARDA QUE HACE ESTO SEGURO: EL LEDGER
//   /api/usage NO está autenticado y el repositorio es público. Si bastara con
//   mandar {uid, ver:"1.0"} para desactivar una prueba, cualquiera que conociera
//   un uid podría tumbarle la prueba a otro.
//
//   Por eso solo se actúa si la cuenta NUNCA ha reclamado un equipo en el ledger.
//   Ese reclamo solo lo escribe /api/claim-hardware, con el uid sacado del TOKEN
//   VERIFICADO —nunca del cuerpo—, y solo lo hace la 1.2.x al iniciar sesión.
//   Un usuario real en 1.2.x SIEMPRE tiene reclamo (medido: 6 de 6), así que una
//   versión falsificada no puede desactivarlo. Y un cliente 1.1.x nunca lo tiene.
//
// Alcance deliberado:
//   · Solo PRUEBAS. Las licencias de pago no se tocan: se gestionan a mano.
//   · Nunca las cuentas internas de Sergio.
//   · Si el ledger está apagado ('off'), no hay guarda fiable → no se actúa.
//   · FAIL-OPEN: cualquier fallo de lectura → no se desactiva nada.
//
// Modos (en caliente, config/trial_caps/versionGate), mismo patrón que el ledger:
//   'off'     → no evalúa.
//   'log'     → evalúa y registra en el log, pero no desactiva.
//   'enforce' → desactiva. ← modo inicial.
// ─────────────────────────────────────────────────────────────────────────────

const VERSION_MINIMA = [1, 2, 0];
const CONFIG_PATH = 'config/trial_caps/versionGate';
const LEDGER_MODE_PATH = 'config/trial_caps/hardwareLedger';
const LEDGER_PATH = 'trial_hardware_ledger';
const DEFAULT_MODE = 'enforce';
const VALID_MODES = new Set(['off', 'log', 'enforce']);

// Cuentas internas de pruebas de Sergio: mismo criterio que los scripts de correo.
const INTERNAS = /^(alejoszapat|salejoszap|bimsaddin|soporte|sergioalejosz)/i;

/**
 * Compara una versión "1.1.8.0" con la mínima.
 * @returns {-1|0|1|null} null si la versión no se puede leer: ante la duda no se decide.
 */
function compararConMinima(ver) {
    const partes = String(ver || '').trim().split('.');
    if (partes.length < 2) return null;
    const n = partes.map(p => (/^\d+$/.test(p) ? parseInt(p, 10) : NaN));
    if (n.some(isNaN)) return null;
    for (let i = 0; i < VERSION_MINIMA.length; i++) {
        const a = n[i] || 0;
        const b = VERSION_MINIMA[i];
        if (a !== b) return a < b ? -1 : 1;
    }
    return 0;
}

async function leerModo(db, ruta, porDefecto) {
    try {
        const v = (await db.ref(ruta).once('value')).val();
        return VALID_MODES.has(v) ? v : porDefecto;
    } catch {
        return null;   // null = no se pudo leer → el llamador no actúa
    }
}

/**
 * ¿Ha reclamado esta cuenta algún equipo en el ledger?
 * @returns {boolean|null} null si no se pudo leer (fail-open: no actuar).
 */
async function tieneReclamoDeEquipo(db, uid) {
    try {
        const ledger = (await db.ref(LEDGER_PATH).once('value')).val() || {};
        for (const nodo of Object.values(ledger)) {
            if (nodo && nodo.uids && Object.prototype.hasOwnProperty.call(nodo.uids, uid)) return true;
            if (nodo && nodo.firstUid === uid) return true;
        }
        return false;
    } catch {
        return null;
    }
}

/**
 * Evalúa un evento de telemetría y, si corresponde, desactiva la prueba.
 * Nunca lanza: el llamador es la telemetría, que no debe romperse por esto.
 *
 * @returns {{ accion: string, motivo?: string }}
 *   accion: 'nada' | 'registrado' | 'desactivado'
 */
async function evaluarVersion(db, { uid, ver, lic }) {
    try {
        if (!uid || !ver) return { accion: 'nada', motivo: 'sin-datos' };
        if (lic !== 'Trial') return { accion: 'nada', motivo: 'no-es-prueba' };

        const cmp = compararConMinima(ver);
        if (cmp === null) return { accion: 'nada', motivo: 'version-ilegible' };
        if (cmp >= 0) return { accion: 'nada', motivo: 'version-al-dia' };

        const modo = await leerModo(db, CONFIG_PATH, DEFAULT_MODE);
        if (modo === null || modo === 'off') return { accion: 'nada', motivo: 'gate-apagado' };

        // Sin ledger activo no hay forma de distinguir un cliente viejo real de una
        // versión falsificada: no se actúa.
        const modoLedger = await leerModo(db, LEDGER_MODE_PATH, 'enforce');
        if (modoLedger === null || modoLedger === 'off') return { accion: 'nada', motivo: 'ledger-apagado' };

        const snap = await db.ref(`users_v2/${uid}`).once('value');
        const u = snap.val();
        if (!u) return { accion: 'nada', motivo: 'sin-registro' };

        const email = String(u.email || u.Email || '');
        if (INTERNAS.test(email)) return { accion: 'nada', motivo: 'cuenta-interna' };

        const activa = u.isActive !== false && u.IsActive !== false;
        if (!activa) return { accion: 'nada', motivo: 'ya-inactiva' };

        // Se relee el tipo del propio registro: la telemetría lo resolvió antes,
        // pero la decisión de desactivar no debe apoyarse en un dato de paso.
        const tipo = u.licenseType || u.LicenseType;
        if (tipo !== 'Trial') return { accion: 'nada', motivo: 'no-es-prueba' };

        const reclamo = await tieneReclamoDeEquipo(db, uid);
        if (reclamo === null) return { accion: 'nada', motivo: 'ledger-ilegible' };
        if (reclamo) {
            // Un cliente 1.2.x reclama equipo al iniciar sesión. Si esta cuenta lo
            // tiene y aun así llega una versión antigua, lo más probable es una
            // telemetría falsificada: se registra y NO se desactiva.
            console.warn(`[version-gate] uid=${uid} reporta v${ver} pero tiene reclamo de equipo: se ignora (posible telemetría falsa)`);
            return { accion: 'nada', motivo: 'tiene-reclamo' };
        }

        if (modo === 'log') {
            console.log(`[version-gate] (log) desactivaría uid=${uid} v${ver}`);
            return { accion: 'registrado', motivo: 'modo-log' };
        }

        // Mismo efecto que desactivar desde el panel: isActive en las dos grafías y
        // las activaciones borradas, en un único update atómico. Se deja constancia
        // del motivo para que el panel y soporte sepan por qué se desactivó.
        await db.ref(`users_v2/${uid}`).update({
            isActive: false,
            IsActive: false,
            activations: null,
            bloqueoVersion: {
                motivo: 'version_antigua',
                version: ver,
                minima: VERSION_MINIMA.join('.'),
                at: new Date().toISOString(),
            },
        });
        console.log(`[version-gate] DESACTIVADA prueba uid=${uid} por v${ver} < ${VERSION_MINIMA.join('.')}`);
        return { accion: 'desactivado', motivo: 'version_antigua' };
    } catch (e) {
        console.warn('[version-gate] fallo (fail-open, no se desactiva):', e.message);
        return { accion: 'nada', motivo: 'error' };
    }
}

module.exports = { evaluarVersion, compararConMinima, VERSION_MINIMA };
