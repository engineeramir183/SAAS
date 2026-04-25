import React, { useState } from 'react';
import { LogIn, User, Lock, AlertCircle, School, ShieldCheck, XCircle, MessageCircle, Ban } from 'lucide-react';
import { developerCredentials } from '../data/schoolData';
import { supabase } from '../supabaseClient';
import { useSchoolData } from '../context/SchoolDataContext';
import { useSuperAdmin } from '../context/SuperAdminContext';

// ─── Suspension Modal ─────────────────────────────────────────────────────────
const SuspensionModal = ({ schoolName, whatsappNumber, onClose }) => {
    const waNumber = (whatsappNumber || '+923001333275').replace(/\+/g, '').replace(/\s/g, '');
    const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent('Hello, my school account (' + (schoolName || '') + ') has been suspended. I would like to renew my subscription.')}`;
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
        }}>
            <div style={{
                background: 'white', borderRadius: '24px', maxWidth: '460px', width: '100%',
                boxShadow: '0 25px 60px rgba(0,0,0,0.4)', overflow: 'hidden',
                animation: 'fadeInScale 0.3s ease'
            }}>
                <style>{`
                    @keyframes fadeInScale {
                        from { opacity: 0; transform: scale(0.92); }
                        to   { opacity: 1; transform: scale(1); }
                    }
                `}</style>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                    padding: '2rem', textAlign: 'center', color: 'white'
                }}>
                    <div style={{
                        width: '72px', height: '72px', background: 'rgba(255,255,255,0.15)',
                        borderRadius: '50%', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', margin: '0 auto 1rem'
                    }}>
                        <Ban size={36} />
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Account Suspended</h2>
                    <p style={{ margin: '0.5rem 0 0', opacity: 0.85, fontSize: '0.9rem' }}>
                        {schoolName || 'Your school'}
                    </p>
                </div>
                {/* Body */}
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <p style={{ color: '#374151', fontSize: '1rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                        ⚠️ Your school account has been <strong>suspended due to a payment issue</strong>.
                        Please contact our support team to renew your subscription and restore access.
                    </p>
                    <a
                        href={waLink}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                            background: 'linear-gradient(135deg, #16a34a, #15803d)',
                            color: 'white', textDecoration: 'none', padding: '0.85rem 2rem',
                            borderRadius: '12px', fontWeight: 700, fontSize: '1rem',
                            boxShadow: '0 4px 14px rgba(22,163,74,0.35)', marginBottom: '1rem',
                            width: '100%', justifyContent: 'center', boxSizing: 'border-box'
                        }}
                    >
                        <MessageCircle size={20} /> Contact Team on WhatsApp
                    </a>
                    <button
                        onClick={onClose}
                        style={{
                            width: '100%', padding: '0.85rem 2rem', borderRadius: '12px',
                            border: '2px solid #e5e7eb', background: 'white', color: '#6b7280',
                            fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.target.style.borderColor = '#9ca3af'; e.target.style.color = '#374151'; }}
                        onMouseLeave={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.color = '#6b7280'; }}
                    >
                        ← Back to Login
                    </button>
                    <p style={{ marginTop: '1.25rem', fontSize: '0.8rem', color: '#9ca3af' }}>
                        For payment inquiries, WhatsApp or email us — we respond within 2 hours.
                    </p>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Login Page — Multi-Tenant Edition
//
// Login flow:
//   1. Super Admin: username 'superadmin' → goes to Super Admin panel
//   2. Developer:   special dev creds     → goes to Developer panel
//   3. School Admin: School Code + username/password → School admin panel
//   4. Student:     School Code + Student ID/password → Student portal
//
// The School Code field resolves the tenant (e.g. 'acs-001').
// For backwards compatibility, it defaults to 'acs-001' if left blank.
// ─────────────────────────────────────────────────────────────────────────────

const Login = ({
    setIsLoggedIn,
    setIsAdmin,
    setIsDeveloper,
    setIsSuperAdminPage,
    setCurrentPage,
    setLoggedInStudent,
    setActiveSchoolId,
    onClose, // ← new: allows rendering as a modal
}) => {
    const { schoolData, adminCredentials } = useSchoolData();
    const { loginSuperAdmin }              = useSuperAdmin();

    const [credentials, setCredentials] = useState({ schoolCode: '', username: '', password: '' });
    const [error,        setError]       = useState('');
    const [isLoading,    setIsLoading]   = useState(false);
    const [suspendedSchool, setSuspendedSchool] = useState(null); // { name, whatsappNumber }
    const { saasInfo } = useSuperAdmin();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const { schoolCode, username, password } = credentials;
        
        const u = username.trim().toLowerCase();
        
        // 1. Super Admin (Global system access — no school code required)
        if (u === 'superadmin') {
            const result = await loginSuperAdmin(u, password);
            if (result.success) {
                if (setIsSuperAdminPage) setIsSuperAdminPage(true);
                setCurrentPage('superadmin');
                setIsLoading(false);
                return;
            } else {
                setError('Invalid Super Admin credentials.');
                setIsLoading(false);
                return;
            }
        }

        // 2. Developer (Global developer access — no school code required)
        if (username === developerCredentials.username && password === developerCredentials.password) {
            setIsDeveloper(true);
            setCurrentPage('developer');
            setIsLoading(false);
            return;
        }

        // ─── Mandatory School Code Check ───────────────────────────────────────
        // From here on, a School Code is STRICTLY required to prevent unauthorized 
        // cross-tenant access.
        const sid = schoolCode.trim().toLowerCase();
        if (!sid) {
            setError('Please enter your School Code to identify your institution.');
            setIsLoading(false);
            return;
        }

        try {
            // 3. SECURE VERIFICATION: Direct database check for this specific tenant.
            // This prevents the "Race Condition" where the UI might use old data 
            // from a different school during the login transition.
            
            // ── First, fetch the school record to check active status ──────────
            const { data: schoolRecord } = await supabase
                .from('schools')
                .select('school_name, is_active, contact_phone')
                .eq('school_id', sid)
                .maybeSingle();

            if (schoolRecord && !schoolRecord.is_active) {
                setSuspendedSchool({
                    name: schoolRecord.school_name,
                    whatsappNumber: schoolRecord.contact_phone || saasInfo?.whatsapp_number || '+923001333275'
                });
                setIsLoading(false);
                return;
            }

            // First, try Admin login
            const { data: adminData } = await supabase
                .from('admins')
                .select('*')
                .eq('school_id', sid)
                .eq('username', username)
                .eq('password', password)
                .maybeSingle();

            if (adminData) {
                setActiveSchoolId(sid); // Lock the app to this tenant
                setIsAdmin(true);
                setCurrentPage('admin');
                setIsLoading(false);
                return;
            }

            // Next, try Student login
            const { data: studentData } = await supabase
                .from('students')
                .select('*')
                .eq('school_id', sid)
                .eq('id', username)
                .eq('password', password)
                .maybeSingle();

            if (studentData) {
                setActiveSchoolId(sid); // Lock the app to this tenant
                setIsLoggedIn(true);
                setLoggedInStudent(studentData);
                setCurrentPage('portal');
                setIsLoading(false);
                return;
            }

            setError('Incorrect credentials for the specified School Code.');
        } catch (err) {
            setError('System error during login. Please contact support.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
        setError('');
    };

    const containerStyle = onClose ? {
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        animation: 'fadeIn 0.3s ease'
    } : {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        position: 'relative'
    };

    return (
        <div style={containerStyle}>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes scaleUp {
                    from { opacity: 0; transform: scale(0.95); }
                    to   { opacity: 1; transform: scale(1); }
                }
            `}</style>
            {/* Suspension Modal */}
            {suspendedSchool && (
                <SuspensionModal
                    schoolName={suspendedSchool.name}
                    whatsappNumber={suspendedSchool.whatsappNumber}
                    onClose={() => setSuspendedSchool(null)}
                />
            )}
            {/* Conditional Back / Close button */}
            {onClose ? (
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '1.5rem', right: '1.5rem',
                        background: 'rgba(255,255,255,0.1)', border: 'none',
                        color: 'white', padding: '0.6rem', borderRadius: '50%',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                >
                    <XCircle size={28} />
                </button>
            ) : (
                <button 
                    onClick={() => {
                        const params = new URLSearchParams(window.location.search);
                        if (params.get('school')) {
                            setCurrentPage('home');
                        } else {
                            setCurrentPage('saas');
                        }
                    }}
                    style={{
                        position: 'absolute', top: '2rem', left: '2rem',
                        background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                        color: 'white', padding: '0.6rem 1.2rem', borderRadius: '8px',
                        cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}
                >
                    {new URLSearchParams(window.location.search).get('school') ? `← Back to ${schoolData?.name || 'Home'}` : '← Back to KHR Digital Labs'}
                </button>
            )}

            <div
                className="card"
                style={{
                    width: '100%',
                    maxWidth: '460px',
                    background: 'white',
                    padding: '3rem',
                    animation: onClose ? 'scaleUp 0.3s ease' : 'none',
                    position: 'relative',
                    zIndex: 10
                }}
            >
                {/* Icon */}
                <div className="flex-center" style={{
                    width: '72px',
                    height: '72px',
                    background: 'var(--gradient-primary)',
                    borderRadius: '50%',
                    color: 'white',
                    margin: '0 auto 1.75rem'
                }}>
                    <LogIn size={34} />
                </div>

                <h2 style={{
                    fontSize: '1.9rem',
                    fontWeight: 800,
                    textAlign: 'center',
                    marginBottom: '0.4rem',
                    color: '#0f172a'
                }}>
                    Portal Login
                </h2>
                <p style={{
                    textAlign: 'center',
                    color: 'var(--color-gray-500)',
                    marginBottom: '2rem',
                    fontSize: '0.95rem'
                }}>
                    Enter your credentials to access your portal
                </p>

                <form onSubmit={handleSubmit}>
                    {/* School Code */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label className="form-label">School Code</label>
                        <div style={{ position: 'relative' }}>
                            <School size={18} style={{
                                position: 'absolute', left: '1rem', top: '50%',
                                transform: 'translateY(-50%)', color: 'var(--color-gray-400)'
                            }} />
                            <input
                                type="text"
                                name="schoolCode"
                                value={credentials.schoolCode}
                                onChange={handleChange}
                                className="form-input"
                                style={{ paddingLeft: '3rem' }}
                                placeholder="Enter School Code (e.g. oasis-01)"
                                autoComplete="organization"
                            />
                        </div>
                        <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.3rem' }}>
                            Your unique school identifier provided by KHR Digital Labs.
                        </p>
                    </div>

                    {/* Username */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label className="form-label">Username / Student ID</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{
                                position: 'absolute', left: '1rem', top: '50%',
                                transform: 'translateY(-50%)', color: 'var(--color-gray-400)'
                            }} />
                            <input
                                type="text"
                                name="username"
                                value={credentials.username}
                                onChange={handleChange}
                                className="form-input"
                                style={{ paddingLeft: '3rem' }}
                                required
                                placeholder="Enter your ID or username"
                                autoComplete="username"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{
                                position: 'absolute', left: '1rem', top: '50%',
                                transform: 'translateY(-50%)', color: 'var(--color-gray-400)'
                            }} />
                            <input
                                type="password"
                                name="password"
                                value={credentials.password}
                                onChange={handleChange}
                                className="form-input"
                                style={{ paddingLeft: '3rem' }}
                                required
                                placeholder="••••••••"
                                autoComplete="current-password"
                            />
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="animate-fade-in" style={{
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid var(--color-danger)',
                            borderRadius: 'var(--radius-md)',
                            padding: '0.75rem 1rem',
                            marginBottom: '1.25rem',
                            display: 'flex',
                            gap: '0.5rem',
                            alignItems: 'center',
                            color: 'var(--color-danger)',
                            fontSize: '0.9rem'
                        }}>
                            <AlertCircle size={17} />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%' }}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span>Signing in…</span>
                        ) : (
                            <>
                                <LogIn size={20} />
                                Sign In
                            </>
                        )}
                    </button>
                </form>

                <div style={{
                    marginTop: '2.5rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid #f1f5f9',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.8rem',
                    justifyContent: 'center',
                    color: '#94a3b8',
                    fontSize: '0.8rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <ShieldCheck size={14} />
                        <span>Super Admin? Use username <code>superadmin</code></span>
                    </div>
                    <div style={{ opacity: 0.6, fontSize: '0.75rem' }}>
                        Powered by <strong>KHR Digital Labs</strong>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
