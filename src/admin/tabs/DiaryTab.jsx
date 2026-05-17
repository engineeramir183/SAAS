import React, { useState, useEffect } from 'react';
import {
    BookOpen, Plus, Trash2, Edit3, Send, ChevronDown,
    AlertCircle, CheckCircle, Clock, Users, User,
    BookMarked, ClipboardList, Megaphone, Star, X, Calendar, Eye
} from 'lucide-react';
import { useSchoolData } from '../../context/SchoolDataContext';
import { sendWhatsAppMessage, WhatsAppTemplates } from '../../services/WhatsAppService';

// ─── Type config (icon + colour) ─────────────────────────────────────────────
const TYPE_CONFIG = {
    Homework:  { icon: BookOpen,      color: '#3b82f6', bg: '#eff6ff',  label: 'Homework'  },
    Classwork: { icon: ClipboardList, color: '#8b5cf6', bg: '#f5f3ff',  label: 'Classwork' },
    Notice:    { icon: Megaphone,     color: '#f59e0b', bg: '#fffbeb',  label: 'Notice'    },
    Behavior:  { icon: Star,          color: '#ef4444', bg: '#fef2f2',  label: 'Behavior'  },
};

// ─── Today's date (YYYY-MM-DD) ────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split('T')[0];

// ─── Blank form state ─────────────────────────────────────────────────────────
const blankForm = (cls = '') => ({
    id:         null,
    class:      cls,
    section:    'All',
    student_id: '',
    type:       'Homework',
    subject:    'General',
    title:      '',
    content:    '',
    is_urgent:  false,
    diary_date: todayStr(),
});

// ─────────────────────────────────────────────────────────────────────────────
export default function DiaryTab({ showSaveMessage }) {
    const {
        CLASSES, SUBJECTS, SECTIONS,
        schoolData, schoolSettings,
        diaryEntries, fetchDiaryEntries,
        saveDiaryEntry, deleteDiaryEntry,
    } = useSchoolData();

    const students = schoolData?.students || [];

    // ── State ────────────────────────────────────────────────────────────────
    const [filterClass, setFilterClass]   = useState('');
    const [filterDate,  setFilterDate]    = useState(todayStr());
    const [filterType,  setFilterType]    = useState('All');
    const [showForm,    setShowForm]      = useState(false);
    const [form,        setForm]          = useState(blankForm);
    const [saving,      setSaving]        = useState(false);
    const [loading,     setLoading]       = useState(false);
    const [deleteId,    setDeleteId]      = useState(null);

    // All available classes flattened
    const allClasses = CLASSES || [];
    const sectionClasses = (SECTIONS || []).flatMap(s => s.classes || []);
    const displayClasses = sectionClasses.length > 0 ? sectionClasses : allClasses;

    // Subjects for selected class
    const classSubjects = (SUBJECTS && !Array.isArray(SUBJECTS))
        ? (SUBJECTS[form.class] || [])
        : (SUBJECTS || []);

    // Students for the selected class (for private entries)
    const classStudents = students.filter(s => s.grade === form.class);

    // ── Load diary when class or date filter changes ──────────────────────────
    useEffect(() => {
        if (!filterClass && displayClasses.length > 0) {
            setFilterClass(displayClasses[0]);
        }
    }, [displayClasses]);

    useEffect(() => {
        if (filterClass) {
            setLoading(true);
            fetchDiaryEntries({ className: filterClass, dateFrom: filterDate, dateTo: filterDate })
                .finally(() => setLoading(false));
        }
    }, [filterClass, filterDate]);

    // ── Filtered view ─────────────────────────────────────────────────────────
    const displayed = diaryEntries.filter(e =>
        (filterType === 'All' || e.type === filterType)
    );

    // ── Open form (create) ───────────────────────────────────────────────────
    const openCreate = () => {
        setForm({ ...blankForm(filterClass), diary_date: filterDate });
        setShowForm(true);
    };

    // ── Open form (edit) ─────────────────────────────────────────────────────
    const openEdit = (entry) => {
        setForm({ ...entry, student_id: entry.student_id || '' });
        setShowForm(true);
    };

    // ── Save ─────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!form.content.trim()) { showSaveMessage('❌ Content is required.'); return; }
        if (!form.class)          { showSaveMessage('❌ Please select a class.'); return; }

        setSaving(true);
        const payload = { ...form, student_id: form.student_id || null };
        const { error } = await saveDiaryEntry(payload);
        setSaving(false);

        if (error) {
            showSaveMessage(`❌ Error: ${error.message}`);
        } else {
            showSaveMessage(form.id ? '✅ Entry updated!' : '✅ Diary entry saved!');
            setShowForm(false);

            // ── WhatsApp alert for urgent entries (new entries only) ──────────
            if (form.is_urgent && !form.id) {
                const schoolName = schoolData?.name || 'School';
                const title = form.title || form.type;
                const targetStudents = form.student_id
                    ? students.filter(s => s.id === form.student_id)
                    : students.filter(s => s.grade === form.class);

                let sent = 0;
                for (const s of targetStudents) {
                    const phone = s.admissions?.[0]?.whatsapp || s.admissions?.[0]?.contact;
                    if (phone) {
                        const msg = WhatsAppTemplates.urgentDiaryAlert(s.name, title, form.content, schoolName);
                        sendWhatsAppMessage(phone, msg, schoolSettings);
                        sent++;
                    }
                }
                if (sent > 0) showSaveMessage(`✅ Entry saved! 📲 WhatsApp alert sent to ${sent} parent(s).`);
            }
        }
    };

    // ── Delete ────────────────────────────────────────────────────────────────
    const handleDelete = async (id) => {
        const { error } = await deleteDiaryEntry(id);
        if (error) showSaveMessage(`❌ ${error.message}`);
        else       showSaveMessage('🗑️ Entry deleted.');
        setDeleteId(null);
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 1rem' }}>

            {/* ── Page Header ──────────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#1e293b' }}>
                        📓 Student Diary
                    </h2>
                    <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                        Post homework, classwork &amp; notices for parents to view.
                    </p>
                </div>
                <button onClick={openCreate} style={styles.primaryBtn}>
                    <Plus size={16} /> New Entry
                </button>
            </div>

            {/* ── Filters Row ───────────────────────────────────────────────── */}
            <div style={styles.filtersRow}>
                {/* Class selector */}
                <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Class</label>
                    <select
                        value={filterClass}
                        onChange={e => setFilterClass(e.target.value)}
                        style={styles.select}
                    >
                        {displayClasses.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>

                {/* Date picker */}
                <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Date</label>
                    <input
                        type="date"
                        value={filterDate}
                        onChange={e => setFilterDate(e.target.value)}
                        style={styles.select}
                    />
                </div>

                {/* Type filter */}
                <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Type</label>
                    <select
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                        style={styles.select}
                    >
                        <option value="All">All Types</option>
                        {Object.keys(TYPE_CONFIG).map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* ── Entry Form Modal ──────────────────────────────────────────── */}
            {showForm && (
                <div style={styles.overlay} onClick={() => setShowForm(false)}>
                    <div style={styles.modal} onClick={e => e.stopPropagation()}>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                            <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem', fontWeight: 700 }}>
                                {form.id ? '✏️ Edit Entry' : '📝 New Diary Entry'}
                            </h3>
                            <button onClick={() => setShowForm(false)} style={styles.closeBtn}>
                                <X size={18} />
                            </button>
                        </div>

                        {/* Row 1: Class + Section + Date */}
                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>Class *</label>
                                <select
                                    value={form.class}
                                    onChange={e => setForm(f => ({ ...f, class: e.target.value }))}
                                    style={styles.input}
                                >
                                    <option value="">Select class…</option>
                                    {displayClasses.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>Date *</label>
                                <input
                                    type="date"
                                    value={form.diary_date}
                                    onChange={e => setForm(f => ({ ...f, diary_date: e.target.value }))}
                                    style={styles.input}
                                />
                            </div>
                        </div>

                        {/* Row 2: Type + Subject */}
                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>Type *</label>
                                <select
                                    value={form.type}
                                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                                    style={styles.input}
                                >
                                    {Object.keys(TYPE_CONFIG).map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>Subject</label>
                                <select
                                    value={form.subject}
                                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                                    style={styles.input}
                                >
                                    <option value="General">General</option>
                                    {classSubjects.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Title */}
                        <div style={styles.formGroupFull}>
                            <label style={styles.formLabel}>Title (optional)</label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="e.g. Chapter 5 Exercises"
                                style={styles.input}
                            />
                        </div>

                        {/* Content */}
                        <div style={styles.formGroupFull}>
                            <label style={styles.formLabel}>Content / Instructions *</label>
                            <textarea
                                value={form.content}
                                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                                rows={4}
                                placeholder="Write the homework instructions, notice, or observation here…"
                                style={{ ...styles.input, resize: 'vertical', fontFamily: 'inherit' }}
                            />
                        </div>

                        {/* Private entry toggle */}
                        <div style={styles.formGroupFull}>
                            <label style={styles.formLabel}>Audience</label>
                            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                                <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        checked={!form.student_id}
                                        onChange={() => setForm(f => ({ ...f, student_id: '' }))}
                                    />
                                    <Users size={14} /> Entire Class
                                </label>
                                <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        checked={!!form.student_id}
                                        onChange={() => setForm(f => ({ ...f, student_id: classStudents[0]?.id || '' }))}
                                    />
                                    <User size={14} /> Specific Student
                                </label>
                            </div>
                            {form.student_id && (
                                <select
                                    value={form.student_id}
                                    onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))}
                                    style={{ ...styles.input, marginTop: '0.5rem' }}
                                >
                                    <option value="">-- Select student --</option>
                                    {classStudents.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Urgent flag */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem' }}>
                            <input
                                type="checkbox"
                                id="urgentChk"
                                checked={form.is_urgent}
                                onChange={e => setForm(f => ({ ...f, is_urgent: e.target.checked }))}
                                style={{ width: 16, height: 16 }}
                            />
                            <label htmlFor="urgentChk" style={{ color: '#dc2626', fontWeight: 600, cursor: 'pointer' }}>
                                🚨 Mark as Urgent (will trigger WhatsApp alert)
                            </label>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowForm(false)} style={styles.cancelBtn}>Cancel</button>
                            <button onClick={handleSave} disabled={saving} style={styles.primaryBtn}>
                                {saving ? 'Saving…' : <><Send size={15} /> Post Entry</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirm ────────────────────────────────────────────── */}
            {deleteId && (
                <div style={styles.overlay}>
                    <div style={{ ...styles.modal, maxWidth: 380 }}>
                        <h3 style={{ color: '#dc2626', margin: '0 0 0.75rem' }}>Delete Entry?</h3>
                        <p style={{ color: '#475569', margin: '0 0 1.2rem' }}>This action cannot be undone.</p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setDeleteId(null)} style={styles.cancelBtn}>Cancel</button>
                            <button onClick={() => handleDelete(deleteId)} style={{ ...styles.primaryBtn, background: '#dc2626' }}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Diary Entries List ────────────────────────────────────────── */}
            {loading ? (
                <div style={styles.emptyState}>
                    <Clock size={36} color="#94a3b8" />
                    <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>Loading diary…</p>
                </div>
            ) : displayed.length === 0 ? (
                <div style={styles.emptyState}>
                    <BookOpen size={40} color="#cbd5e1" />
                    <p style={{ color: '#94a3b8', marginTop: '0.75rem', fontSize: '1rem', fontWeight: 500 }}>
                        No entries for {filterClass || 'this class'} on {filterDate}
                    </p>
                    <button onClick={openCreate} style={{ ...styles.primaryBtn, marginTop: '1rem' }}>
                        <Plus size={15} /> Add First Entry
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {displayed.map(entry => {
                        const cfg = TYPE_CONFIG[entry.type] || TYPE_CONFIG.Notice;
                        const Icon = cfg.icon;
                        const acks = Array.isArray(entry.acknowledgments) ? entry.acknowledgments.length : 0;
                        const isPrivate = !!entry.student_id;
                        const student = isPrivate ? students.find(s => s.id === entry.student_id) : null;

                        return (
                            <div key={entry.id} style={{
                                background: 'white',
                                border: `1px solid ${entry.is_urgent ? '#fca5a5' : '#e2e8f0'}`,
                                borderLeft: `4px solid ${cfg.color}`,
                                borderRadius: 10,
                                padding: '1rem 1.2rem',
                                boxShadow: entry.is_urgent ? '0 0 0 2px #fee2e2' : '0 1px 4px rgba(0,0,0,0.05)'
                            }}>
                                {/* Entry header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 6, padding: '3px 10px', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <Icon size={12} /> {entry.type}
                                        </span>
                                        <span style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 600 }}>{entry.subject}</span>
                                        {entry.is_urgent && <span style={{ background: '#dc2626', color: 'white', fontSize: '0.72rem', borderRadius: 4, padding: '2px 7px', fontWeight: 700 }}>URGENT</span>}
                                        {isPrivate && (
                                            <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.75rem', borderRadius: 4, padding: '2px 8px', fontWeight: 600 }}>
                                                👤 {student?.name || 'Private'}
                                            </span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                                        <button onClick={() => openEdit(entry)} style={styles.iconBtn} title="Edit">
                                            <Edit3 size={14} color="#64748b" />
                                        </button>
                                        <button onClick={() => setDeleteId(entry.id)} style={styles.iconBtn} title="Delete">
                                            <Trash2 size={14} color="#ef4444" />
                                        </button>
                                    </div>
                                </div>

                                {/* Title */}
                                {entry.title && (
                                    <p style={{ margin: '0 0 0.3rem', fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>
                                        {entry.title}
                                    </p>
                                )}

                                {/* Content */}
                                <p style={{ margin: '0 0 0.75rem', color: '#374151', lineHeight: 1.55, fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                                    {entry.content}
                                </p>

                                {/* Footer: date + acknowledgments */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                                        <Calendar size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                                        {entry.diary_date}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: acks > 0 ? '#16a34a' : '#94a3b8', fontWeight: 600 }}>
                                        <Eye size={14} />
                                        {acks} parent{acks !== 1 ? 's' : ''} acknowledged
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
    primaryBtn: {
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        background: '#2563eb', color: 'white',
        border: 'none', borderRadius: 8, padding: '0.5rem 1.1rem',
        fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer'
    },
    cancelBtn: {
        background: '#f1f5f9', color: '#475569',
        border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.5rem 1.1rem',
        fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer'
    },
    iconBtn: {
        background: '#f8fafc', border: '1px solid #e2e8f0',
        borderRadius: 6, padding: '4px 7px', cursor: 'pointer', lineHeight: 1
    },
    filtersRow: {
        display: 'flex', gap: '1rem', flexWrap: 'wrap',
        background: 'white', borderRadius: 10, padding: '0.9rem 1.1rem',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '1.5rem',
        border: '1px solid #e2e8f0'
    },
    filterGroup: { display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: '1 0 140px' },
    filterLabel: { fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' },
    select: {
        border: '1px solid #e2e8f0', borderRadius: 7, padding: '0.42rem 0.7rem',
        fontSize: '0.88rem', color: '#1e293b', background: 'white', outline: 'none', cursor: 'pointer'
    },
    overlay: {
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: '1rem'
    },
    modal: {
        background: 'white', borderRadius: 14, padding: '1.6rem',
        width: '100%', maxWidth: 600, maxHeight: '90vh',
        overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)'
    },
    closeBtn: {
        background: '#f1f5f9', border: 'none', borderRadius: 7,
        padding: '5px 8px', cursor: 'pointer', color: '#64748b'
    },
    formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem', marginBottom: '0.9rem' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '0.3rem' },
    formGroupFull: { display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.9rem' },
    formLabel: { fontSize: '0.78rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' },
    input: {
        border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.5rem 0.75rem',
        fontSize: '0.9rem', color: '#1e293b', outline: 'none', width: '100%', boxSizing: 'border-box'
    },
    emptyState: {
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '3rem 1rem', background: 'white', borderRadius: 12,
        border: '2px dashed #e2e8f0', color: '#94a3b8', textAlign: 'center'
    },
};
