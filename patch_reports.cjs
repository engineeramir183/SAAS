const fs = require('fs');
const path = 'c:\\\\Professional Projects\\\\SAAS\\\\src\\\\admin\\\\tabs\\\\ReportsTab.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add setStudents to props
content = content.replace(/schoolSettings\n\}\) => \{/, 'schoolSettings, setStudents\n}) => {');

// 2. Add Sidebar layout
const filterRowIdx = content.indexOf('{/* ── FILTERS ROW ── */}');
if (filterRowIdx > -1) {
    let sidebarHtml = `
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                {/* ── Collapsible Section Sidebar ── */}
                <div style={{ width: '260px', flexShrink: 0, background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem' }}>Sections & Classes</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {(SECTIONS || []).map(sec => (
                            <details key={sec.id} open style={{ background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                <summary style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#334155', cursor: 'pointer', outline: 'none', userSelect: 'none' }}>
                                    {sec.name}
                                </summary>
                                <div style={{ padding: '0.5rem', background: 'white', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                    {(sec.classes || []).map(cls => (
                                        <button key={cls} onClick={() => setSelectedClass(cls)}
                                            style={{ 
                                                textAlign: 'left', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', border: 'none', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.15s',
                                                background: selectedClass === cls ? '#eff6ff' : 'transparent',
                                                color: selectedClass === cls ? '#2563eb' : '#475569'
                                            }}>
                                            {cls}
                                        </button>
                                    ))}
                                    {(!sec.classes || sec.classes.length === 0) && <div style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', color: '#94a3b8' }}>No classes</div>}
                                </div>
                            </details>
                        ))}
                        {(!SECTIONS || SECTIONS.length === 0) && (
                            <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No sections defined</div>
                        )}
                    </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
    `;
    content = content.slice(0, filterRowIdx) + sidebarHtml + content.slice(filterRowIdx);
    
    // Close the divs
    content = content.replace(/<\/div>\s*\n    \);\n\};/, "</div>\n                </div>\n            </div>\n        </div>\n    );\n};");
    
    // Remove the class select from the filters row
    content = content.replace(/\{\/\* Class select \*\/\}[\s\S]*?<\/select>/, '');
}

// 3. Add Attendance summary & Parent Signature to printReportCard
const printHtmlStart = content.indexOf('const html = `<!DOCTYPE html>');
if (printHtmlStart > -1) {
    // We add attendance calculation before html
    content = content.replace(/const printDate = new Date\(\)\.toLocaleDateString/, `
    const printDate = new Date().toLocaleDateString
    // Calculate attendance
    const attendanceRecords = student.attendance?.records || [];
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length;
    const absentDays = attendanceRecords.filter(r => r.status === 'absent').length;
    const attPct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
    `);
    
    // Add Parent Signature
    content = content.replace(/<div class="sig-line">Class Teacher Signature<\/div>/, '<div class="sig-line">Parent / Guardian Signature</div>\n    <div class="sig-line">Class Teacher Signature</div>');
    content = content.replace(/grid-template-columns:1fr 1fr;gap:40px/, 'grid-template-columns:1fr 1fr 1fr;gap:30px');

    // Add Attendance + Remarks to print html
    content = content.replace(/<div class="overall">/, `
  <div style="padding:20px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">
    <div style="flex:1;padding-right:20px;">
      <div style="font-size:11px;text-transform:uppercase;color:#94a3b8;font-weight:700;margin-bottom:6px">Class Teacher Remarks</div>
      <div style="font-size:14px;font-weight:600;color:#1e293b;font-style:italic">"\${(student.termRemarks && student.termRemarks[termLabel]) || '_____________________________________________________'}"</div>
    </div>
    <div style="background:white;padding:12px 20px;border-radius:12px;border:1px solid #e2e8f0;text-align:center;min-width:200px">
      <div style="font-size:10px;text-transform:uppercase;color:#64748b;font-weight:700;margin-bottom:8px;letter-spacing:1px">Attendance Summary</div>
      <div style="display:flex;justify-content:space-between;gap:15px">
        <div><div style="font-size:16px;font-weight:800;color:#15803d">\${presentDays}</div><div style="font-size:10px;color:#94a3b8">Present</div></div>
        <div><div style="font-size:16px;font-weight:800;color:#dc2626">\${absentDays}</div><div style="font-size:10px;color:#94a3b8">Absent</div></div>
        <div><div style="font-size:16px;font-weight:800;color:#2563eb">\${attPct}%</div><div style="font-size:10px;color:#94a3b8">Rate</div></div>
      </div>
    </div>
  </div>
  <div class="overall">`);
}

// 4. Add Remarks Column to the table
content = content.replace(/'Result', 'Action'\]/, "'Result', 'Teacher Remarks', 'Action']");
content = content.replace(/<td style=\{\{ padding: '0\.9rem 1rem', textAlign: 'center' \}\}>\s*<button/, `<td style={{ padding: '0.9rem 1rem' }}>
                                            <input type="text" 
                                                placeholder="Write remark..."
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
                                            <button`);

fs.writeFileSync(path, content);
console.log('Done patching ReportsTab.jsx');
