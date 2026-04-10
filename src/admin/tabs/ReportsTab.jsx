import React, { useState, useMemo } from 'react';
import { Search, Download, Printer, Award, TrendingUp, TrendingDown, Users, ChevronDown, ChevronUp, BarChart2, Star, Filter } from 'lucide-react';

// ─── Grade Helpers ────────────────────────────────────────────────────────────
const calcGrade = (pct) => {
    if (pct >= 90) return { grade: 'A+', color: '#7c3aed', bg: '#f5f3ff' };
    if (pct >= 80) return { grade: 'A',  color: '#15803d', bg: '#dcfce7' };
    if (pct >= 70) return { grade: 'B+', color: '#1d4ed8', bg: '#dbeafe' };
    if (pct >= 60) return { grade: 'B',  color: '#0369a1', bg: '#e0f2fe' };
    if (pct >= 50) return { grade: 'C',  color: '#a16207', bg: '#fef9c3' };
    if (pct >= 40) return { grade: 'D',  color: '#c2410c', bg: '#ffedd5' };
    return                { grade: 'F',  color: '#dc2626', bg: '#fee2e2' };
};

const calcOverallPct = (results, weights) => {
    if (!results || results.length === 0) return 0;
    let totalObtained = 0, totalMax = 0;
    results.forEach(r => {
        const subTotal = (weights && weights[r.subject]) ? Number(weights[r.subject]) : 100;
        const numObtained = r.obtained === 'A' ? 0 : Number(r.obtained ?? 0);
        totalObtained += numObtained;
        totalMax += subTotal;
    });
    return totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
};

// ─── Print individual report card ─────────────────────────────────────────────
function printReportCard(student, termLabel, subjects, weights, schoolName, schoolLogo, sectionName) {
    const results = (student.results || []).filter(r => !termLabel || r.term === termLabel);
    const overall = calcOverallPct(results, weights);
    const { grade: overallGrade, color: gradeColor } = calcGrade(overall);
    const printDate = new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' });
    const adm = student.admissions?.[0] || {};

    const subjectRows = subjects.map(sub => {
        const r = results.find(r => r.subject === sub);
        const total = (weights && weights[sub]) ? Number(weights[sub]) : 100;
        const obtained = r?.obtained;
        const numOb = obtained === 'A' ? 0 : Number(obtained ?? '');
        const pct = obtained !== undefined && obtained !== '' ? Math.round((numOb / total) * 100) : null;
        const gInfo = pct !== null ? calcGrade(pct) : null;
        return `<tr>
            <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-weight:600;color:#1e293b">${sub}</td>
            <td style="padding:10px;border-bottom:1px solid #f1f5f9;text-align:center;color:#475569">${total}</td>
            <td style="padding:10px;border-bottom:1px solid #f1f5f9;text-align:center;font-weight:700">${obtained === 'A' ? 'ABS' : (obtained ?? '—')}</td>
            <td style="padding:10px;border-bottom:1px solid #f1f5f9;text-align:center;color:#64748b">${pct !== null ? pct + '%' : '—'}</td>
            <td style="padding:10px;border-bottom:1px solid #f1f5f9;text-align:center">
                ${gInfo ? `<span style="background:${gInfo.bg};color:${gInfo.color};padding:3px 10px;border-radius:20px;font-weight:800;font-size:13px">${gInfo.grade}</span>` : '—'}
            </td>
            <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;text-align:center;font-size:12px;color:#94a3b8">${r?.remarks || ''}</td>
        </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<title>Report Card – ${student.name}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',sans-serif;background:#f1f5f9;padding:30px;color:#0f172a}
  .card{max-width:780px;margin:0 auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 25px 50px rgba(0,0,0,0.1)}
  .header{background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 60%,#7c3aed 100%);padding:36px 40px;color:white;text-align:center;position:relative}
  .logo-wrap{width:72px;height:72px;background:white;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;overflow:hidden;margin-bottom:16px;box-shadow:0 8px 24px rgba(0,0,0,0.15)}
  .logo-wrap img{width:100%;height:100%;object-fit:contain}
  .school-name{font-size:24px;font-weight:900;margin-bottom:4px;letter-spacing:0.3px}
  .report-label{font-size:11px;text-transform:uppercase;letter-spacing:2px;opacity:0.8;font-weight:700}
  .student-section{display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;padding:28px 40px;background:#f8fafc;border-bottom:1px solid #e2e8f0}
  .info-item .lbl{font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;font-weight:700;margin-bottom:4px}
  .info-item .val{font-weight:700;color:#1e293b;font-size:15px}
  .result-section{padding:28px 40px}
  table{width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden}
  thead tr{background:#f8fafc}
  thead th{padding:12px 14px;font-size:11px;text-transform:uppercase;font-weight:700;color:#64748b;letter-spacing:0.5px;text-align:left}
  .overall{display:flex;align-items:center;justify-content:space-between;padding:20px 40px;background:#0f172a;color:white}
  .overall-label{font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:6px}
  .overall-value{font-size:28px;font-weight:900}
  .pass-badge{padding:8px 20px;border-radius:50px;font-weight:800;font-size:14px}
  .sigs{display:grid;grid-template-columns:1fr 1fr;gap:40px;padding:24px 40px 32px;border-top:1px solid #e2e8f0}
  .sig-line{border-top:1.5px solid #cbd5e1;padding-top:10px;text-align:center;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px}
  .footer{text-align:center;padding:14px;background:#f8fafc;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0}
  @media print{body{padding:0;background:white}.card{box-shadow:none}}
</style></head>
<body>
<div class="card">
  <div class="header">
    <div class="logo-wrap"><img src="${schoolLogo || '/logo.png'}" alt="Logo"/></div>
    <div class="school-name">${schoolName}</div>
    <div style="font-size:14px;opacity:0.85;margin:6px 0 2px">${sectionName ? sectionName + ' — ' : ''}${student.grade}</div>
    <div class="report-label">📋 Official Terminal Report Card${termLabel ? ' — ' + termLabel : ''}</div>
  </div>

  <div class="student-section">
    <div class="info-item"><div class="lbl">Student Name</div><div class="val">${student.name}</div></div>
    <div class="info-item"><div class="lbl">Student ID</div><div class="val">${student.id}</div></div>
    <div class="info-item"><div class="lbl">Class</div><div class="val">${student.grade}</div></div>
    <div class="info-item"><div class="lbl">Father's Name</div><div class="val">${adm.fatherName || '—'}</div></div>
    <div class="info-item"><div class="lbl">Gender</div><div class="val">${adm.gender || '—'}</div></div>
    <div class="info-item"><div class="lbl">Date Generated</div><div class="val">${printDate}</div></div>
  </div>

  <div class="result-section">
    <table>
      <thead><tr>
        <th>Subject</th><th style="text-align:center">Total</th>
        <th style="text-align:center">Obtained</th><th style="text-align:center">Percentage</th>
        <th style="text-align:center">Grade</th><th style="text-align:center">Remarks</th>
      </tr></thead>
      <tbody>${subjectRows}</tbody>
    </table>
  </div>

  <div class="overall">
    <div>
      <div class="overall-label">Overall Percentage</div>
      <div class="overall-value">${overall}%</div>
    </div>
    <div>
      <div class="overall-label">Overall Grade</div>
      <div class="overall-value" style="color:${gradeColor}">${overallGrade}</div>
    </div>
    <div>
      <span class="pass-badge" style="background:${overall >= 40 ? '#dcfce7' : '#fee2e2'};color:${overall >= 40 ? '#15803d' : '#dc2626'}">
        ${overall >= 40 ? '✅ PASS' : '❌ FAIL'}
      </span>
    </div>
  </div>

  <div class="sigs">
    <div class="sig-line">Class Teacher Signature</div>
    <div class="sig-line">Principal / HM Signature</div>
  </div>
  <div class="footer">Generated on ${printDate} &nbsp;|&nbsp; ${schoolName} &nbsp;|&nbsp; Confidential Document</div>
</div>
<script>window.onload = () => window.print();</script>
</body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
}

// ─── Print ALL report cards for a class (batch) ───────────────────────────────
function printClassReportCards(classStudents, termLabel, subjects, weights, schoolName, schoolLogo, sectionName) {
    if (!classStudents.length) { alert('No students in this class!'); return; }
    classStudents.forEach((s, i) => {
        setTimeout(() => printReportCard(s, termLabel, subjects, weights, schoolName, schoolLogo, sectionName), i * 300);
    });
}

// ─── Main Component ───────────────────────────────────────────────────────────
const ReportsTab = ({
    students, schoolData, SUBJECTS, TERMS, WEIGHTS, SECTIONS,
    selectedClass, setSelectedClass, sectionClasses,
    currencySymbol, schoolSettings
}) => {
    const schoolName = schoolData?.name || 'School';
    const schoolLogo = schoolSettings?.logo_url || '/logo.png';

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTerm, setSelectedTerm] = useState('');
    const [genderFilter, setGenderFilter] = useState('all');
    const [showClassStats, setShowClassStats] = useState(true);

    // Derived data for the selected class
    const classSubjects = useMemo(() => {
        if (!SUBJECTS || Array.isArray(SUBJECTS)) return SUBJECTS || [];
        return SUBJECTS[selectedClass] || [];
    }, [SUBJECTS, selectedClass]);

    const classTerms = useMemo(() => {
        if (!TERMS || Array.isArray(TERMS)) return TERMS || [];
        return TERMS[selectedClass] || [];
    }, [TERMS, selectedClass]);

    const classWeights = useMemo(() => {
        if (!WEIGHTS || typeof WEIGHTS !== 'object') return {};
        const cw = WEIGHTS[selectedClass];
        if (!cw || typeof cw !== 'object') return {};
        // If class weights are term-scoped: { "Term 1": { "Biology": 75 } }
        if (selectedTerm && cw[selectedTerm] && typeof cw[selectedTerm] === 'object') return cw[selectedTerm];
        return cw;
    }, [WEIGHTS, selectedClass, selectedTerm]);

    const sectionName = useMemo(() => {
        return (SECTIONS || []).find(s => s.classes?.includes(selectedClass))?.name || '';
    }, [SECTIONS, selectedClass]);

    const classStudents = useMemo(() => {
        return students
            .filter(s => s.grade === selectedClass)
            .filter(s => genderFilter === 'all' || s.admissions?.[0]?.gender === (genderFilter === 'boys' ? 'Male' : 'Female'))
            .filter(s => !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.id.toLowerCase().includes(searchQuery.toLowerCase()))
            .slice().sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
    }, [students, selectedClass, genderFilter, searchQuery]);

    // Analytics for the class
    const analytics = useMemo(() => {
        const all = students.filter(s => s.grade === selectedClass);
        const withResults = all.filter(s => (s.results || []).filter(r => !selectedTerm || r.term === selectedTerm).length > 0);
        if (withResults.length === 0) return null;

        const scores = withResults.map(s => {
            const res = (s.results || []).filter(r => !selectedTerm || r.term === selectedTerm);
            return { student: s, pct: calcOverallPct(res, classWeights) };
        }).sort((a, b) => b.pct - a.pct);

        const avgPct = Math.round(scores.reduce((sum, s) => sum + s.pct, 0) / scores.length);
        const passCount = scores.filter(s => s.pct >= 40).length;
        const gradeDistrib = {};
        scores.forEach(s => {
            const g = calcGrade(s.pct).grade;
            gradeDistrib[g] = (gradeDistrib[g] || 0) + 1;
        });

        return { scores, avgPct, passCount, failCount: scores.length - passCount, total: scores.length, gradeDistrib, topStudents: scores.slice(0, 3) };
    }, [students, selectedClass, selectedTerm, classWeights]);

    const currentTerm = selectedTerm || classTerms[0] || '';

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>

            {/* ── HEADER ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Report Cards</h2>
                    <p style={{ color: '#64748b', margin: '0.25rem 0 0' }}>Generate, print and analyze terminal report cards for any class.</p>
                </div>
                <button
                    onClick={() => printClassReportCards(classStudents, currentTerm, classSubjects, classWeights, schoolName, schoolLogo, sectionName)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg,#1e3a5f,#2563eb)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.3)', fontSize: '0.95rem' }}>
                    <Printer size={18} /> Print All ({classStudents.length})
                </button>
            </div>

            {/* ── FILTERS ROW ── */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
                {/* Class select */}
                <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
                    style={{ padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontWeight: 700, color: '#1e293b', background: 'white', outline: 'none', cursor: 'pointer' }}>
                    {sectionClasses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                {/* Term select */}
                <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)}
                    style={{ padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontWeight: 700, color: '#1e293b', background: 'white', outline: 'none', cursor: 'pointer' }}>
                    <option value="">All Terms</option>
                    {classTerms.map(t => <option key={t} value={t}>{t}</option>)}
                </select>

                {/* Gender filter */}
                {['all', 'boys', 'girls'].map(g => (
                    <button key={g} onClick={() => setGenderFilter(g)} style={{
                        padding: '0.55rem 1rem', borderRadius: '8px', border: '1px solid',
                        borderColor: genderFilter === g ? '#2563eb' : '#e2e8f0',
                        background: genderFilter === g ? '#eff6ff' : 'white',
                        color: genderFilter === g ? '#2563eb' : '#64748b',
                        fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', textTransform: 'capitalize'
                    }}>{g === 'all' ? '👥 All' : g === 'boys' ? '♂ Boys' : '♀ Girls'}</button>
                ))}

                {/* Search */}
                <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input type="text" placeholder="Search student..." value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '0.6rem 0.8rem 0.6rem 2.3rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none', background: 'white' }} />
                </div>
            </div>

            {/* ── CLASS ANALYTICS ── */}
            {analytics && (
                <div style={{ marginBottom: '1.75rem' }}>
                    <button onClick={() => setShowClassStats(p => !p)} style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: showClassStats ? '1rem' : 0,
                        background: showClassStats ? '#1e3a5f' : '#f1f5f9', color: showClassStats ? 'white' : '#475569',
                        border: 'none', borderRadius: '10px', padding: '0.6rem 1.2rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s'
                    }}>
                        {showClassStats ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        📊 Class Analytics — {selectedClass} {currentTerm ? `(${currentTerm})` : ''}
                    </button>

                    {showClassStats && (
                        <div className="animate-fade-in">
                            {/* KPI row */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                                {[
                                    { label: 'Class Average', value: `${analytics.avgPct}%`, color: '#2563eb', icon: BarChart2 },
                                    { label: 'Passed', value: analytics.passCount, color: '#10b981', icon: TrendingUp },
                                    { label: 'Failed', value: analytics.failCount, color: '#ef4444', icon: TrendingDown },
                                    { label: 'Pass Rate', value: `${Math.round((analytics.passCount / analytics.total) * 100)}%`, color: '#8b5cf6', icon: Award },
                                ].map(({ label, value, color, icon: Icon }) => (
                                    <div key={label} style={{ background: 'white', borderRadius: '14px', padding: '1.25rem', border: '1px solid #e2e8f0', borderLeft: `4px solid ${color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.4rem' }}>{label}</div>
                                            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{value}</div>
                                        </div>
                                        <div style={{ background: `${color}15`, padding: '0.6rem', borderRadius: '10px', color }}><Icon size={20} /></div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                {/* Grade Distribution */}
                                <div style={{ background: 'white', borderRadius: '14px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
                                    <h4 style={{ fontWeight: 800, color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <BarChart2 size={18} color="#2563eb" /> Grade Distribution
                                    </h4>
                                    {['A+', 'A', 'B+', 'B', 'C', 'D', 'F'].map(g => {
                                        const count = analytics.gradeDistrib[g] || 0;
                                        const pct = analytics.total > 0 ? (count / analytics.total) * 100 : 0;
                                        const gradeColors = { 'A+': '#7c3aed', 'A': '#15803d', 'B+': '#1d4ed8', 'B': '#0369a1', 'C': '#a16207', 'D': '#c2410c', 'F': '#dc2626' };
                                        return (
                                            <div key={g} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                                <span style={{ width: '28px', fontWeight: 800, fontSize: '0.85rem', color: gradeColors[g] }}>{g}</span>
                                                <div style={{ flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${pct}%`, background: gradeColors[g], borderRadius: '10px', transition: 'width 0.5s ease' }} />
                                                </div>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', width: '20px', textAlign: 'right' }}>{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Top 3 Students */}
                                <div style={{ background: 'white', borderRadius: '14px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
                                    <h4 style={{ fontWeight: 800, color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Star size={18} color="#f59e0b" /> Top Performers
                                    </h4>
                                    {analytics.topStudents.map(({ student, pct }, idx) => {
                                        const medals = ['🥇', '🥈', '🥉'];
                                        const { grade, color, bg } = calcGrade(pct);
                                        return (
                                            <div key={student.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: idx === 0 ? '#fffbeb' : '#f8fafc', borderRadius: '10px', marginBottom: '0.5rem', border: idx === 0 ? '1px solid #fde68a' : '1px solid #f1f5f9' }}>
                                                <span style={{ fontSize: '1.5rem' }}>{medals[idx]}</span>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{student.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{student.id}</div>
                                                </div>
                                                <span style={{ background: bg, color, fontWeight: 800, padding: '0.3rem 0.7rem', borderRadius: '8px', fontSize: '0.85rem' }}>{pct}% · {grade}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── STUDENT LIST ── */}
            {classStudents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #cbd5e1' }}>
                    <Users size={48} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
                    <h3 style={{ color: '#475569', fontWeight: 700 }}>No Students Found</h3>
                    <p style={{ color: '#94a3b8' }}>Try adjusting your filters or selecting a different class.</p>
                </div>
            ) : (
                <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>{classStudents.length} students in {selectedClass}</span>
                        {currentTerm && <span style={{ background: '#eff6ff', color: '#2563eb', padding: '0.3rem 0.8rem', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 700 }}>{currentTerm}</span>}
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                {['#', 'Student', 'ID', 'Overall %', 'Grade', 'Result', 'Action'].map(h => (
                                    <th key={h} style={{ padding: '0.9rem 1rem', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px', textAlign: h === 'Action' ? 'center' : 'left' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {classStudents.map((student, idx) => {
                                const res = (student.results || []).filter(r => !currentTerm || r.term === currentTerm);
                                const pct = res.length > 0 ? calcOverallPct(res, classWeights) : null;
                                const gInfo = pct !== null ? calcGrade(pct) : null;
                                const isPassed = pct !== null && pct >= 40;

                                return (
                                    <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                                        <td style={{ padding: '0.9rem 1rem', color: '#94a3b8', fontWeight: 600 }}>{idx + 1}</td>
                                        <td style={{ padding: '0.9rem 1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                                                <img src={student.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=eff6ff&color=2563eb&size=32`} alt={student.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                                                <span style={{ fontWeight: 700, color: '#1e293b' }}>{student.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.9rem 1rem', color: '#64748b', fontFamily: 'monospace', fontSize: '0.9rem' }}>{student.id}</td>
                                        <td style={{ padding: '0.9rem 1rem' }}>
                                            {pct !== null ? (
                                                <div>
                                                    <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem' }}>{pct}%</div>
                                                    <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '4px', marginTop: '4px', overflow: 'hidden', width: '80px' }}>
                                                        <div style={{ height: '100%', width: `${pct}%`, background: gInfo.color, borderRadius: '4px' }} />
                                                    </div>
                                                </div>
                                            ) : <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No results</span>}
                                        </td>
                                        <td style={{ padding: '0.9rem 1rem' }}>
                                            {gInfo && <span style={{ background: gInfo.bg, color: gInfo.color, fontWeight: 800, padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.9rem' }}>{gInfo.grade}</span>}
                                        </td>
                                        <td style={{ padding: '0.9rem 1rem' }}>
                                            {pct !== null && <span style={{ background: isPassed ? '#dcfce7' : '#fee2e2', color: isPassed ? '#15803d' : '#dc2626', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.8rem' }}>
                                                {isPassed ? 'PASS' : 'FAIL'}
                                            </span>}
                                        </td>
                                        <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                                            <button
                                                onClick={() => printReportCard(student, currentTerm, classSubjects, classWeights, schoolName, schoolLogo, sectionName)}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#1e3a5f', color: 'white', border: 'none', padding: '0.45rem 0.9rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                                                <Printer size={13} /> Print
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ReportsTab;
