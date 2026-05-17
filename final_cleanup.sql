-- ============================================================
-- FINAL CLEANUP MIGRATION
-- Run this ONCE in Supabase SQL Editor.
-- PREREQUISITES: Only run this AFTER confirming that:
--   1. attendance_records table has all attendance data
--   2. fee_records table has all fee data
--   3. exam_results table has all result data
--   4. Backup has been taken (backups/ folder)
-- ============================================================

-- Step 1: Drop legacy JSONB columns from students table
-- These were the old single-column storage approach.
-- All data is now in: attendance_records, fee_records, exam_results.

ALTER TABLE students DROP COLUMN IF EXISTS attendance;
ALTER TABLE students DROP COLUMN IF EXISTS fee_history;
ALTER TABLE students DROP COLUMN IF EXISTS results;
ALTER TABLE students DROP COLUMN IF EXISTS previous_results;

-- Step 2: Verify the students table is clean
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;
