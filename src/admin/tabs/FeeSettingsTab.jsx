import React, { useState, useEffect, useMemo } from 'react';
import { Save, ChevronDown, ChevronRight, AlertTriangle, Check, RefreshCw, Settings } from 'lucide-react';
import { useSchoolData } from '../../context/SchoolDataContext';

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */
function classSort(a, b) {
    const nA = parseInt((a || '').match(/\d+/)?.[0] || '999');
    const nB = parseInt((b || '').match(/\d+/)?.[0] || '999');
    return nA !== nB ? nA - nB : (a || '').localeCompare(b || '');
}

const EMPTY_DEFAULTS = { tuitionFee: 0, admissionFee: 0, paperFund: 0, finePerAbsent: 0 };

const FIELD_CONFIG = [
    { key: 'tuitionFee',    label: 'Tuition Fee',   hint: 'Monthly',  color: '#2563eb' },
    { key: 'admissionFee',  label: 'Admission',     hint: 'One-time', color: '#7c3aed' },
    { key: 'paperFund',     label: 'Paper Fund',    hint: 'Annual',   color: '#0891b2' },
    { key: 'finePerAbsent', label: 'Fine/Absent',   hint: 'Per day',  color: '#dc2626' },
];

/* Merge two default objects, using b's values when present */
function mergeDefaults(base, override) {
    return { ...EMPTY_DEFAULTS, ...base, ...override };
}

/* ─────────────────────────────────────────────────────────────────────────────
   FEE FIELD ROW  (compact input group)
───────────────────────────────────────────────────────────────────────────── */
const FeeFields = ({ values, onChange, currencySymbol, compact = false, disabled = false }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: compact ? '.4rem' : '.65rem' }}>
        {FIELD_CONFIG.map(f => (
            <div key={f.key}>
                <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, color: '#64748b', marginBottom: '.2rem', textTransform: 'uppercase', letterSpacing: '.3px' }}>
                    {f.label}
                    <span style={{ display: 'inline-block', background: f.color + '18', color: f.color, borderRadius: '999px', padding: '0 5px', fontSize: '.62rem', marginLeft: '.3rem', fontWeight: 700 }}>{f.hint}</span>
                </label>
                <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '.75rem', fontWeight: 700, pointerEvents: 'none' }}>{currencySymbol}</span>
                    <input
                        type="number"
                        min="0"
                        value={values?.[f.key] ?? 0}
                        onChange={e => onChange(f.key, Number(e.target.value) || 0)}
                        disabled={disabled}
                        className="form-input"
                        style={{ paddingLeft: '28px', width: '100%', fontSize: '.85rem', fontWeight: 700, opacity: disabled ? .45 : 1, background: disabled ? '#f8fafc' : 'white' }}
                    />
                </div>
            </div>
        ))}
    </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   MODE TOGGLE PILL
───────────────────────────────────────────────────────────────────────────── */
const ModeToggle = ({ value, onChange }) => (
    <div style={{ display: 'inline-flex', borderRadius: '8px', border: '1.5px solid #e2e8f0', overflow: 'hidden', flexShrink: 0 }}>
        {['auto', 'manual'].map(m => (
            <button
                key={m}
                onClick={() => onChange(m)}
                style={{
                    padding: '.3rem .75rem', fontSize: '.77rem', fontWeight: 800, border: 'none', cursor: 'pointer', transition: 'all .15s',
                    background: value === m ? (m === 'auto' ? '#2563eb' : '#f59e0b') : 'white',
                    color: value === m ? 'white' : '#94a3b8',
                    textTransform: 'uppercase', letterSpacing: '.4px',
                }}
            >
                {m === 'auto' ? '⚡ Auto' : '✏️ Manual'}
            </button>
        ))}
    </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */
const FeeSettingsTab = ({
    sections,
    sectionClasses,
    CLASS_FEE_DEFAULTS,
    updateClassFeeDefaults,
    currencySymbol = 'RS',
    showSaveMessage,
}) => {
    const { saveFeeSettings, feeSettings: savedFeeSettings } = useSchoolData();

    /* ── Init state from saved settings ──────────────────────────────────── */
    const [schoolMode,      setSchoolMode]      = useState('auto');
    const [globalDef,       setGlobalDef]       = useState({ ...EMPTY_DEFAULTS });
    const [sectionModes,    setSectionModes]    = useState({});
    const [sectionDefs,     setSectionDefs]     = useState({});
    const [classDefs,       setClassDefs]       = useState({});
    const [expandedSec,     setExpandedSec]     = useState({});
    const [saving,          setSaving]          = useState(false);
    const [warnModal,       setWarnModal]       = useState(null); // { action, label }
    const [dirty,           setDirty]           = useState(false);

    /* ── Load saved settings on mount ─────────────────────────────────────── */
    useEffect(() => {
        const fs = savedFeeSettings || {};
        const saved = {
            schoolMode:   fs.schoolMode   || 'auto',
            globalDef:    fs.globalDef    || { ...EMPTY_DEFAULTS },
            sectionModes: fs.sectionModes || {},
            sectionDefs:  fs.sectionDefs  || {},
            classDefs:    fs.classDefs    || { ...(CLASS_FEE_DEFAULTS || {}) },
        };
        setSchoolMode(saved.schoolMode);
        setGlobalDef(saved.globalDef);
        setSectionModes(saved.sectionModes);
        setSectionDefs(saved.sectionDefs);
        setClassDefs(saved.classDefs);
        // expand all sections by default
        const exp = {};
        (sections || []).forEach(s => { exp[s.id] = true; });
        setExpandedSec(exp);
    }, [savedFeeSettings]);

    /* ── Sorted section list ─────────────────────────────────────────────── */
    const sectionList = useMemo(() =>
        (sections || []).map(sec => ({
            ...sec,
            sortedClasses: [...(sec.classes || [])].sort(classSort),
        })),
        [sections]
    );
    const allClasses = useMemo(() => [...(sectionClasses || [])].sort(classSort), [sectionClasses]);

    /* ── Derive which classes belong to no section ───────────────────────── */
    const sectionedClasses = new Set(sectionList.flatMap(s => s.classes || []));
    const unsectionedClasses = allClasses.filter(c => !sectionedClasses.has(c));

    /* ── Helpers to update state ─────────────────────────────────────────── */
    const updateGlobal = (key, val) => { setGlobalDef(p => ({ ...p, [key]: val })); setDirty(true); };
    const updateSectionDef = (secId, key, val) => { setSectionDefs(p => ({ ...p, [secId]: { ...EMPTY_DEFAULTS, ...p[secId], [key]: val } })); setDirty(true); };
    const updateClassDef = (cls, key, val) => { setClassDefs(p => ({ ...p, [cls]: { ...EMPTY_DEFAULTS, ...p[cls], [key]: val } })); setDirty(true); };

    /* ── Apply global to all classes ──────────────────────────────────────── */
    const applyGlobalToAll = () => {
        const newCls = {};
        allClasses.forEach(c => { newCls[c] = { ...globalDef }; });
        setClassDefs(newCls);
        setDirty(true);
    };

    /* ── Apply section defaults to all classes in that section ───────────── */
    const applySectionToClasses = (secId, classes) => {
        const def = sectionDefs[secId] || globalDef;
        setClassDefs(p => {
            const next = { ...p };
            classes.forEach(c => { next[c] = { ...def }; });
            return next;
        });
        setDirty(true);
    };

    /* ── School-level mode change ─────────────────────────────────────────── */
    const handleSchoolModeChange = (newMode) => {
        if (newMode === 'auto') {
            setWarnModal({
                label: 'Switch to Auto (School-wide)',
                msg: 'This will apply the global values to ALL classes immediately. Individual class settings will be overwritten.',
                onConfirm: () => { setSchoolMode('auto'); applyGlobalToAll(); setWarnModal(null); }
            });
        } else {
            setSchoolMode('manual');
            setDirty(true);
        }
    };

    /* ── Section-level mode change ────────────────────────────────────────── */
    const handleSectionModeChange = (secId, classes, newMode) => {
        if (newMode === 'auto') {
            applySectionToClasses(secId, classes);
        }
        setSectionModes(p => ({ ...p, [secId]: newMode }));
        setDirty(true);
    };

    /* ── Save all ─────────────────────────────────────────────────────────── */
    const handleSave = async () => {
        setSaving(true);
        // 1. Save fee settings metadata
        const settingsPayload = { schoolMode, globalDef, sectionModes, sectionDefs, classDefs };
        if (saveFeeSettings) await saveFeeSettings(settingsPayload);

        // 2. Sync CLASS_FEE_DEFAULTS with resolved per-class values
        //    So FeeTab, PayFeesTab, and vouchers all use same source of truth
        const resolvedDefaults = {};
        allClasses.forEach(cls => {
            resolvedDefaults[cls] = {
                tuitionFee:   classDefs[cls]?.tuitionFee   ?? globalDef.tuitionFee,
                admissionFee: classDefs[cls]?.admissionFee ?? globalDef.admissionFee,
                paperFund:    classDefs[cls]?.paperFund    ?? globalDef.paperFund,
                finePerAbsent:classDefs[cls]?.finePerAbsent?? globalDef.finePerAbsent,
            };
        });
        await updateClassFeeDefaults(resolvedDefaults);

        setSaving(false);
        setDirty(false);
        if (showSaveMessage) showSaveMessage('Fee settings saved successfully!');
    };

    /* ─────────────────────────────────────────────────────────────────────
       RENDER
    ───────────────────────────────────────────────────────────────────── */
    return (
        <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* ── Warning Modal ──────────────────────────────────────────── */}
            {warnModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ background: 'white', borderRadius: '16px', maxWidth: '400px', width: '100%', padding: '1.75rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,.25)' }} className="animate-fade-in">
                        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <AlertTriangle size={22} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div>
                                <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem', marginBottom: '.4rem' }}>{warnModal.label}</div>
                                <div style={{ color: '#64748b', fontSize: '.85rem' }}>{warnModal.msg}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '.65rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setWarnModal(null)} style={{ padding: '.55rem 1.1rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 600, cursor: 'pointer', color: '#475569' }}>Cancel</button>
                            <button onClick={warnModal.onConfirm} style={{ padding: '.55rem 1.25rem', borderRadius: '8px', border: 'none', background: '#2563eb', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.75rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                        <Settings size={22} /> Fee Settings
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '.82rem', margin: '3px 0 0' }}>
                        Configure default fees, fines and paper fund per class or school-wide.
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving || !dirty}
                    style={{ padding: '.6rem 1.4rem', background: dirty ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : '#f1f5f9', color: dirty ? 'white' : '#94a3b8', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: dirty ? 'pointer' : 'not-allowed', fontSize: '.88rem', display: 'flex', alignItems: 'center', gap: '.4rem', boxShadow: dirty ? '0 2px 8px rgba(37,99,235,.3)' : 'none', transition: 'all .2s' }}
                >
                    {saving ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : <><Save size={15} /> Save All</>}
                </button>
            </div>

            {/* ── Legend ─────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
                {FIELD_CONFIG.map(f => (
                    <span key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.75rem', fontWeight: 700, color: f.color }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: f.color, display: 'inline-block' }}></span>
                        {f.label} <span style={{ color: '#94a3b8', fontWeight: 500 }}>({f.hint})</span>
                    </span>
                ))}
            </div>

            {/* ════════════════════════════════════════════════════════════
                SCHOOL-WIDE LEVEL
            ════════════════════════════════════════════════════════════ */}
            <div style={{ background: 'white', borderRadius: '14px', border: '2px solid #e2e8f0', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.65rem' }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b' }}>🏫 School-wide Defaults</div>
                        <div style={{ fontSize: '.78rem', color: '#64748b', marginTop: '2px' }}>
                            {schoolMode === 'auto'
                                ? '⚡ Auto — these values apply to every class in the school'
                                : '✏️ Manual — configure per section below'}
                        </div>
                    </div>
                    <ModeToggle value={schoolMode} onChange={handleSchoolModeChange} />
                </div>

                <FeeFields
                    values={globalDef}
                    onChange={updateGlobal}
                    currencySymbol={currencySymbol}
                    disabled={schoolMode === 'manual'}
                />

                {schoolMode === 'auto' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', background: '#eff6ff', borderRadius: '8px', padding: '.55rem .85rem', fontSize: '.8rem', color: '#2563eb', fontWeight: 600 }}>
                        <Check size={14} /> These values will be applied to all {allClasses.length} classes when you click <strong>Save All</strong>
                    </div>
                )}
            </div>

            {/* ════════════════════════════════════════════════════════════
                SECTIONS (visible only in manual mode)
            ════════════════════════════════════════════════════════════ */}
            {schoolMode === 'manual' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                    <div style={{ fontSize: '.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.5px' }}>
                        Sections &amp; Classes
                    </div>

                    {/* Sections with classes */}
                    {sectionList.map(sec => {
                        const secMode = sectionModes[sec.id] || 'auto';
                        const secDef  = sectionDefs[sec.id] || { ...globalDef };

                        return (
                            <div key={sec.id} style={{ background: 'white', borderRadius: '12px', border: '1.5px solid #e2e8f0', overflow: 'hidden' }}>
                                {/* Section header */}
                                <div style={{ padding: '.9rem 1.1rem', borderBottom: secMode === 'manual' && expandedSec[sec.id] ? '1px solid #e2e8f0' : 'none', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap' }}>
                                    <button
                                        onClick={() => setExpandedSec(p => ({ ...p, [sec.id]: !p[sec.id] }))}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', gap: '.35rem', fontWeight: 800, fontSize: '.95rem', color: '#1e293b', padding: 0 }}
                                    >
                                        {expandedSec[sec.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        📚 {sec.name}
                                        <span style={{ background: '#e2e8f0', color: '#64748b', borderRadius: '999px', padding: '0 8px', fontSize: '.72rem', fontWeight: 700 }}>{sec.sortedClasses.length} classes</span>
                                    </button>

                                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                                        <ModeToggle value={secMode} onChange={m => handleSectionModeChange(sec.id, sec.sortedClasses, m)} />
                                    </div>
                                </div>

                                {/* Section-level auto defaults */}
                                {expandedSec[sec.id] && (
                                    <div style={{ padding: '1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                                        <div>
                                            <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '.5rem' }}>
                                                {secMode === 'auto' ? `Section Default — applies to all classes in ${sec.name}` : `Section Reference — used when switching to Auto`}
                                            </div>
                                            <FeeFields
                                                values={secDef}
                                                onChange={(key, val) => updateSectionDef(sec.id, key, val)}
                                                currencySymbol={currencySymbol}
                                                compact
                                            />
                                            {secMode === 'auto' && (
                                                <button
                                                    onClick={() => applySectionToClasses(sec.id, sec.sortedClasses)}
                                                    style={{ marginTop: '.55rem', padding: '.35rem .85rem', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '7px', fontWeight: 700, fontSize: '.76rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.3rem' }}
                                                >
                                                    <Check size={13} /> Apply to all {sec.sortedClasses.length} classes in {sec.name}
                                                </button>
                                            )}
                                        </div>

                                        {/* Per-class boxes (manual mode only) */}
                                        {secMode === 'manual' && (
                                            <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '.85rem', display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
                                                <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.4px' }}>Individual Classes</div>
                                                {sec.sortedClasses.map(cls => (
                                                    <div key={cls} style={{ background: '#f8fafc', borderRadius: '10px', padding: '.7rem .85rem', border: '1px solid #e2e8f0' }}>
                                                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '.85rem', marginBottom: '.45rem' }}>{cls}</div>
                                                        <FeeFields
                                                            values={classDefs[cls] || secDef}
                                                            onChange={(key, val) => updateClassDef(cls, key, val)}
                                                            currencySymbol={currencySymbol}
                                                            compact
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Unsectioned classes */}
                    {unsectionedClasses.length > 0 && (
                        <div style={{ background: 'white', borderRadius: '12px', border: '1.5px solid #fde68a', overflow: 'hidden' }}>
                            <div style={{ padding: '.75rem 1rem', background: '#fffbeb', borderBottom: '1px solid #fde68a', fontWeight: 700, color: '#b45309', fontSize: '.85rem' }}>
                                ⚠ Classes without a Section ({unsectionedClasses.length})
                            </div>
                            <div style={{ padding: '.9rem 1rem', display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                                {unsectionedClasses.map(cls => (
                                    <div key={cls} style={{ background: '#f8fafc', borderRadius: '9px', padding: '.65rem .85rem', border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '.84rem', marginBottom: '.4rem' }}>{cls}</div>
                                        <FeeFields
                                            values={classDefs[cls] || globalDef}
                                            onChange={(key, val) => updateClassDef(cls, key, val)}
                                            currencySymbol={currencySymbol}
                                            compact
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Save reminder ──────────────────────────────────────────── */}
            {dirty && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '.65rem 1rem', fontSize: '.82rem', color: '#b45309', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>⚠ You have unsaved changes</span>
                    <button onClick={handleSave} disabled={saving} style={{ padding: '.35rem .9rem', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '7px', fontWeight: 700, cursor: 'pointer', fontSize: '.8rem' }}>
                        {saving ? 'Saving…' : 'Save Now'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default FeeSettingsTab;
