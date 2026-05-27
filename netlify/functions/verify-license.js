// ── verify-license.js ─────────────────────────────────────────────────────────
// Veredicto de licencia AUTORITATIVO y FIRMADO.
//
// Por qué existe (cierra 3 huecos del cliente):
//   #1 Self-MITM: el cliente ya no confía en "isActive:true" leído de Firebase.
//      Aquí el SERVIDOR firma el veredicto con una clave privada; el plugin
//      verifica la firma con la clave pública embebida. Sin la privada, un
//      atacante que intercepte su propia red NO puede forjar un "válido".
//   #3 Reloj confiable: la decisión válido/expirado se toma con Date.now() del
//      SERVIDOR (no con el reloj del cliente, manipulable). Además devolvemos
//      serverTime firmado para que el cliente ancle su hora.
//   #2 Anti-tamper: parchear ValidateLicense ya no basta; habría que falsificar
//      firmas RSA (imposible sin la clave) o parchear también la verificación.
//
// Body: { userId, hardwareId, idToken, nonce }
// Respuesta 200: { data: "<json firmado, bytes exactos>", signature: "<base64>" }
//   data = JSON.stringify({ userId, hardwareId, valid, reason, expiresAt, serverTime, nonce })
//   El cliente verifica la firma sobre los BYTES EXACTOS de `data` y luego lo parsea.
//
// Seguridad:
//   - Verifica el idToken con Firebase Admin y exige que decoded.uid === userId.
//   - nonce de un solo uso (lo genera el cliente) → impide replay de un veredicto
//     "válido" capturado antes.
// ─────────────────────────────────────────────────────────────────────────────

const crypto = require('crypto');
const admin  = require('firebase-admin');

// ── Init Firebase Admin (singleton, idéntico a create-trial-license) ─────────
if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            clientEmail: `firebase-adminsdk-fbsvc@${projectId}.iam.gserviceaccount.com`,
            privateKey:  (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        }),
        databaseURL: `https://${projectId}-default-rtdb.firebaseio.com`,
    });
}

const db   = admin.database();
const auth = admin.auth();

// Clave privada de FIRMA de licencias (ECDSA P-256 PKCS8 PEM). DISTINTA de la de
// Firebase. Se configura en Netlify como LICENSE_SIGNING_PRIVATE_KEY. Se usa EC en
// vez de RSA porque la privada pesa ~240 bytes y así no se excede el límite de 4KB
// de variables de entorno de AWS Lambda.
const SIGNING_KEY = (process.env.LICENSE_SIGNING_PRIVATE_KEY || '').replace(/\\n/g, '\n');

// ── Allowlist de orígenes (consistente con /api/trial) ───────────────────────
const SITE_URL = process.env.SITE_URL || 'https://bimsapp.netlify.app';
const ALLOWED_ORIGIN_PATTERNS = [
    SITE_URL,
    /^https:\/\/deploy-preview-\d+--bimsapp\.netlify\.app$/,
    /^https:\/\/[a-z0-9-]+--bimsapp\.netlify\.app$/,
];
function isOriginAllowed(origin) {
    if (!origin) return false;
    return ALLOWED_ORIGIN_PATTERNS.some(p =>
        (typeof p === 'string' && p === origin) || (p instanceof RegExp && p.test(origin)));
}
function corsHeadersFor(origin) {
    const headers = {
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin',
    };
    if (isOriginAllowed(origin)) headers['Access-Control-Allow-Origin'] = origin;
    return headers;
}
function resp(statusCode, body, origin) {
    return {
        statusCode,
        headers: { ...corsHeadersFor(origin), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    };
}

// ── Firma el payload y devuelve { data, signature } ──────────────────────────
function signVerdict(payloadObj) {
    // `data` son los bytes EXACTOS que se firman y que el cliente verificará.
    const data = JSON.stringify(payloadObj);
    const signer = crypto.createSign('SHA256');
    signer.update(data, 'utf8');
    signer.end();
    // dsaEncoding 'ieee-p1363' = firma EC como r||s crudo (64 bytes en P-256).
    // Es el formato que espera ECDsa.VerifyData en .NET Framework (net48), que NO
    // acepta el DER/ASN.1 por defecto de OpenSSL.
    const signature = signer.sign({ key: SIGNING_KEY, dsaEncoding: 'ieee-p1363' }).toString('base64');
    return { data, signature };
}

exports.handler = async function (event) {
    const origin = event.headers.origin || event.headers.Origin || '';

    if (event.httpMethod === 'OPTIONS')
        return { statusCode: 204, headers: corsHeadersFor(origin), body: '' };
    if (event.httpMethod !== 'POST')
        return resp(405, { error: 'Método no permitido' }, origin);

    if (!SIGNING_KEY) {
        console.error('[verify] LICENSE_SIGNING_PRIVATE_KEY no configurada');
        return resp(500, { error: 'Servidor no configurado para firmar licencias' }, origin);
    }

    let body;
    try { body = JSON.parse(event.body || '{}'); }
    catch { return resp(400, { error: 'Body inválido' }, origin); }

    const { userId, hardwareId, idToken, nonce } = body;
    if (!userId || !hardwareId || !idToken || !nonce)
        return resp(400, { error: 'Faltan parámetros (userId, hardwareId, idToken, nonce)' }, origin);

    // ── Autenticación: el idToken debe ser válido y pertenecer al userId ─────
    let decoded;
    try {
        decoded = await auth.verifyIdToken(idToken);
    } catch (e) {
        console.warn('[verify] idToken inválido:', e.code || e.message);
        return resp(401, { error: 'Token de autenticación inválido' }, origin);
    }
    if (decoded.uid !== userId)
        return resp(403, { error: 'El token no corresponde al usuario' }, origin);

    // ── Leer licencia y decidir con el RELOJ DEL SERVIDOR ────────────────────
    const serverTime = Date.now(); // ms epoch UTC, reloj del servidor (no del cliente)

    let license = null;
    try {
        const snap = await db.ref(`users_v2/${userId}`).once('value');
        license = snap.val();
    } catch (e) {
        console.error('[verify] error leyendo licencia:', e.message);
        return resp(500, { error: 'Error consultando la licencia' }, origin);
    }

    let valid = false;
    let reason = 'unknown';
    let expiresAtMs = null;

    if (!license) {
        reason = 'no-license';
    } else if (license.isActive === false) {
        reason = 'inactive';
    } else {
        // Expiración con reloj del servidor
        if (license.expirationDate) {
            const exp = Date.parse(license.expirationDate);
            expiresAtMs = isNaN(exp) ? null : exp;
            if (expiresAtMs !== null && expiresAtMs <= serverTime) {
                reason = 'expired';
            }
        }
        // Hardware activado para este equipo
        const activations = license.activations || {};
        const hwOk = Object.prototype.hasOwnProperty.call(activations, hardwareId);

        if (reason === 'unknown') {
            if (!hwOk) {
                reason = 'hardware-not-activated';
            } else {
                valid = true;
                reason = 'ok';
            }
        }
    }

    const payload = {
        userId,
        hardwareId,
        valid,
        reason,
        expiresAt: expiresAtMs,   // ms epoch o null
        serverTime,               // ms epoch UTC del servidor (firmado)
        nonce,                    // eco del nonce del cliente (anti-replay)
    };

    const signed = signVerdict(payload);
    console.log(`[verify] uid=${userId} hw=${hardwareId.slice(0,8)}… valid=${valid} reason=${reason}`);
    return resp(200, signed, origin);
};
