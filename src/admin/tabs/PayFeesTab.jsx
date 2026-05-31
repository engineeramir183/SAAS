import React, { useState, useMemo, useCallback } from 'react';
import { Search, X, CreditCard, Check, AlertTriangle, ChevronRight, Printer, Users } from 'lucide-react';
import { useSchoolData } from '../../context/SchoolDataContext';

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */
function getCurrentMonthLabel() {
    return new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
}
function getPrevMonthLabel() {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
}
function getAcademicYearKey() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth(); // 0-indexed
    // Academic year: if month >= 3 (April), it's y-y+1, else (y-1)-y
    if (m >= 3) return `${y}-${y + 1}`;
    return `${y - 1}-${y}`;
}
function paperFundKey() { return `Paper Fund ${getAcademicYearKey()}`; }

function computeNet(record, defaults = {}) {
    const t   = Number(record?.tuitionFee   ?? defaults.tuitionFee   ?? 0);
    const adm = Number(record?.admissionFee ?? defaults.admissionFee ?? 0);
    const ann = Number(record?.annualFee    ?? defaults.annualFee    ?? 0);
    const ex  = Number(record?.examFee      ?? defaults.examFee      ?? 0);
    const tr  = Number(record?.transportFee ?? defaults.transportFee ?? 0);
    const lab = Number(record?.labFee       ?? defaults.labFee       ?? 0);
    const fin = Number(record?.lateFine     ?? 0);
    const dis = Number(record?.discount     ?? 0);
    return t + adm + ann + ex + tr + lab + fin - dis;
}

function classSort(a, b) {
    const nA = parseInt((a || '').match(/\d+/)?.[0] || '999');
    const nB = parseInt((b || '').match(/\d+/)?.[0] || '999');
    return nA !== nB ? nA - nB : (a || '').localeCompare(b || '');
}

/* ─────────────────────────────────────────────────────────────────────────────
   PAYMENT RECEIPT PRINT
───────────────────────────────────────────────────────────────────────────── */
function printReceipt({ student, payment, schoolName, schoolLogo, currencySymbol }) {
    const html = `<!DOCTYPE html><html><head><title>Receipt — ${student.name}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter',sans-serif;padding:20mm;color:#0f172a;background:#f8fafc}
        .card{max-width:320px;margin:0 auto;background:white;border-radius:12px;border:1px solid #e2e8f0;padding:24px;box-shadow:0 4px 16px rgba(0,0,0,.07)}
        .header{text-align:center;border-bottom:2px dashed #e2e8f0;padding-bottom:14px;margin-bottom:14px}
        .logo{width:44px;height:44px;object-fit:contain;margin-bottom:6px}
        .school{font-size:16px;font-weight:800;text-transform:uppercase;letter-spacing:.3px}
        .badge{display:inline-block;border:2px solid #0f172a;padding:3px 14px;border-radius:4px;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:1.2px;margin-top:6px}
        .row{display:flex;justify-content:space-between;align-items:center;padding:5px 0;font-size:12px;font-weight:600;border-bottom:1px solid #f1f5f9}
        .lbl{color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.3px}
        .total{display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:#f8fafc;border:2px solid #0f172a;border-radius:6px;font-weight:800;font-size:13px;margin:12px 0 8px}
        .status{display:inline-block;padding:3px 10px;border-radius:4px;font-size:9px;font-weight:800;text-transform:uppercase;border:1.5px solid}
        .btn{display:block;margin:16px auto 0;padding:8px 24px;background:#0f172a;color:white;border:none;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;text-transform:uppercase;letter-spacing:.5px}
        @media print{.btn{display:none}body{background:white;padding:5mm}.card{box-shadow:none}}
    </style></head><body>
    <div class="card">
        <div class="header">
            ${schoolLogo ? `<img src="${schoolLogo}" class="logo" onerror="this.style.display='none'" />` : ''}
            <div class="school">${schoolName}</div>
            <div class="badge">Payment Receipt</div>
        </div>
        <div class="row"><span class="lbl">Student</span><span>${student.name}</span></div>
        <div class="row"><span class="lbl">ID</span><span>${student.id}</span></div>
        <div class="row"><span class="lbl">Class</span><span>${student.grade}</span></div>
        <div class="row"><span class="lbl">Date</span><span>${payment.date}</span></div>
        <div class="row"><span class="lbl">Method</span><span>${payment.method}</span></div>
        <div style="height:8px"></div>
        ${payment.items.map(item => `<div class="row"><span>${item.label}</span><span>${currencySymbol} ${item.amount.toLocaleString()}</span></div>`).join('')}
        <div class="total"><span>Amount Received</span><span>${currencySymbol} ${payment.received.toLocaleString()}</span></div>
        ${payment.advanceStored > 0 ? `<div class="row" style="color:#7c3aed"><span class="lbl" style="color:#7c3aed">Advance Stored</span><span>${currencySymbol} ${payment.advanceStored.toLocaleString()}</span></div>` : ''}
        ${payment.remaining > 0 ? `<div class="row" style="color:#dc2626"><span class="lbl" style="color:#dc2626">Still Pending</span><span>${currencySymbol} ${payment.remaining.toLocaleString()}</span></div>` : ''}
        <div style="text-align:center;margin-top:14px;font-size:9px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:.5px">System Generated</div>
        <button class="btn" onclick="window.print()">🖨 Print</button>
    </div></body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
}

/* ─────────────────────────────────────────────────────────────────────────────
   PAPER FUND TRACKER SUB-VIEW
───────────────────────────────────────────────────────────────────────────── */
const PaperFundTracker = ({ students, CLASS_FEE_DEFAULTS, sectionClasses, sections, currencySymbol, saveFeeRecords, showSaveMessage }) => {
    const [selectedClass, setSelectedClass] = useState(sectionClasses?.[0] || '');
    const [saving, setSaving] = useState(null);
    const pfKey = paperFundKey();

    const classStudents = useMemo(() =>
        students.filter(s => s.grade === selectedClass)
            .sort((a, b) => {
                const sa = parseInt(a.serialNumber, 10), sb = parseInt(b.serialNumber, 10);
                if (!isNaN(sa) && !isNaN(sb)) return sa - sb;
                return a.id.localeCompare(b.id, undefined, { numeric: true });
            }),
        [students, selectedClass]
    );

    const sortedClasses = [...(sectionClasses || [])].sort(classSort);
    const defaults = (CLASS_FEE_DEFAULTS && CLASS_FEE_DEFAULTS[selectedClass]) || {};
    const paperFundAmt = Number(defaults.paperFund || 0);

    const stats = useMemo(() => {
        const paid   = classStudents.filter(s => (s.feeHistory||[]).some(h => h.month === pfKey && h.status === 'paid')).length;
        const unpaid = classStudents.length - paid;
        return { paid, unpaid, total: classStudents.length };
    }, [classStudents, pfKey]);

    const handleTogglePaid = async (student, isPaid) => {
        setSaving(student.id);
        const record = (student.feeHistory || []).find(h => h.month === pfKey) || { month: pfKey };
        await saveFeeRecords([{
            ...record,
            student_id: student.id,
            month: pfKey,
            status: isPaid ? 'unpaid' : 'paid',
            tuitionFee: 0, admissionFee: 0, annualFee: 0, examFee: 0, transportFee: 0, labFee: paperFundAmt,
            lateFine: 0, discount: 0,
            paidAmount: isPaid ? 0 : paperFundAmt,
            paymentDate: isPaid ? null : new Date().toISOString().split('T')[0],
        }]);
        setSaving(null);
        if (showSaveMessage) showSaveMessage(`Paper Fund ${isPaid ? 'cleared' : 'marked paid'} for ${student.name}`);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Class picker */}
            <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: '#475569', fontSize: '.85rem' }}>Class:</span>
                {sortedClasses.map(cls => (
                    <button key={cls} onClick={() => setSelectedClass(cls)} style={{
                        padding: '.35rem .8rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '.82rem', fontWeight: selectedClass === cls ? 800 : 600,
                        background: selectedClass === cls ? '#0891b2' : '#f1f5f9', color: selectedClass === cls ? 'white' : '#64748b', transition: 'all .15s',
                    }}>{cls}</button>
                ))}
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.65rem' }}>
                {[
                    { label: 'Total Students', value: stats.total, color: '#2563eb', bg: '#eff6ff' },
                    { label: 'Paper Fund Paid', value: stats.paid, color: '#16a34a', bg: '#f0fdf4' },
                    { label: 'Unpaid / Pending', value: stats.unpaid, color: '#dc2626', bg: '#fef2f2' },
                ].map(s => (
                    <div key={s.label} style={{ background: s.bg, borderRadius: '10px', padding: '.75rem .8rem', textAlign: 'center', border: `1px solid ${s.color}30` }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#64748b' }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Academic year + amount */}
            <div style={{ background: '#f0f9ff', borderRadius: '10px', padding: '.6rem 1rem', fontSize: '.82rem', color: '#0369a1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                📅 Academic Year: <strong>{getAcademicYearKey()}</strong> &nbsp;|&nbsp; Paper Fund Amount: <strong>{currencySymbol} {paperFundAmt.toLocaleString()}</strong>
            </div>

            {/* Student list */}
            {classStudents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No students in {selectedClass}</div>
            ) : (
                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#0f172a', color: 'white' }}>
                                <th style={TH}>#</th>
                                <th style={TH}>Student</th>
                                <th style={{ ...TH, textAlign: 'center' }}>Paper Fund ({currencySymbol} {paperFundAmt.toLocaleString()})</th>
                                <th style={{ ...TH, textAlign: 'center' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {classStudents.map((student, idx) => {
                                const rec = (student.feeHistory || []).find(h => h.month === pfKey);
                                const isPaid = rec?.status === 'paid';
                                return (
                                    <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                                        <td style={{ ...TD, color: '#94a3b8', fontWeight: 700, width: '50px' }}>{student.serialNumber || idx + 1}</td>
                                        <td style={TD}>
                                            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '.88rem' }}>{student.name}</div>
                                            <div style={{ fontSize: '.72rem', color: '#94a3b8' }}>{student.id}</div>
                                        </td>
                                        <td style={{ ...TD, textAlign: 'center' }}>
                                            <span style={{ padding: '3px 12px', borderRadius: '999px', fontSize: '.75rem', fontWeight: 800, background: isPaid ? '#dcfce7' : '#fee2e2', color: isPaid ? '#16a34a' : '#dc2626' }}>
                                                {isPaid ? '✓ Paid' : '✗ Unpaid'}
                                            </span>
                                        </td>
                                        <td style={{ ...TD, textAlign: 'center' }}>
                                            <button
                                                onClick={() => handleTogglePaid(student, isPaid)}
                                                disabled={saving === student.id}
                                                style={{ padding: '.3rem .85rem', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '.78rem', fontWeight: 700, background: isPaid ? '#fee2e2' : '#f0fdf4', color: isPaid ? '#dc2626' : '#16a34a', transition: 'all .15s' }}
                                            >
                                                {saving === student.id ? '…' : isPaid ? 'Mark Unpaid' : 'Mark Paid'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const TH = { padding: '.65rem .8rem', fontWeight: 700, fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: '.3px', color: 'white', textAlign: 'left' };
const TD = { padding: '.65rem .8rem', verticalAlign: 'middle' };

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN PAY FEES TAB
───────────────────────────────────────────────────────────────────────────── */
const PayFeesTab = ({
    students,
    CLASS_FEE_DEFAULTS,
    sectionClasses,
    sections,
    updateStudentFeeRecord,
    currencySymbol = 'RS',
    schoolName = 'School',
    schoolLogo = '/logo.png',
    schoolSettings = {},
    showSaveMessage,
}) => {
    const { saveFeeRecords, saveAdvanceBalance } = useSchoolData();

    /* ── State ─────────────────────────────────────────────────────────── */
    const [view,            setView]            = useState('pay'); // 'pay' | 'paperfund'
    const [searchQuery,     setSearchQuery]     = useState('');
    const [searchResults,   setSearchResults]   = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [applyFine,       setApplyFine]       = useState(false);
    const [checked,         setChecked]         = useState({ currentMonth: true, pendingDues: true, paperFund: false, fine: false });
    const [amountReceived,  setAmountReceived]  = useState('');
    const [payMethod,       setPayMethod]       = useState('Cash');
    const [payDate,         setPayDate]         = useState(new Date().toISOString().split('T')[0]);
    const [processing,      setProcessing]      = useState(false);
    const [receipt,         setReceipt]         = useState(null);

    const currentMonth = getCurrentMonthLabel();
    const prevMonth    = getPrevMonthLabel();
    const pfKey        = paperFundKey();

    /* ── Search ─────────────────────────────────────────────────────────── */
    const handleSearch = (q) => {
        setSearchQuery(q);
        if (!q.trim()) { setSearchResults([]); return; }
        const lower = q.toLowerCase();
        const results = students.filter(s =>
            s.name?.toLowerCase().includes(lower) ||
            s.id?.toLowerCase().includes(lower) ||
            String(s.serialNumber || '').includes(lower)
        ).slice(0, 8);
        setSearchResults(results);
    };

    const selectStudent = (student) => {
        setSelectedStudent(student);
        setSearchQuery(student.name);
        setSearchResults([]);
        setAmountReceived('');
        setReceipt(null);
        // Reset checkboxes
        setChecked({ currentMonth: true, pendingDues: true, paperFund: false, fine: false });
    };

    /* ── Derived fee data for selected student ───────────────────────────── */
    const feeData = useMemo(() => {
        if (!selectedStudent) return null;
        const defaults = (CLASS_FEE_DEFAULTS && CLASS_FEE_DEFAULTS[selectedStudent.grade]) || {};
        const history  = selectedStudent.feeHistory || [];

        // Current month record
        const currentRec = history.find(h => h.month === currentMonth);
        const currentDue = currentRec
            ? Math.max(0, computeNet(currentRec, defaults) - Number(currentRec.paidAmount ?? 0))
            : computeNet({}, defaults); // use defaults if no record yet

        // Pending dues (all months except current that are unpaid/partial)
        const unpaidMonths = history
            .filter(h => h.month !== currentMonth && h.month !== pfKey && (h.status === 'unpaid' || h.status === 'partial'))
            .sort((a, b) => a.month.localeCompare(b.month));
        const pendingTotal = unpaidMonths.reduce((sum, h) => sum + Math.max(0, computeNet(h, defaults) - Number(h.paidAmount ?? 0)), 0);

        // Paper fund
        const pfRec = history.find(h => h.month === pfKey);
        const pfPaid = pfRec?.status === 'paid';
        const pfAmount = Number(defaults.paperFund || 0);

        // Absence fine (previous month's absences × finePerAbsent)
        const finePerDay = Number(defaults.finePerAbsent || 0);
        const prevMonthPrefix = (() => {
            const d = new Date(); d.setMonth(d.getMonth() - 1);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        })();
        const absentDays = (selectedStudent.attendance?.records || [])
            .filter(r => r.date.startsWith(prevMonthPrefix) && r.status === 'absent').length;
        const fineAmount = applyFine ? absentDays * finePerDay : 0;

        // Advance balance on student
        const advance = Number(selectedStudent.advance_balance || 0);

        return {
            defaults, history, currentRec, currentDue, currentMonth,
            unpaidMonths, pendingTotal,
            pfKey, pfPaid, pfAmount,
            fineAmount, absentDays, finePerDay,
            advance,
        };
    }, [selectedStudent, CLASS_FEE_DEFAULTS, currentMonth, pfKey, applyFine]);

    /* ── Computed totals based on checkboxes ─────────────────────────────── */
    const summary = useMemo(() => {
        if (!feeData) return null;
        let totalSelected = 0;
        if (checked.currentMonth) totalSelected += feeData.currentDue;
        if (checked.pendingDues)  totalSelected += feeData.pendingTotal;
        if (checked.paperFund && !feeData.pfPaid)   totalSelected += feeData.pfAmount;
        if (checked.fine)         totalSelected += feeData.fineAmount;

        const netDue  = Math.max(0, totalSelected - feeData.advance);
        const received = Number(amountReceived) || 0;
        const afterAdvance = received + feeData.advance;
        const clears   = Math.min(afterAdvance, totalSelected);
        const excess   = Math.max(0, afterAdvance - totalSelected);
        const remaining = Math.max(0, totalSelected - afterAdvance);

        return { totalSelected, netDue, received, afterAdvance, clears, excess, remaining };
    }, [feeData, checked, amountReceived]);

    /* ── Process payment ─────────────────────────────────────────────────── */
    const processPayment = async () => {
        if (!selectedStudent || !feeData || !summary) return;
        if (summary.received <= 0 && feeData.advance <= 0) { alert('Please enter an amount received.'); return; }

        setProcessing(true);
        const updates = [];
        let pool = summary.afterAdvance; // total available money
        const defaults = feeData.defaults;
        const receiptItems = [];

        // 1. Clear pending dues first (oldest first)
        if (checked.pendingDues && pool > 0) {
            for (const h of feeData.unpaidMonths) {
                if (pool <= 0) break;
                const due = Math.max(0, computeNet(h, defaults) - Number(h.paidAmount ?? 0));
                if (due === 0) continue;
                const paying = Math.min(pool, due);
                const newPaid = Number(h.paidAmount ?? 0) + paying;
                const newStatus = newPaid >= computeNet(h, defaults) ? 'paid' : 'partial';
                updates.push({ ...h, student_id: selectedStudent.id, status: newStatus, paidAmount: newPaid, paymentDate: payDate, paymentMethod: payMethod });
                receiptItems.push({ label: `${h.month} (dues)`, amount: paying });
                pool -= paying;
            }
        }

        // 2. Clear current month
        if (checked.currentMonth && pool > 0 && feeData.currentDue > 0) {
            const paying = Math.min(pool, feeData.currentDue);
            const base = feeData.currentRec || { month: currentMonth, ...defaults, paidAmount: 0, status: 'unpaid' };
            const newPaid = Number(base.paidAmount ?? 0) + paying;
            const totalNet = computeNet(base, defaults);
            const newStatus = newPaid >= totalNet ? 'paid' : 'partial';
            updates.push({ ...base, student_id: selectedStudent.id, status: newStatus, paidAmount: newPaid, paymentDate: payDate, paymentMethod: payMethod });
            receiptItems.push({ label: `${currentMonth} (current)`, amount: paying });
            pool -= paying;
        }

        // 3. Clear paper fund
        if (checked.paperFund && !feeData.pfPaid && feeData.pfAmount > 0 && pool > 0) {
            const paying = Math.min(pool, feeData.pfAmount);
            const base = feeData.history.find(h => h.month === pfKey) || { month: pfKey };
            updates.push({
                ...base, student_id: selectedStudent.id, month: pfKey,
                status: paying >= feeData.pfAmount ? 'paid' : 'partial',
                tuitionFee: 0, admissionFee: 0, annualFee: 0, examFee: 0, transportFee: 0, labFee: feeData.pfAmount,
                lateFine: 0, discount: 0, paidAmount: paying, paymentDate: payDate, paymentMethod: payMethod,
            });
            receiptItems.push({ label: 'Paper Fund (annual)', amount: paying });
            pool -= paying;
        }

        // 4. Auto-advance to future open months
        if (pool > 0) {
            const futureMonths = feeData.history
                .filter(h => h.month !== currentMonth && h.month !== pfKey && h.status === 'unpaid' && h.month > currentMonth)
                .sort((a, b) => a.month.localeCompare(b.month));
            for (const h of futureMonths) {
                if (pool <= 0) break;
                const due = Math.max(0, computeNet(h, defaults) - Number(h.paidAmount ?? 0));
                if (due === 0) continue;
                const paying = Math.min(pool, due);
                const newPaid = Number(h.paidAmount ?? 0) + paying;
                const newStatus = newPaid >= computeNet(h, defaults) ? 'paid' : 'partial';
                updates.push({ ...h, student_id: selectedStudent.id, status: newStatus, paidAmount: newPaid, paymentDate: payDate, paymentMethod: payMethod });
                receiptItems.push({ label: `${h.month} (advance)`, amount: paying });
                pool -= paying;
            }
        }

        // 5. Save all fee record updates
        if (updates.length > 0) {
            await saveFeeRecords(updates);
        }

        // 6. Save advance balance
        const newAdvance = Math.round(pool * 100) / 100;
        if (saveAdvanceBalance) {
            await saveAdvanceBalance(selectedStudent.id, newAdvance);
        }

        setProcessing(false);

        // 7. Show receipt
        const receiptData = {
            date: payDate, method: payMethod,
            items: receiptItems,
            received: summary.received,
            advanceStored: newAdvance,
            remaining: summary.remaining,
        };
        setReceipt(receiptData);
        if (showSaveMessage) showSaveMessage(`Payment of ${currencySymbol} ${summary.received.toLocaleString()} processed for ${selectedStudent.name}!`);
    };

    /* ── Quick amount presets ─────────────────────────────────────────────── */
    const setExact = () => { if (summary) setAmountReceived(String(summary.netDue)); };
    const setClear = () => setAmountReceived('');

    /* ─────────────────────────────────────────────────────────────────────
       RENDER
    ───────────────────────────────────────────────────────────────────── */
    return (
        <div className="animate-fade-in" style={{ maxWidth: '760px', margin: '0 auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* ── Header + View Toggle ──────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.75rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>💳 Pay Fees</h2>
                    <p style={{ color: '#64748b', fontSize: '.82rem', margin: '3px 0 0' }}>Process student payments with smart allocation</p>
                </div>
                <div style={{ display: 'flex', borderRadius: '10px', border: '1.5px solid #e2e8f0', overflow: 'hidden' }}>
                    {[
                        { id: 'pay',       label: '💳 Payment', icon: CreditCard },
                        { id: 'paperfund', label: '📄 Paper Fund', icon: Users },
                    ].map(v => (
                        <button key={v.id} onClick={() => setView(v.id)} style={{
                            padding: '.5rem 1.1rem', fontSize: '.83rem', fontWeight: view === v.id ? 800 : 600,
                            background: view === v.id ? '#0f172a' : 'white', color: view === v.id ? 'white' : '#64748b',
                            border: 'none', cursor: 'pointer', transition: 'all .15s',
                        }}>{v.label}</button>
                    ))}
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                PAPER FUND TRACKER VIEW
            ══════════════════════════════════════════════════════════════ */}
            {view === 'paperfund' && (
                <PaperFundTracker
                    students={students}
                    CLASS_FEE_DEFAULTS={CLASS_FEE_DEFAULTS}
                    sectionClasses={sectionClasses}
                    sections={sections}
                    currencySymbol={currencySymbol}
                    saveFeeRecords={saveFeeRecords}
                    showSaveMessage={showSaveMessage}
                />
            )}

            {/* ══════════════════════════════════════════════════════════════
                PAYMENT VIEW
            ══════════════════════════════════════════════════════════════ */}
            {view === 'pay' && (<>

                {/* ── Absence Fine Toggle (school-wide) ─────────────────── */}
                <div style={{ background: applyFine ? '#fffbeb' : '#f8fafc', border: `1.5px solid ${applyFine ? '#fde68a' : '#e2e8f0'}`, borderRadius: '12px', padding: '.85rem 1.1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', transition: 'all .2s' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '.9rem' }}>⚠ Apply Absence Fine (Previous Month)</div>
                        <div style={{ color: '#64748b', fontSize: '.78rem', marginTop: '2px' }}>
                            When ON: fine is auto-calculated from last month's absences × rate set in Fee Settings.
                            Currently covers: <strong>{prevMonth}</strong>
                        </div>
                    </div>
                    <button
                        onClick={() => setApplyFine(p => !p)}
                        style={{ padding: '.4rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '.83rem', background: applyFine ? '#f59e0b' : '#e2e8f0', color: applyFine ? 'white' : '#64748b', transition: 'all .2s', minWidth: '70px' }}
                    >
                        {applyFine ? '● ON' : '○ OFF'}
                    </button>
                </div>

                {/* ── Student Search ───────────────────────────────────────── */}
                <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Search student by Name, ID or Serial Number…"
                        value={searchQuery}
                        onChange={e => { handleSearch(e.target.value); if (!e.target.value) setSelectedStudent(null); }}
                        className="form-input"
                        style={{ paddingLeft: '36px', paddingRight: '36px', width: '100%', borderRadius: '10px' }}
                        autoFocus
                    />
                    {searchQuery && (
                        <button onClick={() => { setSearchQuery(''); setSearchResults([]); setSelectedStudent(null); setReceipt(null); }} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
                            <X size={16} />
                        </button>
                    )}
                    {/* Dropdown */}
                    {searchResults.length > 0 && (
                        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,.1)', zIndex: 100, overflow: 'hidden' }}>
                            {searchResults.map(s => (
                                <button key={s.id} onClick={() => selectStudent(s)} style={{ width: '100%', padding: '.7rem 1rem', background: 'none', border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '.75rem', transition: 'background .12s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                >
                                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '.75rem', flexShrink: 0, overflow: 'hidden' }}>
                                        {(s.photo || s.image) ? <img src={s.photo || s.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : s.name?.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '.88rem' }}>{s.name}</div>
                                        <div style={{ fontSize: '.72rem', color: '#94a3b8' }}>{s.id} · {s.grade} · S#{s.serialNumber || '—'}</div>
                                    </div>
                                    <ChevronRight size={14} style={{ marginLeft: 'auto', color: '#cbd5e1' }} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Student Card ───────────────────────────────────────────── */}
                {selectedStudent && (
                    <div style={{ background: 'white', border: '2px solid #e2e8f0', borderRadius: '14px', padding: '1.1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '52px', height: '52px', borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '.9rem', flexShrink: 0 }}>
                            {(selectedStudent.photo || selectedStudent.image) ? <img src={selectedStudent.photo || selectedStudent.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : selectedStudent.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b' }}>{selectedStudent.name}</div>
                            <div style={{ fontSize: '.78rem', color: '#64748b' }}>{selectedStudent.id} · {selectedStudent.grade} · Serial #{selectedStudent.serialNumber || '—'}</div>
                        </div>
                        {(selectedStudent.advance_balance || 0) > 0 && (
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '.7rem', color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase' }}>Advance Balance</div>
                                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#7c3aed' }}>{currencySymbol} {Number(selectedStudent.advance_balance).toLocaleString()}</div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Fee Breakdown + Checkboxes ────────────────────────────── */}
                {feeData && (
                    <div style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
                        <div style={{ padding: '.7rem 1.1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 800, fontSize: '.85rem', color: '#1e293b' }}>
                            Fee Breakdown
                        </div>
                        <div style={{ padding: '.85rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                            {/* Current month */}
                            <label style={{ display: 'flex', alignItems: 'center', gap: '.75rem', cursor: 'pointer', padding: '.6rem .75rem', borderRadius: '8px', background: checked.currentMonth ? '#eff6ff' : '#f8fafc', transition: 'background .15s' }}>
                                <input type="checkbox" checked={checked.currentMonth} onChange={e => setChecked(p => ({ ...p, currentMonth: e.target.checked }))} style={{ width: '16px', height: '16px', accentColor: '#2563eb', cursor: 'pointer' }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '.88rem' }}>Current Month Fee</div>
                                    <div style={{ fontSize: '.72rem', color: '#64748b' }}>{currentMonth} {feeData.currentRec ? `· ${feeData.currentRec.status}` : '· not opened yet'}</div>
                                </div>
                                <span style={{ fontWeight: 800, color: '#2563eb', fontSize: '.9rem' }}>{currencySymbol} {feeData.currentDue.toLocaleString()}</span>
                            </label>

                            {/* Pending dues */}
                            <label style={{ display: 'flex', alignItems: 'center', gap: '.75rem', cursor: feeData.pendingTotal > 0 ? 'pointer' : 'default', padding: '.6rem .75rem', borderRadius: '8px', background: checked.pendingDues && feeData.pendingTotal > 0 ? '#fef2f2' : '#f8fafc', transition: 'background .15s', opacity: feeData.pendingTotal === 0 ? .5 : 1 }}>
                                <input type="checkbox" checked={checked.pendingDues && feeData.pendingTotal > 0} disabled={feeData.pendingTotal === 0} onChange={e => setChecked(p => ({ ...p, pendingDues: e.target.checked }))} style={{ width: '16px', height: '16px', accentColor: '#dc2626', cursor: feeData.pendingTotal > 0 ? 'pointer' : 'default' }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '.88rem' }}>Pending Dues</div>
                                    <div style={{ fontSize: '.72rem', color: '#64748b' }}>
                                        {feeData.unpaidMonths.length > 0 ? feeData.unpaidMonths.map(h => h.month).join(', ') : 'No pending dues'}
                                    </div>
                                </div>
                                <span style={{ fontWeight: 800, color: '#dc2626', fontSize: '.9rem' }}>{currencySymbol} {feeData.pendingTotal.toLocaleString()}</span>
                            </label>

                            {/* Paper fund */}
                            <label style={{ display: 'flex', alignItems: 'center', gap: '.75rem', cursor: !feeData.pfPaid && feeData.pfAmount > 0 ? 'pointer' : 'default', padding: '.6rem .75rem', borderRadius: '8px', background: checked.paperFund && !feeData.pfPaid ? '#f0f9ff' : '#f8fafc', opacity: feeData.pfPaid || feeData.pfAmount === 0 ? .5 : 1 }}>
                                <input type="checkbox" checked={checked.paperFund && !feeData.pfPaid} disabled={feeData.pfPaid || feeData.pfAmount === 0} onChange={e => setChecked(p => ({ ...p, paperFund: e.target.checked }))} style={{ width: '16px', height: '16px', accentColor: '#0891b2' }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '.88rem' }}>Paper Fund</div>
                                    <div style={{ fontSize: '.72rem', color: '#64748b' }}>Annual charge · {getAcademicYearKey()} · {feeData.pfPaid ? '✓ Already paid' : 'Not yet paid'}</div>
                                </div>
                                <span style={{ fontWeight: 800, color: '#0891b2', fontSize: '.9rem' }}>{feeData.pfPaid ? <span style={{ color: '#16a34a' }}>✓ Paid</span> : `${currencySymbol} ${feeData.pfAmount.toLocaleString()}`}</span>
                            </label>

                            {/* Fine */}
                            <label style={{ display: 'flex', alignItems: 'center', gap: '.75rem', cursor: applyFine ? 'pointer' : 'default', padding: '.6rem .75rem', borderRadius: '8px', background: checked.fine && applyFine ? '#fffbeb' : '#f8fafc', opacity: !applyFine ? .45 : 1 }}>
                                <input type="checkbox" checked={checked.fine && applyFine} disabled={!applyFine} onChange={e => setChecked(p => ({ ...p, fine: e.target.checked }))} style={{ width: '16px', height: '16px', accentColor: '#d97706' }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '.88rem' }}>Absence Fine</div>
                                    <div style={{ fontSize: '.72rem', color: '#64748b' }}>
                                        {applyFine ? `${feeData.absentDays} absent days × ${currencySymbol} ${feeData.finePerDay}/day (${prevMonth})` : 'Enable "Apply Absence Fine" above'}
                                    </div>
                                </div>
                                <span style={{ fontWeight: 800, color: '#d97706', fontSize: '.9rem' }}>{applyFine ? `${currencySymbol} ${feeData.fineAmount.toLocaleString()}` : '—'}</span>
                            </label>

                            {/* Divider + totals */}
                            <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '.65rem', display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.85rem', color: '#64748b' }}>
                                    <span>Total Selected</span>
                                    <span style={{ fontWeight: 700, color: '#1e293b' }}>{currencySymbol} {summary?.totalSelected.toLocaleString() || 0}</span>
                                </div>
                                {feeData.advance > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.85rem', color: '#7c3aed' }}>
                                        <span>Advance Balance Available</span>
                                        <span style={{ fontWeight: 700 }}>− {currencySymbol} {feeData.advance.toLocaleString()}</span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1rem', color: '#0f172a', background: '#f8fafc', padding: '.5rem .75rem', borderRadius: '8px', border: '1.5px solid #e2e8f0' }}>
                                    <span>Net Due</span>
                                    <span>{currencySymbol} {summary?.netDue.toLocaleString() || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Payment Input ─────────────────────────────────────────── */}
                {feeData && (
                    <div style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                        <div style={{ fontWeight: 800, fontSize: '.9rem', color: '#1e293b' }}>Payment Details</div>

                        <div>
                            <label style={{ display: 'block', fontWeight: 700, color: '#475569', fontSize: '.85rem', marginBottom: '.35rem' }}>Amount Received ({currencySymbol})</label>
                            <div style={{ display: 'flex', gap: '.5rem' }}>
                                <input
                                    type="number" min="0"
                                    value={amountReceived}
                                    onChange={e => setAmountReceived(e.target.value)}
                                    className="form-input"
                                    style={{ flex: 1, fontSize: '1.15rem', fontWeight: 800 }}
                                    placeholder="0"
                                />
                                <button onClick={setExact} style={{ padding: '.5rem .9rem', background: '#f0fdf4', border: '1px solid #86efac', color: '#16a34a', borderRadius: '8px', fontWeight: 700, fontSize: '.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>Exact</button>
                                <button onClick={setClear} style={{ padding: '.5rem .9rem', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: '8px', fontWeight: 700, fontSize: '.8rem', cursor: 'pointer' }}>Clear</button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: 700, color: '#475569', fontSize: '.82rem', marginBottom: '.3rem' }}>Payment Method</label>
                                <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="form-input" style={{ width: '100%' }}>
                                    {['Cash', 'Bank Transfer', 'EasyPaisa', 'JazzCash', 'Cheque', 'Online Portal'].map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 700, color: '#475569', fontSize: '.82rem', marginBottom: '.3rem' }}>Payment Date</label>
                                <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} className="form-input" style={{ width: '100%' }} />
                            </div>
                        </div>

                        {/* After-payment preview */}
                        {summary && Number(amountReceived) > 0 && (
                            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '.75rem .9rem', border: '1px solid #e2e8f0', fontSize: '.83rem' }}>
                                <div style={{ fontWeight: 700, color: '#475569', marginBottom: '.4rem', fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.3px' }}>After Payment Preview</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '.2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: 700 }}>
                                        <span>✓ Amount clearing dues</span><span>{currencySymbol} {summary.clears.toLocaleString()}</span>
                                    </div>
                                    {summary.excess > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7c3aed', fontWeight: 700 }}>
                                        <span>💜 Stored as advance</span><span>{currencySymbol} {summary.excess.toLocaleString()}</span>
                                    </div>}
                                    {summary.remaining > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626', fontWeight: 700 }}>
                                        <span>⚠ Still pending</span><span>{currencySymbol} {summary.remaining.toLocaleString()}</span>
                                    </div>}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={processPayment}
                            disabled={processing || !summary || (Number(amountReceived) <= 0 && feeData.advance <= 0)}
                            style={{ padding: '.8rem', background: processing ? '#94a3b8' : 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '1rem', cursor: processing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem', boxShadow: '0 4px 12px rgba(37,99,235,.3)', transition: 'all .2s' }}
                        >
                            {processing ? '⏳ Processing…' : <><CreditCard size={18} /> Process Payment</>}
                        </button>
                    </div>
                )}

                {/* ── Receipt ─────────────────────────────────────────────── */}
                {receipt && selectedStudent && (
                    <div style={{ background: '#f0fdf4', border: '2px solid #86efac', borderRadius: '14px', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ fontWeight: 800, color: '#16a34a', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                                <Check size={18} /> Payment Processed Successfully!
                            </div>
                            <button
                                onClick={() => printReceipt({ student: selectedStudent, payment: receipt, schoolName, schoolLogo, currencySymbol })}
                                style={{ padding: '.4rem .9rem', background: '#0f172a', color: 'white', border: 'none', borderRadius: '7px', fontWeight: 700, fontSize: '.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.35rem' }}
                            >
                                <Printer size={13} /> Print Receipt
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '.25rem', fontSize: '.83rem' }}>
                            {receipt.items.map((item, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: '#15803d', fontWeight: 600 }}>
                                    <span>✓ {item.label}</span><span>{currencySymbol} {item.amount.toLocaleString()}</span>
                                </div>
                            ))}
                            {receipt.advanceStored > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7c3aed', fontWeight: 700 }}>
                                <span>💜 Advance stored</span><span>{currencySymbol} {receipt.advanceStored.toLocaleString()}</span>
                            </div>}
                            {receipt.remaining > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626', fontWeight: 700 }}>
                                <span>⚠ Remaining pending</span><span>{currencySymbol} {receipt.remaining.toLocaleString()}</span>
                            </div>}
                        </div>
                    </div>
                )}

            </>)}
        </div>
    );
};

export default PayFeesTab;
