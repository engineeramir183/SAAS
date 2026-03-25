import React, { useState, useEffect } from 'react';
import { useSuperAdmin } from '../context/SuperAdminContext';
import { Building, ShieldCheck, PlusCircle, CheckCircle, XCircle, MoreVertical, LogOut, Users, Settings, Database } from 'lucide-react';

const SuperAdminPortal = ({ setCurrentPage, setIsSuperAdminPage }) => {
    const {
        isSuperAdmin,
        schools,
        loading,
        error,
        logoutSuperAdmin,
        fetchAllSchools,
        registerSchool,
        deactivateSchool,
        reactivateSchool
    } = useSuperAdmin();

    const [isRegistering, setIsRegistering] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

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

    useEffect(() => {
        if (!isSuperAdmin) {
            setCurrentPage('login');
            if (setIsSuperAdminPage) setIsSuperAdminPage(false);
        } else {
            fetchAllSchools();
        }
    }, [isSuperAdmin]);

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

                {/* Main Content */}
                <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
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
                                        <th style={{ padding: '1rem', fontWeight: 700 }}>Region</th>
                                        <th style={{ padding: '1rem', fontWeight: 700 }}>Plan</th>
                                        <th style={{ padding: '1rem', fontWeight: 700 }}>Status</th>
                                        <th style={{ padding: '1rem', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {schools.map(s => (
                                        <tr key={s.school_id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '1rem', fontWeight: 600, color: '#0f172a', fontFamily: 'monospace' }}>{s.school_id}</td>
                                            <td style={{ padding: '1rem', fontWeight: 600, color: '#1e3a8a' }}>{s.school_name}</td>
                                            <td style={{ padding: '1rem', color: '#475569', fontSize: '0.9rem' }}>{s.country} ({s.currency_symbol})</td>
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
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
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
                </div>
            </div>
        </div>
    );
};

export default SuperAdminPortal;
