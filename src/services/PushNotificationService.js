/**
 * PushNotificationService.js
 * Web Push Notifications via Firebase Cloud Messaging (FCM)
 * 
 * Architecture mirrors WhatsAppService.js:
 *   - initializePush()          → Ask permission, get token, save to Supabase
 *   - sendPushNotification()    → Lookup token, call Vercel /api/send-push-notification
 *   - PushTemplates             → Notification title/body templates
 * 
 * Per-school feature gate:
 *   All functions check schoolSettings.push_notifications_enabled first.
 *   If false → exit immediately, no cost, no error.
 */

import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { supabase } from '../supabaseClient';

// ─── Firebase Config (from Vite env) ─────────────────────────────────────────
const firebaseConfig = {
    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// Singleton Firebase app
const getFirebaseApp = () => {
    if (getApps().length > 0) return getApps()[0];
    return initializeApp(firebaseConfig);
};

// ─── Check if push is supported in this browser ───────────────────────────────
export const isPushSupported = () => {
    return (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        'serviceWorker' in navigator &&
        'PushManager' in window
    );
};

// ─── Check if school has push notifications enabled ───────────────────────────
export const isSchoolPushEnabled = (schoolSettings) => {
    return schoolSettings?.push_notifications_enabled === true;
};

/**
 * Request notification permission and save FCM token to Supabase.
 * Called when parent clicks "Enable Notifications" in the banner.
 * 
 * @param {string} schoolId   - The school's school_id
 * @param {string} studentId  - The student's ID (portal user)
 * @param {object} schoolSettings - The school's settings object
 * @returns {Promise<{ success: boolean, token?: string, error?: string }>}
 */
export const initializePush = async (schoolId, studentId, schoolSettings) => {
    // Guard: feature must be enabled for this school
    if (!isSchoolPushEnabled(schoolSettings)) {
        return { success: false, error: 'Push notifications not enabled for this school.' };
    }

    // Guard: browser support
    if (!isPushSupported()) {
        return { success: false, error: 'Push notifications not supported in this browser.' };
    }

    // Guard: Firebase config must be present
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'undefined') {
        console.warn('[PushNotificationService] Firebase config not set. Skipping push init.');
        return { success: false, error: 'Firebase not configured.' };
    }

    try {
        // Request permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            return { success: false, error: 'Permission denied by user.' };
        }

        // Register SW and get FCM token
        const app = getFirebaseApp();
        const messaging = getMessaging(app);

        // Use the primary PWA Service Worker (sw.js) to handle push notifications in harmony
        const registration = await navigator.serviceWorker.ready;

        // Pass Firebase config to the PWA Service Worker so it can initialize FCM dynamically
        if (registration.active) {
            registration.active.postMessage({
                type: 'FIREBASE_CONFIG',
                config: firebaseConfig
            });
        }

        const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration
        });

        if (!token) {
            return { success: false, error: 'Failed to get FCM token.' };
        }

        // Save token to Supabase push_subscriptions table
        const browserName = getBrowserName();
        const { error: dbError } = await supabase
            .from('push_subscriptions')
            .upsert(
                {
                    school_id:  schoolId,
                    student_id: studentId,
                    fcm_token:  token,
                    browser:    browserName,
                    updated_at: new Date().toISOString()
                },
                { onConflict: 'student_id,fcm_token' }
            );

        if (dbError) {
            console.error('[PushNotificationService] DB save error:', dbError);
            return { success: false, error: dbError.message };
        }

        // Listen for foreground messages (portal is open)
        onMessage(messaging, (payload) => {
            console.log('[PushNotificationService] Foreground message:', payload);
            // Show a custom in-app toast for foreground notifications
            showForegroundToast(
                payload.notification?.title || 'Notification',
                payload.notification?.body || ''
            );
        });

        return { success: true, token };

    } catch (error) {
        console.error('[PushNotificationService] Init error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send a push notification to a student's parent.
 * Looks up the FCM token from Supabase and calls the Vercel serverless function.
 * 
 * @param {string} studentId      - Student ID to notify
 * @param {string} title          - Notification title
 * @param {string} body           - Notification body
 * @param {string} schoolId       - School ID (for token lookup scoping)
 * @param {object} [options]      - Optional: { icon, tag, urgent }
 * @returns {Promise<{ success: boolean }>}
 */
export const sendPushNotification = async (studentId, title, body, schoolId, options = {}) => {
    // Look up FCM token for this student
    const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('fcm_token')
        .eq('student_id', studentId)
        .eq('school_id', schoolId);

    if (error || !subscriptions || subscriptions.length === 0) {
        // No token = parent hasn't subscribed yet. Silently skip.
        return { success: false, reason: 'no_token' };
    }

    // Send to all registered tokens for this student (multiple devices)
    const results = await Promise.allSettled(
        subscriptions.map(sub =>
            fetch('/api/send-push-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token:     sub.fcm_token,
                    title,
                    body,
                    icon:      options.icon || '/logo.png',
                    tag:       options.tag  || 'khr-notification',
                    urgent:    options.urgent || false,
                    school_id: schoolId
                })
            }).then(r => r.json())
        )
    );

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
    return { success: successCount > 0, sent: successCount, total: subscriptions.length };
};

// ─── Notification Templates (parallel to WhatsAppTemplates) ───────────────────
export const PushTemplates = {
    attendanceAbsent: (studentName, date) => ({
        title: '⚠️ Attendance Alert',
        body:  `${studentName} is marked ABSENT today (${date}).`,
        tag:   'attendance',
    }),

    attendancePresent: (studentName, time) => ({
        title: '✅ Safe Arrival',
        body:  `${studentName} has arrived at school at ${time}.`,
        tag:   'attendance',
    }),

    feePaid: (studentName, month, amount) => ({
        title: '💰 Fee Confirmed',
        body:  `Payment of ${amount} received for ${studentName} (${month}).`,
        tag:   'fee',
    }),

    feeOverdue: (studentName, months) => ({
        title: '⚠️ Fee Reminder',
        body:  `Fee is overdue for ${studentName}: ${months}.`,
        tag:   'fee',
        urgent: true,
    }),

    diaryUrgent: (studentName, title, type) => ({
        title: `🚨 Urgent ${type}`,
        body:  `${title} — Please check the portal for ${studentName}.`,
        tag:   'diary',
        urgent: true,
    }),

    admissionWelcome: (studentName, schoolName) => ({
        title: `🎉 Welcome to ${schoolName}!`,
        body:  `${studentName} has been successfully registered.`,
        tag:   'admission',
    }),
};

// ─── Helper: show in-app toast when portal is open ────────────────────────────
function showForegroundToast(title, body) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 99999;
        background: #0f172a; color: white;
        border-left: 4px solid #3b82f6;
        padding: 1rem 1.25rem; border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        min-width: 300px; max-width: 380px;
        animation: slideInRight 0.3s ease;
        font-family: 'Inter', sans-serif;
    `;
    toast.innerHTML = `
        <style>
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to   { transform: translateX(0);    opacity: 1; }
            }
        </style>
        <div style="display:flex;align-items:flex-start;gap:0.75rem">
            <span style="font-size:1.4rem">🔔</span>
            <div>
                <div style="font-weight:700;font-size:0.95rem;margin-bottom:0.2rem">${title}</div>
                <div style="font-size:0.82rem;color:#94a3b8;line-height:1.4">${body}</div>
            </div>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 5000);
}

// ─── Helper: detect browser name ──────────────────────────────────────────────
function getBrowserName() {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Edg')) return 'Edge';
    return 'Unknown';
}
