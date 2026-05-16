-- ============================================================
-- ATTENDANCE MIGRATION SCRIPT
-- Safely migrates JSONB attendance data into a relational table.
-- ============================================================

-- 1. Create the new attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
    id SERIAL PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    school_id TEXT NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (student_id, date)
);

-- 2. Create index for fast lookups by school and date
CREATE INDEX IF NOT EXISTS idx_attendance_school_date ON attendance_records(school_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance_records(student_id);

-- 3. Safely extract and migrate existing JSONB data
INSERT INTO attendance_records (student_id, school_id, date, status)
SELECT 
    s.id as student_id,
    s.school_id,
    (record->>'date')::DATE as date,
    record->>'status' as status
FROM 
    students s,
    jsonb_array_elements(
        CASE 
            WHEN jsonb_typeof(s.attendance->'records') = 'array' 
            THEN s.attendance->'records' 
            ELSE '[]'::jsonb 
        END
    ) as record
ON CONFLICT (student_id, date) DO UPDATE 
SET status = EXCLUDED.status;

-- Note: We are deliberately NOT deleting the 'attendance' column from the students table yet.
-- This ensures if anything goes wrong, your original JSONB data is still 100% intact.
-- We can drop the column later once we verify the new system works perfectly.
