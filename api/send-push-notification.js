/**
 * /api/send-push-notification.js
 * Vercel Serverless Function — FCM Push Notification Proxy
 * 
 * Mirrors /api/send-whatsapp.js architecture.
 * Uses Firebase Admin SDK to send notifications via FCM.
 * 
 * POST body: { token, title, body, icon, tag, urgent, school_id }
 * Response:  { success: true } | { error: '...' }
 */

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { token, title, body, icon, tag, urgent, school_id } = req.body || {};

    if (!token) {
        return res.status(400).json({ error: 'FCM token is required' });
    }
    if (!title || !body) {
        return res.status(400).json({ error: 'title and body are required' });
    }

    // Firebase Admin credentials from Vercel environment variables
    const projectId   = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
        console.error('[send-push-notification] Firebase Admin credentials not configured.');
        // Graceful fallback — don't break the app if push isn't configured yet
        return res.status(200).json({ success: false, reason: 'not_configured' });
    }

    try {
        // Dynamically import firebase-admin (only available on server)
        // Using the REST API as a fallback so we don't need to install firebase-admin SDK
        // This uses FCM HTTP v1 API with a service account JWT
        const accessToken = await getAccessToken(clientEmail, privateKey);

        const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

        const message = {
            message: {
                token: token,
                notification: {
                    title: title,
                    body:  body,
                    image: icon || undefined,
                },
                webpush: {
                    notification: {
                        title: title,
                        body:  body,
                        icon:  icon || '/logo.png',
                        badge: '/logo.png',
                        tag:   tag || 'khr-notification',
                        requireInteraction: urgent === true || urgent === 'true',
                        actions: [
                            { action: 'view',    title: 'View Portal' },
                            { action: 'dismiss', title: 'Dismiss'     }
                        ]
                    },
                    fcm_options: {
                        link: '/'
                    }
                },
                data: {
                    school_id: school_id || '',
                    tag:       tag       || 'khr-notification',
                    urgent:    urgent ? 'true' : 'false',
                    timestamp: new Date().toISOString()
                }
            }
        };

        const response = await fetch(fcmUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type':  'application/json',
            },
            body: JSON.stringify(message)
        });

        const result = await response.json();

        if (!response.ok) {
            // Token expired or invalid — log but don't throw (silently handle stale tokens)
            if (result?.error?.code === 404 || result?.error?.details?.[0]?.errorCode === 'UNREGISTERED') {
                console.log('[send-push-notification] Token unregistered, should be cleaned up.');
                return res.status(200).json({ success: false, reason: 'unregistered_token' });
            }
            console.error('[send-push-notification] FCM error:', JSON.stringify(result));
            return res.status(200).json({ success: false, error: result?.error?.message });
        }

        return res.status(200).json({ success: true, messageId: result.name });

    } catch (error) {
        console.error('[send-push-notification] Error:', error.message);
        return res.status(200).json({ success: false, error: error.message });
    }
}

/**
 * Generate a Google OAuth2 access token using Service Account credentials.
 * This avoids needing the full firebase-admin SDK.
 */
async function getAccessToken(clientEmail, privateKey) {
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + 3600;

    const header  = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
        iss:   clientEmail,
        scope: 'https://www.googleapis.com/auth/firebase.messaging',
        aud:   'https://oauth2.googleapis.com/token',
        iat:   now,
        exp:   expiry
    }));

    // Sign using the private key (Node.js crypto)
    const { createSign } = await import('crypto');
    const sign = createSign('RSA-SHA256');
    sign.write(`${header}.${payload}`);
    sign.end();

    const signature = sign
        .sign(privateKey)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

    const jwt = `${header}.${payload}.${signature}`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion:  jwt
        })
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
        throw new Error('Failed to get access token: ' + JSON.stringify(tokenData));
    }
    return tokenData.access_token;
}
