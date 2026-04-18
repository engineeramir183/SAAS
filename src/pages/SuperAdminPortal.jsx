import React, { useState, useEffect } from 'react';
import { useSuperAdmin } from '../context/SuperAdminContext';
import { supabase } from '../supabaseClient';
import { Building, ShieldCheck, PlusCircle, CheckCircle, XCircle, MoreVertical, LogOut, Users, Settings, Database, Info, BarChart, TrendingUp, DollarSign, Activity, Bell, Phone, Mail, ClipboardList } from 'lucide-react';
import { sendWhatsAppMessage, WhatsAppTemplates } from '../services/WhatsAppService';
import { sendEmail } from '../services/EmailService';

const SuperAdminPortal = ({ setCurrentPage, setIsSuperAdminPage }) => {
    const {
        isSuperAdmin,
        schools,
        saasInfo,
        loading,
        error,
        logoutSuperAdmin,
        fetchAllSchools,
        fetchSaasInfo,
        updateSaasInfo,
        registerSchool,
        deactivateSchool,
        reactivateSchool,
        updateSchoolPlan,
        fetchGlobalStats
    } = useSuperAdmin();

    const [activeTab, setActiveTab] = useState('schools');
    const [isRegistering, setIsRegistering] = useState(false);
    const [viewingSchool, setViewingSchool] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [requests, setRequests] = useState([]);
    const [requestsLoading, setRequestsLoading] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    // SaaS Settings state
    const [saasForm, setSaasForm] = useState({
        business_name: '',
        support_email: '',
        whatsapp_number: '',
        hero_title: '',
        hero_subtitle: '',
        whatsapp_api_key: '',
        whatsapp_phone_id: '',
        email_service_key: ''
    });

    const [formData, setFormData] = useState({
        school_id: '',
        school_name: '',
        country: 'Pakistan',
        currency_symbol: 'RS',
        contact_email: '',
        plan: 'basic',
        admin_username: '',
        admin_password: ''
    });

    const [globalStats, setGlobalStats] = useState({ students: 0, faculty: 0, admins: 0 });

    // ─── fetch pending registration requests ─────────────────────────────────
    const fetchRequests = async () => {
        setRequestsLoading(true);
        const { data } = await supabase
            .from('school_registration_requests')
            .select('*')
            .order('created_at', { ascending: false });
        const list = data || [];
        setRequests(list);
        setPendingCount(list.filter(r => r.status === 'pending').length);
        setRequestsLoading(false);
    };

    const approveRequest = async (req) => {
        if (!window.confirm(`Approve and create school for "${req.school_name}"?`)) return;
        setStatusMessage('Creating school...');
        const schoolPayload = {
            school_id:       req.requested_school_id,
            school_name:     req.school_name,
            country:         req.country || 'Pakistan',
            currency_symbol: 'RS',
            contact_email:   req.contact_email || null,
            contact_phone:   req.contact_phone || null,
            plan:            'basic'
        };
        const adminPayload = { username: req.admin_username, password: req.admin_password };
        const res = await registerSchool(schoolPayload, adminPayload);
        if (res.success) {
            // Mark as approved
            await supabase.from('school_registration_requests')
                .update({ status: 'approved' })
                .eq('id', req.id);
            setStatusMessage(`✅ School "${req.school_name}" created and activated!`);
            
            // ── Automated Notifications ──
            if (saasInfo && req.contact_phone) {
                const approvalMsg = WhatsAppTemplates.registrationApproval(req.school_name, window.location.origin);
                await sendWhatsAppMessage(req.contact_phone, approvalMsg, saasInfo);
            }
            if (saasInfo && req.contact_email) {
                const emailSub = `School Approved: ${req.school_name}`;
                const emailMsg = `Congratulations! Your school ${req.school_name} has been approved. You can now login to your admin portal at ${window.location.origin}`;
                await sendEmail(req.contact_email, emailSub, emailMsg, saasInfo);
            }

            fetchRequests();
            setTimeout(() => setStatusMessage(''), 4000);
        } else {
            setStatusMessage('Error: ' + (res.error?.message || 'Failed'));
        }
    };

    const rejectRequest = async (req) => {
        if (!window.confirm(`Reject request from "${req.school_name}"?`)) return;
        await supabase.from('school_registration_requests')
            .update({ status: 'rejected' })
            .eq('id', req.id);
        setStatusMessage(`Request from "${req.school_name}" rejected.`);
        fetchRequests();
        setTimeout(() => setStatusMessage(''), 3000);
    };

    useEffect(() => {
        if (!isSuperAdmin) {
            setCurrentPage('login');
            if (setIsSuperAdminPage) setIsSuperAdminPage(false);
        } else {
            fetchAllSchools();
            fetchSaasInfo();
            fetchGlobalStats().then(setGlobalStats);
            fetchRequests();
        }
    }, [isSuperAdmin]);

    useEffect(() => {
        if (saasInfo) {
            setSaasForm({
                business_name:   saasInfo.business_name   || '',
                support_email:   saasInfo.support_email   || '',
                whatsapp_number: saasInfo.whatsapp_number || '',
                hero_title:      saasInfo.hero_title      || '',
                hero_subtitle:   saasInfo.hero_subtitle   || '',
                whatsapp_api_key: saasInfo.whatsapp_api_key || '',
                whatsapp_phone_id: saasInfo.whatsapp_phone_id || '',
                email_service_key: saasInfo.email_service_key || ''
            });
        }
    }, [saasInfo]);

    const handleLogout = () => {
        logoutSuperAdmin();
        if (setIsSuperAdminPage) setIsSuperAdminPage(false);
        setCurrentPage('home');
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setStatusMessage('');
        setSubmitting(true);

        const schoolPayload = {
            school_id: formData.school_id.trim().toLowerCase(),
            school_name: formData.school_name,
            country: formData.country,
            currency_symbol: formData.currency_symbol,
            contact_email: formData.contact_email,
            plan: formData.plan
        };

        const adminPayload = {
            username: formData.admin_username,
            password: formData.admin_password
        };

        const res = await registerSchool(schoolPayload, adminPayload);
        if (res.success) {
            setStatusMessage('School registered successfully!');
            setIsRegistering(false);
            setFormData({
                school_id: '',
                school_name: '',
                country: 'Pakistan',
                currency_symbol: 'RS',
                contact_email: '',
                plan: 'basic',
                admin_username: '',
                admin_password: ''
            });
            setTimeout(() => setStatusMessage(''), 4000);
        } else {
            setStatusMessage(`Error: ${error || 'Failed to register school'}`);
        }
        setSubmitting(false);
    };

    const toggleSchoolStatus = async (school) => {
        if (!window.confirm(`Are you sure you want to ${school.is_active ? 'deactivate' : 'reactivate'} ${school.school_name}?`)) return;
        
        setStatusMessage('Updating status...');
        if (school.is_active) {
            await deactivateSchool(school.school_id);
        } else {
            await reactivateSchool(school.school_id);
        }
        setStatusMessage('Status updated.');
        setTimeout(() => setStatusMessage(''), 3000);
    };

    const toggleSchoolPlan = async (school) => {
        const newPlan = school.plan === 'basic' ? 'pro' : 'basic';
        if (!window.confirm(`Are you sure you want to change ${school.school_name}'s plan to ${newPlan.toUpperCase()}?`)) return;

        setStatusMessage(`Upgrading plan to ${newPlan.toUpperCase()}...`);
        await updateSchoolPlan(school.school_id, newPlan);
        setStatusMessage(`Plan updated to ${newPlan.toUpperCase()}.`);
        setTimeout(() => setStatusMessage(''), 3000);
    };

    if (!isSuperAdmin) return <div style={{ padding: '3rem', textAlign: 'center' }}>Checking authorization...</div>;

    const totalSchools = schools.length;
    const activeSchools = schools.filter(s => s.is_active).length;

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
            {/* Navbar */}
            <nav style={{ background: '#0f172a', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <ShieldCheck size={28} color="#fbbf24" />
                    <div>
                        <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>SaaS Master Control</h1>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Super Admin</span>
                    </div>
                </div>
                <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                    <LogOut size={16} /> Logout
                </button>
            </nav>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
                {statusMessage && (
                    <div style={{ padding: '1rem', background: statusMessage.includes('Error') ? '#fee2e2' : '#dcfce7', color: statusMessage.includes('Error') ? '#991b1b' : '#166534', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 600, border: `1px solid ${statusMessage.includes('Error') ? '#f87171' : '#4ade80'}` }}>
                        {statusMessage}
                    </div>
                )}

                {/* Dashboard Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '1rem', borderTop: '4px solid #3b82f6' }}>
                        <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '50%', color: '#3b82f6' }}><Building size={24} /></div>
                        <div>
                            <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Tenants</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>{totalSchools}</div>
                        </div>
                    </div>
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '1rem', borderTop: '4px solid #10b981' }}>
                        <div style={{ background: '#ecfdf5', padding: '1rem', borderRadius: '50%', color: '#10b981' }}><CheckCircle size={24} /></div>
                        <div>
                            <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Active Subscriptions</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>{activeSchools}</div>
                        </div>
                    </div>
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '1rem', borderTop: '4px solid #f59e0b' }}>
                        <div style={{ background: '#fffbeb', padding: '1rem', borderRadius: '50%', color: '#f59e0b' }}><Database size={24} /></div>
                        <div>
                            <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Platform Status</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', paddingTop: '0.4rem' }}>Operational</div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <button onClick={() => setActiveTab('schools')} style={{ background: activeTab === 'schools' ? '#1e293b' : 'white', color: activeTab === 'schools' ? 'white' : '#64748b', border: '1px solid #e2e8f0', padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Database size={18} /> Tenant Registry
                    </button>
                    <button onClick={() => { setActiveTab('requests'); fetchRequests(); }} style={{ background: activeTab === 'requests' ? '#1e293b' : 'white', color: activeTab === 'requests' ? 'white' : '#64748b', border: '1px solid #e2e8f0', padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', position: 'relative' }}>
                        <ClipboardList size={18} /> Registration Requests
                        {pendingCount > 0 && (
                            <span style={{ background: '#ef4444', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.65rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginLeft: '2px' }}>{pendingCount}</span>
                        )}
                    </button>
                    <button onClick={() => setActiveTab('settings')} style={{ background: activeTab === 'settings' ? '#1e293b' : 'white', color: activeTab === 'settings' ? 'white' : '#64748b', border: '1px solid #e2e8f0', padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Settings size={18} /> Platform Settings
                    </button>
                    <button onClick={() => setActiveTab('analytics')} style={{ background: activeTab === 'analytics' ? '#1e293b' : 'white', color: activeTab === 'analytics' ? 'white' : '#64748b', border: '1px solid #e2e8f0', padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <BarChart size={18} /> Platform Analytics
                    </button>
                </div>

                {/* Main Content */}
                <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', overflow: 'hidden', marginBottom: '3rem' }}>
                    
                    {/* ──── TENANT REGISTRY ──── */}
                    {activeTab === 'schools' && (
                        <>
                            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>Registered Schools</h2>
                                <button onClick={() => setIsRegistering(!isRegistering)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#2563eb', color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}>
                                    {isRegistering ? <XCircle size={18} /> : <PlusCircle size={18} />}
                                    {isRegistering ? 'Cancel Registration' : 'Register New School'}
                                </button>
                            </div>

                            {isRegistering && (
                                <div style={{ padding: '2rem', background: '#eff6ff', borderBottom: '1px solid #bfdbfe' }} className="animate-fade-in">
                                    <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><PlusCircle size={20} /> Onboard New Tenant</h3>
                                    <form onSubmit={handleRegister} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Tenant Code (school_id)</label>
                                            <input required type="text" name="school_id" value={formData.school_id} onChange={handleChange} placeholder="e.g. acs-001" style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                            <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px', display: 'block' }}>Used for student/admin login routing. lowercase, no spaces.</span>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>School Name</label>
                                            <input required type="text" name="school_name" value={formData.school_name} onChange={handleChange} placeholder="Full School Name" style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Contact Email</label>
                                            <input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} placeholder="admin@school.com" style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Country</label>
                                                <input type="text" name="country" value={formData.country} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Currency</label>
                                                <input type="text" name="currency_symbol" value={formData.currency_symbol} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Subscription Plan</label>
                                            <select name="plan" value={formData.plan} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white' }}>
                                                <option value="basic">Basic (Limited Modules)</option>
                                                <option value="pro">Pro (Full Features)</option>
                                                <option value="enterprise">Enterprise (Custom)</option>
                                            </select>
                                        </div>
                                        <div style={{ gridColumn: '1 / -1', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '0.5rem' }}>
                                            <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: '#334155' }}>Initial Admin Credentials (auto-generated)</h4>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Admin Username</label>
                                                    <input required type="text" name="admin_username" value={formData.admin_username} onChange={handleChange} placeholder="admin_username" style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Admin Password</label>
                                                    <input required type="text" name="admin_password" value={formData.admin_password} onChange={handleChange} placeholder="Secure Password" style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ gridColumn: '1 / -1', textAlign: 'right', marginTop: '0.5rem' }}>
                                            <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '0.75rem 2rem', borderRadius: '8px', fontSize: '1rem', background: '#2563eb', color: 'white', border: 'none', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                                                {submitting ? 'Creating Tenant...' : 'Initialize School Environment'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            <div style={{ overflowX: 'auto', padding: '1rem' }}>
                                {loading ? (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading tenant database...</div>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                <th style={{ padding: '1rem', fontWeight: 700 }}>School ID</th>
                                                <th style={{ padding: '1rem', fontWeight: 700 }}>School Name</th>
                                                <th style={{ padding: '1rem', fontWeight: 700 }}>Contact</th>
                                                <th style={{ padding: '1rem', fontWeight: 700 }}>Reg. Date</th>
                                                <th style={{ padding: '1rem', fontWeight: 700 }}>Plan</th>
                                                <th style={{ padding: '1rem', fontWeight: 700 }}>Status</th>
                                                <th style={{ padding: '1rem', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {schools.map(s => (
                                                <tr key={s.school_id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                    <td style={{ padding: '1rem', fontWeight: 600, color: '#0f172a', fontFamily: 'monospace', fontSize: '0.85rem' }}>{s.school_id}</td>
                                                    <td style={{ padding: '1rem', fontWeight: 600, color: '#1e3a8a' }}>{s.school_name}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                            {s.contact_phone && (
                                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: '#374151', fontWeight: 500 }}>
                                                                    <Phone size={12} color="#6366f1" /> {s.contact_phone}
                                                                </span>
                                                            )}
                                                            {s.contact_email && (
                                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: '#374151', fontWeight: 500 }}>
                                                                    <Mail size={12} color="#10b981" /> {s.contact_email}
                                                                </span>
                                                            )}
                                                            {!s.contact_phone && !s.contact_email && (
                                                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>Not provided</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1rem', color: '#475569', fontSize: '0.85rem', fontWeight: 500 }}>
                                                        {new Date(s.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{ display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, background: s.plan === 'pro' ? '#fdf4ff' : '#f1f5f9', color: s.plan === 'pro' ? '#c026d3' : '#475569', textTransform: 'capitalize' }}>
                                                            {s.plan}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, background: s.is_active ? '#ecfdf5' : '#fef2f2', color: s.is_active ? '#059669' : '#dc2626' }}>
                                                            {s.is_active ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                            {s.is_active ? 'Active' : 'Suspended'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                        <button onClick={() => setViewingSchool(s)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                            <Info size={14} /> Insights
                                                        </button>
                                                        <button onClick={() => toggleSchoolPlan(s)} style={{ background: s.plan === 'pro' ? '#fdf4ff' : '#eff6ff', border: `1px solid ${s.plan === 'pro' ? '#f0abfc' : '#bfdbfe'}`, color: s.plan === 'pro' ? '#c026d3' : '#2563eb', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                                                            {s.plan === 'pro' ? 'Downgrade to Basic' : 'Upgrade to Pro'}
                                                        </button>
                                                        <button onClick={() => toggleSchoolStatus(s)} style={{ background: 'none', border: `1px solid ${s.is_active ? '#ef4444' : '#10b981'}`, color: s.is_active ? '#ef4444' : '#10b981', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                                                            {s.is_active ? 'Suspend' : 'Reactivate'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {schools.length === 0 && (
                                                <tr>
                                                    <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No schools registered yet.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </>
                    )}

                    {/* ──── REGISTRATION REQUESTS ──── */}
                    {activeTab === 'requests' && (
                        <div className="animate-fade-in">
                            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>School Registration Requests</h2>
                                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>Review and approve new school onboarding requests submitted via the landing page.</p>
                                </div>
                                <button onClick={fetchRequests} style={{ background: 'white', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    🔄 Refresh
                                </button>
                            </div>
                            <div style={{ padding: '1.5rem', overflowX: 'auto' }}>
                                {requestsLoading ? (
                                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading requests...</div>
                                ) : requests.length === 0 ? (
                                    <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                                        <ClipboardList size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                        <p style={{ margin: 0, fontWeight: 600 }}>No registration requests yet.</p>
                                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem' }}>When schools submit a registration form, they will appear here.</p>
                                    </div>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                <th style={{ padding: '0.8rem 1rem', fontWeight: 700, textAlign: 'left' }}>School Name</th>
                                                <th style={{ padding: '0.8rem 1rem', fontWeight: 700, textAlign: 'left' }}>Requested ID</th>
                                                <th style={{ padding: '0.8rem 1rem', fontWeight: 700, textAlign: 'left' }}>Contact</th>
                                                <th style={{ padding: '0.8rem 1rem', fontWeight: 700, textAlign: 'left' }}>Admin Creds</th>
                                                <th style={{ padding: '0.8rem 1rem', fontWeight: 700, textAlign: 'left' }}>Date</th>
                                                <th style={{ padding: '0.8rem 1rem', fontWeight: 700, textAlign: 'left' }}>Status</th>
                                                <th style={{ padding: '0.8rem 1rem', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {requests.map(req => (
                                                <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                    <td style={{ padding: '1rem', fontWeight: 700, color: '#1e3a8a' }}>
                                                        {req.school_name}
                                                        {req.address && <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400, marginTop: '2px' }}>{req.address}</div>}
                                                    </td>
                                                    <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.85rem', color: '#475569' }}>{req.requested_school_id || '—'}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                            {req.contact_phone && <span style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Phone size={12} color="#6366f1" />{req.contact_phone}</span>}
                                                            {req.contact_email && <span style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Mail size={12} color="#10b981" />{req.contact_email}</span>}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                                                            <span style={{ fontWeight: 600 }}>User:</span> {req.admin_username}<br />
                                                            <span style={{ fontWeight: 600 }}>Pass:</span> {req.admin_password}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.82rem' }}>{new Date(req.created_at).toLocaleDateString()}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{ display: 'inline-block', padding: '0.25rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700,
                                                            background: req.status === 'pending' ? '#fef3c7' : req.status === 'approved' ? '#dcfce7' : '#fee2e2',
                                                            color: req.status === 'pending' ? '#b45309' : req.status === 'approved' ? '#166534' : '#991b1b'
                                                        }}>{req.status?.toUpperCase() || 'PENDING'}</span>
                                                    </td>
                                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                        {req.status === 'pending' && (
                                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                                <button onClick={() => approveRequest(req)} style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '0.4rem 0.9rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                                    <CheckCircle size={14} /> Approve
                                                                </button>
                                                                <button onClick={() => rejectRequest(req)} style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '0.4rem 0.9rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                                    <XCircle size={14} /> Reject
                                                                </button>
                                                            </div>
                                                        )}
                                                        {req.status !== 'pending' && (
                                                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>No action needed</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ──── PLATFORM SETTINGS ──── */}
                    {activeTab === 'settings' && (
                        <div style={{ padding: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: '#0f172a' }}>Platform Branding & Contact</h2>
                            <p style={{ color: '#64748b', marginBottom: '2rem' }}>Changes here update the KHR Digital Labs landing page instantly.</p>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#475569', marginBottom: '0.4rem' }}>Business Name</label>
                                        <input type="text" value={saasForm.business_name} onChange={e => setSaasForm({...saasForm, business_name: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#475569', marginBottom: '0.4rem' }}>Support/Sales Email</label>
                                        <input type="email" value={saasForm.support_email} onChange={e => setSaasForm({...saasForm, support_email: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#475569', marginBottom: '0.4rem' }}>WhatsApp Number (with country code)</label>
                                        <input type="text" value={saasForm.whatsapp_number} onChange={e => setSaasForm({...saasForm, whatsapp_number: e.target.value})} placeholder="+923001234567" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                    </div>
                                    <div style={{ marginTop: '1rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
                                        <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: '#0f172a' }}>Notification API Settings</h4>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.75rem', color: '#64748b', marginBottom: '0.3rem' }}>WhatsApp API Key (Meta)</label>
                                            <input type="password" value={saasForm.whatsapp_api_key} onChange={e => setSaasForm({...saasForm, whatsapp_api_key: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                        </div>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.75rem', color: '#64748b', marginBottom: '0.3rem' }}>WhatsApp Phone ID</label>
                                            <input type="text" value={saasForm.whatsapp_phone_id} onChange={e => setSaasForm({...saasForm, whatsapp_phone_id: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.75rem', color: '#64748b', marginBottom: '0.3rem' }}>Email Service Key (EmailJS)</label>
                                            <input type="password" value={saasForm.email_service_key} onChange={e => setSaasForm({...saasForm, email_service_key: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#475569', marginBottom: '0.4rem' }}>Landing Hero Title</label>
                                        <input type="text" value={saasForm.hero_title} onChange={e => setSaasForm({...saasForm, hero_title: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#475569', marginBottom: '0.4rem' }}>Landing Hero Subtitle</label>
                                        <textarea value={saasForm.hero_subtitle} onChange={e => setSaasForm({...saasForm, hero_subtitle: e.target.value})} rows={4} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'none' }} />
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ marginTop: '2.5rem', textAlign: 'right' }}>
                                <button 
                                    onClick={async () => {
                                        setStatusMessage('Saving platform settings...');
                                        const { error } = await updateSaasInfo(saasForm);
                                        if (!error) {
                                            setStatusMessage('✅ SaaS branding updated successfully!');
                                            setTimeout(() => setStatusMessage(''), 3000);
                                        } else {
                                            setStatusMessage('Error: ' + error.message);
                                        }
                                    }}
                                    style={{ background: '#0f172a', color: 'white', border: 'none', padding: '1rem 3rem', borderRadius: '12px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ──── ANALYTICS ──── */}
                    {activeTab === 'analytics' && (
                        <div style={{ padding: '2.5rem', background: '#f8fafc' }} className="animate-fade-in">
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Activity size={24} color="#3b82f6" /> Real-time Platform Telemetry
                            </h2>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                                <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Managed Students</div>
                                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e293b' }}>{globalStats.students.toLocaleString()}</div>
                                    </div>
                                    <div style={{ background: '#dbeafe', color: '#2563eb', padding: '1.25rem', borderRadius: '50%' }}><Users size={32} /></div>
                                </div>
                                <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Active Faculty/Staff</div>
                                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e293b' }}>{globalStats.faculty.toLocaleString()}</div>
                                    </div>
                                    <div style={{ background: '#fce7f3', color: '#db2777', padding: '1.25rem', borderRadius: '50%' }}><Users size={32} /></div>
                                </div>
                                <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Platform Administrator Seats</div>
                                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e293b' }}>{globalStats.admins.toLocaleString()}</div>
                                    </div>
                                    <div style={{ background: '#f3e8ff', color: '#9333ea', padding: '1.25rem', borderRadius: '50%' }}><ShieldCheck size={32} /></div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1.5rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <TrendingUp size={20} color="#10b981" /> Tenant Growth Trajectory
                                    </h3>
                                    <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                                        {/* Mock chart bars for visual aesthetics */}
                                        {[40, 65, 45, 80, 55, 90, 75, 100].map((h, i) => (
                                            <div key={i} style={{ flex: 1, background: `linear-gradient(180deg, #3b82f6 0%, #93c5fd 100%)`, height: `${h}%`, borderRadius: '6px 6px 0 0', opacity: i === 7 ? 1 : 0.6, transition: 'height 1s ease-out' }}></div>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>
                                        <span>8 Months Ago</span>
                                        <span>Current Month ({activeSchools} Active)</span>
                                    </div>
                                </div>

                                <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1.5rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Database size={20} color="#f59e0b" /> Resource Allocation
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                                                <span>Database Storage Engine</span>
                                                <span style={{ color: '#10b981' }}>Healthy</span>
                                            </div>
                                            <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ width: '45%', height: '100%', background: '#10b981', borderRadius: '4px' }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                                                <span>Authentication Quota</span>
                                                <span style={{ color: '#3b82f6' }}>Optimal</span>
                                            </div>
                                            <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ width: '25%', height: '100%', background: '#3b82f6', borderRadius: '4px' }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                                                <span>Storage Buckets (Logos/Receipts)</span>
                                                <span style={{ color: '#8b5cf6' }}>Low Usage</span>
                                            </div>
                                            <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ width: '15%', height: '100%', background: '#8b5cf6', borderRadius: '4px' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ──── SCHOOL INSIGHTS MODAL ──── */}
                {viewingSchool && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                        <div style={{ background: 'white', maxWidth: '700px', width: '100%', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }} className="animate-fade-in">
                            <div style={{ padding: '2rem', background: '#0f172a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{viewingSchool.school_name}</h3>
                                    <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>Tenant Registry Insights</span>
                                </div>
                                <button onClick={() => setViewingSchool(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}>
                                    <XCircle size={24} />
                                </button>
                            </div>
                            
                            <div style={{ padding: '2.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                                    <div>
                                        <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Operational Region</div>
                                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{viewingSchool.country} ({viewingSchool.currency_symbol})</div>
                                    </div>
                                    <div>
                                        <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Registration Date</div>
                                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{new Date(viewingSchool.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Configuration Status</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: viewingSchool.is_onboarded ? '#10b981' : '#f59e0b', fontWeight: 700 }}>
                                            {viewingSchool.is_onboarded ? <CheckCircle size={16} /> : <Database size={16} />}
                                            {viewingSchool.is_onboarded ? 'Fully Onboarded' : 'Setup Pending'}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Mobile / Phone</div>
                                        <div style={{ fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <Phone size={14} color="#6366f1" />
                                            {viewingSchool.contact_phone || <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 400 }}>Not provided</span>}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Email Address</div>
                                        <div style={{ fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <Mail size={14} color="#10b981" />
                                            {viewingSchool.contact_email || <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 400 }}>Not provided</span>}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                    <h4 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e3a8a' }}>
                                        <ShieldCheck size={18} /> Deep Insights (Marketing Details)
                                    </h4>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                        <div>
                                            <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.3rem' }}>MISSION</div>
                                            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, color: '#475569' }}>
                                                {viewingSchool.school_info?.[0]?.about?.mission || 'Not yet defined by admin.'}
                                            </p>
                                        </div>
                                        <div>
                                            <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.3rem' }}>VISION</div>
                                            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, color: '#475569' }}>
                                                {viewingSchool.school_info?.[0]?.about?.vision || 'Not yet defined by admin.'}
                                            </p>
                                        </div>
                                        <div>
                                            <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.3rem' }}>PHYSICAL ADDRESS</div>
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>
                                                {viewingSchool.school_info?.[0]?.contact?.address || 'Not yet defined.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ padding: '1.5rem 2.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
                                <button onClick={() => setViewingSchool(null)} style={{ background: '#1e293b', color: 'white', border: 'none', padding: '0.7rem 2rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Close Insights</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuperAdminPortal;
