import React, { useState, useMemo, useRef } from 'react';
import { Search, Plus, Printer, Edit3, X, ChevronDown, ChevronRight, Save, Check, AlertTriangle } from 'lucide-react';
import { useSchoolData } from '../../context/SchoolDataContext';

/* ─────────────────────────────────────────────────────────────────────────────
   CONSTANTS & HELPERS
───────────────────────────────────────────────────────────────────────────── */
const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];

const PAPER_FUND_PREFIX = 'Paper Fund '; // fee records with this prefix are excluded from month columns

function classSort(a, b) {
    const nA = parseInt((a || '').match(/\d+/)?.[0] || '999');
    const nB = parseInt((b || '').match(/\d+/)?.[0] || '999');
    return nA !== nB ? nA - nB : (a || '').localeCompare(b || '');
}

function getCurrentMonthLabel() {
    return new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
}

function monthInputToLabel(val) {
    if (!val) return '';
    const [year, month] = val.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
}

/** Convert "May 2026" → sortable numeric key */
function monthLabelToKey(label) {
    if (!label || label.startsWith(PAPER_FUND_PREFIX)) return Infinity;
    const parts = label.split(' ');
    const mIdx = MONTH_NAMES.indexOf(parts[0]);
    const yr   = parseInt(parts[1]) || 0;
    if (mIdx < 0 || !yr) return Infinity;
    return yr * 12 + mIdx;
}

function sortMonthLabels(arr) {
    return [...arr].sort((a, b) => monthLabelToKey(a) - monthLabelToKey(b));
}

/** Generate Jan–Dec for a given year as label strings */
function yearMonthLabels(year) {
    return MONTH_NAMES.map(m => `${m} ${year}`);
}

/** Short header: "Jan 26" */
function shortMonthLabel(label) {
    const parts = label.split(' ');
    return `${parts[0].slice(0, 3)} ${String(parts[1]).slice(2)}`;
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

/**
 * Returns the effective fee defaults for a student.
 * If the student has a feeOverride stored in their admissions record, that takes priority.
 * Falls back to class defaults.
 */
function getStudentEffectiveFee(student, classDefaults) {
    const override = student.admissions?.[0]?.feeOverride;
    if (override && typeof override === 'object') {
        // merge — override only fields that are explicitly set
        return { ...classDefaults, ...override };
    }
    return classDefaults;
}

/** Get student's admission month as numeric key (year*12 + monthIndex) */
function getAdmissionMonthKey(student) {
    const adm = student.admissions?.[0];
    if (!adm) return null;
    const raw = adm.applicationDate || adm.admissionDate || adm.date || '';
    if (!raw) return null;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return null;
    return d.getFullYear() * 12 + d.getMonth(); // 0-indexed month
}

/** True if student should be charged for this month */
function studentOwesMonth(student, monthLabel) {
    const admKey = getAdmissionMonthKey(student);
    if (admKey === null) return true; // no admission date → charge all months
    return monthLabelToKey(monthLabel) >= admKey;
}

function isFreeStudent(student, classDefaults) {
    if (computeNet({}, classDefaults) === 0) return true;
    const hist = (student.feeHistory || []).filter(h => !h.month?.startsWith(PAPER_FUND_PREFIX));
    if (hist.length > 0 && hist.every(h => computeNet(h, classDefaults) === 0)) return true;
    return false;
}

function isDefaulter(student, currentMonthLabel, classDefaults) {
    const hist = (student.feeHistory || []).filter(h => !h.month?.startsWith(PAPER_FUND_PREFIX));
    const currentKey = monthLabelToKey(currentMonthLabel);
    return hist.some(h => {
        const hKey = monthLabelToKey(h.month);
        if (hKey >= currentKey) return false; // current or future → not a defaulter
        if (!studentOwesMonth(student, h.month)) return false; // before admission → skip
        return h.status === 'unpaid' || h.status === 'partial';
    });
}

/* ─────────────────────────────────────────────────────────────────────────────
   VOUCHER PRINT
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
    const pmRow  = (label, val) => val ? `<div class="rrow"><span class="lbl">${label}</span><span class="val">${val}</span></div>` : '';

    let paymentInfo = '';
    if (schoolSettings?.bank_account) paymentInfo += pmRow('Bank Account', schoolSettings.bank_account);
    if (schoolSettings?.easypaisa)    paymentInfo += pmRow('EasyPaisa', schoolSettings.easypaisa);
    if (schoolSettings?.jazzcash)     paymentInfo += pmRow('JazzCash', schoolSettings.jazzcash);

    return `
    <div class="receipt">
        <div class="receipt-header">
            ${schoolLogo ? `<img src="${schoolLogo}" class="school-logo" onerror="this.style.display='none'" />` : ''}
            <h3 class="school-name">${schoolName}</h3>
            <div class="receipt-badge">Fee Voucher</div>
        </div>
        <div class="rrow"><span class="lbl">Student</span><span class="val">${student.name}</span></div>
        <div class="rrow"><span class="lbl">ID</span><span class="val">${student.id}</span></div>
        <div class="rrow"><span class="lbl">Class</span><span class="val">${student.grade}</span></div>
        <div class="rrow"><span class="lbl">Month</span><span class="val">${record?.month || '—'}</span></div>
        <div class="rrow"><span class="lbl">Status</span><span class="sb" style="${sbStyle}">${status}</span></div>
        <div style="height:6px"></div>
        ${feeRow('Tuition Fee', record?.tuitionFee ?? defaults.tuitionFee)}
        ${feeRow('Admission Fee', record?.admissionFee ?? defaults.admissionFee)}
        ${feeRow('Annual Fee', record?.annualFee ?? defaults.annualFee)}
        ${feeRow('Exam Fee', record?.examFee ?? defaults.examFee)}
        ${feeRow('Transport Fee', record?.transportFee ?? defaults.transportFee)}
        ${feeRow('Lab Fee', record?.labFee ?? defaults.labFee)}
        ${feeRow('Late Fine', record?.lateFine)}
        ${record?.discount > 0 ? `<div class="rrow"><span>Discount</span><span>- ${sym} ${Number(record.discount).toLocaleString()}</span></div>` : ''}
        <div class="total-row"><span>Net Payable</span><span>${sym} ${net.toLocaleString()}</span></div>
        ${balance > 0 ? `<div class="rrow" style="margin-top:4px"><span class="lbl">Balance Due</span><span style="color:#dc2626;font-weight:800">${sym} ${balance.toLocaleString()}</span></div>` : ''}
        ${paymentInfo ? `<div style="margin-top:8px;padding-top:6px;border-top:1px dashed #e2e8f0">${paymentInfo}</div>` : ''}
    </div>`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   ADD MONTH MODAL
───────────────────────────────────────────────────────────────────────────── */
const AddMonthModal = ({ selectedClasses, allClassStudents, CLASS_FEE_DEFAULTS, currencySymbol, onClose, onSuccess }) => {
    const { saveFeeRecords } = useSchoolData();
    const [monthVal, setMonthVal] = useState('');
    const [saving,   setSaving]   = useState(false);
    const [error,    setError]    = useState('');

    // Use first selected class for defaults display
    const firstClass    = [...selectedClasses][0] || '';
    const classDefaults = (CLASS_FEE_DEFAULTS && CLASS_FEE_DEFAULTS[firstClass]) || {};
    const hasDefaults   = Object.values(classDefaults).some(v => Number(v) > 0);
    const label         = monthInputToLabel(monthVal);

    // Check if month already exists for any student in selected classes
    const alreadyExists = label && allClassStudents.some(s =>
        (s.feeHistory || []).some(h => h.month === label)
    );

    const handleAdd = async () => {
        if (!monthVal) return;
        if (alreadyExists) { setError(`Month "${label}" already exists.`); return; }
        setSaving(true);
        const targetMonthKey = monthLabelToKey(label);
        const records = allClassStudents
            .filter(s => studentOwesMonth(s, label)) // respect admission date
            .map(s => {
                const cd = (CLASS_FEE_DEFAULTS && CLASS_FEE_DEFAULTS[s.grade]) || classDefaults;
                return {
                    student_id: s.id,
                    month: label,
                    status: 'unpaid',
                    tuitionFee:   cd.tuitionFee   || 0,
                    admissionFee: cd.admissionFee || 0,
                    annualFee:    cd.annualFee    || 0,
                    examFee:      cd.examFee      || 0,
                    transportFee: cd.transportFee || 0,
                    labFee:       cd.labFee       || 0,
                    lateFine: 0, discount: 0, paidAmount: 0,
                };
            });
        const { error: err } = await saveFeeRecords(records);
        setSaving(false);
        if (err) { setError('Save failed: ' + err.message); return; }
        onSuccess(label);
        onClose();
    };

    return (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.65)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{ background:'white', borderRadius:'16px', width:'100%', maxWidth:'440px', padding:'1.75rem', boxShadow:'0 25px 50px -12px rgba(0,0,0,.25)' }} className="animate-fade-in">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem' }}>
                    <div>
                        <h3 style={{ fontSize:'1.1rem', fontWeight:800, color:'#1e293b', margin:0 }}>➕ Add Fee Month</h3>
                        <p style={{ color:'#64748b', fontSize:'.82rem', margin:'4px 0 0' }}>
                            Opens a new fee month for <strong>{[...selectedClasses].join(', ')}</strong>
                            {selectedClasses.size > 1 ? ` (${allClassStudents.length} students total)` : ''}
                        </p>
                    </div>
                    <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}><X size={20} /></button>
                </div>

                <div style={{ marginBottom:'1rem' }}>
                    <label style={{ display:'block', fontWeight:700, color:'#475569', fontSize:'.85rem', marginBottom:'.4rem' }}>Select Month &amp; Year</label>
                    <input type="month" value={monthVal} onChange={e => { setMonthVal(e.target.value); setError(''); }} className="form-input" style={{ width:'100%' }} />
                    {monthVal && (
                        <div style={{ color:'#2563eb', fontSize:'.8rem', fontWeight:700, marginTop:'.4rem' }}>
                            📅 Will open: <strong>{label}</strong>
                            {alreadyExists && <span style={{ color:'#dc2626', marginLeft:'.5rem' }}>⚠ Already exists</span>}
                        </div>
                    )}
                </div>

                <div style={{ background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:'9px', padding:'.6rem .85rem', marginBottom:'1rem', fontSize:'.8rem', color:'#0369a1', fontWeight:600 }}>
                    ℹ️ Students admitted after this month will be automatically skipped.
                </div>

                {hasDefaults && (
                    <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'10px', padding:'.75rem 1rem', marginBottom:'1rem' }}>
                        <div style={{ fontWeight:700, color:'#475569', fontSize:'.78rem', textTransform:'uppercase', letterSpacing:'.4px', marginBottom:'.5rem' }}>Class Defaults ({currencySymbol})</div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.3rem .75rem', fontSize:'.82rem' }}>
                            {[['Tuition', classDefaults.tuitionFee],['Admission',classDefaults.admissionFee],['Annual',classDefaults.annualFee],['Exam',classDefaults.examFee],['Transport',classDefaults.transportFee],['Lab',classDefaults.labFee]].filter(([,v])=>Number(v)>0).map(([k,v])=>(
                                <div key={k} style={{ color:'#64748b' }}>{k}: <span style={{ color:'#1e293b', fontWeight:700 }}>{currencySymbol} {Number(v).toLocaleString()}</span></div>
                            ))}
                        </div>
                    </div>
                )}

                {!hasDefaults && (
                    <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'10px', padding:'.65rem .9rem', marginBottom:'1rem', fontSize:'.8rem', color:'#b45309', fontWeight:600 }}>
                        ⚠ No fee defaults set for {firstClass}. Go to <strong>Fee Settings</strong> to configure.
                    </div>
                )}

                {error && <div style={{ color:'#dc2626', fontSize:'.82rem', fontWeight:600, marginBottom:'.75rem', background:'#fef2f2', padding:'.5rem .75rem', borderRadius:'8px' }}>⚠ {error}</div>}

                <div style={{ display:'flex', gap:'.75rem', justifyContent:'flex-end' }}>
                    <button onClick={onClose} style={{ padding:'.6rem 1.25rem', borderRadius:'8px', border:'1px solid #e2e8f0', background:'white', color:'#475569', fontWeight:600, cursor:'pointer' }}>Cancel</button>
                    <button onClick={handleAdd} disabled={saving || !monthVal || alreadyExists} style={{ padding:'.6rem 1.5rem', borderRadius:'8px', border:'none', background:(!monthVal||saving||alreadyExists)?'#93c5fd':'#2563eb', color:'white', fontWeight:700, cursor:(!monthVal||saving||alreadyExists)?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:'.4rem', transition:'background .2s' }}>
                        {saving ? 'Adding…' : <><Plus size={16}/> Add Month</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────────────────────
   QUICK PAY MODAL  (Edit Mode)
───────────────────────────────────────────────────────────────────────────── */
const QuickPayModal = ({ student, record, month, classDefaults, currencySymbol, onClose, onSave }) => {
    // Allow overriding fee amounts per record
    const [tuitionFee,    setTuitionFee]    = useState(String(record?.tuitionFee   ?? classDefaults.tuitionFee   ?? 0));
    const [admissionFee,  setAdmissionFee]  = useState(String(record?.admissionFee ?? classDefaults.admissionFee ?? 0));
    const [lateFine,      setLateFine]      = useState(String(record?.lateFine     ?? 0));
    const [discount,      setDiscount]      = useState(String(record?.discount     ?? 0));
    const [paidAmount,    setPaidAmount]    = useState(String(record?.paidAmount   ?? 0));
    const [paymentMethod, setPaymentMethod] = useState(record?.paymentMethod || 'Cash');
    const [paymentDate,   setPaymentDate]   = useState(record?.paymentDate || new Date().toISOString().split('T')[0]);
    const [saving,        setSaving]        = useState(false);
    const [tab,           setTab]           = useState('pay'); // 'pay' | 'edit'

    const net     = Number(tuitionFee||0) + Number(admissionFee||0) + Number(lateFine||0) - Number(discount||0);
    const paid    = Number(paidAmount) || 0;
    const balance = net - paid;
    const autoStatus = paid >= net && net > 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid';

    const handleSave = async () => {
        setSaving(true);
        await onSave({
            ...record,
            month,
            tuitionFee:    Number(tuitionFee)   || 0,
            admissionFee:  Number(admissionFee) || 0,
            lateFine:      Number(lateFine)     || 0,
            discount:      Number(discount)     || 0,
            paidAmount:    paid,
            status:        autoStatus,
            paymentMethod,
            paymentDate,
        });
        setSaving(false);
        onClose();
    };

    return (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.65)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{ background:'white', borderRadius:'16px', width:'100%', maxWidth:'440px', padding:'1.75rem', boxShadow:'0 25px 50px -12px rgba(0,0,0,.25)' }} className="animate-fade-in">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem' }}>
                    <div>
                        <h3 style={{ fontSize:'1.05rem', fontWeight:800, color:'#1e293b', margin:0 }}>💳 {month}</h3>
                        <p style={{ color:'#64748b', fontSize:'.82rem', margin:'3px 0 0' }}>{student.name} · {student.id}</p>
                    </div>
                    <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}><X size={20} /></button>
                </div>

                {/* Tabs */}
                <div style={{ display:'flex', borderRadius:'8px', border:'1px solid #e2e8f0', overflow:'hidden', marginBottom:'1rem' }}>
                    {[['pay','💳 Pay'],['edit','✏️ Edit Fees']].map(([id,label]) => (
                        <button key={id} onClick={() => setTab(id)} style={{ flex:1, padding:'.45rem', fontSize:'.8rem', fontWeight:tab===id?800:600, background:tab===id?'#0f172a':'white', color:tab===id?'white':'#64748b', border:'none', cursor:'pointer', transition:'all .15s' }}>{label}</button>
                    ))}
                </div>

                {tab === 'pay' && (<>
                    {/* Net summary */}
                    <div style={{ background:'#f8fafc', borderRadius:'12px', padding:'.9rem 1rem', marginBottom:'1rem', display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid #e2e8f0' }}>
                        <div>
                            <div style={{ fontSize:'.72rem', color:'#94a3b8', fontWeight:700, textTransform:'uppercase' }}>Net Payable</div>
                            <div style={{ fontSize:'1.5rem', fontWeight:800, color:'#1e293b' }}>{currencySymbol} {net.toLocaleString()}</div>
                        </div>
                        <div style={{ textAlign:'right' }}>
                            <div style={{ fontSize:'.72rem', color:'#94a3b8', fontWeight:700, textTransform:'uppercase' }}>Balance</div>
                            <div style={{ fontSize:'1.1rem', fontWeight:800, color: balance > 0 ? '#dc2626' : '#16a34a' }}>
                                {currencySymbol} {Math.max(0, balance).toLocaleString()}
                            </div>
                        </div>
                    </div>
                    <div style={{ marginBottom:'.85rem' }}>
                        <label style={{ display:'block', fontWeight:700, color:'#475569', fontSize:'.85rem', marginBottom:'.35rem' }}>Amount Paid ({currencySymbol})</label>
                        <div style={{ display:'flex', gap:'.5rem' }}>
                            <input type="number" min="0" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} className="form-input" style={{ flex:1, fontSize:'1.1rem', fontWeight:800 }} placeholder="0" />
                            <button onClick={() => setPaidAmount(String(net))} style={{ padding:'.5rem .85rem', background:'#f0fdf4', border:'1px solid #86efac', color:'#16a34a', borderRadius:'8px', fontWeight:700, fontSize:'.8rem', cursor:'pointer', whiteSpace:'nowrap' }}>Full</button>
                        </div>
                        {paid > 0 && (
                            <div style={{ marginTop:'.35rem', padding:'.35rem .65rem', background: autoStatus==='paid'?'#f0fdf4':autoStatus==='partial'?'#fffbeb':'#fef2f2', borderRadius:'6px', fontSize:'.78rem', fontWeight:700, color: autoStatus==='paid'?'#16a34a':autoStatus==='partial'?'#d97706':'#dc2626' }}>
                                Status: {autoStatus.toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.75rem', marginBottom:'1rem' }}>
                        <div>
                            <label style={{ display:'block', fontWeight:700, color:'#475569', fontSize:'.82rem', marginBottom:'.3rem' }}>Method</label>
                            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="form-input" style={{ width:'100%' }}>
                                {['Cash','Bank Transfer','EasyPaisa','JazzCash','Cheque'].map(m => <option key={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display:'block', fontWeight:700, color:'#475569', fontSize:'.82rem', marginBottom:'.3rem' }}>Date</label>
                            <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="form-input" style={{ width:'100%' }} />
                        </div>
                    </div>
                </>)}

                {tab === 'edit' && (<>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.65rem', marginBottom:'1rem' }}>
                        {[['Tuition Fee', tuitionFee, setTuitionFee],['Admission Fee', admissionFee, setAdmissionFee],['Late Fine', lateFine, setLateFine],['Discount', discount, setDiscount]].map(([lbl, val, setter]) => (
                            <div key={lbl}>
                                <label style={{ display:'block', fontWeight:700, color:'#475569', fontSize:'.78rem', marginBottom:'.2rem' }}>{lbl}</label>
                                <input type="number" min="0" value={val} onChange={e => setter(e.target.value)} className="form-input" style={{ width:'100%', fontSize:'.9rem' }} />
                            </div>
                        ))}
                    </div>
                    <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:'8px', padding:'.55rem .85rem', fontSize:'.82rem', fontWeight:700, color:'#16a34a', marginBottom:'1rem' }}>
                        New Net Payable: {currencySymbol} {net.toLocaleString()}
                    </div>
                    <div style={{ marginBottom:'.85rem' }}>
                        <label style={{ display:'block', fontWeight:700, color:'#475569', fontSize:'.85rem', marginBottom:'.35rem' }}>Amount Paid ({currencySymbol})</label>
                        <div style={{ display:'flex', gap:'.5rem' }}>
                            <input type="number" min="0" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} className="form-input" style={{ flex:1, fontSize:'1.1rem', fontWeight:800 }} placeholder="0" />
                            <button onClick={() => setPaidAmount(String(net))} style={{ padding:'.5rem .85rem', background:'#f0fdf4', border:'1px solid #86efac', color:'#16a34a', borderRadius:'8px', fontWeight:700, fontSize:'.8rem', cursor:'pointer' }}>Full</button>
                        </div>
                    </div>
                </>)}

                <div style={{ display:'flex', gap:'.75rem', justifyContent:'flex-end' }}>
                    <button onClick={onClose} style={{ padding:'.6rem 1.25rem', borderRadius:'8px', border:'1px solid #e2e8f0', background:'white', color:'#475569', fontWeight:600, cursor:'pointer' }}>Cancel</button>
                    <button onClick={handleSave} disabled={saving} style={{ padding:'.6rem 1.5rem', borderRadius:'8px', border:'none', background:saving?'#94a3b8':'#2563eb', color:'white', fontWeight:700, cursor:saving?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:'.4rem' }}>
                        {saving ? 'Saving…' : <><Save size={15}/> Save</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────────────────────
   FEE OVERRIDE MODAL  (Edit Mode → click Fee/mo cell)
───────────────────────────────────────────────────────────────────────────── */
const FeeOverrideModal = ({ student, classDefaults, currencySymbol, onClose, onSave }) => {
    const current = student.admissions?.[0]?.feeOverride || {};
    const [tuitionFee,    setTuitionFee]    = useState(String(current.tuitionFee   ?? classDefaults.tuitionFee   ?? 0));
    const [admissionFee,  setAdmissionFee]  = useState(String(current.admissionFee ?? classDefaults.admissionFee ?? 0));
    const [annualFee,     setAnnualFee]     = useState(String(current.annualFee    ?? classDefaults.annualFee    ?? 0));
    const [examFee,       setExamFee]       = useState(String(current.examFee      ?? classDefaults.examFee      ?? 0));
    const [transportFee,  setTransportFee]  = useState(String(current.transportFee ?? classDefaults.transportFee ?? 0));
    const [labFee,        setLabFee]        = useState(String(current.labFee       ?? classDefaults.labFee       ?? 0));
    const [saving,        setSaving]        = useState(false);

    const hasOverride = !!student.admissions?.[0]?.feeOverride;
    const totalMonthly = Number(tuitionFee||0) + Number(admissionFee||0) + Number(annualFee||0) + Number(examFee||0) + Number(transportFee||0) + Number(labFee||0);
    const classTotal   = computeNet({}, classDefaults);

    const fields = [
        ['Tuition Fee',   tuitionFee,   setTuitionFee,   '#2563eb'],
        ['Admission Fee', admissionFee, setAdmissionFee, '#7c3aed'],
        ['Annual Fee',    annualFee,    setAnnualFee,    '#0891b2'],
        ['Exam Fee',      examFee,      setExamFee,      '#d97706'],
        ['Transport Fee', transportFee, setTransportFee, '#16a34a'],
        ['Lab Fee',       labFee,       setLabFee,       '#dc2626'],
    ].filter(([, , , color], i) => [
        Number(classDefaults.tuitionFee), Number(classDefaults.admissionFee),
        Number(classDefaults.annualFee),  Number(classDefaults.examFee),
        Number(classDefaults.transportFee), Number(classDefaults.labFee)
    ][i] > 0 || [Number(tuitionFee), Number(admissionFee), Number(annualFee), Number(examFee), Number(transportFee), Number(labFee)][i] > 0);

    const handleSave = async () => {
        setSaving(true);
        const feeOverride = {
            tuitionFee:    Number(tuitionFee)   || 0,
            admissionFee:  Number(admissionFee) || 0,
            annualFee:     Number(annualFee)    || 0,
            examFee:       Number(examFee)      || 0,
            transportFee:  Number(transportFee) || 0,
            labFee:        Number(labFee)       || 0,
        };
        await onSave(student.id, feeOverride);
        setSaving(false);
        onClose();
    };

    const handleReset = async () => {
        setSaving(true);
        await onSave(student.id, null); // null = remove override
        setSaving(false);
        onClose();
    };

    return (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.65)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{ background:'white', borderRadius:'16px', width:'100%', maxWidth:'460px', padding:'1.75rem', boxShadow:'0 25px 50px -12px rgba(0,0,0,.25)' }} className="animate-fade-in">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem' }}>
                    <div>
                        <h3 style={{ fontSize:'1.05rem', fontWeight:800, color:'#1e293b', margin:0 }}>💰 Custom Fee — {student.name}</h3>
                        <p style={{ color:'#64748b', fontSize:'.82rem', margin:'4px 0 0' }}>
                            {student.id} · {student.grade}
                            {hasOverride && <span style={{ marginLeft:'.5rem', padding:'1px 7px', borderRadius:'999px', background:'#fef3c7', color:'#b45309', fontSize:'.72rem', fontWeight:800 }}>CUSTOM</span>}
                        </p>
                    </div>
                    <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}><X size={20} /></button>
                </div>

                {/* Class default reference */}
                <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'10px', padding:'.65rem .9rem', marginBottom:'1rem', fontSize:'.8rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ color:'#64748b', fontWeight:600 }}>Class default ({student.grade})</span>
                    <span style={{ fontWeight:800, color:'#475569' }}>{currencySymbol} {classTotal.toLocaleString()} / mo</span>
                </div>

                {/* Fee fields */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.65rem', marginBottom:'1rem' }}>
                    {fields.length === 0 ? (
                        // If class has no defaults configured, show all 6 fields
                        [['Tuition Fee', tuitionFee, setTuitionFee], ['Admission Fee', admissionFee, setAdmissionFee],
                         ['Annual Fee', annualFee, setAnnualFee], ['Exam Fee', examFee, setExamFee],
                         ['Transport Fee', transportFee, setTransportFee], ['Lab Fee', labFee, setLabFee]]
                            .map(([lbl, val, setter]) => (
                                <div key={lbl}>
                                    <label style={{ display:'block', fontWeight:700, color:'#475569', fontSize:'.78rem', marginBottom:'.2rem' }}>{lbl}</label>
                                    <div style={{ position:'relative' }}>
                                        <span style={{ position:'absolute', left:'8px', top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontSize:'.75rem', fontWeight:700 }}>{currencySymbol}</span>
                                        <input type="number" min="0" value={val} onChange={e => setter(e.target.value)} className="form-input" style={{ paddingLeft:'28px', width:'100%' }} />
                                    </div>
                                </div>
                            ))
                    ) : (
                        fields.map(([lbl, val, setter, color]) => (
                            <div key={lbl}>
                                <label style={{ display:'block', fontWeight:700, color:'#475569', fontSize:'.78rem', marginBottom:'.2rem' }}>
                                    {lbl}
                                    <span style={{ display:'inline-block', marginLeft:'.3rem', width:'7px', height:'7px', borderRadius:'50%', background:color }} />
                                </label>
                                <div style={{ position:'relative' }}>
                                    <span style={{ position:'absolute', left:'8px', top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontSize:'.75rem', fontWeight:700 }}>{currencySymbol}</span>
                                    <input type="number" min="0" value={val} onChange={e => setter(e.target.value)} className="form-input" style={{ paddingLeft:'28px', width:'100%' }} />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* New total preview */}
                <div style={{ background: totalMonthly !== classTotal ? '#fffbeb' : '#f0fdf4', border:`1.5px solid ${totalMonthly !== classTotal ? '#fde68a' : '#86efac'}`, borderRadius:'10px', padding:'.65rem 1rem', marginBottom:'1rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontWeight:700, fontSize:'.85rem', color: totalMonthly !== classTotal ? '#b45309' : '#16a34a' }}>
                        {totalMonthly !== classTotal ? '⚠ Custom total' : '✓ Same as class default'}
                    </span>
                    <span style={{ fontWeight:800, fontSize:'1.1rem', color:'#1e293b' }}>{currencySymbol} {totalMonthly.toLocaleString()}</span>
                </div>

                <div style={{ display:'flex', gap:'.6rem', justifyContent:'space-between', alignItems:'center' }}>
                    {hasOverride ? (
                        <button onClick={handleReset} disabled={saving} style={{ padding:'.5rem 1rem', borderRadius:'8px', border:'1.5px solid #e2e8f0', background:'white', color:'#dc2626', fontWeight:700, fontSize:'.8rem', cursor:'pointer' }}>
                            🔄 Reset to Class Default
                        </button>
                    ) : <div />}
                    <div style={{ display:'flex', gap:'.6rem' }}>
                        <button onClick={onClose} style={{ padding:'.6rem 1.1rem', borderRadius:'8px', border:'1px solid #e2e8f0', background:'white', color:'#475569', fontWeight:600, cursor:'pointer' }}>Cancel</button>
                        <button onClick={handleSave} disabled={saving} style={{ padding:'.6rem 1.4rem', borderRadius:'8px', border:'none', background:saving?'#94a3b8':'#2563eb', color:'white', fontWeight:700, cursor:saving?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:'.4rem' }}>
                            {saving ? 'Saving…' : <><Save size={15}/> Save Fee</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────────────────────
   TABLE CELL STYLES
───────────────────────────────────────────────────────────────────────────── */
const TH = {
    padding: '.6rem .5rem', textAlign: 'center', fontWeight: 700, fontSize: '.7rem',
    textTransform: 'uppercase', letterSpacing: '.3px', whiteSpace: 'nowrap',
    position: 'sticky', top: 0, zIndex: 10, background: '#0f172a', color: 'white',
};
const THL = { ...TH, textAlign: 'left' }; // left-aligned header
const TD  = { padding: '.55rem .45rem', verticalAlign: 'middle' };

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
    const { saveFeeRecords, saveStudentFeeOverride } = useSchoolData();

    /* ── State ─────────────────────────────────────────────────────────── */
    const [selectedClasses,   setSelectedClasses]   = useState(() => new Set([selectedClass].filter(Boolean)));
    const [searchQuery,       setSearchQuery]       = useState('');
    const [genderTab,         setGenderTab]         = useState('all');
    const [activeFilter,      setActiveFilter]      = useState(null);
    const [editMode,          setEditMode]          = useState(false);
    const [showAddMonth,      setShowAddMonth]      = useState(false);
    const [quickPay,          setQuickPay]          = useState(null);
    const [feeOverrideStudent, setFeeOverrideStudent] = useState(null); // student whose fee/mo is being edited
    const [sidebarOpen,       setSidebarOpen]       = useState(true);
    const [printMonth,        setPrintMonth]        = useState('');
    const [expandedSections,  setExpandedSections]  = useState(() => {
        const init = {};
        (sections || []).forEach(s => { init[s.id] = true; });
        return init;
    });

    const currentYear       = new Date().getFullYear();
    const currentMonthLabel = getCurrentMonthLabel();
    const today             = new Date();
    const showRolloverBanner = today.getDate() >= 25;

    /* ── Toggle class selection ─────────────────────────────────────────── */
    const toggleClass = (cls) => {
        setSelectedClasses(prev => {
            const next = new Set(prev);
            if (next.has(cls)) {
                if (next.size === 1) return prev; // keep at least one
                next.delete(cls);
            } else {
                next.add(cls);
            }
            return next;
        });
        setSelectedClass(cls); // keep parent in sync for other tabs
        setActiveFilter(null);
        setSearchQuery('');
        setEditMode(false);
    };

    const selectAllInSection = (secClasses) => {
        setSelectedClasses(prev => {
            const next = new Set(prev);
            secClasses.forEach(c => next.add(c));
            return next;
        });
        setActiveFilter(null);
        setSearchQuery('');
    };

    /* ── Defaults (first selected class) ───────────────────────────────── */
    const firstClass    = [...selectedClasses][0] || '';
    const classDefaults = useMemo(() =>
        (CLASS_FEE_DEFAULTS && CLASS_FEE_DEFAULTS[firstClass]) || {
            tuitionFee: 0, admissionFee: 0, annualFee: 0, examFee: 0, transportFee: 0, labFee: 0,
        },
        [CLASS_FEE_DEFAULTS, firstClass]
    );

    /* ── Base student list (all selected classes) ────────────────────────── */
    const allClassStudents = useMemo(() =>
        students
            .filter(s => selectedClasses.has(s.grade))
            .sort((a, b) => {
                const sa = parseInt(a.serialNumber, 10), sb = parseInt(b.serialNumber, 10);
                if (!isNaN(sa) && !isNaN(sb)) return sa - sb;
                return a.id.localeCompare(b.id, undefined, { numeric: true });
            }),
        [students, selectedClasses]
    );

    /* ── Month columns: auto Jan-Dec for current year + any extra from DB ─── */
    const allMonths = useMemo(() => {
        const autoSet = new Set(yearMonthLabels(currentYear));
        // also include past year months that exist in DB
        allClassStudents.forEach(s =>
            (s.feeHistory || []).forEach(h => {
                if (!h.month?.startsWith(PAPER_FUND_PREFIX)) autoSet.add(h.month);
            })
        );
        return sortMonthLabels([...autoSet]);
    }, [allClassStudents, currentYear]);

    /* ── Current-month stats ─────────────────────────────────────────────── */
    const stats = useMemo(() => {
        const total      = allClassStudents.length;
        const paid       = allClassStudents.filter(s => (s.feeHistory||[]).some(h => h.month===currentMonthLabel && h.status==='paid')).length;
        const unpaid     = allClassStudents.filter(s => (s.feeHistory||[]).some(h => h.month===currentMonthLabel && (h.status==='unpaid'||h.status==='partial'))).length;
        const defaulters = allClassStudents.filter(s => isDefaulter(s, currentMonthLabel, classDefaults)).length;
        const free       = allClassStudents.filter(s => isFreeStudent(s, classDefaults)).length;
        return { total, paid, unpaid, defaulters, free };
    }, [allClassStudents, currentMonthLabel, classDefaults]);

    /* ── Gender counts ──────────────────────────────────────────────────── */
    const boysCount  = allClassStudents.filter(s => s.admissions?.[0]?.gender === 'Male').length;
    const girlsCount = allClassStudents.filter(s => s.admissions?.[0]?.gender === 'Female').length;

    /* ── Visible / filtered students ────────────────────────────────────── */
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
        if (activeFilter === 'defaulters') list = list.filter(s => isDefaulter(s, currentMonthLabel, classDefaults));
        if (activeFilter === 'free')       list = list.filter(s => isFreeStudent(s, classDefaults));
        return list;
    }, [allClassStudents, genderTab, searchQuery, activeFilter, currentMonthLabel, classDefaults]);

    /* ── Per-student totals (respects admission date) ────────────────────── */
    const getStudentTotals = (student) => {
        const cd  = (CLASS_FEE_DEFAULTS && CLASS_FEE_DEFAULTS[student.grade]) || classDefaults;
        let totalPayable = 0, totalPaid = 0;
        allMonths.forEach(month => {
            if (!studentOwesMonth(student, month)) return; // before admission → skip
            const rec = (student.feeHistory || []).find(h => h.month === month);
            if (rec) {
                totalPayable += computeNet(rec, cd);
                totalPaid    += Number(rec.paidAmount ?? 0);
            } else {
                // auto month with no record → count full class default as payable
                totalPayable += computeNet({}, cd);
            }
        });
        return { totalPayable, totalPaid, pending: Math.max(0, totalPayable - totalPaid) };
    };

    /* ── Month cell renderer ─────────────────────────────────────────────── */
    const renderMonthCell = (student, month) => {
        const cd = (CLASS_FEE_DEFAULTS && CLASS_FEE_DEFAULTS[student.grade]) || classDefaults;

        // Before admission → show N/A
        if (!studentOwesMonth(student, month)) {
            return <div style={{ textAlign:'center', color:'#d1d5db', fontSize:'.7rem', fontWeight:600 }}>N/A</div>;
        }

        // Free student
        if (isFreeStudent(student, cd)) {
            return <div style={{ textAlign:'center' }}><span style={{ padding:'2px 7px', borderRadius:'999px', fontSize:'.68rem', fontWeight:800, background:'#ede9fe', color:'#7c3aed' }}>FREE</span></div>;
        }

        const rec = (student.feeHistory || []).find(h => h.month === month);

        // No record (auto month not yet opened)
        if (!rec) {
            const isFuture = monthLabelToKey(month) > monthLabelToKey(currentMonthLabel);
            if (editMode) {
                return (
                    <button
                        onClick={() => setQuickPay({ student, record: null, month })}
                        style={{ padding:'3px 8px', borderRadius:'999px', fontSize:'.68rem', fontWeight:700, border:'1px dashed #cbd5e1', cursor:'pointer', background:'#f8fafc', color:'#94a3b8', width:'100%' }}
                    >+ Open</button>
                );
            }
            return <div style={{ textAlign:'center', color: isFuture ? '#e2e8f0' : '#d1d5db', fontSize:'.72rem', fontWeight:600 }}>{isFuture ? '—' : '⚠ '}</div>;
        }

        const { status } = rec;
        const isPaid    = status === 'paid';
        const isPartial = status === 'partial';
        const bg    = isPaid ? '#dcfce7' : isPartial ? '#fef3c7' : '#fee2e2';
        const color = isPaid ? '#16a34a' : isPartial ? '#d97706' : '#dc2626';
        const icon  = isPaid ? '✓' : isPartial ? '⚠' : '✗';

        if (editMode) return (
            <button
                onClick={() => setQuickPay({ student, record: rec, month })}
                title={`Edit ${month} — ${status}`}
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

    /* ── Handlers ────────────────────────────────────────────────────────── */
    const handleCardClick = (filter) => setActiveFilter(prev => prev === filter ? null : filter);

    const handleQuickPaySave = async (updatedRecord) => {
        if (!quickPay) return;
        await updateStudentFeeRecord(quickPay.student.id, updatedRecord.month, updatedRecord);
    };

    const handleFeeOverrideSave = async (studentId, feeOverride) => {
        if (!saveStudentFeeOverride) return;
        await saveStudentFeeOverride(studentId, feeOverride);
        if (showSaveMessage) {
            showSaveMessage(feeOverride === null
                ? 'Fee reset to class default.'
                : 'Custom fee saved for this student.'
            );
        }
    };

    const handleAddMonthSuccess = (label) => {
        if (showSaveMessage) showSaveMessage(`Month "${label}" opened for ${[...selectedClasses].join(', ')}!`);
    };

    /* ── Open next month for all classes ─────────────────────────────────── */
    const handleOpenNextMonth = async () => {
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        const nextMonth = d.toLocaleString('default', { month: 'long', year: 'numeric' });
        const records = allClassStudents
            .filter(s => studentOwesMonth(s, nextMonth))
            .filter(s => !(s.feeHistory||[]).some(h => h.month === nextMonth))
            .map(s => {
                const cd = (CLASS_FEE_DEFAULTS && CLASS_FEE_DEFAULTS[s.grade]) || classDefaults;
                return { student_id: s.id, month: nextMonth, status:'unpaid', ...cd, lateFine:0, discount:0, paidAmount:0 };
            });
        if (records.length === 0) { if (showSaveMessage) showSaveMessage(`${nextMonth} already exists for all students.`); return; }
        await saveFeeRecords(records);
        if (showSaveMessage) showSaveMessage(`✅ ${nextMonth} opened for ${records.length} students!`);
    };

    /* ── Print vouchers ──────────────────────────────────────────────────── */
    const doPrintVouchers = (month) => {
        if (!month) return;
        const targets = visibleStudents;
        let html = `<!DOCTYPE html><html><head><title>Vouchers — ${month}</title><style>${VOUCHER_CSS}</style></head><body>
            <button class="btn-print" onclick="window.print()">🖨 Print All Vouchers (${targets.length})</button>
            <div class="grid">`;
        targets.forEach(student => {
            const cd = (CLASS_FEE_DEFAULTS && CLASS_FEE_DEFAULTS[student.grade]) || classDefaults;
            const record = (student.feeHistory || []).find(h => h.month === month)
                || { month, status: 'unpaid', paidAmount: 0, ...cd };
            html += buildVoucherHTML(student, record, cd, currencySymbol, schoolName, schoolLogo, schoolSettings);
        });
        html += `</div></body></html>`;
        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
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

            {/* Modals */}
            {showAddMonth && (
                <AddMonthModal
                    selectedClasses={selectedClasses}
                    allClassStudents={allClassStudents}
                    CLASS_FEE_DEFAULTS={CLASS_FEE_DEFAULTS}
                    currencySymbol={currencySymbol}
                    onClose={() => setShowAddMonth(false)}
                    onSuccess={handleAddMonthSuccess}
                />
            )}
            {quickPay && (
                <QuickPayModal
                    student={quickPay.student}
                    record={quickPay.record}
                    month={quickPay.month}
                    classDefaults={(CLASS_FEE_DEFAULTS && CLASS_FEE_DEFAULTS[quickPay.student.grade]) || classDefaults}
                    currencySymbol={currencySymbol}
                    onClose={() => setQuickPay(null)}
                    onSave={handleQuickPaySave}
                />
            )}
            {feeOverrideStudent && (
                <FeeOverrideModal
                    student={feeOverrideStudent}
                    classDefaults={(CLASS_FEE_DEFAULTS && CLASS_FEE_DEFAULTS[feeOverrideStudent.grade]) || classDefaults}
                    currencySymbol={currencySymbol}
                    onClose={() => setFeeOverrideStudent(null)}
                    onSave={handleFeeOverrideSave}
                />
            )}

            {/* ══ SIDEBAR ══════════════════════════════════════════════════ */}
            <div style={{
                width: sidebarOpen ? '220px' : '0',
                minWidth: sidebarOpen ? '220px' : '0',
                overflow: 'hidden', transition: 'all .25s ease',
                background: 'white', borderRight: '1px solid #e2e8f0',
                display: 'flex', flexDirection: 'column', flexShrink: 0,
            }}>
                <div style={{ padding:'.85rem .8rem', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ fontWeight:800, fontSize:'.88rem', color:'#1e293b' }}>📚 Classes</span>
                    <div style={{ display:'flex', alignItems:'center', gap:'.35rem' }}>
                        {selectedClasses.size > 1 && (
                            <button
                                onClick={() => { setSelectedClasses(new Set([firstClass])); setSelectedClass(firstClass); }}
                                style={{ fontSize:'.68rem', fontWeight:700, color:'#dc2626', background:'#fef2f2', border:'none', borderRadius:'5px', padding:'1px 6px', cursor:'pointer' }}
                            >Clear</button>
                        )}
                        <button onClick={() => setSidebarOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', display:'flex' }}><X size={15} /></button>
                    </div>
                </div>
                <div style={{ flex:1, overflowY:'auto', padding:'.4rem' }}>
                    {sections && sections.length > 0
                        ? sections.map(sec => (
                            <div key={sec.id} style={{ marginBottom:'.15rem' }}>
                                <div style={{ display:'flex', alignItems:'center' }}>
                                    <button
                                        onClick={() => setExpandedSections(p => ({ ...p, [sec.id]: !p[sec.id] }))}
                                        style={{ flex:1, display:'flex', alignItems:'center', gap:'.45rem', padding:'.45rem .55rem', background:'transparent', border:'none', cursor:'pointer', color:'#64748b', fontWeight:700, fontSize:'.8rem', borderRadius:'7px', textAlign:'left' }}
                                    >
                                        {expandedSections[sec.id] ? <ChevronDown size={13}/> : <ChevronRight size={13}/>}
                                        {sec.name}
                                    </button>
                                    <button
                                        onClick={() => selectAllInSection(sec.classes || [])}
                                        title="Select all classes in this section"
                                        style={{ fontSize:'.63rem', fontWeight:700, color:'#2563eb', background:'#eff6ff', border:'none', borderRadius:'5px', padding:'2px 5px', cursor:'pointer', marginRight:'.25rem', whiteSpace:'nowrap' }}
                                    >All</button>
                                </div>
                                {expandedSections[sec.id] && (
                                    <div style={{ paddingLeft:'.35rem' }}>
                                        {(sec.classes || []).sort(classSort).map(cls => {
                                            const isSelected = selectedClasses.has(cls);
                                            return (
                                                <button key={cls}
                                                    onClick={() => toggleClass(cls)}
                                                    style={{
                                                        width:'100%', padding:'.42rem .7rem', borderRadius:'7px', border:'none', cursor:'pointer', textAlign:'left',
                                                        fontSize:'.84rem', fontWeight: isSelected ? 800 : 600,
                                                        background: isSelected ? '#eff6ff' : 'transparent',
                                                        color:      isSelected ? '#2563eb' : '#64748b',
                                                        borderLeft: `3px solid ${isSelected ? '#2563eb' : 'transparent'}`,
                                                        transition:'all .12s', marginBottom:'1px',
                                                        display:'flex', alignItems:'center', justifyContent:'space-between',
                                                    }}
                                                >
                                                    {cls}
                                                    {isSelected && <Check size={12} style={{ flexShrink:0 }}/>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))
                        : sortedClasses.map(cls => {
                            const isSelected = selectedClasses.has(cls);
                            return (
                                <button key={cls}
                                    onClick={() => toggleClass(cls)}
                                    style={{
                                        width:'100%', padding:'.48rem .7rem', borderRadius:'8px', border:'none', cursor:'pointer', textAlign:'left',
                                        fontSize:'.86rem', fontWeight: isSelected ? 800 : 600,
                                        background: isSelected ? '#eff6ff' : 'transparent',
                                        color:      isSelected ? '#2563eb' : '#64748b',
                                        borderLeft: `3px solid ${isSelected ? '#2563eb' : 'transparent'}`,
                                        transition:'all .12s', marginBottom:'2px',
                                        display:'flex', alignItems:'center', justifyContent:'space-between',
                                    }}
                                >
                                    {cls}
                                    {isSelected && <Check size={12} style={{ flexShrink:0 }}/>}
                                </button>
                            );
                        })
                    }
                </div>
            </div>

            {/* ══ MAIN ═════════════════════════════════════════════════════ */}
            <div style={{ flex:1, minWidth:0, padding:'1.4rem', display:'flex', flexDirection:'column', gap:'1.1rem', overflowY:'auto' }}>

                {/* ── Rollover banner ─────────────────────────────────────── */}
                {showRolloverBanner && (
                    <div style={{ background:'#fffbeb', border:'1.5px solid #fde68a', borderRadius:'10px', padding:'.65rem 1rem', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem', flexWrap:'wrap' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'.5rem', color:'#b45309', fontWeight:700, fontSize:'.85rem' }}>
                            <AlertTriangle size={16}/>
                            Month closing soon — Open next month for all selected classes?
                        </div>
                        <button
                            onClick={handleOpenNextMonth}
                            style={{ padding:'.4rem 1rem', background:'#f59e0b', color:'white', border:'none', borderRadius:'8px', fontWeight:700, fontSize:'.8rem', cursor:'pointer', whiteSpace:'nowrap' }}
                        >
                            📅 Open Next Month
                        </button>
                    </div>
                )}

                {/* ── Top bar ─────────────────────────────────────────────── */}
                <div style={{ display:'flex', alignItems:'center', gap:'.9rem', flexWrap:'wrap' }}>
                    {!sidebarOpen && (
                        <button onClick={() => setSidebarOpen(true)} style={{ padding:'.45rem .75rem', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:'8px', cursor:'pointer', color:'#475569', fontWeight:700, fontSize:'.8rem', display:'flex', alignItems:'center', gap:'.35rem' }}>
                            <ChevronRight size={15}/> Classes
                        </button>
                    )}
                    <div>
                        <h2 style={{ fontSize:'1.45rem', fontWeight:800, color:'#1e293b', margin:0 }}>💰 Fee Management</h2>
                        <p style={{ color:'#64748b', fontSize:'.8rem', margin:'2px 0 0' }}>
                            {selectedClasses.size === 1 ? firstClass : `${selectedClasses.size} classes selected`} &middot; {currentMonthLabel}
                            {selectedClasses.size > 1 && <span style={{ marginLeft:'.4rem', color:'#2563eb', fontWeight:700 }}>({allClassStudents.length} students)</span>}
                        </p>
                    </div>
                    <div style={{ marginLeft:'auto', display:'flex', gap:'.55rem', alignItems:'center', flexWrap:'wrap' }}>
                        <button
                            onClick={() => setShowAddMonth(true)}
                            style={{ padding:'.52rem 1rem', background:'linear-gradient(135deg,#2563eb,#1d4ed8)', color:'white', border:'none', borderRadius:'10px', fontWeight:700, cursor:'pointer', fontSize:'.83rem', display:'flex', alignItems:'center', gap:'.35rem', boxShadow:'0 2px 8px rgba(37,99,235,.3)' }}
                        >
                            <Plus size={15}/> Add Month
                        </button>
                        {/* Print voucher dropdown */}
                        <div style={{ position:'relative' }}>
                            <select
                                value={printMonth}
                                onChange={e => { if (e.target.value) { doPrintVouchers(e.target.value); setPrintMonth(''); } }}
                                style={{ padding:'.52rem .85rem', background:'white', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontWeight:700, cursor:'pointer', fontSize:'.83rem', color:'#475569', appearance:'none', paddingRight:'2rem' }}
                            >
                                <option value="">🖨 Print Vouchers…</option>
                                {allMonths.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <button
                            onClick={() => setEditMode(p => !p)}
                            style={{ padding:'.52rem 1rem', background: editMode ? '#dc2626' : '#f1f5f9', color: editMode ? 'white' : '#475569', border: editMode ? 'none' : '1.5px solid #e2e8f0', borderRadius:'10px', fontWeight:700, cursor:'pointer', fontSize:'.83rem', display:'flex', alignItems:'center', gap:'.35rem', transition:'all .2s' }}
                        >
                            {editMode ? <><X size={15}/> Done</> : <><Edit3 size={15}/> Edit</>}
                        </button>
                    </div>
                </div>

                {/* ── Search + Gender ──────────────────────────────────────── */}
                <div style={{ display:'flex', gap:'.75rem', alignItems:'center', flexWrap:'wrap' }}>
                    <div style={{ position:'relative', flex:1, minWidth:'200px' }}>
                        <Search size={14} style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Search by name, ID or serial…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="form-input"
                            style={{ paddingLeft:'30px', paddingRight: searchQuery ? '30px' : undefined, width:'100%' }}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} style={{ position:'absolute', right:'8px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', display:'flex' }}>
                                <X size={14}/>
                            </button>
                        )}
                    </div>
                    <div style={{ display:'flex', borderRadius:'8px', border:'1px solid #e2e8f0', overflow:'hidden' }}>
                        {[
                            { id:'all',   label:`All (${allClassStudents.length})` },
                            { id:'boys',  label:`Boys (${boysCount})` },
                            { id:'girls', label:`Girls (${girlsCount})` },
                        ].map(g => (
                            <button key={g.id} onClick={() => setGenderTab(g.id)} style={{ padding:'.42rem .85rem', fontSize:'.8rem', fontWeight: genderTab===g.id ? 800 : 600, background: genderTab===g.id ? '#0f172a' : 'white', color: genderTab===g.id ? 'white' : '#64748b', border:'none', cursor:'pointer', transition:'all .15s' }}>{g.label}</button>
                        ))}
                    </div>
                </div>

                {/* ── Status Cards ─────────────────────────────────────────── */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'.65rem' }}>
                    {statusCards.map(card => (
                        <button
                            key={card.id}
                            onClick={() => handleCardClick(card.id)}
                            style={{
                                padding:'.75rem .65rem', borderRadius:'12px', border:`1.5px solid ${activeFilter===card.id ? card.color : card.border}`,
                                background: activeFilter===card.id ? card.color : card.bg,
                                color: activeFilter===card.id ? 'white' : card.color,
                                cursor:'pointer', textAlign:'center', transition:'all .18s', boxShadow: activeFilter===card.id ? `0 4px 12px ${card.color}44` : 'none',
                            }}
                        >
                            <div style={{ fontSize:'1.45rem', fontWeight:800, lineHeight:1 }}>{card.value}</div>
                            <div style={{ fontSize:'.68rem', fontWeight:700, opacity:.85, marginTop:'3px', textTransform:'uppercase', letterSpacing:'.3px' }}>{card.label}</div>
                        </button>
                    ))}
                </div>

                {/* ── Spreadsheet ──────────────────────────────────────────── */}
                <div style={{ border:'1px solid #e2e8f0', borderRadius:'14px', overflow:'hidden', flex:1 }}>
                    <div style={{ overflowX:'auto', overflowY:'auto', maxHeight:'60vh' }}>
                        <table style={{ borderCollapse:'collapse', minWidth:'100%', tableLayout:'fixed' }}>
                            <thead>
                                <tr>
                                    {/* Fixed left columns */}
                                    <th style={{ ...THL, width:'38px', position:'sticky', left:0, zIndex:20 }}>#</th>
                                    <th style={{ ...THL, width:'180px', position:'sticky', left:'38px', zIndex:20 }}>Student</th>
                                    {selectedClasses.size > 1 && (
                                        <th style={{ ...THL, width:'90px', position:'sticky', left:'218px', zIndex:20 }}>Class</th>
                                    )}
                                    <th style={{ ...TH, width:'70px' }}>Fee/mo</th>

                                    {/* Month columns */}
                                    {allMonths.map(m => (
                                        <th key={m} style={{ ...TH, width:'54px', background: m===currentMonthLabel ? '#1d4ed8' : '#0f172a' }}>
                                            {shortMonthLabel(m)}
                                        </th>
                                    ))}

                                    {/* Fixed right columns */}
                                    <th style={{ ...TH, width:'72px', position:'sticky', right:'144px', zIndex:20, background:'#1e293b' }}>Total</th>
                                    <th style={{ ...TH, width:'72px', position:'sticky', right:'72px',  zIndex:20, background:'#16a34a' }}>Paid</th>
                                    <th style={{ ...TH, width:'72px', position:'sticky', right:0,        zIndex:20, background:'#dc2626' }}>Pending</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleStudents.length === 0 && (
                                    <tr>
                                        <td colSpan={99} style={{ padding:'2rem', textAlign:'center', color:'#94a3b8', fontWeight:600, fontSize:'.9rem' }}>
                                            {searchQuery || activeFilter ? 'No students match the current filter.' : 'No students in selected class(es).'}
                                        </td>
                                    </tr>
                                )}
                                {visibleStudents.map((student, idx) => {
                                    const cd = (CLASS_FEE_DEFAULTS && CLASS_FEE_DEFAULTS[student.grade]) || classDefaults;
                                    const isFree  = isFreeStudent(student, cd);
                                    const defBadge= isDefaulter(student, currentMonthLabel, cd);
                                    const totals  = getStudentTotals(student);
                                    const leftBase= selectedClasses.size > 1 ? '308px' : '218px';

                                    return (
                                        <tr key={student.id} style={{ background: idx%2===0 ? 'white' : '#fafafa', borderBottom:'1px solid #f1f5f9' }}>
                                            {/* # */}
                                            <td style={{ ...TD, position:'sticky', left:0, background: idx%2===0?'white':'#fafafa', zIndex:5, color:'#94a3b8', fontWeight:700, fontSize:'.75rem', textAlign:'center' }}>
                                                {student.serialNumber || idx+1}
                                            </td>

                                            {/* Student info */}
                                            <td style={{ ...TD, position:'sticky', left:'38px', background: idx%2===0?'white':'#fafafa', zIndex:5, minWidth:'180px' }}>
                                                <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
                                                    <div style={{ width:'28px', height:'28px', borderRadius:'50%', overflow:'hidden', background:'linear-gradient(135deg,#2563eb,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:'.65rem', flexShrink:0 }}>
                                                        {(student.photo||student.image) ? <img src={student.photo||student.image} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : student.name?.slice(0,2).toUpperCase()}
                                                    </div>
                                                    <div style={{ minWidth:0 }}>
                                                        <div style={{ fontWeight:700, color:'#1e293b', fontSize:'.83rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                                                            {student.name}
                                                            {isFree && <span style={{ marginLeft:'.3rem', padding:'1px 5px', borderRadius:'4px', fontSize:'.62rem', fontWeight:800, background:'#ede9fe', color:'#7c3aed' }}>FREE</span>}
                                                            {defBadge && !isFree && <span style={{ marginLeft:'.3rem', padding:'1px 5px', borderRadius:'4px', fontSize:'.62rem', fontWeight:800, background:'#fef3c7', color:'#b45309' }}>DEF</span>}
                                                        </div>
                                                        <div style={{ fontSize:'.68rem', color:'#94a3b8' }}>{student.id}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Class column (multi-select mode) */}
                                            {selectedClasses.size > 1 && (
                                                <td style={{ ...TD, position:'sticky', left:'218px', background: idx%2===0?'white':'#fafafa', zIndex:5, fontSize:'.78rem', fontWeight:700, color:'#475569' }}>
                                                    {student.grade}
                                                </td>
                                            )}

                                            {/* Fee/mo — clickable in edit mode */}
                                            {(() => {
                                                const eff = getStudentEffectiveFee(student, cd);
                                                const effTotal = computeNet({}, eff);
                                                const classTotal = computeNet({}, cd);
                                                const hasOverride = !!student.admissions?.[0]?.feeOverride;
                                                return (
                                                    <td
                                                        style={{
                                                            ...TD,
                                                            textAlign:'center', fontSize:'.78rem', fontWeight:700,
                                                            color: hasOverride ? '#b45309' : '#475569',
                                                            cursor: editMode ? 'pointer' : 'default',
                                                            background: editMode ? (idx%2===0?'#fffbeb':'#fef9e7') : undefined,
                                                            transition:'background .15s',
                                                        }}
                                                        onClick={editMode ? () => setFeeOverrideStudent(student) : undefined}
                                                        title={editMode ? 'Click to set custom fee for this student' : undefined}
                                                    >
                                                        <div>
                                                            {currencySymbol} {effTotal.toLocaleString()}
                                                        </div>
                                                        {hasOverride && (
                                                            <div style={{ fontSize:'.6rem', fontWeight:800, color:'#b45309', background:'#fef3c7', borderRadius:'4px', padding:'0 4px', marginTop:'2px', display:'inline-block' }}>CUSTOM</div>
                                                        )}
                                                        {editMode && !hasOverride && (
                                                            <div style={{ fontSize:'.6rem', color:'#94a3b8', marginTop:'1px' }}>✏ edit</div>
                                                        )}
                                                    </td>
                                                );
                                            })()}

                                            {/* Month cells */}
                                            {allMonths.map(month => (
                                                <td key={month} style={{ ...TD, background: month===currentMonthLabel ? (idx%2===0?'#f0f9ff':'#e8f4fd') : undefined }}>
                                                    {renderMonthCell(student, month)}
                                                </td>
                                            ))}

                                            {/* Total */}
                                            <td style={{ ...TD, position:'sticky', right:'144px', background: idx%2===0?'#f8fafc':'#f1f5f9', zIndex:5, textAlign:'right', fontWeight:800, fontSize:'.82rem', color:'#1e293b', borderLeft:'1px solid #e2e8f0' }}>
                                                {currencySymbol} {totals.totalPayable.toLocaleString()}
                                            </td>

                                            {/* Paid */}
                                            <td style={{ ...TD, position:'sticky', right:'72px', background: idx%2===0?'#f0fdf4':'#e8fdf0', zIndex:5, textAlign:'right', fontWeight:800, fontSize:'.82rem', color:'#16a34a' }}>
                                                {currencySymbol} {totals.totalPaid.toLocaleString()}
                                            </td>

                                            {/* Pending */}
                                            <td style={{ ...TD, position:'sticky', right:0, background: totals.pending > 0 ? (idx%2===0?'#fef2f2':'#fde8e8') : (idx%2===0?'#f0fdf4':'#e8fdf0'), zIndex:5, textAlign:'right', fontWeight:800, fontSize:'.82rem', color: totals.pending > 0 ? '#dc2626' : '#16a34a' }}>
                                                {currencySymbol} {totals.pending.toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {/* Footer summary */}
                    {visibleStudents.length > 0 && (
                        <div style={{ padding:'.65rem 1rem', borderTop:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', gap:'1.5rem', fontSize:'.8rem', fontWeight:700, color:'#64748b', flexWrap:'wrap' }}>
                            <span>📊 {visibleStudents.length} students shown</span>
                            <span style={{ color:'#16a34a' }}>✓ Paid: {stats.paid}</span>
                            <span style={{ color:'#dc2626' }}>✗ Unpaid/Partial: {stats.unpaid}</span>
                            {stats.defaulters > 0 && <span style={{ color:'#b45309' }}>⚠ Defaulters: {stats.defaulters}</span>}
                            {editMode && <span style={{ color:'#2563eb', marginLeft:'auto' }}>✏️ Edit Mode — click any month cell to update</span>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeeTab;
