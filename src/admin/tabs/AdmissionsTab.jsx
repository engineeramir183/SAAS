import React, { useState } from 'react';
import { Save, Trash2, Camera, User, Users, Award, CheckCircle, Printer, ChevronDown, X, ClipboardList, Clipboard, CheckCircle2, FileText } from 'lucide-react';
import { useSchoolData } from '../../context/SchoolDataContext';

const AdmissionsTab = ({
    admissionData, setAdmissionData, admissionInitialState,
    printAdmissionForm, printAdmissionFormBulk, printBlankAdmissionForm,
    handleAdmissionPhotoUpload, photoFileRef,
    sectionClasses, students,
    INQUIRIES, updateInquiries
}) => {
    const { schoolData } = useSchoolData();
    const update = (key, value) => setAdmissionData(prev => ({ ...prev, [key]: value }));

    const [activeView, setActiveView] = useState('admission'); // 'admission', 'inquiry', 'inquiries_list'

    const initialInquiryState = {
        id: '',
        studentName: '',
        fatherName: '',
        contact: '',
        applyingFor: sectionClasses?.[0] || '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        status: 'pending' // pending, confirmed
    };
    const [inquiryData, setInquiryData] = useState(initialInquiryState);
    const safeInquiries = INQUIRIES || [];

    const [voucherModal, setVoucherModal] = useState(false);
    const [voucherFees, setVoucherFees] = useState({ admission: '', paperFund: '', monthly: '' });
    const [inquiryPrintModal, setInquiryPrintModal] = useState(false);
    const [inqPrintType, setInqPrintType] = useState('pending'); // 'pending', 'date', 'month'
    const [inqPrintDate, setInqPrintDate] = useState(new Date().toISOString().split('T')[0]);
    const [inqPrintMonth, setInqPrintMonth] = useState(new Date().toISOString().slice(0,7));

    // -- Inquiry Print Functions --
    const printInquiryForm = (inquiry) => {
        const printWindow = window.open('', '', 'width=800,height=800');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Inquiry Form - ${inquiry.studentName}</title>
                    <style>
                        body { font-family: sans-serif; padding: 2rem; color: #1e293b; line-height: 1.6; }
                        .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 1rem; margin-bottom: 2rem; }
                        .school-name { font-size: 1.5rem; font-weight: bold; margin-bottom: 0.25rem; }
                        .title { font-size: 1.1rem; color: #475569; text-transform: uppercase; letter-spacing: 1px; }
                        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
                        .box { border: 1px solid #e2e8f0; padding: 1rem; border-radius: 8px; }
                        .label { font-size: 0.8rem; color: #64748b; text-transform: uppercase; margin-bottom: 0.2rem; }
                        .val { font-size: 1.1rem; font-weight: 600; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="school-name">${schoolData?.name || 'School Name'}</div>
                        <div class="title">Student Inquiry Record</div>
                    </div>
                    <div class="grid">
                        <div class="box"><div class="label">Inquiry Date</div><div class="val">${new Date(inquiry.date).toLocaleDateString()}</div></div>
                        <div class="box"><div class="label">Applying For Class</div><div class="val">${inquiry.applyingFor}</div></div>
                        <div class="box"><div class="label">Student Name</div><div class="val">${inquiry.studentName}</div></div>
                        <div class="box"><div class="label">Parent / Guardian Name</div><div class="val">${inquiry.fatherName || '-'}</div></div>
                        <div class="box"><div class="label">Contact Number</div><div class="val">${inquiry.contact}</div></div>
                        <div class="box"><div class="label">Status</div><div class="val">${inquiry.status.toUpperCase()}</div></div>
                        <div class="box" style="grid-column: span 2;"><div class="label">Additional Notes</div><div class="val" style="font-weight: 400;">${inquiry.notes || '-'}</div></div>
                    </div>
                    <div style="margin-top: 5rem; display: flex; justify-content: space-between; padding: 0 2rem;">
                        <div style="border-top: 1px solid #000; padding-top: 0.5rem; width: 200px; text-align: center;">Parent/Guardian Signature</div>
                        <div style="border-top: 1px solid #000; padding-top: 0.5rem; width: 200px; text-align: center;">Authorized Officer</div>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
    };

    const handleSaveAndPrintInquiry = () => {
        if (!inquiryData.studentName.trim() || !inquiryData.contact.trim()) {
            alert("Student Name and Contact are required.");
            return;
        }
        const newId = inquiryData.id || `INQ-${Date.now()}`;
        const newInquiry = { ...inquiryData, id: newId };
        let newList = [...safeInquiries];
        if (inquiryData.id) newList = newList.map(i => i.id === inquiryData.id ? newInquiry : i);
        else newList.push(newInquiry);
        updateInquiries(newList);
        
        printInquiryForm(newInquiry);
        setInquiryData(initialInquiryState);
        setActiveView('inquiries_list');
    };

    const handleSaveAndPrintBlankForm = () => {
        if (!inquiryData.studentName.trim() || !inquiryData.contact.trim()) {
            alert("Student Name and Contact are required.");
            return;
        }
        const newId = inquiryData.id || `INQ-${Date.now()}`;
        const newInquiry = { ...inquiryData, id: newId };
        let newList = [...safeInquiries];
        if (inquiryData.id) newList = newList.map(i => i.id === inquiryData.id ? newInquiry : i);
        else newList.push(newInquiry);
        updateInquiries(newList);
        
        if (printBlankAdmissionForm) {
            printBlankAdmissionForm(newInquiry);
        }
        setInquiryData(initialInquiryState);
        setActiveView('inquiries_list');
    };

    const handleSaveAndGenerateVoucher = () => {
        if (!inquiryData.studentName.trim() || !inquiryData.contact.trim()) {
            alert("Student Name and Contact are required.");
            return;
        }
        setVoucherModal(true);
    };

    const printVoucher = () => {
        const total = Number(voucherFees.admission) + Number(voucherFees.paperFund) + Number(voucherFees.monthly);
        const newId = inquiryData.id || `INQ-${Date.now()}`;
        const newInquiry = { ...inquiryData, id: newId };
        let newList = [...safeInquiries];
        if (inquiryData.id) newList = newList.map(i => i.id === inquiryData.id ? newInquiry : i);
        else newList.push(newInquiry);
        updateInquiries(newList);

        const sections = ['Bank Copy', 'Office Copy', 'Student Copy'];
        let html = `<html><head><style>
            body { font-family: sans-serif; margin: 0; padding: 1rem; font-size: 12px; }
            .wrapper { display: flex; justify-content: space-between; gap: 1rem; }
            .slip { flex: 1; border: 1px dashed #000; padding: 1rem; border-radius: 8px; }
            .school { text-align: center; font-weight: bold; font-size: 16px; margin-bottom: 5px; }
            .copy { text-align: center; font-weight: bold; text-decoration: underline; margin-bottom: 15px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px dotted #ccc; padding-bottom: 4px;}
            .total { font-weight: bold; font-size: 14px; border-top: 2px solid #000; border-bottom: none; padding-top: 8px; margin-top: 15px;}
        </style></head><body><div class="wrapper">`;
        
        sections.forEach(copy => {
            html += `<div class="slip">
                <div class="school">${schoolData?.name || 'School Name'}</div>
                <div class="copy">${copy}</div>
                <div class="row"><span>Date:</span><span>${new Date().toLocaleDateString()}</span></div>
                <div class="row"><span>Name:</span><span>${newInquiry.studentName}</span></div>
                <div class="row"><span>Class:</span><span>${newInquiry.applyingFor}</span></div>
                <div class="row"><span>Status:</span><span>Inquiry / Admission</span></div>
                <br/>
                <div class="row"><span>Admission Fee:</span><span>Rs. ${voucherFees.admission || 0}</span></div>
                <div class="row"><span>Paper Fund:</span><span>Rs. ${voucherFees.paperFund || 0}</span></div>
                <div class="row"><span>Monthly Fee:</span><span>Rs. ${voucherFees.monthly || 0}</span></div>
                <div class="row total"><span>Total Payable:</span><span>Rs. ${total}</span></div>
                <div style="margin-top:40px; border-top: 1px solid #000; text-align: center; padding-top: 5px;">Cashier Signature</div>
            </div>`;
        });
        
        html += `</div></body></html>`;
        
        const printWindow = window.open('', '', 'width=1000,height=500');
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
        
        setVoucherModal(false);
        setVoucherFees({ admission: '', paperFund: '', monthly: '' });
        setInquiryData(initialInquiryState);
        setActiveView('inquiries_list');
    };

    const printInquiriesList = () => {
        let filtered = safeInquiries;
        let title = "Inquiries List";
        if (inqPrintType === 'pending') {
            filtered = safeInquiries.filter(i => i.status === 'pending');
            title = "All Pending Inquiries";
        } else if (inqPrintType === 'date') {
            filtered = safeInquiries.filter(i => i.date === inqPrintDate);
            title = `Inquiries on ${new Date(inqPrintDate).toLocaleDateString()}`;
        } else if (inqPrintType === 'month') {
            filtered = safeInquiries.filter(i => i.date.startsWith(inqPrintMonth));
            const monthName = new Date(inqPrintMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' });
            title = `Inquiries for ${monthName}`;
        }

        const printWindow = window.open('', '', 'width=900,height=600');
        let tableRows = filtered.slice().reverse().map(i => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${new Date(i.date).toLocaleDateString()}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${i.studentName}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${i.contact}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${i.applyingFor}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${i.status.toUpperCase()}</td>
            </tr>
        `).join('');

        if (filtered.length === 0) tableRows = '<tr><td colspan="5" style="text-align:center; padding: 1rem;">No inquiries found for this filter.</td></tr>';

        printWindow.document.write(`
            <html>
                <head>
                    <title>${title}</title>
                    <style>body { font-family: sans-serif; padding: 2rem; }</style>
                </head>
                <body>
                    <h2 style="text-align:center; margin-bottom: 0;">${schoolData?.name || 'School Name'}</h2>
                    <h3 style="text-align:center; color: #475569; margin-top: 5px;">${title} (Total: ${filtered.length})</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 2rem; text-align: left;">
                        <thead>
                            <tr style="background: #f8fafc;">
                                <th style="padding: 10px 8px; border-bottom: 2px solid #cbd5e1;">Date</th>
                                <th style="padding: 10px 8px; border-bottom: 2px solid #cbd5e1;">Student Name</th>
                                <th style="padding: 10px 8px; border-bottom: 2px solid #cbd5e1;">Contact</th>
                                <th style="padding: 10px 8px; border-bottom: 2px solid #cbd5e1;">Class</th>
                                <th style="padding: 10px 8px; border-bottom: 2px solid #cbd5e1;">Status</th>
                            </tr>
                        </thead>
                        <tbody>${tableRows}</tbody>
                    </table>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
        setInquiryPrintModal(false);
    };

    const handleSaveInquiry = () => {
        if (!inquiryData.studentName.trim() || !inquiryData.contact.trim()) {
            alert("Student Name and Contact are required.");
            return;
        }

        const newId = inquiryData.id || `INQ-${Date.now()}`;
        const newInquiry = { ...inquiryData, id: newId };
        
        let newList = [...safeInquiries];
        if (inquiryData.id) {
            newList = newList.map(i => i.id === inquiryData.id ? newInquiry : i);
        } else {
            newList.push(newInquiry);
        }

        updateInquiries(newList);
        alert("Inquiry saved successfully!");
        setInquiryData(initialInquiryState);
        setActiveView('inquiries_list');
    };

    const handleConfirmAdmission = (inquiry) => {
        // Switch to admission form and pre-fill data
        setAdmissionData(prev => ({
            ...prev,
            studentName: inquiry.studentName,
            fatherName: inquiry.fatherName,
            contact: inquiry.contact,
            applyingFor: inquiry.applyingFor,
            applicationDate: new Date().toISOString().split('T')[0],
        }));
        
        // Mark inquiry as confirmed
        const newList = safeInquiries.map(i => i.id === inquiry.id ? { ...i, status: 'confirmed' } : i);
        updateInquiries(newList);
        
        setActiveView('admission');
    };

    const handleDeleteInquiry = (id) => {
        if (window.confirm("Are you sure you want to delete this inquiry?")) {
            const newList = safeInquiries.filter(i => i.id !== id);
            updateInquiries(newList);
        }
    };

    // Bulk print modal state
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkMode, setBulkMode] = useState('class'); // 'student' | 'class' | 'college'
    const [bulkStudentId, setBulkStudentId] = useState('');
    const [bulkStudentSearch, setBulkStudentSearch] = useState('');
    const [bulkClass, setBulkClass] = useState(sectionClasses?.[0] || '');

    const allStudents = students || [];
    const filteredStudents = allStudents.filter(s =>
        s.name?.toLowerCase().includes(bulkStudentSearch.toLowerCase()) ||
        s.id?.toLowerCase().includes(bulkStudentSearch.toLowerCase())
    );

    const handleBulkPrint = () => {
        if (bulkMode === 'student') {
            if (!bulkStudentId) { alert('Please select a student.'); return; }
            printAdmissionFormBulk('student', bulkStudentId);
        } else if (bulkMode === 'class') {
            if (!bulkClass) { alert('Please select a class.'); return; }
            printAdmissionFormBulk('class', bulkClass);
        } else {
            printAdmissionFormBulk('college');
        }
        setShowBulkModal(false);
    };

    const countForMode = () => {
        if (bulkMode === 'student') return bulkStudentId ? 1 : 0;
        if (bulkMode === 'class') return allStudents.filter(s => s.grade === bulkClass).length;
        return allStudents.length;
    };

    return (
        <div className="animate-fade-in">
            {/* View Navigation */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                <button onClick={() => setActiveView('admission')} className="btn hover-scale" style={{ background: activeView === 'admission' ? '#1e3a8a' : 'transparent', color: activeView === 'admission' ? 'white' : '#475569', border: 'none', fontWeight: 600 }}>
                    <Clipboard size={18} /> New Admission
                </button>
                <button onClick={() => { setActiveView('inquiry'); setInquiryData(initialInquiryState); }} className="btn hover-scale" style={{ background: activeView === 'inquiry' ? '#1e3a8a' : 'transparent', color: activeView === 'inquiry' ? 'white' : '#475569', border: 'none', fontWeight: 600 }}>
                    <User size={18} /> New Inquiry
                </button>
                <button onClick={() => setActiveView('inquiries_list')} className="btn hover-scale" style={{ background: activeView === 'inquiries_list' ? '#1e3a8a' : 'transparent', color: activeView === 'inquiries_list' ? 'white' : '#475569', border: 'none', fontWeight: 600 }}>
                    <ClipboardList size={18} /> Inquiries List
                </button>
            </div>

            {/* ── Bulk Print Modal ── */}
            {showBulkModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div className="card animate-fade-in" style={{ maxWidth: 500, width: '100%', padding: '1.75rem', borderTop: '4px solid #1e3a8a', position: 'relative' }}>
                        <button onClick={() => setShowBulkModal(false)} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
                        <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#1e293b', marginBottom: '0.25rem' }}>🖨 Print Admission Forms</div>
                        <div style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Choose what to print — each student gets their own A4 page</div>

                        {/* Mode selector */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                            {[
                                { id: 'student', label: '👤 Single Student', sub: 'By ID' },
                                { id: 'class', label: '🏫 By Class', sub: 'All in class' },
                                { id: 'college', label: '🎓 Whole College', sub: `${allStudents.length} students` },
                            ].map(opt => (
                                <button key={opt.id} onClick={() => setBulkMode(opt.id)}
                                    style={{ flex: 1, padding: '0.65rem 0.5rem', borderRadius: '10px', border: `2px solid ${bulkMode === opt.id ? '#1e3a8a' : '#e2e8f0'}`, background: bulkMode === opt.id ? '#eff6ff' : 'white', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: bulkMode === opt.id ? '#1e3a8a' : '#475569' }}>{opt.label}</div>
                                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' }}>{opt.sub}</div>
                                </button>
                            ))}
                        </div>

                        {/* Student picker */}
                        {bulkMode === 'student' && (
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontWeight: 600, color: '#475569', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Search Student</label>
                                <input type="text" className="form-input" placeholder="Type name or ID..." value={bulkStudentSearch}
                                    onChange={e => { setBulkStudentSearch(e.target.value); setBulkStudentId(''); }} style={{ width: '100%', marginBottom: '0.5rem' }} />
                                <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                                    {filteredStudents.length === 0 && <div style={{ padding: '0.75rem', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>No students found</div>}
                                    {filteredStudents.slice(0, 30).map(s => (
                                        <div key={s.id} onClick={() => { setBulkStudentId(s.id); setBulkStudentSearch(s.name); }}
                                            style={{ padding: '0.6rem 0.9rem', cursor: 'pointer', background: bulkStudentId === s.id ? '#eff6ff' : 'transparent', borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                                            onMouseEnter={e => { if (bulkStudentId !== s.id) e.currentTarget.style.background = '#f8fafc'; }}
                                            onMouseLeave={e => { if (bulkStudentId !== s.id) e.currentTarget.style.background = 'transparent'; }}>
                                            <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{s.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{s.id} · {s.grade}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Class picker */}
                        {bulkMode === 'class' && (
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontWeight: 600, color: '#475569', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Select Class</label>
                                <select className="form-input" value={bulkClass} onChange={e => setBulkClass(e.target.value)} style={{ width: '100%' }}>
                                    {(sectionClasses || []).map(c => (
                                        <option key={c} value={c}>{c} ({allStudents.filter(s => s.grade === c).length} students)</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* College summary */}
                        {bulkMode === 'college' && (
                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.85rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#15803d', fontWeight: 600 }}>
                                ✓ Will print <strong>{allStudents.length}</strong> admission forms — one per student, sorted by serial number
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                            <button onClick={() => setShowBulkModal(false)} style={{ padding: '0.6rem 1.25rem', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleBulkPrint} style={{ padding: '0.6rem 1.5rem', borderRadius: 8, border: 'none', background: '#1e3a8a', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Printer size={16} /> Print {countForMode() > 0 ? `(${countForMode()})` : ''} Form{countForMode() !== 1 ? 's' : ''}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeView === 'admission' && (
                <>
                    <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 'var(--font-weight-bold)' }}>Admission Form</h2>
                        <div className="flex gap-2">
                            <button onClick={() => setAdmissionData(admissionInitialState)} className="btn" style={{ background: 'white', border: '1px solid var(--color-gray-300)', color: 'var(--color-gray-600)' }}>
                                <Trash2 size={16} /> Reset Form
                            </button>
                            <button onClick={() => setShowBulkModal(true)} className="btn" style={{ background: '#eff6ff', border: '1.5px solid #1e3a8a', color: '#1e3a8a', fontWeight: 700 }}>
                                <Printer size={16} /> Print Forms <ChevronDown size={14} />
                            </button>
                            <button onClick={printAdmissionForm} className="btn btn-primary" style={{ background: '#4d7c0f', borderColor: '#4d7c0f' }}>
                                <Save size={18} /> Save &amp; Print Form
                            </button>
                        </div>
                    </div>

                    <div className="card" style={{ padding: '2rem' }}>
                        {/* Top Meta */}
                        <div className="grid grid-cols-2" style={{ gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid var(--color-gray-100)', paddingBottom: '1.5rem' }}>
                            <div>
                                <label className="form-label">Applying For (class)</label>
                                <select className="form-input" value={admissionData.applyingFor} onChange={e => update('applyingFor', e.target.value)}>
                                    {sectionClasses.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="form-label">Application Date</label>
                                <input type="date" className="form-input" value={admissionData.applicationDate} onChange={e => update('applicationDate', e.target.value)} />
                            </div>
                            <div className="col-span-2">
                                <label className="form-label">Serial Number (Optional)</label>
                                <input type="text" className="form-input" placeholder="Enter manual serial number (must be unique)" value={admissionData.serialNumber} onChange={e => update('serialNumber', e.target.value)} />
                            </div>
                        </div>

                        {/* Student Information */}
                        <div style={{ marginBottom: '2.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <User size={18} /> Student's Information
                            </h3>
                            <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
                                <div>
                                    <label className="form-label">Student's Name (Capital Letters)</label>
                                    <input type="text" className="form-input" placeholder="Enter full name" value={admissionData.studentName} onChange={e => update('studentName', e.target.value.toUpperCase())} />
                                </div>
                                <div>
                                    <label className="form-label">National ID / B-Form Number</label>
                                    <input type="text" className="form-input" placeholder="e.g. 35202-0000000-0" value={admissionData.bForm} onChange={e => update('bForm', e.target.value)} />
                                </div>
                                <div>
                                    <label className="form-label">Date of Birth</label>
                                    <input type="date" className="form-input" value={admissionData.dob} onChange={e => update('dob', e.target.value)} />
                                </div>
                                <div>
                                    <label className="form-label">Nationality</label>
                                    <input type="text" className="form-input" placeholder="e.g. Pakistani" value={admissionData.nationality} onChange={e => update('nationality', e.target.value)} />
                                </div>
                                <div>
                                    <label className="form-label">Gender</label>
                                    <div className="flex gap-4">
                                        {['Male', 'Female', 'Others'].map(g => (
                                            <label key={g} className="flex gap-2" style={{ alignItems: 'center', cursor: 'pointer' }}>
                                                <input type="radio" name="gender" checked={admissionData.gender === g} onChange={() => update('gender', g)} /> {g}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="form-label">Religion</label>
                                    <input type="text" className="form-input" placeholder="e.g. Islam" value={admissionData.religion} onChange={e => update('religion', e.target.value)} />
                                </div>
                                <div>
                                    <label className="form-label">Student Photograph</label>
                                    <div className="flex gap-4" style={{ alignItems: 'center' }}>
                                        <div style={{ width: '60px', height: '80px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '4px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {admissionData.photo ? <img src={admissionData.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera size={20} style={{ margin: 'auto', color: '#94a3b8' }} />}
                                        </div>
                                        <button onClick={() => photoFileRef.current.click()} className="btn btn-sm" style={{ background: 'var(--color-primary)', color: 'white' }}>
                                            <Camera size={14} /> Upload Photo
                                        </button>
                                    </div>
                                    <input type="file" ref={photoFileRef} style={{ display: 'none' }} accept="image/*" onChange={handleAdmissionPhotoUpload} />
                                </div>
                            </div>
                        </div>


                        {/* Parent Information */}
                        <div style={{ marginBottom: '2.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Users size={18} /> Parents Information
                            </h3>
                            <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
                                <div className="col-span-2">
                                    <label className="form-label">Father's Name (Capital Letters)</label>
                                    <input type="text" className="form-input" value={admissionData.fatherName} onChange={e => update('fatherName', e.target.value.toUpperCase())} />
                                </div>
                                <div>
                                    <label className="form-label">National ID / CNIC Number</label>
                                    <input type="text" className="form-input" placeholder="35202-0000000-0" value={admissionData.fatherCnic} onChange={e => update('fatherCnic', e.target.value)} />
                                </div>
                                <div>
                                    <label className="form-label">Contact Number</label>
                                    <input type="text" className="form-input" value={admissionData.contact} onChange={e => update('contact', e.target.value)} />
                                </div>
                                <div>
                                    <label className="form-label">Mobile / WhatsApp Number</label>
                                    <input type="text" className="form-input" value={admissionData.whatsapp} onChange={e => update('whatsapp', e.target.value)} />
                                </div>
                                <div className="col-span-2">
                                    <label className="form-label">Home Address</label>
                                    <textarea className="form-input" style={{ height: '80px' }} value={admissionData.address} onChange={e => update('address', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* Documents Required */}
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <CheckCircle size={18} /> Documents Required
                            </h3>
                            <div className="flex flex-col gap-3">
                                {[
                                    { key: 'photos', label: '4 Passport size photographs' },
                                    { key: 'bform', label: 'National ID / B-Form Copy' },
                                    { key: 'cnic', label: 'National ID / CNIC of Parents/Guardian' },
                                ].map(({ key, label }) => (
                                    <label key={key} className="flex gap-2" style={{ alignItems: 'center', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={admissionData.docs[key]} onChange={e => update('docs', { ...admissionData.docs, [key]: e.target.checked })} /> {label}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {activeView === 'inquiry' && (
                <>
                    <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 'var(--font-weight-bold)' }}>Inquiry Form</h2>
                        <div className="flex gap-2 flex-wrap">
                            <button onClick={() => setInquiryData(initialInquiryState)} className="btn" style={{ background: 'white', border: '1px solid var(--color-gray-300)', color: 'var(--color-gray-600)' }}>
                                <Trash2 size={16} /> Reset
                            </button>
                            <button onClick={handleSaveInquiry} className="btn btn-primary" style={{ background: '#2563eb', borderColor: '#2563eb' }}>
                                <Save size={18} /> Save
                            </button>
                            <button onClick={handleSaveAndPrintInquiry} className="btn" style={{ background: '#eff6ff', color: '#1e3a8a', border: '1px solid #bfdbfe', fontWeight: 600 }}>
                                <Printer size={16} /> Save & Print Inquiry
                            </button>
                            <button onClick={handleSaveAndPrintBlankForm} className="btn" style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', fontWeight: 600 }}>
                                <Clipboard size={16} /> Save & Print Form
                            </button>
                            <button onClick={handleSaveAndGenerateVoucher} className="btn" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', fontWeight: 600 }}>
                                <FileText size={16} /> Save & Generate Voucher
                            </button>
                        </div>
                    </div>

                    <div className="card" style={{ padding: '2rem' }}>
                        <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
                            <div>
                                <label className="form-label">Student Name *</label>
                                <input type="text" className="form-input" value={inquiryData.studentName} onChange={e => setInquiryData(prev => ({ ...prev, studentName: e.target.value }))} placeholder="Enter student's name" />
                            </div>
                            <div>
                                <label className="form-label">Parent / Guardian Name</label>
                                <input type="text" className="form-input" value={inquiryData.fatherName} onChange={e => setInquiryData(prev => ({ ...prev, fatherName: e.target.value }))} placeholder="Enter father's name" />
                            </div>
                            <div>
                                <label className="form-label">Contact Number *</label>
                                <input type="text" className="form-input" value={inquiryData.contact} onChange={e => setInquiryData(prev => ({ ...prev, contact: e.target.value }))} placeholder="e.g. 0300-1234567" />
                            </div>
                            <div>
                                <label className="form-label">Applying For (Class)</label>
                                <select className="form-input" value={inquiryData.applyingFor} onChange={e => setInquiryData(prev => ({ ...prev, applyingFor: e.target.value }))}>
                                    {sectionClasses.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="form-label">Inquiry Date</label>
                                <input type="date" className="form-input" value={inquiryData.date} onChange={e => setInquiryData(prev => ({ ...prev, date: e.target.value }))} />
                            </div>
                            <div className="col-span-2">
                                <label className="form-label">Additional Notes</label>
                                <textarea className="form-input" style={{ height: '100px' }} value={inquiryData.notes} onChange={e => setInquiryData(prev => ({ ...prev, notes: e.target.value }))} placeholder="Any specific questions or remarks..." />
                            </div>
                        </div>
                    </div>
                </>
            )}

            {activeView === 'inquiries_list' && (
                <>
                    <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 'var(--font-weight-bold)' }}>Inquiries List</h2>
                        <button onClick={() => setInquiryPrintModal(true)} className="btn" style={{ background: '#eff6ff', color: '#1e3a8a', border: '1px solid #bfdbfe', fontWeight: 600 }}>
                            <Printer size={16} /> Print Inquiries
                        </button>
                    </div>

                    <div className="grid grid-cols-3" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
                        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '50%', color: '#3b82f6' }}><ClipboardList size={24} /></div>
                            <div>
                                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{safeInquiries.length}</div>
                                <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>Total Inquiries</div>
                            </div>
                        </div>
                        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '50%', color: '#d97706' }}><User size={24} /></div>
                            <div>
                                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{safeInquiries.filter(i => i.status === 'pending').length}</div>
                                <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>Pending</div>
                            </div>
                        </div>
                        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: '#dcfce7', padding: '1rem', borderRadius: '50%', color: '#16a34a' }}><CheckCircle2 size={24} /></div>
                            <div>
                                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{safeInquiries.filter(i => i.status === 'confirmed').length}</div>
                                <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>Confirmed Admissions</div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Student Name</th>
                                        <th>Parent Name</th>
                                        <th>Contact</th>
                                        <th>Class</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {safeInquiries.length === 0 ? (
                                        <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No inquiries found.</td></tr>
                                    ) : (
                                        [...safeInquiries].reverse().map(inq => (
                                            <tr key={inq.id}>
                                                <td>{new Date(inq.date).toLocaleDateString()}</td>
                                                <td style={{ fontWeight: 600 }}>{inq.studentName}</td>
                                                <td>{inq.fatherName}</td>
                                                <td>{inq.contact}</td>
                                                <td><span className="badge badge-info">{inq.applyingFor}</span></td>
                                                <td>
                                                    <span className={`badge ${inq.status === 'confirmed' ? 'badge-success' : 'badge-warning'}`}>
                                                        {inq.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div className="flex justify-end gap-2">
                                                        {inq.status === 'pending' && (
                                                            <button onClick={() => handleConfirmAdmission(inq)} className="btn btn-sm" style={{ background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                                                                Confirm Admission
                                                            </button>
                                                        )}
                                                        <button onClick={() => { setInquiryData(inq); setActiveView('inquiry'); }} className="btn btn-sm" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}>
                                                            Edit
                                                        </button>
                                                        <button onClick={() => handleDeleteInquiry(inq.id)} className="btn btn-sm" style={{ background: '#fee2e2', color: '#ef4444', border: '1px solid #fecaca' }}>
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* --- Modals for Inquiries --- */}
            {voucherModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div className="card animate-fade-in" style={{ maxWidth: 400, width: '100%', padding: '1.75rem', position: 'relative' }}>
                        <button onClick={() => setVoucherModal(false)} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
                        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileText size={20} /> Generate Fee Voucher</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label className="form-label">Admission Fee (Rs)</label>
                                <input type="number" className="form-input" value={voucherFees.admission} onChange={e => setVoucherFees({...voucherFees, admission: e.target.value})} />
                            </div>
                            <div>
                                <label className="form-label">Paper Fund (Rs)</label>
                                <input type="number" className="form-input" value={voucherFees.paperFund} onChange={e => setVoucherFees({...voucherFees, paperFund: e.target.value})} />
                            </div>
                            <div>
                                <label className="form-label">Monthly Fee (Rs)</label>
                                <input type="number" className="form-input" value={voucherFees.monthly} onChange={e => setVoucherFees({...voucherFees, monthly: e.target.value})} />
                            </div>
                            <button onClick={printVoucher} className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%' }}>
                                <Printer size={18} /> Print Voucher
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {inquiryPrintModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div className="card animate-fade-in" style={{ maxWidth: 450, width: '100%', padding: '1.75rem', position: 'relative' }}>
                        <button onClick={() => setInquiryPrintModal(false)} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
                        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Printer size={20} /> Print Inquiries List</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label className="form-label">Filter By</label>
                                <select className="form-input" value={inqPrintType} onChange={e => setInqPrintType(e.target.value)}>
                                    <option value="pending">All Pending Inquiries</option>
                                    <option value="date">By Specific Date</option>
                                    <option value="month">By Specific Month</option>
                                </select>
                            </div>
                            
                            {inqPrintType === 'date' && (
                                <div>
                                    <label className="form-label">Select Date</label>
                                    <input type="date" className="form-input" value={inqPrintDate} onChange={e => setInqPrintDate(e.target.value)} />
                                </div>
                            )}

                            {inqPrintType === 'month' && (
                                <div>
                                    <label className="form-label">Select Month</label>
                                    <input type="month" className="form-input" value={inqPrintMonth} onChange={e => setInqPrintMonth(e.target.value)} />
                                </div>
                            )}

                            <button onClick={printInquiriesList} className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%' }}>
                                <Printer size={18} /> Print Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdmissionsTab;
