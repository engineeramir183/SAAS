import React, { useEffect, useState } from 'react';
import {
    ShieldCheck, MonitorSmartphone, BrainCircuit, Wallet, BarChart, Globe,
    ArrowRight, CheckCircle, Users, GraduationCap, Zap, Star,
    Building, Bell, FileText, ChevronRight, Menu, X, Award,
    Clock, TrendingUp, Smartphone, Lock, LogIn
} from 'lucide-react';
import { useSuperAdmin } from '../context/SuperAdminContext';

// ─── Animated Counter ─────────────────────────────────────────────────────────
const Counter = ({ end, suffix = '' }) => {
    const [val, setVal] = useState(0);
    useEffect(() => {
        let start = 0;
        const step = Math.ceil(end / 60);
        const timer = setInterval(() => {
            start += step;
            if (start >= end) { setVal(end); clearInterval(timer); }
            else setVal(start);
        }, 20);
        return () => clearInterval(timer);
    }, [end]);
    return <span>{val.toLocaleString()}{suffix}</span>;
};

const SaaSLanding = ({ setCurrentPage }) => {
    const { saasInfo, fetchSaasInfo } = useSuperAdmin();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (!saasInfo) fetchSaasInfo();
    }, []);

    const businessName = saasInfo?.business_name || 'KHR Digital Labs';
    const supportEmail = saasInfo?.support_email || 'sales@khrdigitallabs.com';
    const whatsappNum = saasInfo?.whatsapp_number || '+92 300 1333275';
    const heroTitle = saasInfo?.hero_title || 'The All-in-One School OS for Modern Institutions.';
    const heroSubtitle = saasInfo?.hero_subtitle || 'Engineered by KHR Digital Labs — the definitive multi-tenant cloud platform to instantly deploy, scale, and manage entire school ecosystems from a single dashboard.';

    const features = [
        { icon: Wallet, color: '#2563eb', bg: '#dbeafe', title: 'Dynamic Fee Management', desc: 'Generate bulk PDF challans, record partial payments, enforce custom discount policies, and print branded receipts — in seconds.' },
        { icon: ShieldCheck, color: '#ec4899', bg: '#fce7f3', title: 'Multi-Tenant Security', desc: 'Each school gets a unique School ID. Data is walled by Row-Level Security in Supabase so tenants never see each other\'s data.' },
        { icon: BarChart, color: '#9333ea', bg: '#f3e8ff', title: 'Automated Gradebooks', desc: 'Print terminal report cards, calculate aggregates, set custom grade boundaries, and generate rank sheets dynamically.' },
        { icon: Bell, color: '#f59e0b', bg: '#fef3c7', title: 'WhatsApp Automation', desc: 'Send instant absence alerts, fee reminders, and admission confirmations via the official Meta WhatsApp Business Cloud API.' },
        { icon: GraduationCap, color: '#10b981', bg: '#d1fae5', title: 'Student Portal & QR', desc: 'Students access results, fee records and announcements via a secure portal. QR attendance scanning reduces roll call time by 80%.' },
        { icon: Building, color: '#ef4444', bg: '#fee2e2', title: 'HR & Payroll', desc: 'Process monthly salaries, generate professional payslips, track allowances and deductions for every staff member.' },
        { icon: FileText, color: '#0369a1', bg: '#e0f2fe', title: 'Website CMS', desc: 'Publish blogs, manage public school facilities and staff pages — all synced live to the school\'s dedicated public website.' },
        { icon: TrendingUp, color: '#7c3aed', bg: '#ede9fe', title: 'Business Intelligence', desc: 'Dashboard analytics track monthly P&L, fee collection rate, attendance trends, and real-time enrollment growth.' },
    ];

    const plans = [
        {
            name: 'Starter', price: '$49', period: '/mo',
            desc: 'Perfect for small schools under 500 students.',
            color: '#3b82f6', bordered: false,
            features: ['Up to 500 Students', '5 Staff Accounts', 'Fee & Attendance Module', 'Student Portal', 'Email Support'],
            cta: 'Get Started'
        },
        {
            name: 'Professional', price: '$99', period: '/mo',
            desc: 'Full power for growing institutions.',
            color: '#6366f1', bordered: true, popular: true,
            features: ['Unlimited Students', 'Unlimited Staff', 'All Starter Features', 'P&L Expense Tracker', 'QR Scanner + WhatsApp API', 'Report Cards + Gradebook', 'HR & Payroll Module', 'Priority Support'],
            cta: 'Upgrade to Pro'
        },
        {
            name: 'Enterprise', price: 'Custom', period: '',
            desc: 'For chains and government institutions.',
            color: '#0f172a', bordered: false,
            features: ['Multi-Branch Support', 'Custom Integrations', 'Dedicated Account Manager', 'SLA Guarantee', 'White-Label Option'],
            cta: 'Contact Sales'
        }
    ];

    const testimonials = [
        { name: 'Ahmed Khan', role: 'Principal, Iqra Public School', text: 'We replaced 4 separate tools with this system. Fee collection improved by 60% in the first month. The WhatsApp alerts alone save us hours of phone calls every week.', rating: 5 },
        { name: 'Sara Malik', role: 'Admin, Bright Future Academy', text: 'The report card generator is a game changer. What used to take our teachers 2 days now takes 20 minutes. Absolutely worth every rupee.', rating: 5 },
        { name: 'Tariq Hussain', role: 'Director, Horizon Institute', text: 'The multi-tenant isolation gives us peace of mind. Each branch has its own environment but we can monitor everything from a single super admin panel.', rating: 5 },
    ];

    const stats = [
        { value: 200, suffix: '+', label: 'Schools Onboarded' },
        { value: 50000, suffix: '+', label: 'Students Managed' },
        { value: 98, suffix: '%', label: 'Uptime SLA' },
        { value: 4.9, suffix: '★', label: 'Average Rating' },
    ];

    return (
        <div style={{ fontFamily: "'Inter', sans-serif", background: '#f8fafc', color: '#0f172a', minHeight: '100vh', overflowX: 'hidden' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
                * { font-family: 'Inter', sans-serif; }
                
                /* Animations */
                @keyframes fadeUp {
                    0% { opacity: 0; transform: translateY(30px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                @keyframes scaleIn {
                    0% { opacity: 0; transform: scale(0.95); }
                    100% { opacity: 1; transform: scale(1); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-15px); }
                }
                @keyframes gradientPulse {
                    0% { opacity: 0.6; }
                    50% { opacity: 0.9; }
                    100% { opacity: 0.6; }
                }

                .animate-fade-up { animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-scale-in { animation: scaleIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .delay-100 { animation-delay: 100ms; opacity: 0; }
                .delay-200 { animation-delay: 200ms; opacity: 0; }
                .delay-300 { animation-delay: 300ms; opacity: 0; }
                .delay-400 { animation-delay: 400ms; opacity: 0; }

                .nav-link { text-decoration: none; color: #64748b; font-weight: 600; transition: color 0.2s; }
                .nav-link:hover { color: #0f172a; }
                
                .feat-card { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); border: 1px solid rgba(255, 255, 255, 0.7); }
                .feat-card:hover { transform: translateY(-8px); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.1) !important; background: white; }
                
                .testi-card { transition: transform 0.3s; }
                .testi-card:hover { transform: translateY(-4px); }
                
                .btn-primary {
                    background: linear-gradient(135deg, #2563eb, #6366f1);
                    color: white;
                    border: none;
                    box-shadow: 0 8px 25px -5px rgba(37, 99, 235, 0.5);
                    transition: all 0.3s ease;
                }
                .btn-primary:hover {
                    box-shadow: 0 12px 35px -5px rgba(37, 99, 235, 0.6);
                    transform: translateY(-2px);
                }

                .btn-secondary {
                    background: white;
                    color: #0f172a;
                    border: 2px solid #e2e8f0;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                    transition: all 0.3s ease;
                }
                .btn-secondary:hover {
                    border-color: #cbd5e1;
                    box-shadow: 0 8px 20px rgba(0,0,0,0.08);
                    transform: translateY(-2px);
                }

                @media (max-width: 768px) {
                    .hero-title { font-size: 2.6rem !important; }
                    .hero-btns { flex-direction: column !important; align-items: stretch !important; }
                    .stats-grid { grid-template-columns: 1fr 1fr !important; }
                    .features-grid { grid-template-columns: 1fr !important; }
                    .plans-grid { grid-template-columns: 1fr !important; }
                    .testi-grid { grid-template-columns: 1fr !important; }
                    .desktop-nav { display: none !important; }
                    .mobile-nav-items { display: flex !important; }
                    .footer-inner { flex-direction: column !important; gap: 1rem; text-align: center; }
                    .mockup-container { margin-top: 3rem !important; }
                }
                @media (min-width: 769px) { 
                    .mobile-nav-items { display: none !important; } 
                }
            `}</style>

            {/* ── NAV ── */}
            <header style={{ 
                background: 'rgba(255, 255, 255, 0.85)', 
                backdropFilter: 'blur(24px)', 
                WebkitBackdropFilter: 'blur(24px)',
                borderBottom: '1px solid rgba(226, 232, 240, 0.8)', 
                padding: '0 5%', 
                position: 'fixed', 
                top: 0, left: 0, right: 0,
                zIndex: 1000, 
                height: '76px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                transition: 'all 0.3s ease'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => window.scrollTo(0,0)}>
                    <div style={{ background: 'linear-gradient(135deg, #2563eb, #6366f1)', padding: '0.6rem', borderRadius: '12px', color: 'white', display: 'flex', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)' }}>
                        <MonitorSmartphone size={24} strokeWidth={2.5} />
                    </div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.5px', color: '#0f172a' }}>{businessName}</span>
                </div>

                <nav className="desktop-nav" style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
                    {[['#features', 'Features'], ['#pricing', 'Pricing'], ['#testimonials', 'Reviews'], ['#contact', 'Contact']].map(([href, label]) => (
                        <a key={href} href={href} className="nav-link" style={{ fontSize: '1rem' }}>{label}</a>
                    ))}
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginLeft: '1rem' }}>
                        <button onClick={() => setCurrentPage('login')} style={{ background: 'transparent', border: 'none', color: '#4f46e5', fontWeight: 800, cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'opacity 0.2s' }} onMouseOver={e => e.currentTarget.style.opacity = 0.8} onMouseOut={e => e.currentTarget.style.opacity = 1}>
                            <LogIn size={18} /> Client Login
                        </button>
                        <button onClick={() => setCurrentPage('register')} className="btn-primary" style={{ padding: '0.7rem 1.6rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', fontSize: '1rem' }}>
                            Register School
                        </button>
                    </div>
                </nav>

                <div className="mobile-nav-items" style={{ display: 'none', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => setCurrentPage('login')} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.55rem 1rem', borderRadius: '10px', color: '#2563eb', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <LogIn size={16} /> Login
                    </button>
                    <button onClick={() => setMobileMenuOpen(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0f172a', display: 'flex', alignItems: 'center', padding: '0.2rem' }}>
                        {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </header>

            {/* Mobile Nav Drawer */}
            {mobileMenuOpen && (
                <div className="animate-fade-up" style={{ background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(20px)', padding: '2rem 5%', borderBottom: '1px solid #e2e8f0', position: 'fixed', top: '76px', left: 0, right: 0, zIndex: 999, display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                    {[['#features', 'Features'], ['#pricing', 'Pricing'], ['#testimonials', 'Reviews'], ['#contact', 'Contact']].map(([href, label]) => (
                        <a key={href} href={href} onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#0f172a', fontWeight: 800, fontSize: '1.2rem', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>{label}</a>
                    ))}
                    <button onClick={() => { setCurrentPage('register'); setMobileMenuOpen(false); }} className="btn-primary" style={{ padding: '1rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', fontSize: '1.1rem', textAlign: 'center', marginTop: '0.5rem' }}>
                        Register Your School
                    </button>
                </div>
            )}

            {/* ── HERO ── */}
            <section style={{ 
                padding: '11rem 5% 4rem', 
                background: 'radial-gradient(ellipse at top, #f8fafc 0%, #eef2ff 100%)', 
                position: 'relative', 
                overflow: 'hidden',
                textAlign: 'center'
            }}>
                {/* Mesh Gradient Orbs */}
                <div style={{ animation: 'gradientPulse 8s infinite alternate', position: 'absolute', top: '10%', left: '10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 60%)', borderRadius: '50%', pointerEvents: 'none', filter: 'blur(40px)' }} />
                <div style={{ animation: 'gradientPulse 10s infinite alternate', position: 'absolute', top: '20%', right: '5%', width: '35vw', height: '35vw', background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 60%)', borderRadius: '50%', pointerEvents: 'none', filter: 'blur(40px)' }} />

                <div className="animate-fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '50px', padding: '0.5rem 1.25rem', fontSize: '0.85rem', fontWeight: 800, color: '#4f46e5', marginBottom: '2rem', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                    <Zap size={16} fill="#4f46e5" /> Powered by Supabase + React · 200+ Schools
                </div>

                <h1 className="hero-title animate-fade-up delay-100" style={{ fontSize: '4.5rem', fontWeight: 900, lineHeight: 1.05, margin: '0 0 1.5rem', color: '#0f172a', maxWidth: '950px', marginLeft: 'auto', marginRight: 'auto', letterSpacing: '-1.5px' }}>
                    {heroTitle.includes('for') ? (
                        <>
                            {heroTitle.split('for')[0]}
                            <span style={{ background: 'linear-gradient(135deg, #2563eb, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>for {heroTitle.split('for').slice(1).join('for')}</span>
                        </>
                    ) : <span style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a8a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{heroTitle}</span>}
                </h1>

                <p className="animate-fade-up delay-200" style={{ fontSize: '1.25rem', color: '#475569', maxWidth: '750px', margin: '0 auto 3rem', lineHeight: 1.6 }}>{heroSubtitle}</p>

                <div className="hero-btns animate-fade-up delay-300" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 10 }}>
                    <button
                        onClick={() => setCurrentPage('register')}
                        className="btn-primary"
                        style={{ padding: '1.1rem 2.75rem', borderRadius: '16px', fontSize: '1.15rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}
                    >
                        Register Your School <ArrowRight size={22} />
                    </button>
                    <a href="?school=acs-001" className="btn-secondary" style={{ textDecoration: 'none', padding: '1.1rem 2.75rem', borderRadius: '16px', fontSize: '1.15rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Globe size={22} color="#64748b" /> Live Demo
                    </a>
                </div>

                {/* Trust row */}
                <div className="animate-fade-up delay-400" style={{ marginTop: '3rem', display: 'flex', gap: '2rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', color: '#64748b', fontSize: '0.9rem', fontWeight: 700 }}>
                    {['✅ No Credit Card Required', '🔒 Bank-Grade RLS Security', '⚡ 2-min Setup', '🇵🇰 Made for Pakistan'].map(t => (
                        <span key={t}>{t}</span>
                    ))}
                </div>

                {/* Dashboard Mockup Image */}
                <div className="mockup-container animate-scale-in delay-400" style={{ marginTop: '5rem', position: 'relative', maxWidth: '1100px', margin: '5rem auto 0', perspective: '1000px' }}>
                    <div style={{ animation: 'float 6s ease-in-out infinite', position: 'relative' }}>
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 60%, #f8fafc 100%)', zIndex: 2, pointerEvents: 'none' }} />
                        <img 
                            src="/dashboard-mockup.png" 
                            alt="Dashboard Interface Preview" 
                            style={{ width: '100%', height: 'auto', borderRadius: '24px 24px 0 0', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.5)', borderBottom: 'none' }} 
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    </div>
                </div>
            </section>

            {/* ── STATS TICKER ── */}
            <section style={{ background: '#0f172a', padding: '4rem 5%', position: 'relative', zIndex: 3 }}>
                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
                    {stats.map(({ value, suffix, label }) => (
                        <div key={label}>
                            <div style={{ fontSize: '3rem', fontWeight: 900, color: 'white', lineHeight: 1, marginBottom: '0.5rem', background: 'linear-gradient(135deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                <Counter end={value} suffix={suffix} />
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section id="features" style={{ padding: '8rem 5%', background: '#f8fafc' }}>
                <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                    <span style={{ display: 'inline-block', background: '#e0e7ff', color: '#4f46e5', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '0.5rem 1.25rem', borderRadius: '50px', marginBottom: '1.25rem' }}>Features</span>
                    <h2 style={{ fontSize: '3rem', fontWeight: 900, margin: '0 0 1rem', lineHeight: 1.1, color: '#0f172a', letterSpacing: '-0.5px' }}>Everything Your Institution Needs</h2>
                    <p style={{ fontSize: '1.15rem', color: '#64748b', maxWidth: '650px', margin: '0 auto', lineHeight: 1.6 }}>Replace your spreadsheets and fragmented tools with one unified platform built specifically for South Asian schools.</p>
                </div>

                <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                    {features.map(({ icon: Icon, color, bg, title, desc }) => (
                        <div key={title} className="feat-card" style={{ padding: '2.5rem', borderRadius: '24px', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', cursor: 'default' }}>
                            <div style={{ background: bg, color, padding: '1rem', borderRadius: '16px', display: 'inline-flex', marginBottom: '1.5rem' }}>
                                <Icon size={32} strokeWidth={2.5} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: '0 0 0.75rem', color: '#0f172a' }}>{title}</h3>
                            <p style={{ color: '#475569', lineHeight: 1.7, margin: 0, fontSize: '0.95rem' }}>{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section style={{ padding: '6rem 5%', background: 'linear-gradient(180deg, #f8fafc 0%, #eff6ff 100%)' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '3rem', fontWeight: 900, margin: '0 0 1rem', letterSpacing: '-0.5px' }}>One Platform. Infinite Scale.</h2>
                    <p style={{ color: '#64748b', fontSize: '1.15rem', maxWidth: '550px', margin: '0 auto' }}>From registration to payroll — every workflow is connected.</p>
                </div>
                <div style={{ display: 'flex', gap: '0', maxWidth: '1000px', margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {[
                        { step: '01', icon: Lock, title: 'Super Admin Onboards School', desc: 'Register a new tenant in 60 seconds. Auto-seeds admin credentials and school profile.' },
                        { step: '02', icon: Users, title: 'Admin Configures School', desc: 'Upload logo, set classes, add faculty, configure fee structure and grading weights.' },
                        { step: '03', icon: Smartphone, title: 'Portal Goes Live', desc: 'Students and parents get instant access to results, fees, attendance, and announcements.' },
                    ].map(({ step, icon: Icon, title, desc }, idx) => (
                        <div key={step} style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2rem', position: 'relative' }}>
                            {idx < 2 && <div style={{ position: 'absolute', right: 0, top: '35%', color: '#cbd5e1', fontSize: '2rem', display: 'none' }}><ChevronRight /></div>}
                            <div style={{ width: '72px', height: '72px', background: 'linear-gradient(135deg, #2563eb, #6366f1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: '1.25rem', boxShadow: '0 10px 25px rgba(37,99,235,0.4)' }}>
                                <Icon size={32} strokeWidth={2.5} />
                            </div>
                            <div style={{ background: '#e2e8f0', color: '#475569', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '1.5px', padding: '0.35rem 0.8rem', borderRadius: '50px', marginBottom: '1rem' }}>STEP {step}</div>
                            <h4 style={{ fontWeight: 900, fontSize: '1.15rem', marginBottom: '0.5rem', color: '#0f172a' }}>{title}</h4>
                            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.7, margin: 0 }}>{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── TESTIMONIALS ── */}
            <section id="testimonials" style={{ padding: '8rem 5%', background: 'white' }}>
                <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                    <span style={{ display: 'inline-block', background: '#fef3c7', color: '#d97706', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '0.5rem 1.25rem', borderRadius: '50px', marginBottom: '1.25rem' }}>Testimonials</span>
                    <h2 style={{ fontSize: '3rem', fontWeight: 900, margin: '0 0 1rem', letterSpacing: '-0.5px' }}>Loved by Educators</h2>
                    <p style={{ color: '#64748b', fontSize: '1.15rem', maxWidth: '500px', margin: '0 auto' }}>Real feedback from school administrators across Pakistan.</p>
                </div>

                <div className="testi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '1150px', margin: '0 auto' }}>
                    {testimonials.map(({ name, role, text, rating }) => (
                        <div key={name} className="testi-card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem', color: '#f59e0b' }}>
                                {[...Array(rating)].map((_, i) => <Star key={i} size={18} fill="#f59e0b" stroke="none" />)}
                            </div>
                            <p style={{ color: '#334155', lineHeight: 1.8, fontSize: '1rem', marginBottom: '2rem', fontStyle: 'italic', fontWeight: 500 }}>"{text}"</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #2563eb, #6366f1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(37,99,235,0.3)' }}>
                                    {name[0]}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '1rem' }}>{name}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── PRICING ── */}
            <section id="pricing" style={{ padding: '8rem 5%', background: '#0f172a', color: 'white' }}>
                <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                    <span style={{ display: 'inline-block', background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '0.5rem 1.25rem', borderRadius: '50px', marginBottom: '1.25rem' }}>Pricing</span>
                    <h2 style={{ fontSize: '3rem', fontWeight: 900, margin: '0 0 1rem', letterSpacing: '-0.5px' }}>Transparent SaaS Pricing</h2>
                    <p style={{ fontSize: '1.15rem', color: '#94a3b8', maxWidth: '550px', margin: '0 auto' }}>Grow your digital infrastructure predictably. No hidden fees, no lock-in.</p>
                </div>

                <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
                    {plans.map(({ name, price, period, desc, color, bordered, popular, features: pf, cta }) => (
                        <div key={name} style={{
                            background: popular ? `linear-gradient(160deg, #1e3a8a 0%, #172554 100%)` : '#1e293b',
                            borderRadius: '24px', padding: '3rem 2.5rem',
                            border: bordered ? `2px solid ${color}` : '1px solid #334155',
                            position: 'relative', transform: popular ? 'scale(1.05)' : 'scale(1)',
                            boxShadow: popular ? '0 25px 50px rgba(0,0,0,0.3)' : 'none', zIndex: popular ? 10 : 1
                        }}>
                            {popular && <div style={{ position: 'absolute', top: '-16px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #6366f1, #ec4899)', color: 'white', padding: '0.4rem 1.5rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', whiteSpace: 'nowrap', boxShadow: '0 4px 10px rgba(99,102,241,0.4)' }}>⭐ Most Popular</div>}
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, margin: '0 0 0.5rem', color: 'white' }}>{name}</h3>
                            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>{desc}</p>
                            <div style={{ fontSize: '3.5rem', fontWeight: 900, color: 'white', lineHeight: 1, marginBottom: '2.5rem', letterSpacing: '-1px' }}>
                                {price}<span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#94a3b8' }}>{period}</span>
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {pf.map(f => (
                                    <li key={f} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 500 }}>
                                        <CheckCircle size={18} color={color} strokeWidth={2.5} style={{ flexShrink: 0 }} /> {f}
                                    </li>
                                ))}
                            </ul>
                            <a href="#contact" style={{ textDecoration: 'none', display: 'block', width: '100%', padding: '1.1rem', borderRadius: '14px', textAlign: 'center', fontWeight: 800, fontSize: '1.05rem', cursor: 'pointer', background: popular ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.1)', color: 'white', boxShadow: popular ? '0 8px 20px rgba(99,102,241,0.4)' : 'none', border: popular ? 'none' : '1px solid rgba(255,255,255,0.15)', transition: 'all 0.3s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                {cta}
                            </a>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CONTACT ── */}
            <section id="contact" style={{ padding: '8rem 5%', background: '#f8fafc' }}>
                <div style={{ maxWidth: '850px', margin: '0 auto', textAlign: 'center' }}>
                    <span style={{ display: 'inline-block', background: '#dcfce7', color: '#16a34a', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '0.5rem 1.25rem', borderRadius: '50px', marginBottom: '1.25rem' }}>Get Started</span>
                    <h2 style={{ fontSize: '3rem', fontWeight: 900, margin: '0 0 1rem', color: '#0f172a', letterSpacing: '-0.5px' }}>Ready to Modernize Your Campus?</h2>
                    <p style={{ fontSize: '1.15rem', color: '#64748b', marginBottom: '4rem', lineHeight: 1.6 }}>Get in touch to set up your free trial in under 5 minutes. No technical knowledge required.</p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', background: 'white', padding: '3.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px rgba(0,0,0,0.04)' }}>
                        <div style={{ padding: '2rem', background: '#eff6ff', borderRadius: '20px', textAlign: 'center', border: '1px solid #bfdbfe' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✉️</div>
                            <div style={{ color: '#475569', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '1px' }}>Email</div>
                            <a href={`mailto:${supportEmail}`} style={{ fontSize: '1.15rem', fontWeight: 800, color: '#2563eb', textDecoration: 'none', wordBreak: 'break-all' }}>{supportEmail}</a>
                        </div>
                        <div style={{ padding: '2rem', background: '#f0fdf4', borderRadius: '20px', textAlign: 'center', border: '1px solid #bbf7d0' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💬</div>
                            <div style={{ color: '#475569', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '1px' }}>WhatsApp</div>
                            <a href={`https://wa.me/${whatsappNum.replace(/\+/g, '').replace(/\s/g, '')}`} target="_blank" rel="noreferrer" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#16a34a', textDecoration: 'none' }}>{whatsappNum}</a>
                        </div>
                    </div>

                    <p style={{ marginTop: '2.5rem', color: '#64748b', fontSize: '0.95rem' }}>
                        Average response time: <strong style={{ color: '#0f172a', fontWeight: 800 }}>under 2 hours</strong> during business hours.
                    </p>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer style={{ background: '#0f172a', padding: '3rem 5%', borderTop: '1px solid #1e293b' }}>
                <div className="footer-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: 'linear-gradient(135deg, #2563eb, #6366f1)', padding: '0.6rem', borderRadius: '10px', color: 'white', display: 'flex' }}>
                            <MonitorSmartphone size={20} strokeWidth={2.5} />
                        </div>
                        <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#cbd5e1' }}>{businessName}</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>© {new Date().getFullYear()} {businessName}. All rights reserved.</div>
                    <div style={{ display: 'flex', gap: '2rem', fontSize: '0.95rem', fontWeight: 600 }}>
                        <a href="#features" style={{ textDecoration: 'none', color: '#94a3b8', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color='white'} onMouseOut={e => e.target.style.color='#94a3b8'}>Features</a>
                        <a href="#pricing" style={{ textDecoration: 'none', color: '#94a3b8', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color='white'} onMouseOut={e => e.target.style.color='#94a3b8'}>Pricing</a>
                        <a href="#contact" style={{ textDecoration: 'none', color: '#94a3b8', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color='white'} onMouseOut={e => e.target.style.color='#94a3b8'}>Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default SaaSLanding;
