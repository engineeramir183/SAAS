import React, { useState } from 'react';
import { Save, Building2, Target, Eye, MapPin, Phone, Mail, Globe, Image as ImageIcon, Upload } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const SettingsTab = ({ schoolData, updateSchoolInfo, showSaveMessage }) => {
    const [loading, setLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const [form, setForm] = useState({
        name: schoolData?.name || '',
        tagline: schoolData?.tagline || '',
        mission: schoolData?.about?.mission || '',
        vision: schoolData?.about?.vision || '',
        address: schoolData?.contact?.address || '',
        phone: schoolData?.contact?.phone || '',
        email: schoolData?.contact?.email || '',
        logo_url: schoolData?.logo_url || '/logo.png'
    });

    const handleSave = async () => {
        setLoading(true);
        const { error } = await updateSchoolInfo(form);
        setLoading(false);
        if (!error) showSaveMessage('✅ School details updated successfully!');
        else alert('Error: ' + error.message);
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${schoolData?.id}-logo-${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('branding').upload(fileName, file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('branding').getPublicUrl(fileName);
            setForm(prev => ({ ...prev, logo_url: publicUrl }));
            showSaveMessage('✅ Logo uploaded! Click save to finalize.');
        } catch (err) {
            alert('Upload failed: ' + err.message);
        } finally {
            setIsUploading(false);
        }
    };

    const sectionStyle = {
        background: 'white',
        padding: '2rem',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    };

    const labelStyle = {
        display: 'block',
        fontSize: '0.85rem',
        fontWeight: 700,
        color: '#475569',
        marginBottom: '0.5rem',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    };

    const inputStyle = {
        width: '100%',
        padding: '0.75rem 1rem',
        borderRadius: '10px',
        border: '1px solid #cbd5e1',
        fontSize: '1rem',
        color: '#1e293b',
        background: '#f8fafc',
        transition: 'border-color 0.2s'
    };

    const textareaStyle = {
        ...inputStyle,
        minHeight: '100px',
        resize: 'vertical',
        lineHeight: 1.6
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>School Profile & Website</h2>
                    <p style={{ color: '#64748b', marginTop: '0.4rem' }}>Manage how your institution appears on the public website.</p>
                </div>
                <button 
                    onClick={handleSave} 
                    disabled={loading}
                    style={{ 
                        background: '#2563eb', 
                        color: 'white', 
                        border: 'none', 
                        padding: '0.75rem 1.5rem', 
                        borderRadius: '10px', 
                        fontWeight: 700, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(37,99,235,0.3)'
                    }}
                >
                    <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* Branding Section */}
            <div style={sectionStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <Building2 size={24} color="#2563eb" />
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Institutional Branding</h3>
                </div>
                
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: '0 0 auto', textAlign: 'center' }}>
                        <div style={{ width: '120px', height: '120px', background: '#f1f5f9', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                            <img src={form.logo_url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Logo" />
                        </div>
                        <label style={{ color: '#2563eb', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                            <Upload size={14} /> {isUploading ? 'Uploading...' : 'Change Logo'}
                            <input type="file" style={{ display: 'none' }} onChange={handleLogoUpload} accept="image/*" />
                        </label>
                    </div>

                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={labelStyle}>Official Institution Name</label>
                            <input 
                                type="text" 
                                value={form.name} 
                                onChange={e => setForm({...form, name: e.target.value})} 
                                style={inputStyle} 
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Website Tagline</label>
                            <textarea 
                                value={form.tagline} 
                                onChange={e => setForm({...form, tagline: e.target.value})} 
                                style={{ ...textareaStyle, minHeight: '60px' }} 
                                placeholder="e.g. Excellence in Education"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Ethos Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={sectionStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <Target size={20} color="#ef4444" />
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Our Mission</h3>
                    </div>
                    <textarea 
                        value={form.mission} 
                        onChange={e => setForm({...form, mission: e.target.value})} 
                        style={textareaStyle} 
                        placeholder="Define your primary objectives..."
                    />
                </div>
                <div style={sectionStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <Eye size={20} color="#7c3aed" />
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Our Vision</h3>
                    </div>
                    <textarea 
                        value={form.vision} 
                        onChange={e => setForm({...form, vision: e.target.value})} 
                        style={textareaStyle} 
                        placeholder="Define your long-term goals..."
                    />
                </div>
            </div>

            {/* Contact Section */}
            <div style={sectionStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.8rem' }}>
                    <MapPin size={24} color="#10b981" />
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Public Contact Details</h3>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={labelStyle}>Physical Address</label>
                    <input 
                        type="text" 
                        value={form.address} 
                        onChange={e => setForm({...form, address: e.target.value})} 
                        style={inputStyle} 
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                        <label style={labelStyle}>Phone Number</label>
                        <div style={{ position: 'relative' }}>
                            <Phone size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input 
                                type="text" 
                                value={form.phone} 
                                onChange={e => setForm({...form, phone: e.target.value})} 
                                style={{ ...inputStyle, paddingLeft: '2.8rem' }} 
                            />
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>Public Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input 
                                type="text" 
                                value={form.email} 
                                onChange={e => setForm({...form, email: e.target.value})} 
                                style={{ ...inputStyle, paddingLeft: '2.8rem' }} 
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsTab;
