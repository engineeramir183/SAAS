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
    const [expenses,          setExpenses]          = useState([]);
    const [inquiries,         setInquiries]         = useState([]);
    const [diaryEntries,      setDiaryEntries]      = useState([]);
    const [loading,           setLoading]           = useState(true);
    const [adminCredentials,  setAdminCredentials]  = useState({ username: '', password: '' });

    // ─── Core fetch — every query is scoped to currentSchoolId ───────────────
    // ─── Core fetch — loads only business-critical data on every app start ──────
    // Faculty, facilities, testimonials, blogs are loaded separately via
    // fetchPublicData() and only when the public-facing pages need them.
    const fetchData = async (sid = currentSchoolId) => {
        try {
            // Only show full loading screen on initial load or tenant switch
            if (sid !== currentSchoolId || !data?.name) {
                setLoading(true);
            }

            // Fire only the 6 critical queries in parallel
            const [
                { data: schoolRow },
                { data: info },
                { data: metaRows },
                { data: announcements },
                { data: studentsRes },
                { data: admins },
                { data: attRecords },
                { data: feeRecords },
                { data: resRecords }
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
                    .select('id, name, grade, image, serial_number, password, fee_history, results, admissions, previous_results')
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
                    
                // Fetch Relational Attendance
                supabase
                    .from('attendance_records')
                    .select('*')
                    .eq('school_id', sid),

                // Fetch Relational Fees
                supabase
                    .from('fee_records')
                    .select('*')
                    .eq('school_id', sid),

                // Fetch Relational Results
                supabase
                    .from('exam_results')
                    .select('*')
                    .eq('school_id', sid)
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
                (resRecords || []).forEach(r => {
                    if (!resByStudent[r.student_id]) resByStudent[r.student_id] = [];
                    resByStudent[r.student_id].push({
                        term: r.term,
                        subject: r.subject,
                        obtained: r.is_absent ? 'A' : r.marks_obtained,
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
                        previous_results: s.previous_results,
                        previousResults: s.previous_results,
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


    // Re-fetch whenever the active school changes
    useEffect(() => {
        setCurrentSchoolId(schoolId);
        fetchData(schoolId);
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
                fee_history:      s.feeHistory       !== undefined ? s.feeHistory     : (s.fee_history || []),
                results:          s.results          || [],
                attendance:       s.attendance       || {},
                previous_results: s.previousResults  !== undefined ? s.previousResults : s.previous_results || [],
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
                feeHistory:      dbRow.fee_history || [],
                previousResults: dbRow.previous_results || [],
                serialNumber:    dbRow.serial_number,
                results:         dbRow.results || [],
                attendance:      dbRow.attendance || {},
                admissions:      dbRow.admissions || []
            }));

            setData(prev => {
                const merged = [...(prev.students || [])];
                incomingNormalised.forEach(ns => {
                    const idx = merged.findIndex(s => s.id === ns.id || (s.id && s.id.startsWith('TEMP-') && s.name === ns.name && s.grade === ns.grade));
                    if (idx > -1) {
                        merged[idx] = { ...merged[idx], ...ns, id: ns.id }; // Update with new ID and DB data
                    }
                    else merged.push(ns);
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

    const updateExpenses = async (newList) => {
        const { error } = await _upsertMeta('EXPENSES', newList);
        if (!error) setExpenses(newList);
        return { error };
    };

    const saveAttendanceRecords = async (records) => {
        // records: [{ student_id, date, status, remarks }]
        const dbRecords = records.map(r => ({ ...r, school_id: currentSchoolId }));
        const { error } = await supabase.from('attendance_records').upsert(dbRecords, { onConflict: 'student_id, date' });
        if (!error) await fetchData();
        return { error };
    };

    const deleteAttendanceRecords = async (studentIds, date) => {
        const { error } = await supabase.from('attendance_records')
            .delete()
            .eq('school_id', currentSchoolId)
            .eq('date', date)
            .in('student_id', studentIds);
        if (!error) await fetchData();
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
        if (!error) await fetchData();
        return { error };
    };

    const deleteFeeRecords = async (studentIds, month) => {
        const { error } = await supabase.from('fee_records')
            .delete()
            .eq('school_id', currentSchoolId)
            .eq('month', month)
            .in('student_id', studentIds);
        if (!error) await fetchData();
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
        if (!error) await fetchData();
        return { error };
    };

    const updateInquiries = async (newList) => {
        const { error } = await _upsertMeta('INQUIRIES', newList);
        if (!error) setInquiries(newList);
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
            updateExpenses,
            updateInquiries,
            saveAttendanceRecords,
            deleteAttendanceRecords,
            saveFeeRecords,
            deleteFeeRecords,
            saveExamResults,
            changeAdminPassword,
            // ── Student Diary ──────────────────────────────────────────────────
            diaryEntries,
            fetchDiaryEntries,
            saveDiaryEntry,
            deleteDiaryEntry,
            acknowledgeDiaryEntry,
        }}>
            {children}
        </SchoolDataContext.Provider>
    );
};
