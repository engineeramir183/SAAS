import React, { useState } from 'react';
import { PlusCircle, Trash2, X, Printer, Save, MessageCircle, Settings } from 'lucide-react';
import { sendWhatsAppMessage, WhatsAppTemplates } from '../../services/WhatsAppService';


const calculateArrears = (student, currentMonth, defaults) => {
    if (!student.feeHistory) return 0;
    const currentIdx = student.feeHistory.findIndex(h => h.month === currentMonth);
    // If not found or it's the first record, we could consider all records if currentMonth is newer?
    // Let's assume feeHistory is chronological or we can just sort by month.
    // For safety, let's just sum all records where month < currentMonth (alphabetically sortable if format is YYYY-MM, but here it's "May 2026", so maybe use index if it's there).
    // Actually, "openNewFeeMonth" pushes to the end. So index works.
    
    // We will just find all records that appear BEFORE currentMonth in the array
    let arrears = 0;
    for (let i = 0; i < student.feeHistory.length; i++) {
        const h = student.feeHistory[i];
        if (h.month === currentMonth) break; // Stop at current month
        
        const t = h.tuitionFee ?? defaults.tuitionFee ?? 1000;
        const a = h.admissionFee ?? defaults.admissionFee ?? 0;
        const an = h.annualFee ?? defaults.annualFee ?? 0;
        const ex = h.examFee ?? defaults.examFee ?? 0;
        const tr = h.transportFee ?? defaults.transportFee ?? 0;
        const la = h.labFee ?? defaults.labFee ?? 0;
        const late = h.lateFine ?? 0;
        const disc = h.discount ?? 0;
        const net = Number(t) + Number(a) + Number(an) + Number(ex) + Number(tr) + Number(la) + Number(late) - Number(disc);
        const paid = Number(h.paidAmount ?? (h.status === 'paid' ? net : 0));
        arrears += (net - paid);
    }
    return arrears > 0 ? arrears : 0;
};

const FeeModal = ({ student, record, onClose, updateStudentFeeRecord, classDefaults, currencySymbol = 'RS', schoolName = 'School' }) => {
    const [formData, setFormData] = useState({
        tuitionFee: record.tuitionFee ?? classDefaults.tuitionFee ?? 1000,
        admissionFee: record.admissionFee ?? classDefaults.admissionFee ?? 0,
        annualFee: record.annualFee ?? classDefaults.annualFee ?? 0,
        examFee: record.examFee ?? classDefaults.examFee ?? 0,
        transportFee: record.transportFee ?? classDefaults.transportFee ?? 0,
        labFee: record.labFee ?? classDefaults.labFee ?? 0,
        lateFine: record.lateFine ?? 0,
        discount: record.discount ?? 0,
        paidAmount: record.paidAmount || (record.status === 'paid' ? 1000 : 0),
        status: record.status || 'unpaid',
        paymentDate: record.paymentDate || new Date().toISOString().split('T')[0],
        paymentMethod: record.paymentMethod || 'Cash',
        isOnline: record.isOnline || false
    });

    const baseTotal = ['tuitionFee', 'admissionFee', 'annualFee', 'examFee', 'transportFee', 'labFee'].reduce((sum, key) => sum + Number(formData[key]), 0);
    const previousArrears = calculateArrears(student, record.month, classDefaults);
    const netPayable = baseTotal + Number(formData.lateFine) - Number(formData.discount) + previousArrears;
    const balance = netPayable - Number(formData.paidAmount);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSave = () => {
        let finalStatus = formData.status;
        if (Number(formData.paidAmount) >= netPayable && netPayable > 0) finalStatus = 'paid';
        else if (Number(formData.paidAmount) > 0 && Number(formData.paidAmount) < netPayable) finalStatus = 'partial';
        else if (Number(formData.paidAmount) === 0 && netPayable > 0) finalStatus = 'unpaid';

        updateStudentFeeRecord(student.id, record.month, {
            ...formData,
            status: finalStatus,
            paidOn: finalStatus !== 'unpaid' ? new Date().toLocaleDateString() : null
        });
        onClose();
    };

    const handlePrintReceipt = () => {
        const html = `<!DOCTYPE html><html><head><title>Fee Receipt - ${student.name}</title><style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            * { box-sizing: border-box; }
            body { font-family: 'Inter', sans-serif; padding: 20mm; color: #0f172a; background: #f8fafc; margin: 0; }
            
            .receipt { 
                background: white; 
                border: 1px solid #cbd5e1; 
                border-radius: 8px; 
                padding: 24px; 
                max-width: 420px; 
                margin: 0 auto; 
                box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05); 
                position: relative; 
            }
            
            .receipt-header {
                text-align: center;
                border-bottom: 2px solid #0f172a;
                padding-bottom: 12px;
                margin-bottom: 16px;
            }
            
            .school-logo {
                width: 50px;
                height: 50px;
                object-fit: contain;
                margin-bottom: 6px;
            }
            
            .school-name {
                margin: 0;
                font-size: 18px;
                font-weight: 800;
                color: #0f172a;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .receipt-badge {
                display: inline-block;
                border: 1.5px solid #0f172a;
                color: #0f172a;
                font-size: 9.5px;
                font-weight: 800;
                padding: 4px 12px;
                border-radius: 4px;
                text-transform: uppercase;
                margin-top: 6px;
                letter-spacing: 1px;
            }
            
            .receipt-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 6px 0;
                font-size: 11.5px;
                font-weight: 600;
                border-bottom: 1px solid #f1f5f9;
            }
            .receipt-row:last-child {
                border-bottom: none;
            }
            
            .label {
                color: #64748b;
                font-size: 9.5px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.3px;
            }
            
            .value {
                color: #0f172a;
                font-weight: 700;
            }
            
            .status-badge {
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 9px;
                font-weight: 800;
                text-transform: uppercase;
                border: 1px solid;
            }
            
            .total-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 12px;
                background: #f8fafc;
                border: 1.5px solid #0f172a;
                border-radius: 6px;
                font-weight: 800;
                font-size: 12.5px;
                margin-top: 14px;
            }
            
            .btn-print { 
                margin: 20px auto; 
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
                body { background: white; padding: 0; } 
                .receipt { box-shadow: none; border: 1px solid #cbd5e1; } 
            }
            </style></head>
            <body>
            <button class="btn-print" onclick="window.print()">Print Receipt</button>
            <div class="receipt">
            <div class="receipt-header">
                ${schoolLogo ? `<img class="school-logo" src="${schoolLogo}" onerror="this.style.display='none'" />` : ''}
                <h2 class="school-name">${schoolName}</h2>
                <span class="receipt-badge">Fee Receipt — ${record.month}</span>
            </div>
            
            <div class="receipt-row"><span class="label">Student Name</span> <span class="value">${student.name}</span></div>
            <div class="receipt-row"><span class="label">Student ID</span> <span class="value">${student.id}</span></div>
            <div class="receipt-row"><span class="label">Status</span> 
                <span class="status-badge" style="
                    background: ${formData.status === 'paid' ? '#f0fdf4' : (formData.status === 'partial' ? '#fffbeb' : '#fdf2f2')};
                    color: ${formData.status === 'paid' ? '#16a34a' : (formData.status === 'partial' ? '#b45309' : '#dc2626')};
                    border-color: ${formData.status === 'paid' ? '#bbf7d0' : (formData.status === 'partial' ? '#fef3c7' : '#fecaca')};
                ">${formData.status}</span>
            </div>
            
            <div style="height: 10px;"></div>
            <div style="font-size: 9.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Breakdown</div>
            
            ${Number(formData.tuitionFee) > 0 ? `<div class="receipt-row"><span>Tuition Fee</span> <span>${currencySymbol} ${Number(formData.tuitionFee).toLocaleString()}</span></div>` : ''}
            ${Number(formData.admissionFee) > 0 ? `<div class="receipt-row"><span>Admission Fee</span> <span>${currencySymbol} ${Number(formData.admissionFee).toLocaleString()}</span></div>` : ''}
            ${Number(formData.annualFee) > 0 ? `<div class="receipt-row"><span>Annual Charges</span> <span>${currencySymbol} ${Number(formData.annualFee).toLocaleString()}</span></div>` : ''}
            ${Number(formData.examFee) > 0 ? `<div class="receipt-row"><span>Exam Funds</span> <span>${currencySymbol} ${Number(formData.examFee).toLocaleString()}</span></div>` : ''}
            ${Number(formData.transportFee) > 0 ? `<div class="receipt-row"><span>Transport Fee</span> <span>${currencySymbol} ${Number(formData.transportFee).toLocaleString()}</span></div>` : ''}
            ${Number(formData.labFee) > 0 ? `<div class="receipt-row"><span>Lab / Other</span> <span>${currencySymbol} ${Number(formData.labFee).toLocaleString()}</span></div>` : ''}
            
            ${Number(formData.lateFine) > 0 ? `<div class="receipt-row" style="color:#dc2626;"><span>Late Fine</span> <span>+ ${currencySymbol} ${Number(formData.lateFine).toLocaleString()}</span></div>` : ''}
            ${Number(formData.discount) > 0 ? `<div class="receipt-row" style="color:#16a34a;"><span>Concession</span> <span>- ${currencySymbol} ${Number(formData.discount).toLocaleString()}</span></div>` : ''}
            
            <div class="total-row"><span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Net Payable</span> <span>${currencySymbol} ${Number(netPayable).toLocaleString()}</span></div>
            <div class="receipt-row" style="margin-top:10px;"><span class="label">Amount Paid</span> <span class="value">${currencySymbol} ${Number(formData.paidAmount).toLocaleString()}</span></div>
            <div class="receipt-row" style="color:#dc2626; font-weight:800;"><span class="label" style="color:#dc2626;">Balance Due</span> <span style="font-size:14px; font-weight:800;">${currencySymbol} ${Number(balance).toLocaleString()}</span></div>
            
            <hr style="border:0; border-top:1px dashed #cbd5e1; margin: 15px 0;" />
            <div class="receipt-row" style="font-size:10.5px;"><span class="label">Payment Method</span> <span>${formData.paymentMethod}</span></div>
            <div class="receipt-row" style="font-size:10.5px;"><span class="label">Processed Date</span> <span>${formData.paymentDate}</span></div>
            
            <div style="text-align:center; font-size:9px; margin-top:24px; color:#94a3b8; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">System Generated Receipt</div>
            </div></body></html>`;
        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }} className="animate-fade-in">
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderRadius: '16px 16px 0 0' }}>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>Fee Details — {record.month}</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{student.name} ({student.id})</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
                </div>
                
                <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '1.5rem' }}>
                    <div>
                        <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: '#475569', fontWeight: 800, marginBottom: '1rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>Fee Breakdown ({currencySymbol})</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            {['tuitionFee', 'admissionFee', 'annualFee', 'examFee', 'transportFee', 'labFee'].map(field => (
                                <div key={field}>
                                    <label className="form-label" style={{ fontSize: '0.75rem' }}>{(field.replace('Fee', '')).replace(/([A-Z])/g, ' $1').trim()} Fee</label>
                                    <input type="number" name={field} className="form-input" style={{ width: '100%', padding: '0.4rem' }} value={formData[field]} onChange={handleChange} min="0" />
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', marginTop: '1rem', fontWeight: 700 }}>
        <span>Base Total:</span><span style={{ color: '#1e3a8a' }}>{currencySymbol} {baseTotal}</span>
    </div>
    {previousArrears > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', marginTop: '0.5rem', fontWeight: 700 }}>
            <span style={{ color: '#dc2626' }}>Previous Arrears:</span><span style={{ color: '#dc2626' }}>+ {currencySymbol} {previousArrears}</span>
        </div>
    )}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
                            <div>
                                <label className="form-label" style={{ fontSize: '0.75rem', color: '#dc2626' }}>Late Fine (+)</label>
                                <input type="number" name="lateFine" className="form-input" style={{ width: '100%', padding: '0.4rem', borderColor: '#fca5a5' }} value={formData.lateFine} onChange={handleChange} min="0" />
                            </div>
                            <div>
                                <label className="form-label" style={{ fontSize: '0.75rem', color: '#16a34a' }}>Discount (-)</label>
                                <input type="number" name="discount" className="form-input" style={{ width: '100%', padding: '0.4rem', borderColor: '#86efac' }} value={formData.discount} onChange={handleChange} min="0" />
                            </div>
                        </div>
                    </div>

                    <div style={{ background: '#f0f9ff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                        <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: '#0369a1', fontWeight: 800, marginBottom: '1rem' }}>Payment Status</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '2px dashed #bae6fd' }}>
                            <span>Net Payable:</span><span>{currencySymbol} {netPayable}</span>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label className="form-label" style={{ fontWeight: 700 }}>Amount Paid ({currencySymbol})</label>
                            <input type="number" name="paidAmount" className="form-input" style={{ width: '100%', fontSize: '1.1rem', fontWeight: 700 }} value={formData.paidAmount} onChange={handleChange} min="0" />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 700, color: balance > 0 ? '#dc2626' : '#16a34a', marginBottom: '1.5rem' }}>
                            <span>Balance Due:</span><span>{currencySymbol} {balance}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div>
                                <label className="form-label">Payment Date</label>
                                <input type="date" name="paymentDate" className="form-input" style={{ width: '100%' }} value={formData.paymentDate} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="form-label">Method</label>
                                <select name="paymentMethod" className="form-input" style={{ width: '100%' }} value={formData.paymentMethod} onChange={handleChange}>
                                    <option value="Cash">Cash</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="EasyPaisa">EasyPaisa</option>
                                    <option value="JazzCash">JazzCash</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="Online Portal">Online Portal</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, color: '#0369a1' }}>
                                <input type="checkbox" checked={formData.isOnline} onChange={e => setFormData({...formData, isOnline: e.target.checked})} />
                                Mark as Online Payment
                            </label>
                        </div>
                        <div>
                            <label className="form-label">Manual Status Override</label>
                            <select name="status" className="form-input" style={{ width: '100%', fontWeight: 700, color: formData.status === 'paid' ? '#16a34a' : (formData.status === 'partial' ? '#b45309' : '#dc2626') }} value={formData.status} onChange={handleChange}>
                                <option value="paid">✅ Fully Paid</option>
                                <option value="partial">⚠ Partially Paid</option>
                                <option value="unpaid">❌ Unpaid / Defaulter</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderRadius: '0 0 16px 16px', display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={handlePrintReceipt} className="btn" style={{ background: 'white', border: '2px solid #e2e8f0', color: '#475569', display: 'flex', gap: '0.4rem', alignItems: 'center', fontWeight: 700 }}>
                            <Printer size={16} /> Print
                        </button>
                        <button 
                            onClick={() => {
                                const msg = `Fee Reminder for ${student.name} (${record.month}):\n\nTotal Due: ${currencySymbol} ${netPayable}\nPaid: ${currencySymbol} ${formData.paidAmount}\nBalance: ${currencySymbol} ${balance}\n\nPay via:\n${schoolSettings?.bank_account ? `- Bank: ${schoolSettings.bank_account} (${schoolSettings.bank_name})\n` : ''}${schoolSettings?.easypaisa_number ? `- EasyPaisa: ${schoolSettings.easypaisa_number}\n` : ''}${schoolSettings?.jazzcash_number ? `- JazzCash: ${schoolSettings.jazzcash_number}\n` : ''}\nThank you, ${schoolName}`;
                                navigator.clipboard.writeText(msg);
                                alert('Payment information copied to clipboard! You can now paste and send it to the parent.');
                            }}
                            className="btn" 
                            style={{ background: '#f0f9ff', border: '2px solid #bae6fd', color: '#0369a1', display: 'flex', gap: '0.4rem', alignItems: 'center', fontWeight: 700 }}
                        >
                            <MessageCircle size={16} /> Share Link
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={onClose} className="btn" style={{ background: 'white', border: '1px solid #e2e8f0', color: '#64748b' }}>Cancel</button>
                        <button onClick={handleSave} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Save size={16} /> Save Record</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FeeTab = ({
    students, selectedClass, setSelectedClass, sectionClasses,
    openNewFeeMonth, toggleMonthFeeStatus, markAllPaidForMonth,
    markAllUnpaidForMonth, deleteFeeMonth, updateStudentFeeRecord,
    CLASS_FEE_DEFAULTS, updateClassFeeDefaults,
    currencySymbol = 'RS', schoolName = 'School', schoolLogo = '/logo.png',
    schoolSettings = {}
}) => {
    const [genderTab, setGenderTab] = useState('all');
    const [selectedFee, setSelectedFee] = useState(null);
    const [showDefaultsModal, setShowDefaultsModal] = useState(false);

    const classDefaults = (CLASS_FEE_DEFAULTS && CLASS_FEE_DEFAULTS[selectedClass]) || {
        tuitionFee: 1000, admissionFee: 0, annualFee: 0, examFee: 0, transportFee: 0, labFee: 0
    };
    const [defaultsForm, setDefaultsForm] = useState(classDefaults);

    const handleSaveDefaults = async () => {
        const newMap = { ...(CLASS_FEE_DEFAULTS || {}), [selectedClass]: defaultsForm };
        await updateClassFeeDefaults(newMap);
        setShowDefaultsModal(false);
    };

    const generateReceiptHTML = (student, h, localDefaults) => {
        const previousArrears = calculateArrears(student, h.month, localDefaults);
        const tuition = h.tuitionFee ?? localDefaults.tuitionFee ?? 1000;
        const admission = h.admissionFee ?? localDefaults.admissionFee ?? 0;
        const annual = h.annualFee ?? localDefaults.annualFee ?? 0;
        const exam = h.examFee ?? localDefaults.examFee ?? 0;
        const transport = h.transportFee ?? localDefaults.transportFee ?? 0;
        const lab = h.labFee ?? localDefaults.labFee ?? 0;
        const late = h.lateFine ?? 0;
        const discount = h.discount ?? 0;
        const paidAmount = h.paidAmount ?? (h.status === 'paid' ? (tuition + admission + annual + exam + transport + lab + late - discount) : 0);
        
        const netPayable = (tuition + admission + annual + exam + transport + lab) + late - discount + previousArrears;
        const balance = netPayable - paidAmount;
        const status = h.status || 'unpaid';

        return `<div class="receipt">
            <div class="receipt-header">
                ${schoolLogo ? `<img class="school-logo" src="${schoolLogo}" onerror="this.style.display='none'" />` : ''}
                <h2 class="school-name">${schoolName}</h2>
                <span class="receipt-badge">Fee Receipt — ${h.month}</span>
            </div>
            
            <div class="receipt-row"><span class="label">Student Name</span> <span class="value">${student.name}</span></div>
            <div class="receipt-row"><span class="label">Student ID</span> <span class="value">${student.id}</span></div>
            <div class="receipt-row"><span class="label">Status</span> 
                <span class="status-badge" style="
                    background: ${status === 'paid' ? '#f0fdf4' : (status === 'partial' ? '#fffbeb' : '#fdf2f2')};
                    color: ${status === 'paid' ? '#16a34a' : (status === 'partial' ? '#b45309' : '#dc2626')};
                    border-color: ${status === 'paid' ? '#bbf7d0' : (status === 'partial' ? '#fef3c7' : '#fecaca')};
                ">${status.toUpperCase()}</span>
            </div>
            
            <div style="height: 10px;"></div>
            <div style="font-size: 9.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Breakdown</div>
            
            ${Number(tuition) > 0 ? `<div class="receipt-row"><span>Tuition Fee</span> <span>${currencySymbol} ${Number(tuition).toLocaleString()}</span></div>` : ''}
            ${Number(admission) > 0 ? `<div class="receipt-row"><span>Admission Fee</span> <span>${currencySymbol} ${Number(admission).toLocaleString()}</span></div>` : ''}
            ${Number(annual) > 0 ? `<div class="receipt-row"><span>Annual Charges</span> <span>${currencySymbol} ${Number(annual).toLocaleString()}</span></div>` : ''}
            ${Number(exam) > 0 ? `<div class="receipt-row"><span>Exam Funds</span> <span>${currencySymbol} ${Number(exam).toLocaleString()}</span></div>` : ''}
            ${Number(transport) > 0 ? `<div class="receipt-row"><span>Transport Fee</span> <span>${currencySymbol} ${Number(transport).toLocaleString()}</span></div>` : ''}
            ${Number(lab) > 0 ? `<div class="receipt-row"><span>Lab / Other</span> <span>${currencySymbol} ${Number(lab).toLocaleString()}</span></div>` : ''}
            
            ${Number(late) > 0 ? `<div class="receipt-row" style="color:#dc2626;"><span>Late Fine</span> <span>+ ${currencySymbol} ${Number(late).toLocaleString()}</span></div>` : ''}
            ${Number(discount) > 0 ? `<div class="receipt-row" style="color:#16a34a;"><span>Concession</span> <span>- ${currencySymbol} ${Number(discount).toLocaleString()}</span></div>` : ''}
            ${Number(previousArrears) > 0 ? `<div class="receipt-row" style="color:#dc2626; font-weight:700;"><span>Previous Arrears</span> <span>+ ${currencySymbol} ${Number(previousArrears).toLocaleString()}</span></div>` : ''}
            
            <div class="total-row"><span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Net Payable</span> <span>${currencySymbol} ${Number(netPayable).toLocaleString()}</span></div>
            <div class="receipt-row" style="margin-top:10px;"><span class="label">Amount Paid</span> <span class="value">${currencySymbol} ${Number(paidAmount).toLocaleString()}</span></div>
            <div class="receipt-row" style="color:#dc2626; font-weight:800;"><span class="label" style="color:#dc2626;">Balance Due</span> <span style="font-size:14px; font-weight:800;">${currencySymbol} ${Number(balance).toLocaleString()}</span></div>
            
            <hr style="border:0; border-top:1px dashed #cbd5e1; margin: 15px 0;" />
            <div class="receipt-row" style="font-size:10.5px;"><span class="label">Payment Method</span> <span>${h.paymentMethod || 'Cash'}</span></div>
            <div class="receipt-row" style="font-size:10.5px;"><span class="label">Processed Date</span> <span>${h.paymentDate || '—'}</span></div>
            
            <div class="receipt-footer">
                ${schoolSettings?.bank_account ? `<div style="margin-bottom:2px;">Bank: ${schoolSettings.bank_name} / ${schoolSettings.bank_account}</div>` : ''}
                ${schoolSettings?.easypaisa_number ? `<div style="margin-bottom:2px;">EasyPaisa: ${schoolSettings.easypaisa_number}</div>` : ''}
                ${schoolSettings?.jazzcash_number ? `<div style="margin-bottom:2px;">JazzCash: ${schoolSettings.jazzcash_number}</div>` : ''}
                ${schoolSettings?.payment_instructions ? `<div style="font-style:italic; margin-top:4px; font-size:8px; color:#64748b;">* ${schoolSettings.payment_instructions}</div>` : ''}
                <div style="text-align:center; font-size:9px; margin-top:14px; color:#94a3b8; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">System Generated Receipt</div>
            </div>
        </div>`;
    };

    const printBulkChallans = (month) => {
        let printHTML = `<!DOCTYPE html><html><head><title>Bulk Invoices - ${selectedClass} - ${month}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                * { box-sizing: border-box; }
                body { font-family: 'Inter', sans-serif; padding: 10mm; color: #0f172a; background: #f8fafc; margin: 0; }
                
                .grid { 
                    display: grid; 
                    grid-template-columns: 1fr 1fr; 
                    gap: 20px; 
                    padding: 0; 
                }
                
                .receipt { 
                    background: white; 
                    border: 1px solid #cbd5e1; 
                    border-radius: 8px; 
                    padding: 20px; 
                    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05); 
                    position: relative; 
                    page-break-inside: avoid;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
                
                .receipt-header {
                    text-align: center;
                    border-bottom: 2px solid #0f172a;
                    padding-bottom: 10px;
                    margin-bottom: 12px;
                }
                
                .school-logo {
                    width: 40px;
                    height: 40px;
                    object-fit: contain;
                    margin-bottom: 4px;
                }
                
                .school-name {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 800;
                    color: #0f172a;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .receipt-badge {
                    display: inline-block;
                    border: 1.5px solid #0f172a;
                    color: #0f172a;
                    font-size: 9px;
                    font-weight: 800;
                    padding: 3px 10px;
                    border-radius: 4px;
                    text-transform: uppercase;
                    margin-top: 4px;
                    letter-spacing: 1px;
                }
                
                .receipt-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 5px 0;
                    font-size: 11px;
                    font-weight: 600;
                    border-bottom: 1px solid #f1f5f9;
                }
                .receipt-row:last-child {
                    border-bottom: none;
                }
                
                .label {
                    color: #64748b;
                    font-size: 9px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }
                
                .value {
                    color: #0f172a;
                    font-weight: 700;
                }
                
                .status-badge {
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 8px;
                    font-weight: 800;
                    text-transform: uppercase;
                    border: 1px solid;
                }
                
                .total-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 10px;
                    background: #f8fafc;
                    border: 1.5px solid #0f172a;
                    border-radius: 6px;
                    font-weight: 800;
                    font-size: 12px;
                    margin-top: 10px;
                }
                
                .receipt-footer {
                    background: #f8fafc; 
                    padding: 8px; 
                    border-radius: 6px; 
                    font-size: 10px;
                    margin-top: 10px;
                    border: 1px solid #e2e8f0;
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
                    body { background: white; padding: 0; } 
                    .receipt { box-shadow: none; border: 1px solid #cbd5e1; } 
                }
            </style></head>
            <body><button class="btn-print" onclick="window.print()">Print All Invoices</button>
            <div class="grid">`;
        
        classStudents.forEach(student => {
            const h = (student.feeHistory || []).find(hf => hf.month === month) || { month, status: 'unpaid' };
            printHTML += generateReceiptHTML(student, h, classDefaults);
        });
        
        printHTML += `</div></body></html>`;
        const win = window.open('', '_blank');
        win.document.write(printHTML);
        win.document.close();
    };

    
    const printClassFeeReport = (month) => {
        let printHTML = `<!DOCTYPE html><html><head><title>Class Fee Summary - ${selectedClass} - ${month}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                * { box-sizing: border-box; }
                body { font-family: 'Inter', sans-serif; padding: 30px; color: #0f172a; background: white; margin: 0; }
                
                .report-header {
                    text-align: center;
                    border-bottom: 2px solid #0f172a;
                    padding-bottom: 16px;
                    margin-bottom: 24px;
                }
                .school-name {
                    margin: 0;
                    font-size: 24px;
                    font-weight: 800;
                    color: #0f172a;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .report-title {
                    font-size: 14px;
                    color: #475569;
                    font-weight: 700;
                    text-transform: uppercase;
                    margin-top: 6px;
                    letter-spacing: 1px;
                }
                
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-top: 20px; 
                    border: 1px solid #cbd5e1;
                }
                th { 
                    background: #0f172a; 
                    color: white;
                    padding: 12px 14px; 
                    text-align: left; 
                    border: 1px solid #cbd5e1; 
                    font-weight: 700; 
                    font-size: 11px; 
                    text-transform: uppercase; 
                    letter-spacing: 0.5px;
                }
                td { 
                    padding: 10px 14px; 
                    border: 1px solid #cbd5e1; 
                    font-size: 12.5px; 
                    color: #334155;
                }
                tr:nth-child(even) td {
                    background: #f8fafc;
                }
                
                .summary-container { 
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                    margin-top: 30px; 
                    border: 1.5px solid #0f172a; 
                    background: #f8fafc;
                    padding: 16px; 
                    border-radius: 6px;
                }
                .summary-card {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .summary-lbl {
                    font-size: 9.5px;
                    font-weight: 800;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .summary-val {
                    font-size: 18px;
                    font-weight: 800;
                    color: #0f172a;
                }
                
                .btn-print { 
                    margin-bottom: 20px; 
                    padding: 10px 22px; 
                    background: #0f172a; 
                    color: white; 
                    border: none; 
                    border-radius: 6px; 
                    font-weight: 700; 
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(15,23,42,0.15);
                    transition: background 0.15s ease;
                }
                .btn-print:hover {
                    background: #1e293b;
                }
                
                @media print { 
                    .btn-print { display: none; } 
                    body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } 
                }
            </style></head>
            <body><button class="btn-print" onclick="window.print()">Print Report</button>
            <div class="report-header">
                <h1 class="school-name">${schoolName}</h1>
                <div class="report-title">Monthly Fee Report — Class ${selectedClass} (${month})</div>
            </div>
            <table>
                <thead><tr><th>Student</th><th>Current Fee</th><th>Arrears</th><th>Total Due</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead>
                <tbody>`;
        
        let grandTotal = 0, grandPaid = 0, grandBalance = 0;

        classStudents.forEach((student) => {
            const h = (student.feeHistory || []).find(hf => hf.month === month) || { month, status: 'unpaid' };
            const previousArrears = calculateArrears(student, month, classDefaults);
            
            const t = h.tuitionFee ?? classDefaults.tuitionFee ?? 1000;
            const a = h.admissionFee ?? classDefaults.admissionFee ?? 0;
            const an = h.annualFee ?? classDefaults.annualFee ?? 0;
            const ex = h.examFee ?? classDefaults.examFee ?? 0;
            const tr = h.transportFee ?? classDefaults.transportFee ?? 0;
            const la = h.labFee ?? classDefaults.labFee ?? 0;
            const late = h.lateFine ?? 0;
            const disc = h.discount ?? 0;
            
            const currentFee = (t + a + an + ex + tr + la) + late - disc;
            const totalDue = currentFee + previousArrears;
            const paid = Number(h.paidAmount ?? (h.status === 'paid' ? totalDue : 0));
            const balance = totalDue - paid;
            
            grandTotal += totalDue;
            grandPaid += paid;
            grandBalance += balance;

            printHTML += `<tr>
                <td><strong>${student.name}</strong><br><span style="color:#64748b; font-size:10px; font-weight: 600;">ID: ${student.id}</span></td>
                <td>${currencySymbol} ${Number(currentFee).toLocaleString()}</td>
                <td style="color:${previousArrears > 0 ? '#dc2626' : 'inherit'}; font-weight:${previousArrears > 0 ? '700' : 'normal'};">${currencySymbol} ${Number(previousArrears).toLocaleString()}</td>
                <td style="font-weight:700">${currencySymbol} ${Number(totalDue).toLocaleString()}</td>
                <td style="color:#16a34a; font-weight:700;">${currencySymbol} ${Number(paid).toLocaleString()}</td>
                <td style="color:${balance > 0 ? '#dc2626' : '#16a34a'}; font-weight:700;">${currencySymbol} ${Number(balance).toLocaleString()}</td>
                <td><span style="
                    font-size: 9px;
                    font-weight: 800;
                    text-transform: uppercase;
                    padding: 2px 6px;
                    border-radius: 4px;
                    border: 1px solid;
                    background: ${h.status === 'paid' ? '#f0fdf4' : (h.status === 'partial' ? '#fffbeb' : '#fdf2f2')};
                    color: ${h.status === 'paid' ? '#16a34a' : (h.status === 'partial' ? '#b45309' : '#dc2626')};
                    border-color: ${h.status === 'paid' ? '#bbf7d0' : (h.status === 'partial' ? '#fef3c7' : '#fecaca')};
                ">${(h.status || 'unpaid').toUpperCase()}</span></td>
            </tr>`;
        });
        
        printHTML += `</tbody></table>
            <div class="summary-container">
                <div class="summary-card">
                    <span class="summary-lbl">Total Expected</span>
                    <span class="summary-val">${currencySymbol} ${Number(grandTotal).toLocaleString()}</span>
                </div>
                <div class="summary-card">
                    <span class="summary-lbl" style="color: #16a34a;">Total Collected</span>
                    <span class="summary-val" style="color: #16a34a;">${currencySymbol} ${Number(grandPaid).toLocaleString()}</span>
                </div>
                <div class="summary-card">
                    <span class="summary-lbl" style="color: #dc2626;">Total Outstanding</span>
                    <span class="summary-val" style="color: #dc2626;">${currencySymbol} ${Number(grandBalance).toLocaleString()}</span>
                </div>
            </div>
            <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; font-weight: 600;">
                <span>Generated Date: ${new Date().toLocaleDateString()}</span>
                <span>System Registrar Signature: _______________________</span>
            </div>
            </body></html>`;
        
        const win = window.open('', '_blank');
        win.document.write(printHTML);
        win.document.close();
    };

    const printDefaultersList = () => {
        const defaulters = classStudents.filter(s => (s.feeHistory || []).some(h => h.status === 'unpaid' || h.status === 'partial'));
        if (defaulters.length === 0) {
            alert("Great news! There are no defaulters in this class.");
            return;
        }

        let printHTML = `<!DOCTYPE html><html><head><title>Defaulters List - ${selectedClass}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                * { box-sizing: border-box; }
                body { font-family: 'Inter', sans-serif; padding: 30px; color: #0f172a; background: white; margin: 0; }
                
                .report-header {
                    text-align: center;
                    border-bottom: 2px solid #dc2626;
                    padding-bottom: 16px;
                    margin-bottom: 24px;
                }
                .school-name {
                    margin: 0;
                    font-size: 24px;
                    font-weight: 800;
                    color: #0f172a;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .report-title {
                    font-size: 14px;
                    color: #dc2626;
                    font-weight: 700;
                    text-transform: uppercase;
                    margin-top: 6px;
                    letter-spacing: 1px;
                }
                
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-top: 20px; 
                    border: 1px solid #cbd5e1;
                }
                th { 
                    background: #dc2626; 
                    color: white;
                    padding: 12px 14px; 
                    text-align: left; 
                    border: 1px solid #cbd5e1; 
                    font-weight: 700; 
                    font-size: 11px; 
                    text-transform: uppercase; 
                    letter-spacing: 0.5px;
                }
                td { 
                    padding: 10px 14px; 
                    border: 1px solid #cbd5e1; 
                    font-size: 12.5px; 
                    color: #334155;
                }
                tr:nth-child(even) td {
                    background: #fdf2f2;
                }
                
                .btn-print { 
                    margin-bottom: 20px; 
                    padding: 10px 22px; 
                    background: #dc2626; 
                    color: white; 
                    border: none; 
                    border-radius: 6px; 
                    font-weight: 700; 
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(220,38,38,0.15);
                    transition: background 0.15s ease;
                }
                .btn-print:hover {
                    background: #b91c1c;
                }
                
                @media print { 
                    .btn-print { display: none; } 
                    body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } 
                }
            </style></head>
            <body><button class="btn-print" onclick="window.print()">Print Defaulters List</button>
            <div class="report-header">
                <h1 class="school-name">${schoolName}</h1>
                <div class="report-title">Fee Defaulters List — Class ${selectedClass}</div>
            </div>
            <table>
                <thead><tr><th style="width: 50px;">#</th><th>Student Details</th><th>Father's Details</th><th>Phone Number</th><th>Defaulter Months</th></tr></thead>
                <tbody>`;
        
        defaulters.forEach((student, index) => {
            const unpaidMonths = (student.feeHistory || []).filter(h => h.status === 'unpaid' || h.status === 'partial').map(h => h.month.toUpperCase()).join(', ');
            const fatherName = student.admissions?.[0]?.fatherName || '—';
            const phone = student.admissions?.[0]?.fatherContact || student.admissions?.[0]?.contact || '—';
            printHTML += `<tr>
                <td>${index + 1}</td>
                <td><strong>${student.name}</strong><br><span style="color:#64748b; font-size:10px; font-weight: 600;">ID: ${student.id}</span></td>
                <td><strong>${fatherName}</strong></td>
                <td><strong>${phone}</strong></td>
                <td style="color:#dc2626; font-weight:700;">${unpaidMonths}</td>
            </tr>`;
        });
        
        printHTML += `</tbody></table>
            <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; font-weight: 600;">
                <span>Total Defaulters: <strong>${defaulters.length}</strong></span>
                <span>Generated Date: ${new Date().toLocaleDateString()}</span>
            </div>
            </body></html>`;
        
        const win = window.open('', '_blank');
        win.document.write(printHTML);
        win.document.close();
    };

    const allClassStudents = students
        .filter(s => s.grade === selectedClass)
        .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

    const classStudents = allClassStudents.filter(s => {
        if (genderTab === 'boys') return s.admissions?.[0]?.gender === 'Male';
        if (genderTab === 'girls') return s.admissions?.[0]?.gender === 'Female';
        return true;
    });

    const boysCount = allClassStudents.filter(s => s.admissions?.[0]?.gender === 'Male').length;
    const girlsCount = allClassStudents.filter(s => s.admissions?.[0]?.gender === 'Female').length;

    const allMonths = [...new Set(allClassStudents.flatMap(s => (s.feeHistory || []).map(h => h.month)))];
    const totalEntries = classStudents.reduce((sum, s) => sum + (s.feeHistory || []).length, 0);
    const totalPaid = classStudents.reduce((sum, s) => sum + (s.feeHistory || []).filter(h => h.status === 'paid').length, 0);
    const totalUnpaid = totalEntries - totalPaid;
    const studentsWithDues = classStudents.filter(s => (s.feeHistory || []).some(h => h.status === 'unpaid')).length;

    const genderTabs = [
        { id: 'boys', label: '👦 Boys', count: boysCount, color: '#0369a1', bg: '#e0f2fe' },
        { id: 'girls', label: '👧 Girls', count: girlsCount, color: '#be185d', bg: '#fce7f3' },
        { id: 'all', label: '👥 All Students', count: allClassStudents.length, color: '#475569', bg: '#f1f5f9' },
    ];

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1e293b' }}>💰 Fee Management</h2>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>Track monthly fee payments for each student</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select className="form-input" style={{ padding: '0.5rem 0.8rem', minWidth: '160px' }} value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setGenderTab('all'); }}>
                        {sectionClasses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button onClick={() => { setDefaultsForm(classDefaults); setShowDefaultsModal(true); }} className="btn" style={{ gap: '0.4rem', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569' }}>
                        <Settings size={16} /> Defaults
                    </button>
                    <button onClick={openNewFeeMonth} className="btn btn-primary" style={{ gap: '0.4rem', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
                        <PlusCircle size={16} /> Open New Month
                    </button>
                </div>
            </div>

            {/* Gender Tabs */}
            <div style={{ display: 'flex', marginBottom: '1.5rem', borderRadius: '12px 12px 0 0', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                {genderTabs.map(tab => (
                    <button key={tab.id} onClick={() => setGenderTab(tab.id)} style={{
                        flex: 1, padding: '0.85rem 1rem', fontWeight: genderTab === tab.id ? 800 : 600, fontSize: '0.95rem',
                        color: genderTab === tab.id ? tab.color : '#94a3b8',
                        background: genderTab === tab.id ? tab.bg : 'transparent', border: 'none',
                        borderBottom: genderTab === tab.id ? `3px solid ${tab.color}` : '3px solid transparent',
                        cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                    }}>
                        {tab.label}
                        <span style={{ background: genderTab === tab.id ? tab.color : '#cbd5e1', color: 'white', borderRadius: '999px', padding: '0.15rem 0.6rem', fontSize: '0.75rem', fontWeight: 700 }}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                    { label: 'Shown Students', val: classStudents.length, color: '#2563eb', bg: '#eff6ff' },
                    { label: 'Months Tracked', val: allMonths.length, color: '#7c3aed', bg: '#f5f3ff' },
                    { label: 'Paid Entries', val: totalPaid, color: '#16a34a', bg: '#f0fdf4' },
                    { label: 'Unpaid Entries', val: totalUnpaid, color: '#dc2626', bg: '#fef2f2' },
                ].map(stat => (
                    <div key={stat.label} style={{ background: stat.bg, border: `1px solid ${stat.color}22`, borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: stat.color }}>{stat.val}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginTop: '0.2rem' }}>{stat.label}</div>
                    </div>
                ))}
                
                {/* Defaulter action box */}
                <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '12px', padding: '1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#b45309' }}>{studentsWithDues}</div>
                    <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600, marginTop: '0.2rem', marginBottom: '0.5rem' }}>Students with Dues</div>
                    <button onClick={printDefaultersList} className="btn" style={{ padding: '0.3rem', fontSize: '0.75rem', fontWeight: 700, background: '#ef4444', color: 'white', border: 'none', margin: '0 auto', width: '90%' }}>Print Report</button>
                </div>
            </div>

            {allMonths.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
                    <h3 style={{ color: '#1e293b', marginBottom: '0.5rem' }}>No Fee Months Opened Yet</h3>
                    <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Click "Open New Month" to start tracking fees for {selectedClass}.</p>
                    <button onClick={openNewFeeMonth} className="btn btn-primary">
                        <PlusCircle size={16} /> Open {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </button>
                </div>
            ) : (
                <>
                    {/* Month cards */}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                        {allMonths.map(month => {
                            const paidCount = classStudents.filter(s => (s.feeHistory || []).some(h => h.month === month && h.status === 'paid')).length;
                            const unpaidCount = classStudents.filter(s => (s.feeHistory || []).some(h => h.month === month && h.status === 'unpaid')).length;
                            const allPaid = unpaidCount === 0;
                            return (
                                <div key={month} style={{ background: allPaid ? '#f0fdf4' : '#fef2f2', border: `1px solid ${allPaid ? '#86efac' : '#fca5a5'}`, borderRadius: '12px', padding: '0.9rem 1.1rem', minWidth: '200px' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b', marginBottom: '0.5rem' }}>{month}</div>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.6rem' }}>
                                        <span style={{ background: '#dcfce7', color: '#16a34a', padding: '0.15rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>✓ {paidCount} Paid</span>
                                        <span style={{ background: '#fee2e2', color: '#dc2626', padding: '0.15rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>✗ {unpaidCount} Unpaid</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                                        <button onClick={() => printClassFeeReport(month)} style={{ flex: 1, padding: '0.3rem', fontSize: '0.7rem', fontWeight: 700, background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}><Printer size={12}/> Report</button>
                                        <button onClick={() => printBulkChallans(month)} style={{ flex: 1, padding: '0.3rem', fontSize: '0.7rem', fontWeight: 700, background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}><Printer size={12}/> Print</button>
                                        <button onClick={() => markAllPaidForMonth(month)} style={{ flex: 1, padding: '0.3rem', fontSize: '0.7rem', fontWeight: 700, background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>All Paid</button>
                                        <button onClick={() => markAllUnpaidForMonth(month)} style={{ flex: 1, padding: '0.3rem', fontSize: '0.7rem', fontWeight: 700, background: '#64748b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Reset</button>
                                        <button onClick={() => deleteFeeMonth(month)} style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={12} /></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Student table */}
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '65vh' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                                <thead>
                                    <tr style={{ background: '#0f172a', color: 'white' }}>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.85rem', position: 'sticky', top: 0, left: 0, background: '#0f172a', zIndex: 20, minWidth: '180px' }}>Student</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.85rem', position: 'sticky', top: 0, background: '#0f172a', zIndex: 10 }}>Dues</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.85rem', position: 'sticky', top: 0, background: '#0f172a', zIndex: 10 }}>Month-by-Month History (click to toggle)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {classStudents.map((student, idx) => {
                                        const history = student.feeHistory || [];
                                        const unpaidMonths = history.filter(h => h.status === 'unpaid');
                                        return (
                                            <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9', background: unpaidMonths.length > 0 ? '#fffbeb' : (idx % 2 === 0 ? 'white' : '#f8fafc') }}>
                                                <td style={{ padding: '0.85rem 1rem', position: 'sticky', left: 0, background: unpaidMonths.length > 0 ? '#fffbeb' : (idx % 2 === 0 ? 'white' : '#f8fafc'), zIndex: 1, borderRight: '1px solid #e2e8f0' }}>
                                                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>{student.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{student.id}</div>
                                                </td>
                                                <td style={{ padding: '0.85rem 1rem', minWidth: '100px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        {unpaidMonths.length > 0 ? (
                                                            <span style={{ background: '#fee2e2', color: '#dc2626', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                                ⚠ {unpaidMonths.length} Due{unpaidMonths.length > 1 ? 's' : ''}
                                                            </span>
                                                        ) : (
                                                            <span style={{ background: '#dcfce7', color: '#16a34a', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700 }}>✓ Clear</span>
                                                        )}
                                                        {unpaidMonths.length > 0 && (student.admissions?.[0]?.fatherContact || student.admissions?.[0]?.whatsapp) && (
                                                            <button onClick={() => {
                                                                const phone = student.admissions[0].whatsapp || student.admissions[0].fatherContact;
                                                                const msg = WhatsAppTemplates.feeOverdueReminder(student.name, unpaidMonths.map(m=>m.month).join(', '), schoolName);
                                                                sendWhatsAppMessage(phone, msg, schoolSettings);
                                                                alert('WhatsApp reminder sent to ' + student.name + ' parent.');
                                                            }} title="Send WhatsApp Reminder"
                                                               style={{ background: '#22c55e', color: 'white', border: 'none', padding: '0.3rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                                <MessageCircle size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.85rem 1rem' }}>
                                                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                        {history.length === 0 ? (
                                                            <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>No records yet</span>
                                                        ) : (
                                                            history.map(h => {
                                                                const isPaid = h.status === 'paid';
                                                                const isPartial = h.status === 'partial';
                                                                const isOnline = h.isOnline || h.paymentMethod === 'Online Portal';
                                                                const bg = isPaid ? '#dcfce7' : (isPartial ? '#fef3c7' : '#fee2e2');
                                                                const color = isPaid ? '#16a34a' : (isPartial ? '#d97706' : '#dc2626');
                                                                const icon = isPaid ? (isOnline ? '🌐' : '✓') : (isPartial ? '⚠' : '✗');
                                                                return (
                                                                <button key={h.month} onClick={() => setSelectedFee({ student, record: h })}
                                                                    title="Click to view & edit detailed fee record"
                                                                    style={{ padding: '0.25rem 0.7rem', borderRadius: '999px', fontSize: '0.73rem', fontWeight: 700, border: 'none', cursor: 'pointer', background: bg, color: color, transition: 'all 0.15s ease', whiteSpace: 'nowrap' }}
                                                                    onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                                                                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                                                                    {icon} {h.month}
                                                                </button>
                                                                );
                                                            })
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {classStudents.length === 0 && (
                                        <tr><td colSpan={3} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>No students found for selected filter.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Detailed Fee Modal */}
            {selectedFee && (
                <FeeModal 
                    student={selectedFee.student} 
                    record={selectedFee.record} 
                    onClose={() => setSelectedFee(null)} 
                    updateStudentFeeRecord={updateStudentFeeRecord}
                    classDefaults={classDefaults}
                    currencySymbol={currencySymbol}
                    schoolName={schoolName}
                />
            )}

            {showDefaultsModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setShowDefaultsModal(false)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '400px', p: '0' }} className="animate-fade-in card">
                        <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                            <h3 style={{ margin: 0, fontWeight: 800 }}>Fee Defaults — {selectedClass}</h3>
                            <button onClick={() => setShowDefaultsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20}/></button>
                        </div>
                        {['tuitionFee', 'admissionFee', 'annualFee', 'examFee', 'transportFee', 'labFee'].map(field => (
                            <div key={field} style={{ marginBottom: '0.75rem' }}>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>{(field.replace('Fee', '')).replace(/([A-Z])/g, ' $1').trim()} Default ({currencySymbol})</label>
                                <input type="number" className="form-input" value={defaultsForm[field]} onChange={e => setDefaultsForm({ ...defaultsForm, [field]: Number(e.target.value) })} style={{ width: '100%', padding: '0.4rem' }} />
                            </div>
                        ))}
                        <button onClick={handleSaveDefaults} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Save Defaults</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeeTab;
