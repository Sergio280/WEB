// ── _lib/hardware-ledger.js ──────────────────────────────────────────────────
// LEDGER DE HARDWARE: registra qué máquinas ya han estrenado un trial, para
// detectar (y opcionalmente frenar) el reciclaje de trials en el mismo equipo.
//
// ⚠️ POR QUÉ VIVE EN LA ACTIVACIÓN Y NO EN LA CREACIÓN DEL TRIAL
//   Medido el 2026-08-23 sobre las 40 cuentas reales: 27 altas nacen en
//   `web-form` y solo 6 en `plugin`. Un navegador NO puede calcular el hardware
//   ID (MachineGuid del registro + serial de volumen por P/Invoke), así que un
//   límite aplicado al crear el trial cubriría como mucho el 15 % de las altas
//   y se esquivaría registrándose por la web. En cambio, TODO trial que llegue
//   a usarse pasa por la activación de hardware → ese es el cuello real.
//
// ⚠️ FAIL-OPEN POR DISEÑO
//   Si la RTDB falla, se PERMITE. Disponibilidad > cumplimiento perfecto: la
//   misma doctrina que `checkIpRateLimit` en trial-abuse.js. Nunca se debe
//   dejar a un cliente de pago sin trabajar por un fallo de este módulo.
//
// Modos (leídos en caliente de config/trial_caps/hardwareLedger):
//   'off'     → ni se registra.
//   'log'     → registra y avisa, pero SIEMPRE permite.
//   'enforce' → deniega el segundo uid distinto en la misma máquina. ← modo inicial.
// Si una máquina se bloquea por error (PC compartido, cambio de correo), el admin
// la libera desde el panel: eso pone `released:true` y el siguiente inicio de
// sesión vuelve a reclamarla como nueva.
// El modo se cambia desde el AdminPanel sin recompilar ni redesplegar nada.
// ─────────────────────────────────────────────────────────────────────────────

const crypto = require('crypto');

const LEDGER_PATH  = 'trial_hardware_ledger';
const CONFIG_PATH  = 'config/trial_caps/hardwareLedger';
const DEFAULT_MODE = 'enforce';
const VALID_MODES  = new Set(['off', 'log', 'enforce']);

// El hardwareId que manda el plugin ya es un SHA-256, pero se vuelve a hashear
// con sal para que la clave del ledger no sea correlacionable con los ids que
// cuelgan de users_v2/{uid}/activations si alguien consiguiera lectura parcial.
function hashHardware(hardwareId) {
    const salt = process.env.IP_SALT || 'bims-trial-default-salt';
    return crypto.createHash('sha256')
        .update(String(hardwareId).trim().toLowerCase() + salt)
        .digest('hex').slice(0, 24);
}

// Modo activo. Ante cualquier duda devuelve el default (no endurece solo).
async function readMode(db) {
    try {
        const snap = await db.ref(CONFIG_PATH).once('value');
        const val  = snap.val();
        return VALID_MODES.has(val) ? val : DEFAULT_MODE;
    } catch (e) {
        console.warn('[hw-ledger] no se pudo leer el modo (usando default):', e.message);
        return DEFAULT_MODE;
    }
}

/**
 * Reclama una máquina para un uid, en transacción atómica.
 *
 * @returns {{ known:boolean, reused:boolean, firstUid:string|null,
 *             firstAt:number|null, count:number, error:boolean }}
 *   reused=true → esta máquina ya estrenó trial bajo OTRO uid.
 *   error=true  → la RTDB falló; el llamador debe permitir (fail-open).
 */
async function claimHardware(db, hwHash, uid, meta = {}) {
    const ref   = db.ref(`${LEDGER_PATH}/${hwHash}`);
    const nowMs = Date.now();
    let reused = false, known = false, firstUid = null, firstAt = null, count = 1;

    try {
        await ref.transaction(current => {
            if (!current) {
                // Primera vez que se ve esta máquina.
                return {
                    firstUid:    uid,
                    firstAt:     nowMs,
                    lastAt:      nowMs,
                    count:       1,
                    machineName: meta.machineName || '',
                    uids:        { [uid]: nowMs },
                    released:    false,
                };
            }

            known    = true;
            firstUid = current.firstUid || null;
            firstAt  = current.firstAt  || null;

            // El admin puede "liberar" una máquina desde el panel (released=true):
            // se trata como si fuera nueva y se reinicia el ledger para ese uid.
            if (current.released) {
                return {
                    firstUid:    uid,
                    firstAt:     nowMs,
                    lastAt:      nowMs,
                    count:       1,
                    machineName: meta.machineName || current.machineName || '',
                    uids:        { [uid]: nowMs },
                    released:    false,
                };
            }

            const uids = current.uids || {};
            // Mismo usuario volviendo a activar: no es reciclaje, solo refresco.
            if (uids[uid] || current.firstUid === uid) {
                count = current.count || Object.keys(uids).length || 1;
                return { ...current, lastAt: nowMs, uids: { ...uids, [uid]: uids[uid] || nowMs } };
            }

            // Un uid DISTINTO estrenando trial en una máquina ya conocida.
            reused = true;
            count  = Object.keys(uids).length + 1;
            return {
                ...current,
                lastAt:      nowMs,
                count,
                machineName: current.machineName || meta.machineName || '',
                uids:        { ...uids, [uid]: nowMs },
            };
        });
    } catch (e) {
        console.warn('[hw-ledger] transacción falló (fail-open):', e.message);
        return { known: false, reused: false, firstUid: null, firstAt: null, count: 0, error: true };
    }

    return { known, reused, firstUid, firstAt, count, error: false };
}

// Correo del primer uid que estrenó la máquina, para que el aviso a soporte@
// sea accionable. Best-effort: si no se puede leer, se omite.
async function lookupEmail(db, uid) {
    if (!uid) return '';
    try {
        const snap = await db.ref(`users_v2/${uid}/email`).once('value');
        return snap.val() || '';
    } catch { return ''; }
}

module.exports = {
    hashHardware, readMode, claimHardware, lookupEmail,
    LEDGER_PATH, CONFIG_PATH, DEFAULT_MODE, VALID_MODES,
};
