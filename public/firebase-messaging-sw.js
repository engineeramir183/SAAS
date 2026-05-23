// firebase-messaging-sw.js
// Service Worker for FCM Background Push Notifications
// This file MUST be in the /public directory (served at root /)

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Firebase config — values injected at runtime via self.__firebaseConfig
// This is set from the main app before the SW activates
let firebaseConfig = {};

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'FIREBASE_CONFIG') {
        firebaseConfig = event.data.config;
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
        } catch (e) {
            console.error('[SW] Firebase init error:', e);
        }
    }
});

// Initialize with a placeholder that will be overridden by the message above
try {
    firebase.initializeApp({
        apiKey: 'placeholder',
        projectId: 'placeholder',
        messagingSenderId: 'placeholder',
        appId: 'placeholder'
    });
} catch (e) {
    // Already initialized
}

const messaging = firebase.messaging();

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
