-- Copy and paste this into your Supabase SQL Editor to enable the new HR & Payroll features!

-- 1. Add new columns to the existing faculty table
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS joining_date DATE;
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS base_salary NUMERIC DEFAULT 0;
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS payroll_history JSONB DEFAULT '[]'::jsonb;

-- 2. Ensure your existing faculty members can safely be updated
UPDATE faculty SET payroll_history = '[]'::jsonb WHERE payroll_history IS NULL;

-- 3. You are ready to run the new Payroll dashboard!
