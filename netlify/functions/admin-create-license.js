// ── admin-create-license.js ───────────────────────────────────────────────────
// Crea una licencia manualmente desde el panel de administración.
// POST /api/admin-create-license
// Body: { email, licenseType, maxDevices, expirationDate, adminToken }
// ─────────────────────────────────────────────────────────────────────────────

const crypto = require('crypto');
const admin  = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId:   process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey:  (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
}

const db   = admin.database();
const auth = admin.auth();

const CORS = {
    'Access-Control-Allow-Origin':  process.env.SITE_URL || '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

exports.handler = async function (event) {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
    if (event.httpMethod !== 'POST')    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Método no permitido' }) };

    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { body = {}; }

    const { email, licenseType, maxDevices, expirationDate, adminToken } = body;

    // Verificar token del administrador
    if (!adminToken) return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'No autorizado' }) };

    try {
        const decoded = await auth.verifyIdToken(adminToken);
        if (!process.env.ADMIN_EMAILS)
            return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'ADMIN_EMAILS no configurado' }) };
        const adminEmails = process.env.ADMIN_EMAILS.split(',').map(e => e.trim());
        if (!adminEmails.includes(decoded.email)) {
            return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'No autorizado' }) };
        }
    } catch {
        return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'Token inválido' }) };
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Email inválido' }) };

    if (!expirationDate)
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Fecha de expiración requerida' }) };

    try {
        let uid, isNewUser = false;

        try {
            uid = (await auth.getUserByEmail(email)).uid;
            console.log(`[admin-create-license] Usuario existente: ${email} | uid: ${uid}`);
        } catch {
            const newUser = await auth.createUser({
                email,
                password:      crypto.randomBytes(14).toString('base64url'),
                emailVerified: false,
                displayName:   email.split('@')[0],
            });
            uid = newUser.uid;
            isNewUser = true;
            console.log(`[admin-create-license] Usuario creado: ${email} | uid: ${uid}`);
        }

        const now = new Date();
        const updates = {
            userId:         uid,
            email,
            isActive:       true,
            licenseType:    licenseType || 'Monthly',
            expirationDate: new Date(expirationDate).toISOString(),
            maxDevices:     maxDevices || 1,
            maxActivations: maxDevices || 1,
            updatedAt:      now.toISOString(),
            ...(isNewUser && { createdAt: now.toISOString(), validationCount: 0 }),
        };

        await db.ref(`users/${uid}`).update(updates);

        // Enviar email para que el usuario establezca su contraseña
        const apiKey = process.env.FIREBASE_API_KEY;
        let emailSent = false;
        if (apiKey) {
            try {
                const emailRes = await fetch(
                    `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
                    {
                        method:  'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body:    JSON.stringify({ requestType: 'PASSWORD_RESET', email }),
                    }
                );
                const emailData = await emailRes.json();
                if (emailData.email) {
                    emailSent = true;
                    console.log(`[admin-create-license] Email de bienvenida enviado a: ${email}`);
                } else {
                    console.warn(`[admin-create-license] Firebase no envió email:`, JSON.stringify(emailData));
                }
            } catch (emailErr) {
                console.warn(`[admin-create-license] Error al enviar email:`, emailErr.message);
            }
        } else {
            console.warn('[admin-create-license] FIREBASE_API_KEY no configurada — email no enviado');
        }

        console.log(`[admin-create-license] Licencia creada: ${email} | ${licenseType} | vence: ${expirationDate}`);

        return {
            statusCode: 200,
            headers: CORS,
            body: JSON.stringify({ success: true, uid, isNewUser, emailSent }),
        };

    } catch (err) {
        console.error('[admin-create-license] Error:', err?.message || err);
        return {
            statusCode: 500,
            headers: CORS,
            body: JSON.stringify({ error: err.message || 'Error interno' }),
        };
    }
};
