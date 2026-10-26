// firebase-messaging-sw.js
// Service Worker for FCM Background Push Notifications
// This file MUST be in the /public directory (served at root /)

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Parse Firebase config from query parameters
const params = new URLSearchParams(self.location.search);
const firebaseConfig = {
    apiKey:            params.get('apiKey'),
    authDomain:        params.get('authDomain'),
    projectId:         params.get('projectId'),
    storageBucket:     params.get('storageBucket'),
    messagingSenderId: params.get('messagingSenderId'),
    appId:             params.get('appId'),
};

let messaging;

function bindMessagingHandlers() {
    if (!messaging) return;

    // Handle background push notifications (when browser is closed/minimized)
    messaging.onBackgroundMessage((payload) => {
        console.log('[SW] Background message received:', payload);

        const notificationTitle = payload.notification?.title || 'KHR Educo';
        const notificationOptions = {
            body: payload.notification?.body || '',
            icon: payload.notification?.icon || '/logo.png',
            badge: '/logo.png',
            tag: payload.data?.tag || 'khr-educo-notification',
            data: payload.data || {},
            requireInteraction: payload.data?.urgent === 'true',
            actions: [
                { action: 'view', title: 'View Portal' },
                { action: 'dismiss', title: 'Dismiss' }
            ]
        };

        return self.registration.showNotification(notificationTitle, notificationOptions);
    });
}

// Only initialize if we got valid parameters, otherwise try to fall back or wait
if (firebaseConfig.apiKey && firebaseConfig.apiKey !== 'undefined' && firebaseConfig.apiKey !== 'placeholder') {
    try {
        const app = firebase.initializeApp(firebaseConfig);
        messaging = firebase.messaging(app);
    } catch (e) {
        console.error('[SW] Firebase init error:', e);
    }
} else {
    // Initialize with a placeholder to prevent immediate crashes
    try {
        const app = firebase.initializeApp({
            apiKey: 'placeholder',
            projectId: 'placeholder',
            messagingSenderId: 'placeholder',
            appId: 'placeholder'
        });
        messaging = firebase.messaging(app);
    } catch (e) {
        // Already initialized
        if (firebase.apps.length > 0) {
            messaging = firebase.messaging();
        }
    }
}

if (messaging) {
    bindMessagingHandlers();
}

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'FIREBASE_CONFIG') {
        const newConfig = event.data.config;
        try {
            // If the app was initialized with placeholders, delete and reinitialize
            if (firebase.apps.length > 0) {
                const currentApp = firebase.app();
                if (currentApp.options.apiKey === 'placeholder') {
                    currentApp.delete().then(() => {
                        const app = firebase.initializeApp(newConfig);
                        messaging = firebase.messaging(app);
                        bindMessagingHandlers();
                        console.log('[SW] Re-initialized Firebase messaging with real config');
                    }).catch(err => {
                        console.error('[SW] Error deleting placeholder app:', err);
                    });
                }
            } else {
                const app = firebase.initializeApp(newConfig);
                messaging = firebase.messaging(app);
                bindMessagingHandlers();
                console.log('[SW] Initialized Firebase messaging with real config');
            }
        } catch (e) {
            console.error('[SW] Firebase dynamic message init error:', e);
        }
    }
});


// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    if (event.action === 'dismiss') return;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
