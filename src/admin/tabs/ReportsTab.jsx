import React, { useState, useMemo, useEffect } from 'react';
import { Search, Download, Printer, Award, TrendingUp, TrendingDown, Users, ChevronDown, ChevronUp, ChevronRight, ChevronLeft, BarChart2, Star, Filter } from 'lucide-react';


// ─── Grade Helpers ────────────────────────────────────────────────────────────
const calcGrade = (pct) => {
    if (pct === 'Absent' || pct === 'ABS') return { grade: 'Absent', color: '#4b5563', bg: '#f3f4f6' };
    if (pct === null || pct === undefined || pct === '') return { grade: '—', color: '#64748b', bg: '#f8fafc' };
    const num = Number(pct);
    if (isNaN(num)) return { grade: '—', color: '#64748b', bg: '#f8fafc' };
    if (num >= 90) return { grade: 'A+', color: '#15803d', bg: '#f0fdf4' }; // Green
    if (num >= 80) return { grade: 'A',  color: '#1d4ed8', bg: '#eff6ff' }; // Blue
    if (num >= 70) return { grade: 'B+', color: '#b45309', bg: '#fef3c7' }; // Gold/Amber
    if (num >= 60) return { grade: 'B',  color: '#b45309', bg: '#fef3c7' }; // Gold/Amber
    if (num >= 50) return { grade: 'C',  color: '#b91c1c', bg: '#fee2e2' }; // Red
    if (num >= 40) return { grade: 'D',  color: '#b91c1c', bg: '#fee2e2' }; // Red
    if (num >= 33) return { grade: 'E',  color: '#b91c1c', bg: '#fee2e2' }; // Red
    return                { grade: 'U',  color: '#b91c1c', bg: '#fee2e2' }; // Red
};

const getGradeRemark = (grade) => {
    switch (grade) {
        case 'A++': return 'Absolutely Outstanding! Your dedication and hard work truly paid off. Keep up the amazing effort! Incredible achievement!';
        case 'A+': return 'Excellent work! Fantastic results';
        case 'A': return 'Adorable!';
        case 'B++': return 'Great job';
        case 'B+': return 'Well done!';
        case 'B': return 'Good progress. Keep it up! You have potential to do even better!';
        case 'C': return 'Satisfactory! Don’t be discouraged! DO More';
        case 'D': return 'Don’t give up! We’re here to help you';
        case 'E': return 'Performance needs serious improvement. Strong effort and consistent support are urgently needed. We believe in your potential—let’s work together to improve!';
        case 'U': return 'Unsatisfactory!';
        case 'Absent': return 'Absent';
        default: return '';
    }
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

function printReportCard(student, termLabel, subjects, weights, schoolName, schoolLogo, sectionName, isOnePageMode = true) {
    const results = (student.results || []).filter(r => !termLabel || r.term === termLabel);
    const printDate = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    const adm = student.admissions?.[0] || {};
    const fatherName = adm.fatherName || adm.father_name || student.fatherName || student.father_name || '—';
    
    // Calculate attendance — exclude holidays entirely
    const attendanceRecords = (student.attendance?.records || []).filter(r => r.status !== 'holiday');
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(r => r.status === 'present' || r.status === 'late' || r.status === 'leave').length;
    const absentDays = attendanceRecords.filter(r => r.status === 'absent').length;
    const attPct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    // Helper for mockup grade colors
    const getMockupGradeColor = (grade) => {
        switch (grade) {
            case 'A++':
            case 'A+': return '#15803d'; // Green
            case 'A': return '#1d4ed8';  // Blue
            case 'B++':
            case 'B+':
            case 'B': return '#b45309';  // Gold/Amber
            default: return '#b91c1c';  // Red (for C, D, E, U, etc.)
        }
    };

    let totalObtained = 0;
    let totalMax = 0;

    // Dynamic layout parameters depending on isOnePageMode
    const paddingTd = isOnePageMode ? '6px 12px' : '10px 16px';
    const paddingTdCenter = isOnePageMode ? '6px' : '10px';
    const fontSizeTd = isOnePageMode ? '12px' : '13px';

    const subjectRows = subjects.map((sub, index) => {
        const r = results.find(r => r.subject === sub);
        const total = (weights && weights[sub]) ? Number(weights[sub]) : 100;
        const obtained = r?.obtained;
        const numOb = obtained === 'A' ? 0 : Number(obtained ?? '');
        const pct = obtained !== undefined && obtained !== '' ? Math.round((numOb / total) * 100) : null;
        
        let gInfo = { grade: '—', color: '#64748b' };
        if (pct !== null) {
            const rawGrad = calcGrade(pct);
            gInfo = {
                grade: rawGrad.grade,
                color: getMockupGradeColor(rawGrad.grade)
            };
        }
        
        if (obtained !== undefined && obtained !== '' && obtained !== 'A') {
            totalObtained += numOb;
            totalMax += total;
        } else if (obtained === 'A') {
            totalMax += total;
        }

        const obtainedText = obtained === 'A' ? 'ABS' : (obtained ?? '—');

        return `<tr>
            <td style="padding: ${paddingTd}; border-bottom: 1px solid #cbd5e1; font-weight: 800; color: #1e293b; font-size: ${fontSizeTd}; text-align: left;">${sub}</td>
            <td style="padding: ${paddingTdCenter}; border-bottom: 1px solid #cbd5e1; text-align: center; font-weight: 700; color: #475569; font-size: ${fontSizeTd};">${total}</td>
            <td style="padding: ${paddingTdCenter}; border-bottom: 1px solid #cbd5e1; text-align: center; font-weight: 800; color: ${gInfo.color}; font-size: ${isOnePageMode ? '13px' : '14px'};">${obtainedText}</td>
            <td style="padding: ${paddingTdCenter}; border-bottom: 1px solid #cbd5e1; text-align: center; font-weight: 800; color: ${gInfo.color}; font-size: ${isOnePageMode ? '13px' : '14px'};">${gInfo.grade}</td>
            <td style="padding: ${paddingTd}; border-bottom: 1px solid #cbd5e1; width: 220px;">
                ${pct !== null ? `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="background: #e2e8f0; border-radius: 10px; height: 6px; flex: 1; overflow: hidden; display: block;">
                        <div style="background: ${gInfo.color}; border-radius: 10px; height: 100%; width: ${pct}%;"></div>
                    </div>
                    <span style="font-size: 11px; font-weight: 800; color: ${gInfo.color}; min-width: 32px; text-align: right;">${pct}%</span>
                </div>
                ` : '—'}
            </td>
        </tr>`;
    }).join('');

    const overall = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
    const rawOverallGrade = calcGrade(overall).grade;
    const overallGrade = rawOverallGrade;
    const gradeColor = getMockupGradeColor(overallGrade);
    const initialChar = student.name ? student.name.charAt(0).toUpperCase() : 'S';
    const finalSchoolName = schoolName && schoolName !== 'School' ? schoolName : 'ACS School & College';

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<title>Report Card – ${student.name}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Outfit:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800;900&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Outfit','Inter',sans-serif;background:#f1f5f9;padding:${isOnePageMode ? '12px' : '20px'};color:#1e293b;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .card{max-width:800px;margin:0 auto;background:white;border:2.5px solid #1e3a8a;padding:${isOnePageMode ? '16px' : '28px'};box-shadow:0 10px 30px rgba(0,0,0,0.05);page-break-inside:avoid}
  
  .header-box{border:2.5px solid #1e3a8a;border-radius:10px;padding:${isOnePageMode ? '8px 12px' : '16px 20px'};margin-bottom:${isOnePageMode ? '8px' : '16px'};display:flex;align-items:center;position:relative}
  .logo-wrap{width:${isOnePageMode ? '45px' : '65px'};height:${isOnePageMode ? '45px' : '65px'};display:flex;align-items:center;justify-content:center;overflow:hidden;margin-right:12px;flex-shrink:0}
  .logo-wrap img{width:100%;height:100%;object-fit:contain}
  .header-info{flex:1;text-align:center;padding-right:45px}
  .school-name{font-family:'Playfair Display','Outfit',serif;font-size:${isOnePageMode ? '20px' : '24px'};font-weight:900;color:#1e3a8a;text-transform:uppercase;margin-bottom:1px;letter-spacing:0.3px}
  .school-address{font-size:${isOnePageMode ? '9.5px' : '11px'};font-weight:700;color:#1e3a8a;margin-bottom:1px}
  .school-contacts{font-size:${isOnePageMode ? '9px' : '10.5px'};font-weight:800;color:#1e3a8a;letter-spacing:0.3px}
  
  .pill-wrap{display:flex;justify-content:center;margin-top:${isOnePageMode ? '6px' : '12px'};margin-bottom:${isOnePageMode ? '10px' : '16px'};position:relative;z-index:5}
  .pill-title{background:white;border:2px solid #1e3a8a;border-radius:30px;padding:${isOnePageMode ? '4px 20px' : '6px 28px'};font-size:${isOnePageMode ? '10px' : '12px'};font-weight:900;color:#1e3a8a;text-transform:uppercase;letter-spacing:1px}
  
  .profile-box{background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;padding:${isOnePageMode ? '8px 12px' : '14px 18px'};margin-bottom:${isOnePageMode ? '10px' : '16px'};display:flex;gap:12px;align-items:center}
  .initials-square{width:${isOnePageMode ? '46px' : '60px'};height:${isOnePageMode ? '46px' : '60px'};background:#dbeafe;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:${isOnePageMode ? '22px' : '28px'};font-weight:900;color:#1e3a8a;flex-shrink:0}
  .profile-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:${isOnePageMode ? '4px 12px' : '8px 16px'};flex:1}
  .profile-item .lbl{font-size:${isOnePageMode ? '7.5px' : '9px'};font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:1px}
  .profile-item .val{font-size:${isOnePageMode ? '11.5px' : '13px'};font-weight:800;color:#1e3a8a}
  
  .section-title{font-size:${isOnePageMode ? '11px' : '13px'};font-weight:800;color:#1e293b;margin-bottom:${isOnePageMode ? '4px' : '8px'};display:flex;align-items:center;gap:6px}
  .vertical-indicator{width:3px;height:${isOnePageMode ? '12px' : '15px'};background:#1e3a8a;display:inline-block;border-radius:1px}
  
  table{width:100%;border-collapse:separate;border-spacing:0;border:1.5px solid #cbd5e1;border-radius:8px;overflow:hidden;margin-bottom:${isOnePageMode ? '8px' : '16px'}}
  thead{background:#1e3a8a;color:white}
  thead th{padding:${isOnePageMode ? '6px' : '10px'};font-size:${isOnePageMode ? '9.5px' : '11px'};font-weight:800;text-transform:uppercase;letter-spacing:0.5px;text-align:center;border-bottom:1.5px solid #1e3a8a}
  thead th:first-child{text-align:left;padding-left:12px}
  thead th:last-child{text-align:left;padding-left:12px}
  
  tr td{border-bottom:1px solid #cbd5e1;padding:${paddingTd};font-size:${fontSizeTd}}
  tr:last-child td{border-bottom:none !important}
  
  .summary-box{background:#f8fafc;border:1.5px solid #cbd5e1;border-radius:8px;display:flex;align-items:center;margin-bottom:${isOnePageMode ? '8px' : '16px'};overflow:hidden}
  .summary-col{flex:1;text-align:center;padding:${isOnePageMode ? '6px' : '10px'};border-right:1.5px solid #cbd5e1}
  .summary-col:first-child{flex:1.5;text-align:left;padding:${isOnePageMode ? '8px 12px' : '12px 18px'};font-size:${isOnePageMode ? '12px' : '14px'};font-weight:900;color:#1e3a8a}
  .summary-col:nth-child(2){flex:1.2;padding:${isOnePageMode ? '6px 12px' : '10px 16px'}}
  .summary-col:nth-child(3){flex:1;padding:4px;display:flex;align-items:center;justify-content:center}
  .summary-col:last-child{flex:1.2;border-right:none;font-size:${isOnePageMode ? '12px' : '14px'};font-weight:900;color:#1e3a8a}
  
  .grade-circle{width:${isOnePageMode ? '28px' : '36px'};height:${isOnePageMode ? '28px' : '36px'};border-radius:50%;background:#1e3a8a;color:white;display:flex;align-items:center;justify-content:center;font-size:${isOnePageMode ? '11.5px' : '14px'};font-weight:900}
  
  .stats-box{background:#f8fafc;border:1.5px solid #cbd5e1;border-radius:8px;display:grid;grid-template-columns:1fr 1fr 1fr;overflow:hidden;margin-bottom:${isOnePageMode ? '8px' : '16px'}}
  .stat-col{text-align:center;padding:${isOnePageMode ? '6px' : '10px'};border-right:1.5px solid #cbd5e1}
  .stat-col:last-child{border-right:none}
  .stat-val{font-size:${isOnePageMode ? '13px' : '16px'};font-weight:900}
  .stat-lbl{font-size:${isOnePageMode ? '7.5px' : '9px'};font-weight:800;color:#64748b;letter-spacing:0.5px;margin-top:1px;text-transform:uppercase}
  
  .remarks-line{font-size:${isOnePageMode ? '12px' : '13.5px'};font-weight:700;color:#1e293b;line-height:${isOnePageMode ? '20px' : '26px'};padding-bottom:${isOnePageMode ? '2px' : '4px'};border-bottom:1px solid #cbd5e1;margin-bottom:${isOnePageMode ? '4px' : '8px'}}
  .remarks-ruled{height:${isOnePageMode ? '20px' : '26px'};border-bottom:1px solid #cbd5e1;margin-bottom:${isOnePageMode ? '4px' : '8px'}}
  
  .sigs-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:${isOnePageMode ? '15px' : '32px'};margin-bottom:${isOnePageMode ? '6px' : '15px'}}
  .sig-col{text-align:center}
  .sig-under{border-bottom:1.2px solid #cbd5e1;margin-bottom:6px;height:${isOnePageMode ? '16px' : '24px'}}
  .sig-lbl{font-size:${isOnePageMode ? '8px' : '9.5px'};font-weight:800;color:#64748b;letter-spacing:0.5px;text-transform:uppercase}
  
  .footer-row{display:flex;justify-content:space-between;align-items:center;border-top:1px solid #cbd5e1;padding-top:6px;font-size:8px;font-weight:800;color:#94a3b8;text-transform:uppercase}
  
  @page {
    size: A4 portrait;
    margin: ${isOnePageMode ? '8mm 6mm' : '14mm 10mm'};
  }
  @media print{
    body{padding:0 !important;margin:0 !important;background:white !important}
    .card{border:2.5px solid #1e3a8a !important;box-shadow:none !important;max-width:100% !important;width:100% !important;margin:0 !important;padding:${isOnePageMode ? '12px 16px' : '20px 24px'} !important;page-break-after:always;box-sizing:border-box}
  }
</style></head>
<body>
<div class="card">
  <div class="header-box">
    <div class="logo-wrap"><img src="${schoolLogo || '/logo.png'}" alt="Logo"/></div>
    <div class="header-info">
      <div class="school-name">${finalSchoolName}</div>
      <div class="school-address">${sectionName ? sectionName + ' — ' : ''}ACS Higher Secondary School, Jhang Road Painsra, Pakistan</div>
      <div class="school-contacts">0300 1333275 • Infoacspainsra@gmail.com</div>
    </div>
  </div>
  
  <div class="pill-wrap">
    <span class="pill-title">REPORT CARD</span>
  </div>
 
  <div class="profile-box">
    <div class="initials-square">${initialChar}</div>
    <div class="profile-grid">
      <div class="profile-item"><div class="lbl">STUDENT NAME</div><div class="val">${student.name}</div></div>
      <div class="profile-item"><div class="lbl">STUDENT ID</div><div class="val">${student.id || '—'}</div></div>
      <div class="profile-item"><div class="lbl">CLASS</div><div class="val">${student.grade}</div></div>
      <div class="profile-item"><div class="lbl">FATHER'S NAME</div><div class="val">${fatherName}</div></div>
      <div class="profile-item"><div class="lbl">GENDER</div><div class="val">${adm.gender || '—'}</div></div>
      <div class="profile-item"><div class="lbl">DATE GENERATED</div><div class="val">${printDate}</div></div>
    </div>
  </div>

  <div class="section-title">
    <span class="vertical-indicator"></span>
    Examination Results - ${termLabel || 'Grand Test'}
  </div>
  
  <table>
    <thead><tr>
      <th style="text-align:left; padding-left:20px;">Subject</th>
      <th>Total</th>
      <th>Obtained</th>
      <th>Grade</th>
      <th style="text-align:left; padding-left:20px;">Performance</th>
    </tr></thead>
    <tbody>${subjectRows}</tbody>
  </table>

  <div class="section-title">
    <span class="vertical-indicator"></span>
    Summary & Attendance
  </div>

  <div class="summary-box">
    <div class="summary-col">Aggregate Result</div>
    <div class="summary-col">
      <div style="font-size: 13px; font-weight: 900; color: #1e3a8a;">${totalObtained} / ${totalMax}</div>
      <div style="font-size: 10px; font-weight: 700; color: #64748b; margin-top: 1px;">${overall.toFixed(1)}%</div>
    </div>
    <div class="summary-col">
      <div class="grade-circle">${overallGrade}</div>
    </div>
    <div class="summary-col" style="color: #1e3a8a;">${overall >= 40 ? 'PASSED' : 'FAILED'}</div>
  </div>

  <div class="stats-box">
    <div class="stat-col">
      <div class="stat-val" style="color: #15803d;">${presentDays}</div>
      <div class="stat-lbl">PRESENT</div>
    </div>
    <div class="stat-col">
      <div class="stat-val" style="color: #b91c1c;">${absentDays}</div>
      <div class="stat-lbl">ABSENT</div>
    </div>
    <div class="stat-col">
      <div class="stat-val" style="color: #1d4ed8;">${attPct}%</div>
      <div class="stat-lbl">PERCENTAGE</div>
    </div>
  </div>

  <div class="section-title">
    <span class="vertical-indicator"></span>
    Remarks
  </div>
  
  <div style="margin-bottom: ${isOnePageMode ? '12px' : '20px'};">
    <div class="remarks-line">
      ${(student.termRemarks && student.termRemarks[termLabel]) || getGradeRemark(overallGrade) || '—'}
    </div>
    <div class="remarks-ruled"></div>
    ${!isOnePageMode ? `<div class="remarks-ruled"></div>` : ''}
  </div>

  <div class="sigs-row">
    <div class="sig-col">
      <div class="sig-under"></div>
      <span class="sig-lbl">CLASS TEACHER</span>
    </div>
    <div class="sig-col">
      <div class="sig-under"></div>
      <span class="sig-lbl">PRINCIPAL</span>
    </div>
    <div class="sig-col">
      <div class="sig-under"></div>
      <span class="sig-lbl">PARENT SIGNATURE</span>
    </div>
  </div>

  <div class="footer-row">
    <span>Generated by ACS School & College Portal</span>
    <span>${printDate}</span>
  </div>
</div>
<script>window.onload = () => setTimeout(() => window.print(), 300);</script>
</body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
}

// ─── Print ALL report cards for a class (batch) ───────────────────────────────
function printClassReportCards(classStudents, termLabel, subjects, weights, schoolName, schoolLogo, sectionName, isOnePageMode = true) {
    if (!classStudents.length) { alert('No students in this class!'); return; }
    classStudents.forEach((s, i) => {
        setTimeout(() => printReportCard(s, termLabel, subjects, weights, schoolName, schoolLogo, sectionName, isOnePageMode), i * 300);
    });
}

// ─── Main Component ───────────────────────────────────────────────────────────
const ReportsTab = ({
    students, schoolData, SUBJECTS, TERMS, WEIGHTS, SECTIONS,
    selectedClass, setSelectedClass, sectionClasses,
    currencySymbol, schoolSettings, setStudents
}) => {
    const schoolName = schoolData?.name || 'School';
    const schoolLogo = schoolSettings?.logo_url || '/logo.png';

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTerm, setSelectedTerm] = useState('');
    const [genderFilter, setGenderFilter] = useState('all');
    const [showClassStats, setShowClassStats] = useState(true);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isOnePageMode, setIsOnePageMode] = useState(true);

    const [checkedClasses, setCheckedClasses] = useState(selectedClass ? [selectedClass] : []);
    const [expandedSections, setExpandedSections] = useState(() => {
        const initial = {};
        (SECTIONS || []).forEach(sec => {
            initial[sec.id] = true;
        });
        return initial;
    });

    useEffect(() => {
        if (selectedClass && !checkedClasses.includes(selectedClass)) {
            setCheckedClasses([selectedClass]);
        }
    }, [selectedClass]);

    const toggleSectionExpand = (secId) => {
        setExpandedSections(prev => ({ ...prev, [secId]: !prev[secId] }));
    };

    const handleSectionCheckboxChange = (sec, checked) => {
        const secClasses = sec.classes || [];
        if (checked) {
            setCheckedClasses(prev => {
                const next = [...prev];
                secClasses.forEach(cls => {
                    if (!next.includes(cls)) next.push(cls);
                });
                if (next.length > 0 && setSelectedClass) {
                    setSelectedClass(next[0]);
                }
                return next;
            });
        } else {
            setCheckedClasses(prev => {
                const next = prev.filter(cls => !secClasses.includes(cls));
                if (next.length > 0 && setSelectedClass) {
                    setSelectedClass(next[0]);
                }
                return next;
            });
        }
    };

    const handleClassCheckboxChange = (cls, checked) => {
        if (checked) {
            setCheckedClasses(prev => {
                if (!prev.includes(cls)) {
                    const next = [...prev, cls];
                    if (setSelectedClass) setSelectedClass(cls);
                    return next;
                }
                return prev;
            });
        } else {
            setCheckedClasses(prev => {
                const next = prev.filter(c => c !== cls);
                if (next.length > 0 && setSelectedClass) {
                    setSelectedClass(next[0]);
                }
                return next;
            });
        }
    };

    const activeClass = selectedClass || checkedClasses[0] || '';

    // Derived data for the selected class
    const classSubjects = useMemo(() => {
        if (!SUBJECTS || Array.isArray(SUBJECTS)) return SUBJECTS || [];
        return SUBJECTS[activeClass] || [];
    }, [SUBJECTS, activeClass]);

    const classTerms = useMemo(() => {
        if (!TERMS || Array.isArray(TERMS)) return TERMS || [];
        return TERMS[activeClass] || [];
    }, [TERMS, activeClass]);

    const currentTerm = selectedTerm || classTerms[0] || '';

    const classStudents = useMemo(() => {
        return students
            .filter(s => checkedClasses.includes(s.grade))
            .filter(s => genderFilter === 'all' || s.admissions?.[0]?.gender === (genderFilter === 'boys' ? 'Male' : 'Female'))
            .filter(s => !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.id.toLowerCase().includes(searchQuery.toLowerCase()))
            .slice().sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
    }, [students, checkedClasses, genderFilter, searchQuery]);

    // Analytics for all checked classes (aggregated)
    const analytics = useMemo(() => {
        const all = students.filter(s => checkedClasses.includes(s.grade));
        const withResults = all.filter(s => (s.results || []).filter(r => !selectedTerm || r.term === selectedTerm).length > 0);
        if (withResults.length === 0) return null;

        const scores = withResults.map(s => {
            const res = (s.results || []).filter(r => !selectedTerm || r.term === selectedTerm);
            const studentWeights = (() => {
                if (!WEIGHTS || typeof WEIGHTS !== 'object') return {};
                const cw = WEIGHTS[s.grade];
                if (!cw || typeof cw !== 'object') return {};
                if (selectedTerm && cw[selectedTerm] && typeof cw[selectedTerm] === 'object') return cw[selectedTerm];
                return cw;
            })();
            return { student: s, pct: calcOverallPct(res, studentWeights) };
        }).sort((a, b) => b.pct - a.pct);

        const avgPct = Math.round(scores.reduce((sum, s) => sum + s.pct, 0) / scores.length);
        const passCount = scores.filter(s => s.pct >= 40).length;
        const gradeDistrib = {};
        scores.forEach(s => {
            const g = calcGrade(s.pct).grade;
            gradeDistrib[g] = (gradeDistrib[g] || 0) + 1;
        });

        return { scores, avgPct, passCount, failCount: scores.length - passCount, total: scores.length, gradeDistrib, topStudents: scores.slice(0, 3) };
    }, [students, checkedClasses, selectedTerm, WEIGHTS]);

    // Custom sequential printing delay wrapper
    const handlePrintAll = () => {
        if (!classStudents.length) { alert('No students in selection!'); return; }
        classStudents.forEach((s, i) => {
            const sWeights = (() => {
                if (!WEIGHTS || typeof WEIGHTS !== 'object') return {};
                const cw = WEIGHTS[s.grade];
                if (!cw || typeof cw !== 'object') return {};
                if (currentTerm && cw[currentTerm] && typeof cw[currentTerm] === 'object') return cw[currentTerm];
                return cw;
            })();
            const sSubjects = (() => {
                if (!SUBJECTS || Array.isArray(SUBJECTS)) return SUBJECTS || [];
                return SUBJECTS[s.grade] || [];
            })();
            const sSectionName = (SECTIONS || []).find(sec => sec.classes?.includes(s.grade))?.name || '';
            setTimeout(() => printReportCard(s, currentTerm, sSubjects, sWeights, schoolName, schoolLogo, sSectionName, isOnePageMode), i * 400);
        });
    };


    return (
        <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>

            {/* ── HEADER ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Report Cards</h2>
                    <p style={{ color: '#64748b', margin: '0.25rem 0 0' }}>Generate, print and analyze terminal report cards for any class.</p>
                </div>
                
                {/* Controls Container */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                    {/* Premium Styled Checkbox Toggle */}
                    <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.6rem', 
                        background: isOnePageMode ? '#eff6ff' : '#f8fafc',
                        border: isOnePageMode ? '1.5px solid #2563eb' : '1.5px solid #e2e8f0',
                        borderRadius: '12px', 
                        padding: '0.6rem 1.1rem', 
                        cursor: 'pointer', 
                        userSelect: 'none',
                        transition: 'all 0.2s ease',
                        boxShadow: isOnePageMode ? '0 2px 8px rgba(37,99,235,0.08)' : 'none'
                    }}>
                        <input 
                            type="checkbox" 
                            checked={isOnePageMode}
                            onChange={(e) => setIsOnePageMode(e.target.checked)}
                            style={{ 
                                width: '18px', 
                                height: '18px', 
                                cursor: 'pointer', 
                                accentColor: '#2563eb',
                                borderRadius: '4px'
                            }} 
                        />
                        <span style={{ 
                            fontSize: '0.9rem', 
                            fontWeight: 700, 
                            color: isOnePageMode ? '#2563eb' : '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            📄 One-Page Print Mode
                        </span>
                    </label>

                    <button
                        onClick={handlePrintAll}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg,#1e3a5f,#2563eb)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.3)', fontSize: '0.95rem' }}>
                        <Printer size={18} /> Print All ({classStudents.length})
                    </button>
                </div>
            </div>

            {/* ── FILTERS ROW ── */}
            <div style={{ display: 'flex', gap: isSidebarCollapsed ? '0rem' : '1.5rem', alignItems: 'flex-start', position: 'relative', transition: 'gap 0.3s ease' }}>
                {/* ── Collapsible Section Sidebar ── */}
                <div style={{
                    width: isSidebarCollapsed ? '0px' : '260px',
                    flexShrink: 0,
                    background: 'white',
                    borderRadius: '16px',
                    border: isSidebarCollapsed ? 'none' : '1px solid #e2e8f0',
                    padding: isSidebarCollapsed ? '0px' : '1.25rem',
                    boxShadow: isSidebarCollapsed ? 'none' : '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    opacity: isSidebarCollapsed ? 0 : 1,
                }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Filter size={18} color="#2563eb" /> Sections & Classes
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {(SECTIONS || []).map(sec => {
                            const isExpanded = expandedSections[sec.id];
                            const secClasses = sec.classes || [];
                            const allChecked = secClasses.length > 0 && secClasses.every(cls => checkedClasses.includes(cls));
                            const someChecked = secClasses.some(cls => checkedClasses.includes(cls)) && !allChecked;

                            return (
                                <div key={sec.id} style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', transition: 'all 0.2s' }}>
                                    {/* Section Row */}
                                    <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', cursor: 'pointer', userSelect: 'none', background: '#f1f5f9', borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none' }}
                                        onClick={() => toggleSectionExpand(sec.id)}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: '0.5rem', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', color: '#64748b' }}>
                                            <ChevronRight size={16} />
                                        </span>
                                        <input
                                            type="checkbox"
                                            checked={allChecked}
                                            ref={el => {
                                                if (el) el.indeterminate = someChecked;
                                            }}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                handleSectionCheckboxChange(sec, e.target.checked);
                                            }}
                                            onClick={e => e.stopPropagation()}
                                            style={{ marginRight: '0.75rem', width: '16px', height: '16px', cursor: 'pointer', accentColor: '#2563eb' }}
                                        />
                                        <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>{sec.name}</span>
                                    </div>

                                    {/* Classes List */}
                                    {isExpanded && (
                                        <div style={{ padding: '0.5rem', background: 'white', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            {secClasses.map(cls => {
                                                const isChecked = checkedClasses.includes(cls);
                                                const count = students.filter(s => s.grade === cls).length;

                                                return (
                                                    <div key={cls} 
                                                        onClick={() => handleClassCheckboxChange(cls, !isChecked)}
                                                        style={{ 
                                                            display: 'flex', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s',
                                                            background: isChecked ? '#f0f6ff' : 'transparent',
                                                        }}
                                                        onMouseEnter={e => { if (!isChecked) e.currentTarget.style.background = '#f8fafc'; }}
                                                        onMouseLeave={e => { if (!isChecked) e.currentTarget.style.background = 'transparent'; }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={(e) => {
                                                                e.stopPropagation();
                                                                handleClassCheckboxChange(cls, e.target.checked);
                                                            }}
                                                            onClick={e => e.stopPropagation()}
                                                            style={{ marginRight: '0.75rem', width: '15px', height: '15px', cursor: 'pointer', accentColor: '#2563eb' }}
                                                        />
                                                        <span style={{ fontWeight: isChecked ? 700 : 600, fontSize: '0.82rem', color: isChecked ? '#2563eb' : '#475569', flex: 1 }}>{cls}</span>
                                                        <span style={{ fontSize: '0.72rem', background: isChecked ? '#2563eb1a' : '#e2e8f0', color: isChecked ? '#2563eb' : '#64748b', padding: '0.15rem 0.4rem', borderRadius: '6px', fontWeight: 700 }}>{count}</span>
                                                    </div>
                                                );
                                            })}
                                            {secClasses.length === 0 && <div style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>No classes</div>}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {(!SECTIONS || SECTIONS.length === 0) && (
                            <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No sections defined</div>
                        )}
                    </div>
                </div>

                {/* ── Sidebar Collapse Toggle Button ── */}
                <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '20px',
                        height: '42px',
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0 8px 8px 0',
                        cursor: 'pointer',
                        boxShadow: '0 4px 10px rgba(37,99,235,0.25)',
                        position: 'absolute',
                        left: isSidebarCollapsed ? '0px' : '260px',
                        top: '120px',
                        zIndex: 100,
                        transition: 'left 0.3s ease, background-color 0.2s',
                        outline: 'none',
                    }}
                    title={isSidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2563eb'}
                >
                    {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                <div style={{ flex: 1, minWidth: 0, paddingLeft: isSidebarCollapsed ? '1.5rem' : '0px', transition: 'padding-left 0.3s ease' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>

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
                        📊 Class Analytics — {checkedClasses.length === 1 ? checkedClasses[0] : `${checkedClasses.length} Classes Selected`} {currentTerm ? `(${currentTerm})` : ''}
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
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>{classStudents.length} students in {checkedClasses.length === 1 ? checkedClasses[0] : `${checkedClasses.length} Classes`}</span>
                        {currentTerm && <span style={{ background: '#eff6ff', color: '#2563eb', padding: '0.3rem 0.8rem', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 700 }}>{currentTerm}</span>}
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                {['#', 'Student', 'ID', 'Overall %', 'Grade', 'Result', 'Teacher Remarks', 'Action'].map(h => (
                                    <th key={h} style={{ padding: '0.9rem 1rem', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px', textAlign: h === 'Action' ? 'center' : 'left' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {classStudents.map((student, idx) => {
                                const res = (student.results || []).filter(r => !currentTerm || r.term === currentTerm);
                                const studentWeights = (() => {
                                    if (!WEIGHTS || typeof WEIGHTS !== 'object') return {};
                                    const cw = WEIGHTS[student.grade];
                                    if (!cw || typeof cw !== 'object') return {};
                                    if (currentTerm && cw[currentTerm] && typeof cw[currentTerm] === 'object') return cw[currentTerm];
                                    return cw;
                                })();
                                const pct = res.length > 0 ? calcOverallPct(res, studentWeights) : null;
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
                                        <td style={{ padding: '0.9rem 1rem' }}>
                                            <input type="text" 
                                                placeholder={gInfo ? getGradeRemark(gInfo.grade) : "Write remark..."}
                                                defaultValue={(student.termRemarks && student.termRemarks[currentTerm]) || ''}
                                                onBlur={(e) => {
                                                    const val = e.target.value;
                                                    if(setStudents) {
                                                        setStudents(prev => prev.map(s => {
                                                            if(s.id === student.id) {
                                                                return { ...s, termRemarks: { ...(s.termRemarks || {}), [currentTerm]: val } };
                                                            }
                                                            return s;
                                                        }));
                                                    }
                                                }}
                                                style={{ width: '100%', minWidth: '150px', padding: '0.5rem 0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none' }}
                                            />
                                        </td>
                                        <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                                            <button
                                                onClick={() => {
                                                    const sWeights = (() => {
                                                        if (!WEIGHTS || typeof WEIGHTS !== 'object') return {};
                                                        const cw = WEIGHTS[student.grade];
                                                        if (!cw || typeof cw !== 'object') return {};
                                                        if (currentTerm && cw[currentTerm] && typeof cw[currentTerm] === 'object') return cw[currentTerm];
                                                        return cw;
                                                    })();
                                                    const sSubjects = (() => {
                                                        if (!SUBJECTS || Array.isArray(SUBJECTS)) return SUBJECTS || [];
                                                        return SUBJECTS[student.grade] || [];
                                                    })();
                                                    const sSectionName = (SECTIONS || []).find(sec => sec.classes?.includes(student.grade))?.name || '';
                                                    printReportCard(student, currentTerm, sSubjects, sWeights, schoolName, schoolLogo, sSectionName, isOnePageMode);
                                                }}
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
        </div>
        </div>
    );
};

export default ReportsTab;
