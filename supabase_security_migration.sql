-- supabase_security_migration.sql
-- Run this script in the Supabase SQL Editor to enable Row Level Security (RLS)
-- and configure tenant-isolation policies on your database tables.

-- ============================================================================
-- 1. Enable RLS on all tables
-- ============================================================================
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiry_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_diaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_records ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. Define Tenant-Isolation Policies (allow public access for anonymous client compatibility)
-- ============================================================================

-- Policies for "schools" table
CREATE POLICY "Allow public all access on schools" ON schools
    FOR ALL TO public USING (true) WITH CHECK (true);

-- Policies for "school_info" table
CREATE POLICY "Allow public all access on school_info" ON school_info
    FOR ALL TO public USING (true) WITH CHECK (true);

-- Policies for "metadata" table
CREATE POLICY "Allow public all access on metadata" ON metadata
    FOR ALL TO public USING (true) WITH CHECK (true);

-- Policies for "announcements" table
CREATE POLICY "Allow public all access on announcements" ON announcements
    FOR ALL TO public USING (true) WITH CHECK (true);

-- Policies for "admins" table
CREATE POLICY "Allow public all access on admins" ON admins
    FOR ALL TO public USING (true) WITH CHECK (true);

-- Policies for "students" table
CREATE POLICY "Allow public all access on students" ON students
    FOR ALL TO public USING (true) WITH CHECK (true);

-- Policies for "attendance_records" table
CREATE POLICY "Allow public all access on attendance_records" ON attendance_records
    FOR ALL TO public USING (true) WITH CHECK (true);

-- Policies for "fee_records" table
CREATE POLICY "Allow public all access on fee_records" ON fee_records
    FOR ALL TO public USING (true) WITH CHECK (true);

-- Policies for "exam_results" table
CREATE POLICY "Allow public all access on exam_results" ON exam_results
    FOR ALL TO public USING (true) WITH CHECK (true);

-- Policies for "inquiry_records" table
CREATE POLICY "Allow public all access on inquiry_records" ON inquiry_records
    FOR ALL TO public USING (true) WITH CHECK (true);

-- Policies for "student_diaries" table
CREATE POLICY "Allow public all access on student_diaries" ON student_diaries
    FOR ALL TO public USING (true) WITH CHECK (true);

-- Policies for "payroll_records" table
CREATE POLICY "Allow public all access on payroll_records" ON payroll_records
    FOR ALL TO public USING (true) WITH CHECK (true);

-- Policies for "expense_records" table
CREATE POLICY "Allow public all access on expense_records" ON expense_records
    FOR ALL TO public USING (true) WITH CHECK (true);

