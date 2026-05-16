-- 1. Create the exam_results table
CREATE TABLE IF NOT EXISTS exam_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id TEXT NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    term TEXT NOT NULL,
    subject TEXT NOT NULL,
    marks_obtained NUMERIC, -- Can be NULL for no data entered
    is_absent BOOLEAN DEFAULT false,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(student_id, term, subject)
);

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_exam_results_school ON exam_results(school_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_student ON exam_results(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_term ON exam_results(term);

-- 3. Migration Function: Move JSONB results to relational table
DO $$
DECLARE
    s RECORD;
    r JSONB;
BEGIN
    FOR s IN SELECT id, school_id, results FROM students WHERE results IS NOT NULL AND jsonb_array_length(results) > 0 LOOP
        FOR r IN SELECT jsonb_array_elements(s.results) LOOP
            -- Handle possible 'obtained' as string "A" for absent
            INSERT INTO exam_results (
                school_id,
                student_id,
                term,
                subject,
                marks_obtained,
                is_absent,
                remarks
            ) VALUES (
                s.school_id,
                s.id,
                r->>'term',
                r->>'subject',
                (CASE WHEN r->>'obtained' = 'A' THEN 0 ELSE (NULLIF(r->>'obtained', '')::NUMERIC) END),
                (CASE WHEN r->>'obtained' = 'A' THEN true ELSE false END),
                r->>'remarks'
            ) ON CONFLICT (student_id, term, subject) DO UPDATE SET
                marks_obtained = EXCLUDED.marks_obtained,
                is_absent = EXCLUDED.is_absent,
                remarks = EXCLUDED.remarks;
        END LOOP;
    END LOOP;
END $$;
