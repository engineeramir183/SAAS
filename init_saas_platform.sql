-- ============================================================
-- SaaS Platform Initialization & Fix Script
-- Run this in Supabase Dashboard > SQL Editor
-- This ensures the saas_info table exists and has a default row.
-- ============================================================

-- 1. Create saas_info table if it doesn't exist
CREATE TABLE IF NOT EXISTS saas_info (
    id               TEXT PRIMARY KEY DEFAULT 'global',
    business_name     TEXT DEFAULT 'My SaaS Platform',
    support_email    TEXT,
    whatsapp_number  TEXT,
    hero_title       TEXT,
    hero_subtitle    TEXT,
    whatsapp_api_key TEXT,
    whatsapp_phone_id TEXT,
    email_service_key TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ensure the 'global' row exists (Crucial for Super Admin Portal Save)
INSERT INTO saas_info (id, business_name)
VALUES ('global', 'ACS SaaS Platform')
ON CONFLICT (id) DO NOTHING;

-- 3. Verify columns for schools table (Ensure all recent additions exist)
ALTER TABLE schools ADD COLUMN IF NOT EXISTS whatsapp_api_key TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS whatsapp_phone_id TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS auto_attendance_alert BOOLEAN DEFAULT FALSE;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS auto_fee_alert BOOLEAN DEFAULT FALSE;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS auto_admission_alert BOOLEAN DEFAULT FALSE;

-- 4. Verify school_registration_requests table
CREATE TABLE IF NOT EXISTS school_registration_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    whatsapp_number TEXT,
    requested_plan TEXT DEFAULT 'basic',
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Fix Admin Table (Support same username for different schools)
DO $$ 
BEGIN
    -- Remove the old global unique constraint on username if it exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admins_username_key') THEN
        ALTER TABLE admins DROP CONSTRAINT admins_username_key;
    END IF;
    
    -- Ensure school_id exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admins' AND column_name = 'school_id') THEN
        ALTER TABLE admins ADD COLUMN school_id TEXT NOT NULL DEFAULT 'acs-001';
    END IF;

    -- Add the new composite unique constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admins_username_school_id_key') THEN
        ALTER TABLE admins ADD CONSTRAINT admins_username_school_id_key UNIQUE (username, school_id);
    END IF;
END $$;

-- 6. Verify RLS for saas_info (Allow Read for all, but only Super Admins can update)
-- For simplicity in this dev phase, we might keep it open if RLS is not fully used yet.
-- But standard practice: 
-- ALTER TABLE saas_info ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read of SaaS info" ON saas_info FOR SELECT USING (true);
