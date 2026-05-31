import React, { useState, useMemo } from 'react';
import { Search, Plus, Printer, Edit3, X, ChevronDown, ChevronRight, Save, Check } from 'lucide-react';
import { useSchoolData } from '../../context/SchoolDataContext';

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */

function classSort(a, b) {
    const numA = parseInt((a || '').match(/\d+/)?.[0] || '999');
    const numB = parseInt((b || '').match(/\d+/)?.[0] || '999');
    return numA !== numB ? numA - numB : (a || '').localeCompare(b || '');
}

function getCurrentMonthLabel() {
    return new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
}

function monthInputToLabel(val) {
    if (!val) return '';
    const [year, month] = val.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
}

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

function isFreeStudent(student, classDefaults) {
    if (computeNet({}, classDefaults) === 0) return true;
    const hist = student.feeHistory || [];
    if (hist.length > 0 && hist.every(h => computeNet(h, classDefaults) === 0)) return true;
    return false;
}

function isDefaulter(student, currentMonthLabel) {
    const hist = student.feeHistory || [];
    const idx  = hist.findIndex(h => h.month === currentMonthLabel);
    const before = idx >= 0 ? hist.slice(0, idx) : hist;
    return before.some(h => h.status === 'unpaid' || h.status === 'partial');
}

/* ─────────────────────────────────────────────────────────────────────────────
   VOUCHER PRINT STYLES + BUILDER
───────────────────────────────────────────────────────────────────────────── */
const VOUCHER_CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; }
    body { font-family:'Inter',sans-serif; padding:10mm; color:#0f172a; background:#f8fafc; margin:0; }
    .grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    .receipt { background:white; border:1px solid #cbd5e1; border-radius:8px; padding:18px; box-shadow:0 2px 8px rgba(15,23,42,.05); page-break-inside:avoid; }
    .receipt-header { text-align:center; border-bottom:2px solid #0f172a; padding-bottom:10px; margin-bottom:12px; }
    .school-logo { width:40px; height:40px; object-fit:contain; margin-bottom:4px; }
    .school-name { margin:0; font-size:15px; font-weight:800; color:#0f172a; text-transform:uppercase; letter-spacing:.3px; }
    .receipt-badge { display:inline-block; border:1.5px solid #0f172a; color:#0f172a; font-size:8px; font-weight:800; padding:2px 8px; border-radius:4px; text-transform:uppercase; margin-top:4px; letter-spacing:1px; }
    .rrow { display:flex; justify-content:space-between; align-items:center; padding:4px 0; font-size:11px; font-weight:600; border-bottom:1px solid #f1f5f9; }
    .lbl { color:#64748b; font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.3px; }
    .val { color:#0f172a; font-weight:700; }
    .sb { padding:2px 6px; border-radius:4px; font-size:8px; font-weight:800; text-transform:uppercase; border:1px solid; }
    .total-row { display:flex; justify-content:space-between; align-items:center; padding:7px 10px; background:#f8fafc; border:1.5px solid #0f172a; border-radius:5px; font-weight:800; font-size:12px; margin-top:8px; }
    .btn-print { margin:0 auto 16px; display:block; padding:8px 20px; background:#0f172a; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:700; font-size:12px; text-transform:uppercase; letter-spacing:.5px; }
    @media print { .btn-print { display:none; } body { background:white; padding:5mm; } .receipt { box-shadow:none; } }
`;

function buildVoucherHTML(student, record, defaults, sym, schoolName, schoolLogo, schoolSettings) {
    const net     = computeNet(record, defaults);
    const paid    = Number(record?.paidAmount ?? 0);
    const balance = Math.max(0, net - paid);
    const status  = record?.status || 'unpaid';
    const sbStyle = `background:${status==='paid'?'#f0fdf4':status==='partial'?'#fffbeb':'#fdf2f2'};color:${status==='paid'?'#16a34a':status==='partial'?'#b45309':'#dc2626'};border-color:${status==='paid'?'#bbf7d0':status==='partial'?'#fef3c7':'#fecaca'}`;

    const feeRow = (label, val) => val > 0 ? `<div class="rrow"><span>${label}</span><span>${sym} ${Number(val).toLocaleString()}</span></div>` : '';

    return `
    <div class="receipt">
        <div class="receipt-header">
            ${schoolLogo ? `<img class="school-logo" src="${schoolLogo}" onerror="this.style.display='none'" />` : ''}
            <h2 class="school-name">${schoolName}</h2>
            <span class="receipt-badge">Fee Voucher — ${record?.month || ''}</span>
        </div>
        <div class="rrow"><span class="lbl">Student</span><span class="val">${student.name}</span></div>
        <div class="rrow"><span class="lbl">ID</span><span class="val">${student.id}</span></div>
        <div class="rrow"><span class="lbl">Serial #</span><span class="val">${student.serialNumber || '—'}</span></div>
        <div class="rrow"><span class="lbl">Class</span><span class="val">${student.grade}</span></div>
        <div class="rrow"><span class="lbl">Status</span><span class="sb" style="${sbStyle}">${status.toUpperCase()}</span></div>
        <div style="height:6px"></div>
        <div style="font-size:9px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px">Breakdown</div>
        ${feeRow('Tuition Fee',   Number(record?.tuitionFee   ?? defaults.tuitionFee   ?? 0))}
        ${feeRow('Admission Fee', Number(record?.admissionFee ?? defaults.admissionFee ?? 0))}
        ${feeRow('Annual',        Number(record?.annualFee    ?? defaults.annualFee    ?? 0))}
        ${feeRow('Exam Fee',      Number(record?.examFee      ?? defaults.examFee      ?? 0))}
        ${feeRow('Transport',     Number(record?.transportFee ?? defaults.transportFee ?? 0))}
        ${feeRow('Lab / Other',   Number(record?.labFee       ?? defaults.labFee       ?? 0))}
        ${Number(record?.lateFine??0) > 0 ? `<div class="rrow" style="color:#dc2626"><span>Late Fine</span><span>+ ${sym} ${Number(record.lateFine).toLocaleString()}</span></div>` : ''}
        ${Number(record?.discount??0) > 0 ? `<div class="rrow" style="color:#16a34a"><span>Discount</span><span>- ${sym} ${Number(record.discount).toLocaleString()}</span></div>` : ''}
        <div class="total-row"><span style="font-size:10px;text-transform:uppercase;letter-spacing:.3px">Net Payable</span><span>${sym} ${net.toLocaleString()}</span></div>
        <div class="rrow" style="margin-top:8px"><span class="lbl">Amount Paid</span><span class="val">${sym} ${paid.toLocaleString()}</span></div>
        <div class="rrow" style="color:#dc2626;font-weight:800"><span class="lbl" style="color:#dc2626">Balance Due</span><span style="font-size:13px">${sym} ${balance.toLocaleString()}</span></div>
        <hr style="border:0;border-top:1px dashed #cbd5e1;margin:10px 0" />
        ${record?.paymentMethod ? `<div class="rrow" style="font-size:10px"><span class="lbl">Method</span><span>${record.paymentMethod}</span></div>` : ''}
        ${record?.paymentDate   ? `<div class="rrow" style="font-size:10px"><span class="lbl">Date</span><span>${record.paymentDate}</span></div>` : ''}
        ${schoolSettings?.bank_account     ? `<div style="font-size:9px;color:#64748b;margin-top:6px">Bank: ${schoolSettings.bank_name||''} / ${schoolSettings.bank_account}</div>` : ''}
        ${schoolSettings?.easypaisa_number ? `<div style="font-size:9px;color:#64748b">EasyPaisa: ${schoolSettings.easypaisa_number}</div>` : ''}
        ${schoolSettings?.jazzcash_number  ? `<div style="font-size:9px;color:#64748b">JazzCash: ${schoolSettings.jazzcash_number}</div>` : ''}
        <div style="text-align:center;font-size:8px;margin-top:12px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:.5px">System Generated</div>
    </div>`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   ADD MONTH MODAL
───────────────────────────────────────────────────────────────────────────── */
const AddMonthModal = ({ selectedClass, students, classDefaults, onClose, onSuccess, saveFeeRecords, currencySymbol }) => {
    const [monthVal, setMonthVal] = useState('');
    const [saving, setSaving]     = useState(false);
    const [error, setError]       = useState('');

    const handleAdd = async () => {
        if (!monthVal) { setError('Please select a month.'); return; }
        const label = monthInputToLabel(monthVal);
        const cls   = students.filter(s => s.grade === selectedClass);
        if (cls.length === 0) { setError('No students in this class.'); return; }
        if (cls.some(s => (s.feeHistory || []).some(h => h.month === label))) {
            setError(`"${label}" is already open for this class.`); return;
        }
        setSaving(true);
        const records = cls.map(s => ({
            student_id:   s.id,
            month:        label,
            status:       'unpaid',
            tuitionFee:   classDefaults.tuitionFee   || 0,
            admissionFee: classDefaults.admissionFee || 0,
            annualFee:    classDefaults.annualFee    || 0,
            examFee:      classDefaults.examFee      || 0,
            transportFee: classDefaults.transportFee || 0,
            labFee:       classDefaults.labFee       || 0,
            lateFine: 0, discount: 0, paidAmount: 0,
        }));
        const { error: err } = await saveFeeRecords(records);
        setSaving(false);
        if (err) { setError('Save failed: ' + err.message); return; }
        onSuccess(label);
        onClose();
    };

    const hasDefaults = Object.values(classDefaults).some(v => Number(v) > 0);

    return (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.65)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{ background:'white', borderRadius:'16px', width:'100%', maxWidth:'420px', padding:'1.75rem', boxShadow:'0 25px 50px -12px rgba(0,0,0,.25)' }} className="animate-fade-in">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem' }}>
                    <div>
                        <h3 style={{ fontSize:'1.1rem', fontWeight:800, color:'#1e293b', margin:0 }}>➕ Add Fee Month</h3>
                        <p style={{ color:'#64748b', fontSize:'.82rem', margin:'4px 0 0' }}>Opens a new fee month for all students in <strong>{selectedClass}</strong></p>
                    </div>
                    <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:'2px' }}><X size={20} /></button>
                </div>

                <div style={{ marginBottom:'1rem' }}>
                    <label style={{ display:'block', fontWeight:700, color:'#475569', fontSize:'.85rem', marginBottom:'.4rem' }}>Select Month & Year</label>
                    <input type="month" value={monthVal} onChange={e => { setMonthVal(e.target.value); setError(''); }} className="form-input" style={{ width:'100%' }} />
                    {monthVal && (
                        <div style={{ color:'#2563eb', fontSize:'.8rem', fontWeight:700, marginTop:'.4rem' }}>
                            📅 Will open: <strong>{monthInputToLabel(monthVal)}</strong>
                        </div>
                    )}
                </div>

                {hasDefaults && (
                    <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'10px', padding:'.75rem 1rem', marginBottom:'1rem' }}>
                        <div style={{ fontWeight:700, color:'#475569', fontSize:'.78rem', textTransform:'uppercase', letterSpacing:'.4px', marginBottom:'.5rem' }}>
                            Class Defaults ({currencySymbol})
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.3rem .75rem', fontSize:'.82rem' }}>
                            {[['Tuition', classDefaults.tuitionFee], ['Admission', classDefaults.admissionFee], ['Annual', classDefaults.annualFee], ['Exam', classDefaults.examFee], ['Transport', classDefaults.transportFee], ['Lab', classDefaults.labFee]].filter(([, v]) => Number(v) > 0).map(([k, v]) => (
                                <div key={k} style={{ color:'#64748b' }}>{k}: <span style={{ color:'#1e293b', fontWeight:700 }}>{currencySymbol} {Number(v).toLocaleString()}</span></div>
                            ))}
                        </div>
                    </div>
                )}

                {!hasDefaults && (
                    <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'10px', padding:'.65rem .9rem', marginBottom:'1rem', fontSize:'.8rem', color:'#b45309', fontWeight:600 }}>
                        ⚠ No fee defaults set for {selectedClass}. All fees will open as RS 0 (free students).
                    </div>
                )}

                {error && (
                    <div style={{ color:'#dc2626', fontSize:'.82rem', fontWeight:600, marginBottom:'.75rem', background:'#fef2f2', padding:'.5rem .75rem', borderRadius:'8px' }}>⚠ {error}</div>
                )}

                <div style={{ display:'flex', gap:'.75rem', justifyContent:'flex-end' }}>
                    <button onClick={onClose} style={{ padding:'.6rem 1.25rem', borderRadius:'8px', border:'1px solid #e2e8f0', background:'white', color:'#475569', fontWeight:600, cursor:'pointer' }}>Cancel</button>
                    <button onClick={handleAdd} disabled={saving || !monthVal} style={{ padding:'.6rem 1.5rem', borderRadius:'8px', border:'none', background: (!monthVal||saving)?'#93c5fd':'#2563eb', color:'white', fontWeight:700, cursor: (!monthVal||saving)?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:'.4rem', transition:'background .2s' }}>
                        {saving ? 'Adding…' : <><Plus size={16} /> Add Month</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────────────────────
   QUICK PAY MODAL  (Edit Mode)
───────────────────────────────────────────────────────────────────────────── */
const QuickPayModal = ({ student, record, classDefaults, currencySymbol, onClose, onSave }) => {
    const net = computeNet(record, classDefaults);
    const [paidAmount,     setPaidAmount]     = useState(String(record?.paidAmount ?? 0));
    const [paymentMethod,  setPaymentMethod]  = useState(record?.paymentMethod || 'Cash');
    const [paymentDate,    setPaymentDate]    = useState(record?.paymentDate || new Date().toISOString().split('T')[0]);
    const [saving, setSaving]                 = useState(false);

    const paid    = Number(paidAmount) || 0;
    const balance = net - paid;
    const autoStatus = paid >= net && net > 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid';

    const handleSave = async () => {
        setSaving(true);
        await onSave({ ...record, paidAmount: paid, status: autoStatus, paymentMethod, paymentDate });
        setSaving(false);
        onClose();
    };

    return (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.65)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{ background:'white', borderRadius:'16px', width:'100%', maxWidth:'420px', padding:'1.75rem', boxShadow:'0 25px 50px -12px rgba(0,0,0,.25)' }} className="animate-fade-in">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem' }}>
                    <div>
                        <h3 style={{ fontSize:'1.05rem', fontWeight:800, color:'#1e293b', margin:0 }}>💳 Pay Fee — {record?.month}</h3>
                        <p style={{ color:'#64748b', fontSize:'.82rem', margin:'3px 0 0' }}>{student.name} · {student.id}</p>
                    </div>
                    <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}><X size={20} /></button>
                </div>

                {/* Fee summary */}
                <div style={{ background:'#f8fafc', borderRadius:'12px', padding:'.9rem 1rem', marginBottom:'1rem', display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid #e2e8f0' }}>
                    <div>
                        <div style={{ fontSize:'.72rem', color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'.3px' }}>Net Payable</div>
                        <div style={{ fontSize:'1.5rem', fontWeight:800, color:'#1e293b' }}>{currencySymbol} {net.toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:'.72rem', color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'.3px' }}>Balance After Payment</div>
                        <div style={{ fontSize:'1.1rem', fontWeight:800, color: balance > 0 ? '#dc2626' : '#16a34a' }}>
                            {currencySymbol} {Math.max(0, balance).toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* Amount paid input */}
                <div style={{ marginBottom:'.9rem' }}>
                    <label style={{ display:'block', fontWeight:700, color:'#475569', fontSize:'.85rem', marginBottom:'.35rem' }}>Amount Paid ({currencySymbol})</label>
                    <div style={{ display:'flex', gap:'.5rem' }}>
                        <input
                            type="number"
                            value={paidAmount}
                            onChange={e => setPaidAmount(e.target.value)}
                            className="form-input"
                            style={{ flex:1, fontSize:'1.1rem', fontWeight:700 }}
                            min="0"
                            autoFocus
                        />
                        <button
                            onClick={() => setPaidAmount(String(net))}
                            style={{ padding:'.5rem .85rem', background:'#f0fdf4', border:'1px solid #86efac', color:'#16a34a', borderRadius:'8px', fontWeight:700, fontSize:'.8rem', cursor:'pointer', whiteSpace:'nowrap' }}
                        >
                            Full
                        </button>
                    </div>
                    <div style={{ marginTop:'.4rem' }}>
                        <span style={{
                            fontSize:'.75rem', fontWeight:800, padding:'2px 10px', borderRadius:'999px',
                            background: autoStatus==='paid' ? '#f0fdf4' : autoStatus==='partial' ? '#fffbeb' : '#fef2f2',
                            color:      autoStatus==='paid' ? '#16a34a' : autoStatus==='partial' ? '#b45309' : '#dc2626',
                        }}>
                            → {autoStatus==='paid' ? '✅ Fully Paid' : autoStatus==='partial' ? '⚠️ Partially Paid' : '❌ Unpaid'}
                        </span>
                    </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.75rem', marginBottom:'1.25rem' }}>
                    <div>
                        <label style={{ display:'block', fontWeight:700, color:'#475569', fontSize:'.82rem', marginBottom:'.3rem' }}>Payment Method</label>
                        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="form-input" style={{ width:'100%' }}>
                            {['Cash','Bank Transfer','EasyPaisa','JazzCash','Cheque','Online Portal'].map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display:'block', fontWeight:700, color:'#475569', fontSize:'.82rem', marginBottom:'.3rem' }}>Payment Date</label>
                        <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="form-input" style={{ width:'100%' }} />
                    </div>
                </div>

                <div style={{ display:'flex', gap:'.75rem', justifyContent:'flex-end' }}>
                    <button onClick={onClose} style={{ padding:'.6rem 1.25rem', borderRadius:'8px', border:'1px solid #e2e8f0', background:'white', color:'#475569', fontWeight:600, cursor:'pointer' }}>Cancel</button>
                    <button onClick={handleSave} disabled={saving} style={{ padding:'.6rem 1.5rem', borderRadius:'8px', border:'none', background:saving?'#93c5fd':'#2563eb', color:'white', fontWeight:700, cursor:saving?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:'.4rem' }}>
                        {saving ? 'Saving…' : <><Save size={16} /> Save</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────────────────────
   TABLE CELL STYLES
───────────────────────────────────────────────────────────────────────────── */
const TH = {
    padding: '.65rem .6rem',
    textAlign: 'left',
    fontWeight: 700,
    fontSize: '.73rem',
    textTransform: 'uppercase',
    letterSpacing: '.3px',
    whiteSpace: 'nowrap',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    background: '#0f172a',
    color: 'white',
};
const TD = { padding: '.6rem .55rem', verticalAlign: 'middle' };

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN FEE TAB
───────────────────────────────────────────────────────────────────────────── */
const FeeTab = ({
    students,
    selectedClass,
    setSelectedClass,
    sectionClasses,
    sections,
    updateStudentFeeRecord,
    CLASS_FEE_DEFAULTS,
    currencySymbol   = 'RS',
    schoolName       = 'School',
    schoolLogo       = '/logo.png',
    schoolSettings   = {},
    showSaveMessage,
}) => {
    const { saveFeeRecords } = useSchoolData();

    /* ── State ─────────────────────────────────────────────────────────── */
    const [searchQuery,       setSearchQuery]       = useState('');
    const [genderTab,         setGenderTab]         = useState('all');
    const [activeFilter,      setActiveFilter]      = useState(null);
    const [editMode,          setEditMode]          = useState(false);
    const [showAddMonth,      setShowAddMonth]      = useState(false);
    const [quickPay,          setQuickPay]          = useState(null);
    const [sidebarOpen,       setSidebarOpen]       = useState(true);
    const [printMonth,        setPrintMonth]        = useState('');
    const [expandedSections,  setExpandedSections]  = useState(() => {
        const init = {};
        (sections || []).forEach(s => { init[s.id] = true; });
        return init;
    });

    const currentMonthLabel = getCurrentMonthLabel();

    const classDefaults = useMemo(() =>
        (CLASS_FEE_DEFAULTS && CLASS_FEE_DEFAULTS[selectedClass]) || {
            tuitionFee: 0, admissionFee: 0, annualFee: 0, examFee: 0, transportFee: 0, labFee: 0,
        },
        [CLASS_FEE_DEFAULTS, selectedClass]
    );

    /* ── Base student list ─────────────────────────────────────────────── */
    const allClassStudents = useMemo(() =>
        students
            .filter(s => s.grade === selectedClass)
            .sort((a, b) => {
                const sa = parseInt(a.serialNumber, 10), sb = parseInt(b.serialNumber, 10);
                if (!isNaN(sa) && !isNaN(sb)) return sa - sb;
                return a.id.localeCompare(b.id, undefined, { numeric: true });
            }),
        [students, selectedClass]
    );

    /* ── All months (insertion order) ─────────────────────────────────── */
    const allMonths = useMemo(() => {
        const seen = new Set(); const months = [];
        allClassStudents.forEach(s =>
            (s.feeHistory || []).forEach(h => {
                if (!seen.has(h.month)) { seen.add(h.month); months.push(h.month); }
            })
        );
        return months;
    }, [allClassStudents]);

    /* ── Current-month stats ───────────────────────────────────────────── */
    const stats = useMemo(() => {
        const total     = allClassStudents.length;
        const paid      = allClassStudents.filter(s => (s.feeHistory||[]).some(h => h.month===currentMonthLabel && h.status==='paid')).length;
        const unpaid    = allClassStudents.filter(s => (s.feeHistory||[]).some(h => h.month===currentMonthLabel && (h.status==='unpaid'||h.status==='partial'))).length;
        const defaulters= allClassStudents.filter(s => isDefaulter(s, currentMonthLabel)).length;
        const free      = allClassStudents.filter(s => isFreeStudent(s, classDefaults)).length;
        return { total, paid, unpaid, defaulters, free };
    }, [allClassStudents, currentMonthLabel, classDefaults]);

    /* ── Gender counts ─────────────────────────────────────────────────── */
    const boysCount  = allClassStudents.filter(s => s.admissions?.[0]?.gender === 'Male').length;
    const girlsCount = allClassStudents.filter(s => s.admissions?.[0]?.gender === 'Female').length;

    /* ── Visible / filtered students ──────────────────────────────────── */
    const visibleStudents = useMemo(() => {
        let list = allClassStudents;
        if (genderTab === 'boys')  list = list.filter(s => s.admissions?.[0]?.gender === 'Male');
        if (genderTab === 'girls') list = list.filter(s => s.admissions?.[0]?.gender === 'Female');
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(s =>
                s.name?.toLowerCase().includes(q) ||
                s.id?.toLowerCase().includes(q) ||
                String(s.serialNumber || '').toLowerCase().includes(q)
            );
        }
        if (activeFilter === 'paid')       list = list.filter(s => (s.feeHistory||[]).some(h => h.month===currentMonthLabel && h.status==='paid'));
        if (activeFilter === 'unpaid')     list = list.filter(s => (s.feeHistory||[]).some(h => h.month===currentMonthLabel && (h.status==='unpaid'||h.status==='partial')));
        if (activeFilter === 'defaulters') list = list.filter(s => isDefaulter(s, currentMonthLabel));
        if (activeFilter === 'free')       list = list.filter(s => isFreeStudent(s, classDefaults));
        return list;
    }, [allClassStudents, genderTab, searchQuery, activeFilter, currentMonthLabel, classDefaults]);

    /* ── Handlers ─────────────────────────────────────────────────────── */
    const handleCardClick = (filter) => setActiveFilter(prev => prev === filter ? null : filter);

    const handleQuickPaySave = async (updatedRecord) => {
        if (!quickPay) return;
        await updateStudentFeeRecord(quickPay.student.id, updatedRecord.month, updatedRecord);
    };

    const handleAddMonthSuccess = (label) => {
        if (showSaveMessage) showSaveMessage(`Month "${label}" opened for ${selectedClass}!`);
    };

    /* ── Print vouchers ─────────────────────────────────────────────────── */
    const doPrintVouchers = (month) => {
        if (!month) return;
        const targets = visibleStudents;
        let html = `<!DOCTYPE html><html><head><title>Vouchers — ${selectedClass} — ${month}</title><style>${VOUCHER_CSS}</style></head><body>
            <button class="btn-print" onclick="window.print()">🖨 Print All Vouchers (${targets.length})</button>
            <div class="grid">`;
        targets.forEach(student => {
            const record = (student.feeHistory || []).find(h => h.month === month)
                || { month, status: 'unpaid', paidAmount: 0, ...classDefaults };
            html += buildVoucherHTML(student, record, classDefaults, currencySymbol, schoolName, schoolLogo, schoolSettings);
        });
        html += `</div></body></html>`;
        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
    };

    /* ── Per-student totals ─────────────────────────────────────────────── */
    const getStudentTotals = (student) => {
        const hist         = student.feeHistory || [];
        const totalPayable = hist.reduce((s, h) => s + computeNet(h, classDefaults), 0);
        const totalPaid    = hist.reduce((s, h) => s + Number(h.paidAmount ?? 0), 0);
        return { totalPayable, pending: Math.max(0, totalPayable - totalPaid) };
    };

    /* ── Month cell renderer ────────────────────────────────────────────── */
    const renderMonthCell = (student, month, isFree) => {
        if (isFree) return (
            <div style={{ textAlign:'center', padding:'2px 0' }}>
                <span style={{ padding:'2px 7px', borderRadius:'999px', fontSize:'.68rem', fontWeight:800, background:'#ede9fe', color:'#7c3aed' }}>FREE</span>
            </div>
        );
        const rec = (student.feeHistory || []).find(h => h.month === month);
        if (!rec) return <div style={{ textAlign:'center', color:'#d1d5db', fontSize:'.75rem' }}>—</div>;
        const { status } = rec;
        const isPaid    = status === 'paid';
        const isPartial = status === 'partial';
        const bg    = isPaid ? '#dcfce7' : isPartial ? '#fef3c7' : '#fee2e2';
        const color = isPaid ? '#16a34a' : isPartial ? '#d97706' : '#dc2626';
        const icon  = isPaid ? '✓' : isPartial ? '⚠' : '✗';

        if (editMode) return (
            <button
                onClick={() => setQuickPay({ student, record: rec })}
                title={`Edit ${month} — ${status} — click to update`}
                style={{ padding:'3px 8px', borderRadius:'999px', fontSize:'.7rem', fontWeight:800, border:'none', cursor:'pointer', background:bg, color, display:'block', width:'100%', transition:'opacity .15s' }}
                onMouseEnter={e => e.currentTarget.style.opacity='.65'}
                onMouseLeave={e => e.currentTarget.style.opacity='1'}
            >{icon}</button>
        );
        return (
            <div style={{ textAlign:'center' }}>
                <span style={{ padding:'2px 8px', borderRadius:'999px', fontSize:'.7rem', fontWeight:800, background:bg, color }}>{icon}</span>
            </div>
        );
    };

    /* ── Sorted classes fallback ─────────────────────────────────────────── */
    const sortedClasses = [...(sectionClasses || [])].sort(classSort);

    /* ── Status card config ──────────────────────────────────────────────── */
    const statusCards = [
        { id: null,         icon:'👥', label:'Total Students',  value:stats.total,      color:'#2563eb', bg:'#eff6ff',  border:'#bfdbfe' },
        { id: 'paid',       icon:'✅', label:'Paid',             value:stats.paid,       color:'#16a34a', bg:'#f0fdf4',  border:'#86efac' },
        { id: 'unpaid',     icon:'❌', label:'Unpaid / Partial', value:stats.unpaid,     color:'#dc2626', bg:'#fef2f2',  border:'#fca5a5' },
        { id: 'defaulters', icon:'⚠️', label:'Defaulters',       value:stats.defaulters, color:'#b45309', bg:'#fffbeb',  border:'#fde68a' },
        { id: 'free',       icon:'🆓', label:'Free Students',    value:stats.free,       color:'#7c3aed', bg:'#f5f3ff',  border:'#c4b5fd' },
    ];

    /* ═══════════════════════════════════════════════════════════════════════
       RENDER
    ═══════════════════════════════════════════════════════════════════════ */
    return (
        <div className="animate-fade-in" style={{ display:'flex', height:'100%', minHeight:0 }}>

            {/* ══ SIDEBAR ══════════════════════════════════════════════════ */}
            <div style={{
                width: sidebarOpen ? '216px' : '0',
                minWidth: sidebarOpen ? '216px' : '0',
                overflow: 'hidden',
                transition: 'all .25s ease',
                background: 'white',
                borderRight: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
            }}>
                <div style={{ padding:'.85rem .8rem', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ fontWeight:800, fontSize:'.88rem', color:'#1e293b' }}>📚 Classes</span>
                    <button onClick={() => setSidebarOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:'2px', display:'flex' }}><X size={15} /></button>
                </div>
                <div style={{ flex:1, overflowY:'auto', padding:'.4rem' }}>
                    {sections && sections.length > 0
                        ? sections.map(sec => (
                            <div key={sec.id} style={{ marginBottom:'.15rem' }}>
                                <button
                                    onClick={() => setExpandedSections(p => ({ ...p, [sec.id]: !p[sec.id] }))}
                                    style={{ width:'100%', display:'flex', alignItems:'center', gap:'.45rem', padding:'.45rem .55rem', background:'transparent', border:'none', cursor:'pointer', color:'#64748b', fontWeight:700, fontSize:'.8rem', borderRadius:'7px', textAlign:'left' }}
                                >
                                    {expandedSections[sec.id] ? <ChevronDown size={13}/> : <ChevronRight size={13}/>}
                                    {sec.name}
                                </button>
                                {expandedSections[sec.id] && (
                                    <div style={{ paddingLeft:'.35rem' }}>
                                        {(sec.classes || []).sort(classSort).map(cls => (
                                            <button key={cls}
                                                onClick={() => { setSelectedClass(cls); setActiveFilter(null); setSearchQuery(''); setEditMode(false); }}
                                                style={{
                                                    width:'100%', padding:'.42rem .7rem', borderRadius:'7px', border:'none', cursor:'pointer', textAlign:'left',
                                                    fontSize:'.84rem', fontWeight: selectedClass===cls ? 800 : 600,
                                                    background: selectedClass===cls ? '#eff6ff' : 'transparent',
                                                    color:      selectedClass===cls ? '#2563eb' : '#64748b',
                                                    borderLeft: `3px solid ${selectedClass===cls ? '#2563eb' : 'transparent'}`,
                                                    transition:'all .12s', marginBottom:'1px',
                                                }}
                                            >{cls}</button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                        : sortedClasses.map(cls => (
                            <button key={cls}
                                onClick={() => { setSelectedClass(cls); setActiveFilter(null); setSearchQuery(''); setEditMode(false); }}
                                style={{
                                    width:'100%', padding:'.48rem .7rem', borderRadius:'8px', border:'none', cursor:'pointer', textAlign:'left',
                                    fontSize:'.86rem', fontWeight: selectedClass===cls ? 800 : 600,
                                    background: selectedClass===cls ? '#eff6ff' : 'transparent',
                                    color:      selectedClass===cls ? '#2563eb' : '#64748b',
                                    borderLeft: `3px solid ${selectedClass===cls ? '#2563eb' : 'transparent'}`,
                                    transition:'all .12s', marginBottom:'2px',
                                }}
                            >{cls}</button>
                        ))
                    }
                </div>
            </div>

            {/* ══ MAIN ═════════════════════════════════════════════════════ */}
            <div style={{ flex:1, minWidth:0, padding:'1.4rem', display:'flex', flexDirection:'column', gap:'1.1rem', overflowY:'auto' }}>

                {/* ── Top bar ───────────────────────────────────────────── */}
                <div style={{ display:'flex', alignItems:'center', gap:'.9rem', flexWrap:'wrap' }}>
                    {!sidebarOpen && (
                        <button onClick={() => setSidebarOpen(true)} style={{ padding:'.45rem .75rem', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:'8px', cursor:'pointer', color:'#475569', fontWeight:700, fontSize:'.8rem', display:'flex', alignItems:'center', gap:'.35rem' }}>
                            <ChevronRight size={15}/> Classes
                        </button>
                    )}
                    <div>
                        <h2 style={{ fontSize:'1.45rem', fontWeight:800, color:'#1e293b', margin:0 }}>💰 Fee Management</h2>
                        <p style={{ color:'#64748b', fontSize:'.8rem', margin:'2px 0 0' }}>{selectedClass} &middot; {currentMonthLabel}</p>
                    </div>
                    <div style={{ marginLeft:'auto', display:'flex', gap:'.55rem', alignItems:'center', flexWrap:'wrap' }}>
                        <button
                            onClick={() => setShowAddMonth(true)}
                            style={{ padding:'.52rem 1rem', background:'linear-gradient(135deg,#2563eb,#1d4ed8)', color:'white', border:'none', borderRadius:'10px', fontWeight:700, cursor:'pointer', fontSize:'.83rem', display:'flex', alignItems:'center', gap:'.35rem', boxShadow:'0 2px 8px rgba(37,99,235,.3)' }}
                        >
                            <Plus size={15}/> Add Month
                        </button>
                    </div>
                </div>

                {/* ── Search ────────────────────────────────────────────── */}
                <div style={{ display:'flex', flexDirection:'column', gap:'.65rem' }}>
                    <div style={{ position:'relative' }}>
                        <Search size={15} style={{ position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
                        <input
                            type="text"
                            placeholder="Search by Name, Serial No. or Student ID…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="form-input"
                            style={{ paddingLeft:'34px', paddingRight:'34px', width:'100%', borderRadius:'10px' }}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', display:'flex' }}>
                                <X size={15}/>
                            </button>
                        )}
                    </div>

                    {/* Gender tabs */}
                    <div style={{ display:'flex', borderRadius:'10px', overflow:'hidden', border:'1px solid #e2e8f0', background:'#f8fafc' }}>
                        {[
                            { id:'boys',  label:'👦 Boys',        count:boysCount,               color:'#0369a1', bg:'#e0f2fe' },
                            { id:'girls', label:'👧 Girls',       count:girlsCount,              color:'#be185d', bg:'#fce7f3' },
                            { id:'all',   label:'👥 All Students',count:allClassStudents.length, color:'#475569', bg:'#f1f5f9' },
                        ].map(tab => (
                            <button key={tab.id} onClick={() => setGenderTab(tab.id)} style={{
                                flex:1, padding:'.65rem .4rem', fontWeight:genderTab===tab.id ? 800 : 600,
                                color:  genderTab===tab.id ? tab.color : '#94a3b8',
                                background: genderTab===tab.id ? tab.bg : 'transparent',
                                border:'none', borderBottom: genderTab===tab.id ? `3px solid ${tab.color}` : '3px solid transparent',
                                cursor:'pointer', transition:'all .15s', fontSize:'.85rem',
                                display:'flex', alignItems:'center', justifyContent:'center', gap:'.4rem',
                            }}>
                                {tab.label}
                                <span style={{ background:genderTab===tab.id ? tab.color : '#cbd5e1', color:'white', borderRadius:'999px', padding:'0 .45rem', fontSize:'.7rem', fontWeight:700 }}>{tab.count}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Current Month Status Cards ─────────────────────────── */}
                <div>
                    <div style={{ fontSize:'.72rem', fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:'.55rem' }}>
                        Current Month Status — {currentMonthLabel}
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:'.65rem' }}>
                        {statusCards.map(card => {
                            const active = activeFilter === card.id;
                            return (
                                <button
                                    key={String(card.id)}
                                    onClick={() => card.id !== null && handleCardClick(card.id)}
                                    style={{
                                        background: active ? card.color : card.bg,
                                        border: `2px solid ${active ? card.color : card.border}`,
                                        borderRadius:'12px', padding:'.8rem .6rem', textAlign:'center',
                                        cursor: card.id !== null ? 'pointer' : 'default',
                                        transition:'all .2s',
                                        transform: active ? 'scale(1.03)' : 'scale(1)',
                                        boxShadow: active ? `0 4px 18px ${card.color}40` : 'none',
                                    }}
                                >
                                    <div style={{ fontSize:'1.2rem', marginBottom:'.15rem' }}>{card.icon}</div>
                                    <div style={{ fontSize:'1.55rem', fontWeight:800, color: active ? 'white' : card.color }}>{card.value}</div>
                                    <div style={{ fontSize:'.7rem', fontWeight:700, color: active ? 'rgba(255,255,255,.85)' : '#64748b', marginTop:'.15rem', lineHeight:1.3 }}>{card.label}</div>
                                    {card.id !== null && (
                                        <div style={{ fontSize:'.62rem', color: active ? 'rgba(255,255,255,.65)' : '#94a3b8', marginTop:'.2rem' }}>
                                            {active ? '✕ clear filter' : 'click to filter'}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Student Spreadsheet ───────────────────────────────── */}
                <div style={{ background:'white', borderRadius:'14px', border:'1px solid #e2e8f0', overflow:'hidden', flex:1, display:'flex', flexDirection:'column' }}>

                    {/* Spreadsheet toolbar */}
                    <div style={{ padding:'.8rem 1rem', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'.6rem', flexWrap:'wrap', background:'#f8fafc' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'.55rem', flexWrap:'wrap' }}>
                            <span style={{ fontWeight:800, color:'#1e293b', fontSize:'.9rem' }}>Student Records</span>
                            <span style={{ background:'#e2e8f0', color:'#475569', borderRadius:'999px', padding:'1px 10px', fontSize:'.75rem', fontWeight:700 }}>
                                {visibleStudents.length} of {allClassStudents.length}
                            </span>
                            {activeFilter && (
                                <span style={{ background:'#fef3c7', color:'#b45309', borderRadius:'999px', padding:'1px 10px', fontSize:'.73rem', fontWeight:700, display:'flex', alignItems:'center', gap:'.3rem' }}>
                                    Filter: {activeFilter}
                                    <button onClick={() => setActiveFilter(null)} style={{ background:'none', border:'none', cursor:'pointer', padding:0, color:'#b45309', display:'flex' }}><X size={11}/></button>
                                </span>
                            )}
                        </div>
                        <div style={{ display:'flex', gap:'.45rem', alignItems:'center' }}>
                            {/* Print vouchers dropdown */}
                            {allMonths.length > 0 && (
                                <select
                                    value={printMonth}
                                    onChange={e => { if (e.target.value) { doPrintVouchers(e.target.value); setPrintMonth(''); } }}
                                    style={{ padding:'.4rem .65rem', borderRadius:'8px', border:'1px solid #e2e8f0', fontSize:'.78rem', fontWeight:600, color:'#475569', background:'white', cursor:'pointer' }}
                                >
                                    <option value="" disabled>🖨 Print Vouchers…</option>
                                    {allMonths.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            )}
                            {/* Edit toggle */}
                            <button
                                onClick={() => setEditMode(p => !p)}
                                style={{
                                    padding:'.42rem .9rem', borderRadius:'8px',
                                    border: `2px solid ${editMode ? '#f59e0b' : '#e2e8f0'}`,
                                    background: editMode ? '#fffbeb' : 'white',
                                    color:   editMode ? '#b45309' : '#475569',
                                    fontWeight:700, fontSize:'.8rem', cursor:'pointer', display:'flex', alignItems:'center', gap:'.35rem', transition:'all .2s',
                                }}
                            >
                                {editMode ? <><Check size={14}/> Done</> : <><Edit3 size={14}/> Edit</>}
                            </button>
                        </div>
                    </div>

                    {/* Table area */}
                    {allClassStudents.length === 0 ? (
                        <div style={{ textAlign:'center', padding:'3.5rem 2rem', color:'#94a3b8' }}>
                            <div style={{ fontSize:'2.5rem', marginBottom:'.75rem' }}>👥</div>
                            <div style={{ fontWeight:700, fontSize:'1rem', color:'#64748b' }}>No students in {selectedClass}</div>
                        </div>
                    ) : allMonths.length === 0 ? (
                        <div style={{ textAlign:'center', padding:'3.5rem 2rem' }}>
                            <div style={{ fontSize:'2.5rem', marginBottom:'.75rem' }}>📅</div>
                            <div style={{ fontWeight:700, fontSize:'1rem', color:'#1e293b', marginBottom:'.4rem' }}>No months opened yet</div>
                            <p style={{ color:'#64748b', marginBottom:'1.2rem', fontSize:'.88rem' }}>Click "Add Month" to start tracking fees for {selectedClass}</p>
                            <button onClick={() => setShowAddMonth(true)} style={{ padding:'.6rem 1.4rem', background:'#2563eb', color:'white', border:'none', borderRadius:'10px', fontWeight:700, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:'.4rem' }}>
                                <Plus size={15}/> Add Month
                            </button>
                        </div>
                    ) : (
                        <div style={{ overflowX:'auto', overflowY:'auto', flex:1, maxHeight:'62vh' }}>
                            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:`${300 + allMonths.length * 70}px` }}>
                                <thead>
                                    <tr>
                                        {/* Photo */}
                                        <th style={{ ...TH, width:'44px', position:'sticky', left:0, zIndex:21 }}>📷</th>
                                        {/* Serial # */}
                                        <th style={{ ...TH, width:'50px', textAlign:'center', position:'sticky', left:'44px', zIndex:21 }}>#</th>
                                        {/* Name */}
                                        <th style={{ ...TH, minWidth:'170px', position:'sticky', left:'94px', zIndex:21 }}>Student</th>
                                        {/* Fee/mo */}
                                        <th style={{ ...TH, width:'88px', textAlign:'center' }}>Fee/mo</th>
                                        {/* Month columns */}
                                        {allMonths.map(month => (
                                            <th key={month} style={{ ...TH, width:'68px', textAlign:'center', background:'#1e293b' }}>
                                                <div style={{ fontSize:'.7rem', fontWeight:800 }}>{month.split(' ')[0].slice(0,3)}</div>
                                                <div style={{ fontSize:'.62rem', fontWeight:500, opacity:.65 }}>{month.split(' ')[1]}</div>
                                            </th>
                                        ))}
                                        {/* Total */}
                                        <th style={{ ...TH, width:'92px', textAlign:'right', background:'#1e3a5f' }}>Total</th>
                                        {/* Pending */}
                                        <th style={{ ...TH, width:'92px', textAlign:'right', background:'#1e3a5f' }}>Pending</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleStudents.length === 0 ? (
                                        <tr><td colSpan={4 + allMonths.length + 2} style={{ padding:'2.5rem', textAlign:'center', color:'#94a3b8', fontStyle:'italic' }}>No students match the current filter.</td></tr>
                                    ) : visibleStudents.map((student, idx) => {
                                        const free       = isFreeStudent(student, classDefaults);
                                        const defaulter  = isDefaulter(student, currentMonthLabel);
                                        const { totalPayable, pending } = getStudentTotals(student);
                                        const monthlyFee = computeNet({}, classDefaults);
                                        const rowBg      = defaulter && !free ? '#fffbeb' : idx % 2 === 0 ? 'white' : '#fafafa';

                                        return (
                                            <tr key={student.id} style={{ borderBottom:'1px solid #f1f5f9', background:rowBg }}>
                                                {/* Photo */}
                                                <td style={{ ...TD, width:'44px', position:'sticky', left:0, zIndex:1, background:rowBg, padding:'6px 4px' }}>
                                                    <div style={{ width:'34px', height:'34px', borderRadius:'50%', overflow:'hidden', background:'linear-gradient(135deg,#e2e8f0,#cbd5e1)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto', flexShrink:0 }}>
                                                        {(student.photo || student.image)
                                                            ? <img src={student.photo || student.image} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                                                            : <span style={{ fontSize:'.68rem', fontWeight:800, color:'#94a3b8' }}>{student.name?.split(' ').map(n=>n[0]).join('').slice(0,2)}</span>
                                                        }
                                                    </div>
                                                </td>
                                                {/* Serial # */}
                                                <td style={{ ...TD, position:'sticky', left:'44px', zIndex:1, background:rowBg, textAlign:'center', fontSize:'.75rem', color:'#94a3b8', fontWeight:700 }}>
                                                    {student.serialNumber || '—'}
                                                </td>
                                                {/* Name + ID + Class + badges */}
                                                <td style={{ ...TD, position:'sticky', left:'94px', zIndex:1, background:rowBg, borderRight:'2px solid #e2e8f0' }}>
                                                    <div style={{ fontWeight:700, color:'#1e293b', fontSize:'.86rem', display:'flex', alignItems:'center', gap:'.3rem', flexWrap:'wrap', lineHeight:1.3 }}>
                                                        {student.name}
                                                        {free     && <span style={{ background:'#ede9fe', color:'#7c3aed', borderRadius:'999px', padding:'0 6px', fontSize:'.62rem', fontWeight:800 }}>FREE</span>}
                                                        {defaulter && !free && <span style={{ background:'#fef3c7', color:'#b45309', borderRadius:'999px', padding:'0 6px', fontSize:'.62rem', fontWeight:800 }}>DEFAULTER</span>}
                                                    </div>
                                                    <div style={{ fontSize:'.71rem', color:'#94a3b8', fontWeight:600 }}>
                                                        {student.id} · {student.grade}
                                                    </div>
                                                </td>
                                                {/* Fee/mo */}
                                                <td style={{ ...TD, textAlign:'center', fontWeight:800, fontSize:'.8rem', color: free ? '#7c3aed' : '#2563eb' }}>
                                                    {free ? 'FREE' : `${currencySymbol} ${monthlyFee.toLocaleString()}`}
                                                </td>
                                                {/* Month cells */}
                                                {allMonths.map(month => (
                                                    <td key={month} style={{ ...TD, textAlign:'center', padding:'5px 3px' }}>
                                                        {renderMonthCell(student, month, free)}
                                                    </td>
                                                ))}
                                                {/* Total */}
                                                <td style={{ ...TD, textAlign:'right', fontWeight:800, color:'#1e293b', fontSize:'.8rem', background:'#f8fafc', borderLeft:'1px solid #e2e8f0', paddingRight:'.8rem' }}>
                                                    {free ? '—' : `${currencySymbol} ${totalPayable.toLocaleString()}`}
                                                </td>
                                                {/* Pending */}
                                                <td style={{ ...TD, textAlign:'right', fontWeight:800, fontSize:'.8rem', paddingRight:'.8rem', color: pending > 0 ? '#dc2626' : '#16a34a', background: pending > 0 ? '#fef2f2' : '#f0fdf4' }}>
                                                    {free ? '—' : `${currencySymbol} ${pending.toLocaleString()}`}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Edit mode banner */}
                    {editMode && (
                        <div style={{ padding:'.55rem 1rem', background:'#fffbeb', borderTop:'1px solid #fde68a', display:'flex', alignItems:'center', gap:'.5rem', fontSize:'.8rem', color:'#b45309', fontWeight:700 }}>
                            <Edit3 size={14}/> Edit mode active — click any month cell to update that student's payment
                        </div>
                    )}
                </div>
            </div>

            {/* ══ MODALS ══════════════════════════════════════════════════ */}
            {showAddMonth && (
                <AddMonthModal
                    selectedClass={selectedClass}
                    students={students}
                    classDefaults={classDefaults}
                    onClose={() => setShowAddMonth(false)}
                    onSuccess={handleAddMonthSuccess}
                    saveFeeRecords={saveFeeRecords}
                    currencySymbol={currencySymbol}
                />
            )}
            {quickPay && (
                <QuickPayModal
                    student={quickPay.student}
                    record={quickPay.record}
                    classDefaults={classDefaults}
                    currencySymbol={currencySymbol}
                    onClose={() => setQuickPay(null)}
                    onSave={handleQuickPaySave}
                />
            )}
        </div>
    );
};

export default FeeTab;
