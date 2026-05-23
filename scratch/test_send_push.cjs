const { createSign } = require('crypto');

// Load environment variables manually from .env
const dotenv = require('dotenv');
dotenv.config();

const projectId   = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

// Try both registered tokens
const tokens = [
    "fZP9OSh_xuMJ1nlLJPiuYy:APA91bFo0ic-HeUriQtdf00S_SxQoslDpmGw2LRVU46_YTtpcuv6w_sBbw1HsnCeaYaLZrM04x8m0xpCO60dsYGefGGDmGrdpT2HvknIhbbl8skR3l5BVww",
    "fwyML_WpOg65S0hOoQeYcV:APA91bHCvWKfFpr6i-jLFCRl0lxMVdUOrCI5y3Z1QTqmexscyde8F4atdtJx59bSM-gweZTKl_jooUw1W09lfmOuBYt1pXantE0IIn6AGdmn1pqH6Ykgy5g"
];

async function getAccessToken(clientEmail, privateKey) {
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + 3600;

    const header  = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
        iss:   clientEmail,
        scope: 'https://www.googleapis.com/auth/firebase.messaging',
        aud:   'https://oauth2.googleapis.com/token',
        iat:   now,
        exp:   expiry
    })).toString('base64url');

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

async function send() {
    console.log('FCM Project ID:', projectId);
    console.log('Client Email:', clientEmail);
    
    if (!privateKey) {
        console.error('Private key is missing!');
        return;
    }
    
    try {
        const accessToken = await getAccessToken(clientEmail, privateKey);
        console.log('Successfully generated Google OAuth Access Token.');
        
        const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
        
        for (const token of tokens) {
            console.log(`Sending to token starting with: ${token.substring(0, 10)}...`);
            const message = {
                message: {
                    token: token,
                    notification: {
                        title: "⚠️ Attendance Alert",
                        body: "This is a direct FCM test push notification!",
                    },
                    webpush: {
                        notification: {
                            title: "⚠️ Attendance Alert",
                            body: "This is a direct FCM test push notification!",
                            icon: "/logo.png",
                            badge: "/logo.png",
                        },
                        fcm_options: {
                            link: "/"
                        }
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
            console.log('FCM Response Status:', response.status);
            console.log('FCM Response Body:', JSON.stringify(result, null, 2));
        }

    } catch (e) {
        console.error('Send error:', e);
    }
}

send();
