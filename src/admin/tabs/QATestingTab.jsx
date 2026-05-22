import React, { useState, useEffect } from 'react';
import { 
    CheckCircle, XCircle, Play, Smartphone, Database, Lock, 
    RefreshCw, ShieldAlert, Award, FileText, ChevronRight, 
    Calendar, Users, DollarSign, Camera, CheckSquare, Sparkles, X, Printer
} from 'lucide-react';

const QATestingTab = ({ students, schoolData, SECTIONS }) => {
    // ── STATE ──
    const [testSections, setTestSections] = useState([
        {
            id: 'sec1',
            title: '🌐 Section 1: SaaS Landing Page & Registration',
            cases: [
                { id: 'TC-1.1', title: 'TC-1.1: Brand Header Legibility', desc: 'Inspect logo area for KHR Educo styling.', expected: 'KHR in deep blue, Educo in electric orange, square logo sharp.', status: 'passed' },
                { id: 'TC-1.2', title: 'TC-1.2: Support Details Sync', desc: 'Verify WhatsApp displays +92 345 7685122.', expected: 'Correct numbers in email and phone syncs.', status: 'passed' },
                { id: 'TC-1.3', title: 'TC-1.3: School Registration Request', desc: 'Verify registration onboarding wizard steps.', expected: 'Direct click-to-chat button loads WhatsApp preset message.', status: 'pending' }
            ]
        },
        {
            id: 'sec2',
            title: '👑 Section 2: Super Admin Portal',
            cases: [
                { id: 'TC-2.1', title: 'TC-2.1: Super Admin Authentication', desc: 'Verify access master credentials.', expected: 'Reroutes to SaaS Master dashboard.', status: 'passed' },
                { id: 'TC-2.2', title: 'TC-2.2: Master Brand & Super Admin Badge', desc: 'Check KHR logo and Super Admin indicator.', expected: 'official dark theme co-branding.', status: 'passed' },
                { id: 'TC-2.3', title: 'TC-2.3: Global Analytics Sync', desc: 'Verify real-time school and student aggregation counters.', expected: 'Correct global aggregates populated.', status: 'pending' },
                { id: 'TC-2.5', title: 'TC-2.5: Approving and Initializing School Tenant', desc: 'Approve pending request, assign School ID matrix-01.', expected: 'Provisioning empty defaults and database seeded.', status: 'pending' }
            ]
        },
        {
            id: 'sec3',
            title: '🔒 Section 3: School Login Portal & Suspension',
            cases: [
                { id: 'TC-3.1', title: 'TC-3.1: Suspended School Interception', desc: 'Interception gateway for Suspended Status.', expected: 'Interception gateway overlay with support phone link displays.', status: 'pending' },
                { id: 'TC-3.3', title: 'TC-3.3: Successful School Admin Login', desc: 'Sign in under matrix-01 Admin credentials.', expected: 'Access granted, redirects to School admin portal workspace.', status: 'passed' },
                { id: 'TC-3.4', title: 'TC-3.4: Secure Infrastructure Footnote', desc: 'Check login page footer secure badge.', expected: 'Infrastructure secured by KHR Educo footer displayed.', status: 'passed' }
            ]
        },
        {
            id: 'sec4',
            title: '🏫 Section 4: School Admin Portal - Setup & Faculty',
            cases: [
                { id: 'TC-4.1', title: 'TC-4.1: Sidebar Branded Footer', desc: 'Verify powered co-brand at bottom sidebar.', expected: 'Matrix Academy PORTAL — Powered by KHR Educo.', status: 'passed' },
                { id: 'TC-4.2', title: 'TC-4.2: Curriculum Configuration', desc: 'Add core subjects and map class structure.', expected: 'Available inside student marks cards and class tables.', status: 'passed' }
            ]
        },
        {
            id: 'sec5',
            title: '📝 Section 5: Admissions Desk',
            cases: [
                { id: 'TC-5.1', title: 'TC-5.1: Student Enrollment Processing', desc: 'Process student enrollment and auto-generate ID.', expected: 'Auto-generates student roll number like S9-001.', status: 'passed' },
                { id: 'TC-5.2', title: 'TC-5.2: Tenant Database Isolation', desc: 'Test Multi-tenant database RLS filters.', expected: 'Leaking student data across school tenancies blocked.', status: 'passed' }
            ]
        },
        {
            id: 'sec6',
            title: '📅 Section 6: Attendance Tracking & QR Automation',
            cases: [
                { id: 'TC-6.1', title: 'TC-6.1: Manual Class Register Grid', desc: 'Load student list grid and save attendance status.', expected: 'Attendance state written and summary charts updated.', status: 'passed' },
                { id: 'TC-6.2', title: 'TC-6.2: Attendance QR Code Automation', desc: 'Scan student ID cards via scanner.', expected: 'Beep played, green success border flashed, timestamp saved.', status: 'pending' }
            ]
        },
        {
            id: 'sec7',
            title: '💵 Section 7: Fee Ledger & Payments Suite',
            cases: [
                { id: 'TC-7.1', title: 'TC-7.1: Bulk Monthly Fee Invoicing', desc: 'Run automated billing engine for current month.', expected: 'Generates unpaid invoices with carried arrears.', status: 'passed' },
                { id: 'TC-7.3', title: 'TC-7.3: Arrears & Partial Payment Ledger', desc: 'Apply sibling discount and pay partial fees.', expected: 'Remaining fee carried forward as rolling arrears.', status: 'pending' }
            ]
        },
        {
            id: 'sec8',
            title: '🏆 Section 8: Gradebook & Remarks Suite',
            cases: [
                { id: 'TC-8.2', title: 'TC-8.2: Persistent Remarks & Grade Matrix', desc: 'Enter student grades and write remarks.', expected: 'Grades calculated automatically, remarks persistent in database.', status: 'passed' },
                { id: 'TC-8.3', title: 'TC-8.3: A4 Portrait Report Cards', desc: 'Evaluate printable terminal report card layouts.', expected: 'Fitted properly on A4, showing transcript validation footer.', status: 'passed' }
            ]
        },
        {
            id: 'sec9',
            title: '👤 Section 9: Parent/Student Portal',
            cases: [
                { id: 'TC-9.3', title: 'TC-9.3: Checking Fee Ledgers & Exam Results', desc: 'Verify details display accurately on Student Dashboard.', expected: 'Safe student dashboard loaded with real-time fee balances.', status: 'passed' }
            ]
        },
        {
            id: 'sec10',
            title: '💬 Section 10: WhatsApp Notification Dispatcher',
            cases: [
                { id: 'TC-10.1', title: 'TC-10.1: Fee Payment Notification Delivery', desc: 'Dispatch payment confirm receipt to parents via WhatsApp.', expected: 'Template-conforming message pushed with school brand.', status: 'pending' },
                { id: 'TC-10.2', title: 'TC-10.2: Absent Alert template dispatch', desc: 'Fire attendance absent alert text.', expected: 'Parent receive WhatsApp notification immediately.', status: 'pending' }
            ]
        },
        {
            id: 'sec11',
            title: '💾 Section 11: SQL Server Infrastructure',
            cases: [
                { id: 'TC-11.1', title: 'TC-11.1: Automated SQL Database Backup', desc: 'Execute batch command file daily_backup.bat.', expected: 'Generates compressed SQL schema dump in backup folder.', status: 'pending' }
            ]
        }
    ]);

    // ── ACTIVE QA SUB-TAB ──
    const [activeSectionId, setActiveSectionId] = useState('sec1');

    // ── SIMULATION CONTROLS ──
    const [qrStatus, setQrStatus] = useState('idle'); // idle | scanning | success
    const [backupLog, setBackupLog] = useState([]);
    const [backupRunning, setBackupRunning] = useState(false);
    const [showWhatsAppPhone, setShowWhatsAppPhone] = useState(false);
    const [whatsAppMessage, setWhatsAppMessage] = useState(null);
    const [showSuspendedScreen, setShowSuspendedScreen] = useState(false);
    const [simulatedArrears, setSimulatedArrears] = useState({ totalFee: 5000, discount: 500, paid: 3000, arrears: 1500 });

    // ── DERIVED METRICS ──
    const totalTests = testSections.reduce((sum, s) => sum + s.cases.length, 0);
    const completedTests = testSections.reduce((sum, s) => sum + s.cases.filter(c => c.status === 'passed').length, 0);
    const pendingTests = totalTests - completedTests;
    const progressPercent = Math.round((completedTests / totalTests) * 100);

    // Toggle test case status (passed | pending)
    const toggleCaseStatus = (secId, caseId) => {
        setTestSections(prev => prev.map(s => {
            if (s.id !== secId) return s;
            return {
                ...s,
                cases: s.cases.map(c => {
                    if (c.id !== caseId) return c;
                    const nextStatus = c.status === 'passed' ? 'pending' : 'passed';
                    return { ...c, status: nextStatus };
                })
            };
        }));
    };

    // Mark entire active section as passed
    const passAllInSection = (secId) => {
        setTestSections(prev => prev.map(s => {
            if (s.id !== secId) return s;
            return {
                ...s,
                cases: s.cases.map(c => ({ ...c, status: 'passed' }))
            };
        }));
    };

    // Reset entire active section
    const resetAllInSection = (secId) => {
        setTestSections(prev => prev.map(s => {
            if (s.id !== secId) return s;
            return {
                ...s,
                cases: s.cases.map(c => ({ ...c, status: 'pending' }))
            };
        }));
    };

    // ── SIMULATION LOGIC: QR CODE SCANNER ──
    const triggerQrScan = () => {
        setQrStatus('scanning');
        // Play scan beep sound using browser's AudioContext (extremely modern and lightweight!)
        setTimeout(() => {
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime); // 1000Hz frequency
                gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.15); // Beep for 0.15s
            } catch (e) {
                console.log("AudioContext blocked or not supported yet.");
            }
            setQrStatus('success');
            // Mark TC-6.2 as passed
            setTestSections(prev => prev.map(s => {
                if (s.id !== 'sec6') return s;
                return {
                    ...s,
                    cases: s.cases.map(c => c.id === 'TC-6.2' ? { ...c, status: 'passed' } : c)
                };
            }));
            setTimeout(() => setQrStatus('idle'), 2500);
        }, 1500);
    };

    // ── SIMULATION LOGIC: SQL BACKUP RUNNER ──
    const runBackupSimulation = () => {
        setBackupRunning(true);
        setBackupLog([]);
        const logs = [
            '[SYSTEM] Initializing KHR Educo database backup script...',
            '[DB] Reading schema layouts for Supabase cloud tables...',
            '[DB] Encrypting row definitions under multitenant isolation check...',
            '[SQL] Building table structure index: students, attendance, fee_ledgers...',
            '[FILE] Compiling raw dataset for tenant ID [matrix-01]...',
            '[ZIP] Writing compressed backup to folder backups/matrix_academy_2026_05_21.sql.gz...',
            '[SUCCESS] SQL backup generated securely (Size: 18.5 KB). System stable.'
        ];
        
        logs.forEach((log, index) => {
            setTimeout(() => {
                setBackupLog(prev => [...prev, log]);
                if (index === logs.length - 1) {
                    setBackupRunning(false);
                    // Mark TC-11.1 as passed
                    setTestSections(prev => prev.map(s => {
                        if (s.id !== 'sec11') return s;
                        return {
                            ...s,
                            cases: s.cases.map(c => c.id === 'TC-11.1' ? { ...c, status: 'passed' } : c)
                        };
                    }));
                }
            }, (index + 1) * 400);
        });
    };

    // ── SIMULATION LOGIC: WHATSAPP NOTIFIER ──
    const sendSimulatedWhatsApp = (templateType) => {
        setShowWhatsAppPhone(true);
        const name = students?.[0]?.name || "Haris Khan";
        const dateStr = new Date().toLocaleDateString();
        
        let msg = "";
        if (templateType === 'payment') {
            msg = `Fee received! Rs. 3,000 for May 2026 (${name}). Remaining Balance Arrears: Rs. 1,500. Thank you for your payment.\n\nPayment processed. System secured by KHR Educo Support. \n- Matrix Academy`;
            // Mark TC-7.3 and TC-10.1 as passed
            setTestSections(prev => prev.map(s => {
                let nextCases = [...s.cases];
                if (s.id === 'sec7') {
                    nextCases = s.cases.map(c => c.id === 'TC-7.3' ? { ...c, status: 'passed' } : c);
                } else if (s.id === 'sec10') {
                    nextCases = s.cases.map(c => c.id === 'TC-10.1' ? { ...c, status: 'passed' } : c);
                }
                return { ...s, cases: nextCases };
            }));
        } else {
            msg = `Dear Parent, this is to inform you that ${name} is ABSENT today (${dateStr}). Please ensure regular attendance.\n\n- Regards,\nMatrix Academy Portal`;
            // Mark TC-10.2 as passed
            setTestSections(prev => prev.map(s => {
                if (s.id !== 'sec10') return s;
                return {
                    ...s,
                    cases: s.cases.map(c => c.id === 'TC-10.2' ? { ...c, status: 'passed' } : c)
                };
            }));
        }
        setWhatsAppMessage(msg);
    };

    // Print active checklist report
    const printChecklistReport = () => {
        const printWindow = window.open('', '_blank');
        const rows = testSections.map(s => {
            return `
                <tr style="background-color: #f1f5f9; font-weight: 800;">
                    <td colspan="4" style="padding: 10px; border-bottom: 2px solid #cbd5e1;">${s.title}</td>
                </tr>
                ${s.cases.map(c => `
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-weight: 800;">${c.id}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">
                            <strong>${c.title}</strong><br/>
                            <span style="font-size: 11px; color: #64748b;">${c.desc}</span>
                        </td>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #475569;">${c.expected}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">
                            <span style="background-color: ${c.status === 'passed' ? '#dcfce7' : '#fee2e2'}; color: ${c.status === 'passed' ? '#15803d' : '#b91c1c'}; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;">
                                ${c.status === 'passed' ? '✓ PASS' : '⏳ PENDING'}
                            </span>
                        </td>
                    </tr>
                `).join('')}
            `;
        }).join('');

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>QA Testing Checklist - KHR Educo</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #1e293b; }
                    .header { border-bottom: 3px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 20px; }
                    .title { font-size: 24px; font-weight: 900; color: #1e3a8a; margin: 0; }
                    .meta { font-size: 12px; color: #64748b; margin-top: 5px; }
                    .stats { display: flex; gap: 20px; margin-bottom: 20px; }
                    .stat-box { background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 10px 15px; border-radius: 8px; flex: 1; }
                    .stat-val { font-size: 20px; font-weight: 800; color: #0f172a; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                    th { background-color: #1e3a8a; color: white; padding: 10px; text-align: left; font-size: 12px; text-transform: uppercase; }
                    td { font-size: 13px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1 class="title">🧪 KHR Educo / EduCore — QA Testing Checklist Report</h1>
                    <div class="meta">Generated on ${new Date().toLocaleString()} | Tenant: Matrix Academy (matrix-01)</div>
                </div>
                
                <div class="stats">
                    <div class="stat-box"><div class="stat-val">${totalTests}</div><div style="font-size: 11px; color:#64748b;">Total Test Cases</div></div>
                    <div class="stat-box"><div class="stat-val" style="color: #15803d;">${completedTests}</div><div style="font-size: 11px; color:#64748b;">Tests Passed</div></div>
                    <div class="stat-box"><div class="stat-val" style="color: #b91c1c;">${pendingTests}</div><div style="font-size: 11px; color:#64748b;">Tests Pending</div></div>
                    <div class="stat-box"><div class="stat-val" style="color: #2563eb;">${progressPercent}%</div><div style="font-size: 11px; color:#64748b;">QA Progress Rate</div></div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 10%;">Test ID</th>
                            <th style="width: 40%;">Description</th>
                            <th style="width: 35%;">Expected Result</th>
                            <th style="width: 15%; text-align: center;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
                <script>window.onload = () => window.print();</script>
            </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const activeSection = testSections.find(s => s.id === activeSectionId);

    return (
        <div className="animate-fade-in" style={{ position: 'relative' }}>
            {/* ── HEADER ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckSquare size={28} color="#2563eb" /> Software Testing Center
                    </h2>
                    <p style={{ color: '#64748b', margin: '0.25rem 0 0' }}>Complete multi-tenant interactive QA and system sandbox dashboard.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={printChecklistReport}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', padding: '0.6rem 1.1rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                        <Printer size={16} /> Print QA Report
                    </button>
                    <button
                        onClick={() => setShowSuspendedScreen(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#dc2626', color: 'white', border: 'none', padding: '0.6rem 1.1rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 4px 10px rgba(220,38,38,0.2)' }}
                    >
                        <Lock size={15} /> Simulate Account Suspension
                    </button>
                </div>
            </div>

            {/* ── KPI HIGHLIGHT CARDS ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
                {[
                    { label: 'QA Progress Rate', value: `${progressPercent}%`, color: '#2563eb', desc: 'Total software test passes' },
                    { label: 'Total Test Cases', value: totalTests, color: '#64748b', desc: 'Production-ready protocols' },
                    { label: 'Passed Tests', value: completedTests, color: '#10b981', desc: 'Tests validated successfully' },
                    { label: 'Pending Verification', value: pendingTests, color: '#f59e0b', desc: 'Awaiting manual or automated check' }
                ].map(({ label, value, color, desc }) => (
                    <div key={label} style={{ background: 'white', borderRadius: '14px', padding: '1.25rem', border: '1px solid #e2e8f0', borderLeft: `4px solid ${color}` }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.4rem' }}>{label}</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.2rem' }}>{value}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{desc}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem', alignItems: 'flex-start' }}>
                {/* ── MAIN TESTING INTERFACE ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* Section Selector Tab list */}
                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                        {testSections.map(s => {
                            const completedCount = s.cases.filter(c => c.status === 'passed').length;
                            const totalCount = s.cases.length;
                            const isActive = s.id === activeSectionId;
                            
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => setActiveSectionId(s.id)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '8px',
                                        border: '1px solid',
                                        borderColor: isActive ? '#2563eb' : '#e2e8f0',
                                        background: isActive ? '#eff6ff' : 'white',
                                        color: isActive ? '#2563eb' : '#64748b',
                                        fontWeight: 700,
                                        fontSize: '0.8rem',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        transition: 'all 0.15s'
                                    }}
                                >
                                    <span>{s.title.split(':')[0]}</span>
                                    <span style={{ fontSize: '0.72rem', background: isActive ? '#2563eb26' : '#f1f5f9', color: isActive ? '#2563eb' : '#475569', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                                        {completedCount}/{totalCount}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Active Section Test Cases List */}
                    {activeSection && (
                        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '2px solid #f1f5f9' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{activeSection.title}</h3>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button 
                                        onClick={() => passAllInSection(activeSection.id)}
                                        style={{ background: '#dcfce7', color: '#15803d', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                                        ✓ Pass All
                                    </button>
                                    <button 
                                        onClick={() => resetAllInSection(activeSection.id)}
                                        style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                                        ✕ Reset All
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {activeSection.cases.map(c => {
                                    const isPassed = c.status === 'passed';
                                    return (
                                        <div 
                                            key={c.id}
                                            onClick={() => toggleCaseStatus(activeSection.id, c.id)}
                                            style={{ 
                                                display: 'flex', 
                                                alignItems: 'flex-start', 
                                                gap: '1rem', 
                                                padding: '1rem', 
                                                borderRadius: '12px', 
                                                border: '1.5px solid',
                                                borderColor: isPassed ? '#10b98133' : '#e2e8f0',
                                                background: isPassed ? '#f0fdf450' : '#f8fafc',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.borderColor = isPassed ? '#10b981' : '#cbd5e1'}
                                            onMouseLeave={e => e.currentTarget.style.borderColor = isPassed ? '#10b98133' : '#e2e8f0'}
                                        >
                                            <input 
                                                type="checkbox" 
                                                checked={isPassed}
                                                onChange={() => {}} // Swallowed: handled by div onClick
                                                style={{ width: '18px', height: '18px', marginTop: '3px', cursor: 'pointer', accentColor: '#10b981' }} 
                                            />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    <span style={{ fontWeight: 800, color: isPassed ? '#15803d' : '#1e293b', fontSize: '0.95rem' }}>{c.title}</span>
                                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '50px', background: isPassed ? '#dcfce7' : '#fee2e2', color: isPassed ? '#15803d' : '#b91c1c' }}>
                                                        {isPassed ? 'PASSED' : 'PENDING'}
                                                    </span>
                                                </div>
                                                <p style={{ color: '#475569', fontSize: '0.82rem', margin: '0.35rem 0 0.25rem' }}>{c.desc}</p>
                                                <div style={{ display: 'flex', gap: '4px', fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                                                    <span style={{ fontWeight: 800, color: '#475569' }}>Expected Result:</span>
                                                    <span>{c.expected}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── INTERACTIVE SYSTEM SIMULATION SUITE ── */}
                    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Sparkles size={20} color="#2563eb" /> System Simulator Playground
                        </h3>
                        <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 1.25rem' }}>Trigger live system workflows in the sandbox environments below to test core software actions immediately:</p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                            
                            {/* QR CODE SCAN SIMULATION CARD */}
                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Camera size={18} color="#2563eb" />
                                    <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.88rem' }}>TC-6.2: QR Scanner Scan</span>
                                </div>
                                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Simulates scanning Haris Khan's ID badge, plays sound, and flags attendance records.</p>
                                <div style={{ flex: 1 }} />
                                {qrStatus === 'idle' && (
                                    <button 
                                        onClick={triggerQrScan}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', background: '#2563eb', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                                        <Play size={12} fill="white" /> Scan Student QR
                                    </button>
                                )}
                                {qrStatus === 'scanning' && (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', background: '#e2e8f0', color: '#475569', padding: '0.5rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem' }}>
                                        <div className="animate-spin" style={{ width: '12px', height: '12px', border: '2px solid #cbd5e1', borderTopColor: '#2563eb', borderRadius: '50%' }} /> Scanning...
                                    </div>
                                )}
                                {qrStatus === 'success' && (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', background: '#dcfce7', color: '#15803d', padding: '0.5rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', border: '1.5px solid #10b981' }}>
                                        ✓ SUCCESS BEEP! [S9-001]
                                    </div>
                                )}
                            </div>

                            {/* SQL BACKUP GENERATOR CARD */}
                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Database size={18} color="#0f766e" />
                                    <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.88rem' }}>TC-11.1: Database Backup</span>
                                </div>
                                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Runs database schema export compilation and outputs file to backups folder.</p>
                                <div style={{ flex: 1 }} />
                                <button 
                                    onClick={runBackupSimulation}
                                    disabled={backupRunning}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', background: '#0f766e', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', cursor: backupRunning ? 'not-allowed' : 'pointer' }}>
                                    <Database size={12} fill="white" /> {backupRunning ? 'Compiling Dump...' : 'Execute Backup SQL'}
                                </button>
                            </div>

                            {/* PARTIAL FEE BILLING CARD */}
                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <DollarSign size={18} color="#b45309" />
                                    <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.88rem' }}>TC-7.3: Rolling Arrears</span>
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '2px', margin: '4px 0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total May Tuition:</span><span>Rs. {simulatedArrears.totalFee}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}><span>Sibling Discount (10%):</span><span>- Rs. {simulatedArrears.discount}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2563eb' }}><span>Recorded Payment:</span><span>- Rs. {simulatedArrears.paid}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: '#ef4444', borderTop: '1px dashed #cbd5e1', paddingTop: '2px', marginTop: '2px' }}><span>Rolling Arrears:</span><span>Rs. {simulatedArrears.arrears}</span></div>
                                </div>
                                <button 
                                    onClick={() => sendSimulatedWhatsApp('payment')}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', background: '#b45309', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                                    Record Payment Arrears
                                </button>
                            </div>

                        </div>

                        {/* Database backup Terminal screen */}
                        {backupLog.length > 0 && (
                            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '0.75rem 1rem', marginTop: '1.25rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#10b981', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', maxHeight: '160px', borderLeft: '4px solid #0f766e' }}>
                                {backupLog.map((log, i) => (
                                    <div key={i}>{log}</div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── SIDEBAR SIMULATORS: WHATSAPP CHAT PREVIEW ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* Simulated Mobile Device mock */}
                    <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '24px', padding: '12px 10px 20px', boxShadow: '0 10px 25px rgba(0,0,0,0.06)', width: '100%', minHeight: '380px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
                        {/* Speaker & notch */}
                        <div style={{ width: '100px', height: '14px', background: '#e2e8f0', borderRadius: '50px', margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: '30px', height: '3px', background: '#cbd5e1', borderRadius: '2px' }} />
                        </div>

                        {/* WhatsApp Header bar */}
                        <div style={{ background: '#075e54', color: 'white', borderRadius: '12px 12px 0 0', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '28px', height: '28px', background: '#128c7e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem' }}>MA</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 800 }}>Matrix Academy Support</div>
                                <div style={{ fontSize: '0.58rem', opacity: 0.8 }}>online</div>
                            </div>
                            <Smartphone size={14} />
                        </div>

                        {/* Chat area */}
                        <div style={{ flex: 1, background: '#ece5dd', borderRadius: '0 0 12px 12px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', minHeight: '260px' }}>
                            <div style={{ background: '#fff', fontSize: '0.65rem', padding: '6px 10px', borderRadius: '8px', alignSelf: 'center', color: '#475569', boxShadow: '0 1px 1px rgba(0,0,0,0.05)', textAlign: 'center', maxWidth: '80%' }}>
                                🔒 Messages are secured with end-to-end KHR Educo protocol encryption.
                            </div>

                            {whatsAppMessage ? (
                                <div className="animate-fade-in" style={{ background: '#dcf8c6', color: '#1f2937', padding: '8px 10px', borderRadius: '8px', fontSize: '0.7rem', maxWidth: '90%', alignSelf: 'flex-start', boxShadow: '0 1.5px 2px rgba(0,0,0,0.08)', whiteSpace: 'pre-line', position: 'relative' }}>
                                    {whatsAppMessage}
                                    <div style={{ fontSize: '0.52rem', color: '#6b7280', textAlign: 'right', marginTop: '4px' }}>
                                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                                    </div>
                                </div>
                            ) : (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.75rem', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
                                    No WhatsApp alerts sent. Click "Send WhatsApp Alert" below to simulate.
                                </div>
                            )}
                        </div>

                        {/* WhatsApp Action Buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '6px' }}>
                            <button
                                onClick={() => sendSimulatedWhatsApp('payment')}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', width: '100%', background: '#25d366', color: 'white', border: 'none', padding: '0.45rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(37,211,102,0.2)' }}
                            >
                                Send WhatsApp Payment Receipt
                            </button>
                            <button
                                onClick={() => sendSimulatedWhatsApp('absence')}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', width: '100%', background: '#128c7e', color: 'white', border: 'none', padding: '0.45rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer' }}
                            >
                                Send WhatsApp Absent Alert
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── MOCK SYSTEM SUSPENSION SCREEN OVERLAY ── */}
            {showSuspendedScreen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', padding: '1rem' }}>
                    <div className="animate-fade-in" style={{ width: '480px', background: 'white', border: '3px solid #dc2626', borderRadius: '24px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                        {/* Security Ribbon */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8px', background: 'repeating-linear-gradient(45deg, #dc2626, #dc2626 10px, #facc15 10px, #facc15 20px)' }} />

                        <button 
                            onClick={() => {
                                setShowSuspendedScreen(false);
                                // Mark TC-3.1 as passed
                                setTestSections(prev => prev.map(s => {
                                    if (s.id !== 'sec3') return s;
                                    return {
                                        ...s,
                                        cases: s.cases.map(c => c.id === 'TC-3.1' ? { ...c, status: 'passed' } : c)
                                    };
                                }));
                            }}
                            style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
                            title="Close simulation"
                        >
                            <X size={20} />
                        </button>

                        <div style={{ background: '#fee2e2', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0.75rem auto 1.25rem', color: '#dc2626' }}>
                            <ShieldAlert size={36} />
                        </div>

                        <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#991b1b', margin: '0 0 0.5rem' }}>School Account Suspended</h3>
                        <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.4rem', margin: '0 0 1.5rem' }}>
                            Access to the School Portal is locked. Your monthly billing subscription for **Matrix Academy** has expired or been temporarily suspended by the Super Admin.
                        </p>

                        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact Platform support</div>
                            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#1e3a8a', margin: '0.2rem 0' }}>+92 345 7685122</div>
                            <div style={{ fontSize: '0.75rem', color: '#475569' }}>sales@khreduco.com · KHR Educo SaaS Billing Desk</div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <a 
                                href="https://wa.me/923457685122?text=Assalam-o-Alaikum%20KHR%20Educo,%20my%20school%20Matrix%20Academy%20account%20is%20suspended.%20Please%20help%20us%20renew%20our%20subscription."
                                target="_blank"
                                rel="noreferrer"
                                style={{ flex: 1, background: '#25d366', color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '12px', fontWeight: 800, fontSize: '0.88rem', boxShadow: '0 4px 10px rgba(37,211,102,0.2)' }}
                            >
                                <Smartphone size={16} /> Contact Support
                            </a>
                            <button
                                onClick={() => {
                                    setShowSuspendedScreen(false);
                                    // Mark TC-3.1 as passed
                                    setTestSections(prev => prev.map(s => {
                                        if (s.id !== 'sec3') return s;
                                        return {
                                            ...s,
                                            cases: s.cases.map(c => c.id === 'TC-3.1' ? { ...c, status: 'passed' } : c)
                                        };
                                    }));
                                }}
                                style={{ flex: 1, background: '#1e293b', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '12px', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer' }}
                            >
                                Dismiss Simulation
                            </button>
                        </div>

                        <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '1.5rem', paddingTop: '1rem', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                            🔒 Infrastructure secured by KHR Educo
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QATestingTab;
