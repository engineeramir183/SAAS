import React, { useState } from 'react';
import { PlusCircle, Trash2, X, Printer, Save, MessageCircle, Settings } from 'lucide-react';

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
        paymentMethod: record.paymentMethod || 'Cash'
    });

    const baseTotal = ['tuitionFee', 'admissionFee', 'annualFee', 'examFee', 'transportFee', 'labFee'].reduce((sum, key) => sum + Number(formData[key]), 0);
    const netPayable = baseTotal + Number(formData.lateFine) - Number(formData.discount);
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
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 20mm; color: #1e293b; background: #f8fafc; margin: 0; }
            .receipt { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 30px; max-width: 400px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); position: relative; }
            h2 { text-align: center; color: #1e3a8a; margin-top: 0; font-weight: 800; font-size: 20px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; font-weight: 600; }
            .total-row { display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 2px solid #e2e8f0; font-weight: 800; font-size: 16px; }
            .btn-print { margin: 20px auto; display: block; padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
            @media print { .btn-print { display: none; } body { background: white; padding: 0; } .receipt { box-shadow: none; border: none; } }
            </style></head>
            <body>
            <button class="btn-print" onclick="window.print()">🖨️ Print Receipt</button>
            <div class="receipt">
            <div style="text-align:center; margin-bottom:20px;">
                <img src="${schoolLogo}" style="width:60px;" onerror="this.style.display='none'" />
                <h2>${schoolName}</h2>
                <div style="font-size:12px; color:#64748b; font-weight:700;">Fee Receipt — ${record.month}</div>
            </div>
            <div class="row"><span style="color:#64748b;">Student Name:</span> <strong style="color:#0f172a;">${student.name}</strong></div>
            <div class="row"><span style="color:#64748b;">Student ID:</span> <strong style="color:#0f172a;">${student.id}</strong></div>
            <div class="row"><span style="color:#64748b;">Status:</span> <strong style="text-transform:uppercase; color:${formData.status === 'paid' ? '#16a34a' : (formData.status === 'partial' ? '#b45309' : '#dc2626')};">${formData.status}</strong></div>
            <hr style="border:0; border-top:1px dashed #cbd5e1; margin: 15px 0;" />
            
            ${Number(formData.tuitionFee) > 0 ? `<div class="row"><span>Tuition Fee</span> <span>${currencySymbol} ${formData.tuitionFee}</span></div>` : ''}
            ${Number(formData.admissionFee) > 0 ? `<div class="row"><span>Admission Fee</span> <span>${currencySymbol} ${formData.admissionFee}</span></div>` : ''}
            ${Number(formData.annualFee) > 0 ? `<div class="row"><span>Annual Charges</span> <span>${currencySymbol} ${formData.annualFee}</span></div>` : ''}
            ${Number(formData.examFee) > 0 ? `<div class="row"><span>Exam Funds</span> <span>${currencySymbol} ${formData.examFee}</span></div>` : ''}
            ${Number(formData.transportFee) > 0 ? `<div class="row"><span>Transport Fee</span> <span>${currencySymbol} ${formData.transportFee}</span></div>` : ''}
            ${Number(formData.labFee) > 0 ? `<div class="row"><span>Lab / Other</span> <span>${currencySymbol} ${formData.labFee}</span></div>` : ''}
            
            ${Number(formData.lateFine) > 0 ? `<div class="row" style="color:#dc2626;"><span>Late Fine</span> <span>+ ${currencySymbol} ${formData.lateFine}</span></div>` : ''}
            ${Number(formData.discount) > 0 ? `<div class="row" style="color:#16a34a;"><span>Concession</span> <span>- ${currencySymbol} ${formData.discount}</span></div>` : ''}
            
            <div class="total-row"><span>NET PAYABLE</span> <span>${currencySymbol} ${netPayable}</span></div>
            <div class="row" style="margin-top:10px;"><span>Amount Paid</span> <span>${currencySymbol} ${formData.paidAmount}</span></div>
            <div class="row" style="color:#dc2626; font-weight:800;"><span>Balance Due</span> <span style="font-size:16px;">${currencySymbol} ${balance}</span></div>
            
            <hr style="border:0; border-top:1px dashed #cbd5e1; margin: 15px 0;" />
            <div class="row" style="font-size:11px;"><span style="color:#64748b">Payment Method:</span> <span>${formData.paymentMethod}</span></div>
            <div class="row" style="font-size:11px;"><span style="color:#64748b">Processed Date:</span> <span>${formData.paymentDate}</span></div>
            <div style="text-align:center; font-size:10px; margin-top:30px; color:#94a3b8; font-weight:600;">System Generated Receipt</div>
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
                                </select>
                            </div>
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
                    <button onClick={handlePrintReceipt} className="btn" style={{ background: 'white', border: '2px solid #e2e8f0', color: '#475569', display: 'flex', gap: '0.5rem', alignItems: 'center', fontWeight: 700 }}>
                        <Printer size={16} /> Print Receipt
                    </button>
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
    currencySymbol = 'RS', schoolName = 'School', schoolLogo = '/logo.png'
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
        const tuition = h.tuitionFee ?? localDefaults.tuitionFee ?? 1000;
        const admission = h.admissionFee ?? localDefaults.admissionFee ?? 0;
        const annual = h.annualFee ?? localDefaults.annualFee ?? 0;
        const exam = h.examFee ?? localDefaults.examFee ?? 0;
        const transport = h.transportFee ?? localDefaults.transportFee ?? 0;
        const lab = h.labFee ?? localDefaults.labFee ?? 0;
        const late = h.lateFine ?? 0;
        const discount = h.discount ?? 0;
        const paidAmount = h.paidAmount ?? (h.status === 'paid' ? (tuition + admission + annual + exam + transport + lab + late - discount) : 0);
        
        const netPayable = (tuition + admission + annual + exam + transport + lab) + late - discount;
        const balance = netPayable - paidAmount;
        const status = h.status || 'unpaid';

        return `<div class="receipt" style="page-break-inside: avoid; margin-bottom: 40px; border: 1px dashed #cbd5e1; padding: 20px; border-radius: 8px;">
            <div style="text-align:center; margin-bottom:15px;">
                <img src="${schoolLogo}" style="width:50px;margin-bottom:6px;" onerror="this.style.display='none'" />
                <h2 style="margin:0; font-size:18px;">${schoolName}</h2>
                <div style="font-size:12px; color:#64748b; font-weight:700;">Fee Receipt — ${h.month}</div>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:600; margin-bottom:5px;">
                <span>Student: <strong style="color:#0f172a;">${student.name}</strong> (${student.id})</span>
                <span>Class: <strong>${student.grade}</strong></span>
            </div>
            <div style="font-size:12px; font-weight:600; margin-bottom:15px;">Status: <strong style="text-transform:uppercase; color:${status === 'paid' ? '#16a34a' : '#dc2626'};">${status}</strong></div>
            <hr style="border:0; border-top:1px dashed #cbd5e1; margin: 10px 0;" />
            <div style="font-size:12px; display:flex; justify-content:space-between; margin-bottom:4px;"><span>Tuition Fee</span> <span>${currencySymbol} ${tuition}</span></div>
            ${Number(admission) > 0 ? `<div style="font-size:12px; display:flex; justify-content:space-between; margin-bottom:4px;"><span>Admission Fee</span> <span>${currencySymbol} ${admission}</span></div>` : ''}
            ${Number(annual) > 0 ? `<div style="font-size:12px; display:flex; justify-content:space-between; margin-bottom:4px;"><span>Annual Charges</span> <span>${currencySymbol} ${annual}</span></div>` : ''}
            ${Number(exam) > 0 ? `<div style="font-size:12px; display:flex; justify-content:space-between; margin-bottom:4px;"><span>Exam Funds</span> <span>${currencySymbol} ${exam}</span></div>` : ''}
            ${Number(transport) > 0 ? `<div style="font-size:12px; display:flex; justify-content:space-between; margin-bottom:4px;"><span>Transport Fee</span> <span>${currencySymbol} ${transport}</span></div>` : ''}
            ${Number(lab) > 0 ? `<div style="font-size:12px; display:flex; justify-content:space-between; margin-bottom:4px;"><span>Lab/Other</span> <span>${currencySymbol} ${lab}</span></div>` : ''}
            ${Number(late) > 0 ? `<div style="font-size:12px; display:flex; justify-content:space-between; margin-bottom:4px; color:#dc2626;"><span>Late Fine</span> <span>+ ${currencySymbol} ${late}</span></div>` : ''}
            ${Number(discount) > 0 ? `<div style="font-size:12px; display:flex; justify-content:space-between; margin-bottom:4px; color:#16a34a;"><span>Concession</span> <span>- ${currencySymbol} ${discount}</span></div>` : ''}
            <div style="font-weight:800; font-size:14px; display:flex; justify-content:space-between; margin-top:10px; padding-top:10px; border-top:2px solid #e2e8f0;"><span>NET PAYABLE</span> <span>${currencySymbol} ${netPayable}</span></div>
            <div style="font-size:12px; display:flex; justify-content:space-between; margin-top:5px;"><span>Amount Paid</span> <span>${currencySymbol} ${paidAmount}</span></div>
            <div style="font-weight:700; font-size:12px; display:flex; justify-content:space-between; margin-top:5px; color:#dc2626;"><span>Balance Due</span> <span>${currencySymbol} ${balance}</span></div>
            <hr style="border:0; border-top:1px dashed #cbd5e1; margin: 10px 0;" />
            <div style="text-align:center; font-size:10px; color:#94a3b8;">System Generated Receipt</div>
        </div>`;
    };

    const printBulkChallans = (month) => {
        let printHTML = `<!DOCTYPE html><html><head><title>Bulk Invoices - ${selectedClass} - ${month}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
                body { font-family: 'Inter', sans-serif; padding: 0; color: #1e293b; background: white; margin: 0; }
                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 20px; }
                @media print { .btn-print { display: none; } body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
            </style></head>
            <body><button class="btn-print" onclick="window.print()" style="margin:20px; padding:10px 20px; background:#2563eb; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">🖨️ Print All Invoices</button>
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

    const printDefaultersList = () => {
        const defaulters = classStudents.filter(s => (s.feeHistory || []).some(h => h.status === 'unpaid' || h.status === 'partial'));
        if (defaulters.length === 0) {
            alert("Great news! There are no defaulters in this class.");
            return;
        }

        let printHTML = `<!DOCTYPE html><html><head><title>Defaulters List - ${selectedClass}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
                body { font-family: 'Inter', sans-serif; padding: 30px; color: #1e293b; background: white; margin: 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, { background: #f1f5f9; padding: 12px; text-align: left; border: 1px solid #cbd5e1; font-weight: 700; }
                td { padding: 10px 12px; border: 1px solid #cbd5e1; font-size: 13px; }
                h2 { color: #dc2626; margin-top: 0; text-align: center; }
                @media print { .btn-print { display: none; } body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
            </style></head>
            <body><button class="btn-print" onclick="window.print()" style="margin-bottom:20px; padding:10px 20px; background:#dc2626; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">🖨️ Print Defaulters List</button>
            <h2>Fee Defaulters List - ${selectedClass}</h2>
            <table>
                <thead><tr><th>#</th><th>Student Name</th><th>Father's Name</th><th>Phone Number</th><th>Unpaid Months</th></tr></thead>
                <tbody>`;
        
        defaulters.forEach((student, index) => {
            const unpaidMonths = (student.feeHistory || []).filter(h => h.status === 'unpaid' || h.status === 'partial').map(h => h.month).join(', ');
            const fatherName = student.admissions?.[0]?.fatherName || 'N/A';
            const phone = student.admissions?.[0]?.fatherContact || 'N/A';
            printHTML += `<tr><td>${index + 1}</td><td><strong>${student.name}</strong><br><span style="color:#64748b; font-size:11px;">(${student.id})</span></td><td>${fatherName}</td><td>${phone}</td><td style="color:#dc2626; font-weight:600;">${unpaidMonths}</td></tr>`;
        });
        
        printHTML += `</tbody></table>
            <div style="margin-top: 30px; text-align: right; font-weight: 700;">Generated Date: ${new Date().toLocaleDateString()}</div>
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
                                                        {unpaidMonths.length > 0 && student.admissions?.[0]?.fatherContact && (
                                                            <a href={`https://wa.me/92${student.admissions[0].fatherContact.replace(/\D/g, '')}?text=Dear%20Parent%20of%20${student.name},%20this%20is%20a%20reminder%20that%20fee%20dues%20are%20pending.%20Please%20submit%20as%20soon%20as%20possible.%20Regards,%20${schoolName}`} 
                                                               target="_blank" rel="noreferrer" title="Send WhatsApp Reminder"
                                                               style={{ background: '#22c55e', color: 'white', padding: '0.3rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <MessageCircle size={14} />
                                                            </a>
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
                                                                const bg = isPaid ? '#dcfce7' : (isPartial ? '#fef3c7' : '#fee2e2');
                                                                const color = isPaid ? '#16a34a' : (isPartial ? '#d97706' : '#dc2626');
                                                                const icon = isPaid ? '✓' : (isPartial ? '⚠' : '✗');
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
