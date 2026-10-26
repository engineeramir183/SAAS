import { createClient } from '@supabase/supabase-js';
import { schoolData, CLASSES } from '../data/schoolData.js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const seedSupabase = async () => {
    try {
        console.log("🚀 Starting Supabase data migration...");

        // 0. Migrate Default School
        const { error: schoolErr } = await supabase
            .from('schools')
            .upsert({
                school_id: 'acs-001',
                school_name: schoolData.name || 'ACS Higher Secondary School',
                country: 'Pakistan',
                currency_symbol: 'RS',
                is_active: true,
                plan: 'pro',
                is_onboarded: true
            });
        if (schoolErr) throw schoolErr;
        console.log("✅ Default school (acs-001) seeded");

        // 1. Migrate School Info
        const { students, faculty, facilities, testimonials, ...info } = schoolData;
        const { error: infoErr } = await supabase
            .from('school_info')
            .upsert({ id: 'info', ...info });
        if (infoErr) throw infoErr;
        console.log("✅ School info migrated");

        // 2. Migrate Faculty
        const facultyWithSchool = faculty.map(f => ({ ...f, school_id: 'acs-001' }));
        const { error: facultyErr } = await supabase
            .from('faculty')
            .upsert(facultyWithSchool);
        if (facultyErr) throw facultyErr;
        console.log("✅ Faculty migrated");

        // 3. Migrate Facilities
        const facilitiesWithSchool = facilities.map(f => ({ ...f, school_id: 'acs-001' }));
        const { error: facilitiesErr } = await supabase
            .from('facilities')
            .upsert(facilitiesWithSchool);
        if (facilitiesErr) throw facilitiesErr;
        console.log("✅ Facilities migrated");

        // 4. Migrate Testimonials
        const testimonialsWithSchool = testimonials.map(t => ({ ...t, school_id: 'acs-001' }));
        const { error: testimonialsErr } = await supabase
            .from('testimonials')
            .upsert(testimonialsWithSchool);
        if (testimonialsErr) throw testimonialsErr;
        console.log("✅ Testimonials migrated");

        // 5. Migrate Classes Metadata
        const { error: metaErr } = await supabase
            .from('metadata')
            .upsert({ school_id: 'acs-001', key: 'CLASSES', value: CLASSES });
        if (metaErr) throw metaErr;
        console.log("✅ Classes metadata migrated");

        // 6. Migrate Students
        const mappedStudents = students.map(s => ({
            id: s.id,
            password: s.password,
            name: s.name,
            grade: s.grade,
            image: s.image || '',
            admissions: s.admissions || [],
            school_id: 'acs-001'
        }));

        const { error: studentsErr } = await supabase
            .from('students')
            .upsert(mappedStudents);
        if (studentsErr) throw studentsErr;
        console.log(`✅ ${students.length} students migrated`);

        // 7. Migrate Relational Student Data (Attendance, Fees, Results)
        console.log("⏳ Migrating relational student records...");
        const attendanceRecords = [];
        const feeRecords = [];
        const examResults = [];

        students.forEach(s => {
            // Fee history
            feeRecords.push({
                school_id: 'acs-001',
                student_id: s.id,
                month: 'June 2026',
                tuition_fee: 1500,
                paid_amount: s.feeStatus === 'paid' ? 1500 : 0,
                status: s.feeStatus === 'paid' ? 'paid' : 'unpaid'
            });
            feeRecords.push({
                school_id: 'acs-001',
                student_id: s.id,
                month: 'May 2026',
                tuition_fee: 1500,
                paid_amount: 1500,
                status: 'paid'
            });

            // Results
            if (s.results) {
                s.results.forEach(r => {
                    examResults.push({
                        school_id: 'acs-001',
                        student_id: s.id,
                        term: 'First Term 2026',
                        subject: r.subject,
                        marks_obtained: r.percentage,
                        is_absent: false
                    });
                });
            }
            if (s.previousResults) {
                s.previousResults.forEach(pr => {
                    pr.results.forEach(r => {
                        examResults.push({
                            school_id: 'acs-001',
                            student_id: s.id,
                            term: pr.term,
                            subject: r.subject,
                            marks_obtained: r.percentage,
                            is_absent: false
                        });
                    });
                });
            }

            // Attendance
            if (s.attendance) {
                const total = s.attendance.total || 0;
                const present = s.attendance.present || 0;
                let d = new Date();
                let count = 0;
                for (let i = 0; i < total; i++) {
                    d.setDate(d.getDate() - 1);
                    if (d.getDay() === 0) {
                        i--;
                        continue;
                    }
                    const dateStr = d.toISOString().split('T')[0];
                    const status = count < present ? 'present' : 'absent';
                    attendanceRecords.push({
                        school_id: 'acs-001',
                        student_id: s.id,
                        date: dateStr,
                        status: status
                    });
                    count++;
                }
            }
        });

        // Insert relational tables
        if (feeRecords.length > 0) {
            const { error: feeErr } = await supabase.from('fee_records').upsert(feeRecords);
            if (feeErr) throw feeErr;
            console.log(`   ✅ ${feeRecords.length} fee records seeded`);
        }

        if (examResults.length > 0) {
            const { error: resErr } = await supabase.from('exam_results').upsert(examResults);
            if (resErr) throw resErr;
            console.log(`   ✅ ${examResults.length} exam results seeded`);
        }

        if (attendanceRecords.length > 0) {
            // Batch attendance insertions to avoid potential payload size limits
            const chunkSize = 150;
            for (let i = 0; i < attendanceRecords.length; i += chunkSize) {
                const chunk = attendanceRecords.slice(i, i + chunkSize);
                const { error: attErr } = await supabase.from('attendance_records').upsert(chunk);
                if (attErr) throw attErr;
            }
            console.log(`   ✅ ${attendanceRecords.length} attendance records seeded`);
        }

        console.log("🎉 Migration completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        process.exit(1);
    }
};

seedSupabase();
