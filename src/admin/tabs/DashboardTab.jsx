import React, { useState } from 'react';
import { Users, DollarSign, Activity, TrendingUp, TrendingDown, Clock, ShieldCheck, GraduationCap, CheckCircle, ChevronDown, ChevronUp, Lock } from 'lucide-react';

const DashboardTab = ({ students, schoolData, EXPENSES, adminTabs, setActiveTab, currencySymbol, isProPlan, setUpgradeModal }) => {
    const [revenueExpanded, setRevenueExpanded] = useState(false);
    const [statsExpanded, setStatsExpanded] = useState(false);
    
    // ── DATA AGGREGATION ──
    const totalStudents = students?.length || 0;
    const totalFaculty = schoolData?.faculty?.length || 0;

    // Fees & Revenue
    const currentMonthLabel = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    let totalExpectedRevenue = 0;
    let totalCollectedRevenue = 0;
    
    students?.forEach(student => {
        const h = (student.feeHistory || []).find(record => record.month === currentMonthLabel);
        if (h) {
            // we estimate expected revenue based on existing bills. If not detailed, we approximate.
            const due = h.totalDue || 0;
            totalExpectedRevenue += due;
            if (h.status === 'paid') {
                totalCollectedRevenue += due;
            } else if (h.amountPaid > 0) {
                totalCollectedRevenue += h.amountPaid;
            }
        }
    });

    // Expenses
    const currentMonthPrefix = new Date().toISOString().substring(0, 7); // YYYY-MM
    let monthlyExpenses = 0;
    EXPENSES?.forEach(exp => {
        if (exp.date && exp.date.startsWith(currentMonthPrefix)) {
            monthlyExpenses += Number(exp.amount) || 0;
        }
    });

    const netProfit = totalCollectedRevenue - monthlyExpenses;

    // Attendance Rate Today
    const today = new Date().toISOString().split('T')[0];
    let presentCount = 0;
    let attendanceExpected = 0;
    students?.forEach(s => {
        const records = s.attendance?.records || [];
        const todayRec = records.find(r => r.date === today);
        if (todayRec) {
            attendanceExpected++;
            if (todayRec.status === 'present' || todayRec.status === 'late' || todayRec.status === 'leave') {
                 presentCount++;
            }
        }
    });
    
    const attendanceRate = attendanceExpected > 0 ? Math.round((presentCount / attendanceExpected) * 100) : 0;

    // ── WIDGET COMPONENTS ──
    const StatCard = ({ title, value, sub, icon: Icon, color, trend, trendVal }) => (
        <div className="card hover-scale" style={{ padding: '1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderLeft: `5px solid ${color}` }}>
            <div>
                <p style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</p>
                <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>{value}</h3>
                {sub && <p style={{ margin: '0.5rem 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>{sub}</p>}
                
                {trend && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.75rem', fontSize: '0.8rem', fontWeight: 600, color: trend === 'up' ? '#16a34a' : '#dc2626' }}>
                        {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {trendVal}
                    </div>
                )}
            </div>
            <div style={{ background: `${color}15`, padding: '1rem', borderRadius: '12px', color: color }}>
                <Icon size={28} />
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>
            
            {/* Welcome Banner */}
            <div className="dashboard-banner" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)', color: 'white', borderRadius: '20px', padding: '2.5rem', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 30px rgba(37, 99, 235, 0.2)' }}>
                <div style={{ position: 'relative', zIndex: 10 }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Data-Driven Insights</h2>
                    <p style={{ opacity: 0.9, fontSize: '1.05rem', margin: 0, maxWidth: '600px' }}>
                        Monitor your school's performance metrics in real-time. Below is the business intelligence summary for {currentMonthLabel}.
                    </p>
                </div>
                {/* Decorative Elements */}
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
                <div style={{ position: 'absolute', bottom: '-80px', right: '100px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
            </div>

            {/* KPI Grid — collapsible */}
            <div>
            <button
                onClick={() => setStatsExpanded(prev => !prev)}
                style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    background: statsExpanded ? '#1e3a5f' : '#f1f5f9',
                    color: statsExpanded ? 'white' : '#1e293b',
                    border: 'none', borderRadius: '10px',
                    padding: '0.65rem 1.25rem', fontSize: '0.95rem',
                    fontWeight: 700, cursor: 'pointer',
                    marginBottom: statsExpanded ? '1rem' : 0,
                    transition: 'all 0.2s ease',
                    boxShadow: statsExpanded ? '0 4px 12px rgba(30,58,95,0.2)' : 'none'
                }}
            >
                {statsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                School Statistics
            </button>
            {statsExpanded && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
                <StatCard 
                    title="Total Enrollment" 
                    value={totalStudents.toLocaleString()} 
                    sub="Active Students"
                    icon={GraduationCap} color="#2563eb" 
                />
                <StatCard 
                    title="Staff & Faculty" 
                    value={totalFaculty.toLocaleString()} 
                    sub="Employed Members"
                    icon={Users} color="#8b5cf6" 
                />
                <StatCard 
                    title="Today's Attendance" 
                    value={`${attendanceRate}%`} 
                    sub={`${presentCount} present out of ${attendanceExpected || '0'} marked`}
                    icon={Clock} color={attendanceRate >= 80 ? '#10b981' : '#f59e0b'}
                    trend={attendanceRate >= 80 ? 'up' : 'down'}
                    trendVal="Daily Tracking"
                />
                <StatCard 
                    title="Net Cashflow" 
                    value={`${currencySymbol} ${netProfit.toLocaleString()}`} 
                    sub={`Collected: ${totalCollectedRevenue} - Exp: ${monthlyExpenses}`}
                    icon={Activity} color={netProfit >= 0 ? '#10b981' : '#ef4444'} 
                    trend={netProfit >= 0 ? 'up' : 'down'}
                    trendVal="This Month"
                />
            </div>
            )}
            </div>

            {/* Bi-Panel Section — collapsible */}
            <div>
            <button
                onClick={() => setRevenueExpanded(prev => !prev)}
                style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    background: revenueExpanded ? '#1e3a5f' : '#f1f5f9',
                    color: revenueExpanded ? 'white' : '#1e293b',
                    border: 'none', borderRadius: '10px',
                    padding: '0.65rem 1.25rem', fontSize: '0.95rem',
                    fontWeight: 700, cursor: 'pointer',
                    marginBottom: revenueExpanded ? '1rem' : 0,
                    transition: 'all 0.2s ease',
                    boxShadow: revenueExpanded ? '0 4px 12px rgba(30,58,95,0.2)' : 'none'
                }}
            >
                {revenueExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                Revenue &amp; Expense Details
            </button>

            {revenueExpanded && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
                
                {/* Visual Chart Placeholder / Analysis Box */}
                <div className="card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Revenue vs Expenses</h3>
                        <span style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '0.3rem 0.8rem', borderRadius: '50px', fontWeight: 600, color: '#64748b' }}>{currentMonthLabel}</span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>
                                <span>Fee Collection</span>
                                <span style={{ color: '#2563eb' }}>{totalExpectedRevenue > 0 ? Math.round((totalCollectedRevenue/totalExpectedRevenue)*100) : 0}% Target</span>
                            </div>
                            <div style={{ width: '100%', height: '12px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: (totalExpectedRevenue > 0 ? (totalCollectedRevenue/totalExpectedRevenue)*100 : 0) + '%', background: '#2563eb', borderRadius: '10px' }}></div>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>{currencySymbol} {totalCollectedRevenue.toLocaleString()} collected out of {currencySymbol} {totalExpectedRevenue.toLocaleString()} expected</div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>
                                <span>Monthly Operational Expenses</span>
                                <span style={{ color: '#ef4444' }}>{currencySymbol} {monthlyExpenses.toLocaleString()}</span>
                            </div>
                            <div style={{ width: '100%', height: '12px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: (totalExpectedRevenue > 0 ? Math.min((monthlyExpenses/totalExpectedRevenue)*100, 100) : 0) + '%', background: '#ef4444', borderRadius: '10px' }}></div>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>Expenses tracking against expected gross revenue.</div>
                        </div>
                    </div>
                </div>

                {/* Quick Action Alerts */}
                <div className="card" style={{ padding: '2rem', background: '#f8fafc', border: '2px dashed #cbd5e1' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ShieldCheck size={20} color="#2563eb" /> System Health
                    </h3>
                    
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <li style={{ background: 'white', padding: '1rem', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #10b981' }}>
                            <div style={{ background: '#dcfce7', padding: '0.5rem', borderRadius: '50%', color: '#16a34a' }}><CheckCircle size={16} /></div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>Data Sync Active</div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Cloud database connected.</div>
                            </div>
                        </li>
                        <li style={{ background: 'white', padding: '1rem', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: attendanceRate === 0 && attendanceExpected === 0 ? '4px solid #f59e0b' : '4px solid #10b981' }}>
                            <div style={{ background: attendanceRate === 0 && attendanceExpected === 0 ? '#fef3c7' : '#dcfce7', padding: '0.5rem', borderRadius: '50%', color: attendanceRate === 0 && attendanceExpected === 0 ? '#d97706' : '#16a34a' }}><Clock size={16} /></div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>Daily Attendance</div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{attendanceExpected === 0 ? 'Not marked for today yet.' : 'Up to date for marked classes.'}</div>
                            </div>
                        </li>
                    </ul>
                </div>

            </div>
            )}
            </div>

            {/* Application Modules Grid */}
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', marginTop: '1rem', marginBottom: '-0.5rem' }}>Application Modules</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
                                {adminTabs.map((tab, idx) => {
                                    const colors = [
                                        { bg: '#eff6ff', icon: '#3b82f6', border: '#bfdbfe', grad: 'linear-gradient(135deg, white 0%, #eff6ff 100%)' }, 
                                        { bg: '#fdf4ff', icon: '#d946ef', border: '#fbcfe8', grad: 'linear-gradient(135deg, white 0%, #fae8ff 100%)' }, 
                                        { bg: '#ecfdf5', icon: '#10b981', border: '#a7f3d0', grad: 'linear-gradient(135deg, white 0%, #d1fae5 100%)' }, 
                                        { bg: '#fff7ed', icon: '#f97316', border: '#fed7aa', grad: 'linear-gradient(135deg, white 0%, #ffedd5 100%)' }, 
                                        { bg: '#f5f3ff', icon: '#8b5cf6', border: '#ddd6fe', grad: 'linear-gradient(135deg, white 0%, #ede9fe 100%)' }, 
                                        { bg: '#f0fdfa', icon: '#14b8a6', border: '#99f6e4', grad: 'linear-gradient(135deg, white 0%, #ccfbf1 100%)' }, 
                                        { bg: '#fefce8', icon: '#eab308', border: '#fef08a', grad: 'linear-gradient(135deg, white 0%, #fef9c3 100%)' }, 
                                        { bg: '#fdf2f8', icon: '#ec4899', border: '#fbcfe8', grad: 'linear-gradient(135deg, white 0%, #fce7f3 100%)' }  
                                    ];
                                    const c = colors[idx % colors.length];

                                    const isLocked = !isProPlan && tab.isPro;

                                    return (
                                        <div
                                            key={tab.id}
                                            onClick={() => {
                                                if (isLocked) { setUpgradeModal({ open: true, featureName: tab.label }); } 
                                                else { setActiveTab(tab.id); }
                                            }}
                                            className="card"
                                            style={{
                                                padding: '1.75rem 1.75rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'flex-start',
                                                textAlign: 'left',
                                                gap: '1rem',
                                                transition: 'all 0.3s ease',
                                                border: '1px solid #e2e8f0',
                                                borderTop: '4px solid ' + c.icon,
                                                background: c.grad,
                                                borderRadius: '16px',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-5px)';
                                                e.currentTarget.style.boxShadow = '0 15px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px ' + c.icon + '30';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                            }}
                                        >
                                            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{
                                                    background: c.bg, padding: '1rem', borderRadius: '14px', color: isLocked ? '#cbd5e1' : c.icon,
                                                }}>
                                                    <tab.icon size={28} strokeWidth={2.5} />
                                                </div>
                                                {isLocked && (
                                                    <div style={{ background: '#f8fafc', padding: '0.4rem', borderRadius: '8px', color: '#94a3b8' }}>
                                                        <Lock size={16} />
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ opacity: isLocked ? 0.6 : 1 }}>
                                                <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', marginBottom: '0.3rem' }}>{tab.label}</h3>
                                                <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>{tab.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

        </div>
    );
};

export default DashboardTab;
