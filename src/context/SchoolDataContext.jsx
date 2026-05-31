import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { CLASSES as LOCAL_CLASSES } from '../data/schoolData';

// ─── Default values ──────────────────────────────────────────────────────────
const DEFAULT_SUBJECTS         = {};
const DEFAULT_TERMS            = {};
const DEFAULT_WEIGHTS          = {};
const DEFAULT_SUBJECT_TOTAL    = 100;
const DEFAULT_CLASS_SERIAL_STARTS = {};
const DEFAULT_CLASS_FEE_DEFAULTS  = {};

const SchoolDataContext = createContext();

export const useSchoolData = () => {
    const context = useContext(SchoolDataContext);
    if (!context) throw new Error('useSchoolData must be used within a SchoolDataProvider');
    return context;
};

// ─────────────────────────────────────────────────────────────────────────────
// SchoolDataProvider
//
// Props:
//   schoolId  — the active tenant (e.g. 'acs-001').
//               Falls back to 'acs-001' for full backwards-compatibility
//               with the existing single-school deployment.
// ─────────────────────────────────────────────────────────────────────────────
export const SchoolDataProvider = ({ children, schoolId = 'acs-001' }) => {

    // ── currentSchoolId is the single source of truth for tenant isolation ──
    const [currentSchoolId, setCurrentSchoolId] = useState(schoolId);

    // ── schoolSettings mirrors the row in the `schools` master table ─────────
    const [schoolSettings, setSchoolSettings] = useState({
        school_id:       schoolId,
        school_name:     '',
        country:         'Pakistan',
        currency_symbol: 'RS',
        logo_url:        null,
        receipt_header:  null,
        is_onboarded:    true, // Default to true so existing schools/slow loads don't flicker the wizard
    });

    const [data, setData] = useState({
        name:          '',
        tagline:       '',
        description:   '',
        about:         {},
        contact:       {},
        statistics:    [],
        faculty:       [],
        facilities:    [],
        students:      [],
        announcements: [],
        testimonials:  [],
        blogs:         []
    });

    const [classes,           setClasses]           = useState(LOCAL_CLASSES);
    const [subjects,          setSubjects]          = useState(DEFAULT_SUBJECTS);
    const [terms,             setTerms]             = useState(DEFAULT_TERMS);
    const [sections,          setSections]          = useState([]);
    const [weights,           setWeights]           = useState(DEFAULT_WEIGHTS);
    const [classSerialStarts, setClassSerialStarts] = useState(DEFAULT_CLASS_SERIAL_STARTS);
    const [classFeeDefaults,  setClassFeeDefaults]  = useState(DEFAULT_CLASS_FEE_DEFAULTS);
    const [feeSettings,       setFeeSettings]       = useState(null); // 3-level fee config
    const [expenses,          setExpenses]          = useState([]);  // legacy metadata
    const [inquiries,         setInquiries]         = useState([]);
    const [diaryEntries,      setDiaryEntries]      = useState([]);
    const [payrollRecords,    setPayrollRecords]    = useState([]);
    const [expenseRecords,    setExpenseRecords]    = useState([]);
    const [loading,           setLoading]           = useState(true);
    const [adminCredentials,  setAdminCredentials]  = useState({ username: '', password: '' });

    // ─── Paginated helper to bypass PostgREST max rows limit ───────────────────
    const fetchRelationalTable = async (table, sid) => {
        let allData = [];
        let start = 0;
        const limit = 1000;
        let done = false;
        
        while (!done) {
            const { data: chunk, error } = await supabase
                .from(table)
                .select('*')
                .eq('school_id', sid)
                .range(start, start + limit - 1);
                
            if (error) {
                console.error(`Error loading ${table}:`, error);
                done = true;
            } else if (!chunk || chunk.length === 0) {
                done = true;
            } else {
                allData = [...allData, ...chunk];
                if (chunk.length < limit) {
                    done = true;
                } else {
                    start += limit;
                }
            }
        }
        return allData;
    };

    // ─── Core fetch — every query is scoped to currentSchoolId ───────────────
    // ─── Core fetch — loads only business-critical data on every app start ──────
    // Faculty, facilities, testimonials, blogs are loaded separately via
    // fetchPublicData() and only when the public-facing pages need them.
    const fetchData = async (sid = currentSchoolId) => {
        // Guard: do nothing when no tenant is selected (SaaS landing mode)
        if (!sid) {
            setLoading(false);
            return;
        }
        try {
            // Only show full loading screen on initial load or tenant switch
            if (sid !== currentSchoolId || !data?.name) {
                setLoading(true);
            }

            // Fire only the critical queries in parallel
            const [
                { data: schoolRow },
                { data: info },
                { data: metaRows },
                { data: announcements },
                { data: studentsRes },
                { data: admins },
                attRecords,
                feeRecords,
                resRecords
            ] = await Promise.all([
                // Master school settings (currency, logo, etc.)
                supabase
                    .from('schools')
                    .select('*')
                    .eq('school_id', sid)
                    .maybeSingle(),

                // Public school info (name, tagline, about, contact...)
                supabase
                    .from('school_info')
                    .select('*')
                    .eq('school_id', sid)
                    .maybeSingle(),

                // Metadata (CLASSES, SUBJECTS, TERMS, WEIGHTS, etc.)
                supabase
                    .from('metadata')
                    .select('*')
                    .eq('school_id', sid),

                // Announcements (needed on dashboard + student portal)
                supabase
                    .from('announcements')
                    .select('*')
                    .eq('school_id', sid)
                    .order('id', { ascending: false }),

                // Students — explicit columns, ordered by serial number
                supabase
                    .from('students')
                    .select('id, name, grade, image, serial_number, password, admissions, advance_balance')
                    .eq('school_id', sid)
                    .eq('is_active', true)
                    .order('serial_number', { ascending: true, nullsFirst: false }),

                // Admin credentials
                supabase
                    .from('admins')
                    .select('*')
                    .eq('school_id', sid)
                    .eq('role', 'admin')
                    .limit(1),
                    
                // Fetch Relational Attendance (paginated)
                fetchRelationalTable('attendance_records', sid),

                // Fetch Relational Fees (paginated)
                fetchRelationalTable('fee_records', sid),

                // Fetch Relational Results (paginated)
                fetchRelationalTable('exam_results', sid)
            ]);

            // ── Update school settings ────────────────────────────────────────
            if (schoolRow) {
                setSchoolSettings(schoolRow);
            }

            // ── Admin credentials ─────────────────────────────────────────────
            if (admins && admins.length > 0) {
                setAdminCredentials({ username: admins[0].username, password: admins[0].password });
            }

            // ── Build metadata map ────────────────────────────────────────────
            const metaMap = {};
            (metaRows || []).forEach(r => { metaMap[r.key] = r.value; });

            // ── Students ──────────────────────────────────────────────────────
            let studentsList = [];
            if (studentsRes) {
                // Group attendance by student
                const attByStudent = {};
                (attRecords || []).forEach(r => {
                    if (!attByStudent[r.student_id]) attByStudent[r.student_id] = [];
                    attByStudent[r.student_id].push({ date: r.date, status: r.status });
                });

                // Group fees by student
                const feesByStudent = {};
                (feeRecords || []).forEach(f => {
                    if (!feesByStudent[f.student_id]) feesByStudent[f.student_id] = [];
                    feesByStudent[f.student_id].push({
                        month: f.month,
                        tuitionFee: f.tuition_fee,
                        admissionFee: f.admission_fee,
                        annualFee: f.annual_fee,
                        examFee: f.exam_fee,
                        transportFee: f.transport_fee,
                        labFee: f.lab_fee,
                        lateFine: f.late_fine,
                        discount: f.discount,
                        paidAmount: f.paid_amount,
                        status: f.status,
                        paymentDate: f.payment_date,
                        paymentMethod: f.payment_method,
                        isOnline: f.is_online
                    });
                });

                // Group results by student
                const resByStudent = {};
                const weightsObj = metaMap['WEIGHTS'] || {};
                (resRecords || []).forEach(r => {
                    if (!resByStudent[r.student_id]) resByStudent[r.student_id] = [];
                    
                    // Determine total marks for this subject and term
                    let total = 100;
                    if (weightsObj) {
                        if (weightsObj[r.term] && typeof weightsObj[r.term] === 'object' && weightsObj[r.term][r.subject] !== undefined && weightsObj[r.term][r.subject] !== '') {
                            total = Number(weightsObj[r.term][r.subject]);
                        } else if (typeof weightsObj[r.subject] === 'number') {
                            total = Number(weightsObj[r.subject]);
                        }
                    }
                    if (!total || total <= 0) total = 100;
                    
                    const isAbsent = r.is_absent || (typeof r.marks_obtained === 'string' && r.marks_obtained.trim().toUpperCase() === 'A');
                    const obtained = isAbsent ? 'A' : Number(r.marks_obtained || 0);
                    const percentage = isAbsent ? 0 : Math.round((obtained / total) * 100);
                    
                    const grade = percentage >= 95 ? 'A++' :
                                  percentage >= 90 ? 'A+' :
                                  percentage >= 85 ? 'A' :
                                  percentage >= 80 ? 'B++' :
                                  percentage >= 75 ? 'B+' :
                                  percentage >= 70 ? 'B' :
                                  percentage >= 60 ? 'C' :
                                  percentage >= 50 ? 'D' :
                                  percentage >= 40 ? 'E' : 'U';

                    resByStudent[r.student_id].push({
                        term: r.term,
                        subject: r.subject,
                        obtained: obtained,
                        total: total,
                        percentage: percentage,
                        grade: grade,
                        remarks: r.remarks
                    });
                });

                studentsList = studentsRes.map(s => {
                    const records = attByStudent[s.id] || [];
                    const feeHistory = feesByStudent[s.id] || [];
                    const results = resByStudent[s.id] || [];
                    const present = records.filter(r => r.status === 'present').length;
                    const absent = records.filter(r => r.status === 'absent').length;
                    const leave = records.filter(r => r.status === 'leave').length;
                    const late = records.filter(r => r.status === 'late').length;
                    const holiday = records.filter(r => r.status === 'holiday').length;
                    
                    const activeRecords = records.filter(r => r.status !== 'holiday');
                    const presentForPct = activeRecords.filter(r => r.status === 'present' || r.status === 'leave' || r.status === 'late').length;
                    const percentage = activeRecords.length > 0 ? parseFloat(((presentForPct / activeRecords.length) * 100).toFixed(1)) : 0;

                    return {
                        ...s,
                        photo:           s.image,
                        feeHistory:      feeHistory,
                        previousResults: [],       // legacy column removed — data is in exam_results table
                        previous_results: [],
                        serialNumber:    s.serial_number,
                        results:         results,
                        admissions:      s.admissions || [],
                        attendance: {
                            records, total: records.length, present, absent, leave, late, holiday, percentage
                        }
                    };
                });
            }

            setData(prev => ({
                ...prev,
                ...(info || {}),
                about:         info?.about   || { mission: '', vision: '', values: [], history: '' },
                contact:       info?.contact || { phone: '', email: '', address: '', hours: '' },
                announcements: announcements || [],
                students:      studentsList,
                plan:          schoolRow?.plan
                // Note: faculty, facilities, testimonials, blogs are loaded
                // lazily via fetchPublicData() — only when public pages open
            }));

            // ── Apply metadata ────────────────────────────────────────────────
            const currentClasses = metaMap['CLASSES'] || LOCAL_CLASSES;
            setClasses(currentClasses);

            if (metaMap['SUBJECTS']) {
                const loaded = metaMap['SUBJECTS'];
                if (Array.isArray(loaded)) {
                    const legacyMap = {};
                    currentClasses.forEach(c => { legacyMap[c] = loaded; });
                    setSubjects(legacyMap);
                } else {
                    setSubjects(loaded);
                }
            } else {
                setSubjects(DEFAULT_SUBJECTS);
            }

            if (metaMap['TERMS']) {
                const loadedTerms = metaMap['TERMS'];
                if (Array.isArray(loadedTerms)) {
                    const legacyMap = {};
                    currentClasses.forEach(c => { legacyMap[c] = loadedTerms; });
                    setTerms(legacyMap);
                } else {
                    setTerms(loadedTerms);
                }
            } else {
                setTerms(DEFAULT_TERMS);
            }

            setSections(metaMap['SECTIONS'] || []);
            setWeights(metaMap['WEIGHTS'] || DEFAULT_WEIGHTS);
            setClassSerialStarts(metaMap['CLASS_SERIAL_STARTS'] || DEFAULT_CLASS_SERIAL_STARTS);
            setClassFeeDefaults(metaMap['CLASS_FEE_DEFAULTS'] || DEFAULT_CLASS_FEE_DEFAULTS);
            setFeeSettings(metaMap['FEE_SETTINGS'] || null);
            setExpenses(metaMap['EXPENSES'] || []);
            setInquiries(metaMap['INQUIRIES'] || []);

        } catch (error) {
            console.error('Error fetching school data:', error);
        } finally {
            setLoading(false);
        }
    };

    // ─── Lazy fetch — public-facing data (faculty, facilities, blogs, testimonials)
    // Call this only from pages that actually display this data
    const fetchPublicData = async (sid = currentSchoolId) => {
        try {
            const [
                { data: faculty },
                { data: facilities },
                { data: testimonials },
                { data: blogs }
            ] = await Promise.all([
                supabase.from('faculty').select('*').eq('school_id', sid).eq('is_active', true).order('id'),
                supabase.from('facilities').select('*').eq('school_id', sid).order('id'),
                supabase.from('testimonials').select('*').eq('school_id', sid),
                supabase.from('blogs').select('*').eq('school_id', sid).order('created_at', { ascending: false })
            ]);
            setData(prev => ({
                ...prev,
                faculty:      faculty      || [],
                facilities:   facilities   || [],
                testimonials: testimonials || [],
                blogs:        blogs        || []
            }));
        } catch (error) {
            console.error('Error fetching public data:', error);
        }
    };


    // Re-fetch whenever the active school changes.
    // Skip entirely when schoolId is null (SaaS landing — no tenant selected).
    useEffect(() => {
        setCurrentSchoolId(schoolId);
        if (schoolId) {
            fetchData(schoolId);
        } else {
            setLoading(false);
        }
    }, [schoolId]);

    // ─── Database Update Wrappers ─────────────────────────────────────────────
    // Every write also stamps school_id on the payload so cross-tenant writes
    // are impossible even if there is a coding mistake.

    const updateSchoolInfo = async (updates) => {
        // If updates contains flat keys like 'mission', 'vision', wrap them into 'about' and 'contact' 
        // objects to match the database structure and the frontend's expectations.
        const preparedUpdates = { ...updates };
        
        if (updates.mission !== undefined || updates.vision !== undefined) {
            preparedUpdates.about = {
                ...(data.about || {}),
                mission: updates.mission !== undefined ? updates.mission : data.about?.mission,
                vision:  updates.vision  !== undefined ? updates.vision  : data.about?.vision
            };
        }

        if (updates.phone !== undefined || updates.email !== undefined || updates.address !== undefined) {
            preparedUpdates.contact = {
                ...(data.contact || {}),
                phone:   updates.phone   !== undefined ? updates.phone   : data.contact?.phone,
                email:   updates.email   !== undefined ? updates.email   : data.contact?.email,
                address: updates.address !== undefined ? updates.address : data.contact?.address
            };
        }

        // Clean up flat keys before sending to database
        ['mission', 'vision', 'phone', 'email', 'address'].forEach(k => delete preparedUpdates[k]);

        const { error } = await supabase
            .from('school_info')
            .update(preparedUpdates)
            .eq('school_id', currentSchoolId);
        
        if (!error) {
            // Update local state directly — no full re-fetch needed
            setData(prev => ({ ...prev, ...preparedUpdates }));
        }
        return { error };
    };

    const updateAbout = (updates) => updateSchoolInfo({ ...data.about, ...updates });
    const updateContact = (updates) => updateSchoolInfo({ ...data.contact, ...updates });

    const updateSchoolSettings = async (updates) => {
        const { error } = await supabase
            .from('schools')
            .update(updates)
            .eq('school_id', currentSchoolId);
        if (!error) {
            setSchoolSettings(prev => ({ ...prev, ...updates }));
        }
        return { error };
    };

    const completeOnboarding = async (finalSnapshot) => {
        // finalSnapshot: { school_name, logo_url, country, currency_symbol }
        const { error } = await supabase
            .from('schools')
            .update({ ...finalSnapshot, is_onboarded: true })
            .eq('school_id', currentSchoolId);
        
        if (!error) {
            setSchoolSettings(prev => ({ ...prev, ...finalSnapshot, is_onboarded: true }));
        }
        return { error };
    };

    const setFaculty = async (facultyList) => {
        const tagged = facultyList.map(f => ({ ...f, school_id: currentSchoolId }));
        const { error } = await supabase.from('faculty').upsert(tagged);
        if (!error) {
            // Update local state directly — no full re-fetch needed
            setData(prev => ({ ...prev, faculty: tagged }));
        }
        return { error };
    };

    const setFacilities = async (facilitiesList) => {
        const tagged = facilitiesList.map(f => ({ ...f, school_id: currentSchoolId }));
        const { error } = await supabase.from('facilities').upsert(tagged);
        if (!error) {
            // Update local state directly — no full re-fetch needed
            setData(prev => ({ ...prev, facilities: tagged }));
        }
        return { error };
    };

    const setStudents = async (studentsList) => {
        const dbStudents = studentsList.map(s => {
            const out = {
                school_id:        currentSchoolId,
                serial_number:    s.serialNumber     !== undefined ? s.serialNumber   : s.serial_number,
                password:         s.password,
                name:             s.name,
                grade:            s.grade,
                image:            s.image            !== undefined ? s.image          : s.photo,
                admissions:       s.admissions       || []
            };
            if (s.id && !s.id.startsWith('TEMP-')) {
                out.id = s.id;
            }
            return out;
        });

        const { data: updatedRows, error } = await supabase.from('students').upsert(dbStudents).select();
        if (!error && updatedRows) {
            // Normalise and update local state directly — merge instead of replace using the returned DB rows
            const incomingNormalised = updatedRows.map(dbRow => ({
                id:              dbRow.id,
                name:            dbRow.name,
                grade:           dbRow.grade,
                password:        dbRow.password,
                photo:           dbRow.image,
                serialNumber:    dbRow.serial_number,
                admissions:      dbRow.admissions || []
            }));

            setData(prev => {
                const merged = [...(prev.students || [])];
                incomingNormalised.forEach(ns => {
                    const idx = merged.findIndex(s => s.id === ns.id || (s.id && s.id.startsWith('TEMP-') && s.name === ns.name && s.grade === ns.grade));
                    if (idx > -1) {
                        merged[idx] = { ...merged[idx], ...ns, id: ns.id }; // Update with new ID and DB data, preserving relational state
                    } else {
                        merged.push({
                            ...ns,
                            feeHistory: [],
                            previousResults: [],
                            results: [],
                            attendance: { records: [], total: 0, present: 0, absent: 0, leave: 0, late: 0, holiday: 0, percentage: 0 }
                        });
                    }
                });
                // Maintain sort order by serial number if possible
                merged.sort((a, b) => {
                    const snA = parseInt(a.serialNumber || a.serial_number, 10);
                    const snB = parseInt(b.serialNumber || b.serial_number, 10);
                    if (isNaN(snA) || isNaN(snB)) return 0;
                    return snA - snB;
                });
                return { ...prev, students: merged };
            });
        }
        return { error };
    };

    const setAnnouncements = async (announcementsList) => {
        const tagged = announcementsList.map(a => ({ ...a, school_id: currentSchoolId }));
        const { error } = await supabase.from('announcements').upsert(tagged);
        if (!error) {
            // Update local state directly — no full re-fetch needed
            setData(prev => ({ ...prev, announcements: tagged }));
        }
        return { error };
    };

    const setBlogs = async (blogsList) => {
        const tagged = blogsList.map(b => ({ ...b, school_id: currentSchoolId }));
        const { error } = await supabase.from('blogs').upsert(tagged);
        if (!error) {
            // Update local state directly — no full re-fetch needed
            setData(prev => ({ ...prev, blogs: tagged }));
        }
        return { error };
    };

    // ─── Metadata helpers — composite key (school_id, key) ───────────────────
    const _upsertMeta = async (key, value) =>
        supabase.from('metadata').upsert({ school_id: currentSchoolId, key, value });

    const updateClasses = async (newClassesList) => {
        const { error } = await _upsertMeta('CLASSES', newClassesList);
        if (!error) setClasses(newClassesList);
    };

    const updateSubjects = async (newSubjectsMap) => {
        const { error } = await _upsertMeta('SUBJECTS', newSubjectsMap);
        if (!error) setSubjects(newSubjectsMap);
    };

    const updateTerms = async (newTermsMap) => {
        const { error } = await _upsertMeta('TERMS', newTermsMap);
        if (!error) setTerms(newTermsMap);
    };

    const updateSections = async (newSectionsList) => {
        const { error } = await _upsertMeta('SECTIONS', newSectionsList);
        if (!error) setSections(newSectionsList);
        return { error };
    };

    const updateWeights = async (newWeights) => {
        const { error } = await _upsertMeta('WEIGHTS', newWeights);
        if (!error) setWeights(newWeights);
    };

    const updateClassSerialStarts = async (newMap) => {
        const { error } = await _upsertMeta('CLASS_SERIAL_STARTS', newMap);
        if (!error) setClassSerialStarts(newMap);
        return { error };
    };

    const updateClassFeeDefaults = async (newMap) => {
        const { error } = await _upsertMeta('CLASS_FEE_DEFAULTS', newMap);
        if (!error) setClassFeeDefaults(newMap);
        return { error };
    };

    const saveFeeSettings = async (settingsObj) => {
        const { error } = await _upsertMeta('FEE_SETTINGS', settingsObj);
        if (!error) setFeeSettings(settingsObj);
        return { error };
    };

    // ─── Save advance balance on a student ────────────────────────────────────
    const saveAdvanceBalance = async (studentId, amount) => {
        const { error } = await supabase
            .from('students')
            .update({ advance_balance: amount })
            .eq('id', studentId);
        if (!error) {
            setData(prev => ({
                ...prev,
                students: prev.students.map(s =>
                    s.id === studentId ? { ...s, advance_balance: amount } : s
                )
            }));
        }
        return { error };
    };

    const updateExpenses = async (newList) => {
        const { error } = await _upsertMeta('EXPENSES', newList);
        if (!error) setExpenses(newList);
        return { error };
    };

    // ─── Shared helper: patch attendance fields on a single student in local state ──
    const _patchStudentAttendance = (studentId, patchFn) => {
        setData(prev => ({
            ...prev,
            students: prev.students.map(s => {
                if (s.id !== studentId) return s;
                const att = patchFn(s.attendance || { records: [], total: 0, present: 0, absent: 0, leave: 0, late: 0, holiday: 0, percentage: 0 });
                return { ...s, attendance: att };
            })
        }));
    };

    // ─── Rebuild attendance summary from a flat records array ────────────────────
    const _buildAttSummary = (records) => {
        const present  = records.filter(r => r.status === 'present').length;
        const absent   = records.filter(r => r.status === 'absent').length;
        const leave    = records.filter(r => r.status === 'leave').length;
        const late     = records.filter(r => r.status === 'late').length;
        const holiday  = records.filter(r => r.status === 'holiday').length;
        const activeRecords    = records.filter(r => r.status !== 'holiday');
        const presentForPct    = activeRecords.filter(r => r.status === 'present' || r.status === 'leave' || r.status === 'late').length;
        const percentage = activeRecords.length > 0 ? parseFloat(((presentForPct / activeRecords.length) * 100).toFixed(1)) : 0;
        return { records, total: records.length, present, absent, leave, late, holiday, percentage };
    };

    const saveAttendanceRecords = async (records) => {
        // records: [{ student_id, date, status, remarks }]
        const dbRecords = records.map(r => ({ ...r, school_id: currentSchoolId }));
        const { error } = await supabase.from('attendance_records').upsert(dbRecords, { onConflict: 'student_id, date' });
        if (!error) {
            // Group incoming records by student and patch local state directly
            const byStudent = {};
            records.forEach(r => {
                if (!byStudent[r.student_id]) byStudent[r.student_id] = [];
                byStudent[r.student_id].push({ date: r.date, status: r.status });
            });
            setData(prev => ({
                ...prev,
                students: prev.students.map(s => {
                    if (!byStudent[s.id]) return s;
                    const existing = (s.attendance?.records || []).filter(
                        rec => !byStudent[s.id].some(nr => nr.date === rec.date)
                    );
                    const merged = [...existing, ...byStudent[s.id]];
                    return { ...s, attendance: _buildAttSummary(merged) };
                })
            }));
        }
        return { error };
    };

    const deleteAttendanceRecords = async (studentIds, date) => {
        const { error } = await supabase.from('attendance_records')
            .delete()
            .eq('school_id', currentSchoolId)
            .eq('date', date)
            .in('student_id', studentIds);
        if (!error) {
            const idSet = new Set(studentIds);
            setData(prev => ({
                ...prev,
                students: prev.students.map(s => {
                    if (!idSet.has(s.id)) return s;
                    const filtered = (s.attendance?.records || []).filter(r => r.date !== date);
                    return { ...s, attendance: _buildAttSummary(filtered) };
                })
            }));
        }
        return { error };
    };

    const saveFeeRecords = async (records) => {
        const dbRecords = records.map(r => ({
            school_id: currentSchoolId,
            student_id: r.student_id,
            month: r.month,
            tuition_fee: r.tuitionFee,
            admission_fee: r.admissionFee,
            annual_fee: r.annualFee,
            exam_fee: r.examFee,
            transport_fee: r.transportFee,
            lab_fee: r.labFee,
            late_fine: r.lateFine,
            discount: r.discount,
            paid_amount: r.paidAmount,
            status: r.status,
            payment_date: r.paymentDate,
            payment_method: r.paymentMethod,
            is_online: r.isOnline
        }));
        const { error } = await supabase.from('fee_records').upsert(dbRecords, { onConflict: 'student_id, month' });
        if (!error) {
            // Patch each student's feeHistory in local state
            const byStudent = {};
            records.forEach(r => {
                if (!byStudent[r.student_id]) byStudent[r.student_id] = [];
                byStudent[r.student_id].push(r);
            });
            setData(prev => ({
                ...prev,
                students: prev.students.map(s => {
                    if (!byStudent[s.id]) return s;
                    const existing = (s.feeHistory || []).filter(
                        f => !byStudent[s.id].some(nr => nr.month === f.month)
                    );
                    const merged = [...existing, ...byStudent[s.id]];
                    return { ...s, feeHistory: merged };
                })
            }));
        }
        return { error };
    };

    const deleteFeeRecords = async (studentIds, month) => {
        const { error } = await supabase.from('fee_records')
            .delete()
            .eq('school_id', currentSchoolId)
            .eq('month', month)
            .in('student_id', studentIds);
        if (!error) {
            const idSet = new Set(studentIds);
            setData(prev => ({
                ...prev,
                students: prev.students.map(s => {
                    if (!idSet.has(s.id)) return s;
                    return { ...s, feeHistory: (s.feeHistory || []).filter(f => f.month !== month) };
                })
            }));
        }
        return { error };
    };

    const saveExamResults = async (results) => {
        // results: [{ student_id, term, subject, obtained, remarks }]
        const dbRecords = results.map(r => ({
            school_id: currentSchoolId,
            student_id: r.student_id,
            term: r.term,
            subject: r.subject,
            marks_obtained: r.obtained === 'A' ? 0 : (r.obtained === null ? null : Number(r.obtained)),
            is_absent: r.obtained === 'A',
            remarks: r.remarks
        }));
        const { error } = await supabase.from('exam_results').upsert(dbRecords, { onConflict: 'student_id, term, subject' });
        if (!error) {
            // Compute enriched result objects and patch local state
            const byStudent = {};
            results.forEach(r => {
                if (!byStudent[r.student_id]) byStudent[r.student_id] = [];
                const isAbsent = r.obtained === 'A';
                const obtained = isAbsent ? 'A' : Number(r.obtained || 0);

                // Determine total from weights in context
                let total = 100;
                const weightsObj = weights;
                if (weightsObj) {
                    if (weightsObj[r.term] && typeof weightsObj[r.term] === 'object' && weightsObj[r.term][r.subject] !== undefined && weightsObj[r.term][r.subject] !== '') {
                        total = Number(weightsObj[r.term][r.subject]);
                    } else if (typeof weightsObj[r.subject] === 'number') {
                        total = Number(weightsObj[r.subject]);
                    }
                }
                if (!total || total <= 0) total = 100;

                const percentage = isAbsent ? 0 : Math.round((obtained / total) * 100);
                const grade = percentage >= 95 ? 'A++' :
                              percentage >= 90 ? 'A+' :
                              percentage >= 85 ? 'A' :
                              percentage >= 80 ? 'B++' :
                              percentage >= 75 ? 'B+' :
                              percentage >= 70 ? 'B' :
                              percentage >= 60 ? 'C' :
                              percentage >= 50 ? 'D' :
                              percentage >= 40 ? 'E' : 'U';

                byStudent[r.student_id].push({ term: r.term, subject: r.subject, obtained, total, percentage, grade, remarks: r.remarks });
            });

            setData(prev => ({
                ...prev,
                students: prev.students.map(s => {
                    if (!byStudent[s.id]) return s;
                    const existing = (s.results || []).filter(
                        res => !byStudent[s.id].some(nr => nr.term === res.term && nr.subject === res.subject)
                    );
                    return { ...s, results: [...existing, ...byStudent[s.id]] };
                })
            }));
        }
        return { error };
    };

    const saveInquiry = async (inq) => {
        const payload = {
            id: inq.id,
            school_id: currentSchoolId,
            inquiry_number: inq.inquiryNumber,
            student_name: inq.studentName,
            father_name: inq.fatherName,
            contact: inq.contact,
            applying_for: inq.applyingFor,
            inquiry_date: inq.date,
            notes: inq.notes,
            status: inq.status,
            fee_admission: inq.feeAdmission ? Number(inq.feeAdmission) : 0,
            fee_paper_fund: inq.feePaperFund ? Number(inq.feePaperFund) : 0,
            fee_monthly: inq.feeMonthly ? Number(inq.feeMonthly) : 0
        };
        const { error } = await supabase.from('inquiry_records').upsert(payload);
        if (!error) await fetchData();
        return { error };
    };

    const deleteInquiry = async (id) => {
        const { error } = await supabase.from('inquiry_records').delete().eq('id', id).eq('school_id', currentSchoolId);
        if (!error) await fetchData();
        return { error };
    };

    // ─── Student Diary ────────────────────────────────────────────────────────

    /**
     * Fetch diary entries for a specific class and date range.
     * @param {object} filters - { className, dateFrom, dateTo, studentId }
     */
    const fetchDiaryEntries = async (filters = {}) => {
        const { className, dateFrom, dateTo, studentId } = filters;
        let query = supabase
            .from('student_diaries')
            .select('*')
            .eq('school_id', currentSchoolId)
            .order('diary_date', { ascending: false })
            .order('created_at', { ascending: false });

        if (className) query = query.eq('class', className);
        if (dateFrom)  query = query.gte('diary_date', dateFrom);
        if (dateTo)    query = query.lte('diary_date', dateTo);
        // Fetch entries that are either class-wide OR for this specific student
        if (studentId) {
            query = query.or(`student_id.is.null,student_id.eq.${studentId}`);
        }

        const { data, error } = await query;
        if (!error) setDiaryEntries(data || []);
        return { data, error };
    };

    /**
     * Save (create or update) a diary entry.
     * @param {object} entry - Diary entry payload.
     */
    const saveDiaryEntry = async (entry) => {
        const payload = {
            school_id:  currentSchoolId,
            class:      entry.class,
            section:    entry.section    || 'All',
            student_id: entry.student_id || null,
            type:       entry.type       || 'Homework',
            subject:    entry.subject    || 'General',
            title:      entry.title      || '',
            content:    entry.content,
            is_urgent:  entry.is_urgent  || false,
            attachments: entry.attachments || [],
            diary_date: entry.diary_date || new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString()
        };

        let result;
        if (entry.id) {
            // Update existing
            result = await supabase
                .from('student_diaries')
                .update(payload)
                .eq('id', entry.id)
                .eq('school_id', currentSchoolId);
        } else {
            // Insert new
            result = await supabase
                .from('student_diaries')
                .insert([payload])
                .select()
                .single();
        }

        if (!result.error) {
            // Refresh local diary state
            await fetchDiaryEntries({ className: payload.class });
        }
        return { data: result.data, error: result.error };
    };

    /**
     * Delete a diary entry.
     * @param {string} entryId - UUID of the entry to delete.
     */
    const deleteDiaryEntry = async (entryId) => {
        const { error } = await supabase
            .from('student_diaries')
            .delete()
            .eq('id', entryId)
            .eq('school_id', currentSchoolId);

        if (!error) {
            setDiaryEntries(prev => prev.filter(e => e.id !== entryId));
        }
        return { error };
    };

    /**
     * Mark a diary entry as acknowledged by the parent/student.
     * @param {string} entryId   - UUID of the diary entry.
     * @param {string} studentId - The student acknowledging the entry.
     */
    const acknowledgeDiaryEntry = async (entryId, studentId) => {
        // Find current acknowledgments
        const entry = diaryEntries.find(e => e.id === entryId);
        if (!entry) return { error: { message: 'Entry not found' } };

        const existing = Array.isArray(entry.acknowledgments) ? entry.acknowledgments : [];
        if (existing.includes(studentId)) return { error: null }; // Already acknowledged

        const updated = [...existing, studentId];
        const { error } = await supabase
            .from('student_diaries')
            .update({ acknowledgments: updated })
            .eq('id', entryId);

        if (!error) {
            setDiaryEntries(prev =>
                prev.map(e => e.id === entryId ? { ...e, acknowledgments: updated } : e)
            );
        }
        return { error };
    };

    // ─── Payroll Records CRUD ─────────────────────────────────────────────────
    const fetchPayrollRecords = async (month) => {
        if (!currentSchoolId) return;
        let query = supabase
            .from('payroll_records')
            .select('*')
            .eq('school_id', currentSchoolId)
            .order('created_at', { ascending: false });
        if (month) query = query.eq('month', month);
        const { data, error } = await query;
        if (!error) setPayrollRecords(data || []);
        return { data, error };
    };

    const savePayrollRecord = async (record) => {
        const payload = { ...record, school_id: currentSchoolId };
        const { data, error } = await supabase
            .from('payroll_records')
            .upsert(payload, { onConflict: 'school_id,faculty_id,month' })
            .select()
            .single();
        if (!error) {
            setPayrollRecords(prev => {
                const idx = prev.findIndex(r => r.faculty_id === record.faculty_id && r.month === record.month);
                if (idx >= 0) { const updated = [...prev]; updated[idx] = data; return updated; }
                return [data, ...prev];
            });
        }
        return { data, error };
    };

    const deletePayrollRecord = async (id) => {
        const { error } = await supabase
            .from('payroll_records')
            .delete()
            .eq('id', id)
            .eq('school_id', currentSchoolId);
        if (!error) setPayrollRecords(prev => prev.filter(r => r.id !== id));
        return { error };
    };

    // ─── Expense Records CRUD ─────────────────────────────────────────────────
    const fetchExpenseRecords = async (filters = {}) => {
        if (!currentSchoolId) return;
        let query = supabase
            .from('expense_records')
            .select('*')
            .eq('school_id', currentSchoolId)
            .order('expense_date', { ascending: false });
        if (filters.category) query = query.eq('category', filters.category);
        if (filters.dateFrom) query = query.gte('expense_date', filters.dateFrom);
        if (filters.dateTo)   query = query.lte('expense_date', filters.dateTo);
        const { data, error } = await query;
        if (!error) setExpenseRecords(data || []);
        return { data, error };
    };

    const saveExpenseRecord = async (record) => {
        const isNew = !record.id;
        const payload = { ...record, school_id: currentSchoolId };
        let data, error;
        if (isNew) {
            ({ data, error } = await supabase.from('expense_records').insert(payload).select().single());
            if (!error) setExpenseRecords(prev => [data, ...prev]);
        } else {
            ({ data, error } = await supabase.from('expense_records').update(payload).eq('id', record.id).eq('school_id', currentSchoolId).select().single());
            if (!error) setExpenseRecords(prev => prev.map(r => r.id === record.id ? data : r));
        }
        return { data, error };
    };

    const deleteExpenseRecord = async (id) => {
        const { error } = await supabase
            .from('expense_records')
            .delete()
            .eq('id', id)
            .eq('school_id', currentSchoolId);
        if (!error) setExpenseRecords(prev => prev.filter(r => r.id !== id));
        return { error };
    };

    const changeAdminPassword = async (newUsername, newPassword) => {
        const { error } = await supabase
            .from('admins')
            .update({ username: newUsername, password: newPassword })
            .eq('school_id', currentSchoolId)
            .eq('role', 'admin');
        if (!error) setAdminCredentials({ username: newUsername, password: newPassword });
        return { error };
    };

    // ─── Convenience: currency symbol shorthand ───────────────────────────────
    const currencySymbol = schoolSettings.currency_symbol || 'RS';

    return (
        <SchoolDataContext.Provider value={{
            // ── Core data ───────────────────────────────────────────────────
            schoolData:       data,
            CLASSES:          classes,
            SUBJECTS:         subjects,
            TERMS:            terms,
            SECTIONS:         sections,
            WEIGHTS:          weights,
            CLASS_SERIAL_STARTS: classSerialStarts,
            CLASS_FEE_DEFAULTS:  classFeeDefaults,
            EXPENSES:         expenses,
            INQUIRIES:        inquiries,
            adminCredentials,

            // ── Multi-tenant context ─────────────────────────────────────────
            currentSchoolId,
            schoolSettings,
            currencySymbol,   // ← use this instead of hardcoded "RS"

            // ── State ────────────────────────────────────────────────────────
            loading,
            fetchData,
            fetchPublicData,   // ← call this from Faculty/Blog/Facilities/Home pages


            // ── Mutation helpers ─────────────────────────────────────────────
            updateSchoolInfo,
            updateSchoolSettings,
            updateAbout,
            updateContact,
            completeOnboarding,
            setFaculty,
            setFacilities,
            setStudents,
            setAnnouncements,
            setBlogs,
            updateClasses,
            updateSubjects,
            updateTerms,
            updateSections,
            updateWeights,
            updateClassSerialStarts,
            updateClassFeeDefaults,
            saveFeeSettings,
            feeSettings,
            saveAdvanceBalance,
            updateExpenses,
            saveInquiry, deleteInquiry,
            saveAttendanceRecords,
            deleteAttendanceRecords,
            saveFeeRecords,
            deleteFeeRecords,
            saveExamResults,
            changeAdminPassword,
            // ── Student Diary ─────────────────────────────────────────────────
            diaryEntries,
            fetchDiaryEntries,
            saveDiaryEntry,
            deleteDiaryEntry,
            acknowledgeDiaryEntry,
            // ── Financial Suite ──────────────────────────────────────────────
            payrollRecords,
            fetchPayrollRecords,
            savePayrollRecord,
            deletePayrollRecord,
            expenseRecords,
            fetchExpenseRecords,
            saveExpenseRecord,
            deleteExpenseRecord,
        }}>
            {children}
        </SchoolDataContext.Provider>
    );
};
