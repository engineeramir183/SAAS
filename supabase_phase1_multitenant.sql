-- ============================================================
-- PHASE 1: Multi-Tenant Migration Script
-- ACS SaaS Platform — Safe to run on LIVE database
-- Run this ONCE in Supabase Dashboard → SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- STEP 1A: Create the master `schools` table
-- This is the registry of every school on the platform.
-- Only the Super Admin can INSERT into this table.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS schools (
    school_id        TEXT PRIMARY KEY,           -- e.g. 'acs-001', 'xyz-002'
    school_name      TEXT NOT NULL,
    country          TEXT NOT NULL DEFAULT 'Pakistan',
    currency_symbol  TEXT NOT NULL DEFAULT 'RS',  -- 'RS', '$', '€', '£', etc.
    logo_url         TEXT,                         -- URL to school logo in Storage
    receipt_header   TEXT,                         -- Custom text for fee receipts
    contact_email    TEXT,
    contact_phone    TEXT,
    address          TEXT,
    is_active        BOOLEAN NOT NULL DEFAULT true,
    plan             TEXT NOT NULL DEFAULT 'basic', -- 'basic', 'pro', 'enterprise'
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- STEP 1B: Create the `super_admins` table
-- Super Admins manage the SaaS platform itself.
-- They are completely separate from school-level admins.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS super_admins (
    id         SERIAL PRIMARY KEY,
    username   TEXT UNIQUE NOT NULL,
    password   TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ⚠️  IMPORTANT: Change this password after first login!
INSERT INTO super_admins (username, password)
VALUES ('superadmin', 'SuperSecret@2025')
ON CONFLICT (username) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- STEP 1C: Add `school_id` to every school-scoped table
-- All existing data will get school_id = 'acs-001'
-- ─────────────────────────────────────────────────────────────

ALTER TABLE students      ADD COLUMN IF NOT EXISTS school_id TEXT NOT NULL DEFAULT 'acs-001';
ALTER TABLE faculty       ADD COLUMN IF NOT EXISTS school_id TEXT NOT NULL DEFAULT 'acs-001';
ALTER TABLE facilities    ADD COLUMN IF NOT EXISTS school_id TEXT NOT NULL DEFAULT 'acs-001';
ALTER TABLE testimonials  ADD COLUMN IF NOT EXISTS school_id TEXT NOT NULL DEFAULT 'acs-001';
ALTER TABLE school_info   ADD COLUMN IF NOT EXISTS school_id TEXT NOT NULL DEFAULT 'acs-001';
ALTER TABLE metadata      ADD COLUMN IF NOT EXISTS school_id TEXT NOT NULL DEFAULT 'acs-001';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS school_id TEXT NOT NULL DEFAULT 'acs-001';
ALTER TABLE blogs         ADD COLUMN IF NOT EXISTS school_id TEXT NOT NULL DEFAULT 'acs-001';
ALTER TABLE admins        ADD COLUMN IF NOT EXISTS school_id TEXT NOT NULL DEFAULT 'acs-001';

-- Backfill any NULLs (belt-and-suspenders)
UPDATE students      SET school_id = 'acs-001' WHERE school_id IS NULL OR school_id = '';
UPDATE faculty       SET school_id = 'acs-001' WHERE school_id IS NULL OR school_id = '';
UPDATE facilities    SET school_id = 'acs-001' WHERE school_id IS NULL OR school_id = '';
UPDATE testimonials  SET school_id = 'acs-001' WHERE school_id IS NULL OR school_id = '';
UPDATE school_info   SET school_id = 'acs-001' WHERE school_id IS NULL OR school_id = '';
UPDATE metadata      SET school_id = 'acs-001' WHERE school_id IS NULL OR school_id = '';
UPDATE announcements SET school_id = 'acs-001' WHERE school_id IS NULL OR school_id = '';
UPDATE blogs         SET school_id = 'acs-001' WHERE school_id IS NULL OR school_id = '';
UPDATE admins        SET school_id = 'acs-001' WHERE school_id IS NULL OR school_id = '';

-- ─────────────────────────────────────────────────────────────
-- STEP 1D: Re-key the `metadata` table
-- Old PK was just `key` TEXT.
-- New composite PK: (school_id, key) so each school has
-- its own independent CLASSES, SUBJECTS, TERMS, etc.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE metadata DROP CONSTRAINT IF EXISTS metadata_pkey;
ALTER TABLE metadata ADD PRIMARY KEY (school_id, key);

-- ─────────────────────────────────────────────────────────────
-- STEP 1E: Re-key the `school_info` table
-- Old PK was `id = 'info'` (single row). Each school now
-- needs its own row — use school_id as the PK.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE school_info DROP CONSTRAINT IF EXISTS school_info_pkey;
ALTER TABLE school_info ADD CONSTRAINT school_info_pkey PRIMARY KEY (school_id);

-- ─────────────────────────────────────────────────────────────
-- STEP 1F: Register your existing school in the `schools` table
-- ─────────────────────────────────────────────────────────────
INSERT INTO schools (school_id, school_name, country, currency_symbol)
VALUES ('acs-001', 'ACS School & College', 'Pakistan', 'RS')
ON CONFLICT (school_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- STEP 1G: Add performance indexes on school_id columns
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_students_school       ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_faculty_school        ON faculty(school_id);
CREATE INDEX IF NOT EXISTS idx_facilities_school     ON facilities(school_id);
CREATE INDEX IF NOT EXISTS idx_announcements_school  ON announcements(school_id);
CREATE INDEX IF NOT EXISTS idx_blogs_school          ON blogs(school_id);
CREATE INDEX IF NOT EXISTS idx_admins_school         ON admins(school_id);

-- ─────────────────────────────────────────────────────────────
-- STEP 1H: Verify migration — run this to confirm everything
-- ─────────────────────────────────────────────────────────────
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE column_name = 'school_id'
  AND table_name IN (
    'students', 'faculty', 'facilities', 'metadata', 'admins',
    'announcements', 'blogs', 'school_info', 'testimonials'
  )
ORDER BY table_name;
