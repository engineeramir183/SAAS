-- ============================================================
-- MULTI-TENANT AUDIT LOGGING SYSTEM
-- Run this in Supabase Dashboard → SQL Editor
-- This table records administrative events and user audits.
-- ============================================================

-- 1. Create the activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id                BIGSERIAL PRIMARY KEY,
    school_id         TEXT NOT NULL,                      -- Isolated per school
    operator_username TEXT NOT NULL,                      -- e.g. "admin", "superadmin", or Student Name
    operator_role     TEXT NOT NULL,                      -- 'admin', 'superadmin', 'student', 'developer'
    action            TEXT NOT NULL,                      -- e.g. 'Login', 'Update Attendance', 'Update Marks', 'Fee Payment'
    target_name       TEXT,                               -- e.g. "9th Grade Attendance", "Ali Khan (ID: 102)"
    details           JSONB NOT NULL DEFAULT '{}'::jsonb, -- Detail metadata (before/after changes)
    ip_address        TEXT,                               -- Optional client IP record
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()  -- Timestamp of execution
);

-- 2. Bind school_id foreign key constraint to ensure relational integrity
ALTER TABLE activity_logs 
    ADD CONSTRAINT fk_activity_logs_schools 
    FOREIGN KEY (school_id) 
    REFERENCES schools(school_id) 
    ON DELETE CASCADE;

-- 3. Create high-performance index maps
-- Speeds up search filtering of audits inside a specific school's admin dashboard
CREATE INDEX IF NOT EXISTS idx_activity_logs_school_id ON activity_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action     ON activity_logs(action);

-- 4. Enable Row Level Security (RLS) on logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated superadmins can see ALL logs
CREATE POLICY "Super Admins can read all logs"
    ON activity_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM super_admins 
            WHERE super_admins.username = auth.uid()::text
        )
    );

-- Policy: School admins can only see their own school's activity logs
CREATE POLICY "School Admins can read their own logs"
    ON activity_logs
    FOR SELECT
    TO authenticated
    USING (
        school_id = (
            SELECT school_id FROM admins 
            WHERE admins.username = auth.uid()::text 
            LIMIT 1
        )
    );

-- Policy: Allow inserts from authenticated users or anonymous client actions
CREATE POLICY "Allow any logged operations"
    ON activity_logs
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- 5. Verification
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'activity_logs'
ORDER BY ordinal_position;
