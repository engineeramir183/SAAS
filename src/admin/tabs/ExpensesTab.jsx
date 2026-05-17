import React, { useState, useEffect, useMemo } from 'react';
import { PlusCircle, Trash2, TrendingUp, TrendingDown, DollarSign, Search, X } from 'lucide-react';
import { useSchoolData } from '../../context/SchoolDataContext';

const CATEGORIES = ['Utilities (Elec/Water)', 'Teacher Salaries', 'Staff Wages', 'Building Rent', 'Stationery/Supplies', 'Maintenance', 'Event/Function', 'Other'];

const EMPTY = { title: '', amount: '', expense_date: new Date().toISOString().split('T')[0], category: 'Utilities (Elec/Water)', status: 'Paid', notes: '' };

export default function ExpensesTab({ schoolData, showSaveMessage, currencySymbol }) {
    const sym = currencySymbol || 'RS';
    const { expenseRecords, fetchExpenseRecords, saveExpenseRecord, deleteExpenseRecord, payrollRecords } = useSchoolData();
    const students = schoolData?.students || [];

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('all');
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchExpenseRecords(); }, []);

    // Revenue from fee_records (already in context as feeHistory on students)
    const totalRevenue = useMemo(() => {
        let total = 0;
        students.forEach(s => {
            (s.feeHistory || []).forEach(h => {
                if (h.status === 'paid' || h.status === 'partial') {
                    total += Number(h.paidAmount || 0);
                }
            });
        });
        return total;
    }, [students]);

    const totalExpenses = useMemo(() => expenseRecords.reduce((s, e) => s + Number(e.amount), 0), [expenseRecords]);
    // Also include payroll as an expense in P&L
    const totalPayroll = useMemo(() => payrollRecords.reduce((s, r) => s + Number(r.net_paid), 0), [payrollRecords]);
    const netProfit = totalRevenue - totalExpenses - totalPayroll;

    const handleSave = async () => {
        if (!form.title || !form.amount) return;
        setSaving(true);
        const { error } = await saveExpenseRecord({ ...form, amount: Number(form.amount) });
        setSaving(false);
        if (!error) {
            showSaveMessage('✅ Expense saved!');
            setShowForm(false);
            setForm(EMPTY);
        } else alert('Error: ' + error.message);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this expense?')) return;
        const { error } = await deleteExpenseRecord(id);
        if (!error) showSaveMessage('Expense deleted.');
        else alert('Error: ' + error.message);
    };

    const filtered = expenseRecords.filter(e => {
        const s = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase());
        const c = catFilter === 'all' || e.category === catFilter;
        return s && c;
    });

    const plColor = netProfit >= 0 ? '#16a34a' : '#dc2626';
    const plBg = netProfit >= 0 ? '#f0fdf4' : '#fef2f2';
    const plBorder = netProfit >= 0 ? '#86efac' : '#fca5a5';

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>📉 Expense Tracker & P&L</h2>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>Track costs and view net profit/loss.</p>
                </div>
                <button onClick={() => setShowForm(v => !v)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: 'white',
                    border: 'none', borderRadius: 10, padding: '0.6rem 1.25rem', fontWeight: 700, cursor: 'pointer'
                }}>
                    {showForm ? <X size={16} /> : <PlusCircle size={16} />} {showForm ? 'Cancel' : 'Log Expense'}
                </button>
            </div>

            {/* P&L Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total Revenue', val: totalRevenue, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: TrendingUp },
                    { label: 'Expenses', val: totalExpenses, color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: TrendingDown },
                    { label: 'Payroll Cost', val: totalPayroll, color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', icon: TrendingDown },
                    { label: 'Net Profit / Loss', val: netProfit, color: plColor, bg: plBg, border: plBorder, icon: DollarSign },
                ].map(({ label, val, color, bg, border, icon: Icon }) => (
                    <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 16, padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ color, fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color, marginTop: '0.4rem' }}>{sym} {val.toLocaleString()}</div>
                        <Icon size={52} style={{ position: 'absolute', right: -8, bottom: -8, color, opacity: 0.1 }} />
                    </div>
                ))}
            </div>

            {/* Add Form */}
            {showForm && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1rem', color: '#0f172a' }}>Log New Expense</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem' }}>
                        <div>
                            <label className="form-label">Expense Title</label>
                            <input className="form-input" placeholder="e.g. Electric Bill" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                        </div>
                        <div>
                            <label className="form-label">Amount ({sym})</label>
                            <input className="form-input" type="number" placeholder="0" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
                        </div>
                        <div>
                            <label className="form-label">Category</label>
                            <select className="form-input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Date</label>
                            <input className="form-input" type="date" value={form.expense_date} onChange={e => setForm(p => ({ ...p, expense_date: e.target.value }))} />
                        </div>
                        <div>
                            <label className="form-label">Status</label>
                            <select className="form-input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                                <option>Paid</option><option>Pending</option>
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Notes (optional)</label>
                            <input className="form-input" placeholder="Any notes..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                        </div>
                    </div>
                    <button onClick={handleSave} disabled={saving} style={{
                        marginTop: '1rem', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: 'white',
                        border: 'none', borderRadius: 10, padding: '0.65rem 2rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer'
                    }}>{saving ? 'Saving...' : 'Save Expense'}</button>
                </div>
            )}

            {/* Ledger Table */}
            <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e293b', margin: 0 }}>Ledger History</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                                style={{ padding: '0.45rem 0.75rem 0.45rem 2rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', width: 180 }} />
                        </div>
                        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                            style={{ padding: '0.45rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}>
                            <option value="all">All Categories</option>
                            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                {['Date', 'Title', 'Category', 'Status', `Amount (${sym})`, 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((exp, idx) => (
                                <tr key={exp.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                                    <td style={{ padding: '0.9rem 1rem', color: '#64748b', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                        {new Date(exp.expense_date).toLocaleDateString('en-GB')}
                                    </td>
                                    <td style={{ padding: '0.9rem 1rem', fontWeight: 700, color: '#1e293b' }}>{exp.title}</td>
                                    <td style={{ padding: '0.9rem 1rem' }}>
                                        <span style={{ background: '#f1f5f9', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: 4, fontSize: '0.78rem', fontWeight: 600 }}>{exp.category}</span>
                                    </td>
                                    <td style={{ padding: '0.9rem 1rem' }}>
                                        <span style={{ background: exp.status === 'Paid' ? '#dcfce7' : '#fef9c3', color: exp.status === 'Paid' ? '#15803d' : '#a16207', padding: '0.2rem 0.6rem', borderRadius: 4, fontSize: '0.78rem', fontWeight: 700 }}>{exp.status}</span>
                                    </td>
                                    <td style={{ padding: '0.9rem 1rem', fontWeight: 800, color: '#dc2626' }}>{Number(exp.amount).toLocaleString()}</td>
                                    <td style={{ padding: '0.9rem 1rem' }}>
                                        <button onClick={() => handleDelete(exp.id)} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, padding: '0.3rem 0.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.78rem', fontWeight: 700 }}>
                                            <Trash2 size={13} /> Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No expenses found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
