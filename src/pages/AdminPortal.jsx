import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import {
    Users, Award, Calendar, DollarSign, LogOut,
    Save, CheckCircle, XCircle, Edit3, User,
    Download, Upload, FileText, Search, Camera,
    BellPlus, Trash2, Megaphone, PlusCircle, Lock,
    Building, School, Check, X, ChevronRight, Layout, Building2,
    GripVertical, ChevronUp, ChevronDown, Menu, TrendingDown, BookMarked,
    Clock
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSchoolData } from '../context/SchoolDataContext';
import { supabase } from '../supabaseClient';
import OnboardingWizard from '../components/OnboardingWizard';
import { sendWhatsAppMessage, WhatsAppTemplates } from '../services/WhatsAppService';
import { ActivityLogService } from '../services/ActivityLogService';

// ── Lazily-loaded tab components (module-level so references are stable) ──
const GradebookTab = lazy(() => import('../admin/tabs/GradebookTab'));
const ScannerTab = lazy(() => import('../admin/tabs/ScannerTab'));
const AttendanceTab = lazy(() => import('../admin/tabs/AttendanceTab'));
const FeeTab = lazy(() => import('../admin/tabs/FeeTab'));
const AdmissionsTab = lazy(() => import('../admin/tabs/AdmissionsTab'));
const ReportsTab = lazy(() => import('../admin/tabs/ReportsTab'));
const AnnouncementsTab = lazy(() => import('../admin/tabs/AnnouncementsTab'));
const FacultyTab = lazy(() => import('../admin/tabs/FacultyTab'));
const FacilitiesTab = lazy(() => import('../admin/tabs/FacilitiesTab'));
const BlogTab = lazy(() => import('../admin/tabs/BlogTab'));
const ClassListsTab = lazy(() => import('../admin/tabs/ClassListsTab'));
const ExpensesTab = lazy(() => import('../admin/tabs/ExpensesTab'));
const StudentEditModal = lazy(() => import('../admin/modals/StudentEditModal'));
const SettingsTab = lazy(() => import('../admin/tabs/SettingsTab'));
const DashboardTab = lazy(() => import('../admin/tabs/DashboardTab'));
const PayrollTab = lazy(() => import('../admin/tabs/PayrollTab'));
const LogsTab = lazy(() => import('../admin/tabs/LogsTab'));
const DiaryTab = lazy(() => import('../admin/tabs/DiaryTab'));
const WhatsAppSchedulerTab = lazy(() => import('../admin/tabs/WhatsAppSchedulerTab'));


const AdminPortal = ({ setIsAdmin, setCurrentPage }) => {
    const { schoolData, CLASSES, SUBJECTS, TERMS, SECTIONS, WEIGHTS, CLASS_SERIAL_STARTS, CLASS_FEE_DEFAULTS, EXPENSES, INQUIRIES, fetchData, fetchPublicData, setStudents, setFaculty, updateSchoolInfo, updateSchoolSettings, setAnnouncements, updateClasses, updateSubjects, updateTerms, updateSections, updateWeights, updateClassSerialStarts, updateClassFeeDefaults, updateExpenses, saveInquiry, deleteInquiry, adminCredentials, changeAdminPassword, currencySymbol, schoolSettings, completeOnboarding, loading, currentSchoolId, saveAttendanceRecords, deleteAttendanceRecords } = useSchoolData();
    
    // NOTE: loading check moved below all hooks to comply with React Rules of Hooks

    const schoolName = schoolData?.name || 'School Name';
    const students = schoolData?.students || [];
    const [activeTab, setActiveTab] = useState('dashboard');
    const [saveMessage, setSaveMessage] = useState('');
    const isProPlan = schoolSettings?.plan === 'pro' || schoolSettings?.plan === 'premium';
    const [upgradeModal, setUpgradeModal] = useState({ open: false, featureName: '' });
    const showSaveMessage = (msg) => {
        setSaveMessage(msg);
        setTimeout(() => setSaveMessage(''), 3000);
    };
    const sectionClasses = (SECTIONS || []).flatMap(s => s.classes || []);
    const [selectedClass, setSelectedClass] = useState(sectionClasses[0] || '');
    // Per-class subjects: SUBJECTS is now { className: [subject,...] }
    const classSubjects = (SUBJECTS && !Array.isArray(SUBJECTS) ? (SUBJECTS[selectedClass] || []) : []);
    const updateClassSubjects = (newList) => updateSubjects({ ...SUBJECTS, [selectedClass]: newList });
    const classTerms = (TERMS && !Array.isArray(TERMS) ? (TERMS[selectedClass] || []) : []);
    const updateClassTerms = (newList) => updateTerms({ ...TERMS, [selectedClass]: newList });
    const [reportSearch, setReportSearch] = useState('');

    // ── Rename a subject for the current class and update all student results ──
    const renameSubject = async (oldName, newName) => {
        if (!oldName || !newName || oldName === newName) return;
        // Update subjects map
        const newSubjects = { ...SUBJECTS, [selectedClass]: (SUBJECTS[selectedClass] || []).map(s => s === oldName ? newName : s) };
        await updateSubjects(newSubjects);
        // Update student results for that class
        const updatedStudents = students.map(s => {
            if (s.grade !== selectedClass) return s;
            const newResults = (s.results || []).map(r => r.subject === oldName ? { ...r, subject: newName } : r);
            const newPrev = (s.previousResults || []).map(term => ({ ...term, results: term.results.map(r => r.subject === oldName ? { ...r, subject: newName } : r) }));
            return { ...s, results: newResults, previousResults: newPrev };
        });
        await setStudents(updatedStudents);
        showSaveMessage(`Subject renamed: "${oldName}" → "${newName}"`);
    };

    // ── Add a subject to multiple classes at once ──
    const updateSubjectsForClasses = async (subjectName, targetClasses) => {
        if (!subjectName || !targetClasses || targetClasses.length === 0) return;
        const newSubjects = { ...(SUBJECTS || {}) };
        targetClasses.forEach(cls => {
            const existing = newSubjects[cls] || [];
            if (!existing.includes(subjectName)) newSubjects[cls] = [...existing, subjectName];
        });
        await updateSubjects(newSubjects);
        showSaveMessage(`"${subjectName}" added to ${targetClasses.length} class(es)!`);
    };

    // ── Gradebook State ──
    // ── Class Management State ──
    const [selectedSectionId, setSelectedSectionId] = useState(null);
    const [viewingClass, setViewingClass] = useState(null);
    const [classDetailTab, setClassDetailTab] = useState('boys');
    const [newSectionName, setNewSectionName] = useState('');

    // ── Confirm Modal State ──
    const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null, danger: true });
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const openConfirm = (title, message, onConfirm, danger = true) => setConfirmModal({ open: true, title, message, onConfirm, danger });
    const closeConfirm = () => setConfirmModal({ open: false, title: '', message: '', onConfirm: null, danger: true });

    // ── Change Admin Password State ──
    const [showChangePwd, setShowChangePwd] = useState(false);
    const [newAdminUser, setNewAdminUser] = useState('');
    const [newAdminPwd, setNewAdminPwd] = useState('');
    const [newAdminPwdConfirm, setNewAdminPwdConfirm] = useState('');

    // ── Attendance date filter ──
    const [attDateFilter, setAttDateFilter] = useState('');

    // Initialize selected section
    useEffect(() => {
        if (!selectedSectionId && SECTIONS && SECTIONS.length > 0) {
            setSelectedSectionId(SECTIONS[0].id);
        }
    }, [SECTIONS, selectedSectionId]);

    // ── One-time WEIGHTS migration: old format → class-scoped format ──────────
    // Old: { "Test 6": { "Biology": 75 } }
    // New: { "Free Medical": { "Test 6": { "Biology": 75 } }, "Pre Engineering": { "Test 6": { ... } } }
    useEffect(() => {
        if (!WEIGHTS || typeof WEIGHTS !== 'object' || Array.isArray(WEIGHTS)) return;
        if (sectionClasses.length === 0) return;

        // Detect old format: old format has term-name keys (strings that are NOT class names)
        // New format has class-name keys at the top level
        const topLevelKeys = Object.keys(WEIGHTS);
        if (topLevelKeys.length === 0) return;

        const isOldFormat = topLevelKeys.some(k => !sectionClasses.includes(k));
        if (!isOldFormat) return; // Already in new format, skip migration

        // migrate: apply old weights to every class
        console.log('[WEIGHTS MIGRATION] Detected old flat format, migrating…', WEIGHTS);
        const migrated = {};
        sectionClasses.forEach(cls => {
            migrated[cls] = { ...WEIGHTS }; // each class gets a copy of the old flat weights
        });
        updateWeights(migrated).then(() => {
            console.log('[WEIGHTS MIGRATION] Done. Weights are now class-scoped.');
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [WEIGHTS, sectionClasses.join(',')]);
    // ─────────────────────────────────────────────────────────────────────────

    // ── Gradebook State ──
    const [gbTerm, setGbTerm] = useState('');
    useEffect(() => {
        // Reset term selection when class changes to show folder view
        setGbTerm('');
    }, [selectedClass]);
    const [gbGenderTab, setGbGenderTab] = useState('boys'); // 'boys', 'girls', 'all'
    const [gbEdits, setGbEdits] = useState({});       // { studentId: { subject: obtained } }
    const [gbSaving, setGbSaving] = useState(false);
    const [showGbStats, setShowGbStats] = useState(true);
    const [newSubjectInput, setNewSubjectInput] = useState('');
    const [newTermInput, setNewTermInput] = useState('');
    const [showGbSettings, setShowGbSettings] = useState(false);

    // classWeights: the slice of WEIGHTS for the current class, e.g. WEIGHTS[selectedClass]
    const classWeights = (WEIGHTS && typeof WEIGHTS === 'object' && !Array.isArray(WEIGHTS) && WEIGHTS[selectedClass] && typeof WEIGHTS[selectedClass] === 'object') ? WEIGHTS[selectedClass] : WEIGHTS;
    const getSubjectTotal = (sub, term) => {
        const t = term || gbTerm || classTerms[0] || 'Current';
        if (classWeights) {
            if (classWeights[t] && typeof classWeights[t] === 'object' && classWeights[t][sub] !== undefined && classWeights[t][sub] !== '') return Number(classWeights[t][sub]);
            if (typeof classWeights[sub] === 'number') return Number(classWeights[sub]);
        }
        return 100;
    };
    // Wrapper: updates weights scoped to the current class only
    const updateClassWeights = (newClassWeights) => {
        const newW = { ...(WEIGHTS || {}), [selectedClass]: newClassWeights };
        updateWeights(newW);
    };

    // ── Overall Percentage Calculation ──
    // Uses per-subject totals from WEIGHTS: sum(obtained) / sum(totals) × 100
    // Falls back to 100 per subject if not configured.
    const calcOverallPct = (results) => {
        if (!results || results.length === 0) return 0;
        let totalObtained = 0, totalMax = 0;
        results.forEach(r => {
            const subTotal = getSubjectTotal(r.subject, r.term);
            let obtained = r.obtained;
            if (obtained === undefined) obtained = Math.round((r.percentage / 100) * subTotal);
            const numObtained = obtained === 'A' ? 0 : Number(obtained);

            totalObtained += numObtained;
            totalMax += subTotal;
        });
        return totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
    };

    // Alias for backward compat in export functions
    const calcWeightedAvg = calcOverallPct;

    // ── Grade Calculation (Pakistani Scale) ──
    const calcGrade = (pct) => {
        if (pct === 'Absent' || pct === 'ABS' || pct === 'A') return 'Absent';
        if (pct === null || pct === undefined || pct === '') return '—';
        const num = Number(pct);
        if (isNaN(num)) return '—';
        if (num >= 95) return 'A++';
        if (num >= 90) return 'A+';
        if (num >= 85) return 'A';
        if (num >= 80) return 'B++';
        if (num >= 75) return 'B+';
        if (num >= 70) return 'B';
        if (num >= 60) return 'C';
        if (num >= 50) return 'D';
        if (num >= 40) return 'E';
        return 'U';
    };

    const gradeColor = (pct) => {
        if (pct === 'Absent' || pct === 'ABS' || pct === 'A') return { bg: '#f3f4f6', text: '#4b5563', border: '#cbd5e1' };
        if (pct === null || pct === undefined || pct === '') return { bg: '#f8fafc', text: '#64748b', border: '#cbd5e1' };
        const num = Number(pct);
        if (isNaN(num)) return { bg: '#f8fafc', text: '#64748b', border: '#cbd5e1' };
        if (num >= 95) return { bg: '#f5f3ff', text: '#6d28d9', border: '#1e293b' }; // A++ (Violet)
        if (num >= 90) return { bg: '#f3e8ff', text: '#7c3aed', border: '#1e293b' }; // A+ (Purple)
        if (num >= 85) return { bg: '#ecfdf5', text: '#059669', border: '#1e293b' }; // A (Emerald)
        if (num >= 80) return { bg: '#f0fdf4', text: '#16a34a', border: '#1e293b' }; // B++ (Green)
        if (num >= 75) return { bg: '#f0fdfa', text: '#0d9488', border: '#1e293b' }; // B+ (Teal)
        if (num >= 70) return { bg: '#eff6ff', text: '#2563eb', border: '#1e293b' }; // B (Blue)
        if (num >= 60) return { bg: '#fef3c7', text: '#b45309', border: '#1e293b' }; // C (Amber)
        if (num >= 50) return { bg: '#fffbeb', text: '#d97706', border: '#1e293b' }; // D (Yellow)
        if (num >= 40) return { bg: '#fff7ed', text: '#ea580c', border: '#1e293b' }; // E (Orange)
        return { bg: '#fee2e2', text: '#dc2626', border: '#1e293b' }; // U (Red)
    };

    const getGradeRemark = (grade) => {
        switch (grade) {
            case 'A++': return 'Absolutely Outstanding! Your dedication and hard work truly paid off. Keep up the amazing effort! Incredible achievement! ';
            case 'A+': return 'Excellent work! Fantastic results';
            case 'A': return 'Adorable!';
            case 'B++': return 'Great job';
            case 'B+': return 'Well done!';
            case 'B': return 'Good progress. Keep it up! You have potential to do even better!';
            case 'C': return 'Satisfactory! Don’t be discouraged! DO More';
            case 'D': return 'Don’t give up! We’re here to help you';
            case 'E': return 'Performance needs serious improvement. Strong effort and consistent support are urgently needed. We believe in your potential—let’s work together to improve.!';
            case 'U': return 'Unsatisfactory!';
            case 'Absent': return 'Absent';
            default: return '';
        }
    };

    // Helper: get results for a specific term from a student's results array
    const getTermResults = (student, termLabel) => {
        return (student.results || []).filter(r => r.term === termLabel);
    };

    // Get the obtained value for a student/subject from edits or saved data (filtered by selected term)
    const getCellValue = (student, subject) => {
        if (gbEdits[student.id] && gbEdits[student.id][subject] !== undefined)
            return gbEdits[student.id][subject];
        const termLabel = gbTerm || classTerms[0] || 'Current';
        const termResults = getTermResults(student, termLabel);
        const r = termResults.find(r => r.subject === subject);
        return r ? (r.obtained !== undefined ? r.obtained : '') : '';
    };

    // Helper: filter students by gender for gradebook
    const filterByGender = (studentsList, genderTab) => {
        if (genderTab === 'all') return studentsList;
        const genderVal = genderTab === 'boys' ? 'Male' : 'Female';
        return studentsList.filter(s => s.admissions?.[0]?.gender === genderVal);
    };

    const handleCellEdit = (studentId, subject, value) => {
        let finalValue = value;
        if (typeof value === 'string' && value.trim().toUpperCase() === 'A') {
            finalValue = 'A';
        } else if (value !== '') {
            finalValue = Number(value);
            const subTotal = getSubjectTotal(subject, gbTerm || TERMS[0] || 'Current');
            if (finalValue > subTotal) return; // Deny entry above total marks
        } else {
            finalValue = '';
        }

        setGbEdits(prev => ({
            ...prev,
            [studentId]: { ...(prev[studentId] || {}), [subject]: finalValue }
        }));
    };

    const saveGradebook = async () => {
        if (Object.keys(gbEdits).length === 0) { showSaveMessage('No changes to save.'); return; }
        setGbSaving(true);
        const termLabel = gbTerm || classTerms[0] || 'Current';
        const classStudents = students.filter(s => s.grade === selectedClass);
        
        const resultsToSave = [];
        classStudents.forEach(s => {
            if (!gbEdits[s.id]) return;
            
            classSubjects.forEach(subject => {
                const editedValue = gbEdits[s.id]?.[subject];
                if (editedValue !== undefined) {
                    const existing = getTermResults(s, termLabel).find(r => r.subject === subject);
                    resultsToSave.push({
                        student_id: s.id,
                        term: termLabel,
                        subject: subject,
                        obtained: editedValue,
                        remarks: existing?.remarks || ''
                    });
                }
            });
        });

        const { error } = await schoolContext.saveExamResults(resultsToSave);
        setGbSaving(false);
        if (!error) {
            setGbEdits({});
            ActivityLogService.logActivity({
                schoolId: currentSchoolId,
                username: adminCredentials.username || 'admin',
                role: 'admin',
                action: 'Save Gradebook',
                targetName: `Class: ${selectedClass} - Term: ${termLabel}`,
                details: { students_count: Object.keys(gbEdits).length, term: termLabel }
            });
            showSaveMessage(`Gradebook saved for ${termLabel}!`);
        }
    };

    const saveRemarks = async (studentId, subject, remarks) => {
        const termLabel = gbTerm || classTerms[0] || 'Current';
        const student = students.find(s => s.id === studentId);
        if (!student) return;
        const result = getTermResults(student, termLabel).find(r => r.subject === subject);
        
        const { error } = await schoolContext.saveExamResults([{
            student_id: studentId,
            term: termLabel,
            subject: subject,
            obtained: result?.obtained ?? null,
            remarks: remarks
        }]);
        if (!error) {
            showSaveMessage('Remarks saved!');
        }
    };

    const archiveTerm = async () => {
        const termLabel = gbTerm || classTerms[0];
        if (!window.confirm(`Archive "${termLabel}" marks for ${selectedClass}? This will move this term's results to history.`)) return;
        const classStudents = students.filter(s => s.grade === selectedClass);
        const updatedStudents = classStudents.map(s => {
            const termResults = getTermResults(s, termLabel);
            const historyEntry = { term: termLabel, results: [...termResults] };
            // Remove this term's results, keep other terms
            const remainingResults = (s.results || []).filter(r => r.term !== termLabel);
            return {
                ...s,
                previousResults: [...(s.previousResults || []), historyEntry],
                results: remainingResults
            };
        });
        const allStudents = students.map(s => updatedStudents.find(u => u.id === s.id) || s);
        await setStudents(allStudents);
        showSaveMessage(`Term "${termLabel}" archived!`);
    };

    // ── Cumulative Excel Export ──
    // Exports one workbook with:
    //   - One sheet per archived term (from previousResults)
    //   - One "Current" sheet for active results
    //   - One "Summary" sheet showing all terms side-by-side
    const exportGradebookExcel = () => {
        const classStudents = students
            .filter(s => s.grade === selectedClass)
            .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
        const wb = XLSX.utils.book_new();

        // Collect all term names (archived + current)
        const archivedTermNames = [];
        classStudents.forEach(s => {
            (s.previousResults || []).forEach(h => {
                if (!archivedTermNames.includes(h.term)) archivedTermNames.push(h.term);
            });
        });

        const buildSheet = (termResults) => {
            // termResults: { studentId -> results[] }
            return classStudents.map(s => {
                const results = termResults[s.id] || [];
                const row = { 'Student ID': s.id, 'Student Name': s.name };
                SUBJECTS[selectedClass] && SUBJECTS[selectedClass].forEach(sub => {
                    const r = results.find(r => r.subject === sub);
                    row[`${sub} (Marks)`] = r ? r.obtained : '';
                    row[`${sub} (%)`] = r ? r.percentage : '';
                    row[`${sub} (Grade)`] = r ? r.grade : '';
                    const tLabel = r ? r.term : null;
                    const w = tLabel ? getSubjectTotal(sub, tLabel) : getSubjectTotal(sub);
                    if (w !== 100) row[`${sub} (Weight)`] = w;
                });
                const avg = results.length ? calcWeightedAvg(results) : '';
                row['Weighted Avg %'] = avg;
                row['Overall Grade'] = avg !== '' ? calcGrade(avg) : '';
                return row;
            });
        };

        // Sheet per archived term
        archivedTermNames.forEach(termName => {
            const termResults = {};
            classStudents.forEach(s => {
                const hist = (s.previousResults || []).find(h => h.term === termName);
                termResults[s.id] = hist ? hist.results : [];
            });
            const ws = XLSX.utils.json_to_sheet(buildSheet(termResults));
            XLSX.utils.book_append_sheet(wb, ws, termName.substring(0, 31));
        });

        // Per-term sheets for currently active terms (not archived)
        classTerms.forEach(termName => {
            if (archivedTermNames.includes(termName)) return; // already exported via archived
            const termResults = {};
            classStudents.forEach(s => {
                termResults[s.id] = getTermResults(s, termName);
            });
            // Only add sheet if there's data
            const hasData = Object.values(termResults).some(r => r.length > 0);
            if (hasData) {
                const ws = XLSX.utils.json_to_sheet(buildSheet(termResults));
                XLSX.utils.book_append_sheet(wb, ws, termName.substring(0, 31));
            }
        });

        // Summary sheet: student | Term1 Avg | Term2 Avg | ... | Overall
        const allTermNames = [...archivedTermNames, ...classTerms.filter(t => !archivedTermNames.includes(t))];
        const summaryRows = classStudents.map(s => {
            const row = { 'Student ID': s.id, 'Student Name': s.name, 'Gender': s.admissions?.[0]?.gender || '' };
            allTermNames.forEach(termName => {
                // Check archived first, then active
                const hist = (s.previousResults || []).find(h => h.term === termName);
                const res = hist ? hist.results : getTermResults(s, termName);
                row[`${termName} Avg%`] = res.length ? calcWeightedAvg(res) : '';
                row[`${termName} Grade`] = res.length ? calcGrade(calcWeightedAvg(res)) : '';
            });
            // Grand average across all terms
            const allAvgs = allTermNames.map(t => {
                const hist = (s.previousResults || []).find(h => h.term === t);
                const res = hist ? hist.results : getTermResults(s, t);
                return res.length ? calcWeightedAvg(res) : null;
            }).filter(v => v !== null);
            row['Grand Avg%'] = allAvgs.length ? Math.round(allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length) : '';
            row['Grand Grade'] = row['Grand Avg%'] !== '' ? calcGrade(row['Grand Avg%']) : '';
            return row;
        });
        const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

        XLSX.writeFile(wb, `Gradebook_${selectedClass}_AllTerms.xlsx`);
    };

    const importGradebookExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const wb = XLSX.read(evt.target.result, { type: 'binary' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(ws);
            const termLabel = gbTerm || classTerms[0] || 'Current';

            let hasError = false;
            let errorMessage = '';
            const newEdits = {};

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const studentId = row['Student ID'];
                if (!studentId) continue;
                newEdits[studentId] = {};
                for (let sub of classSubjects) {
                    let val = row[sub];
                    if (val !== undefined && val !== '') {
                        if (typeof val === 'string' && val.trim().toUpperCase() === 'A') {
                            newEdits[studentId][sub] = 'A';
                        } else {
                            const numVal = Number(val);
                            const subTotal = getSubjectTotal(sub, termLabel);
                            if (numVal > subTotal) {
                                hasError = true;
                                errorMessage = `Excel sheet rejected. Student ${studentId} has obtained ${numVal} marks for ${sub}, which is greater than the total marks (${subTotal}).`;
                                break;
                            }
                            newEdits[studentId][sub] = numVal;
                        }
                    }
                }
                if (hasError) break;
            }

            if (hasError) {
                openConfirm('Validation Error', errorMessage, null, true);
                return;
            }

            setGbEdits(newEdits);
            showSaveMessage(`Imported marks for ${Object.keys(newEdits).length} students into ${termLabel}. Click Save All to apply.`);
        };
        reader.readAsBinaryString(file);
        e.target.value = '';
    };

    const downloadGradebookTemplate = () => {
        const allClassStudents = students.filter(s => s.grade === selectedClass);
        const classStudents = filterByGender(allClassStudents, gbGenderTab);
        const termLabel = gbTerm || classTerms[0] || 'Current';
        const genderLabel = gbGenderTab === 'all' ? 'All' : (gbGenderTab === 'boys' ? 'Boys' : 'Girls');
        const rows = classStudents.map(s => {
            const row = { 'Student ID': s.id, 'Student Name': s.name, 'Gender': s.admissions?.[0]?.gender || '' };
            classSubjects.forEach(sub => { row[sub] = ''; });
            return row;
        });
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Marks Template');
        XLSX.writeFile(wb, `Marks_Template_${selectedClass}_${termLabel}_${genderLabel}.xlsx`);
    };

    // ── PDF Result Report ──
    const exportResultPDF = () => {
        const termLabel = gbTerm || classTerms[0] || 'Current';
        const allClassStudents = students.filter(s => s.grade === selectedClass);
        const classStudents = allClassStudents
            .filter(s => gbGenderTab === 'all' ? true : (gbGenderTab === 'boys' ? s.admissions?.[0]?.gender === 'Male' : s.admissions?.[0]?.gender === 'Female'))
            .slice()
            .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
        const subs = classSubjects;
        
        const printDate = new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' });
        const sectionName = (SECTIONS || []).find(s => s.classes.includes(selectedClass))?.name || '';
        const genderLabel = gbGenderTab === 'all' ? 'All Students' : (gbGenderTab === 'boys' ? 'Boys' : 'Girls');

        const gradeColors = (pct) => {
            if (pct === 'Absent' || pct === 'ABS' || pct === 'A') return { bg: '#f3f4f6', text: '#4b5563' };
            if (pct === null || pct === undefined || pct === '') return { bg: '#f8fafc', text: '#64748b' };
            const num = Number(pct);
            if (isNaN(num)) return { bg: '#f8fafc', text: '#64748b' };
            if (num >= 95) return { bg: '#f5f3ff', text: '#6d28d9' }; // A++ (Violet)
            if (num >= 90) return { bg: '#f3e8ff', text: '#7c3aed' }; // A+ (Purple)
            if (num >= 85) return { bg: '#ecfdf5', text: '#059669' }; // A (Emerald)
            if (num >= 80) return { bg: '#f0fdf4', text: '#16a34a' }; // B++ (Green)
            if (num >= 75) return { bg: '#f0fdfa', text: '#0d9488' }; // B+ (Teal)
            if (num >= 70) return { bg: '#eff6ff', text: '#2563eb' }; // B (Blue)
            if (num >= 60) return { bg: '#fef3c7', text: '#b45309' }; // C (Amber)
            if (num >= 50) return { bg: '#fffbeb', text: '#d97706' }; // D (Yellow)
            if (num >= 40) return { bg: '#fff7ed', text: '#ea580c' }; // E (Orange)
            return { bg: '#fee2e2', text: '#dc2626' }; // U (Red)
        };

        // Build rows
        const rows = classStudents.map((s, idx) => {
            const res = getTermResults(s, termLabel);
            const overall = res.length ? calcOverallPct(res) : null;
            const gc = overall !== null ? gradeColors(overall) : { bg: '#f8fafc', text: '#64748b' };
            const subCells = subs.map(sub => {
                const r = res.find(r => r.subject === sub);
                const ob = r ? r.obtained : null;
                const total = getSubjectTotal(sub, termLabel);
                const numOb = ob === 'A' ? 0 : ob;
                const pct = numOb !== null ? Math.round((numOb / total) * 100) : null;
                const sc = pct !== null ? gradeColors(pct) : { bg: '#f8fafc', text: '#64748b' };
                const displayOb = ob === 'A' ? 'ABS' : ob;
                const displayGrade = ob === 'A' ? 'Absent' : (pct !== null ? calcGrade(pct) : '');
                
                let displayHTML = '—';
                if (ob !== null) {
                    if (ob === 'A') {
                        displayHTML = `<span style="font-weight:700; color:#dc2626">ABS</span>`;
                    } else {
                        displayHTML = `<span style="font-weight:700">${ob}</span><br/><span style='font-size:9px;font-weight:700;background:${sc.bg};color:${sc.text};padding:1px 4px;border-radius:2px;border:1px solid ${sc.text}30'>${displayGrade}</span>`;
                    }
                }
                
                return `<td style="text-align:center; padding:8px 6px; border:1px solid #cbd5e1; background:${ob !== null ? sc.bg : '#f8fafc'}; color:#334155; font-size:11px;">${displayHTML}</td>`;
            }).join('');
            
            let overallHTML = '—';
            if (overall !== null) {
                const gradeVal = calcGrade(overall);
                overallHTML = `<span style="font-size:12px;font-weight:800">${overall}%</span><br/><span style='font-size:9.5px;font-weight:800;background:${gc.bg};color:${gc.text};padding:2px 6px;border-radius:3px;border:1px solid ${gc.text}30'>${gradeVal}</span>`;
            }
            
            return `
                <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}">
                    <td style="padding:10px; border:1px solid #cbd5e1; font-weight:600; font-size:11px; color:#64748b; text-align:center;">${idx + 1}</td>
                    <td style="padding:10px; border:1px solid #cbd5e1; font-weight:700; font-size:12px; color:#0f172a;">${s.name.toUpperCase()}</td>
                    <td style="padding:10px; border:1px solid #cbd5e1; font-size:11px; font-weight:600; color:#475569; text-align:center;">${s.id}</td>
                    ${subCells}
                    <td style="text-align:center; padding:10px 8px; border:1px solid #cbd5e1; background:${overall !== null ? gc.bg : '#f8fafc'}; color:#334155;">
                        ${overallHTML}
                    </td>
                    <td style="text-align:center; padding:10px 8px; border:1px solid #cbd5e1; font-weight:800; font-size:11px;">
                        ${overall !== null ? `<span style="padding:3px 8px; border-radius:4px; font-size:10px; font-weight:800; border:1px solid ${overall >= 40 ? '#a7f3d0' : '#fecaca'}; background:${overall >= 40 ? '#ecfdf5' : '#fef2f2'}; color:${overall >= 40 ? '#047857' : '#b91c1c'}">${overall >= 40 ? 'PASS' : 'FAIL'}</span>` : '—'}
                    </td>
                </tr>`;
        }).join('');

        // Stats
        const withResults = classStudents.filter(s => getTermResults(s, termLabel).length > 0);
        const passCount = withResults.filter(s => calcOverallPct(getTermResults(s, termLabel)) >= 40).length;
        const avgPct = withResults.length ? Math.round(withResults.reduce((sum, s) => sum + calcOverallPct(getTermResults(s, termLabel)), 0) / withResults.length) : 0;
        const topStudent = withResults.sort((a, b) => calcOverallPct(getTermResults(b, termLabel)) - calcOverallPct(getTermResults(a, termLabel)))[0];

        const subHeaders = subs.map(sub =>
            `<th style="padding:10px 6px; background:#0f172a; color:white; font-size:10px; font-weight:800; text-align:center; min-width:85px; border:1px solid #cbd5e1">${sub.toUpperCase()}<br/><span style='font-weight:500;font-size:8.5px;color:#94a3b8'>Total: ${getSubjectTotal(sub, termLabel)}</span></th>`
        ).join('');

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Result Report - ${selectedClass} - ${termLabel}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
  body { background: #dde3f0; color: #0f172a; padding: 30px; text-align: center; display: block; overflow-x: auto; }
  @page { size: A4 landscape; margin: 12mm 0; }
  @media print {
    .no-print { display: none !important; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 0; background: #fff; overflow: visible; display: block; }
    .report-container { box-shadow: none !important; margin: 0 !important; width: 100% !important; min-width: 100% !important; display: block !important; border: none !important; }
    .table-wrap { overflow-x: visible !important; width: 100% !important; padding: 20px 0 0 0 !important; }
    table { page-break-inside: auto; width: 100% !important; }
    tr { page-break-inside: avoid; page-break-after: auto; }
  }
  .report-container { display: inline-block; min-width: 100%; max-width: 1100px; background: #fff; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #cbd5e1; margin: 0 auto; text-align: left; overflow: hidden; }
  .header { background: #0f172a; color: white; padding: 24px 30px; text-align: center; border-bottom: 3px solid #1e3a8a; }
  .header h1 { font-size: 24px; font-weight: 800; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
  .header p { font-size: 11px; opacity: 0.85; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #cbd5e1; }
  .meta-bar { display: grid; grid-template-columns: repeat(7, 1fr); gap: 12px; background: #f8fafc; padding: 16px 30px; border-bottom: 1px solid #cbd5e1; text-align: center; }
  .meta-item { display: flex; flex-direction: column; gap: 4px; }
  .meta-label { font-size: 8.5px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px; }
  .meta-value { font-size: 12px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 2px; }
  .stats-bar { display: grid; grid-template-columns: repeat(4, 1fr) 2fr; gap: 16px; padding: 20px 30px; background: #fff; border-bottom: 1px solid #cbd5e1; }
  .stat-card { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px 14px; text-align: center; display: flex; flex-direction: column; justify-content: center; }
  .stat-card.top-performer { border: 1px solid #c084fc; background: #faf5ff; }
  .stat-num { font-size: 22px; font-weight: 800; color: #1e3a8a; }
  .stat-lbl { font-size: 8.5px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.5px; }
  .table-wrap { width: 100%; padding: 24px 30px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #cbd5e1; margin: 0; }
  thead tr th { background: #0f172a; color: white; padding: 10px 8px; font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; border: 1px solid #cbd5e1; }
  tbody tr td { border: 1px solid #cbd5e1; padding: 8px 10px; color: #334155; }
  .footer { text-align: center; padding: 16px 30px; font-size: 9.5px; color: #94a3b8; border-top: 1px solid #cbd5e1; background: #f8fafc; font-weight: 500; }
  .print-btn { position: fixed; bottom: 24px; right: 24px; background: #1e3a8a; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 13px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 12px rgba(30,58,138,0.3); text-transform: uppercase; letter-spacing: 1px; transition: all 0.2s ease; border: 1px solid #1e3a8a; }
  .print-btn:hover { background: #0f172a; transform: translateY(-1px); }
</style>
</head>
<body>
<div class="report-container">
<div class="header">
  <h1>${schoolName}</h1>
  <p>Result Report &nbsp;|&nbsp; ${sectionName ? sectionName + ' — ' : ''}${selectedClass} &nbsp;|&nbsp; ${termLabel} &nbsp;|&nbsp; Generated: ${printDate}</p>
</div>
<div class="meta-bar">
  <div class="meta-item"><span class="meta-label">Class</span><span class="meta-value">${selectedClass}</span></div>
  ${sectionName ? `<div class="meta-item"><span class="meta-label">Section</span><span class="meta-value">${sectionName}</span></div>` : ''}
  <div class="meta-item"><span class="meta-label">Term</span><span class="meta-value">${termLabel}</span></div>
  <div class="meta-item"><span class="meta-label">Gender Filter</span><span class="meta-value">${genderLabel}</span></div>
  <div class="meta-item"><span class="meta-label">Total Students</span><span class="meta-value">${classStudents.length}</span></div>
  <div class="meta-item"><span class="meta-label">Appeared</span><span class="meta-value">${withResults.length}</span></div>
  <div class="meta-item"><span class="meta-label">Date</span><span class="meta-value">${printDate}</span></div>
</div>
<div class="stats-bar">
  <div class="stat-card"><div class="stat-num" style="color:#15803d">${passCount}</div><div class="stat-lbl">Passed</div></div>
  <div class="stat-card"><div class="stat-num" style="color:#dc2626">${withResults.length - passCount}</div><div class="stat-lbl">Failed</div></div>
  <div class="stat-card"><div class="stat-num" style="color:#1e3a8a">${withResults.length ? Math.round((passCount / withResults.length) * 100) : 0}%</div><div class="stat-lbl">Pass Rate</div></div>
  <div class="stat-card"><div class="stat-num">${avgPct}%</div><div class="stat-lbl">Class Average</div></div>
  ${topStudent ? `<div class="stat-card top-performer" style="flex:2;"><div class="stat-num" style="font-size:15px;color:#7c3aed">${topStudent.name.toUpperCase()}</div><div class="stat-lbl">Top Performer — ${calcOverallPct(getTermResults(topStudent, termLabel))}%</div></div>` : ''}
</div>
<div class="table-wrap">
<table>
  <thead>
    <tr>
      <th style="padding:10px 8px; background:#0f172a; color:white; text-align:center; font-size:10px; border:1px solid #cbd5e1">#</th>
      <th style="padding:10px 8px; background:#0f172a; color:white; text-align:left; font-size:10px; min-width:160px; border:1px solid #cbd5e1">Student Name</th>
      <th style="padding:10px 8px; background:#0f172a; color:white; text-align:center; font-size:10px; min-width:90px; border:1px solid #cbd5e1">ID</th>
      ${subHeaders}
      <th style="padding:10px 8px; background:#1e3a8a; color:white; text-align:center; font-size:10px; min-width:70px; border:1px solid #cbd5e1">Overall</th>
      <th style="padding:10px 8px; background:#1e3a8a; color:white; text-align:center; font-size:10px; min-width:55px; border:1px solid #cbd5e1">Result</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
</div>
<div class="footer">
  ${schoolName.toUpperCase()} &nbsp;|&nbsp; ${selectedClass} &nbsp;|&nbsp; ${termLabel} &nbsp;|&nbsp; Printed: ${printDate} &nbsp;|&nbsp; Total Students: ${classStudents.length}
</div>
</div>
<button class="print-btn no-print" onclick="window.print()">Print / Save PDF</button>
</body>
</html>`;

        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
        setTimeout(() => win.print(), 600);
    };

    // ── Export Passwords PDF ──
    const exportPasswordsPDF = (classToExport) => {
        const classStudents = students
            .filter(s => s.grade === classToExport)
            .slice()
            .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

        

        const pages = classStudents.map((s, idx) => {
            return `
            <div class="page">
                <div class="card">
                    <div class="card-header">
                        <h1>${schoolName}</h1>
                        <p>Student Login Credentials</p>
                    </div>
                    <div class="card-body">
                        <h2>${s.name.toUpperCase()}</h2>
                        <div class="detail-row">
                            <span class="detail-label">Father's Name</span>
                            <span class="detail-value">${(s.admissions?.[0]?.fatherName || '—').toUpperCase()}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Class</span>
                            <span class="detail-value">${s.grade.toUpperCase()}</span>
                        </div>
                        <div class="credentials-box">
                            <div class="cred-item">
                                <span class="cred-label">Login ID / Username</span>
                                <span class="cred-value">${s.id}</span>
                            </div>
                            <div class="cred-item">
                                <span class="cred-label">Password</span>
                                <span class="cred-value" style="font-family:monospace;">${s.password || (s.id + '123')}</span>
                            </div>
                        </div>
                        <p style="margin-top: 25px; font-size: 13px; color: #64748b; text-align: center; line-height: 1.5;">
                            Please keep these credentials secure. You can use them to access the Student Portal to view your attendance, academic results, and fee status.
                        </p>
                    </div>
                </div>
            </div>
            `;
        }).join('');

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Student Credentials - ${classToExport}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
  body { background: #dde3f0; color: #0f172a; }
  @page { size: A4 portrait; margin: 0; }
  @media print {
    .no-print { display: none !important; }
    body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { page-break-after: always; height: 100vh; display: flex; align-items: center; justify-content: center; }
  }
  .page { height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .card { width: 100%; max-width: 600px; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #cbd5e1; }
  .card-header { background: #0f172a; color: white; padding: 40px; text-align: center; border-bottom: 3px solid #1e3a8a; }
  .card-header h1 { font-size: 30px; font-weight: 800; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
  .card-header p { font-size: 12px; opacity: 0.85; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; color: #cbd5e1; }
  .card-body { padding: 40px; }
  .card-body h2 { font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 30px; text-align: center; border-bottom: 2px solid #cbd5e1; padding-bottom: 20px; }
  .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed #cbd5e1; margin-bottom: 15px; }
  .detail-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
  .detail-value { font-size: 15px; font-weight: 700; color: #0f172a; }
  .credentials-box { margin-top: 30px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 25px; }
  .cred-item { margin-bottom: 20px; }
  .cred-item:last-child { margin-bottom: 0; }
  .cred-label { display: block; font-size: 11px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; }
  .cred-value { display: block; font-size: 22px; font-weight: 800; color: #0f172a; background: white; padding: 12px 16px; border-radius: 6px; border: 1px solid #cbd5e1; letter-spacing: 1px; }
  .print-btn { position: fixed; bottom: 24px; right: 24px; background: #1e3a8a; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 13px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 12px rgba(30,58,138,0.3); text-transform: uppercase; letter-spacing: 1px; transition: all 0.2s ease; border: 1px solid #1e3a8a; }
  .print-btn:hover { background: #0f172a; transform: translateY(-1px); }
</style>
</head>
<body>
  ${pages}
  <button class="print-btn no-print" onclick="window.print()">Print Passwords PDF</button>
</body>
</html>`;

        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
        setTimeout(() => win.print(), 600);
    };


    const attendanceFileRef = useRef(null);
    const marksFileRef = useRef(null);
    const feeFileRef = useRef(null);
    const photoFileRef = useRef(null);
    const facultyFileRef = useRef(null);
    const facilityFileRef = useRef(null);
    const blogImageRef = useRef(null);
    const gbImportFileRef = useRef(null);


    // Announcement state
    const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', date: new Date().toISOString().split('T')[0] });

    // Admission Form State
    const admissionInitialState = {
        applyingFor: sectionClasses[0] || '', applicationDate: new Date().toISOString().split('T')[0],
        serialNumber: '', // Added Serial Number field
        studentName: '', bForm: '', dob: '', nationality: '', gender: '', religion: '',
        allergies: 'No', allergiesDetails: '', chronicCondition: 'No', chronicConditionDetails: '',
        medication: 'No', medicationDetails: '', fatherName: '', fatherCnic: '',
        contact: '', whatsapp: '', address: '', docs: { photos: false, bform: false, cnic: false }, photo: ''
    };
    const [admissionData, setAdmissionData] = useState(admissionInitialState);
    const [selectedStudent, setSelectedStudent] = useState(null);

    const [editingFacultyId, setEditingFacultyId] = useState(null);
    const [editingFacilityId, setEditingFacilityId] = useState(null);
    const [tempFacultyMember, setTempFacultyMember] = useState(null);
    const [tempFacility, setTempFacility] = useState(null);
    const [editingBlogId, setEditingBlogId] = useState(null);
    const [tempBlog, setTempBlog] = useState(null);

    // Class Management State
    const [selectedClassForList, setSelectedClassForList] = useState(sectionClasses[0] || '');
    const [classListSearch, setClassListSearch] = useState('');
    const [newClassName, setNewClassName] = useState('');
    const [editingSectionId, setEditingSectionId] = useState(null);
    const [editingSectionName, setEditingSectionName] = useState('');
    const classImportFileRef = useRef(null);
    const studentPhotoUploadRef = useRef(null);
    const [editingStudentId, setEditingStudentId] = useState(null);
    const [editStudentData, setEditStudentData] = useState(null);

    const handleFacultyPhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const publicUrl = await uploadImage(file, 'Faculty');
        if (publicUrl) {
            if (editingFacultyId === 'new') {
                setTempFacultyMember(prev => ({ ...prev, image: publicUrl }));
            } else {
                const { error } = await supabase.from('faculty').update({ image: publicUrl }).eq('id', editingFacultyId).eq('school_id', currentSchoolId);
                if (error) {
                    alert('Error updating database: ' + error.message);
                } else {
                    // Update state FIRST so UI doesn't revert while fetching
                    setTempFacultyMember(prev => ({ ...prev, image: publicUrl }));
                    await fetchData();
                    showSaveMessage('Faculty photo updated!');
                }
            }
        }
    };

    const handleFacilityPhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const publicUrl = await uploadImage(file, 'Facilities');
        if (publicUrl) {
            if (editingFacilityId === 'new') {
                setTempFacility(prev => ({ ...prev, image: publicUrl }));
            } else {
                const { error } = await supabase.from('facilities').update({ image: publicUrl }).eq('id', editingFacilityId).eq('school_id', currentSchoolId);
                if (error) {
                    alert('Error updating database: ' + error.message);
                } else {
                    // Update state FIRST so UI doesn't revert while fetching
                    setTempFacility(prev => ({ ...prev, image: publicUrl }));
                    await fetchData();
                    showSaveMessage('Facility photo updated!');
                }
            }
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsAdmin(false);
        setCurrentPage('home');
    };

    const uploadImage = async (file, bucket) => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;

            let { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error.message);
            alert('Error uploading image: ' + error.message);
            return null;
        }
    };

    const handleStudentPhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        showSaveMessage('Uploading photo…');
        const publicUrl = await uploadImage(file, 'students');
        if (publicUrl) {
            setEditStudentData(prev => ({ ...prev, photo: publicUrl, image: publicUrl }));
            showSaveMessage('Photo uploaded! Click Save Changes to apply.');
        }
        e.target.value = '';
    };

    const handleAdmissionPhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const publicUrl = await uploadImage(file, 'students');
        if (publicUrl) {
            setAdmissionData(prev => ({ ...prev, photo: publicUrl }));
            showSaveMessage('Admission photo uploaded!');
        }
    };

    // --- ADMISSION FORM PRINTING & SAVING ---
    const printAdmissionForm = async () => {
        const d = admissionData;

        if (!d.studentName.trim()) {
            alert("Please enter Student Name first!");
            return;
        }

        // 1. Save to Supabase
        try {
            // Generate a temporary ID. The database trigger will replace this with a real sequential ID.
            let studentId = `TEMP-${Date.now()}`;

            // Auto-assign serial number — globally unique across ALL students
            let autoSerial = d.serialNumber ? d.serialNumber : null;
            if (!autoSerial) {
                const classStart = CLASS_SERIAL_STARTS?.[d.applyingFor];
                if (classStart !== undefined && classStart !== null) {
                    // Floor: start from class starting serial (or 1 below it)
                    const floor = parseInt(classStart, 10) - 1;
                    // Find the highest serial across ALL students in the entire college
                    const globalMaxSerial = students.reduce((max, s) => {
                        const sn = parseInt(s.serialNumber, 10);
                        return !isNaN(sn) ? Math.max(max, sn) : max;
                    }, floor);
                    // New serial = max(floor, globalMax) + 1
                    autoSerial = String(Math.max(floor, globalMaxSerial) + 1);
                }
            }
            // Also validate if admin manually entered a serial — block duplicates
            if (autoSerial && students.some(s => String(s.serialNumber) === String(autoSerial))) {
                alert(`Serial number ${autoSerial} is already in use by another student. Please assign a unique serial number.`);
                return;
            }

            const newStudentRecord = {
                id: studentId,
                serial_number: autoSerial || null,
                name: d.studentName,
                password: (schoolSettings?.school_id?.split('-')[0]?.toLowerCase() || 'pass') + Math.floor(1000 + Math.random() * 9000),
                grade: d.applyingFor,
                image: d.photo,
                admissions: [d],
                school_id: currentSchoolId
            };

            const { error } = await supabase.from('students').insert([newStudentRecord]);

            if (error) throw error;

            await fetchData(); // Refresh local state
            ActivityLogService.logActivity({
                schoolId: currentSchoolId,
                username: adminCredentials.username || 'admin',
                role: 'admin',
                action: 'Register Student',
                targetName: `${d.studentName} (ID: ${studentId})`,
                details: { class: d.applyingFor, serial: autoSerial }
            });
            showSaveMessage(`Student ${d.studentName} saved with ID: ${studentId}${autoSerial ? ` (Serial: ${autoSerial})` : ''}`);

            // WhatsApp Automation: Welcome Message
            if (schoolSettings?.auto_admission_alert) {
                const welcomeMsg = WhatsAppTemplates.admissionWelcome(d.studentName, studentId, schoolName);
                sendWhatsAppMessage(d.whatsapp, welcomeMsg, schoolSettings);
            }
        } catch (error) {
            console.error("Error saving admission:", error.message);
            alert("Error saving to database, but printing will continue: " + error.message);
        }

        // 2. Print Logic

        // Helper to create boxed character spans
        const boxChars = (str, length) => {
            const chars = (str || '').replace(/[^A-Z0-9 ]/gi, '').toUpperCase().split('');
            let html = '';
            for (let i = 0; i < length; i++) {
                html += `<span class="cbox">${chars[i] === ' ' ? '&nbsp;' : (chars[i] || '')}</span>`;
            }
            return html;
        };


        // 2. Print Logic
        const html = buildAdmissionFormHTML(d);
        const printWin = window.open('', '_blank');
        printWin.document.write(`<!DOCTYPE html><html><head><title>Admission Form - ${d.studentName || 'New Student'}</title><style>${ADMISSION_FORM_CSS}</style></head><body onload="setTimeout(()=>{window.print();},600)"><div class="no-print" style="text-align:center;padding:14px 20px;background:#0f172a;border-bottom:3px solid #1e293b;display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;"><span style="color:white;font-weight:700;font-size:13px;">📄 To save as PDF: change <strong>Destination</strong> to <em>"Save as PDF"</em> in the print dialog</span><button onclick="window.print()" style="padding:9px 22px;background:white;color:#0f172a;border:none;border-radius:8px;cursor:pointer;font-weight:800;font-size:13px;">🖨️ Print / Save as PDF</button></div>${html}</body></html>`);
        printWin.document.close();
    };

    // ── Global CSS for Admission Forms ──
    const ADMISSION_FORM_CSS = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; font-family: 'Inter', sans-serif; }
        body { margin: 0; padding: 0; background: #dde3f0; color: #0f172a; }

        .page { 
            width: 210mm; 
            min-height: 297mm; 
            margin: 0 auto; 
            background: #fff; 
            padding: 10mm 12mm 10mm 12mm; 
            position: relative; 
            box-shadow: 0 0 24px rgba(0,0,0,0.1); 
            overflow: hidden; 
            box-sizing: border-box;
            page-break-after: always;
        }

        .header-box {
            border: 2.5px solid #1e3a8a;
            border-radius: 14px;
            padding: 10px 16px;
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            background: #fff;
        }
        
        .header-logo-container {
            width: 70px;
            height: 70px;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 3px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fff;
            margin-right: 15px;
            flex-shrink: 0;
        }
        
        .header-logo-img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        
        .header-text-container {
            flex-grow: 1;
            text-align: center;
        }
        
        .school-title {
            color: #1e3a8a;
            font-size: 25px;
            font-weight: 900;
            letter-spacing: 0.5px;
            margin: 0 0 2px 0;
            text-transform: uppercase;
        }
        
        .school-address {
            color: #1e3a8a;
            font-size: 10px;
            font-weight: 700;
            margin: 0 0 3px 0;
        }
        
        .school-phone {
            color: #e11d48; /* Magenta/Pinkish Red */
            font-size: 12px;
            font-weight: 800;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
        }

        .metadata-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 12px;
            padding: 0 4px;
        }
        
        .meta-val-underlined {
            color: #1e3a8a;
            font-weight: 800;
            border-bottom: 2px solid #1e3a8a;
            padding: 0 6px 1px 6px;
            display: inline-block;
        }
        
        .meta-val-highlight {
            color: #7c3aed; /* Bold purple/violet */
            font-weight: 900;
            font-size: 11px;
            padding: 0 4px;
        }

        .title-badge-container {
            display: flex;
            justify-content: center;
            margin: 6px 0 16px 0;
        }
        
        .title-badge {
            background-color: #1e3a8a;
            color: white;
            padding: 7px 32px;
            font-weight: 800;
            font-size: 14px;
            border-radius: 6px;
            letter-spacing: 1px;
            text-transform: uppercase;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .photo-box-dashed {
            width: 105px;
            height: 135px;
            border: 1.5px dashed #475569;
            border-radius: 4px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 3px;
            background: #fff;
            overflow: hidden;
        }
        
        .photo-box-dashed img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .ph-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        
        .ph-bold {
            font-weight: 700;
            color: #64748b;
            font-size: 10.5px;
            text-transform: uppercase;
        }
        
        .ph-sub {
            color: #94a3b8;
            font-size: 7.5px;
            margin-top: 2px;
        }

        .section-badge {
            color: white;
            font-weight: 800;
            font-size: 11.5px;
            padding: 4px 14px;
            border-radius: 5px;
            width: fit-content;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
            margin-top: 14px;
        }
        
        .section-student { background-color: #1e3a8a; }
        .section-health { background-color: #0f766e; }
        .section-parents { background-color: #b91c1c; }
        .section-undertaking { background-color: #1e293b; }
        .section-documents { background-color: #3b82f6; }

        .section-subtitle {
            font-size: 7.5px;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
            margin-top: -3px;
            margin-bottom: 10px;
            letter-spacing: 0.3px;
        }

        /* Character grid boxes */
        .char-box-row {
            display: inline-flex;
            align-items: center;
            gap: 0px;
        }
        
        .char-box {
            width: 15.5px;
            height: 17.5px;
            border: 1px solid #475569;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: 800;
            color: #0f172a;
            background: #fff;
            margin-right: 1.5px;
            text-transform: uppercase;
        }
        
        .char-separator {
            font-weight: 900;
            color: #475569;
            margin: 0 4px;
            font-size: 11px;
        }

        /* Grid fields layout */
        .fields-table {
            display: flex;
            flex-direction: column;
            gap: 9px;
        }
        
        .fields-table-row {
            display: flex;
            align-items: center;
        }
        
        .fields-table-lbl {
            font-size: 9px;
            font-weight: 800;
            color: #0f172a;
            width: 105px;
            flex-shrink: 0;
            text-transform: uppercase;
        }
        
        .fields-table-val {
            flex-grow: 1;
            display: flex;
            align-items: center;
        }
        
        .fields-table-val-split {
            flex-grow: 1;
            display: flex;
            align-items: center;
        }
        
        .inline-lbl {
            font-size: 9px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
        }
        
        .inline-val-underlined {
            border-bottom: 1.5px solid #cbd5e1;
            padding-bottom: 2px;
            font-size: 10.5px;
            font-weight: 700;
            color: #0f172a;
            padding-left: 6px;
            flex-grow: 1;
            min-height: 15px;
        }

        /* Checkboxes styling */
        .checkbox-group {
            display: flex;
            gap: 12px;
            align-items: center;
        }
        
        .checkbox-item-custom {
            display: flex;
            align-items: center;
            gap: 5px;
            font-weight: 800;
            font-size: 9px;
            color: #0f172a;
        }
        
        .chk-box-custom {
            width: 11px;
            height: 11px;
            border: 1.5px solid #0f172a;
            border-radius: 2px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fff;
            flex-shrink: 0;
        }
        
        .chk-box-custom.checked {
            background: #1e3a8a;
            border-color: #1e3a8a;
            position: relative;
        }
        
        .chk-box-custom.checked::after {
            content: '';
            width: 2.5px;
            height: 5px;
            border: solid white;
            border-width: 0 1.5px 1.5px 0;
            transform: rotate(45deg);
            position: absolute;
            top: 1px;
        }
        
        .section-health .chk-box-custom.checked {
            background: #0f766e;
            border-color: #0f766e;
        }

        /* Medical Table */
        .medical-table {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .medical-row {
            display: flex;
            align-items: center;
        }
        
        .med-lbl {
            font-size: 9px;
            font-weight: 800;
            color: #0f172a;
            width: 125px;
            flex-shrink: 0;
        }
        
        .med-details-lbl {
            font-size: 9px;
            font-weight: 800;
            color: #0f172a;
            margin-left: 15px;
            margin-right: 5px;
        }
        
        .med-details-val {
            flex-grow: 1;
            border-bottom: 1.5px solid #cbd5e1;
            padding-bottom: 2px;
            font-size: 10px;
            font-weight: 700;
            color: #0f172a;
            min-height: 15px;
            padding-left: 6px;
        }

        /* Undertaking block */
        .undertaking-container {
            background: #fff;
            border: 1px solid #e2e8f0;
            padding: 8px 12px;
            border-radius: 4px;
        }
        
        .undertaking-bullet-list {
            margin: 4px 0 0 14px;
            padding: 0;
            list-style-type: disc;
            font-size: 8.5px;
            line-height: 1.5;
            color: #334155;
        }
        
        .undertaking-bullet-list li {
            margin-bottom: 2px;
        }

        .docs-checklist-custom {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
            padding: 4px 0;
        }

        /* Signatures block */
        .signature-block {
            text-align: center;
            width: 100%;
        }
        
        .signature-line {
            border-bottom: 1.5px solid #0f172a;
            margin-bottom: 5px;
            height: 30px;
        }
        
        .signature-lbl {
            font-size: 9px;
            font-weight: 800;
            color: #1e3a8a;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        
        .signature-lbl.principal-lbl {
            color: #b91c1c;
        }

        .bottom-accent { 
            height: 5px; 
            background: #1e3a8a; 
            position: absolute; 
            bottom: 0; 
            left: 0; 
            right: 0; 
        }

        @media print {
            @page { size: A4; margin: 0; }
            body { background: #fff; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
            .page { border: none; box-shadow: none; width: 100%; min-height: 100vh; padding: 10mm 12mm 10mm 12mm; }
            .no-print { display: none !important; }
        }
    `;

    const buildAdmissionFormHTML = (d) => {
        const bForm = d.bForm || d.admissions?.[0]?.bForm || '';
        const fatherCnic = d.fatherCnic || d.admissions?.[0]?.fatherCnic || '';
        const adm = d.admissions?.[0] || {};
        const studentName = d.studentName || d.name || '';
        const applyingFor = d.applyingFor || d.grade || '';
        const applicationDate = d.applicationDate || adm.applicationDate || new Date().toISOString().split('T')[0];
        const dob = d.dob || adm.dob || '';
        const nationality = d.nationality || adm.nationality || 'PAKISTANI';
        const gender = d.gender || adm.gender || '';
        const religion = d.religion || adm.religion || 'ISLAM';
        const photo = d.photo || d.image || '';
        
        const allergies = d.allergies || adm.allergies || 'No';
        const allergiesDetails = d.allergiesDetails || adm.allergiesDetails || '';
        const chronicCondition = d.chronicCondition || adm.chronicCondition || 'No';
        const chronicConditionDetails = d.chronicConditionDetails || adm.chronicConditionDetails || '';
        const medication = d.medication || adm.medication || 'No';
        const medicationDetails = d.medicationDetails || adm.medicationDetails || '';
        
        const fatherName = d.fatherName || adm.fatherName || '';
        const contact = d.contact || adm.contact || '';
        const address = d.address || adm.address || '';
        const whatsapp = d.whatsapp || adm.whatsapp || '';
        const serialNumber = d.serialNumber || d.serial_number || '';
        const docs = d.docs || { photos: false, bform: false, cnic: false };

        const formatDate = (val) => {
            if (!val) return '';
            if (val.includes('-')) {
                const parts = val.split('-');
                if (parts.length === 3) {
                    if (parts[0].length === 4) {
                        return `${parts[0]}-${parts[1]}-${parts[2]}`;
                    }
                }
            }
            return val;
        };

        const renderCharBoxes = (str, totalBoxes) => {
            const chars = (str || '').replace(/[^A-Z0-9 ]/gi, '').toUpperCase().split('');
            let html = '<div class="char-box-row">';
            for (let i = 0; i < totalBoxes; i++) {
                const char = chars[i] || '';
                html += `<span class="char-box">${char === ' ' ? '&nbsp;' : char}</span>`;
            }
            html += '</div>';
            return html;
        };

        const renderCNICBoxes = (cnicVal) => {
            const digits = (cnicVal || '').replace(/[^0-9]/g, '').split('');
            let html = '<div class="char-box-row">';
            for (let i = 0; i < 5; i++) {
                html += `<span class="char-box">${digits[i] || '&nbsp;'}</span>`;
            }
            html += '<span class="char-separator">-</span>';
            for (let i = 5; i < 12; i++) {
                html += `<span class="char-box">${digits[i] || '&nbsp;'}</span>`;
            }
            html += '<span class="char-separator">-</span>';
            html += `<span class="char-box">${digits[12] || '&nbsp;'}</span>`;
            html += '</div>';
            return html;
        };

        const renderDOBBoxes = (dobVal) => {
            let day = '', month = '', year = '';
            if (dobVal && dobVal.includes('-')) {
                const parts = dobVal.split('-');
                if (parts.length === 3) {
                    if (parts[0].length === 4) {
                        year = parts[0];
                        month = parts[1];
                        day = parts[2];
                    } else {
                        day = parts[0];
                        month = parts[1];
                        year = parts[2];
                    }
                }
            }
            const dayDigits = day.split('');
            const monthDigits = month.split('');
            const yearDigits = year.split('');

            let html = '<div class="char-box-row">';
            for (let i = 0; i < 2; i++) {
                html += `<span class="char-box">${dayDigits[i] || '&nbsp;'}</span>`;
            }
            html += '<span class="char-separator">-</span>';
            for (let i = 0; i < 2; i++) {
                html += `<span class="char-box">${monthDigits[i] || '&nbsp;'}</span>`;
            }
            html += '<span class="char-separator">-</span>';
            for (let i = 0; i < 4; i++) {
                html += `<span class="char-box">${yearDigits[i] || '&nbsp;'}</span>`;
            }
            html += '</div>';
            return html;
        };

        return `
        <div class="page">
            <div class="header-box">
                <div class="header-logo-container">
                    <img src="${schoolSettings?.logo_url || '/logo.png'}" class="header-logo-img" onerror="this.style.display='none'" />
                </div>
                <div class="header-text-container">
                    <div class="school-title">${schoolName || 'ACS SCHOOL & COLLEGE'}</div>
                    <div class="school-address">${schoolData?.contact?.address || 'Main Jhang Road Near Attock Petrol Pump, Painsra, Faisalabad'}</div>
                    <div class="school-phone">📞 ${schoolData?.contact?.phone || schoolData?.contact?.whatsapp || '0300-1333275'}</div>
                </div>
            </div>
            
            <div class="metadata-row">
                <div>APPLYING FOR: <span class="meta-val-underlined" style="min-width: 120px;">${applyingFor.toUpperCase()}</span></div>
                <div>SERIAL #: <span class="meta-val-highlight">${serialNumber || d.inquiryNumber || '0'}</span></div>
                <div>DATE: <span class="meta-val-underlined">${formatDate(applicationDate)}</span></div>
            </div>

            <div class="title-badge-container">
                <div class="title-badge">ADMISSION FORM</div>
            </div>
            
            <div style="display: grid; grid-template-columns: 3.2fr 1fr; gap: 20px; align-items: start;">
                <div>
                    <div class="section-badge section-student">STUDENT'S INFORMATION</div>
                    <div class="section-subtitle">USE CAPITAL LETTERS ONLY</div>
                    
                    <div class="fields-table">
                        <div class="fields-table-row">
                            <div class="fields-table-lbl">STUDENT NAME:</div>
                            <div class="fields-table-val">${renderCharBoxes(studentName, 26)}</div>
                        </div>
                        <div class="fields-table-row">
                            <div class="fields-table-lbl">B-FORM NO:</div>
                            <div class="fields-table-val">${renderCNICBoxes(bForm)}</div>
                        </div>
                        <div class="fields-table-row">
                            <div class="fields-table-lbl">DATE OF BIRTH:</div>
                            <div class="fields-table-val-split">
                                ${renderDOBBoxes(dob)}
                                <div style="display: flex; gap: 5px; align-items: center; margin-left: 12px; flex-grow: 1;">
                                    <span class="inline-lbl">NATIONALITY:</span>
                                    <span class="inline-val-underlined">${nationality.toUpperCase()}</span>
                                </div>
                            </div>
                        </div>
                        <div class="fields-table-row">
                            <div class="fields-table-lbl">GENDER:</div>
                            <div class="fields-table-val-split">
                                <div class="checkbox-group">
                                    <div class="checkbox-item-custom">
                                        <div class="chk-box-custom ${gender.toLowerCase() === 'male' ? 'checked' : ''}"></div>
                                        <span>MALE</span>
                                    </div>
                                    <div class="checkbox-item-custom">
                                        <div class="chk-box-custom ${gender.toLowerCase() === 'female' ? 'checked' : ''}"></div>
                                        <span>FEMALE</span>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 5px; align-items: center; margin-left: 15px; flex-grow: 1;">
                                    <span class="inline-lbl">RELIGION:</span>
                                    <span class="inline-val-underlined">${religion.toUpperCase()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="display: flex; justify-content: flex-end; align-items: start; margin-top: 15px;">
                    <div class="photo-box-dashed">
                        ${photo ? `<img src="${photo}" />` : `
                        <div class="ph-placeholder">
                            <div class="ph-bold">Photograph</div>
                            <div class="ph-sub">(Passport Size)</div>
                        </div>
                        `}
                    </div>
                </div>
            </div>
            
            <div class="section-badge section-health">HEALTH & MEDICAL INFO</div>
            <div class="medical-table">
                <div class="medical-row">
                    <span class="med-lbl">ALLERGIES:</span>
                    <div class="checkbox-group">
                        <div class="checkbox-item-custom">
                            <div class="chk-box-custom ${allergies.toLowerCase() === 'yes' ? 'checked' : ''}"></div>
                            <span>YES</span>
                        </div>
                        <div class="checkbox-item-custom">
                            <div class="chk-box-custom ${allergies.toLowerCase() !== 'yes' ? 'checked' : ''}"></div>
                            <span>NO</span>
                        </div>
                    </div>
                    <span class="med-details-lbl">DETAILS:</span>
                    <span class="med-details-val">${allergies.toLowerCase() === 'yes' ? (allergiesDetails || '—').toUpperCase() : ''}</span>
                </div>
                <div class="medical-row">
                    <span class="med-lbl">CHRONIC CONDITION:</span>
                    <div class="checkbox-group">
                        <div class="checkbox-item-custom">
                            <div class="chk-box-custom ${chronicCondition.toLowerCase() === 'yes' ? 'checked' : ''}"></div>
                            <span>YES</span>
                        </div>
                        <div class="checkbox-item-custom">
                            <div class="chk-box-custom ${chronicCondition.toLowerCase() !== 'yes' ? 'checked' : ''}"></div>
                            <span>NO</span>
                        </div>
                    </div>
                    <span class="med-details-lbl">DETAILS:</span>
                    <span class="med-details-val">${chronicCondition.toLowerCase() === 'yes' ? (chronicConditionDetails || '—').toUpperCase() : ''}</span>
                </div>
                <div class="medical-row">
                    <span class="med-lbl">REGULAR MEDICATION:</span>
                    <div class="checkbox-group">
                        <div class="checkbox-item-custom">
                            <div class="chk-box-custom ${medication.toLowerCase() === 'yes' ? 'checked' : ''}"></div>
                            <span>YES</span>
                        </div>
                        <div class="checkbox-item-custom">
                            <div class="chk-box-custom ${medication.toLowerCase() !== 'yes' ? 'checked' : ''}"></div>
                            <span>NO</span>
                        </div>
                    </div>
                    <span class="med-details-lbl">DETAILS:</span>
                    <span class="med-details-val">${medication.toLowerCase() === 'yes' ? (medicationDetails || '—').toUpperCase() : ''}</span>
                </div>
            </div>
            
            <div class="section-badge section-parents">PARENTS INFORMATION</div>
            <div class="fields-table">
                <div class="fields-table-row">
                    <div class="fields-table-lbl">FATHER NAME:</div>
                    <div class="fields-table-val">${renderCharBoxes(fatherName, 30)}</div>
                </div>
                <div class="fields-table-row">
                    <div class="fields-table-lbl">FATHER CNIC:</div>
                    <div class="fields-table-val-split">
                        ${renderCNICBoxes(fatherCnic)}
                        <div style="display: flex; gap: 5px; align-items: center; margin-left: 12px; flex-grow: 1;">
                            <span class="inline-lbl">CONTACT:</span>
                            <span class="inline-val-underlined">${contact}</span>
                        </div>
                    </div>
                </div>
                <div class="fields-table-row">
                    <div class="fields-table-lbl">ADDRESS:</div>
                    <div class="fields-table-val-split">
                        <span class="inline-val-underlined">${address.toUpperCase()}</span>
                        <div style="display: flex; gap: 5px; align-items: center; margin-left: 15px; width: 35%;">
                            <span class="inline-lbl">WHATSAPP:</span>
                            <span class="inline-val-underlined">${whatsapp}</span>
                        </div>
                    </div>
                </div>
                <div class="fields-table-row">
                    <div class="fields-table-lbl" style="width: auto; margin-right: 10px;">AGREED MONTHLY FEE:</div>
                    <div class="fields-table-val" style="border: none; padding-bottom: 0;">
                        <span style="font-weight: 800; font-size: 11px; margin-right: 5px; color: #0f172a;">RS</span>
                        <span class="inline-val-underlined" style="width: 120px; text-align: left; display: inline-block; flex-grow: 0;">${d.monthlyFee || d.fee_history?.[0]?.amount || d.monthly || ''}</span>
                    </div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1.7fr 1fr; gap: 30px; margin-top: 10px; align-items: stretch;">
                <div>
                    <div class="section-badge section-undertaking">UNDERTAKING</div>
                    <div class="undertaking-container">
                        <div style="font-weight: 700; font-size: 9.5px; color: #0f172a; margin-bottom: 4px;">I solemnly declare that:</div>
                        <ul class="undertaking-bullet-list">
                            <li>I will abide by all rules and regulations of the school.</li>
                            <li>I will pay all dues/fees promptly as per schedule.</li>
                            <li style="color: #b91c1c; font-weight: 700;">All information provided above is correct and true.</li>
                            <li>Fees once paid are <strong>non-refundable</strong> in any situation.</li>
                            <li>Admission is provisional until all required documents are submitted.</li>
                        </ul>
                    </div>
                    
                    <div class="section-badge section-documents" style="margin-top: 12px;">REQUIRED DOCUMENTS</div>
                    <div class="docs-checklist-custom">
                        <div class="checkbox-item-custom">
                            <div class="chk-box-custom ${docs.photos ? 'checked' : ''}"></div>
                            <span>4 PASSPORT PHOTOS</span>
                        </div>
                        <div class="checkbox-item-custom">
                            <div class="chk-box-custom ${docs.bform ? 'checked' : ''}"></div>
                            <span>COPY OF B-FORM</span>
                        </div>
                        <div class="checkbox-item-custom">
                            <div class="chk-box-custom ${docs.cnic ? 'checked' : ''}"></div>
                            <span>COPY OF PARENT CNIC</span>
                        </div>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; justify-content: flex-end; gap: 30px; padding-bottom: 5px;">
                    <div class="signature-block">
                        <div class="signature-line"></div>
                        <div class="signature-lbl">PARENT'S SIGNATURE</div>
                    </div>
                    <div class="signature-block">
                        <div class="signature-line"></div>
                        <div class="signature-lbl principal-lbl">PRINCIPAL'S SIGNATURE</div>
                    </div>
                </div>
            </div>
            <div style="border-bottom: 1.5px solid #cbd5e1; width: 100%; margin-top: 15px;"></div>
            <div class="bottom-accent"></div>
        </div>`;
    };

    const printBlankAdmissionForm = (d) => {
        const html = buildAdmissionFormHTML(d);
        const printWin = window.open('', '_blank');
        printWin.document.write(`<!DOCTYPE html><html><head><title>Admission Form — ${d.studentName || 'New'}</title><style>${ADMISSION_FORM_CSS}</style></head><body onload="setTimeout(()=>{window.print();},600)"><div class="no-print" style="text-align:center;padding:16px 20px;background:#0f172a;border-bottom:3px solid #1e293b;display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;"><span style="color:white;font-weight:700;font-size:14px;">📄 To save as PDF: change <strong>Destination</strong> to <em>"Save as PDF"</em> in the dialog → click Save</span><button onclick="window.print()" style="padding:10px 24px;background:white;color:#0f172a;border:none;border-radius:8px;cursor:pointer;font-weight:800;font-size:14px;">🖨️ Print / Save as PDF</button></div>${html}</body></html>`);
        printWin.document.close();
    };

    // ── Bulk Admission Form Printing ──
    const printAdmissionFormBulk = (mode, value) => {
        let targetStudents = [];
        if (mode === 'student') {
            const s = students.find(st => st.id === value);
            if (!s) { alert('Student not found.'); return; }
            targetStudents = [s];
        } else if (mode === 'class') {
            targetStudents = students.filter(s => s.grade === value);
            if (targetStudents.length === 0) { alert(`No students found in class "${value}".`); return; }
        } else if (mode === 'college') {
            targetStudents = [...students];
            if (targetStudents.length === 0) { alert('No students found.'); return; }
        }
        targetStudents.sort((a, b) => {
            const sa = parseInt(a.serialNumber, 10), sb = parseInt(b.serialNumber, 10);
            if (!isNaN(sa) && !isNaN(sb)) return sa - sb;
            return (a.name || '').localeCompare(b.name || '');
        });
        
        const pagesHTML = targetStudents.map(s => buildAdmissionFormHTML(s)).join('');
        const printWin = window.open('', '_blank');
        printWin.document.write(`<!DOCTYPE html><html><head><title>Admission Forms — ${mode === 'student' ? value : mode === 'class' ? value : 'All College'}</title><style>${ADMISSION_FORM_CSS}</style></head><body onload="setTimeout(()=>{window.print();},600)"><div class="no-print" style="text-align:center;padding:16px 20px;background:#0f172a;border-bottom:3px solid #1e293b;display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;"><span style="color:white;font-weight:700;font-size:14px;">📄 To save as PDF: change <strong>Destination</strong> to <em>"Save as PDF"</em> in the dialog → click Save</span><button onclick="window.print()" style="padding:10px 24px;background:white;color:#0f172a;border:none;border-radius:8px;cursor:pointer;font-weight:800;font-size:14px;">🖨️ Print / Save as PDF (${targetStudents.length} form${targetStudents.length !== 1 ? 's' : ''})</button></div>${pagesHTML}</body></html>`);
        printWin.document.close();
    };



    // --- GRADE HELPER ---
    const percentageToGrade = (num) => {
        if (num >= 90) return 'A';
        if (num >= 85) return 'A-';
        if (num >= 80) return 'B+';
        if (num >= 75) return 'B';
        if (num >= 70) return 'B-';
        if (num >= 65) return 'C+';
        if (num >= 60) return 'C';
        if (num >= 50) return 'D';
        return 'F';
    };

    // --- PHOTO UPLOAD FUNCTION ---
    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !selectedStudent) return;

        // Check file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showSaveMessage('File too large! Max 2MB.');
            return;
        }

        const publicUrl = await uploadImage(file, 'Student');
        if (publicUrl) {
            const { error } = await supabase
                .from('students')
                .update({ image: publicUrl }) // Update 'image' column in DB
                .eq('id', selectedStudent)
                .eq('school_id', currentSchoolId);

            if (error) {
                alert('Error updating student: ' + error.message);
            } else {
                await fetchData();
                showSaveMessage('Student photo updated!');
            }
        }
        e.target.value = ''; // Reset input
    };

    // --- MARKS FUNCTIONS ---
    const startEditingMarks = () => {
        if (!selectedStudent) return;
        const student = students.find(s => s.id === selectedStudent);
        setTempMarks(student.results.map(r => ({ ...r })));
        setEditingMarks(true);
    };

    const handleMarkChange = (index, field, value) => {
        const updated = [...tempMarks];
        if (field === 'percentage' || field === 'obtained') {
            const num = parseInt(value) || 0;
            const total = updated[index].total || 100;
            updated[index].obtained = Math.min(total, Math.max(0, num));
            const pct = Math.round((updated[index].obtained / total) * 100);
            updated[index].percentage = pct;
            updated[index].grade = percentageToGrade(pct);
        }
        setTempMarks(updated);
    };

    const saveMarks = async () => {
        const student = students.find(s => s.id === selectedStudent);
        if (!student) return;

        const { error } = await supabase
            .from('students')
            .update({ results: [...tempMarks] })
            .eq('id', selectedStudent)
            .eq('school_id', currentSchoolId);

        if (!error) {
            fetchData();
            setEditingMarks(false);
            ActivityLogService.logActivity({
                schoolId: currentSchoolId,
                username: adminCredentials.username || 'admin',
                role: 'admin',
                action: 'Edit Student Marks',
                targetName: `${student.name} (ID: ${student.id})`,
                details: { marks_count: tempMarks.length }
            });
            showSaveMessage('Marks saved successfully!');
        }
    };

    // --- MARKS EXCEL EXPORT ---
    const exportMarksExcel = (overrideName = null, overrideSubjects = null) => {
        const filteredStudents = students.filter(s => s.grade === selectedClass);
        if (filteredStudents.length === 0) {
            alert('No students found in this class.');
            return;
        }

        const nameToUse = overrideName || assessmentName || 'Assessment';
        const subjectsList = overrideSubjects || (filteredStudents[0].results.length > 0 ? filteredStudents[0].results.map(r => ({ name: r.subject, total: r.total || 100 })) : []);

        const rows = filteredStudents.map(student => {
            const row = {
                'Student ID': student.id,
                'Student Name': student.name,
                'Class': student.grade
            };

            subjectsList.forEach(sub => {
                const res = student.results.find(r => r.subject === sub.name);
                row[`${sub.name} (Total: ${sub.total})`] = res ? (res.obtained !== undefined ? res.obtained : res.percentage) : 0;
            });

            return row;
        });

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Marks');

        const fileName = `Marks_${selectedClass.replace(/ /g, '_')}_${nameToUse.replace(/ /g, '_')}.xlsx`;
        XLSX.writeFile(wb, fileName);
        showSaveMessage(`Marks template for ${nameToUse} exported!`);
    };

    // --- MARKS EXCEL IMPORT ---
    const importMarksExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (!data || data.length === 0) {
                    alert("No data found in Excel sheet.");
                    return;
                }

                const headers = Object.keys(data[0]);
                const subjectCols = headers.filter(h => h.includes('(Total:'));

                const subjectsInfo = subjectCols.map(col => {
                    const match = col.match(/(.*) \(Total: (\d+)\)/);
                    return {
                        column: col,
                        name: match ? match[1].trim() : col,
                        total: match ? parseInt(match[2]) : 100
                    };
                });

                let invalidCount = 0;
                const updatedStudents = students.map(s => {
                    const excelRow = data.find(row => row['Student ID'] === s.id);
                    if (excelRow) {
                        const updatedResults = s.results.map(res => {
                            const subInfo = subjectsInfo.find(info => info.name === res.subject);
                            if (subInfo) {
                                const obtainedValue = excelRow[subInfo.column];
                                const obtained = parseInt(obtainedValue);

                                if (!isNaN(obtained)) {
                                    if (obtained > subInfo.total) {
                                        invalidCount++;
                                        return res;
                                    }
                                    const pct = Math.round((obtained / subInfo.total) * 100);
                                    return {
                                        ...res,
                                        obtained: obtained,
                                        percentage: pct,
                                        grade: percentageToGrade(pct)
                                    };
                                }
                            }
                            return res;
                        });
                        return { ...s, results: updatedResults };
                    }
                    return s;
                });

                if (invalidCount > 0) {
                    alert(`Import finished with ${invalidCount} entries skipped because obtained marks exceeded total marks.`);
                }

                setStudents(updatedStudents);
                showSaveMessage(`Marks imported for ${data.length} students.`);
            } catch (err) {
                console.error(err);
                alert('Error processing file. Please ensure it follows the exported template format.');
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = '';
    };


    // --- ATTENDANCE FUNCTIONS ---
    // Stores day-by-day records: attendance = { records: [{date, status}], total, present, absent, percentage }
    const markAttendance = async (studentId, status) => {
        const student = students.find(s => s.id === studentId);
        if (!student) return;

        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        const { error } = await saveAttendanceRecords([{
            student_id: studentId,
            date: today,
            status: status
        }]);

        if (!error) {
            fetchData();
            const statusLabel = status === 'present' ? '✓ Present' : status === 'absent' ? '✗ Absent' : status === 'leave' ? '📋 Leave' : status === 'holiday' ? '🌴 Holiday' : '⏰ Late';
            showSaveMessage(`${statusLabel} marked for ${student.name} on ${today}!`);

            // WhatsApp Automation: Attendance Alert
            if (status === 'absent' && schoolSettings?.auto_attendance_alert !== false) {
                const parentPhone = student.admissions?.[0]?.whatsapp || student.admissions?.[0]?.contact || '';
                if (parentPhone) {
                    const msg = WhatsAppTemplates.attendanceAbsent(student.name, today, schoolName);
                    sendWhatsAppMessage(parentPhone, msg, schoolSettings);
                }
            }
        }
    };

    // Undo/remove a specific date record for a student
    const removeAttendanceRecord = async (studentId, dateStr) => {
        const student = students.find(s => s.id === studentId);
        if (!student) return;
        
        const { error } = await deleteAttendanceRecords([studentId], dateStr);
        if (!error) {
            showSaveMessage(`Record for ${dateStr} removed.`);
        }
    };

    // --- ATTENDANCE EXCEL EXPORT ---
    const exportAttendanceExcel = () => {
        const filteredStudents = students.filter(s => s.grade === selectedClass);
        const today = new Date().toLocaleDateString();
        const rows = filteredStudents.map(s => ({
            'Student ID': s.id,
            'Student Name': s.name,
            'Grade': s.grade,
            'Date': today,
            'Status (Present/Absent)': '',
            'Instructions': 'Enter P or A in the Status column'
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        ws['!cols'] = [
            { wch: 12 }, { wch: 25 }, { wch: 10 },
            { wch: 14 }, { wch: 22 }, { wch: 30 }
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
        XLSX.writeFile(wb, `Attendance_${selectedClass.replace(/ /g, '_')}_${today.replace(/\//g, '-')}.xlsx`);
        showSaveMessage(`Attendance for ${selectedClass} exported!`);
    };

    // --- ATTENDANCE EXCEL IMPORT ---
    const importAttendanceExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const wb = XLSX.read(evt.target.result, { type: 'binary' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws);

                let updateCount = 0;
                const updatedStudents = students.map(s => {
                    const row = data.find(r => r['Student ID'] === s.id);
                    if (row && row['Status (Present/Absent)']) {
                        const status = row['Status (Present/Absent)'].toString().toLowerCase().trim();
                        if (status === 'present' || status === 'p') {
                            updateCount++;
                            const newAttendance = { ...s.attendance };
                            newAttendance.total += 1;
                            newAttendance.present += 1;
                            newAttendance.percentage = parseFloat(
                                ((newAttendance.present / newAttendance.total) * 100).toFixed(1)
                            );
                            return { ...s, attendance: newAttendance };
                        } else if (status === 'absent' || status === 'a') {
                            updateCount++;
                            const newAttendance = { ...s.attendance };
                            newAttendance.total += 1;
                            newAttendance.absent += 1;
                            newAttendance.percentage = parseFloat(
                                ((newAttendance.present / newAttendance.total) * 100).toFixed(1)
                            );
                            return { ...s, attendance: newAttendance };
                        }
                    }
                    return s;
                });
                setStudents(updatedStudents);
                showSaveMessage(`Attendance imported for ${updateCount} students!`);
            } catch (err) {
                showSaveMessage('Error reading file. Please check the format.');
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = '';
    };

    // --- FEE FUNCTIONS (month-by-month history) ---

    // Open a new month for all students in the selected class
    const openNewFeeMonth = async () => {
        const monthLabel = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
        const classStudents = students.filter(s => s.grade === selectedClass);
        if (classStudents.length === 0) { alert('No students in this class!'); return; }

        // Check if month already open for any student in this class
        const alreadyOpen = classStudents.some(s =>
            (s.feeHistory || []).some(h => h.month === monthLabel)
        );
        if (alreadyOpen) {
            alert(`${monthLabel} is already open for this class!`);
            return;
        }

        const classDefaults = (CLASS_FEE_DEFAULTS && CLASS_FEE_DEFAULTS[selectedClass]) || {
            tuitionFee: 1000, admissionFee: 0, annual_fee: 0, examFee: 0, transportFee: 0, labFee: 0
        };

        const records = classStudents.map(s => ({
            student_id: s.id,
            month: monthLabel,
            status: 'unpaid',
            tuitionFee: classDefaults.tuitionFee || 1000,
            admissionFee: classDefaults.admissionFee || 0,
            annualFee: classDefaults.annualFee || 0,
            examFee: classDefaults.examFee || 0,
            transportFee: classDefaults.transportFee || 0,
            labFee: classDefaults.labFee || 0,
            lateFine: 0,
            discount: 0,
            paidAmount: 0
        }));

        const { error } = await schoolContext.saveFeeRecords(records);
        if (!error) {
            showSaveMessage(`Fee month "${monthLabel}" opened for ${selectedClass}!`);
        }
    };

    // Toggle a specific month's fee status for a student (Quick Toggle)
    const toggleMonthFeeStatus = async (studentId, monthLabel) => {
        const student = students.find(s => s.id === studentId);
        if (!student) return;
        const record = (student.feeHistory || []).find(h => h.month === monthLabel);
        if (!record) return;

        const newStatus = record.status === 'paid' ? 'unpaid' : 'paid';
        // For simple toggle, we assume full payment if marking as paid
        const tuition = record.tuitionFee || 1000;
        const total = (tuition + (record.admissionFee || 0) + (record.annualFee || 0) + (record.examFee || 0) + (record.transportFee || 0) + (record.labFee || 0)) + (record.lateFine || 0) - (record.discount || 0);

        const { error } = await schoolContext.saveFeeRecords([{
            ...record,
            student_id: studentId,
            status: newStatus,
            paidAmount: newStatus === 'paid' ? total : 0,
            paymentDate: newStatus === 'paid' ? new Date().toISOString().split('T')[0] : null
        }]);

        if (!error) {
            showSaveMessage('Fee status updated!');
        }
    };

    // Update full detailed fee record for a student
    const updateStudentFeeRecord = async (studentId, monthLabel, newRecordData) => {
        const { error } = await schoolContext.saveFeeRecords([{
            ...newRecordData,
            student_id: studentId,
            month: monthLabel
        }]);

        if (!error) {
            showSaveMessage('Fee record updated successfully!');

            // WhatsApp Automation: Fee Receipt
            if (newRecordData.status === 'paid' && schoolSettings?.auto_fee_alert !== false) {
                const student = students.find(s => s.id === studentId);
                const parentPhone = student?.admissions?.[0]?.whatsapp || student?.admissions?.[0]?.contact || '';
                if (parentPhone) {
                    const msg = WhatsAppTemplates.feePaid(
                        student.name, 
                        monthLabel, 
                        `${currencySymbol} ${newRecordData.paidAmount || 0}`, 
                        `${currencySymbol} ${newRecordData.balance || 0}`, 
                        schoolName
                    );
                    sendWhatsAppMessage(parentPhone, msg, schoolSettings);
                }
            }
        }
    };

    // Mark all students in selected class as paid for a given month
    const markAllPaidForMonth = async (monthLabel) => {
        const classStudents = students.filter(s => s.grade === selectedClass);
        const records = classStudents.map(s => {
            const record = (s.feeHistory || []).find(h => h.month === monthLabel) || { month: monthLabel };
            const tuition = record.tuitionFee || 1000;
            const total = (tuition + (record.admissionFee || 0) + (record.annualFee || 0) + (record.examFee || 0) + (record.transportFee || 0) + (record.labFee || 0)) + (record.lateFine || 0) - (record.discount || 0);
            return {
                ...record,
                student_id: s.id,
                month: monthLabel,
                status: 'paid',
                paidAmount: total,
                paymentDate: new Date().toISOString().split('T')[0]
            };
        });
        const { error } = await schoolContext.saveFeeRecords(records);
        if (!error) {
            showSaveMessage(`All students marked Paid for ${monthLabel}!`);
        }
    };

    // Reset all students in selected class as unpaid for a given month
    const markAllUnpaidForMonth = async (monthLabel) => {
        const classStudents = students.filter(s => s.grade === selectedClass);
        const records = classStudents.map(s => {
            const record = (s.feeHistory || []).find(h => h.month === monthLabel) || { month: monthLabel };
            return {
                ...record,
                student_id: s.id,
                month: monthLabel,
                status: 'unpaid',
                paidAmount: 0,
                paymentDate: null
            };
        });
        const { error } = await schoolContext.saveFeeRecords(records);
        if (!error) {
            showSaveMessage(`All students reset to Unpaid for ${monthLabel}!`);
        }
    };

    // Delete a month from all students in the selected class
    const deleteFeeMonth = async (monthLabel) => {
        if (!window.confirm(`Remove "${monthLabel}" from all students in ${selectedClass}? This cannot be undone.`)) return;
        const studentIds = students.filter(s => s.grade === selectedClass).map(s => s.id);
        const { error } = await schoolContext.deleteFeeRecords(studentIds, monthLabel);
        if (!error) {
            showSaveMessage(`Month "${monthLabel}" removed!`);
        }
    };



    // --- FEE EXCEL EXPORT ---
    const exportFeeExcel = () => {
        const filteredStudents = students.filter(s => s.grade === selectedClass);
        const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
        const rows = filteredStudents.map(s => ({
            'Student ID': s.id,
            'Student Name': s.name,
            'Grade': s.grade,
            'Billing Month': currentMonth,
            'Fee Status (Paid/Unpaid)': s.feeStatus === 'paid' ? 'Paid' : 'Unpaid',
            'Instructions': 'Change status to Paid or Unpaid'
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        ws['!cols'] = [
            { wch: 12 }, { wch: 25 }, { wch: 10 }, { wch: 20 }, { wch: 24 }, { wch: 30 }
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Fee Status');
        XLSX.writeFile(wb, `Fees_${selectedClass.replace(/ /g, '_')}_${currentMonth.replace(/ /g, '_')}.xlsx`);
        showSaveMessage(`Fees for ${selectedClass} exported!`);
    };

    // --- FEE EXCEL IMPORT ---
    const importFeeExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
        
        reader.onload = async (evt) => {
            try {
                const arrayBuffer = evt.target.result;
                const wb = XLSX.read(arrayBuffer, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws);

                let updateCount = 0;
                const updatedStudents = students.map(s => {
                    const row = data.find(r => r['Student ID'] === s.id);
                    if (row && row['Fee Status (Paid/Unpaid)']) {
                        const statusInput = row['Fee Status (Paid/Unpaid)'].toString().toLowerCase().trim();
                        const isPaid = statusInput === 'paid' || statusInput === 'p';
                        const isUnpaid = statusInput === 'unpaid' || statusInput === 'u';
                        
                        if (isPaid || isUnpaid) {
                            const newStatus = isPaid ? 'paid' : 'unpaid';
                            const history = [...(s.feeHistory || [])];
                            const idx = history.findIndex(h => h.month === currentMonth);
                            
                            if (idx > -1) {
                                history[idx] = { 
                                    ...history[idx], 
                                    status: newStatus, 
                                    paidOn: isPaid ? (history[idx].paidOn || new Date().toLocaleDateString()) : null 
                                };
                            } else {
                                history.push({ 
                                    month: currentMonth, 
                                    status: newStatus, 
                                    paidOn: isPaid ? new Date().toLocaleDateString() : null 
                                });
                            }
                            updateCount++;
                            return { ...s, feeHistory: history };
                        }
                    }
                    return s;
                });
                await setStudents(updatedStudents);
                showSaveMessage(`Fee status for ${currentMonth} imported for ${updateCount} students!`);
            } catch (err) {
                console.error(err);
                alert('Error reading file. Please check the format and headers.');
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = '';
    };

    const getGradeColor = (percentage) => {
        if (percentage >= 90) return 'var(--color-success)';
        if (percentage >= 75) return 'var(--color-primary)';
        if (percentage >= 60) return 'var(--color-accent)';
        return 'var(--color-danger)';
    };

    // --- DOWNLOAD STUDENT REPORT ---
    const downloadStudentReport = (studentId) => {
        const student = students.find(s => s.id === studentId);
        if (!student) return;

        const allResults = student.results || [];
        const avg = allResults.length > 0
            ? (allResults.reduce((sum, r) => sum + r.percentage, 0) / allResults.length).toFixed(1)
            : '0.0';
        const overallGrade = percentageToGrade(parseFloat(avg));
        const gradeColor = (pct) => pct >= 90 ? '#0d7c52' : pct >= 75 ? '#1a5fb4' : pct >= 60 ? '#c4841d' : '#c0392b';
        const gradeBg = (pct) => pct >= 90 ? '#e6f9f0' : pct >= 75 ? '#e8f0fc' : pct >= 60 ? '#fef5e7' : '#fce8e6';
        const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        
        const schoolAddress = schoolData.contact?.address || '';
        const schoolPhone = schoolData.contact?.phone || '';
        const schoolEmail = schoolData.contact?.email || '';

        // Group results by term
        const termGroups = {};
        allResults.forEach(r => {
            const term = r.term || 'Current';
            if (!termGroups[term]) termGroups[term] = [];
            termGroups[term].push(r);
        });

        const resultsRows = Object.entries(termGroups).map(([termName, termResults]) => {
            const termHeader = `
                <tr style="background:linear-gradient(135deg,#1e3a5f,#2563eb);">
                    <td colspan="4" style="padding:10px 16px;font-size:13px;font-weight:800;color:#fff;letter-spacing:0.5px;">📋 ${termName}</td>
                </tr>
            `;
            const rows = termResults.map((r, i) => `
                <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f8fafc'}">
                    <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;font-weight:500;color:#1e293b;">${r.subject}</td>
                    <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:center;">
                        <span style="display:inline-block;padding:3px 12px;border-radius:20px;font-weight:700;font-size:12px;background:${gradeBg(r.percentage)};color:${gradeColor(r.percentage)};">${r.percentage}%</span>
                    </td>
                    <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:center;">
                        <span style="display:inline-block;width:34px;height:34px;line-height:34px;border-radius:50%;font-weight:800;font-size:13px;background:${gradeBg(r.percentage)};color:${gradeColor(r.percentage)};text-align:center;">${r.grade}</span>
                    </td>
                    <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;">
                        <div style="display:flex;align-items:center;gap:10px;">
                            <div style="flex:1;background:#e2e8f0;border-radius:10px;height:7px;overflow:hidden;">
                                <div style="background:${gradeColor(r.percentage)};height:100%;width:${r.percentage}%;border-radius:10px;"></div>
                            </div>
                            <span style="font-size:11px;color:#94a3b8;font-weight:600;min-width:30px;">${r.percentage}</span>
                        </div>
                    </td>
                </tr>
            `).join('');
            return termHeader + rows;
        }).join('');

        let previousSection = '';
        if (student.previousResults && student.previousResults.length > 0) {
            const prevRows = student.previousResults.map(term => {
                const termAvg = (term.results.reduce((s, r) => s + r.percentage, 0) / term.results.length).toFixed(1);
                return `
                    <tr style="border-bottom:1px solid #edf2f7;">
                        <td style="padding:10px 16px;font-size:13px;font-weight:600;color:#1a3a6b;">${term.term}</td>
                        <td style="padding:10px 16px;text-align:center;">
                            <span style="display:inline-block;padding:4px 16px;border-radius:20px;font-weight:700;font-size:13px;background:${gradeBg(parseFloat(termAvg))};color:${gradeColor(parseFloat(termAvg))};">${termAvg}%</span>
                        </td>
                        <td style="padding:10px 16px;text-align:center;">
                            <span style="font-weight:700;font-size:13px;color:${gradeColor(parseFloat(termAvg))};">${parseFloat(termAvg) >= 85 ? 'Excellent' : parseFloat(termAvg) >= 70 ? 'Good' : parseFloat(termAvg) >= 50 ? 'Satisfactory' : 'Needs Improvement'}</span>
                        </td>
                    </tr>
                `;
            }).join('');
            previousSection = `
                <div style="margin-top:24px;page-break-inside:avoid;">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                        <div style="width:4px;height:20px;background:#1a3a6b;border-radius:2px;"></div>
                        <h3 style="font-family:'Playfair Display',Georgia,serif;font-size:15px;font-weight:700;color:#1a3a6b;margin:0;">Previous Academic Records</h3>
                    </div>
                    <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
                        <thead>
                            <tr style="background:linear-gradient(135deg,#1a3a6b,#1e4d8a);">
                                <th style="padding:10px 16px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;color:#fff;font-weight:700;">Term</th>
                                <th style="padding:10px 16px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;color:#fff;font-weight:700;">Average</th>
                                <th style="padding:10px 16px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;color:#fff;font-weight:700;">Remark</th>
                            </tr>
                        </thead>
                        <tbody>${prevRows}</tbody>
                    </table>
                </div>
            `;
        }

        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <title>Report Card — ${student.name}</title>
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                @media print {
                    body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    .page { box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; }
                    @page { size: A4 portrait; margin: 0; }
                }
                body { font-family: 'Inter', -apple-system, sans-serif; background: #e2e8f0; color: #1e293b; }
                .page { max-width: 820px; margin: 10px auto; background: #fff; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); overflow: hidden; }
                .card-header { background: linear-gradient(135deg,#0f2b52 0%,#1e3a8a 45%,#1e40af 100%); padding: 24px 36px 20px; position: relative; overflow: hidden; }
                .card-header::before { content:''; position:absolute; top:-40px; right:-40px; width:180px; height:180px; background:rgba(255,255,255,0.05); border-radius:50%; }
                .card-header::after { content:''; position:absolute; bottom:-60px; left:-30px; width:160px; height:160px; background:rgba(255,255,255,0.04); border-radius:50%; }
                .header-top { display:flex; align-items:center; gap:16px; margin-bottom:14px; position:relative; z-index:1; }
                .school-logo { width:75px; height:75px; background:rgba(255,255,255,0.15); border-radius:12px; display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0; border:2px solid rgba(255,255,255,0.3); }
                .school-name { font-family:'Playfair Display',Georgia,serif; font-size:26px; font-weight:800; color:#fff; letter-spacing:0.5px; margin-bottom:3px; }
                .school-sub { font-size:12px; color:rgba(255,255,255,0.75); }
                .report-badge { display:flex; align-items:center; justify-content:center; gap:12px; position:relative; z-index:1; }
                .badge-line { flex:1; height:1px; background:rgba(255,255,255,0.3); }
                .badge-text { padding:5px 22px; border:2px solid rgba(255,255,255,0.45); border-radius:4px; font-family:'Playfair Display',Georgia,serif; font-size:12px; font-weight:700; color:#fff; letter-spacing:3px; text-transform:uppercase; }
                .student-bar { background:#f8fafc; border-bottom:2px solid #e2e8f0; padding:14px 36px; display:flex; align-items:center; gap:16px; }
                .avatar { width:66px; height:66px; border-radius:10px; background:linear-gradient(135deg,#1e3a8a,#3b82f6); display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0; border:3px solid #fff; box-shadow:0 2px 8px rgba(30,58,138,0.2); }
                .avatar img { width:100%; height:100%; object-fit:cover; }
                .avatar-initials { font-size:22px; font-weight:800; color:#fff; font-family:'Playfair Display',serif; }
                .meta-grid { display:flex; flex:1; }
                .meta-cell { flex:1; min-width:90px; padding:6px 14px; border-right:1px solid #e2e8f0; }
                .meta-cell:last-child { border-right:none; }
                .meta-lbl { font-size:9px; text-transform:uppercase; letter-spacing:0.8px; color:#94a3b8; font-weight:700; margin-bottom:2px; }
                .meta-val { font-size:14px; font-weight:700; color:#1e293b; }
                .summary-strip { display:flex; background:linear-gradient(90deg,#f0f7ff,#e8f0fc,#f0f7ff); border-bottom:1px solid #dbeafe; padding:10px 36px; gap:12px; justify-content:center; flex-wrap:wrap; }
                .sum-chip { display:flex; align-items:center; gap:8px; padding:5px 14px; border-radius:30px; font-size:12px; font-weight:700; background:#fff; border:1px solid #e2e8f0; box-shadow:0 1px 3px rgba(0,0,0,0.06); }
                .sum-val { font-size:15px; font-weight:800; }
                .content { padding:18px 36px; }
                .sec-head { display:flex; align-items:center; gap:8px; margin-bottom:10px; margin-top:4px; }
                .sec-bar { width:4px; height:20px; border-radius:2px; background:linear-gradient(180deg,#1e3a8a,#3b82f6); }
                .sec-title { font-family:'Playfair Display',Georgia,serif; font-size:14px; font-weight:700; color:#1e3a8a; }
                .results-tbl { width:100%; border-collapse:collapse; border-radius:10px; overflow:hidden; box-shadow:0 1px 6px rgba(0,0,0,0.07); margin-bottom:18px; }
                .results-tbl thead tr { background:linear-gradient(135deg,#1e3a8a,#1e40af); }
                .results-tbl thead th { padding:9px 12px; font-size:10px; text-transform:uppercase; letter-spacing:0.7px; color:#fff; font-weight:700; }
                .results-tbl thead th:first-child { text-align:left; }
                .results-tbl thead th:not(:first-child) { text-align:center; }
                .term-row td { padding:8px 12px; font-size:11.5px; font-weight:700; color:#fff; background:linear-gradient(90deg,rgba(30,58,138,0.6),rgba(59,130,246,0.5)); letter-spacing:0.3px; }
                .tfoot-row { background:linear-gradient(90deg,#eff6ff,#dbeafe); border-top:2px solid #1e3a8a; }
                .att-grid { display:flex; border:1px solid #e2e8f0; border-radius:10px; overflow:hidden; margin-bottom:18px; }
                .att-cell { flex:1; text-align:center; padding:12px 10px; border-right:1px solid #e2e8f0; }
                .att-cell:last-child { border-right:none; }
                .att-num { font-size:22px; font-weight:800; margin-bottom:2px; }
                .att-lbl { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.6px; color:#64748b; }
                .sig-row { display:flex; justify-content:space-between; margin-top:14px; padding-top:12px; border-top:1px solid #e2e8f0; gap:12px; }
                .sig-item { text-align:center; flex:1; }
                .sig-line { height:22px; border-bottom:1.5px solid #1e293b; margin-bottom:5px; }
                .sig-name { font-size:9px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; }
                .card-footer { background:#f8fafc; border-top:1px solid #e2e8f0; padding:10px 36px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; }
                .footer-txt { font-size:10px; color:#94a3b8; }
                .footer-school { font-size:10px; color:#1e3a8a; font-weight:700; }
                .bottom-accent { height:5px; background:linear-gradient(90deg,#0f2b52,#1e3a8a,#3b82f6,#1e3a8a,#0f2b52); }
            </style>
        </head>
        <body>
            <div class="no-print" style="text-align:center;padding:14px 24px;background:linear-gradient(135deg,#1e3a8a,#2563eb);display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;">
                <span style="color:white;font-weight:700;font-size:13px;">📄 To save as PDF: change <strong>Destination</strong> to <em>"Save as PDF"</em> in the print dialog</span>
                <button onclick="window.print()" style="padding:10px 24px;background:white;color:#1e3a8a;border:none;border-radius:8px;cursor:pointer;font-weight:800;font-size:14px;">🖨️ Print / Save as PDF</button>
            </div>
            <div class="page">
                <div class="card-header">
                    <div class="header-top">
                        <div class="school-logo">
                            <img src="${schoolSettings?.logo_url || '/logo.png'}" style="width:100%;height:100%;object-fit:contain;" onerror="this.parentElement.innerHTML='<span style=font-size:30px>🏫</span>'" />
                        </div>
                        <div>
                            <div class="school-name">${schoolName}</div>
                            ${schoolAddress ? `<div class="school-sub">📍 ${schoolAddress}</div>` : ''}
                            ${schoolPhone || schoolEmail ? `<div class="school-sub" style="margin-top:2px">${schoolPhone ? '📞 '+schoolPhone : ''}${schoolPhone && schoolEmail ? ' · ' : ''}${schoolEmail ? '✉ '+schoolEmail : ''}</div>` : ''}
                        </div>
                    </div>
                    <div class="report-badge">
                        <div class="badge-line"></div>
                        <div class="badge-text">Report Card</div>
                        <div class="badge-line"></div>
                    </div>
                </div>
                <div class="student-bar">
                    <div class="avatar">
                        ${(student.photo || student.image) ? `<img src="${student.photo || student.image}" alt="${student.name}" />` : `<span class="avatar-initials">${student.name.split(' ').map(n => n[0]).join('').substring(0,2)}</span>`}
                    </div>
                    <div class="meta-grid">
                        <div class="meta-cell"><div class="meta-lbl">Student Name</div><div class="meta-val">${student.name}</div></div>
                        <div class="meta-cell"><div class="meta-lbl">Student ID</div><div class="meta-val">${student.id}</div></div>
                        <div class="meta-cell"><div class="meta-lbl">Class</div><div class="meta-val">${student.grade}</div></div>
                        <div class="meta-cell"><div class="meta-lbl">Report Date</div><div class="meta-val">${today}</div></div>
                    </div>
                </div>
                <div class="summary-strip">
                    <div class="sum-chip"><span style="font-size:16px">📊</span> Overall: <span class="sum-val" style="color:${gradeColor(parseFloat(avg))}">${avg}%</span></div>
                    <div class="sum-chip"><span style="font-size:16px">🎓</span> Grade: <span class="sum-val" style="color:${gradeColor(parseFloat(avg))}">${overallGrade}</span></div>
                    <div class="sum-chip"><span style="font-size:16px">⭐</span> Remark: <span class="sum-val" style="font-size:12px;color:${gradeColor(parseFloat(avg))}">${parseFloat(avg) >= 85 ? 'Excellent' : parseFloat(avg) >= 70 ? 'Good' : parseFloat(avg) >= 50 ? 'Satisfactory' : 'Needs Improvement'}</span></div>
                </div>
                <div class="content">
                    <div class="sec-head"><div class="sec-bar"></div><div class="sec-title">Academic Performance</div></div>
                    <table class="results-tbl">
                        <thead><tr><th>Subject</th><th>Score</th><th>Grade</th><th>Performance</th></tr></thead>
                        <tbody>${resultsRows}</tbody>
                        <tfoot>
                            <tr class="tfoot-row">
                                <td style="padding:11px 12px;font-size:13px;font-weight:800;color:#1e3a8a;">Overall Average</td>
                                <td style="padding:11px 12px;text-align:center;"><span style="font-size:15px;font-weight:800;color:#1e3a8a;">${avg}%</span></td>
                                <td style="padding:11px 12px;text-align:center;"><span style="display:inline-block;width:34px;height:34px;line-height:34px;border-radius:50%;font-weight:800;font-size:14px;background:#1e3a8a;color:white;text-align:center;">${overallGrade}</span></td>
                                <td style="padding:11px 12px;text-align:center;font-size:11px;font-weight:700;color:${gradeColor(parseFloat(avg))};">${parseFloat(avg) >= 85 ? '🌟 Excellent' : parseFloat(avg) >= 70 ? '✅ Good' : parseFloat(avg) >= 50 ? '📈 Satisfactory' : '⚠️ Needs Improvement'}</td>
                            </tr>
                        </tfoot>
                    </table>
                    <div class="sec-head"><div class="sec-bar"></div><div class="sec-title">Attendance Record</div></div>
                    <div class="att-grid">
                        <div class="att-cell" style="background:#f0fdf4"><div class="att-num" style="color:#16a34a">${student.attendance.present}</div><div class="att-lbl">Present</div></div>
                        <div class="att-cell" style="background:#fef2f2"><div class="att-num" style="color:#dc2626">${student.attendance.absent}</div><div class="att-lbl">Absent</div></div>
                        <div class="att-cell" style="background:#eff6ff"><div class="att-num" style="color:#2563eb">${student.attendance.total}</div><div class="att-lbl">Total Days</div></div>
                        <div class="att-cell" style="background:linear-gradient(135deg,#1e3a8a,#1e40af)"><div class="att-num" style="color:#fff">${student.attendance.percentage}%</div><div class="att-lbl" style="color:rgba(255,255,255,0.8)">Attendance</div></div>
                    </div>
                    ${previousSection}
                    <div class="sig-row">
                        <div class="sig-item"><div class="sig-line"></div><div class="sig-name">Class Teacher</div></div>
                        <div class="sig-item"><div class="sig-line"></div><div class="sig-name">Principal</div></div>
                        <div class="sig-item"><div class="sig-line"></div><div class="sig-name">Parent / Guardian</div></div>
                    </div>
                </div>
                <div class="card-footer">
                    <div class="footer-txt">Generated: ${today}</div>
                    <div class="footer-school">${schoolName}</div>
                    <div class="footer-txt" style="font-style:italic">Computer-generated document</div>
                </div>
                <div class="bottom-accent"></div>
            </div>
        </body>
        </html>
        `;

        const reportWindow = window.open('', '_blank');
        reportWindow.document.write(html);
        reportWindow.document.close();
        showSaveMessage(`Report generated for ${student.name}!`);
    };

    // --- ANNOUNCEMENTS FUNCTIONS ---
    const addAnnouncement = async () => {
        if (!newAnnouncement.title || !newAnnouncement.content) {
            showSaveMessage('Title and content are required!');
            return;
        }

        const { error } = await supabase.from('announcements').insert([{ ...newAnnouncement, school_id: currentSchoolId }]);
        if (error) {
            alert('Error posting announcement: ' + error.message);
        } else {
            setNewAnnouncement({ title: '', content: '', date: new Date().toISOString().split('T')[0] });
            await fetchData();
            showSaveMessage('Announcement posted!');
        }
    };

    const deleteAnnouncement = async (id) => {
        if (window.confirm('Are you sure you want to delete this announcement?')) {
            const { error } = await supabase.from('announcements').delete().eq('id', id).eq('school_id', currentSchoolId);
            if (error) {
                alert('Error deleting announcement: ' + error.message);
            } else {
                await fetchData();
                showSaveMessage('Announcement deleted!');
            }
        }
    };

    // --- FACULTY MANAGEMENT ---
    const addFaculty = () => {
        setEditingFacultyId('new');
        setTempFacultyMember({
            name: '',
            role: '',
            department: '',
            bio: '',
            image: ''
        });
    };

    const saveFaculty = async () => {
        if (editingFacultyId === 'new') {
            const { error } = await supabase.from('faculty').insert([{ ...tempFacultyMember, school_id: currentSchoolId }]);
            if (error) {
                alert('Error adding faculty: ' + error.message);
                return;
            }
            showSaveMessage('Faculty member added!');
        } else {
            // Strip ID from payload for updates
            const { id, ...payload } = tempFacultyMember;
            const { error } = await supabase.from('faculty').update(payload).eq('id', editingFacultyId).eq('school_id', currentSchoolId);
            if (error) {
                alert('Error updating faculty: ' + error.message);
                return;
            }
            showSaveMessage('Faculty updated!');
        }
        setEditingFacultyId(null);
        setTempFacultyMember(null);
        await fetchPublicData();
    };

    const deleteFaculty = async (id) => {
        if (window.confirm('Are you sure you want to remove this faculty member?')) {
            const { error } = await supabase.from('faculty').update({ is_active: false }).eq('id', id).eq('school_id', currentSchoolId);
            if (error) {
                alert('Error deleting faculty: ' + error.message);
            } else {
                await fetchPublicData();
                showSaveMessage('Faculty member removed');
            }
        }
    };

    // --- FACILITIES MANAGEMENT ---
    const addFacility = () => {
        setEditingFacilityId('new');
        setTempFacility({
            name: '',
            description: '',
            category: '',
            image: ''
        });
    };

    const saveFacility = async () => {
        if (editingFacilityId === 'new') {
            const { error } = await supabase.from('facilities').insert([{ ...tempFacility, school_id: currentSchoolId }]);
            if (error) {
                alert('Error adding facility: ' + error.message);
                return;
            }
            showSaveMessage('Facility added!');
        } else {
            // Strip ID from payload for updates
            const { id, ...payload } = tempFacility;
            const { error } = await supabase.from('facilities').update(payload).eq('id', editingFacilityId).eq('school_id', currentSchoolId);
            if (error) {
                alert('Error updating facility: ' + error.message);
                return;
            }
            showSaveMessage('Facility updated!');
        }
        setEditingFacilityId(null);
        setTempFacility(null);
        await fetchPublicData();
    };

    const deleteFacility = async (id) => {
        if (window.confirm('Are you sure you want to remove this facility?')) {
            const { error } = await supabase.from('facilities').delete().eq('id', id).eq('school_id', currentSchoolId);
            if (error) {
                alert('Error deleting facility: ' + error.message);
            } else {
                await fetchPublicData();
                showSaveMessage('Facility removed');
            }
        }
    };

    // --- BLOG MANAGEMENT ---
    const addBlog = () => {
        setEditingBlogId('new');
        setTempBlog({
            title: '',
            excerpt: '',
            content: '',
            author: 'Admin',
            date: new Date().toISOString().split('T')[0],
            category: 'Events',
            read_time: '3 min read',
            image: ''
        });
    };

    const saveBlog = async () => {
        if (!tempBlog.title || !tempBlog.excerpt || !tempBlog.content) {
            showSaveMessage('Title, excerpt, and content are required!');
            return;
        }

        if (editingBlogId === 'new') {
            const { error } = await supabase.from('blogs').insert([{ ...tempBlog, school_id: currentSchoolId }]);
            if (error) {
                alert('Error adding blog: ' + error.message);
                return;
            }
            showSaveMessage('Blog post added!');
        } else {
            const { id, created_at, updated_at, ...payload } = tempBlog;
            const { error } = await supabase.from('blogs').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editingBlogId).eq('school_id', currentSchoolId);
            if (error) {
                alert('Error updating blog: ' + error.message);
                return;
            }
            showSaveMessage('Blog post updated!');
        }
        setEditingBlogId(null);
        setTempBlog(null);
        await fetchPublicData();
    };

    const deleteBlog = async (id) => {
        if (window.confirm('Are you sure you want to delete this blog post?')) {
            const { error } = await supabase.from('blogs').delete().eq('id', id).eq('school_id', currentSchoolId);
            if (error) {
                alert('Error deleting blog: ' + error.message);
            } else {
                await fetchPublicData();
                showSaveMessage('Blog post deleted!');
            }
        }
    };

    const handleBlogImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const publicUrl = await uploadImage(file, 'blogs');
        if (publicUrl) {
            setTempBlog(prev => ({ ...prev, image: publicUrl }));
            showSaveMessage('Blog image uploaded!');
        }
        e.target.value = '';
    };

    // --- CLASS MANAGEMENT FUNCTIONS ---
    const downloadClassTemplate = () => {
        const templateData = [{
            'Student Name': 'Ali Ahmed', 'B-Form Number': '12345-1234567-1', 'Date of Birth': '2010-01-15',
            'Gender': 'Male', 'Religion': 'Islam', 'Nationality': 'Pakistani', 'Father Name': 'Ahmed Khan',
            'Father CNIC': '12345-1234567-1', 'Contact Number': '03001234567', 'WhatsApp Number': '03001234567',
            'Address': '123 Street, City', 'Allergies': 'No', 'Allergies Details': '',
            'Chronic Condition': 'No', 'Chronic Condition Details': '', 'Medication': 'No',
            'Medication Details': '', 'Fee Status': 'Pending'
        }];
        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Students');
        ws['!cols'] = Array(18).fill({ wch: 15 });
        XLSX.writeFile(wb, `Class_${selectedClassForList}_Template.xlsx`);
        showSaveMessage('Template downloaded!');
    };

    const importStudentsExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                // Use ArrayBuffer for better compatibility with different Excel formats
                const arrayBuffer = evt.target.result;
                const wb = XLSX.read(arrayBuffer, { type: 'array' });

                if (!wb.SheetNames || wb.SheetNames.length === 0) {
                    alert("Invalid Excel file: No sheets found.");
                    return;
                }

                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (!data || data.length === 0) {
                    alert("No data found in the first sheet of the Excel file. Please check if the sheet is empty or headers are missing.");
                    return;
                }

                // Debugging: Log headers found
                console.log("Excel Headers Found:", Object.keys(data[0]));

                let successCount = 0;
                let updateCount = 0;
                const errors = [];
                const newStudents = [];
                const updatedStudents = [];
                const processedSerials = new Set();
                const processedIds = new Set();

                // Get existing serials to check for duplicates
                const existingSerialsMap = new Map();
                students.forEach(s => {
                    if (s.serialNumber) {
                        existingSerialsMap.set(String(s.serialNumber).trim().toLowerCase(), s.id);
                    }
                });

                data.forEach((row, index) => {
                    const rowNum = index + 2; // Excel row (1-header)

                    // Flexible Header Matching
                    const name = (row['Student Name'] || row['Name'] || row['name'] || row['Student Name*'] || '').toString().trim();
                    const serial = (row['Serial No'] || row['Serial Number'] || row['Serial'] || row['S.No'] || '').toString().trim();
                    const providedId = (row['Student ID'] || row['Member ID'] || row['ID'] || '').toString().trim();
                    const grade = row['Class'] || row['Grade'] || selectedClassForList || '';
                    const password = row['Password'] || '';

                    // 1. Validate Name (Critical)
                    if (!name) {
                        // Only log error if row has *some* content (avoid processing empty trailing rows)
                        if (Object.keys(row).length > 0) {
                            errors.push(`Row ${rowNum}: Missing 'Student Name' column.`);
                        }
                        return;
                    }

                    // Check if this row refers to an existing student
                    let existingStudent = null;
                    if (providedId) {
                        const targetId = providedId.toUpperCase();
                        existingStudent = students.find(s => s.id && s.id.toString().trim().toUpperCase() === targetId);
                    } else if (serial) {
                        const existingId = existingSerialsMap.get(serial.toLowerCase());
                        if (existingId) existingStudent = students.find(s => s.id === existingId);
                    }

                    if (existingStudent) {
                        // UPDATE PATH
                        if (processedIds.has(existingStudent.id)) {
                            errors.push(`Row ${rowNum}: Duplicate entry for student ID '${existingStudent.id}' in this file.`);
                            return;
                        }

                        // Check serial conflict if they are changing serial
                        if (serial) {
                            const newSerial = serial.toLowerCase();
                            const conflictId = existingSerialsMap.get(newSerial);
                            if (conflictId && conflictId !== existingStudent.id) {
                                errors.push(`Row ${rowNum}: Serial Number '${serial}' belongs to another student.`);
                                return;
                            }
                            if (processedSerials.has(newSerial)) {
                                errors.push(`Row ${rowNum}: Duplicate Serial Number '${serial}' in strictly this import file.`);
                                return;
                            }
                            processedSerials.add(newSerial);
                        }

                        processedIds.add(existingStudent.id);

                        // Clone admissions array and the first object (deep clone first object only as it's the primary)
                        let admissions = existingStudent.admissions ? JSON.parse(JSON.stringify(existingStudent.admissions)) : [{}];
                        if (admissions.length === 0) admissions.push({});

                        // update provided fields
                        if (row['Gender'] !== undefined) admissions[0].gender = row['Gender'];
                        if (row['Father Name'] !== undefined) admissions[0].fatherName = row['Father Name'];
                        if (row['Contact Number'] !== undefined || row['Contact'] !== undefined) admissions[0].contact = row['Contact Number'] || row['Contact'] || '';
                        if (row['B-Form Number'] !== undefined) admissions[0].bForm = row['B-Form Number'];
                        if (row['Date of Birth'] !== undefined) admissions[0].dob = row['Date of Birth'];
                        if (row['Religion'] !== undefined) admissions[0].religion = row['Religion'];
                        if (row['Nationality'] !== undefined) admissions[0].nationality = row['Nationality'];
                        if (row['Father CNIC'] !== undefined) admissions[0].fatherCnic = row['Father CNIC'];
                        if (row['WhatsApp Number'] !== undefined) admissions[0].whatsapp = row['WhatsApp Number'];
                        if (row['Address'] !== undefined) admissions[0].address = row['Address'];

                        const updatedStudent = {
                            ...existingStudent,
                            name: name,
                            grade: grade || existingStudent.grade,
                            password: password || existingStudent.password,
                            serialNumber: serial || existingStudent.serialNumber,
                            admissions: admissions
                        };

                        updatedStudents.push(updatedStudent);
                        updateCount++;
                    } else {
                        // CREATE PATH
                        // 2. Validate Serial Number for new
                        if (serial) {
                            if (existingSerialsMap.has(serial.toLowerCase())) {
                                errors.push(`Row ${rowNum}: Serial Number '${serial}' already exists in system.`);
                                return;
                            }
                            if (processedSerials.has(serial.toLowerCase())) {
                                errors.push(`Row ${rowNum}: Duplicate Serial Number '${serial}' in strictly this import file.`);
                                return;
                            }
                            processedSerials.add(serial.toLowerCase());
                        }

                        // Generate a temporary ID. The database trigger will replace this with a real sequential ID.
                        let studentId = providedId;
                        if (!studentId) {
                            studentId = `TEMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                        } else {
                            const targetId = studentId.toUpperCase();
                            if (students.some(s => s.id && s.id.toString().trim().toUpperCase() === targetId) || newStudents.some(s => s.id.toUpperCase() === targetId)) {
                                errors.push(`Row ${rowNum}: Student ID '${studentId}' already exists.`);
                                return;
                            }
                        }

                        processedIds.add(studentId);

                        const newStudent = {
                            id: studentId,
                            serialNumber: serial ? String(serial).trim() : null,
                            name: name,
                            password: password || ((schoolSettings?.school_id?.split('-')[0]?.toLowerCase() || 'pass') + Math.floor(1000 + Math.random() * 9000)),
                            grade: grade,
                            image: '',
                            feeHistory: [],
                            results: [],
                            attendance: { present: 0, absent: 0, total: 0, percentage: 0 },
                            previous_results: [],
                            previousResults: [],
                            admissions: [{
                                date: new Date().toISOString(),
                                gender: row['Gender'] || '',
                                fatherName: row['Father Name'] || '',
                                contact: row['Contact Number'] || row['Contact'] || '',
                                bForm: row['B-Form Number'] || '',
                                dob: row['Date of Birth'] || '',
                                religion: row['Religion'] || '',
                                nationality: row['Nationality'] || '',
                                fatherCnic: row['Father CNIC'] || '',
                                whatsapp: row['WhatsApp Number'] || '',
                                address: row['Address'] || ''
                            }]
                        };

                        newStudents.push(newStudent);
                        successCount++;
                    }
                });

                if (newStudents.length > 0 || updatedStudents.length > 0) {
                    const totalStudentsToUpsert = [...newStudents, ...updatedStudents];
                    const { error } = await setStudents(totalStudentsToUpsert);
                    if (error) {
                        alert("Database Error: " + error.message);
                    } else {
                        let msg = `Successfully imported ${successCount} new and updated ${updateCount} students.`;
                        if (errors.length > 0) {
                            msg += `\n\n${errors.length} rows failed:\n` + errors.slice(0, 10).join('\n') + (errors.length > 10 ? '\n...' : '');
                        }
                        alert(msg);
                        showSaveMessage(`${successCount + updateCount} students processed!`);
                        if (classImportFileRef.current) classImportFileRef.current.value = '';
                    }
                } else {
                    alert("No valid students were extracted from the file.\n\nDetails:\n" + (errors.length > 0 ? errors.join('\n') : "Ensure your Excel has a 'Student Name' column."));
                }

            } catch (err) {
                console.error("Import Error:", err);
                alert("Failed to process Excel file. Please ensure it is a valid .xlsx file.");
            }
        };
        // Use readAsArrayBuffer for better binary support
        reader.readAsArrayBuffer(file);
    };


    const exportClassRoster = () => {
        const classStudents = students.filter(s =>
            s.grade === selectedClassForList &&
            (classDetailTab === 'all' || s.admissions?.[0]?.gender === (classDetailTab === 'boys' ? 'Male' : 'Female'))
        );
        const suffix = classDetailTab === 'all' ? 'All' : (classDetailTab === 'boys' ? 'Boys' : 'Girls');

        if (classStudents.length === 0) {
            alert(`No ${suffix.toLowerCase()} in this class!`);
            return;
        }

        const exportData = classStudents.map(s => {
            const adm = s.admissions?.[0] || {};
            return {
                'Serial No': s.serialNumber || '', // Added Serial No
                'Student ID': s.id, 'Student Name': s.name, 'B-Form Number': adm.bForm || '',
                'Date of Birth': adm.dob || '', 'Gender': adm.gender || '', 'Religion': adm.religion || '',
                'Nationality': adm.nationality || '', 'Father Name': adm.fatherName || '',
                'Father CNIC': adm.fatherCnic || '', 'Contact Number': adm.contact || '',
                'WhatsApp Number': adm.whatsapp || '', 'Address': adm.address || '',
                'Fee Dues': (s.feeHistory || []).filter(h => h.status === 'unpaid').length + ' unpaid month(s)', 'Password': s.password
            };
        });
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        // Sheet names have a max limit of 31 chars in Excel
        XLSX.utils.book_append_sheet(wb, ws, `${selectedClassForList} ${suffix}`.substring(0, 31));
        XLSX.writeFile(wb, `Class_${selectedClassForList}_${suffix}_Roster_${new Date().toISOString().split('T')[0]}.xlsx`);
        showSaveMessage(`Exported ${classStudents.length} ${suffix.toLowerCase()}!`);
    };

    // Common button style for Excel buttons
    const excelBtnStyle = {
        padding: '0.5rem 1rem',
        fontSize: '0.85rem',
        borderRadius: 'var(--radius-md)',
        fontWeight: 'var(--font-weight-semibold)',
        border: '2px solid',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        cursor: 'pointer',
        transition: 'all var(--transition-base)'
    };

    const deleteStudent = async (studentId, studentName) => {
        if (window.confirm(`Are you sure you want to permanently delete "${studentName}" (${studentId})? This cannot be undone.`)) {
            const { error } = await supabase
                .from('students')
                .update({ is_active: false })
                .eq('id', studentId)
                .eq('school_id', currentSchoolId);
            
            if (error) {
                alert('Error deleting student: ' + error.message);
            } else {
                await fetchData();
                showSaveMessage(`${studentName} deleted successfully.`);
            }
        }
    };

    const adminTabs = [
        { id: 'admissions', label: 'Admissions Desk', icon: PlusCircle, desc: 'Handle new enrollments and student applications.', isPro: false },
        { id: 'classes', label: 'Classes & Sections', icon: Users, desc: 'Configure classrooms and manage student rosters.', isPro: false },
        { id: 'marks', label: 'Manage Exams', icon: Award, desc: 'Input exam marks and configure subject weights.', isPro: false },
        { id: 'scanner', label: 'QR Scanner', icon: Camera, desc: 'Instantly scan ID cards for daily attendance.', isPro: true },
        { id: 'attendance', label: 'Attendance', icon: Calendar, desc: 'Track daily attendance and absentees.', isPro: false },
        { id: 'fees', label: 'Fee Management', icon: DollarSign, desc: 'Record tuition fees and payments.', isPro: false },
        { id: 'expenses', label: 'Expense Tracker', icon: TrendingDown, desc: 'Log expenses and view net profit.', isPro: true },
        { id: 'payroll', label: 'HR & Payroll', icon: BellPlus, desc: 'Process salaries, generate payslips, and track HR costs.', isPro: false },
        { id: 'reports', label: 'Report Cards', icon: FileText, desc: 'View analysis and print student report cards.', isPro: true },
        { id: 'faculty', label: 'Faculty & Teachers', icon: User, desc: 'Manage your teaching staff profiles.', isPro: false },
        { id: 'announcements', label: 'Noticeboard', icon: Megaphone, desc: 'Broadcast notices to portals.', isPro: false },
        { id: 'diary', label: 'Student Diary', icon: BookMarked, desc: 'Post homework, classwork & notices for parents.', isPro: false },
        { id: 'facilities', label: 'School Facilities', icon: Building, desc: 'List and update school infrastructure.', isPro: false },
        { id: 'blog', label: 'Website Blog', icon: Layout, desc: 'Post stories and news to the public website.', isPro: true },
        { id: 'whatsapp_scheduler', label: 'WhatsApp Schedules', icon: Clock, desc: 'Manage automated alert timers and crons.', isPro: false },
        { id: 'settings', label: 'School Settings', icon: Building2, desc: 'Update school name, logo, mission, and vision.', isPro: false },
        { id: 'logs', label: 'Activity Logs', icon: FileText, desc: 'Monitor administrative audit trails and security logs.', isPro: false }
    ];

    // ── Onboarding Guard ─────────────────────────────────────────────────────
    // For a brand new school, is_onboarded will be false (after SQL migration).
    // If it's undefined, it means the SQL migration hasn't been run or data is still initializing. 
    if (schoolSettings && schoolSettings.is_onboarded === false) {
        return (
            <OnboardingWizard 
                schoolData={schoolData} 
                completeOnboarding={completeOnboarding}
                onComplete={() => fetchData()} 
            />
        );
    }

    return (
        <div className="dashboard-container" style={{ overflowX: 'hidden' }}>
            {/* ── Loading Overlay (non-blocking — preserves tab state) ── */}
            {loading && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}>
                    <div style={{ textAlign: 'center', color: 'white' }}>
                        <div className="animate-spin" style={{ width: '44px', height: '44px', border: '4px solid rgba(255,255,255,0.15)', borderTopColor: '#3b82f6', borderRadius: '50%', margin: '0 auto 1rem' }} />
                        <p style={{ fontSize: '0.95rem', fontWeight: 600, opacity: 0.85 }}>Saving…</p>
                    </div>
                </div>
            )}

            {/* ── Confirm Modal ── */}
            {confirmModal.open && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div className="card animate-fade-in" style={{ maxWidth: '460px', width: '100%', padding: '2rem', textAlign: 'center', borderTop: `4px solid ${confirmModal.danger ? '#ef4444' : '#2563eb'}` }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.75rem' }}>{confirmModal.title}</div>
                        <div style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>{confirmModal.message}</div>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <button onClick={closeConfirm} style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={() => { confirmModal.onConfirm?.(); closeConfirm(); }} style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none', background: confirmModal.danger ? '#ef4444' : '#2563eb', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                                {confirmModal.danger ? 'Yes, Delete' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Upgrade Modal ── */}
            {upgradeModal.open && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div className="card animate-fade-in" style={{ maxWidth: '460px', width: '100%', padding: '2.5rem', textAlign: 'center', borderTop: '4px solid #8b5cf6' }}>
                        <div style={{ background: '#f5f3ff', padding: '1rem', borderRadius: '50%', color: '#8b5cf6', display: 'inline-block', marginBottom: '1.5rem' }}><Lock size={32} /></div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.75rem' }}>Upgrade to Professional</div>
                        <div style={{ color: '#475569', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                            {(() => {
                                const f = upgradeModal.featureName;
                                if (f === 'QR Scanner') return <><strong style={{ color: '#0f172a' }}>Say goodbye to manual roll calls!</strong> Upgrade to instantly scan ID cards, automatically mark daily attendance, and save hours of administrative work.</>;
                                if (f === 'Expense Tracker') return <><strong style={{ color: '#0f172a' }}>Take full control of your finances.</strong> Upgrade to unlock powerful Profit & Loss tracking, automatically balance tuition against expenses, and find out exactly how profitable your school is!</>;
                                if (f === 'Report Cards') return <><strong style={{ color: '#0f172a' }}>Stop calculating grades by hand.</strong> Upgrade to instantly generate, calculate, and print professional terminal report cards for your entire school with one click!</>;
                                if (f === 'Website Blog') return <><strong style={{ color: '#0f172a' }}>Build your school's brand online.</strong> Upgrade to publish news, events, and stories directly to your school's public website and attract more admissions!</>;
                                return <>The <strong style={{ color: '#0f172a' }}>{f}</strong> module is a premium feature. Upgrade your workspace to unlock advanced automation, analytics, and integrations.</>;
                            })()}
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <button onClick={() => setUpgradeModal({ open: false, featureName: '' })} style={{ padding: '0.8rem 1.5rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer', flex: 1 }}>Close</button>
                            <a href={`https://wa.me/923457685122?text=${encodeURIComponent('Hi, we are interested in upgrading our plan to unlock ' + upgradeModal.featureName + '.')}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', padding: '0.8rem 1.5rem', borderRadius: '10px', border: 'none', background: '#10b981', color: 'white', fontWeight: 700, cursor: 'pointer', flex: 1, boxShadow: '0 4px 14px 0 rgba(16,185,129,0.39)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Upgrade via WhatsApp</a>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Change Admin Password Modal ── */}
            {showChangePwd && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div className="card animate-fade-in" style={{ maxWidth: '420px', width: '100%', padding: '2rem', borderTop: '4px solid #2563eb' }}>
                        <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#1e293b', marginBottom: '0.25rem' }}>🔐 Change Admin Credentials</div>
                        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Update the admin username and password stored in the database.</p>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontWeight: 600, color: '#475569', fontSize: '0.85rem', marginBottom: '0.4rem' }}>New Username</label>
                            <input className="form-input" value={newAdminUser} onChange={e => setNewAdminUser(e.target.value)} placeholder={adminCredentials.username || 'admin'} style={{ width: '100%' }} />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontWeight: 600, color: '#475569', fontSize: '0.85rem', marginBottom: '0.4rem' }}>New Password</label>
                            <input className="form-input" type="password" value={newAdminPwd} onChange={e => setNewAdminPwd(e.target.value)} placeholder="New password" style={{ width: '100%' }} />
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontWeight: 600, color: '#475569', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Confirm Password</label>
                            <input className="form-input" type="password" value={newAdminPwdConfirm} onChange={e => setNewAdminPwdConfirm(e.target.value)} placeholder="Confirm password" style={{ width: '100%' }} />
                            {newAdminPwd && newAdminPwdConfirm && newAdminPwd !== newAdminPwdConfirm && (
                                <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.4rem' }}>⚠ Passwords do not match</div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => { setShowChangePwd(false); setNewAdminUser(''); setNewAdminPwd(''); setNewAdminPwdConfirm(''); }} style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={async () => {
                                if (!newAdminUser.trim() || !newAdminPwd.trim()) { alert('Username and password cannot be empty.'); return; }
                                if (newAdminPwd !== newAdminPwdConfirm) { alert('Passwords do not match.'); return; }
                                const { error } = await changeAdminPassword(newAdminUser.trim(), newAdminPwd.trim());
                                if (!error) { showSaveMessage('✅ Admin credentials updated!'); setShowChangePwd(false); setNewAdminUser(''); setNewAdminPwd(''); setNewAdminPwdConfirm(''); }
                                else alert('Error updating: ' + error.message);
                            }} style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', background: '#2563eb', color: 'white', fontWeight: 700, cursor: 'pointer' }}
                                disabled={newAdminPwd !== newAdminPwdConfirm && !!newAdminPwdConfirm}>
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Student Edit Modal ── */}
            {editingStudentId && editStudentData && (
                <Suspense fallback={null}>
                    <StudentEditModal
                        editStudentData={editStudentData}
                        setEditStudentData={setEditStudentData}
                        sectionClasses={sectionClasses}
                        studentPhotoUploadRef={studentPhotoUploadRef}
                        handleStudentPhotoUpload={handleStudentPhotoUpload}
                        students={students}
                        setStudents={setStudents}
                        showSaveMessage={showSaveMessage}
                        editingStudentId={editingStudentId}
                        setEditingStudentId={setEditingStudentId}
                        SUBJECTS={SUBJECTS}
                        CLASS_SERIAL_STARTS={CLASS_SERIAL_STARTS}
                    />
                </Suspense>
            )}

            {/* ── Hidden File Inputs ── */}
            <input type="file" ref={attendanceFileRef} onChange={importAttendanceExcel} accept=".xlsx,.xls,.csv" style={{ display: 'none' }} />
            <input type="file" ref={marksFileRef} onChange={importMarksExcel} accept=".xlsx,.xls,.csv" style={{ display: 'none' }} />
            <input type="file" ref={feeFileRef} onChange={importFeeExcel} accept=".xlsx,.xls,.csv" style={{ display: 'none' }} />
            <input type="file" ref={photoFileRef} onChange={handlePhotoUpload} accept="image/*" style={{ display: 'none' }} />
            <input type="file" ref={facultyFileRef} onChange={handleFacultyPhotoUpload} accept="image/*" style={{ display: 'none' }} />
            <input type="file" ref={facilityFileRef} onChange={handleFacilityPhotoUpload} accept="image/*" style={{ display: 'none' }} />
            <input type="file" ref={blogImageRef} onChange={handleBlogImageUpload} accept="image/*" style={{ display: 'none' }} />
            <input type="file" ref={classImportFileRef} onChange={importStudentsExcel} accept=".xlsx,.xls" style={{ display: 'none' }} />

            {/* ── Save Toast ── */}
            {saveMessage && (
                <div className="animate-fade-in" style={{ position: 'fixed', top: '20px', right: '20px', background: 'var(--color-success)', color: 'white', padding: '1rem 1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', zIndex: 1000, display: 'flex', gap: '0.5rem', alignItems: 'center', fontWeight: 'var(--font-weight-semibold)' }}>
                    <CheckCircle size={20} /> {saveMessage}
                </div>
            )}

            {/* ── MOBILE OVERLAY ── */}
            <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>

            {/* ── LEFT SIDEBAR ── */}
            <aside className={`dashboard-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div style={{ padding: '1.75rem 1.5rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                        <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', color: 'white', padding: '0.6rem', borderRadius: '12px', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)' }}>
                            <School size={22} strokeWidth={2.5} />
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#f8fafc', letterSpacing: '0.5px' }}>Control Panel</span>
                    </div>
                    {/* Close button inside sidebar for mobile only */}
                    <button className="mobile-menu-btn" style={{ color: '#f8fafc' }} onClick={() => setIsSidebarOpen(false)}>
                        <X size={24} />
                    </button>
                </div>

                <nav style={{ padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', overflowY: 'auto' }}>
                    <button onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} className="btn hover-scale" style={{
                        justifyContent: 'flex-start',
                        padding: '0.85rem 1.25rem',
                        background: activeTab === 'dashboard' ? 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)' : 'transparent',
                        color: activeTab === 'dashboard' ? 'white' : '#94a3b8',
                        fontWeight: activeTab === 'dashboard' ? 700 : 500,
                        border: 'none',
                        boxShadow: activeTab === 'dashboard' ? '0 4px 12px -3px rgba(37, 99, 235, 0.4)' : 'none',
                        borderRadius: '12px',
                        width: '100%',
                        textAlign: 'left',
                        transition: 'all 0.2s ease'
                    }}>
                        <Layout size={20} style={{ marginRight: '0.75rem', opacity: activeTab === 'dashboard' ? 1 : 0.7 }} /> Dashboard
                    </button>

                    <div style={{ margin: '1.5rem 0 0.5rem 1.25rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Modules</div>

                    {adminTabs.map((tab, idx) => {
                        const tabColors = [
                            { bg: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)', shadow: 'rgba(37, 99, 235, 0.4)' },
                            { bg: 'linear-gradient(90deg, #d946ef 0%, #c026d3 100%)', shadow: 'rgba(217, 70, 239, 0.4)' },
                            { bg: 'linear-gradient(90deg, #10b981 0%, #059669 100%)', shadow: 'rgba(16, 185, 129, 0.4)' },
                            { bg: 'linear-gradient(90deg, #f97316 0%, #ea580c 100%)', shadow: 'rgba(249, 115, 22, 0.4)' },
                            { bg: 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)', shadow: 'rgba(139, 92, 246, 0.4)' },
                            { bg: 'linear-gradient(90deg, #14b8a6 0%, #0d9488 100%)', shadow: 'rgba(20, 184, 166, 0.4)' },
                            { bg: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)', shadow: 'rgba(239, 68, 68, 0.4)' },
                            { bg: 'linear-gradient(90deg, #eab308 0%, #ca8a04 100%)', shadow: 'rgba(234, 179, 8, 0.4)' },
                            { bg: 'linear-gradient(90deg, #64748b 0%, #475569 100%)', shadow: 'rgba(100, 116, 139, 0.4)' },
                            { bg: 'linear-gradient(90deg, #ec4899 0%, #db2777 100%)', shadow: 'rgba(236, 72, 153, 0.4)' }
                        ];
                        const c = tabColors[idx % tabColors.length];
                        const isActive = activeTab === tab.id;
                        const isLocked = !isProPlan && tab.isPro;

                        return (
                            <button key={tab.id} onClick={() => { 
                                if (isLocked) { setUpgradeModal({ open: true, featureName: tab.label }); return; }
                                setActiveTab(tab.id); setIsSidebarOpen(false); 
                            }} className="btn hover-scale" style={{
                                justifyContent: 'flex-start',
                                padding: '0.85rem 1.25rem',
                                background: isActive ? c.bg : 'transparent',
                                color: isLocked ? '#cbd5e1' : (isActive ? 'white' : '#94a3b8'),
                                fontWeight: isActive ? 700 : 500,
                                border: 'none',
                                boxShadow: isActive ? `0 4px 12px -3px ${c.shadow}` : 'none',
                                borderRadius: '12px',
                                width: '100%',
                                textAlign: 'left',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <tab.icon size={20} style={{ marginRight: '0.75rem', opacity: isActive ? 1 : 0.7 }} /> 
                                <span style={{ flex: 1 }}>{tab.label}</span>
                                {isLocked && <Lock size={14} style={{ opacity: 0.6 }} />}
                            </button>
                        );
                    })}
                </nav>

                <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #334155' }}>
                    <button onClick={() => { setNewAdminUser(adminCredentials.username || ''); setShowChangePwd(true); }} className="btn hover-scale" style={{ width: '100%', justifyContent: 'center', marginBottom: '0.75rem', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }}>
                        <Lock size={16} /> Admin Config
                    </button>
                    <button onClick={handleLogout} className="btn hover-scale" style={{ width: '100%', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '10px', marginBottom: '1rem' }}>
                        <LogOut size={16} /> Logout
                    </button>
                    <div style={{ textAlign: 'center', opacity: 0.6, fontSize: '0.68rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '0.85rem' }}>
                        <span style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{schoolData?.name || 'School'} Dashboard</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', justifyContent: 'center' }}>
                            <span>Powered by</span>
                            <img src="/logo.png" style={{ height: '11px', width: 'auto', objectFit: 'contain' }} alt="KHR" />
                            <strong style={{ color: '#cbd5e1' }}>KHR Educo</strong>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <main className="dashboard-main">

                {/* Top Header Row representing the current Active Tab */}
                <header className="dashboard-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                            <Menu size={24} />
                        </button>
                        <div>
                            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                {activeTab !== 'dashboard' && (
                                    <span style={{ color: '#2563eb' }}>{adminTabs.find(t => t.id === activeTab)?.label}</span>
                                )}
                            </h1>
                            <p style={{ color: '#64748b', margin: '0.25rem 0 0', fontSize: '0.95rem' }}>
                                {activeTab !== 'dashboard' && adminTabs.find(t => t.id === activeTab)?.desc}
                            </p>
                        </div>
                    </div>
                </header>

                <div className="dashboard-content">
                    {/* ── BI Insights Dashboard ── */}
                    {activeTab === 'dashboard' && (
                        <Suspense fallback={<div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading dashboard insights...</div>}>
                            <DashboardTab 
                                students={students} 
                                schoolData={schoolData} 
                                EXPENSES={EXPENSES} 
                                adminTabs={adminTabs} 
                                setActiveTab={setActiveTab} 
                                currencySymbol={currencySymbol} 
                                isProPlan={isProPlan}
                                setUpgradeModal={setUpgradeModal}
                            />
                        </Suspense>
                    )}

                    {/* ── Tab Content ── */}
                    {activeTab !== 'dashboard' && (
                        <div className="animate-fade-in">
                            <Suspense fallback={<div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading Module…</div>}>
                                {/* Gradebook */}
                                {activeTab === 'marks' && (
                                    <GradebookTab
                                        students={students} selectedClass={selectedClass} setSelectedClass={setSelectedClass} sectionClasses={sectionClasses}
                                        TERMS={classTerms} SUBJECTS={SUBJECTS} WEIGHTS={classWeights}
                                        gbTerm={gbTerm} setGbTerm={setGbTerm} gbGenderTab={gbGenderTab} setGbGenderTab={setGbGenderTab}
                                        gbEdits={gbEdits} setGbEdits={setGbEdits} gbSaving={gbSaving}
                                        showGbStats={showGbStats} setShowGbStats={setShowGbStats}
                                        showGbSettings={showGbSettings} setShowGbSettings={setShowGbSettings}
                                        newSubjectInput={newSubjectInput} setNewSubjectInput={setNewSubjectInput}
                                        newTermInput={newTermInput} setNewTermInput={setNewTermInput}
                                        updateClassSubjects={updateClassSubjects} updateTerms={updateClassTerms} updateWeights={updateClassWeights}
                                        saveGradebook={saveGradebook} downloadGradebookTemplate={downloadGradebookTemplate}
                                        exportGradebookExcel={exportGradebookExcel} archiveTerm={archiveTerm}
                                        exportResultPDF={exportResultPDF} importGradebookExcel={importGradebookExcel}
                                        gbImportFileRef={gbImportFileRef} getCellValue={getCellValue}
                                        handleCellEdit={handleCellEdit} saveRemarks={saveRemarks}
                                        renameSubject={renameSubject} updateSubjectsForClasses={updateSubjectsForClasses}
                                    />
                                )}

                                {/* Scanner */}
                                {activeTab === 'scanner' && (
                                    <ScannerTab
                                        students={students}
                                        setStudents={setStudents}
                                        showSaveMessage={showSaveMessage}
                                        schoolName={schoolName}
                                        schoolSettings={schoolSettings}
                                        saveAttendanceRecords={saveAttendanceRecords}
                                    />
                                )}

                                {/* Attendance */}
                                {activeTab === 'attendance' && (
                                    <AttendanceTab
                                        students={students} selectedClass={selectedClass} setSelectedClass={setSelectedClass} sectionClasses={sectionClasses}
                                        attDateFilter={attDateFilter} setAttDateFilter={setAttDateFilter}
                                        markAttendance={markAttendance} removeAttendanceRecord={removeAttendanceRecord}
                                        exportAttendanceExcel={exportAttendanceExcel} fetchData={fetchData}
                                        showSaveMessage={showSaveMessage} openConfirm={openConfirm}
                                        schoolName={schoolData?.name}
                                        sections={SECTIONS}
                                    />
                                )}

                                 {/* Fee */}
                                {activeTab === 'fees' && (
                                    <FeeTab
                                        students={students} selectedClass={selectedClass} setSelectedClass={setSelectedClass} sectionClasses={sectionClasses}
                                        openNewFeeMonth={openNewFeeMonth} toggleMonthFeeStatus={toggleMonthFeeStatus}
                                        markAllPaidForMonth={markAllPaidForMonth} markAllUnpaidForMonth={markAllUnpaidForMonth}
                                        deleteFeeMonth={deleteFeeMonth} updateStudentFeeRecord={updateStudentFeeRecord}
                                        CLASS_FEE_DEFAULTS={CLASS_FEE_DEFAULTS} updateClassFeeDefaults={updateClassFeeDefaults}
                                        currencySymbol={currencySymbol} schoolName={schoolName} schoolLogo={schoolSettings?.logo_url || '/logo.png'}
                                        schoolSettings={schoolSettings}
                                    />
                                )}

                                {/* Expenses */}
                                {activeTab === 'expenses' && (
                                    <ExpensesTab
                                        EXPENSES={EXPENSES}
                                        updateExpenses={updateExpenses}
                                        students={students}
                                        currencySymbol={currencySymbol}
                                    />
                                )}

                                {/* Admissions */}
                                {activeTab === 'admissions' && (
                                    <AdmissionsTab
                                        admissionData={admissionData} setAdmissionData={setAdmissionData}
                                        admissionInitialState={admissionInitialState}
                                        printAdmissionForm={printAdmissionForm}
                                        printAdmissionFormBulk={printAdmissionFormBulk}
                                        printBlankAdmissionForm={printBlankAdmissionForm}
                                        handleAdmissionPhotoUpload={handleAdmissionPhotoUpload}
                                        photoFileRef={photoFileRef} sectionClasses={sectionClasses}
                                        students={students}
                                        INQUIRIES={INQUIRIES}
                                        saveInquiry={saveInquiry} deleteInquiry={deleteInquiry}
                                    />
                                )}

                                {/* Reports */}
                                {activeTab === 'reports' && (
                                    <ReportsTab
                                        students={students}
                                        setStudents={setStudents}
                                        schoolData={schoolData}
                                        SUBJECTS={SUBJECTS}
                                        TERMS={TERMS}
                                        WEIGHTS={WEIGHTS}
                                        SECTIONS={SECTIONS}
                                        selectedClass={selectedClass}
                                        setSelectedClass={setSelectedClass}
                                        sectionClasses={sectionClasses}
                                        currencySymbol={currencySymbol}
                                        schoolSettings={schoolSettings}
                                    />
                                )}

                                {/* Announcements */}
                                {activeTab === 'announcements' && (
                                    <AnnouncementsTab
                                        schoolData={schoolData}
                                        newAnnouncement={newAnnouncement} setNewAnnouncement={setNewAnnouncement}
                                        addAnnouncement={addAnnouncement} deleteAnnouncement={deleteAnnouncement}
                                    />
                                )}

                                {/* Payroll */}
                                {activeTab === 'payroll' && (
                                    <PayrollTab
                                        schoolData={schoolData}
                                        currentSchoolId={currentSchoolId}
                                        fetchData={fetchData}
                                        fetchPublicData={fetchPublicData}
                                        showSaveMessage={showSaveMessage}
                                        currencySymbol={currencySymbol}
                                    />
                                )}

                                {/* Faculty */}
                                {activeTab === 'faculty' && (
                                    <FacultyTab
                                        schoolData={schoolData}
                                        editingFacultyId={editingFacultyId} setEditingFacultyId={setEditingFacultyId}
                                        tempFacultyMember={tempFacultyMember} setTempFacultyMember={setTempFacultyMember}
                                        addFaculty={addFaculty} saveFaculty={saveFaculty} deleteFaculty={deleteFaculty}
                                        facultyFileRef={facultyFileRef}
                                        fetchData={fetchData} fetchPublicData={fetchPublicData} showSaveMessage={showSaveMessage}
                                    />
                                )}

                                {/* Facilities */}
                                {activeTab === 'facilities' && (
                                    <FacilitiesTab
                                        schoolData={schoolData}
                                        editingFacilityId={editingFacilityId} setEditingFacilityId={setEditingFacilityId}
                                        tempFacility={tempFacility} setTempFacility={setTempFacility}
                                        addFacility={addFacility} saveFacility={saveFacility} deleteFacility={deleteFacility}
                                        facilityFileRef={facilityFileRef}
                                        fetchPublicData={fetchPublicData}
                                    />
                                )}

                                {/* Blog */}
                                {activeTab === 'blog' && (
                                    <BlogTab
                                        schoolData={schoolData}
                                        editingBlogId={editingBlogId} setEditingBlogId={setEditingBlogId}
                                        tempBlog={tempBlog} setTempBlog={setTempBlog}
                                        addBlog={addBlog} saveBlog={saveBlog} deleteBlog={deleteBlog}
                                        blogImageRef={blogImageRef}
                                        fetchPublicData={fetchPublicData}
                                    />
                                )}

                                {/* Class Lists */}
                                {activeTab === 'classes' && (
                                    <ClassListsTab
                                        students={students} setStudents={setStudents}
                                        SECTIONS={SECTIONS} CLASSES={CLASSES}
                                        updateSections={updateSections} updateClasses={updateClasses}
                                        sectionClasses={sectionClasses}
                                        selectedClassForList={selectedClassForList} setSelectedClassForList={setSelectedClassForList}
                                        viewingClass={viewingClass} setViewingClass={setViewingClass}
                                        classDetailTab={classDetailTab} setClassDetailTab={setClassDetailTab}
                                        newSectionName={newSectionName} setNewSectionName={setNewSectionName}
                                        newClassName={newClassName} setNewClassName={setNewClassName}
                                        editingSectionId={editingSectionId} setEditingSectionId={setEditingSectionId}
                                        editingSectionName={editingSectionName} setEditingSectionName={setEditingSectionName}
                                        selectedSectionId={selectedSectionId} setSelectedSectionId={setSelectedSectionId}
                                        editingStudentId={editingStudentId} setEditingStudentId={setEditingStudentId}
                                        editStudentData={editStudentData} setEditStudentData={setEditStudentData}
                                        classImportFileRef={classImportFileRef} importStudentsExcel={importStudentsExcel}
                                        exportClassRoster={exportClassRoster} exportPasswordsPDF={exportPasswordsPDF}
                                        setActiveTab={setActiveTab} setAdmissionData={setAdmissionData}
                                        showSaveMessage={showSaveMessage} openConfirm={openConfirm}
                                        deleteStudent={deleteStudent}
                                        CLASS_SERIAL_STARTS={CLASS_SERIAL_STARTS} updateClassSerialStarts={updateClassSerialStarts}
                                        uploadImage={uploadImage}
                                        schoolName={schoolName}
                                        schoolLogo={schoolSettings?.logo_url || '/logo.png'}
                                    />
                                )}

                                {/* School Settings */}
                                {activeTab === 'settings' && (
                                    <SettingsTab
                                        schoolData={schoolData}
                                        schoolSettings={schoolSettings}
                                        currentSchoolId={schoolSettings?.school_id}
                                        updateSchoolInfo={updateSchoolInfo}
                                        updateSchoolSettings={updateSchoolSettings}
                                        showSaveMessage={showSaveMessage}
                                    />

                                )}

                                {/* Logs */}
                                {activeTab === 'logs' && (
                                    <LogsTab
                                        currentSchoolId={currentSchoolId}
                                    />
                                )}

                                {/* Student Diary */}
                                {activeTab === 'diary' && (
                                    <DiaryTab
                                        showSaveMessage={showSaveMessage}
                                    />
                                )}

                                {/* WhatsApp Automated Schedules */}
                                {activeTab === 'whatsapp_scheduler' && (
                                    <WhatsAppSchedulerTab
                                        schoolData={schoolData}
                                        schoolSettings={schoolSettings}
                                        updateSchoolSettings={updateSchoolSettings}
                                        currencySymbol={currencySymbol}
                                        students={students}
                                    />
                                )}
                            </Suspense>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminPortal;
