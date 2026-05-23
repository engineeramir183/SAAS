const { createSign } = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables manually from .env
const dotenv = require('dotenv');
dotenv.config();

const supabaseUrl = 'https://wzdkonnqurhbfyupnkws.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6ZGtvbm5xdXJoYmZ5dXBua3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzk1OTksImV4cCI6MjA4OTk1NTU5OX0.FXW7CO2zp8n-CsjYQK7sPY-rIlIFGhJ5jjnp78hoOxk';

const supabase = createClient(supabaseUrl, supabaseKey);

const projectId   = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

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

async function sendTestToAll() {
    console.log('Fetching all registered tokens from DB...');
    const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('*');
        
    if (error) {
        console.error('Error fetching subscriptions:', error);
        return;
    }
    
    console.log(`Found ${subscriptions.length} active subscription(s).`);
    
    try {
        const accessToken = await getAccessToken(clientEmail, privateKey);
        console.log('Google OAuth authentication successful.');
        
        const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
        
        for (const sub of subscriptions) {
            console.log(`\n--------------------------------------------`);
            console.log(`Sending to Student: ${sub.student_id} | Browser: ${sub.browser}`);
            console.log(`Token: ${sub.fcm_token.substring(0, 15)}...`);
            
            const message = {
                message: {
                    token: sub.fcm_token,
                    notification: {
                        title: "⚠️ Attendance Alert",
                        body: "Hello! This is a test push notification for your student.",
                    },
                    webpush: {
                        notification: {
                            title: "⚠️ Attendance Alert",
                            body: "Hello! This is a test push notification for your student.",
                            icon: "/logo.png",
                            badge: "/logo.png",
                            tag: "attendance",
                            requireInteraction: true
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
            console.log('Response Status:', response.status);
            console.log('Response Body:', JSON.stringify(result, null, 2));
        }

    } catch (e) {
        console.error('FCM send error:', e);
    }
}

sendTestToAll();
