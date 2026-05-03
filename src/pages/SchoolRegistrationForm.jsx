import React, { useState } from 'react';
import {
    School, User, Lock, Phone, Mail, MapPin, Globe,
    CheckCircle, ArrowRight, ArrowLeft, Building,
    MessageCircle, AlertCircle, Loader2
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useSuperAdmin } from '../context/SuperAdminContext';
import { sendWhatsAppMessage, WhatsAppTemplates } from '../services/WhatsAppService';
import { sendEmail } from '../services/EmailService';

// ─────────────────────────────────────────────────────────────────────────────
// SchoolRegistrationForm
// Shown when a school owner clicks "Register Your School" on the SaaS landing.
// Submits a row to `school_registration_requests` table for SuperAdmin review.
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = ['School Info', 'Contact & Location', 'Admin Account'];

const FieldGroup = ({ label, icon: Icon, children, hint }) => (
    <div style={{ marginBottom: '1.25rem' }}>
        <label style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            fontWeight: 700, fontSize: '0.85rem',
            color: '#374151', marginBottom: '0.4rem'
        }}>
            {Icon && <Icon size={14} color="#6366f1" />} {label}
        </label>
        {children}
        {hint && <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>{hint}</p>}
    </div>
);

const inputStyle = {
    width: '100%', padding: '0.75rem 1rem', borderRadius: '10px',
    border: '1.5px solid #e5e7eb', fontSize: '0.95rem', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.2s',
    fontFamily: "'Inter', sans-serif", background: 'white'
};

const SchoolRegistrationForm = ({ setCurrentPage }) => {
    const { saasInfo } = useSuperAdmin();
    const whatsappNum = saasInfo?.whatsapp_number || '+923001333275';

    const [step, setStep] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        school_name: '',
        address: '',
        country: 'Pakistan',
        contact_phone: '',
        contact_email: '',
        admin_username: '',
        admin_password: '',
        admin_confirm_password: ''
    });

    const set = (field, val) => {
        setForm(prev => ({ ...prev, [field]: val }));
        setError('');
    };


    const validateStep = () => {
        if (step === 0) {
            if (!form.school_name.trim()) return 'School name is required.';
        }
        if (step === 1) {
            if (!form.contact_phone.trim()) return 'A valid WhatsApp number is strictly required for registration updates.';
            if (!/^\+?[0-9]{10,15}$/.test(form.contact_phone.replace(/\s/g, ''))) return 'Please enter a valid mobile number (e.g. +923001234567).';
            if (!form.contact_email.trim()) return 'Email is required.';
            if (!/\S+@\S+\.\S+/.test(form.contact_email)) return 'Please enter a valid email address.';
        }
        if (step === 2) {
            if (!form.admin_username.trim()) return 'Admin username is required.';
            if (!form.admin_password.trim() || form.admin_password.length < 6) return 'Password must be at least 6 characters.';
            if (form.admin_password !== form.admin_confirm_password) return 'Passwords do not match.';
        }
        return '';
    };

    const nextStep = () => {
        const err = validateStep();
        if (err) { setError(err); return; }
        setStep(s => s + 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const err = validateStep();
        if (err) { setError(err); return; }

        setSubmitting(true);
        setError('');

        const { error: dbErr } = await supabase
            .from('school_registration_requests')
            .insert([{
                school_name:    form.school_name.trim(),
                address:        form.address.trim() || null,
                country:        form.country.trim() || 'Pakistan',
                contact_phone:  form.contact_phone.trim(),
                contact_email:  form.contact_email.trim().toLowerCase(),
                admin_username: form.admin_username.trim(),
                admin_password: form.admin_password,
                status:         'pending'
            }]);

        if (dbErr) {
            setError(dbErr.code === '23505'
                ? 'A request with this School ID already exists. Please choose a different School ID.'
                : 'Failed to submit request: ' + dbErr.message);
            setSubmitting(false);
        } else {
            // ── Automated Notifications (Submission) ──
            if (saasInfo && form.contact_phone) {
                const regMsg = WhatsAppTemplates.registrationRequest(form.school_name, '');
                await sendWhatsAppMessage(form.contact_phone, regMsg, saasInfo);
            }
            if (saasInfo && form.contact_email) {
                const emailSub = `Registration Received: ${form.school_name}`;
                const emailMsg = `Hello! We have received your registration request for ${form.school_name}. Our team will review it shortly.`;
                await sendEmail(form.contact_email, emailSub, emailMsg, saasInfo);
            }

            setSubmitted(true);
        }
    };

    const waLink = `https://wa.me/${whatsappNum.replace(/\+/g, '').replace(/\s/g, '')}?text=${encodeURIComponent('Hello! I just submitted a school registration request for ' + form.school_name + '. Please let me know the status.')}`;

    // ── Success Screen ──────────────────────────────────────────────────────────
    if (submitted) {
        return (
            <div style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', padding: '2rem'
            }}>
                <div style={{
                    background: 'white', borderRadius: '24px', maxWidth: '520px', width: '100%',
                    overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
                    animation: 'fadeIn 0.4s ease'
                }}>
                    <style>{`@keyframes fadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }`}</style>
                    <div style={{
                        background: 'linear-gradient(135deg, #059669, #047857)',
                        padding: '3rem 2rem', textAlign: 'center', color: 'white'
                    }}>
                        <div style={{
                            width: '80px', height: '80px', background: 'rgba(255,255,255,0.2)',
                            borderRadius: '50%', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', margin: '0 auto 1.25rem'
                        }}>
                            <CheckCircle size={44} />
                        </div>
                        <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>Request Submitted!</h2>
                        <p style={{ margin: '0.75rem 0 0', opacity: 0.9, fontSize: '1rem' }}>
                            We've received your registration for <strong>{form.school_name}</strong>
                        </p>
                    </div>
                    <div style={{ padding: '2.5rem' }}>
                        <div style={{
                            background: '#f0fdf4', border: '1px solid #bbf7d0',
                            borderRadius: '12px', padding: '1.25rem', marginBottom: '1.75rem'
                        }}>
                            <p style={{ margin: 0, color: '#166534', fontSize: '0.9rem', lineHeight: 1.7 }}>
                                ✅ Your request has been submitted successfully.<br />
                                Our team will <strong>review and approve</strong> your school within <strong>24 hours</strong>.<br />
                                Once approved, you can log in using the credentials you provided.
                            </p>
                        </div>
                        <p style={{ color: '#6b7280', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1.25rem' }}>
                            For any questions or faster approval, contact us directly:
                        </p>
                        <a
                            href={waLink}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: '0.6rem', background: 'linear-gradient(135deg, #16a34a, #15803d)',
                                color: 'white', textDecoration: 'none', padding: '0.9rem 1.5rem',
                                borderRadius: '12px', fontWeight: 700, fontSize: '1rem',
                                boxShadow: '0 4px 14px rgba(22,163,74,0.3)', marginBottom: '1rem'
                            }}
                        >
                            <MessageCircle size={20} /> Contact us on WhatsApp
                        </a>
                        <button
                            onClick={() => setCurrentPage('login')}
                            style={{
                                width: '100%', padding: '0.85rem', borderRadius: '12px',
                                border: '2px solid #e5e7eb', background: 'white', color: '#374151',
                                fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer'
                            }}
                        >
                            ← Back to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Form ──────────────────────────────────────────────────────────────────
    return (
        <div style={{
            minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem 1rem', position: 'relative'
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
                * { font-family: 'Inter', sans-serif; }
                .reg-input:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
            `}</style>

            {/* Back button */}
            <button
                onClick={() => setCurrentPage('saas')}
                style={{
                    position: 'absolute', top: '1.5rem', left: '1.5rem',
                    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white', padding: '0.5rem 1.1rem', borderRadius: '8px',
                    cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                    display: 'flex', alignItems: 'center', gap: '0.4rem'
                }}
            >
                <ArrowLeft size={16} /> Back
            </button>

            <div style={{
                background: 'white', borderRadius: '24px', maxWidth: '580px', width: '100%',
                boxShadow: '0 25px 60px rgba(0,0,0,0.4)', overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #1e3a8a, #4f46e5)',
                    padding: '2rem', textAlign: 'center', color: 'white'
                }}>
                    <div style={{
                        width: '60px', height: '60px', background: 'rgba(255,255,255,0.15)',
                        borderRadius: '50%', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', margin: '0 auto 1rem'
                    }}>
                        <Building size={30} />
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Register Your School</h2>
                    <p style={{ margin: '0.5rem 0 0', opacity: 0.85, fontSize: '0.9rem' }}>
                        Fill out the form below and our team will set up your school
                    </p>
                </div>

                {/* Step indicator */}
                <div style={{
                    display: 'flex', background: '#f8fafc', padding: '1.25rem 2rem',
                    borderBottom: '1px solid #e5e7eb', gap: '0'
                }}>
                    {STEPS.map((s, i) => (
                        <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    background: i < step ? '#059669' : i === step ? '#4f46e5' : '#e5e7eb',
                                    color: i <= step ? 'white' : '#9ca3af',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 800, fontSize: '0.85rem', transition: 'all 0.3s'
                                }}>
                                    {i < step ? <CheckCircle size={16} /> : i + 1}
                                </div>
                                <span style={{
                                    fontSize: '0.7rem', fontWeight: 700, marginTop: '0.4rem',
                                    color: i === step ? '#4f46e5' : i < step ? '#059669' : '#9ca3af',
                                    textAlign: 'center', whiteSpace: 'nowrap'
                                }}>{s}</span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div style={{
                                    flex: 1, height: '2px', background: i < step ? '#059669' : '#e5e7eb',
                                    transition: 'background 0.3s', margin: '0 0.25rem', marginTop: '-0.75rem'
                                }} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>

                    {/* STEP 0 — School Info */}
                    {step === 0 && (
                        <div style={{ animation: 'fadeIn 0.3s ease' }}>
                            <FieldGroup label="Full School Name" icon={School}>
                                <input
                                    className="reg-input"
                                    style={inputStyle}
                                    type="text"
                                    placeholder="e.g. Sunshine Public School & College"
                                    value={form.school_name}
                                    onChange={e => set('school_name', e.target.value)}
                                    required
                                    autoFocus
                                />
                            </FieldGroup>
                            <FieldGroup label="Country" icon={Globe}>
                                <input
                                    className="reg-input"
                                    style={inputStyle}
                                    type="text"
                                    value={form.country}
                                    onChange={e => set('country', e.target.value)}
                                    placeholder="Pakistan"
                                />
                            </FieldGroup>
                            <div style={{
                                background: '#eff6ff', border: '1px solid #bfdbfe',
                                borderRadius: '10px', padding: '1rem',
                                fontSize: '0.85rem', color: '#1e40af', lineHeight: 1.6
                            }}>
                                ℹ️ Your unique <strong>School Login Code</strong> will be assigned by our team after your request is reviewed and approved.
                            </div>
                        </div>
                    )}

                    {/* STEP 1 — Contact & Location */}
                    {step === 1 && (
                        <div style={{ animation: 'fadeIn 0.3s ease' }}>
                            <FieldGroup label="Mobile / WhatsApp Number" icon={Phone}>
                                <input
                                    className="reg-input"
                                    style={inputStyle}
                                    type="tel"
                                    placeholder="+92 300 1234567"
                                    value={form.contact_phone}
                                    onChange={e => set('contact_phone', e.target.value)}
                                    required
                                />
                            </FieldGroup>
                            <FieldGroup label="Email Address" icon={Mail}>
                                <input
                                    className="reg-input"
                                    style={inputStyle}
                                    type="email"
                                    placeholder="principal@yourschool.com"
                                    value={form.contact_email}
                                    onChange={e => set('contact_email', e.target.value)}
                                    required
                                />
                            </FieldGroup>
                            <FieldGroup label="School Address (Optional)" icon={MapPin}>
                                <textarea
                                    className="reg-input"
                                    style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
                                    placeholder="Full address of the school"
                                    value={form.address}
                                    onChange={e => set('address', e.target.value)}
                                    rows={3}
                                />
                            </FieldGroup>
                        </div>
                    )}

                    {/* STEP 2 — Admin Account */}
                    {step === 2 && (
                        <div style={{ animation: 'fadeIn 0.3s ease' }}>
                            <div style={{
                                background: '#eff6ff', border: '1px solid #bfdbfe',
                                borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem',
                                fontSize: '0.85rem', color: '#1e40af', lineHeight: 1.6
                            }}>
                                🔐 Create the <strong>admin login credentials</strong> for your school. You will use these to access your school's management panel once your account is approved.
                            </div>
                            <FieldGroup label="Admin Username" icon={User} hint="Used to login to your school's admin panel.">
                                <input
                                    className="reg-input"
                                    style={inputStyle}
                                    type="text"
                                    placeholder="e.g. principal or admin"
                                    value={form.admin_username}
                                    onChange={e => set('admin_username', e.target.value.trim())}
                                    required
                                    autoFocus
                                />
                            </FieldGroup>
                            <FieldGroup label="Password" icon={Lock}>
                                <input
                                    className="reg-input"
                                    style={inputStyle}
                                    type="password"
                                    placeholder="Minimum 6 characters"
                                    value={form.admin_password}
                                    onChange={e => set('admin_password', e.target.value)}
                                    required
                                />
                            </FieldGroup>
                            <FieldGroup label="Confirm Password" icon={Lock}>
                                <input
                                    className="reg-input"
                                    style={{
                                        ...inputStyle,
                                        borderColor: form.admin_confirm_password && form.admin_password !== form.admin_confirm_password ? '#ef4444' : '#e5e7eb'
                                    }}
                                    type="password"
                                    placeholder="Re-enter password"
                                    value={form.admin_confirm_password}
                                    onChange={e => set('admin_confirm_password', e.target.value)}
                                    required
                                />
                            </FieldGroup>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div style={{
                            display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                            background: '#fef2f2', border: '1px solid #fca5a5',
                            borderRadius: '10px', padding: '0.85rem 1rem',
                            marginBottom: '1.25rem', color: '#b91c1c', fontSize: '0.875rem'
                        }}>
                            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                        {step > 0 && (
                            <button
                                type="button"
                                onClick={() => { setStep(s => s - 1); setError(''); }}
                                style={{
                                    flex: 1, padding: '0.9rem', borderRadius: '12px',
                                    border: '2px solid #e5e7eb', background: 'white',
                                    color: '#374151', fontWeight: 700, fontSize: '1rem',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', gap: '0.5rem'
                                }}
                            >
                                <ArrowLeft size={18} /> Back
                            </button>
                        )}

                        {step < STEPS.length - 1 ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                style={{
                                    flex: 2, padding: '0.9rem', borderRadius: '12px',
                                    border: 'none', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                                    color: 'white', fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                    boxShadow: '0 4px 14px rgba(79,70,229,0.35)'
                                }}
                            >
                                Continue <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={submitting}
                                style={{
                                    flex: 2, padding: '0.9rem', borderRadius: '12px',
                                    border: 'none', background: submitting
                                        ? '#9ca3af'
                                        : 'linear-gradient(135deg, #059669, #047857)',
                                    color: 'white', fontWeight: 700, fontSize: '1rem',
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                    boxShadow: submitting ? 'none' : '0 4px 14px rgba(5,150,105,0.35)'
                                }}
                            >
                                {submitting
                                    ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...</>
                                    : <><CheckCircle size={18} /> Submit Request</>
                                }
                            </button>
                        )}
                    </div>

                    <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.78rem', marginTop: '1.25rem' }}>
                        Already have an account?{' '}
                        <button
                            type="button"
                            onClick={() => setCurrentPage('login')}
                            style={{ background: 'none', border: 'none', color: '#4f46e5', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}
                        >
                            Sign In
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default SchoolRegistrationForm;
