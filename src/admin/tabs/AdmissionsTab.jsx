import React, { useState } from 'react';
import { Save, Trash2, Camera, User, Users, Award, CheckCircle, Printer, ChevronDown, X } from 'lucide-react';

const AdmissionsTab = ({
    admissionData, setAdmissionData, admissionInitialState,
    printAdmissionForm, printAdmissionFormBulk,
    handleAdmissionPhotoUpload, photoFileRef,
    sectionClasses, students,
}) => {
    const update = (key, value) => setAdmissionData(prev => ({ ...prev, [key]: value }));

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

            <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 'var(--font-weight-bold)' }}>Admission Form</h2>
                <div className="flex gap-2">
                    <button onClick={() => setAdmissionData(admissionInitialState)} className="btn" style={{ background: 'white', border: '1px solid var(--color-gray-300)', color: 'var(--color-gray-600)' }}>
                        <Trash2 size={16} /> Reset Form
                    </button>
                    {/* Bulk print button */}
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
        </div>
    );
};

export default AdmissionsTab;
