import React, { useState } from 'react';
import { ChevronRight, Upload, Download, PlusCircle, Users, Edit3, Trash2, GripVertical, ChevronUp, ChevronDown, X, Hash, Check, Settings } from 'lucide-react';

const ClassListsTab = ({
    students, setStudents,
    SECTIONS, CLASSES,
    updateSections, updateClasses,
    sectionClasses,
    selectedClassForList, setSelectedClassForList,
    viewingClass, setViewingClass,
    classDetailTab, setClassDetailTab,
    newSectionName, setNewSectionName,
    newClassName, setNewClassName,
    editingSectionId, setEditingSectionId,
    editingSectionName, setEditingSectionName,
    selectedSectionId, setSelectedSectionId,
    editingStudentId, setEditingStudentId,
    editStudentData, setEditStudentData,
    classImportFileRef, importStudentsExcel,
    exportClassRoster, exportPasswordsPDF,
    setActiveTab, setAdmissionData,
    showSaveMessage, openConfirm,
    CLASS_SERIAL_STARTS, updateClassSerialStarts,
    uploadImage,
}) => {
    const [editingSerialStudentId, setEditingSerialStudentId] = useState(null);
    const [editingSerialValue, setEditingSerialValue] = useState('');
    const [showSerialConfig, setShowSerialConfig] = useState(false);
    const [serialStartBoysInput, setSerialStartBoysInput] = useState('');
    const [serialStartGirlsInput, setSerialStartGirlsInput] = useState('');

    const classStartSerialObj = viewingClass ? (CLASS_SERIAL_STARTS?.[viewingClass] ?? {}) : {};
    const classStartSerialBoys = typeof classStartSerialObj === 'object' && classStartSerialObj !== null ? (classStartSerialObj.boys || '') : (typeof classStartSerialObj === 'string' ? classStartSerialObj : '');
    const classStartSerialGirls = typeof classStartSerialObj === 'object' && classStartSerialObj !== null ? (classStartSerialObj.girls || '') : '';
    const classStartSerialStr = [
        classStartSerialBoys ? `👦 ${classStartSerialBoys}` : '',
        classStartSerialGirls ? `👧 ${classStartSerialGirls}` : ''
    ].filter(Boolean).join(' • ');

    const saveStudentSerial = async (studentId, newSerial) => {
        // Global uniqueness check — no two students anywhere can share a serial
        if (newSerial) {
            const conflict = students.find(s => s.id !== studentId && String(s.serialNumber) === String(newSerial));
            if (conflict) {
                alert(`Serial number ${newSerial} is already assigned to "${conflict.name}" (${conflict.grade}). Serial numbers must be unique across the entire college.`);
                return;
            }
        }
        const updatedStudents = students.map(s =>
            s.id === studentId ? { ...s, serialNumber: newSerial || null } : s
        );
        await setStudents(updatedStudents);
        setEditingSerialStudentId(null);
        showSaveMessage('Serial number updated!');
    };

    const handleSaveSerialStart = async () => {
        if (!viewingClass) return;
        const bInput = serialStartBoysInput.trim();
        const gInput = serialStartGirlsInput.trim();
        
        let newStudents = [...students];
        const classStudentsMale = students.filter(s => s.grade === viewingClass && s.admissions?.[0]?.gender === 'Male').sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
        const classStudentsFemale = students.filter(s => s.grade === viewingClass && s.admissions?.[0]?.gender === 'Female').sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
        const allNewSerials = [];
        
        const applySerials = (studentsList, startVal) => {
            if (!startVal) return null;
            let startNum = parseInt(startVal, 10);
            if (isNaN(startNum)) return 'invalid';
            const mapped = studentsList.map((s, i) => ({ id: s.id, serial: String(startNum + i) }));
            allNewSerials.push(...mapped.map(m => m.serial));
            return mapped;
        };

        const malesApplied = applySerials(classStudentsMale, bInput);
        const femalesApplied = applySerials(classStudentsFemale, gInput);

        if (malesApplied === 'invalid' || femalesApplied === 'invalid') {
            alert("Please enter a valid numeric starting serial or leave empty.");
            return;
        }

        if (allNewSerials.length > 0) {
            const conflict = students.find(s => s.grade !== viewingClass && allNewSerials.includes(String(s.serialNumber)));
            if (conflict) {
                alert(`Cannot set starting serials. Auto-incrementing would assign ${conflict.serialNumber} which is already in use by "${conflict.name}" (${conflict.grade}).`);
                return;
            }

            const malesObj = malesApplied ? Object.fromEntries(malesApplied.map(m => [m.id, m.serial])) : {};
            const femalesObj = femalesApplied ? Object.fromEntries(femalesApplied.map(f => [f.id, f.serial])) : {};

            newStudents = newStudents.map(s => {
                if (malesObj[s.id] !== undefined) return { ...s, serialNumber: malesObj[s.id] };
                if (femalesObj[s.id] !== undefined) return { ...s, serialNumber: femalesObj[s.id] };
                return s;
            });
            await setStudents(newStudents);
        }

        const newMap = { ...(CLASS_SERIAL_STARTS || {}), [viewingClass]: { boys: bInput || null, girls: gInput || null } };
        await updateClassSerialStarts(newMap);
        setShowSerialConfig(false);
        showSaveMessage(`Starting serials for "${viewingClass}" updated and auto-assigned to students`);
    };

    return (
        <div className="animate-fade-in">
            {
                viewingClass ? (
                    <div className="card animate-fade-in" style={{ padding: '0', overflow: 'hidden' }}>
                        {/* Header */}
                        <div style={{ background: 'linear-gradient(to right, #f8fafc, #edf2f7)', borderBottom: '1px solid #e2e8f0', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button onClick={() => setViewingClass(null)} className="btn" style={{ padding: '0.4rem 0.6rem', color: '#64748b' }}>
                                    <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} /> Back
                                </button>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>{viewingClass}</h3>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', fontSize: '0.85rem', color: '#64748b' }}>
                                        <span>{SECTIONS.find(s => s.classes.includes(viewingClass))?.name || 'Unassigned'}</span>
                                        <span>•</span>
                                        <span>{students.filter(s => s.grade === viewingClass).length} Students</span>
                                        {classStartSerialStr && (
                                            <>
                                                <span>•</span>
                                                <span style={{ color: '#7c3aed', fontWeight: 700 }}>
                                                    <Hash size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> Starts: {classStartSerialStr}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {/* Serial config button */}
                                <button onClick={() => { setShowSerialConfig(s => !s); setSerialStartBoysInput(classStartSerialBoys); setSerialStartGirlsInput(classStartSerialGirls); }} className="btn"
                                    style={{ background: showSerialConfig ? '#ede9fe' : '#f8fafc', color: '#7c3aed', borderColor: '#c4b5fd', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>
                                    <Hash size={15} /> Serial Config
                                </button>
                                <button onClick={() => { setSelectedClassForList(viewingClass); classImportFileRef.current.click(); }} className="btn btn-secondary">
                                    <Upload size={16} /> Import Excel
                                </button>
                                <button onClick={() => { setSelectedClassForList(viewingClass); setTimeout(exportClassRoster, 100); }} className="btn btn-secondary">
                                    <Download size={16} /> Export
                                </button>
                                <button onClick={() => { setSelectedClassForList(viewingClass); setTimeout(() => exportPasswordsPDF(viewingClass), 100); }} className="btn" style={{ background: '#2563eb', color: 'white', borderColor: '#2563eb' }}>
                                    📄 Passwords PDF
                                </button>
                                <button onClick={() => { setSelectedClassForList(viewingClass); setAdmissionData(prev => ({ ...prev, applyingFor: viewingClass })); setActiveTab('admissions'); }} className="btn btn-primary">
                                    <PlusCircle size={16} /> Add Student
                                </button>
                            </div>
                        </div>

                        {/* Serial Number Config Panel */}
                        {showSerialConfig && (
                            <div style={{ background: '#f5f3ff', borderBottom: '1px solid #ddd6fe', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                <Hash size={18} color="#7c3aed" />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#5b21b6', marginBottom: '0.25rem' }}>
                                        Serial Number Configuration for "{viewingClass}"
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: '#7c3aed' }}>
                                        Set the starting serial numbers for boys and girls.
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>👦 Boys Start</span>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="e.g. 100"
                                            value={serialStartBoysInput}
                                            onChange={e => setSerialStartBoysInput(e.target.value)}
                                            style={{ width: '90px', padding: '0.4rem 0.6rem', borderColor: '#bae6fd' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#be185d', textTransform: 'uppercase' }}>👧 Girls Start</span>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="e.g. 200"
                                            value={serialStartGirlsInput}
                                            onChange={e => setSerialStartGirlsInput(e.target.value)}
                                            style={{ width: '90px', padding: '0.4rem 0.6rem', borderColor: '#fbcfe8' }}
                                        />
                                    </div>
                                    <button onClick={handleSaveSerialStart} className="btn btn-primary" style={{ background: '#7c3aed', borderColor: '#7c3aed', padding: '0.45rem 0.75rem', height: 'fit-content', marginBottom: '1px' }}>
                                        <Check size={16} /> Save
                                    </button>
                                    <button onClick={() => setShowSerialConfig(false)} className="btn" style={{ color: '#64748b', height: 'fit-content', marginBottom: '1px' }}>
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Gender tabs */}
                        <div style={{ padding: '0 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '1.5rem' }}>
                            {['boys', 'girls', 'all'].map(tab => {
                                const label = tab === 'all' ? 'All Students' : (tab === 'boys' ? 'Boys' : 'Girls');
                                const count = students.filter(s => s.grade === viewingClass && (tab === 'all' || s.admissions?.[0]?.gender === (tab === 'boys' ? 'Male' : 'Female'))).length;
                                return (
                                    <button key={tab} onClick={() => setClassDetailTab(tab)} style={{
                                        padding: '1rem 0',
                                        background: 'none', border: 'none',
                                        borderBottom: classDetailTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
                                        color: classDetailTab === tab ? 'var(--color-primary)' : '#64748b',
                                        fontWeight: 600, cursor: 'pointer'
                                    }}>
                                        {label} <span style={{ background: '#e2e8f0', padding: '0.1rem 0.4rem', borderRadius: '999px', fontSize: '0.7rem', color: '#475569', marginLeft: '0.2rem' }}>{count}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Student table */}
                        <div style={{ padding: '1.5rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                                        <th style={{ padding: '0.75rem', width: '48px' }}></th>
                                        <th style={{ padding: '0.75rem', width: '90px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <Hash size={12} /> Serial
                                            </div>
                                        </th>
                                        <th style={{ padding: '0.75rem' }}>ID</th>
                                        <th style={{ padding: '0.75rem' }}>Name</th>
                                        <th style={{ padding: '0.75rem' }}>Father Name</th>
                                        <th style={{ padding: '0.75rem' }}>Gender</th>
                                        <th style={{ padding: '0.75rem' }}>Contact</th>
                                        <th style={{ padding: '0.75rem' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students
                                        .filter(s => s.grade === viewingClass && (classDetailTab === 'all' || s.admissions?.[0]?.gender === (classDetailTab === 'boys' ? 'Male' : 'Female')))
                                        .sort((a, b) => {
                                            const sA = parseInt(a.serialNumber, 10);
                                            const sB = parseInt(b.serialNumber, 10);
                                            if (!isNaN(sA) && !isNaN(sB)) return sA - sB;
                                            if (!isNaN(sA)) return -1;
                                            if (!isNaN(sB)) return 1;
                                            return a.id.localeCompare(b.id, undefined, { numeric: true });
                                        })
                                        .map(student => (
                                            <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9', background: editingStudentId === student.id ? '#eff6ff' : 'transparent', transition: 'background 0.2s' }}>
                                                <td style={{ padding: '0.5rem 0.75rem' }}>
                                                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', overflow: 'hidden', background: '#e0f2fe', border: '2px solid #bae6fd', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }} title={student.photo || student.image ? '' : 'Upload Photo'}>
                                                        {student.photo || student.image ? (
                                                            <img src={student.photo || student.image} alt={student.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <>
                                                                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0369a1' }}>{student.name?.charAt(0)?.toUpperCase()}</span>
                                                                <div className="hover-overlay" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'all 0.2s', pointerEvents: 'none' }}>
                                                                    <Upload size={16} color="#0369a1" />
                                                                </div>
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onMouseEnter={e => e.target.previousSibling.style.opacity = 1}
                                                                    onMouseLeave={e => e.target.previousSibling.style.opacity = 0}
                                                                    onChange={async (e) => {
                                                                        const file = e.target.files[0];
                                                                        if (!file) return;
                                                                        if (!uploadImage) { alert("Upload capability is not available."); return; }
                                                                        showSaveMessage('Uploading photo directly...');
                                                                        const publicUrl = await uploadImage(file, 'students');
                                                                        if (publicUrl) {
                                                                            const upd = students.map(s => s.id === student.id ? { ...s, photo: publicUrl, image: publicUrl } : s);
                                                                            await setStudents(upd);
                                                                            showSaveMessage('Photo uploaded successfully!');
                                                                        }
                                                                        e.target.value = '';
                                                                    }}
                                                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                                                />
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                                {/* Serial Number Cell — inline editable */}
                                                <td style={{ padding: '0.5rem 0.75rem' }}>
                                                    {editingSerialStudentId === student.id ? (
                                                        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                                                            <input
                                                                autoFocus
                                                                type="text"
                                                                value={editingSerialValue}
                                                                onChange={e => setEditingSerialValue(e.target.value)}
                                                                onKeyDown={e => {
                                                                    if (e.key === 'Enter') saveStudentSerial(student.id, editingSerialValue.trim());
                                                                    if (e.key === 'Escape') setEditingSerialStudentId(null);
                                                                }}
                                                                style={{ width: '60px', padding: '0.2rem 0.3rem', border: '1.5px solid #7c3aed', borderRadius: '5px', fontSize: '0.8rem', fontWeight: 700 }}
                                                            />
                                                            <button onClick={() => saveStudentSerial(student.id, editingSerialValue.trim())}
                                                                style={{ background: '#7c3aed', border: 'none', cursor: 'pointer', color: 'white', borderRadius: '4px', padding: '2px 4px', display: 'flex', alignItems: 'center' }}><Check size={12} /></button>
                                                            <button onClick={() => setEditingSerialStudentId(null)}
                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}><X size={12} /></button>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                            <span style={{ fontWeight: 700, color: student.serialNumber ? '#7c3aed' : '#cbd5e1', fontSize: '0.9rem', minWidth: '36px' }}>
                                                                {student.serialNumber || '—'}
                                                            </span>
                                                            <button onClick={() => { setEditingSerialStudentId(student.id); setEditingSerialValue(student.serialNumber || ''); }}
                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', opacity: 0.6 }} title="Edit serial">
                                                                <Edit3 size={11} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.75rem', fontWeight: 600, fontSize: '0.82rem', color: '#475569' }}>{student.id}</td>
                                                <td style={{ padding: '0.75rem' }}><div style={{ fontWeight: 600 }}>{student.name}</div></td>
                                                <td style={{ padding: '0.75rem', color: '#64748b' }}>{student.admissions?.[0]?.fatherName || '—'}</td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: student.admissions?.[0]?.gender === 'Male' ? '#e0f2fe' : '#fce7f3', color: student.admissions?.[0]?.gender === 'Male' ? '#0369a1' : '#be185d' }}>
                                                        {student.admissions?.[0]?.gender || '—'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.75rem', color: '#64748b' }}>{student.admissions?.[0]?.contact || '—'}</td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                                        <button
                                                            onClick={() => { setEditingStudentId(student.id); setEditStudentData(JSON.parse(JSON.stringify(student))); }}
                                                            className="btn icon-btn" style={{ color: '#2563eb', background: 'transparent' }} title="Edit Student">
                                                            <Edit3 size={16} />
                                                        </button>
                                                        <button onClick={() => {
                                                            openConfirm(
                                                                '🗑 Delete Student',
                                                                `Are you sure you want to permanently delete "${student.name}" (${student.id})? This cannot be undone.`,
                                                                async () => {
                                                                    const newStudents = students.filter(s => s.id !== student.id);
                                                                    await setStudents(newStudents);
                                                                    showSaveMessage(`${student.name} deleted.`);
                                                                }
                                                            );
                                                        }} className="btn icon-btn" style={{ color: '#ef4444' }} title="Delete Student">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                            {students.filter(s => s.grade === viewingClass).length === 0 && (
                                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                    <Users size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                    <p>No students found in this list.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Sections & classes overview */
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>Class Management</h3>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input type="text" placeholder="New Section Name" className="form-input"
                                    value={newSectionName} onChange={e => setNewSectionName(e.target.value)} style={{ width: '200px' }} />
                                <button onClick={async () => {
                                    if (!newSectionName.trim()) return;
                                    const id = `sec_${Date.now()}`;
                                    const newSec = { id, name: newSectionName.trim(), classes: [] };
                                    const updated = [...(Array.isArray(SECTIONS) ? SECTIONS : []), newSec];
                                    const { error } = await updateSections(updated);
                                    if (error) { alert('Failed to add section: ' + error.message); }
                                    else { setNewSectionName(''); setSelectedSectionId(id); showSaveMessage(`Section "${newSec.name}" added!`); }
                                }} className="btn btn-primary">
                                    <PlusCircle size={16} /> Add Section
                                </button>
                            </div>
                        </div>

                        {/* Section tabs */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                            {(SECTIONS || []).map((sec, idx) => (
                                <div key={sec.id} onClick={() => setSelectedSectionId(sec.id)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '10px', background: selectedSectionId === sec.id ? 'linear-gradient(135deg, var(--color-primary), #3b82f6)' : '#f8fafc', border: selectedSectionId === sec.id ? 'none' : '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                                    <GripVertical size={16} style={{ color: selectedSectionId === sec.id ? 'rgba(255,255,255,0.5)' : '#94a3b8', flexShrink: 0 }} />
                                    {editingSectionId === sec.id ? (
                                        <input type="text" value={editingSectionName} onChange={e => setEditingSectionName(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && editingSectionName.trim()) {
                                                    const upd = SECTIONS.map(s => s.id === sec.id ? { ...s, name: editingSectionName.trim() } : s);
                                                    updateSections(upd); setEditingSectionId(null);
                                                    showSaveMessage(`Section renamed to "${editingSectionName.trim()}"!`);
                                                }
                                                if (e.key === 'Escape') setEditingSectionId(null);
                                            }}
                                            onBlur={() => {
                                                if (editingSectionName.trim() && editingSectionName.trim() !== sec.name) {
                                                    const upd = SECTIONS.map(s => s.id === sec.id ? { ...s, name: editingSectionName.trim() } : s);
                                                    updateSections(upd); showSaveMessage(`Section renamed!`);
                                                }
                                                setEditingSectionId(null);
                                            }}
                                            onClick={e => e.stopPropagation()} autoFocus
                                            style={{ flex: 1, padding: '0.3rem 0.5rem', borderRadius: '6px', border: '2px solid #3b82f6', fontSize: '0.9rem', fontWeight: 700, outline: 'none', background: 'white' }} />
                                    ) : (
                                        <span style={{ flex: 1, fontWeight: 700, fontSize: '0.95rem', color: selectedSectionId === sec.id ? 'white' : '#334155' }}>
                                            {sec.name}
                                            <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', fontWeight: 600, opacity: 0.7 }}>({sec.classes.length} classes)</span>
                                        </span>
                                    )}
                                    <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center', flexShrink: 0 }}>
                                        <button onClick={e => { e.stopPropagation(); setEditingSectionId(sec.id); setEditingSectionName(sec.name); }} title="Rename section"
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', borderRadius: '4px', display: 'flex', alignItems: 'center', color: selectedSectionId === sec.id ? 'rgba(255,255,255,0.7)' : '#94a3b8' }}>
                                            <Edit3 size={14} />
                                        </button>
                                        <button onClick={e => { e.stopPropagation(); if (idx === 0) return; const upd = [...SECTIONS]; void ([upd[idx - 1], upd[idx]] = [upd[idx], upd[idx - 1]]); updateSections(upd); }}
                                            disabled={idx === 0} title="Move up"
                                            style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', padding: '0.25rem', opacity: idx === 0 ? 0.3 : 1, display: 'flex', alignItems: 'center', color: selectedSectionId === sec.id ? 'rgba(255,255,255,0.7)' : '#94a3b8' }}>
                                            <ChevronUp size={16} />
                                        </button>
                                        <button onClick={e => { e.stopPropagation(); if (idx === SECTIONS.length - 1) return; const upd = [...SECTIONS]; void ([upd[idx], upd[idx + 1]] = [upd[idx + 1], upd[idx]]); updateSections(upd); }}
                                            disabled={idx === SECTIONS.length - 1} title="Move down"
                                            style={{ background: 'none', border: 'none', cursor: idx === SECTIONS.length - 1 ? 'default' : 'pointer', padding: '0.25rem', opacity: idx === SECTIONS.length - 1 ? 0.3 : 1, display: 'flex', alignItems: 'center', color: selectedSectionId === sec.id ? 'rgba(255,255,255,0.7)' : '#94a3b8' }}>
                                            <ChevronDown size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Selected section */}
                        {selectedSectionId && (() => {
                            const currentSection = (SECTIONS || []).find(s => s.id === selectedSectionId);
                            if (!currentSection) return <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>Select a section to manage classes.</div>;
                            return (
                                <div className="card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <h4 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{currentSection.name} Classes</h4>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <input type="text" placeholder="New Class Name" className="form-input"
                                                value={newClassName} onChange={e => setNewClassName(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter' && newClassName.trim()) {
                                                        const t = newClassName.trim();
                                                        if (currentSection.classes.includes(t)) { alert('Class already exists!'); return; }
                                                        const upd = SECTIONS.map(s => s.id === selectedSectionId ? { ...s, classes: [...s.classes, t] } : s);
                                                        updateSections(upd);
                                                        if (!CLASSES.includes(t)) updateClasses([...CLASSES, t]);
                                                        setNewClassName(''); showSaveMessage(`Class "${t}" added!`);
                                                    }
                                                }} style={{ width: '200px' }} />
                                            <button onClick={() => {
                                                const t = newClassName.trim();
                                                if (!t) return;
                                                if (currentSection.classes.includes(t)) { alert('Class already exists!'); return; }
                                                const upd = SECTIONS.map(s => s.id === selectedSectionId ? { ...s, classes: [...s.classes, t] } : s);
                                                updateSections(upd);
                                                if (!CLASSES.includes(t)) updateClasses([...CLASSES, t]);
                                                setNewClassName(''); showSaveMessage(`Class "${t}" added!`);
                                            }} className="btn btn-primary"><PlusCircle size={16} /> Add Class</button>
                                            <button onClick={() => {
                                                if (window.confirm(`Delete Section "${currentSection.name}"? This will NOT delete classes globally, just the grouping.`)) {
                                                    const upd = SECTIONS.filter(s => s.id !== selectedSectionId);
                                                    updateSections(upd); setSelectedSectionId(upd[0]?.id || null);
                                                }
                                            }} className="btn" style={{ color: '#ef4444', borderColor: '#ef4444', background: 'white' }}>
                                                <Trash2 size={16} /> Delete Section
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                        {currentSection.classes.map(cls => {
                                            const count = students.filter(s => s.grade === cls).length;
                                            const startSerialObj = CLASS_SERIAL_STARTS?.[cls] || {};
                                            const sBoys = typeof startSerialObj === 'object' && startSerialObj !== null ? startSerialObj.boys : (typeof startSerialObj === 'string' ? startSerialObj : '');
                                            const sGirls = typeof startSerialObj === 'object' && startSerialObj !== null ? startSerialObj.girls : '';
                                            const serialDisp = [sBoys ? `👦 ${sBoys}` : '', sGirls ? `👧 ${sGirls}` : ''].filter(Boolean).join(' • ');

                                            return (
                                                <div key={cls} onClick={() => setViewingClass(cls)}
                                                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                                                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                                                    onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}>
                                                    <h5 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem', color: '#1e293b' }}>{cls}</h5>
                                                    <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                        <Users size={14} /> {count} Students
                                                    </div>
                                                    {serialDisp && (
                                                        <div style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600, marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                            <Hash size={11} /> Starts: {serialDisp}
                                                        </div>
                                                    )}
                                                    <button onClick={e => {
                                                        e.stopPropagation();
                                                        if (window.confirm(`Remove "${cls}" from this section?`)) {
                                                            const upd = SECTIONS.map(s => s.id === selectedSectionId ? { ...s, classes: s.classes.filter(c => c !== cls) } : s);
                                                            updateSections(upd);
                                                        }
                                                    }} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.6 }} title="Remove from section">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                        {currentSection.classes.length === 0 && (
                                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '12px' }}>
                                                No classes in this section yet. Add one above!
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )
            }

        </div>
    );
};

export default ClassListsTab;
