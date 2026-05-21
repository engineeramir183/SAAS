import React, { useState, useMemo, useEffect } from 'react';
import {
    DollarSign, Users, CheckCircle, XCircle, Printer,
    BarChart2, AlertCircle, Banknote, Search, TrendingUp, TrendingDown
} from 'lucide-react';
import { useSchoolData } from '../../context/SchoolDataContext';

function printPayslip(member, rec, schoolName, sym) {
    if (!rec) { alert('No payroll record found.'); return; }
    const html = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Payslip - ${member.name} - ${rec.month}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            * { box-sizing: border-box; }
            body { font-family: 'Inter', sans-serif; background: #f8fafc; color: #0f172a; padding: 40px; margin: 0; }
            
            .slip { 
                max-width: 600px; 
                margin: 0 auto; 
                border: 1px solid #cbd5e1; 
                background: white;
                border-radius: 12px; 
                padding: 32px; 
                box-shadow: 0 10px 25px rgba(15,23,42,0.05); 
                position: relative;
                overflow: hidden;
            }
            
            .top-accent { 
                height: 6px; 
                background: #0f172a; 
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
            }
            
            .header { 
                text-align: center; 
                border-bottom: 2px solid #0f172a; 
                padding-bottom: 18px; 
                margin-bottom: 24px; 
            }
            
            .school { 
                font-size: 22px; 
                font-weight: 800; 
                color: #0f172a; 
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 4px; 
            }
            
            .title { 
                font-size: 11px; 
                color: #64748b; 
                font-weight: 800; 
                text-transform: uppercase; 
                letter-spacing: 1.5px; 
            }
            
            .details-grid { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 16px; 
                margin-bottom: 28px; 
            }
            
            .label { 
                font-size: 9px; 
                color: #64748b; 
                text-transform: uppercase; 
                letter-spacing: 0.5px; 
                font-weight: 800; 
                margin-bottom: 2px;
            }
            
            .value { 
                font-size: 13.5px; 
                font-weight: 700; 
                color: #0f172a; 
            }
            
            .calc-table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 28px; 
            }
            
            .calc-table th { 
                text-align: left; 
                padding: 10px 12px; 
                font-size: 10px; 
                text-transform: uppercase; 
                color: #64748b; 
                border-bottom: 2px solid #cbd5e1; 
                font-weight: 800;
                letter-spacing: 0.5px;
            }
            
            .calc-table td { 
                padding: 12px; 
                font-size: 13px; 
                font-weight: 600; 
                color: #334155; 
                border-bottom: 1px solid #f1f5f9; 
            }
            
            .calc-table .amt { 
                text-align: right; 
                font-weight: 700;
            }
            
            .net-row td { 
                font-size: 16px; 
                font-weight: 800; 
                color: #16a34a; 
                background: #f0fdf4; 
                border-top: 1.5px solid #0f172a;
                border-bottom: 1.5px solid #0f172a; 
            }
            
            .footer-sig { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 40px; 
                margin-top: 45px; 
                text-align: center; 
            }
            
            .sig-line { 
                border-top: 1.5px solid #cbd5e1; 
                padding-top: 8px; 
                font-size: 10.5px; 
                color: #64748b; 
                font-weight: 700; 
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .btn-print { 
                margin: 0 auto 20px auto; 
                display: block; 
                padding: 10px 22px; 
                background: #0f172a; 
                color: white; 
                border: none; 
                border-radius: 6px; 
                cursor: pointer; 
                font-weight: 700; 
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                box-shadow: 0 4px 12px rgba(15,23,42,0.15);
                transition: background 0.15s ease;
            }
            
            .btn-print:hover {
                background: #1e293b;
            }
            
            @media print { 
                .btn-print { display: none; }
                body { padding: 0; background: white; } 
                .slip { box-shadow: none; border: 1px solid #cbd5e1; } 
            }
        </style>
    </head>
    <body>
        <button class="btn-print" onclick="window.print()">Print Payslip</button>
        <div class="slip">
            <div class="top-accent"></div>
            <div class="header">
                <div class="school">${schoolName}</div>
                <div class="title">Official Salary Payslip — ${rec.month}</div>
            </div>
            
            <div class="details-grid">
                <div><div class="label">Employee Name</div><div class="value">${member.name}</div></div>
                <div><div class="label">Designation</div><div class="value">${member.role || 'Staff'}</div></div>
                <div><div class="label">Department</div><div class="value">${member.department || 'General'}</div></div>
                <div><div class="label">Payment Status</div><div class="value" style="color: #16a34a; text-transform: uppercase; font-size: 12px; font-weight: 800;">PAID on ${rec.paid_on || '—'}</div></div>
            </div>

            <table class="calc-table">
                <thead><tr><th>Earnings & Deductions</th><th class="amt">Amount</th></tr></thead>
                <tbody>
                    <tr><td>Basic Salary</td><td class="amt">${sym} ${Number(rec.base_salary).toLocaleString()}</td></tr>
                    <tr><td>Allowances & Bonuses</td><td class="amt" style="color:#2563eb;">+ ${sym} ${Number(rec.allowance).toLocaleString()}</td></tr>
                    <tr><td>Deductions & Unpaid Leaves</td><td class="amt" style="color:#dc2626;">- ${sym} ${Number(rec.deduction).toLocaleString()}</td></tr>
                    <tr class="net-row"><td>Net Salary Paid</td><td class="amt">${sym} ${Number(rec.net_paid).toLocaleString()}</td></tr>
                </tbody>
            </table>

            <div class="footer-sig">
                <div class="sig-line">Employer Signature</div>
                <div class="sig-line">Employee Signature</div>
            </div>
            
            <div style="text-align: center; margin-top: 35px; font-size: 9px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Generated on ${new Date().toLocaleDateString()}</div>
        </div>
        <script>window.onload = () => { window.print(); }</script>
    </body>
    </html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
}

const MONTHS = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
});

export default function PayrollTab({ schoolData, showSaveMessage, currencySymbol }) {
    const sym = currencySymbol || 'RS';
    const { payrollRecords, fetchPayrollRecords, savePayrollRecord, deletePayrollRecord } = useSchoolData();
    const faculty = schoolData?.faculty || [];
    const schoolName = schoolData?.name || 'School';

    const [month, setMonth] = useState(MONTHS[0]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [edits, setEdits] = useState({});
    const [saving, setSaving] = useState(null);
    const [view, setView] = useState('payroll');

    useEffect(() => { fetchPayrollRecords(month); }, [month]);

    const recByFaculty = useMemo(() => {
        const m = {};
        payrollRecords.forEach(r => { if (r.month === month) m[r.faculty_id] = r; });
        return m;
    }, [payrollRecords, month]);

    const stats = useMemo(() => {
        let budget = 0, paid = 0, paidCount = 0, unpaidCount = 0;
        faculty.forEach(f => {
            budget += Number(f.base_salary || 0);
            const r = recByFaculty[f.id];
            if (r) { paid += Number(r.net_paid); paidCount++; }
            else unpaidCount++;
        });
        return { budget, paid, paidCount, unpaidCount, pending: budget - paid };
    }, [faculty, recByFaculty]);

    const getEdit = (id, field, fallback = 0) => edits[id]?.[field] ?? fallback;
    const setEdit = (id, field, val) => setEdits(p => ({ ...p, [id]: { ...(p[id] || {}), [field]: val } }));

    const handleSave = async (member) => {
        const base = Number(getEdit(member.id, 'base_salary', member.base_salary || 0));
        const allow = Number(getEdit(member.id, 'allowance', 0));
        const ded = Number(getEdit(member.id, 'deduction', 0));
        const net = base + allow - ded;
        setSaving(member.id);
        const { error } = await savePayrollRecord({
            faculty_id: member.id, month,
            base_salary: base, allowance: allow, deduction: ded,
            net_paid: net, paid_on: new Date().toISOString().split('T')[0], status: 'paid'
        });
        setSaving(null);
        if (!error) {
            showSaveMessage(`✅ Paid ${sym} ${net.toLocaleString()} to ${member.name}`);
            setEdits(p => { const c = { ...p }; delete c[member.id]; return c; });
        } else alert('Error: ' + error.message);
    };

    const handlePayAll = async () => {
        const unpaid = faculty.filter(f => !recByFaculty[f.id]);
        if (!unpaid.length) { showSaveMessage('Everyone is paid!'); return; }
        if (!confirm(`Pay all ${unpaid.length} unpaid staff using base salaries?`)) return;
        for (const f of unpaid) {
            const base = Number(f.base_salary || 0);
            await savePayrollRecord({ faculty_id: f.id, month, base_salary: base, allowance: 0, deduction: 0, net_paid: base, paid_on: new Date().toISOString().split('T')[0], status: 'paid' });
        }
        showSaveMessage(`✅ Processed ${unpaid.length} payrolls`);
    };

    const filtered = faculty.filter(f => {
        const s = !search || f.name.toLowerCase().includes(search.toLowerCase());
        const isPaid = !!recByFaculty[f.id];
        const flt = filter === 'all' || (filter === 'paid' && isPaid) || (filter === 'unpaid' && !isPaid);
        return s && flt;
    });

    const cardStyle = (color) => ({
        background: 'white', borderRadius: 14, padding: '1.25rem',
        border: '1px solid #e2e8f0', borderLeft: `4px solid ${color}`
    });

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>💰 Payroll Dashboard</h2>
                    <p style={{ color: '#64748b', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>Process monthly salaries and track HR costs.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.3rem', borderRadius: 10, gap: '0.3rem' }}>
                        {[{ id: 'payroll', label: '📋 Process' }, { id: 'analytics', label: '📊 Analytics' }].map(v => (
                            <button key={v.id} onClick={() => setView(v.id)} style={{
                                padding: '0.4rem 0.9rem', borderRadius: 8, border: 'none', cursor: 'pointer',
                                background: view === v.id ? 'white' : 'transparent',
                                color: view === v.id ? '#0f172a' : '#64748b', fontWeight: 600, fontSize: '0.85rem',
                                boxShadow: view === v.id ? '0 2px 5px rgba(0,0,0,0.08)' : 'none'
                            }}>{v.label}</button>
                        ))}
                    </div>
                    <select value={month} onChange={e => setMonth(e.target.value)}
                        style={{ padding: '0.5rem 1rem', borderRadius: 10, border: '1px solid #e2e8f0', fontWeight: 700, fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }}>
                        {MONTHS.map(m => <option key={m}>{m}</option>)}
                    </select>
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={cardStyle('#3b82f6')}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Budget</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{sym} {stats.budget.toLocaleString()}</div>
                </div>
                <div style={cardStyle('#10b981')}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Disbursed</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{sym} {stats.paid.toLocaleString()}</div>
                    <div style={{ fontSize: '0.78rem', color: '#16a34a' }}>{stats.paidCount} paid</div>
                </div>
                <div style={cardStyle('#8b5cf6')}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Pending</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{sym} {stats.pending.toLocaleString()}</div>
                    <div style={{ fontSize: '0.78rem', color: '#f59e0b' }}>{stats.unpaidCount} unpaid</div>
                </div>
                <div style={cardStyle(stats.unpaidCount > 0 ? '#f59e0b' : '#10b981')}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Staff</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{stats.paidCount}/{faculty.length}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>paid this month</div>
                </div>
            </div>

            {/* Process View */}
            {view === 'payroll' && (
                <div className="animate-fade-in">
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
                            <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)}
                                style={{ width: '100%', padding: '0.55rem 0.75rem 0.55rem 2.2rem', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none' }} />
                        </div>
                        {['all', 'paid', 'unpaid'].map(f => (
                            <button key={f} onClick={() => setFilter(f)} style={{
                                padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid',
                                borderColor: filter === f ? '#2563eb' : '#e2e8f0',
                                background: filter === f ? '#eff6ff' : 'white',
                                color: filter === f ? '#2563eb' : '#64748b', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', textTransform: 'capitalize'
                            }}>{f === 'all' ? '🗂 All' : f === 'paid' ? '✅ Paid' : '⏳ Pending'}</button>
                        ))}
                        {stats.unpaidCount > 0 && (
                            <button onClick={handlePayAll} style={{
                                padding: '0.55rem 1.1rem', borderRadius: 10, border: 'none', cursor: 'pointer',
                                background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', fontWeight: 700, fontSize: '0.9rem',
                                display: 'flex', alignItems: 'center', gap: '0.4rem'
                            }}><CheckCircle size={15} /> Pay All ({stats.unpaidCount})</button>
                        )}
                    </div>

                    {faculty.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: 16, border: '2px dashed #cbd5e1' }}>
                            <Users size={48} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
                            <p style={{ color: '#475569', fontWeight: 700 }}>No staff added yet. Go to Faculty tab first.</p>
                        </div>
                    ) : (
                        <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                            {['Staff Member', 'Base Salary', 'Allowance', 'Deduction', 'Net Pay', 'Action'].map(h => (
                                                <th key={h} style={{ padding: '0.85rem 1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((member, idx) => {
                                            const rec = recByFaculty[member.id];
                                            const isSav = saving === member.id;
                                            if (rec) return (
                                                <tr key={member.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#f9fffe' : 'white' }}>
                                                    <td style={{ padding: '0.9rem 1rem' }}>
                                                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{member.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{member.role || 'Staff'}</div>
                                                    </td>
                                                    <td style={{ padding: '0.9rem 1rem', color: '#475569', fontWeight: 600 }}>{sym} {Number(rec.base_salary).toLocaleString()}</td>
                                                    <td style={{ padding: '0.9rem 1rem', color: '#2563eb', fontWeight: 600 }}>+{sym} {Number(rec.allowance).toLocaleString()}</td>
                                                    <td style={{ padding: '0.9rem 1rem', color: '#ef4444', fontWeight: 600 }}>−{sym} {Number(rec.deduction).toLocaleString()}</td>
                                                    <td style={{ padding: '0.9rem 1rem', color: '#15803d', fontWeight: 800 }}>{sym} {Number(rec.net_paid).toLocaleString()}</td>
                                                    <td style={{ padding: '0.9rem 1rem' }}>
                                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                            <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.3rem 0.6rem', borderRadius: 6, fontSize: '0.78rem', fontWeight: 700 }}>✓ Paid</span>
                                                            <button onClick={() => printPayslip(member, rec, schoolName, sym)} style={{ background: '#1e3a5f', color: 'white', border: 'none', padding: '0.3rem 0.6rem', borderRadius: 6, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}><Printer size={12} /> Slip</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                            const e = edits[member.id] || {};
                                            const net = Number(e.base_salary ?? member.base_salary ?? 0) + Number(e.allowance ?? 0) - Number(e.deduction ?? 0);
                                            return (
                                                <tr key={member.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fffbf7' : 'white' }}>
                                                    <td style={{ padding: '0.9rem 1rem' }}>
                                                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{member.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{member.role || 'Staff'}</div>
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem' }}>
                                                        <input type="number" placeholder="0" value={e.base_salary ?? member.base_salary ?? ''} onChange={ev => setEdit(member.id, 'base_salary', ev.target.value)}
                                                            style={{ width: 100, padding: '0.4rem 0.5rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', outline: 'none' }} />
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem' }}>
                                                        <input type="number" placeholder="0" value={e.allowance || ''} onChange={ev => setEdit(member.id, 'allowance', ev.target.value)}
                                                            style={{ width: 90, padding: '0.4rem 0.5rem', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: '0.9rem', background: '#eff6ff', outline: 'none' }} />
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem' }}>
                                                        <input type="number" placeholder="0" value={e.deduction || ''} onChange={ev => setEdit(member.id, 'deduction', ev.target.value)}
                                                            style={{ width: 90, padding: '0.4rem 0.5rem', border: '1px solid #fecaca', borderRadius: 8, fontSize: '0.9rem', background: '#fef2f2', outline: 'none' }} />
                                                    </td>
                                                    <td style={{ padding: '0.9rem 1rem', fontWeight: 800, color: '#0f172a' }}>{sym} {net.toLocaleString()}</td>
                                                    <td style={{ padding: '0.75rem 1rem' }}>
                                                        <button onClick={() => handleSave(member)} disabled={isSav} style={{
                                                            background: isSav ? '#94a3b8' : 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: 'white', border: 'none',
                                                            padding: '0.45rem 1rem', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem', cursor: isSav ? 'not-allowed' : 'pointer'
                                                        }}>{isSav ? '...' : '✓ Mark Paid'}</button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Analytics View */}
            {view === 'analytics' && (
                <div className="animate-fade-in">
                    <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                        <h4 style={{ fontWeight: 800, color: '#1e293b', marginBottom: '1.25rem' }}>Monthly Payroll (Last 6 Months)</h4>
                        {MONTHS.slice(0, 6).reverse().map(m => {
                            const recs = payrollRecords.filter(r => r.month === m);
                            const total = recs.reduce((s, r) => s + Number(r.net_paid), 0);
                            const pct = stats.budget > 0 ? Math.min((total / stats.budget) * 100, 100) : 0;
                            return (
                                <div key={m} style={{ marginBottom: '0.85rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                                        <span>{m}</span><span style={{ color: '#1e293b' }}>{sym} {total.toLocaleString()}</span>
                                    </div>
                                    <div style={{ height: 10, background: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#2563eb,#7c3aed)', borderRadius: 10, transition: 'width 0.6s ease' }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                            <h4 style={{ fontWeight: 800, color: '#1e293b', margin: 0 }}>Staff Payment Summary</h4>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    {['Staff', 'Base Salary', 'Total Paid (All Time)', 'Months Paid'].map(h => (
                                        <th key={h} style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569', textAlign: 'left' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {faculty.map((f, idx) => {
                                    const recs = payrollRecords.filter(r => r.faculty_id === f.id);
                                    const total = recs.reduce((s, r) => s + Number(r.net_paid), 0);
                                    return (
                                        <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                                            <td style={{ padding: '0.9rem 1rem' }}>
                                                <div style={{ fontWeight: 700, color: '#1e293b' }}>{f.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{f.role || 'Staff'}</div>
                                            </td>
                                            <td style={{ padding: '0.9rem 1rem', fontWeight: 600, color: '#475569' }}>{sym} {Number(f.base_salary || 0).toLocaleString()}</td>
                                            <td style={{ padding: '0.9rem 1rem', fontWeight: 800, color: '#15803d' }}>{sym} {total.toLocaleString()}</td>
                                            <td style={{ padding: '0.9rem 1rem' }}>
                                                <span style={{ background: recs.length > 0 ? '#dcfce7' : '#f1f5f9', color: recs.length > 0 ? '#15803d' : '#94a3b8', padding: '0.25rem 0.6rem', borderRadius: 50, fontSize: '0.8rem', fontWeight: 700 }}>
                                                    {recs.length} month{recs.length !== 1 ? 's' : ''}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
