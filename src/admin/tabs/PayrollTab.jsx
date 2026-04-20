import React, { useState, useMemo, useEffect } from 'react';
import {
    DollarSign, Users, TrendingUp, TrendingDown, CheckCircle,
    XCircle, Printer, Download, ChevronDown, ChevronUp,
    BarChart2, Calendar, AlertCircle, Banknote, ArrowUpRight,
    Clock, Search, Filter, RotateCcw, PlusCircle
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

// ─── Payslip Print Helper ─────────────────────────────────────────────────────
function printPayslip(member, monthLabel, schoolName, currencySymbol) {
    const pHistory = member.payroll_history || [];
    const payroll = pHistory.find(p => p.month === monthLabel);
    if (!payroll) { alert('No payroll record found for this month.'); return; }

    const { base_salary, allowance, deduction, net_paid, paid_on } = payroll;
    const sym = currencySymbol || 'RS';
    const dateGenerated = new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payslip − ${member.name} − ${monthLabel}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Inter',sans-serif; background:#f1f5f9; padding:30px; color:#0f172a; }
    .slip { max-width:640px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.1); }
    .header { background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%); color:white; padding:32px 36px; text-align:center; }
    .school { font-size:26px; font-weight:800; letter-spacing:0.5px; margin-bottom:6px; }
    .subtitle { font-size:12px; text-transform:uppercase; letter-spacing:2px; opacity:0.85; font-weight:600; }
    .badge { display:inline-block; margin-top:14px; background:rgba(255,255,255,0.15); padding:6px 16px; border-radius:50px; font-size:13px; font-weight:700; }
    .body { padding:32px 36px; }
    .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-bottom:28px; }
    .info-item .lbl { font-size:10px; text-transform:uppercase; letter-spacing:0.5px; color:#94a3b8; font-weight:700; margin-bottom:4px; }
    .info-item .val { font-size:15px; font-weight:700; color:#1e293b; }
    .divider { height:1px; background:#f1f5f9; margin:0 36px; }
    .table { width:100%; border-collapse:collapse; margin-bottom:24px; }
    .table thead tr { background:#f8fafc; }
    .table thead th { padding:12px 16px; font-size:11px; text-transform:uppercase; font-weight:700; color:#64748b; letter-spacing:0.5px; text-align:left; }
    .table tbody td { padding:14px 16px; font-size:14px; font-weight:600; color:#1e293b; border-bottom:1px solid #f1f5f9; }
    .table tbody tr:last-child td { border-bottom:none; }
    .credit { color:#16a34a; }
    .debit { color:#dc2626; }
    .net-row td { background:#f0fdf4; font-size:17px; font-weight:800; color:#15803d; padding:18px 16px; border-radius:0; }
    .signatures { display:grid; grid-template-columns:1fr 1fr; gap:40px; margin:36px 0 0; padding:0 36px 36px; }
    .sig { border-top:1.5px solid #cbd5e1; padding-top:10px; text-align:center; font-size:12px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; }
    .footer { background:#f8fafc; padding:14px 36px; text-align:center; font-size:10px; color:#94a3b8; border-top:1px solid #e2e8f0; }
    @media print { body{padding:0;background:white;} .slip{box-shadow:none;} }
  </style>
</head>
<body>
  <div class="slip">
    <div class="header">
      <div class="school">${schoolName || 'School'}</div>
      <div class="subtitle">Official Salary Payslip</div>
      <div class="badge">📅 ${monthLabel}</div>
    </div>
    <div class="body">
      <div class="info-grid">
        <div class="info-item"><div class="lbl">Employee Name</div><div class="val">${member.name}</div></div>
        <div class="info-item"><div class="lbl">Designation</div><div class="val">${member.role || 'Staff'}</div></div>
        <div class="info-item"><div class="lbl">Department</div><div class="val">${member.department || 'General'}</div></div>
        <div class="info-item"><div class="lbl">Payment Date</div><div class="val" style="color:#16a34a">✅ Paid on ${paid_on}</div></div>
        ${member.joining_date ? `<div class="info-item"><div class="lbl">Joining Date</div><div class="val">${member.joining_date}</div></div>` : ''}
        ${member.phone ? `<div class="info-item"><div class="lbl">Contact</div><div class="val">${member.phone}</div></div>` : ''}
      </div>
      <table class="table">
        <thead><tr><th>Earnings &amp; Deductions</th><th>Amount (${sym})</th></tr></thead>
        <tbody>
          <tr><td>Basic Salary</td><td>${sym} ${base_salary.toLocaleString()}</td></tr>
          <tr><td>Allowances / Bonus</td><td class="credit">+ ${sym} ${allowance.toLocaleString()}</td></tr>
          <tr><td>Deductions / Absences</td><td class="debit">− ${sym} ${deduction.toLocaleString()}</td></tr>
          <tr class="net-row"><td>Net Salary Paid</td><td>${sym} ${net_paid.toLocaleString()}</td></tr>
        </tbody>
      </table>
    </div>
    <div class="signatures">
      <div class="sig">Employer / Principal Signature</div>
      <div class="sig">Employee Signature</div>
    </div>
    <div class="footer">Generated on ${dateGenerated} &nbsp;|&nbsp; ${schoolName} &nbsp;|&nbsp; Confidential</div>
  </div>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
}

// ─── Stat Card ──────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color, trend }) => (
    <div style={{
        background: 'white', borderRadius: '16px', padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0',
        borderLeft: `4px solid ${color}`, display: 'flex', flexDirection: 'column', gap: '0.5rem'
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b' }}>{label}</span>
            <div style={{ background: `${color}15`, padding: '0.5rem', borderRadius: '10px', color }}><Icon size={20} /></div>
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>{sub}</div>}
        {trend !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 600, color: trend >= 0 ? '#16a34a' : '#dc2626' }}>
                {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {trend >= 0 ? 'All processed' : `${Math.abs(trend)} pending`}
            </div>
        )}
    </div>
);

// ─── Month selector helper — last 12 months ──────────────────────────────────
const getMonthOptions = () => {
    const options = [];
    for (let i = 0; i < 12; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        options.push(d.toLocaleString('default', { month: 'long', year: 'numeric' }));
    }
    return options;
};

// ─── Main Component ──────────────────────────────────────────────────────────
const PayrollTab = ({ schoolData, currentSchoolId, fetchData, showSaveMessage, currencySymbol, fetchPublicData }) => {
    const sym = currencySymbol || 'RS';
    const facultyList = schoolData?.faculty || [];
    const schoolName = schoolData?.name || 'School';

    const currentMonthLabel = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const [selectedMonth, setSelectedMonth] = useState(currentMonthLabel);

    // Ensure faculty data is loaded (it's lazy in SchoolDataContext)
    useEffect(() => {
        if (fetchPublicData) fetchPublicData();
    }, []);

    const [payrollEdits, setPayrollEdits] = useState({});
    const [processingId, setProcessingId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, paid, unpaid
    const [viewingHistory, setViewingHistory] = useState(null); // member id
    const [activeView, setActiveView] = useState('payroll'); // payroll | history

    const monthOptions = useMemo(() => getMonthOptions(), []);

    // ── Per-member payroll state helpers ──────────────────────────────────────
    const getEdit = (memberId, field, fallback = '') => {
        const edits = payrollEdits[memberId] || {};
        return edits[field] !== undefined ? edits[field] : fallback;
    };

    const setEdit = (memberId, field, value) => {
        setPayrollEdits(prev => ({
            ...prev,
            [memberId]: { ...(prev[memberId] || {}), [field]: value }
        }));
    };

    const getNetPay = (memberId, base) => {
        const s = Number(getEdit(memberId, 'base_salary', base || 0));
        const a = Number(getEdit(memberId, 'allowance', 0));
        const d = Number(getEdit(memberId, 'deduction', 0));
        return s + a - d;
    };

    // ── Save payroll for one member ───────────────────────────────────────────
    const handleSavePayroll = async (memberId) => {
        const member = facultyList.find(m => m.id === memberId);
        if (!member) return;

        const baseSalary = Number(getEdit(memberId, 'base_salary', member.base_salary || 0));
        const allowance  = Number(getEdit(memberId, 'allowance', 0));
        const deduction  = Number(getEdit(memberId, 'deduction', 0));
        const netPaid    = baseSalary + allowance - deduction;

        const history = [...(member.payroll_history || [])];
        const existingIdx = history.findIndex(h => h.month === selectedMonth);
        const newRecord = {
            month: selectedMonth, base_salary: baseSalary,
            allowance, deduction, net_paid: netPaid,
            paid_on: new Date().toLocaleDateString('en-CA'), status: 'paid'
        };

        if (existingIdx >= 0) history[existingIdx] = newRecord;
        else history.push(newRecord);

        setProcessingId(memberId);
        const { error } = await supabase.from('faculty').update({
            base_salary: baseSalary,
            payroll_history: history
        }).eq('id', memberId).eq('school_id', currentSchoolId);
        setProcessingId(null);

        if (!error) {
            showSaveMessage(`✅ Paid ${sym} ${netPaid.toLocaleString()} to ${member.name}!`);
            setPayrollEdits(prev => { const c = { ...prev }; delete c[memberId]; return c; });
            fetchData();
        } else {
            alert('Failed to save payroll: ' + error.message);
        }
    };

    // ── Bulk pay all unpaid ───────────────────────────────────────────────────
    const handlePayAll = async () => {
        const unpaid = facultyList.filter(m => !(m.payroll_history || []).find(h => h.month === selectedMonth));
        if (unpaid.length === 0) { showSaveMessage('Everyone is already paid for this month!'); return; }
        if (!window.confirm(`Pay all ${unpaid.length} unpaid staff for ${selectedMonth} using their base salaries?`)) return;

        for (const member of unpaid) {
            const base = Number(member.base_salary || 0);
            const history = [...(member.payroll_history || [])];
            history.push({ month: selectedMonth, base_salary: base, allowance: 0, deduction: 0, net_paid: base, paid_on: new Date().toLocaleDateString('en-CA'), status: 'paid' });
            await supabase.from('faculty').update({ payroll_history: history }).eq('id', member.id).eq('school_id', currentSchoolId);
        }
        showSaveMessage(`✅ Processed payroll for ${unpaid.length} staff members!`);
        fetchData();
    };

    // ── Aggregate analytics ───────────────────────────────────────────────────
    const analytics = useMemo(() => {
        let totalBudget = 0, totalPaid = 0, paidCount = 0, unpaidCount = 0;
        facultyList.forEach(m => {
            totalBudget += Number(m.base_salary || 0);
            const record = (m.payroll_history || []).find(h => h.month === selectedMonth);
            if (record) { totalPaid += record.net_paid; paidCount++; }
            else unpaidCount++;
        });
        return { totalBudget, totalPaid, paidCount, unpaidCount };
    }, [facultyList, selectedMonth]);

    // ── Filter faculty list ───────────────────────────────────────────────────
    const filteredFaculty = useMemo(() => {
        return facultyList.filter(m => {
            const matchSearch = !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase()) || (m.role || '').toLowerCase().includes(searchQuery.toLowerCase());
            const isPaid = !!(m.payroll_history || []).find(h => h.month === selectedMonth);
            const matchFilter = filterStatus === 'all' || (filterStatus === 'paid' && isPaid) || (filterStatus === 'unpaid' && !isPaid);
            return matchSearch && matchFilter;
        });
    }, [facultyList, selectedMonth, searchQuery, filterStatus]);

    // ── History view for a member ─────────────────────────────────────────────
    const memberWithHistory = viewingHistory ? facultyList.find(m => m.id === viewingHistory) : null;

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>

            {/* ── HEADER ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Payroll Dashboard</h2>
                    <p style={{ color: '#64748b', margin: '0.25rem 0 0', fontSize: '0.95rem' }}>Process monthly salaries, generate payslips, and track HR costs.</p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* View toggle */}
                    <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.35rem', borderRadius: '10px', gap: '0.35rem' }}>
                        {[{ id: 'payroll', label: '📋 Process' }, { id: 'history', label: '📊 Analytics' }].map(v => (
                            <button key={v.id} onClick={() => setActiveView(v.id)} style={{
                                padding: '0.45rem 1rem', borderRadius: '8px', border: 'none',
                                background: activeView === v.id ? 'white' : 'transparent',
                                color: activeView === v.id ? '#0f172a' : '#64748b',
                                fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                                boxShadow: activeView === v.id ? '0 2px 5px rgba(0,0,0,0.08)' : 'none',
                                transition: 'all 0.2s'
                            }}>{v.label}</button>
                        ))}
                    </div>

                    {/* Month Select */}
                    <select
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(e.target.value)}
                        style={{
                            padding: '0.55rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0',
                            background: 'white', fontWeight: 700, fontSize: '0.9rem', color: '#1e293b',
                            cursor: 'pointer', outline: 'none'
                        }}>
                        {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
            </div>

            {/* ── KPI CARDS ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
                <StatCard icon={Banknote} label="Monthly Budget" value={`${sym} ${analytics.totalBudget.toLocaleString()}`} sub="Sum of all base salaries" color="#3b82f6" />
                <StatCard icon={CheckCircle} label="Total Disbursed" value={`${sym} ${analytics.totalPaid.toLocaleString()}`} sub={`${analytics.paidCount} staff paid`} color="#10b981" trend={analytics.unpaidCount === 0 ? 0 : -analytics.unpaidCount} />
                <StatCard icon={Users} label="Paid / Pending" value={`${analytics.paidCount} / ${analytics.unpaidCount}`} sub="Staff this month" color="#8b5cf6" />
                <StatCard icon={AlertCircle} label="Pending Amount" value={`${sym} ${(analytics.totalBudget - analytics.totalPaid).toLocaleString()}`} sub="Unpaid salary estimate" color={analytics.unpaidCount > 0 ? '#f59e0b' : '#10b981'} />
            </div>

            {/* ── PAYROLL TABLE VIEW ── */}
            {activeView === 'payroll' && (
                <div className="animate-fade-in">
                    {/* Controls Row */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Search */}
                        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                            <Search size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text" placeholder="Search staff..." value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{ width: '100%', padding: '0.6rem 0.8rem 0.6rem 2.3rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none', background: 'white' }}
                            />
                        </div>

                        {/* Status filter */}
                        {['all', 'paid', 'unpaid'].map(f => (
                            <button key={f} onClick={() => setFilterStatus(f)} style={{
                                padding: '0.55rem 1rem', borderRadius: '8px', border: '1px solid',
                                borderColor: filterStatus === f ? '#2563eb' : '#e2e8f0',
                                background: filterStatus === f ? '#eff6ff' : 'white',
                                color: filterStatus === f ? '#2563eb' : '#64748b',
                                fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', textTransform: 'capitalize'
                            }}>
                                {f === 'all' ? '🗂 All' : f === 'paid' ? '✅ Paid' : '⏳ Pending'}
                            </button>
                        ))}

                        {/* Pay All */}
                        {analytics.unpaidCount > 0 && (
                            <button onClick={handlePayAll} style={{
                                padding: '0.6rem 1.25rem', borderRadius: '10px', border: 'none',
                                background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white',
                                fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                boxShadow: '0 4px 12px rgba(16,185,129,0.25)'
                            }}>
                                <CheckCircle size={16} /> Pay All ({analytics.unpaidCount})
                            </button>
                        )}
                    </div>

                    {/* No faculty */}
                    {facultyList.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #cbd5e1' }}>
                            <Users size={48} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
                            <h3 style={{ color: '#475569', fontWeight: 700 }}>No Staff Added Yet</h3>
                            <p style={{ color: '#94a3b8' }}>Go to Faculty tab to add staff members first.</p>
                        </div>
                    )}

                    {/* Table */}
                    {filteredFaculty.length > 0 && (
                        <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0' }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                            {['Staff Member', 'Base Salary', 'Bonus/Allowance', 'Deductions', 'Net Pay', 'Status / Action'].map(h => (
                                                <th key={h} style={{ padding: '1rem', color: '#475569', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: h === 'Status / Action' ? 'center' : 'left', whiteSpace: 'nowrap' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredFaculty.map((member, idx) => {
                                            const paidRecord = (member.payroll_history || []).find(h => h.month === selectedMonth);
                                            const isProcessing = processingId === member.id;

                                            if (paidRecord) {
                                                // ── PAID ROW ──
                                                return (
                                                    <tr key={member.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fafffe' : 'white' }}>
                                                        <td style={{ padding: '1rem 1rem' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                                <img src={member.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=eff6ff&color=2563eb&size=36`} alt={member.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }} />
                                                                <div>
                                                                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{member.name}</div>
                                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{member.role || 'Staff'}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '1rem', color: '#475569', fontWeight: 600 }}>{sym} {paidRecord.base_salary.toLocaleString()}</td>
                                                        <td style={{ padding: '1rem', color: '#2563eb', fontWeight: 600 }}>+{sym} {paidRecord.allowance.toLocaleString()}</td>
                                                        <td style={{ padding: '1rem', color: '#ef4444', fontWeight: 600 }}>−{sym} {paidRecord.deduction.toLocaleString()}</td>
                                                        <td style={{ padding: '1rem', color: '#15803d', fontWeight: 800, fontSize: '1.05rem' }}>{sym} {paidRecord.net_paid.toLocaleString()}</td>
                                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                                <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    <CheckCircle size={13} /> Paid
                                                                </div>
                                                                <button
                                                                    onClick={() => printPayslip(member, selectedMonth, schoolName, sym)}
                                                                    title="Print Payslip"
                                                                    style={{ background: '#1e3a5f', color: 'white', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    <Printer size={13} /> Slip
                                                                </button>
                                                                <button
                                                                    onClick={() => { setViewingHistory(member.id); setActiveView('history'); }}
                                                                    title="View History"
                                                                    style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    <BarChart2 size={13} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            }

                                            // ── UNPAID ROW with Input ──
                                            const edits = payrollEdits[member.id] || {};
                                            const net = getNetPay(member.id, member.base_salary);
                                            return (
                                                <tr key={member.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fffbf7' : 'white' }}>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <img src={member.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=fff7ed&color=ea580c&size=36`} alt={member.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #fed7aa' }} />
                                                            <div>
                                                                <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{member.name}</div>
                                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{member.role || 'Staff'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem' }}>
                                                        <input type="number" placeholder="0"
                                                            value={edits.base_salary !== undefined ? edits.base_salary : (member.base_salary || '')}
                                                            onChange={e => setEdit(member.id, 'base_salary', e.target.value)}
                                                            style={{ width: '110px', padding: '0.45rem 0.6rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, outline: 'none' }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem' }}>
                                                        <input type="number" placeholder="0"
                                                            value={edits.allowance || ''}
                                                            onChange={e => setEdit(member.id, 'allowance', e.target.value)}
                                                            style={{ width: '100px', padding: '0.45rem 0.6rem', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '0.9rem', background: '#eff6ff', outline: 'none' }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem' }}>
                                                        <input type="number" placeholder="0"
                                                            value={edits.deduction || ''}
                                                            onChange={e => setEdit(member.id, 'deduction', e.target.value)}
                                                            style={{ width: '100px', padding: '0.45rem 0.6rem', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '0.9rem', background: '#fef2f2', outline: 'none' }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '1rem', fontWeight: 800, fontSize: '1.05rem', color: net >= 0 ? '#0f172a' : '#dc2626' }}>
                                                        {sym} {net.toLocaleString()}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                                        <button onClick={() => handleSavePayroll(member.id)} disabled={isProcessing} style={{
                                                            background: isProcessing ? '#94a3b8' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                                                            color: 'white', border: 'none', padding: '0.5rem 1.1rem', borderRadius: '8px',
                                                            fontWeight: 700, fontSize: '0.85rem', cursor: isProcessing ? 'not-allowed' : 'pointer',
                                                            boxShadow: '0 4px 10px rgba(37,99,235,0.2)', whiteSpace: 'nowrap'
                                                        }}>
                                                            {isProcessing ? '...' : '✓ Mark Paid'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {filteredFaculty.length === 0 && facultyList.length > 0 && (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                            <Search size={40} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                            <p>No staff match your filter.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ── ANALYTICS / HISTORY VIEW ── */}
            {activeView === 'history' && (
                <div className="animate-fade-in">
                    {viewingHistory && memberWithHistory ? (
                        // ── Individual member history ──
                        <div>
                            <button onClick={() => setViewingHistory(null)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', fontWeight: 600, cursor: 'pointer', color: '#475569' }}>
                                ← Back to Overview
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1.25rem', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <img src={memberWithHistory.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(memberWithHistory.name)}&background=eff6ff&color=2563eb&size=48`} alt={memberWithHistory.name} style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }} />
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#0f172a' }}>{memberWithHistory.name}</div>
                                    <div style={{ color: '#2563eb', fontWeight: 600, fontSize: '0.9rem' }}>{memberWithHistory.role || 'Staff'} · {memberWithHistory.department || 'General'}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>Base Salary: {sym} {(memberWithHistory.base_salary || 0).toLocaleString()} / month</div>
                                </div>
                            </div>

                            {/* History table */}
                            <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e293b', margin: 0 }}>Payment History</h3>
                                    <span style={{ background: '#f1f5f9', padding: '0.3rem 0.8rem', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
                                        {(memberWithHistory.payroll_history || []).length} records
                                    </span>
                                </div>
                                {(memberWithHistory.payroll_history || []).length === 0 ? (
                                    <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No payment history yet.</div>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: '#f8fafc' }}>
                                                {['Month', 'Base Salary', 'Allowance', 'Deduction', 'Net Paid', 'Payment Date', 'Actions'].map(h => (
                                                    <th key={h} style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569', textAlign: 'left', letterSpacing: '0.5px' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[...(memberWithHistory.payroll_history || [])].reverse().map((rec, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '0.9rem 1rem', fontWeight: 700, color: '#1e293b' }}>{rec.month}</td>
                                                    <td style={{ padding: '0.9rem 1rem', color: '#475569', fontWeight: 600 }}>{sym} {rec.base_salary.toLocaleString()}</td>
                                                    <td style={{ padding: '0.9rem 1rem', color: '#2563eb', fontWeight: 600 }}>+{sym} {rec.allowance.toLocaleString()}</td>
                                                    <td style={{ padding: '0.9rem 1rem', color: '#ef4444', fontWeight: 600 }}>−{sym} {rec.deduction.toLocaleString()}</td>
                                                    <td style={{ padding: '0.9rem 1rem', color: '#15803d', fontWeight: 800 }}>{sym} {rec.net_paid.toLocaleString()}</td>
                                                    <td style={{ padding: '0.9rem 1rem', color: '#64748b', fontSize: '0.85rem' }}>{rec.paid_on}</td>
                                                    <td style={{ padding: '0.9rem 1rem' }}>
                                                        <button onClick={() => printPayslip(memberWithHistory, rec.month, schoolName, sym)} style={{ background: '#f1f5f9', color: '#1e3a5f', border: 'none', padding: '0.4rem 0.7rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Printer size={13} /> Print
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    ) : (
                        // ── Overall analytics overview ──
                        <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b', marginBottom: '1.25rem' }}>📊 All-Time Payroll Overview</h3>

                            {/* Monthly bars */}
                            <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                                <h4 style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b', marginBottom: '1.25rem' }}>Monthly Payroll Paid (Last 6 Months)</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {monthOptions.slice(0, 6).reverse().map(month => {
                                        const monthTotal = facultyList.reduce((sum, m) => {
                                            const rec = (m.payroll_history || []).find(h => h.month === month);
                                            return sum + (rec ? rec.net_paid : 0);
                                        }, 0);
                                        const budget = facultyList.reduce((s, m) => s + Number(m.base_salary || 0), 0);
                                        const pct = budget > 0 ? Math.min((monthTotal / budget) * 100, 100) : 0;
                                        return (
                                            <div key={month}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                                                    <span>{month}</span>
                                                    <span style={{ color: '#1e293b' }}>{sym} {monthTotal.toLocaleString()}</span>
                                                </div>
                                                <div style={{ height: '10px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #2563eb, #7c3aed)', borderRadius: '10px', transition: 'width 0.6s ease' }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Per-staff summary */}
                            <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                                    <h4 style={{ fontWeight: 800, color: '#1e293b', margin: 0 }}>Staff Payment Summary</h4>
                                </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc' }}>
                                            {['Staff Member', 'Base Salary', 'Total Paid (All Time)', 'Months Paid', 'Actions'].map(h => (
                                                <th key={h} style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569', textAlign: 'left', letterSpacing: '0.5px' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {facultyList.map((member, idx) => {
                                            const totalPaidAllTime = (member.payroll_history || []).reduce((s, r) => s + r.net_paid, 0);
                                            const monthsPaid = (member.payroll_history || []).length;
                                            return (
                                                <tr key={member.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <img src={member.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=eff6ff&color=2563eb&size=36`} alt={member.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                                                            <div>
                                                                <div style={{ fontWeight: 700, color: '#1e293b' }}>{member.name}</div>
                                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{member.role || 'Staff'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1rem', fontWeight: 600, color: '#475569' }}>{sym} {(member.base_salary || 0).toLocaleString()}</td>
                                                    <td style={{ padding: '1rem', fontWeight: 800, color: '#15803d', fontSize: '1.05rem' }}>{sym} {totalPaidAllTime.toLocaleString()}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{ background: monthsPaid > 0 ? '#dcfce7' : '#f1f5f9', color: monthsPaid > 0 ? '#15803d' : '#94a3b8', padding: '0.3rem 0.7rem', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 700 }}>
                                                            {monthsPaid} month{monthsPaid !== 1 ? 's' : ''}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <button onClick={() => setViewingHistory(member.id)} style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <BarChart2 size={13} /> View History
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {facultyList.length === 0 && (
                                            <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No staff data available.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PayrollTab;
