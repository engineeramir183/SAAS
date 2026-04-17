-- ============================================================
-- Migration: Create school_registration_requests table
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Drop existing table if you want a clean slate (comment out if already run)
-- DROP TABLE IF EXISTS school_registration_requests;

CREATE TABLE IF NOT EXISTS school_registration_requests (
    id                   BIGSERIAL PRIMARY KEY,
    school_name          TEXT NOT NULL,
    requested_school_id  TEXT NOT NULL,
    address              TEXT,
    country              TEXT DEFAULT 'Pakistan',
    contact_phone        TEXT,
    contact_email        TEXT,
    admin_username       TEXT NOT NULL,
    admin_password       TEXT NOT NULL,
    status               TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'approved', 'rejected'
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optional: prevent duplicate requested_school_id for pending requests
CREATE UNIQUE INDEX IF NOT EXISTS idx_reg_req_school_id_pending
    ON school_registration_requests(requested_school_id)
    WHERE status = 'pending';

-- Allow all inserts from anonymous users (the landing page form)
-- Row Level Security: enable but allow inserts
ALTER TABLE school_registration_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can INSERT (submit a registration request)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename  = 'school_registration_requests'
          AND policyname = 'Allow public registration submissions'
    ) THEN
        CREATE POLICY "Allow public registration submissions"
            ON school_registration_requests
            FOR INSERT
            TO anon, authenticated
            WITH CHECK (true);
    END IF;
END $$;

-- Policy: Only authenticated (superadmin) can SELECT and UPDATE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename  = 'school_registration_requests'
          AND policyname = 'Allow authenticated read'
    ) THEN
        CREATE POLICY "Allow authenticated read"
            ON school_registration_requests
            FOR SELECT
            TO authenticated
            USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename  = 'school_registration_requests'
          AND policyname = 'Allow authenticated update'
    ) THEN
        CREATE POLICY "Allow authenticated update"
            ON school_registration_requests
            FOR UPDATE
            TO authenticated
            USING (true);
    END IF;
END $$;

-- Also ensure contact_phone column exists on schools table
-- (needed for the suspension modal and registration flow)
ALTER TABLE schools ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- ============================================================
-- Verify
-- ============================================================
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'school_registration_requests'
ORDER BY ordinal_position;
