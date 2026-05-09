const fs = require('fs');
const path = 'c:\\\\Professional Projects\\\\SAAS\\\\src\\\\admin\\\\tabs\\\\AttendanceTab.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add holiday stats
content = content.replace(/const leave = records\.filter\(r => r\.status === 'leave'\)\.length;/g, `const leave = records.filter(r => r.status === 'leave').length;
                const holiday = records.filter(r => r.status === 'holiday').length;`);

content = content.replace(/const presentForPct = present \+ leave \+ late;/g, `const presentForPct = present + leave + late + holiday;`);

content = content.replace(/present, absent, leave, late, /g, `present, absent, leave, late, holiday, `);

// 2. Add to table display buttons
content = content.replace(/<button onClick=\{\(\) => markAttendance\(student\.id, 'late'\)\}.*?<\/button>/g, match => `${match}
                                                <button onClick={() => markAttendance(student.id, 'holiday')} title="Mark Holiday"
                                                    style={{ padding: '0.4rem 0.65rem', borderRadius: '6px', background: todayRecord?.status === 'holiday' ? '#0284c7' : '#e0f2fe', color: todayRecord?.status === 'holiday' ? 'white' : '#0284c7', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem' }}>🌴 H</button>`);

// 3. Add to edit history
content = content.replace(/\['present', 'absent', 'leave', 'late', 'unmark'\]/g, "['present', 'absent', 'leave', 'late', 'holiday', 'unmark']");

content = content.replace(/st === 'late' \? '#d97706' :/g, "st === 'late' ? '#d97706' : st === 'holiday' ? '#0284c7' :");

content = content.replace(/st === 'late' \? '⏰ Lt' :/g, "st === 'late' ? '⏰ Lt' : st === 'holiday' ? '🌴 H' :");

// 4. Add to stats row
content = content.replace(/const lateToday = classStudents\.filter\(s => \(s\.attendance\?\.records \|\| \[\]\)\.some\(r => r\.date === filterDate && r\.status === 'late'\)\)\.length;/g, `const lateToday = classStudents.filter(s => (s.attendance?.records || []).some(r => r.date === filterDate && r.status === 'late')).length;
    const holidayToday = classStudents.filter(s => (s.attendance?.records || []).some(r => r.date === filterDate && r.status === 'holiday')).length;`);

content = content.replace(/const unmarkedToday = classStudents\.length - presentToday - absentToday - leaveToday - lateToday;/g, `const unmarkedToday = classStudents.length - presentToday - absentToday - leaveToday - lateToday - holidayToday;`);

content = content.replace(/\{ label: \`Late \(\$\{filterDate\}\)\`, val: lateToday, color: '#d97706', bg: '#fffbeb' \},/g, `{ label: \`Late (\${filterDate})\`, val: lateToday, color: '#d97706', bg: '#fffbeb' },
                    { label: \`Holiday (\${filterDate})\`, val: holidayToday, color: '#0284c7', bg: '#e0f2fe' },`);

// 5. Add bulk mark
content = content.replace(/<button onClick=\{\(\) => markAll\('absent'\)\}.*?<\/button>/g, match => `${match}
                    <button onClick={() => markAll('holiday')} style={{ padding: '0.5rem 1rem', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>🌴 All Holiday</button>`);

content = content.replace(/status === 'leave' \? 'Leave' : 'Late'/g, "status === 'leave' ? 'Leave' : status === 'holiday' ? 'Holiday' : 'Late'");

// 6. Record chips
content = content.replace(/r\.status === 'late' \? \{ bg: '#fef3c7', color: '#d97706', border: '#fcd34d' \}/g, "r.status === 'late' ? { bg: '#fef3c7', color: '#d97706', border: '#fcd34d' }\n                                                        : r.status === 'holiday' ? { bg: '#e0f2fe', color: '#0284c7', border: '#7dd3fc' }");
content = content.replace(/r\.status === 'late' \? '⏰' :/g, "r.status === 'late' ? '⏰' : r.status === 'holiday' ? '🌴' :");

// 7. HTML status mapping
content = content.replace(/status === 'late' \? '⏰ Late' :/g, "status === 'late' ? '⏰ Late' : status === 'holiday' ? '🌴 Holiday' :");

// 8. Search state and table filter
content = content.replace(/const filteredStudentsForSearch = allClassStudents\.filter/g, `const [mainSearchQuery, setMainSearchQuery] = useState('');\n    const filteredStudentsForSearch = allClassStudents.filter`);

content = content.replace(/const classStudents = allClassStudents\.filter\(s => \{/g, `const classStudents = allClassStudents.filter(s => {
        if (mainSearchQuery && !s.name.toLowerCase().includes(mainSearchQuery.toLowerCase()) && !s.id.toLowerCase().includes(mainSearchQuery.toLowerCase())) return false;`);

// 9. Add search input UI
content = content.replace(/<div style=\{\{ display: 'flex', gap: '0\.75rem', alignItems: 'center', flexWrap: 'wrap' \}\}>/, `<div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input type="text" placeholder="Search student..." value={mainSearchQuery} onChange={e => setMainSearchQuery(e.target.value)} className="form-input" style={{ padding: '0.5rem 0.8rem 0.5rem 2rem', width: '180px' }} />
                    </div>`);

// Add Search import if missing
if (!content.includes('Search,')) {
    content = content.replace(/import \{ /, 'import { Search, ');
}

// 10. Sidebar layout implementation
const genderTabsIdx = content.indexOf('{/* ── Gender Tabs ── */}');
if (genderTabsIdx > -1) {
    let sidebarHtml = `
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                {/* ── Collapsible Section Sidebar ── */}
                <div style={{ width: '260px', flexShrink: 0, background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem' }}>Sections & Classes</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {(sections || []).map(sec => (
                            <details key={sec.id} open style={{ background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                <summary style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#334155', cursor: 'pointer', outline: 'none', userSelect: 'none' }}>
                                    {sec.name}
                                </summary>
                                <div style={{ padding: '0.5rem', background: 'white', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                    {(sec.classes || []).map(cls => (
                                        <button key={cls} onClick={() => { setSelectedClass(cls); setGenderTab('all'); }}
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
                        {(!sections || sections.length === 0) && (
                            <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No sections defined</div>
                        )}
                    </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
    `;
    
    content = content.slice(0, genderTabsIdx) + sidebarHtml + content.slice(genderTabsIdx);
    
    // Close the divs
    content = content.replace(/<\/div>\\s*<\/div>\\s*\\n    \);\n\};/, "</div>\n                </div>\n            </div>\n        </div>\n    );\n};\n");
    
    // Remove the old top class selector
    content = content.replace(/<select className="form-input" style=\{\{ padding: '0\.5rem 0\.8rem', minWidth: '150px' \}\} value=\{selectedClass\} onChange=\{e => \{\s*setSelectedClass\(e\.target\.value\);\s*setGenderTab\('all'\);\s*\}\}>\s*\{sectionClasses\.map\(c => <option key=\{c\} value=\{c\}>\{c\}<\/option>\)\}\s*<\/select>/, '');
}

fs.writeFileSync(path, content);
console.log('Done patching AttendanceTab.jsx');
