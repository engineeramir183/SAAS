/**
 * NotificationPermissionBanner.jsx
 * 
 * A non-blocking, dismissible banner shown in the Student Portal.
 * Asks the parent to enable push notifications.
 * 
 * Rules:
 * - Only shows if school has push_notifications_enabled = true
 * - Only shows if browser supports notifications
 * - Only shows once (localStorage flag)
 * - Disappears after permission is granted or dismissed
 */

import React, { useState, useEffect } from 'react';
import { initializePush, isPushSupported, isSchoolPushEnabled } from '../services/PushNotificationService';

const STORAGE_KEY = 'khr_push_banner_dismissed';

const NotificationPermissionBanner = ({ schoolId, studentId, schoolSettings }) => {
    const [visible,  setVisible]  = useState(false);
    const [loading,  setLoading]  = useState(false);
    const [status,   setStatus]   = useState(null); // null | 'success' | 'denied'

    useEffect(() => {
        // Don't show if:
        // 1. School doesn't have push enabled
        if (!isSchoolPushEnabled(schoolSettings)) return;
        // 2. Browser doesn't support it
        if (!isPushSupported()) return;
        // 3. Already granted
        if (Notification.permission === 'granted') return;
        // 4. Already denied
        if (Notification.permission === 'denied') return;
        // 5. User already dismissed this banner
        if (localStorage.getItem(STORAGE_KEY) === 'true') return;
        // 6. No studentId yet
        if (!studentId || !schoolId) return;

        // Show after a short delay for better UX
        const timer = setTimeout(() => setVisible(true), 1500);
        return () => clearTimeout(timer);
    }, [schoolSettings, schoolId, studentId]);

    const handleEnable = async () => {
        setLoading(true);
        const result = await initializePush(schoolId, studentId, schoolSettings);
        setLoading(false);

        if (result.success) {
            setStatus('success');
            setTimeout(() => setVisible(false), 3000);
        } else if (result.error === 'Permission denied by user.') {
            setStatus('denied');
            localStorage.setItem(STORAGE_KEY, 'true');
            setTimeout(() => setVisible(false), 3000);
        } else {
            setStatus('error');
            setTimeout(() => setVisible(false), 3000);
        }
    };

    const handleDismiss = () => {
        localStorage.setItem(STORAGE_KEY, 'true');
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 99998,
            maxWidth: '380px',
            width: 'calc(100% - 48px)',
            background: '#0f172a',
            borderRadius: '16px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06)',
            overflow: 'hidden',
            animation: 'slideUpBanner 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            fontFamily: "'Inter', system-ui, sans-serif",
        }}>
            <style>{`
                @keyframes slideUpBanner {
                    from { transform: translateY(120%); opacity: 0; }
                    to   { transform: translateY(0);    opacity: 1; }
                }
            `}</style>

            {/* Blue accent bar */}
            <div style={{ height: '4px', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }} />

            <div style={{ padding: '1.25rem 1.25rem 1.1rem' }}>

                {status === 'success' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.6rem' }}>✅</span>
                        <div>
                            <div style={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.95rem' }}>Notifications Enabled!</div>
                            <div style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '0.2rem' }}>You'll receive instant alerts for attendance & fees.</div>
                        </div>
                    </div>
                ) : status === 'denied' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.6rem' }}>🔕</span>
                        <div>
                            <div style={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.95rem' }}>Notifications Blocked</div>
                            <div style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '0.2rem' }}>Enable in browser settings to receive alerts.</div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.9rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <div style={{
                                    width: '38px', height: '38px', borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.1rem', flexShrink: 0
                                }}>🔔</div>
                                <div>
                                    <div style={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.92rem', lineHeight: 1.3 }}>
                                        Stay Updated Instantly
                                    </div>
                                    <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '1px' }}>KHR Educo Platform</div>
                                </div>
                            </div>
                            <button
                                onClick={handleDismiss}
                                style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: '2px', lineHeight: 1, fontSize: '1.1rem' }}
                                aria-label="Dismiss"
                            >✕</button>
                        </div>

                        {/* Feature list */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem' }}>
                            {[
                                { icon: '📋', text: 'Instant attendance absence alerts' },
                                { icon: '💰', text: 'Fee payment & overdue reminders' },
                                { icon: '📓', text: 'Urgent homework & notices' },
                            ].map(({ icon, text }) => (
                                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.85rem' }}>{icon}</span>
                                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{text}</span>
                                </div>
                            ))}
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '0.6rem' }}>
                            <button
                                onClick={handleDismiss}
                                style={{
                                    flex: 1, padding: '0.6rem',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '8px', color: '#94a3b8',
                                    fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                                    transition: 'background 0.15s'
                                }}
                            >
                                Not Now
                            </button>
                            <button
                                id="push-enable-btn"
                                onClick={handleEnable}
                                disabled={loading}
                                style={{
                                    flex: 2, padding: '0.6rem',
                                    background: loading
                                        ? 'rgba(59,130,246,0.5)'
                                        : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                    border: 'none', borderRadius: '8px',
                                    color: 'white', fontSize: '0.82rem',
                                    fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
                                    boxShadow: loading ? 'none' : '0 4px 12px rgba(37,99,235,0.4)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {loading ? 'Enabling...' : '🔔 Enable Notifications'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default NotificationPermissionBanner;
