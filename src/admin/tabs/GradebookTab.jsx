import React, { useState } from 'react';
import { Save, Download, Upload, Users, PlusCircle, X, Edit3, Check } from 'lucide-react';
import { calcGrade, gradeColor, calcOverallPct, getTermResults, filterByGender } from '../utils/gradeUtils';

const GradebookTab = ({
    students, selectedClass, setSelectedClass, sectionClasses,
    TERMS, SUBJECTS, WEIGHTS,
    gbTerm, setGbTerm, gbGenderTab, setGbGenderTab,
    gbEdits, setGbEdits, gbSaving, showGbStats, setShowGbStats,
    showGbSettings, setShowGbSettings,
    newSubjectInput, setNewSubjectInput, newTermInput, setNewTermInput,
    updateClassSubjects, updateTerms, updateWeights,
    saveGradebook, downloadGradebookTemplate, exportGradebookExcel,
    archiveTerm, exportResultPDF, importGradebookExcel,
    gbImportFileRef, getCellValue, handleCellEdit, saveRemarks,
    renameSubject, updateSubjectsForClasses,
}) => {
    const [editingSubject, setEditingSubject] = useState(null); // { oldName, newName }
    const [addSubjectClasses, setAddSubjectClasses] = useState([]); // selected additional classes
    const [showClassPicker, setShowClassPicker] = useState(false);

    const classSubjects = (SUBJECTS && !Array.isArray(SUBJECTS) ? (SUBJECTS[selectedClass] || []) : []);
    const getSubjectTotal = (sub, term) => {
        const t = term || gbTerm || TERMS[0] || 'Current';
        if (WEIGHTS) {
            if (WEIGHTS[t] && typeof WEIGHTS[t] === 'object' && WEIGHTS[t][sub] !== undefined && WEIGHTS[t][sub] !== '') return Number(WEIGHTS[t][sub]);
            if (typeof WEIGHTS[sub] === 'number') return Number(WEIGHTS[sub]);
        }
        return 100;
    };

    const allClassStudents = students.filter(s => s.grade === selectedClass);
    const classStudents = filterByGender(allClassStudents, gbGenderTab)
        .slice().sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
    const termLabel = gbTerm;

    const subjectStats = classSubjects.map(sub => {
        const subTotal = getSubjectTotal(sub);
        const vals = classStudents.map(s => {
            const termResults = getTermResults(s, termLabel);
            const r = termResults.find(r => r.subject === sub);
            const edited = gbEdits[s.id]?.[sub];
            const obtained = edited !== undefined ? Number(edited) : (r?.obtained ?? null);
            return obtained !== null ? Math.round((obtained / subTotal) * 100) : null;
        }).filter(v => v !== null);
        const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
        const high = vals.length ? Math.max(...vals) : 0;
        const pass = vals.filter(v => v >= 40).length;
        return { sub, avg, high, pass, total: vals.length };
    });

    const overallAvg = classStudents.length ? Math.round(
        classStudents.reduce((sum, s) => {
            const res = getTermResults(s, termLabel);
            return sum + calcOverallPct(res, getSubjectTotal);
        }, 0) / classStudents.length
    ) : 0;

    const passCount = classStudents.filter(s => {
        const res = getTermResults(s, termLabel);
        return calcOverallPct(res, getSubjectTotal) >= 40;
    }).length;

    const boysCount = allClassStudents.filter(s => s.admissions?.[0]?.gender === 'Male').length;
    const girlsCount = allClassStudents.filter(s => s.admissions?.[0]?.gender === 'Female').length;

    return (
        <div className="animate-fade-in">
            <input type="file" ref={gbImportFileRef} onChange={importGradebookExcel} accept=".xlsx,.xls" style={{ display: 'none' }} />

            {/* Header / Class Selection */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>📝 Manage Exams</h2>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0, marginTop: '0.2rem' }}>Configure subjects, manage terms, and enter marks</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Select Class</label>
                        <select className="form-input" style={{ padding: '0.5rem 1rem', minWidth: '180px', fontWeight: 700 }} value={selectedClass}
                            onChange={e => { setSelectedClass(e.target.value); setGbEdits({}); }}>
                            {sectionClasses.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <button onClick={() => setShowGbSettings(s => !s)} className={`btn ${showGbSettings ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.5rem 1rem', height: 'fit-content' }}>
                        ⚙️ Setup Subjects & Terms {showGbSettings ? '▲' : '▼'}
                    </button>
                </div>
            </div>

            {/* Settings Panel */}
            {showGbSettings && (
                <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.95rem' }}>⚙️ Gradebook Settings</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        {/* Subjects */}
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                Subjects <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 400 }}>— for "{selectedClass}"</span>
                            </div>
                            {/* Add Subject Row */}
                            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                                <input className="form-input" placeholder="Add subject…" value={newSubjectInput}
                                    onChange={e => setNewSubjectInput(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && newSubjectInput.trim()) {
                                            if (addSubjectClasses.length > 0 && updateSubjectsForClasses) {
                                                updateSubjectsForClasses(newSubjectInput.trim(), [selectedClass, ...addSubjectClasses]);
                                            } else {
                                                updateClassSubjects([...classSubjects, newSubjectInput.trim()]);
                                            }
                                            setNewSubjectInput(''); setAddSubjectClasses([]);
                                        }
                                    }}
                                    style={{ flex: 1, minWidth: '120px', padding: '0.35rem 0.6rem' }} />
                                <button className="btn" style={{ padding: '0.35rem 0.6rem', background: showClassPicker ? '#e0f2fe' : '#f8fafc', border: '1px solid #bae6fd', color: '#0369a1', fontSize: '0.75rem', fontWeight: 600 }}
                                    onClick={() => setShowClassPicker(p => !p)} title="Also add to other classes">
                                    📚 +Classes {addSubjectClasses.length > 0 ? `(${addSubjectClasses.length})` : ''}
                                </button>
                                <button className="btn btn-primary" style={{ padding: '0.35rem 0.75rem' }}
                                    onClick={() => {
                                        if (!newSubjectInput.trim()) return;
                                        if (addSubjectClasses.length > 0 && updateSubjectsForClasses) {
                                            updateSubjectsForClasses(newSubjectInput.trim(), [selectedClass, ...addSubjectClasses]);
                                        } else {
                                            updateClassSubjects([...classSubjects, newSubjectInput.trim()]);
                                        }
                                        setNewSubjectInput(''); setAddSubjectClasses([]);
                                    }}>
                                    <PlusCircle size={14} />
                                </button>
                            </div>
                            {/* Multi-class picker */}
                            {showClassPicker && (
                                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '0.6rem 0.75rem', marginBottom: '0.5rem' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369a1', marginBottom: '0.4rem' }}>Also add to these classes:</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                        {sectionClasses.filter(c => c !== selectedClass).map(c => (
                                            <button key={c} onClick={() => setAddSubjectClasses(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                                                style={{ padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', border: '1.5px solid', background: addSubjectClasses.includes(c) ? '#0369a1' : 'white', color: addSubjectClasses.includes(c) ? 'white' : '#0369a1', borderColor: '#0369a1', transition: 'all 0.15s' }}>
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* Subject chips with inline edit */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                {classSubjects.map(s => (
                                    editingSubject && editingSubject.oldName === s ? (
                                        <span key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: '#fffbeb', border: '1.5px solid #f59e0b', borderRadius: '999px', padding: '0.1rem 0.4rem' }}>
                                            <input autoFocus value={editingSubject.newName}
                                                onChange={e => setEditingSubject(p => ({ ...p, newName: e.target.value }))}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter' && editingSubject.newName.trim()) {
                                                        if (renameSubject) renameSubject(editingSubject.oldName, editingSubject.newName.trim());
                                                        setEditingSubject(null);
                                                    }
                                                    if (e.key === 'Escape') setEditingSubject(null);
                                                }}
                                                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.8rem', fontWeight: 700, color: '#92400e', width: `${Math.max(60, editingSubject.newName.length * 8)}px` }} />
                                            <button onClick={() => { if (renameSubject && editingSubject.newName.trim()) renameSubject(editingSubject.oldName, editingSubject.newName.trim()); setEditingSubject(null); }}
                                                style={{ background: '#f59e0b', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', borderRadius: '50%', padding: '1px' }}><Check size={11} /></button>
                                            <button onClick={() => setEditingSubject(null)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', display: 'flex', alignItems: 'center' }}><X size={11} /></button>
                                        </span>
                                    ) : (
                                        <span key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#e0f2fe', color: '#0369a1', borderRadius: '999px', padding: '0.2rem 0.5rem 0.2rem 0.7rem', fontSize: '0.8rem', fontWeight: 600 }}>
                                            {s}
                                            <button onClick={() => setEditingSubject({ oldName: s, newName: s })} title="Rename subject"
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0369a1', display: 'flex', alignItems: 'center', opacity: 0.7, padding: '1px' }}><Edit3 size={11} /></button>
                                            <button onClick={() => updateClassSubjects(classSubjects.filter(x => x !== s))}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}><X size={12} /></button>
                                        </span>
                                    )
                                ))}
                                {classSubjects.length === 0 && <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>No subjects yet. Add one above.</span>}
                            </div>
                        </div>
                        {/* Terms */}
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>Terms</div>
                            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
                                <input className="form-input" placeholder="Add term…" value={newTermInput}
                                    onChange={e => setNewTermInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && newTermInput.trim()) { updateTerms([...TERMS, newTermInput.trim()]); setNewTermInput(''); } }}
                                    style={{ flex: 1, padding: '0.35rem 0.6rem' }} />
                                <button className="btn btn-primary" style={{ padding: '0.35rem 0.75rem' }}
                                    onClick={() => { if (newTermInput.trim()) { updateTerms([...TERMS, newTermInput.trim()]); setNewTermInput(''); } }}>
                                    <PlusCircle size={14} />
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                {TERMS.map(t => (
                                    <span key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#f3e8ff', color: '#7c3aed', borderRadius: '999px', padding: '0.2rem 0.7rem', fontSize: '0.8rem', fontWeight: 600 }}>
                                        {t}
                                        <button onClick={() => updateTerms(TERMS.filter(x => x !== t))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', display: 'flex', alignItems: 'center' }}><X size={12} /></button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* Subject Totals */}
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>📝 Subject Total Marks</div>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1d4ed8', background: '#dbeafe', borderRadius: '999px', padding: '0.15rem 0.6rem' }}>
                                Grand Total: {classSubjects.reduce((s, sub) => s + getSubjectTotal(sub), 0)} marks
                            </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.5rem' }}>
                            {classSubjects.map(sub => {
                                const currentTerm = gbTerm || TERMS[0] || 'Current';
                                const fallbackW = (WEIGHTS && typeof WEIGHTS[sub] === 'number') ? WEIGHTS[sub] : 100;
                                let currentW = fallbackW;

                                if (WEIGHTS && WEIGHTS[currentTerm] && typeof WEIGHTS[currentTerm] === 'object' && WEIGHTS[currentTerm][sub] !== undefined) {
                                    currentW = WEIGHTS[currentTerm][sub];
                                }

                                return (
                                    <div key={sub} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.4rem 0.6rem' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</span>
                                        <input type="number" min="1" max="9999" value={currentW} placeholder={fallbackW}
                                            onChange={e => {
                                                const rawVal = e.target.value;
                                                const termLabel = gbTerm || TERMS[0] || 'Current';

                                                // Deep clone WEIGHTS slightly to avoid mutating current state objects directly
                                                const newW = { ...WEIGHTS };
                                                if (!newW[termLabel] || typeof newW[termLabel] !== 'object') {
                                                    newW[termLabel] = {};
                                                } else {
                                                    newW[termLabel] = { ...newW[termLabel] };
                                                }

                                                if (rawVal === '') {
                                                    newW[termLabel][sub] = '';
                                                } else {
                                                    newW[termLabel][sub] = Number(rawVal);
                                                }
                                                updateWeights(newW);
                                            }}
                                            style={{ width: '60px', padding: '0.25rem 0.35rem', border: '1px solid #d1d5db', borderRadius: '6px', textAlign: 'center', fontSize: '0.82rem', fontWeight: 700 }}
                                        />
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>pts</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Term Selection Grid */}
            {!termLabel && (
                <div style={{ marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '1.5px', margin: 0 }}>
                            Select Term / Exam Type
                        </h3>
                    </div>
                    {TERMS.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                            No terms added yet. Open settings above to add a new term.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                            {TERMS.map(term => {
                                const isSelected = termLabel === term;
                                return (
                                    <button
                                        key={term}
                                        onClick={() => { setGbTerm(term); setGbEdits({}); }}
                                        className="hover-scale"
                                        style={{
                                            padding: '1.75rem 1rem',
                                            borderRadius: '16px',
                                            border: isSelected ? '2px solid #2563eb' : '2px solid transparent',
                                            background: isSelected ? '#eff6ff' : 'white',
                                            color: isSelected ? '#1d4ed8' : '#475569',
                                            fontWeight: isSelected ? 800 : 600,
                                            fontSize: '1.1rem',
                                            boxShadow: isSelected ? '0 8px 20px rgba(37,99,235,0.15)' : '0 4px 12px rgba(0,0,0,0.05)',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.75rem'
                                        }}
                                    >
                                        <span style={{ fontSize: '1.75rem', transition: 'transform 0.3s' }} className={isSelected ? 'scale-110' : ''}>
                                            {isSelected ? '📂' : '📁'}
                                        </span>
                                        {term}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Active Term Detail Area */}
            {termLabel && TERMS.includes(termLabel) && (
                <div className="animate-slide-in" style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)' }}>
                    {/* Header of Term Area */}
                    <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(to right, #f8fafc, white)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button onClick={() => setGbTerm('')} className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', color: '#64748b' }}>
                                ← Back
                            </button>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 700 }}>{selectedClass}</span>
                                {termLabel} Results
                            </h3>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button onClick={saveGradebook} disabled={gbSaving} className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
                                <Save size={16} /> {gbSaving ? 'Saving…' : 'Save Details'}
                            </button>
                            <button onClick={downloadGradebookTemplate} className="btn" style={{ background: '#10b981', color: 'white', borderColor: '#10b981', padding: '0.5rem 1rem' }}>
                                <Download size={16} /> Template
                            </button>
                            <button onClick={() => gbImportFileRef.current.click()} className="btn" style={{ background: '#3b82f6', color: 'white', borderColor: '#3b82f6', padding: '0.5rem 1rem' }}>
                                <Upload size={16} /> Import
                            </button>
                            <button onClick={exportGradebookExcel} className="btn" style={{ background: '#217346', color: 'white', borderColor: '#217346', padding: '0.5rem 1rem' }}>
                                <Download size={16} /> Export Term
                            </button>
                            <button onClick={exportResultPDF} className="btn" style={{ background: '#dc2626', color: 'white', borderColor: '#dc2626', padding: '0.5rem 1rem' }}>
                                📄 PDF Reports
                            </button>
                        </div>
                    </div>

                    <div style={{ padding: '2rem' }}>
                        {/* Gender Tabs */}
                        <div style={{ display: 'flex', marginBottom: '1.5rem', borderRadius: '12px 12px 0 0', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                            {[
                                { id: 'boys', label: '👦 Boys', count: boysCount, color: '#0369a1', bg: '#e0f2fe' },
                                { id: 'girls', label: '👧 Girls', count: girlsCount, color: '#be185d', bg: '#fce7f3' },
                                { id: 'all', label: '👥 All Students', count: allClassStudents.length, color: '#475569', bg: '#f1f5f9' }
                            ].map(tab => (
                                <button key={tab.id} onClick={() => setGbGenderTab(tab.id)} style={{
                                    flex: 1, padding: '0.85rem 1rem', fontWeight: gbGenderTab === tab.id ? 800 : 600, fontSize: '0.95rem',
                                    color: gbGenderTab === tab.id ? tab.color : '#94a3b8',
                                    background: gbGenderTab === tab.id ? tab.bg : 'transparent', border: 'none',
                                    borderBottom: gbGenderTab === tab.id ? `3px solid ${tab.color}` : '3px solid transparent',
                                    cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                }}>
                                    {tab.label}
                                    <span style={{ background: gbGenderTab === tab.id ? tab.color : '#cbd5e1', color: 'white', borderRadius: '999px', padding: '0.15rem 0.6rem', fontSize: '0.75rem', fontWeight: 700 }}>
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Class Statistics */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <button onClick={() => setShowGbStats(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.95rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', padding: '0.5rem', borderRadius: '8px', transition: 'background 0.2s', ...(showGbStats ? {} : { background: '#f8fafc', border: '1px solid #e2e8f0' }) }}>
                                📈 Class Statistics {showGbStats ? '▲' : '▼'}
                            </button>
                            {showGbStats && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                                    <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', color: 'white', borderRadius: '12px', padding: '1rem' }}>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '0.2rem' }}>Class Average</div>
                                        <div style={{ fontSize: '2rem', fontWeight: 800 }}>{overallAvg}%</div>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{classStudents.length} students • {calcGrade(overallAvg)} overall</div>
                                    </div>
                                    <div style={{ background: 'linear-gradient(135deg, #059669, #10b981)', color: 'white', borderRadius: '12px', padding: '1rem' }}>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '0.2rem' }}>Pass Rate</div>
                                        <div style={{ fontSize: '2rem', fontWeight: 800 }}>{classStudents.length ? Math.round((passCount / classStudents.length) * 100) : 0}%</div>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{passCount} / {classStudents.length} passed (≥40%)</div>
                                    </div>
                                    {subjectStats.map(({ sub, avg, high, pass, total }) => {
                                        const gc = gradeColor(avg);
                                        return (
                                            <div key={sub} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
                                                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#1e293b' }}>{sub}</div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b' }}>
                                                    <span>Avg: <b style={{ color: gc.text }}>{avg}%</b></span>
                                                    <span>High: <b style={{ color: '#15803d' }}>{high}%</b></span>
                                                    <span>Pass: <b>{pass}/{total}</b></span>
                                                </div>
                                                <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden', marginTop: '0.5rem' }}>
                                                    <div style={{ width: `${avg}%`, height: '100%', background: gc.text, borderRadius: '999px', transition: 'width 0.8s ease' }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Gradebook Table */}
                        {classStudents.length === 0 ? (
                            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8', border: '1px dashed #cbd5e1', boxShadow: 'none' }}>
                                <Users size={56} style={{ margin: '0 auto 1.5rem', color: '#e2e8f0' }} />
                                <h3 style={{ fontSize: '1.2rem', color: '#475569', marginBottom: '0.5rem' }}>No Students Found</h3>
                                <p style={{ fontSize: '0.95rem' }}>There are no {gbGenderTab !== 'all' ? gbGenderTab : 'students'} in {selectedClass} yet.</p>
                            </div>
                        ) : (
                            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                {Object.keys(gbEdits).length > 0 && (
                                    <div className="animate-fade-in" style={{ padding: '0.75rem 1.25rem', background: '#fef9c3', borderBottom: '1px solid #fef08a', color: '#854d0e', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#eab308', animation: 'pulse 2s infinite' }} />
                                        You have unsaved changes. Click <b>Save Details</b> to apply.
                                    </div>
                                )}
                                <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '65vh', borderBottom: '1px solid #e2e8f0' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: `${300 + classSubjects.length * 110}px` }}>
                                        <thead>
                                            <tr style={{ background: '#0f172a', color: 'white' }}>
                                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.85rem', position: 'sticky', left: 0, top: 0, background: '#0f172a', zIndex: 20, minWidth: '180px' }}>Student</th>
                                                {classSubjects.map(sub => (
                                                    <th key={sub} style={{ padding: '1rem 0.5rem', textAlign: 'center', fontWeight: 700, fontSize: '0.85rem', minWidth: '110px', position: 'sticky', top: 0, background: '#0f172a', zIndex: 10 }}>
                                                        {sub}<br /><span style={{ opacity: 0.7, fontWeight: 500, fontSize: '0.75rem' }}>/{getSubjectTotal(sub, gbTerm)}</span>
                                                    </th>
                                                ))}
                                                <th style={{ padding: '1rem 0.5rem', textAlign: 'center', fontWeight: 700, fontSize: '0.85rem', minWidth: '90px', background: '#1e293b', position: 'sticky', top: 0, zIndex: 10 }}>Total Obt.</th>
                                                <th style={{ padding: '1rem 0.5rem', textAlign: 'center', fontWeight: 700, fontSize: '0.85rem', minWidth: '70px', background: '#1e293b', position: 'sticky', top: 0, zIndex: 10 }}>Grade</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {classStudents.map((student, rowIdx) => {
                                                const subResults = classSubjects.map(sub => {
                                                    const val = getCellValue(student, sub);
                                                    if (val === '') return null;
                                                    const isAbsent = typeof val === 'string' && val.trim().toUpperCase() === 'A';
                                                    const numVal = isAbsent ? 0 : Number(val);
                                                    return { subject: sub, obtained: numVal, percentage: isAbsent ? 0 : Math.round((numVal / getSubjectTotal(sub)) * 100) };
                                                }).filter(Boolean);
                                                const rowAvg = subResults.length ? calcOverallPct(subResults, getSubjectTotal) : null;
                                                const rowTotalObtained = subResults.reduce((sum, r) => sum + r.obtained, 0);
                                                const rowMaxMarks = subResults.reduce((sum, r) => sum + getSubjectTotal(r.subject), 0);
                                                const rowGrade = rowAvg !== null ? calcGrade(rowAvg) : '—';
                                                const rowGc = rowAvg !== null ? gradeColor(rowAvg) : { bg: '#f8fafc', text: '#94a3b8' };
                                                return (
                                                    <tr key={student.id} style={{ borderTop: '1px solid #e2e8f0', background: rowIdx % 2 === 0 ? 'white' : '#f8fafc', transition: 'background 0.2s' }}>
                                                        <td style={{ padding: '0.75rem 1rem', position: 'sticky', left: 0, background: rowIdx % 2 === 0 ? 'white' : '#f8fafc', zIndex: 1, borderRight: '1px solid #e2e8f0' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontWeight: 700, fontSize: '0.8rem' }}>
                                                                    {student.name.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>{student.name}</div>
                                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{student.id}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        {classSubjects.map(sub => {
                                                            const subTotal = getSubjectTotal(sub);
                                                            const val = getCellValue(student, sub);
                                                            const isAbsent = typeof val === 'string' && val.trim().toUpperCase() === 'A';
                                                            const pct = val !== '' ? (isAbsent ? 0 : Math.round((Number(val) / subTotal) * 100)) : null;
                                                            const gc = pct !== null ? gradeColor(pct) : { bg: 'transparent', text: '#94a3b8' };
                                                            const isDirty = gbEdits[student.id]?.[sub] !== undefined;
                                                            return (
                                                                <td key={sub} style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>
                                                                    <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                                                                        <input type="text" value={val}
                                                                            id={`input-${encodeURIComponent(sub)}-${rowIdx}`}
                                                                            onKeyDown={e => {
                                                                                if (e.key === 'Enter' || e.key === 'ArrowDown') {
                                                                                    e.preventDefault();
                                                                                    const nextInput = document.getElementById(`input-${encodeURIComponent(sub)}-${rowIdx + 1}`);
                                                                                    if (nextInput) {
                                                                                        nextInput.focus();
                                                                                        setTimeout(() => nextInput.select(), 10);
                                                                                    }
                                                                                } else if (e.key === 'ArrowUp') {
                                                                                    e.preventDefault();
                                                                                    const prevInput = document.getElementById(`input-${encodeURIComponent(sub)}-${rowIdx - 1}`);
                                                                                    if (prevInput) {
                                                                                        prevInput.focus();
                                                                                        setTimeout(() => prevInput.select(), 10);
                                                                                    }
                                                                                }
                                                                            }}
                                                                            placeholder="-"
                                                                            onChange={e => handleCellEdit(student.id, sub, e.target.value)}
                                                                            style={{ width: '70px', padding: '0.4rem', textAlign: 'center', borderRadius: '8px', border: isDirty ? '2px solid #3b82f6' : '1px solid #cbd5e1', background: gc.bg, color: gc.text, fontWeight: 700, fontSize: '0.95rem', outline: 'none', transition: 'all 0.2s' }} />
                                                                        {pct !== null && (
                                                                            <div style={{ fontSize: '0.7rem', color: gc.text, fontWeight: 700, marginTop: '4px' }}>
                                                                                {isAbsent ? 'Absent' : `${pct}%`} · {isAbsent ? 'F' : calcGrade(pct)}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}
                                                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', background: rowGc.bg }}>
                                                            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: rowGc.text }}>{rowAvg !== null ? `${rowTotalObtained}` : '—'}</div>
                                                            {rowAvg !== null && <div style={{ fontSize: '0.7rem', color: rowGc.text, opacity: 0.8 }}>/ {rowMaxMarks}</div>}
                                                        </td>
                                                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', background: rowGc.bg }}>
                                                            <span style={{ display: 'inline-block', background: rowGc.text, color: 'white', borderRadius: '8px', padding: '0.25rem 0.6rem', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>{rowGrade}</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 800 }}>Grading Scale:</span>
                                    {[['A+', '≥90', '#dcfce7', '#15803d'], ['A', '≥80', '#dcfce7', '#15803d'], ['B+', '≥70', '#dbeafe', '#1d4ed8'], ['B', '≥60', '#dbeafe', '#1d4ed8'], ['C', '≥50', '#fef9c3', '#a16207'], ['D', '≥40', '#ffedd5', '#c2410c'], ['F', '<40', '#fee2e2', '#dc2626']].map(([g, r, bg, col]) => (
                                        <span key={g} style={{ background: bg, color: col, border: `1px solid ${col}33`, borderRadius: '6px', padding: '0.2rem 0.6rem', fontSize: '0.8rem', fontWeight: 700 }}>{g} {r}%</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GradebookTab;
