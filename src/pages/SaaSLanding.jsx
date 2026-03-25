import React, { useEffect } from 'react';
import { ShieldCheck, MonitorSmartphone, BrainCircuit, Wallet, BarChart, Globe, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useSuperAdmin } from '../context/SuperAdminContext';

const SaaSLanding = ({ setCurrentPage }) => {
    const { saasInfo, fetchSaasInfo } = useSuperAdmin();

    useEffect(() => {
        if (!saasInfo) fetchSaasInfo();
    }, []);

    const businessName = saasInfo?.business_name || 'KHR Digital Labs';
    const supportEmail = saasInfo?.support_email || 'sales@khrdigitallabs.com';
    const whatsappNum = saasInfo?.whatsapp_number || '+92 300 1333275';
    const heroTitle = saasInfo?.hero_title || 'Enterprise SaaS for Modern Institutions.';
    const heroSubtitle = saasInfo?.hero_subtitle || 'Engineered by KHR Digital Labs. The definitive Multi-Tenant cloud platform to instantly deploy, scale, and manage educational environments safely.';

    return (
        <div style={{ fontFamily: "'Inter', sans-serif", background: '#f8fafc', color: '#0f172a', minHeight: '100vh', overflowX: 'hidden' }}>
            
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 5%', background: 'white', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', padding: '0.6rem', borderRadius: '10px', color: 'white' }}>
                        <MonitorSmartphone size={24} />
                    </div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.5px', color: '#1e293b' }}>{businessName.split(' ')[0]} <span style={{ color: '#0f172a', fontWeight: 400 }}>{businessName.split(' ').slice(1).join(' ')}</span></span>
                </div>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', fontWeight: 600, fontSize: '0.95rem', color: '#64748b' }}>
                    <a href="#features" style={{ textDecoration: 'none', color: 'inherit', transition: 'color 0.2s' }}>Features</a>
                    <a href="#pricing" style={{ textDecoration: 'none', color: 'inherit', transition: 'color 0.2s' }}>Pricing</a>
                    <a href="#contact" style={{ textDecoration: 'none', color: 'inherit', transition: 'color 0.2s' }}>Contact</a>
                    <button onClick={() => setCurrentPage('login')} style={{ background: '#f1f5f9', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', color: '#0f172a', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}>Client Login</button>
                    <a href="#contact" style={{ textDecoration: 'none', display: 'inline-block', background: '#2563eb', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', color: 'white', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px 0 rgba(37,99,235,0.39)' }}>Start Free Trial</a>
                </div>
            </header>

            {/* Hero Section */}
            <section style={{ textAlign: 'center', padding: '8rem 5% 6rem', background: 'linear-gradient(180deg, #f8fafc 0%, #eff6ff 100%)', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '10%', left: '5%', width: '300px', height: '300px', background: 'rgba(59, 130, 246, 0.1)', filter: 'blur(100px)', borderRadius: '50%' }}></div>
                <div style={{ position: 'absolute', top: '20%', right: '5%', width: '400px', height: '400px', background: 'rgba(99, 102, 241, 0.1)', filter: 'blur(120px)', borderRadius: '50%' }}></div>
                
                <h1 style={{ fontSize: '4.5rem', fontWeight: 900, lineHeight: 1.1, margin: '0 0 1.5rem', color: '#0f172a', textShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                    {heroTitle.includes('for') ? (
                        <>
                            {heroTitle.split('for')[0]}for<br/>
                            <span style={{ background: 'linear-gradient(135deg, #0f172a, #334155)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{heroTitle.split('for')[1] || 'Modern Institutions.'}</span>
                        </>
                    ) : heroTitle}
                </h1>
                <p style={{ fontSize: '1.25rem', color: '#475569', maxWidth: '750px', margin: '0 auto 3rem', lineHeight: 1.6 }}>
                    {heroSubtitle}
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <a href="#contact" style={{ textDecoration: 'none', background: '#0f172a', color: 'white', border: 'none', padding: '1rem 2.5rem', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 10px 25px -5px rgba(15,23,42,0.4)' }}>
                        Register Your School Today <ArrowRight size={20} />
                    </a>
                    <a href="?school=acs-001" style={{ textDecoration: 'none', background: 'white', color: '#0f172a', border: '1px solid #e2e8f0', padding: '1rem 2.5rem', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        View Demo Environment
                    </a>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" style={{ padding: '6rem 5%', background: 'white' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 1rem' }}>Built for the Modern Campus</h2>
                    <p style={{ fontSize: '1.1rem', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>Everything you need to automate your institution without writing a single line of code.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ padding: '2.5rem', borderRadius: '24px', background: '#f8fafc', border: '1px solid #e2e8f0', transition: 'transform 0.3s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                        <div style={{ background: '#dbeafe', color: '#2563eb', padding: '1rem', borderRadius: '16px', display: 'inline-block', marginBottom: '1.5rem' }}>
                            <Wallet size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 1rem' }}>Dynamic Fee Tracking</h3>
                        <p style={{ color: '#475569', lineHeight: 1.6 }}>Generate bulk PDF fee challans, register partial payments, track historical defaults, and print custom receipts mapped to your specific branding.</p>
                    </div>

                    <div style={{ padding: '2.5rem', borderRadius: '24px', background: '#f8fafc', border: '1px solid #e2e8f0', transition: 'transform 0.3s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                        <div style={{ background: '#fce7f3', color: '#ec4899', padding: '1rem', borderRadius: '16px', display: 'inline-block', marginBottom: '1.5rem' }}>
                            <ShieldCheck size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 1rem' }}>Multi-Tenant Security</h3>
                        <p style={{ color: '#475569', lineHeight: 1.6 }}>Your data is walled off via advanced Row-Level Security (RLS). You get a unique 'School ID', enabling custom currencies and logos instantly.</p>
                    </div>

                    <div style={{ padding: '2.5rem', borderRadius: '24px', background: '#f8fafc', border: '1px solid #e2e8f0', transition: 'transform 0.3s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                        <div style={{ background: '#f3e8ff', color: '#9333ea', padding: '1rem', borderRadius: '16px', display: 'inline-block', marginBottom: '1.5rem' }}>
                            <BarChart size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 1rem' }}>Automated Gradebooks</h3>
                        <p style={{ color: '#475569', lineHeight: 1.6 }}>Print terminal report cards, calculate aggregate percentages, establish custom grade boundaries, and generate rank sheets dynamically.</p>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" style={{ padding: '6rem 5%', background: '#0f172a', color: 'white' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 1rem' }}>Transparent SaaS Pricing</h2>
                    <p style={{ fontSize: '1.1rem', color: '#94a3b8', maxWidth: '600px', margin: '0 auto' }}>Grow your digital infrastructure predictably. Choose the plan that fits.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
                    {/* Basic Plan */}
                    <div style={{ background: '#1e293b', borderRadius: '24px', padding: '3rem 2rem', border: '1px solid #334155' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Starter</h3>
                        <div style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '2rem', color: 'white' }}>$49<span style={{ fontSize: '1rem', fontWeight: 500, color: '#94a3b8' }}>/mo</span></div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', color: '#cbd5e1' }}>
                            <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}><CheckCircle2 size={18} color="#2563eb" /> Up to 500 Students</li>
                            <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}><CheckCircle2 size={18} color="#2563eb" /> 5 Admin Accounts</li>
                            <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}><CheckCircle2 size={18} color="#2563eb" /> Standard Fee Tracking</li>
                            <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}><CheckCircle2 size={18} color="#2563eb" /> Basic Global Reporting</li>
                        </ul>
                        <button style={{ width: '100%', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '1rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>Start Starter Trial</button>
                    </div>

                    {/* Pro Plan */}
                    <div style={{ background: 'linear-gradient(180deg, #1e3a8a 0%, #172554 100%)', borderRadius: '24px', padding: '3rem 2rem', border: '2px solid #3b82f6', position: 'relative', transform: 'scale(1.05)', zIndex: 10 }}>
                        <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: '#3b82f6', color: 'white', padding: '0.4rem 1rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>Most Popular</div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Professional</h3>
                        <div style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '2rem', color: 'white' }}>$99<span style={{ fontSize: '1rem', fontWeight: 500, color: '#94a3b8' }}>/mo</span></div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', color: '#cbd5e1' }}>
                            <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}><CheckCircle2 size={18} color="#60a5fa" /> Unlimited Students</li>
                            <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}><CheckCircle2 size={18} color="#60a5fa" /> Unlimited Admins</li>
                            <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}><CheckCircle2 size={18} color="#60a5fa" /> P&L Expense Tracking</li>
                            <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}><CheckCircle2 size={18} color="#60a5fa" /> Dynamic Custom Logos</li>
                            <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}><CheckCircle2 size={18} color="#60a5fa" /> WhatsApp Bot Integation</li>
                        </ul>
                        <button style={{ width: '100%', background: '#3b82f6', color: 'white', border: 'none', padding: '1rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px 0 rgba(59,130,246,0.39)' }}>Upgrade to Professional</button>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" style={{ padding: '6rem 5%', background: '#f8fafc' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 1rem', color: '#0f172a' }}>Ready to Modernize Your Campus?</h2>
                    <p style={{ fontSize: '1.1rem', color: '#475569', marginBottom: '3rem' }}>Get in touch with KHR Digital Labs to set up your free trial environment.</p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'white', padding: '3rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
                        <div>
                            <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.3rem' }}>Sales & Onboarding</div>
                            <a href={`mailto:${supportEmail}`} style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}>{supportEmail}</a>
                        </div>
                        <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '1rem 0' }} />
                        <div>
                            <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.3rem' }}>Direct Line (WhatsApp)</div>
                            <a href={`https://wa.me/${whatsappNum.replace(/\+/g, '').replace(/\s/g, '')}`} target="_blank" rel="noreferrer" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981', textDecoration: 'none' }}>{whatsappNum}</a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ background: '#0f172a', padding: '3rem 5%', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <MonitorSmartphone size={20} />
                    <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>{businessName}</span>
                </div>
                <div style={{ fontSize: '0.85rem' }}>© {new Date().getFullYear()} {businessName}. All rights reserved.</div>
            </footer>
        </div>
    );
};

export default SaaSLanding;
