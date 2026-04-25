import React, { useEffect, useState } from 'react';
import {
    ShieldCheck, MonitorSmartphone, BrainCircuit, Wallet, BarChart, Globe,
    ArrowRight, CheckCircle, Users, GraduationCap, Zap, Star,
    Building, Bell, FileText, ChevronRight, Menu, X, Award,
    Clock, TrendingUp, Smartphone, Lock
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
                .nav-link { text-decoration: none; color: #64748b; font-weight: 600; transition: color 0.2s; }
                .nav-link:hover { color: #0f172a; }
                .feat-card { transition: transform 0.3s, box-shadow 0.3s; }
                .feat-card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(0,0,0,0.08) !important; }
                .testi-card { transition: transform 0.3s; }
                .testi-card:hover { transform: translateY(-4px); }
                @media (max-width: 768px) {
                    .hero-title { font-size: 2.4rem !important; }
                    .hero-btns { flex-direction: column !important; align-items: stretch !important; }
                    .stats-grid { grid-template-columns: 1fr 1fr !important; }
                    .features-grid { grid-template-columns: 1fr !important; }
                    .plans-grid { grid-template-columns: 1fr !important; }
                    .testi-grid { grid-template-columns: 1fr !important; }
                    .desktop-nav { display: none !important; }
                    .mobile-menu-btn { display: flex !important; }
                    .footer-inner { flex-direction: column !important; gap: 1rem; text-align: center; }
                }
                @media (min-width: 769px) { .mobile-menu-btn { display: none !important; } }
            `}</style>

            {/* ── NAV ── */}
            <header style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #e2e8f0', padding: '0 5%', position: 'sticky', top: 0, zIndex: 100, height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', padding: '0.55rem', borderRadius: '10px', color: 'white', display: 'flex' }}>
                        <MonitorSmartphone size={22} />
                    </div>
                    <span style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.5px', color: '#0f172a' }}>{businessName}</span>
                </div>

                <nav className="desktop-nav" style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
                    {[['#features', 'Features'], ['#pricing', 'Pricing'], ['#testimonials', 'Reviews'], ['#contact', 'Contact']].map(([href, label]) => (
                        <a key={href} href={href} className="nav-link" style={{ fontSize: '0.95rem' }}>{label}</a>
                    ))}
                    <button onClick={() => setCurrentPage('login')} style={{ background: '#f1f5f9', border: 'none', padding: '0.65rem 1.4rem', borderRadius: '8px', color: '#0f172a', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>Client Login</button>
                    <button onClick={() => setCurrentPage('register')} style={{ textDecoration: 'none', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', border: 'none', padding: '0.65rem 1.4rem', borderRadius: '8px', color: 'white', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.35)', fontSize: '0.9rem' }}>Register Your School</button>
                </nav>

                <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0f172a', alignItems: 'center' }}>
                    {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
                </button>
            </header>

            {/* Mobile Nav Drawer */}
            {mobileMenuOpen && (
                <div style={{ background: 'white', padding: '1.5rem 5%', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: '68px', zIndex: 99, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[['#features', 'Features'], ['#pricing', 'Pricing'], ['#testimonials', 'Reviews'], ['#contact', 'Contact']].map(([href, label]) => (
                        <a key={href} href={href} onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#0f172a', fontWeight: 700, fontSize: '1.1rem' }}>{label}</a>
                    ))}
                    <button onClick={() => { setCurrentPage('login'); setMobileMenuOpen(false); }} style={{ background: '#f1f5f9', border: 'none', padding: '0.8rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '1rem', textAlign: 'left', color: '#0f172a' }}>Client Login</button>
                    <button onClick={() => { setCurrentPage('register'); setMobileMenuOpen(false); }} style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', border: 'none', padding: '0.8rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '1rem', textAlign: 'left', color: 'white' }}>Register Your School</button>
                </div>
            )}

            {/* ── HERO ── */}
            <section style={{ textAlign: 'center', padding: '7rem 5% 5rem', background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 60%, #f8fafc 100%)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '5%', left: '3%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '0', right: '5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #eff6ff, #f5f3ff)', border: '1px solid #c7d2fe', borderRadius: '50px', padding: '0.45rem 1.1rem', fontSize: '0.85rem', fontWeight: 700, color: '#4f46e5', marginBottom: '2rem' }}>
                    <Zap size={14} /> Powered by Supabase + React · Used by 200+ Schools
                </div>

                <h1 className="hero-title" style={{ fontSize: '4rem', fontWeight: 900, lineHeight: 1.1, margin: '0 0 1.5rem', color: '#0f172a', maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto' }}>
                    {heroTitle.includes('for') ? (
                        <>
                            {heroTitle.split('for')[0]}
                            <span style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>for {heroTitle.split('for').slice(1).join('for')}</span>
                        </>
                    ) : <span style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a8a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{heroTitle}</span>}
                </h1>

                <p style={{ fontSize: '1.2rem', color: '#475569', maxWidth: '700px', margin: '0 auto 3rem', lineHeight: 1.7 }}>{heroSubtitle}</p>

                <div className="hero-btns" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setCurrentPage('register')}
                        style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a8a)', color: 'white', padding: '1rem 2.5rem', borderRadius: '14px', fontSize: '1.1rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 10px 30px rgba(15,23,42,0.35)', border: 'none', cursor: 'pointer' }}
                    >
                        Register Your School <ArrowRight size={20} />
                    </button>
                    <a href="?school=acs-001" style={{ textDecoration: 'none', background: 'white', color: '#0f172a', border: '2px solid #e2e8f0', padding: '1rem 2.5rem', borderRadius: '14px', fontSize: '1.1rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <Globe size={20} color="#64748b" /> Live Demo
                    </a>
                </div>

                {/* Trust row */}
                <div style={{ marginTop: '3rem', display: 'flex', gap: '2rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>
                    {['✅ No Credit Card Required', '🔒 Bank-Grade RLS Security', '⚡ 2-min Setup', '🇵🇰 Made for Pakistan'].map(t => (
                        <span key={t}>{t}</span>
                    ))}
                </div>
            </section>

            {/* ── STATS TICKER ── */}
            <section style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', padding: '3rem 5%' }}>
                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
                    {stats.map(({ value, suffix, label }) => (
                        <div key={label}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', lineHeight: 1, marginBottom: '0.5rem' }}>
                                <Counter end={value} suffix={suffix} />
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section id="features" style={{ padding: '6rem 5%', background: 'white' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <span style={{ display: 'inline-block', background: '#eff6ff', color: '#2563eb', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '1px', textTransform: 'uppercase', padding: '0.4rem 1rem', borderRadius: '50px', marginBottom: '1rem' }}>Features</span>
                    <h2 style={{ fontSize: '2.75rem', fontWeight: 900, margin: '0 0 1rem', lineHeight: 1.1 }}>Everything Your Institution Needs</h2>
                    <p style={{ fontSize: '1.1rem', color: '#64748b', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>Replace your spreadsheets and fragmented tools with one unified platform built specifically for South Asian schools.</p>
                </div>

                <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
                    {features.map(({ icon: Icon, color, bg, title, desc }) => (
                        <div key={title} className="feat-card" style={{ padding: '2rem', borderRadius: '20px', background: '#fafafa', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', cursor: 'default' }}>
                            <div style={{ background: bg, color, padding: '0.9rem', borderRadius: '14px', display: 'inline-flex', marginBottom: '1.25rem' }}>
                                <Icon size={28} />
                            </div>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.75rem', color: '#0f172a' }}>{title}</h3>
                            <p style={{ color: '#475569', lineHeight: 1.65, margin: 0, fontSize: '0.9rem' }}>{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section style={{ padding: '5rem 5%', background: 'linear-gradient(180deg, #f8fafc 0%, #eff6ff 100%)' }}>
                <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0 0 1rem' }}>One Platform. Infinite Scale.</h2>
                    <p style={{ color: '#64748b', fontSize: '1.05rem', maxWidth: '550px', margin: '0 auto' }}>From registration to payroll — every workflow is connected.</p>
                </div>
                <div style={{ display: 'flex', gap: '0', maxWidth: '950px', margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {[
                        { step: '01', icon: Lock, title: 'Super Admin Onboards School', desc: 'Register a new tenant in 60 seconds. Auto-seeds admin credentials and school profile.' },
                        { step: '02', icon: Users, title: 'Admin Configures School', desc: 'Upload logo, set classes, add faculty, configure fee structure and grading weights.' },
                        { step: '03', icon: Smartphone, title: 'Portal Goes Live', desc: 'Students and parents get instant access to results, fees, attendance, and announcements.' },
                    ].map(({ step, icon: Icon, title, desc }, idx) => (
                        <div key={step} style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2rem', position: 'relative' }}>
                            {idx < 2 && <div style={{ position: 'absolute', right: 0, top: '35%', color: '#cbd5e1', fontSize: '2rem', display: 'none' }}><ChevronRight /></div>}
                            <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: '1rem', boxShadow: '0 8px 20px rgba(99,102,241,0.35)' }}>
                                <Icon size={28} />
                            </div>
                            <div style={{ background: '#f1f5f9', color: '#64748b', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', padding: '0.25rem 0.6rem', borderRadius: '50px', marginBottom: '0.75rem' }}>STEP {step}</div>
                            <h4 style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.5rem', color: '#0f172a' }}>{title}</h4>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── TESTIMONIALS ── */}
            <section id="testimonials" style={{ padding: '6rem 5%', background: 'white' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <span style={{ display: 'inline-block', background: '#fef3c7', color: '#d97706', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '1px', textTransform: 'uppercase', padding: '0.4rem 1rem', borderRadius: '50px', marginBottom: '1rem' }}>Testimonials</span>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0 0 1rem' }}>Loved by Educators</h2>
                    <p style={{ color: '#64748b', fontSize: '1.05rem', maxWidth: '500px', margin: '0 auto' }}>Real feedback from school administrators across Pakistan.</p>
                </div>

                <div className="testi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
                    {testimonials.map(({ name, role, text, rating }) => (
                        <div key={name} className="testi-card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', color: '#f59e0b' }}>
                                {[...Array(rating)].map((_, i) => <Star key={i} size={16} fill="#f59e0b" stroke="none" />)}
                            </div>
                            <p style={{ color: '#475569', lineHeight: 1.7, fontSize: '0.95rem', marginBottom: '1.5rem', fontStyle: 'italic' }}>"{text}"</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1rem' }}>
                                    {name[0]}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{name}</div>
                                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── PRICING ── */}
            <section id="pricing" style={{ padding: '6rem 5%', background: '#0f172a', color: 'white' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <span style={{ display: 'inline-block', background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '1px', textTransform: 'uppercase', padding: '0.4rem 1rem', borderRadius: '50px', marginBottom: '1rem' }}>Pricing</span>
                    <h2 style={{ fontSize: '2.75rem', fontWeight: 900, margin: '0 0 1rem' }}>Transparent SaaS Pricing</h2>
                    <p style={{ fontSize: '1.05rem', color: '#94a3b8', maxWidth: '500px', margin: '0 auto' }}>Grow your digital infrastructure predictably. No hidden fees, no lock-in.</p>
                </div>

                <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', maxWidth: '1050px', margin: '0 auto' }}>
                    {plans.map(({ name, price, period, desc, color, bordered, popular, features: pf, cta }) => (
                        <div key={name} style={{
                            background: popular ? `linear-gradient(160deg, #1e3a8a 0%, #172554 100%)` : '#1e293b',
                            borderRadius: '24px', padding: '2.5rem 2rem',
                            border: bordered ? `2px solid ${color}` : '1px solid #334155',
                            position: 'relative', transform: popular ? 'scale(1.03)' : 'scale(1)',
                            boxShadow: popular ? '0 20px 60px rgba(99,102,241,0.2)' : 'none', zIndex: popular ? 10 : 1
                        }}>
                            {popular && <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: 'white', padding: '0.35rem 1.2rem', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>⭐ Most Popular</div>}
                            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.35rem', color: 'white' }}>{name}</h3>
                            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.25rem' }}>{desc}</p>
                            <div style={{ fontSize: '3rem', fontWeight: 900, color: 'white', lineHeight: 1, marginBottom: '2rem' }}>
                                {price}<span style={{ fontSize: '1rem', fontWeight: 500, color: '#94a3b8' }}>{period}</span>
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {pf.map(f => (
                                    <li key={f} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', color: '#cbd5e1', fontSize: '0.9rem' }}>
                                        <CheckCircle size={16} color={color} strokeWidth={2.5} style={{ flexShrink: 0 }} /> {f}
                                    </li>
                                ))}
                            </ul>
                            <a href="#contact" style={{ textDecoration: 'none', display: 'block', width: '100%', padding: '0.9rem', borderRadius: '12px', textAlign: 'center', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', background: popular ? 'linear-gradient(135deg, #6366f1, #7c3aed)' : 'rgba(255,255,255,0.08)', color: 'white', boxShadow: popular ? '0 4px 14px rgba(99,102,241,0.4)' : 'none', border: popular ? 'none' : '1px solid rgba(255,255,255,0.1)' }}>
                                {cta}
                            </a>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CONTACT ── */}
            <section id="contact" style={{ padding: '6rem 5%', background: '#f8fafc' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                    <span style={{ display: 'inline-block', background: '#dcfce7', color: '#16a34a', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '1px', textTransform: 'uppercase', padding: '0.4rem 1rem', borderRadius: '50px', marginBottom: '1rem' }}>Get Started</span>
                    <h2 style={{ fontSize: '2.75rem', fontWeight: 900, margin: '0 0 1rem', color: '#0f172a' }}>Ready to Modernize Your Campus?</h2>
                    <p style={{ fontSize: '1.1rem', color: '#475569', marginBottom: '3rem', lineHeight: 1.6 }}>Get in touch to set up your free trial in under 5 minutes. No technical knowledge required.</p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: 'white', padding: '3rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                        <div style={{ padding: '1.5rem', background: '#eff6ff', borderRadius: '16px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✉️</div>
                            <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Email</div>
                            <a href={`mailto:${supportEmail}`} style={{ fontSize: '1.05rem', fontWeight: 700, color: '#2563eb', textDecoration: 'none', wordBreak: 'break-all' }}>{supportEmail}</a>
                        </div>
                        <div style={{ padding: '1.5rem', background: '#f0fdf4', borderRadius: '16px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
                            <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>WhatsApp</div>
                            <a href={`https://wa.me/${whatsappNum.replace(/\+/g, '').replace(/\s/g, '')}`} target="_blank" rel="noreferrer" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#10b981', textDecoration: 'none' }}>{whatsappNum}</a>
                        </div>
                    </div>

                    <p style={{ marginTop: '2rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                        Average response time: <strong style={{ color: '#0f172a' }}>under 2 hours</strong> during business hours.
                    </p>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer style={{ background: '#0f172a', padding: '2.5rem 5%', borderTop: '1px solid #1e293b' }}>
                <div className="footer-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', padding: '0.5rem', borderRadius: '8px', color: 'white', display: 'flex' }}>
                            <MonitorSmartphone size={18} />
                        </div>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#94a3b8' }}>{businessName}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem' }}>© {new Date().getFullYear()} {businessName}. All rights reserved.</div>
                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
                        <a href="#features" style={{ textDecoration: 'none', color: '#64748b' }}>Features</a>
                        <a href="#pricing" style={{ textDecoration: 'none', color: '#64748b' }}>Pricing</a>
                        <a href="#contact" style={{ textDecoration: 'none', color: '#64748b' }}>Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default SaaSLanding;
