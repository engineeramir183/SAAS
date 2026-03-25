import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Building, Globe, School, CheckCircle, ArrowRight, Upload, Sparkles, Layout } from 'lucide-react';

const OnboardingWizard = ({ schoolData, onComplete, completeOnboarding }) => {
    const [step, setStep] = useState(1);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({
        school_name: schoolData?.name || 'My New School',
        tagline: 'Leading the Future of Education',
        country: 'Pakistan',
        currency_symbol: 'RS',
        logo_url: '/logo.png',
        initial_classes: ['Playgroup', 'Nursery', 'Prep', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5']
    });

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);

    const handleUploadLogo = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${schoolData?.id || 'new'}-logo-${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('branding').upload(fileName, file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('branding').getPublicUrl(fileName);
            setForm(prev => ({ ...prev, logo_url: publicUrl }));
        } catch (err) {
            alert('Upload failed: ' + err.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleFinish = async () => {
        setIsSubmitting(true);
        try {
            // 1. Sync basic school settings
            await completeOnboarding({
                school_name: form.school_name,
                logo_url: form.logo_url,
                country: form.country,
                currency_symbol: form.currency_symbol
            });
            
            // 2. We can even seed metadata here if we wanted to
            // For now, closing the wizard
            onComplete();
        } catch (err) {
            alert('Error completing setup: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const cardStyle = {
        background: 'white',
        borderRadius: '24px',
        padding: '3rem',
        maxWidth: '600px',
        width: '90%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        border: '1px solid #f1f5f9'
    };

    const inputStyle = {
        width: '100%',
        padding: '0.8rem 1rem',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        fontSize: '1rem',
        marginTop: '0.4rem',
        background: '#f8fafc'
    };

    const btnStyle = {
        padding: '1rem 2rem',
        borderRadius: '14px',
        fontWeight: 700,
        fontSize: '0.95rem',
        cursor: 'pointer',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        transition: 'all 0.2s'
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>

            <div style={cardStyle}>
                {/* Progress Bar */}
                <div style={{ marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#64748b', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>
                        <span>Step {step} of 3</span>
                        <span>{Math.round((step / 3) * 100)}% Complete</span>
                    </div>
                    <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(step / 3) * 100}%`, background: '#3b82f6', transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
                    </div>
                </div>

                {step === 1 && (
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ padding: '0.8rem', background: '#eff6ff', borderRadius: '14px', color: '#3b82f6' }}><Building size={24} /></div>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>School Identity</h2>
                        </div>
                        <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: 1.6 }}>Let's start with your high-level branding. This appears on receipts, ID cards, and reports.</p>

                        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '2rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', border: '1px dashed #cbd5e1' }}>
                            <div style={{ width: '100px', height: '100px', background: 'white', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                                <img src={form.logo_url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Preview" />
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', fontWeight: 700 }}>Institutional Logo</h4>
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#2563eb', fontWeight: 700, fontSize: '0.85rem', cursor: isUploading ? 'not-allowed' : 'pointer' }}>
                                    {isUploading ? 'Uploading...' : 'Click to Upload PNG/JPG'}
                                    <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleUploadLogo} disabled={isUploading} />
                                    <Upload size={16} />
                                </label>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ fontWeight: 700, color: '#475569', fontSize: '0.85rem' }}>Official School Name</label>
                            <input type="text" value={form.school_name} onChange={e => setForm({ ...form, school_name: e.target.value })} style={inputStyle} placeholder="e.g. Oakridge Higher Secondary" />
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ padding: '0.8rem', background: '#ecfdf5', borderRadius: '14px', color: '#10b981' }}><Globe size={24} /></div>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Regional Settings</h2>
                        </div>
                        <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: 1.6 }}>Configure your local context. This ensures fee and reports match your economy.</p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                                <label style={{ fontWeight: 700, color: '#475569', fontSize: '0.85rem' }}>Country</label>
                                <input type="text" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ fontWeight: 700, color: '#475569', fontSize: '0.85rem' }}>Currency Symbol</label>
                                <input type="text" value={form.currency_symbol} onChange={e => setForm({ ...form, currency_symbol: e.target.value })} style={inputStyle} />
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ padding: '0.8rem', background: '#fef3c7', borderRadius: '14px', color: '#f59e0b' }}><Layout size={24} /></div>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Review & Deploy</h2>
                        </div>
                        <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: 1.6 }}>Nice job! KHR Digital Labs is initializing your environment. Review your details below.</p>

                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                                <span style={{ color: '#64748b', fontWeight: 600 }}>School</span>
                                <span style={{ fontWeight: 700, color: '#1e293b' }}>{form.school_name}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                                <span style={{ color: '#64748b', fontWeight: 600 }}>Region</span>
                                <span style={{ fontWeight: 700, color: '#1e293b' }}>{form.country}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b', fontWeight: 600 }}>System Currency</span>
                                <span style={{ fontWeight: 700, color: '#1e293b' }}>{form.currency_symbol}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#059669', background: '#f0fdf4', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600 }}>
                            <Sparkles size={18} /> You can change these anytime in the Developer Panel.
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {step > 1 ? (
                        <button onClick={handleBack} style={{ ...btnStyle, background: 'transparent', color: '#64748b', padding: '0.8rem 0' }}>Back</button>
                    ) : <div></div>}

                    {step < 3 ? (
                        <button onClick={handleNext} style={{ ...btnStyle, background: '#2563eb', color: 'white', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)' }}>Next Step <ArrowRight size={18} /></button>
                    ) : (
                        <button onClick={handleFinish} disabled={isSubmitting} style={{ ...btnStyle, background: '#10b981', color: 'white', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)' }}>
                            {isSubmitting ? 'Finalizing...' : 'Complete Setup'} <CheckCircle size={18} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OnboardingWizard;
