-- ============================================================
-- MASTER SETUP SCRIPT for EduCore / ACS SaaS Platform
-- Run this ONCE in a clean Supabase project (SQL Editor)
-- This script combines all schema, migrations, and SaaS config.
-- ============================================================

-- 1. CLEAN START: Drop existing tables if they exist
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS faculty CASCADE;
DROP TABLE IF EXISTS facilities CASCADE;
DROP TABLE IF EXISTS testimonials CASCADE;
DROP TABLE IF EXISTS school_info CASCADE;
DROP TABLE IF EXISTS metadata CASCADE;
DROP TABLE IF EXISTS blogs CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS schools CASCADE;
DROP TABLE IF EXISTS super_admins CASCADE;
DROP TABLE IF EXISTS saas_info CASCADE;
DROP TABLE IF EXISTS school_registration_requests CASCADE;

-- 2. CORE TABLES
CREATE TABLE school_info (
    id          TEXT PRIMARY KEY DEFAULT 'info',
    name        TEXT,
    tagline     TEXT,
    description TEXT,
    contact     JSONB,
    about       JSONB,
    statistics  JSONB,
    school_id   TEXT NOT NULL DEFAULT 'acs-001'
);

CREATE TABLE faculty (
    id         SERIAL PRIMARY KEY,
    name       TEXT    NOT NULL,
    role       TEXT,
    department TEXT,
    image      TEXT,
    bio        TEXT,
    school_id  TEXT NOT NULL DEFAULT 'acs-001'
);

CREATE TABLE facilities (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    image       TEXT,
    category    TEXT,
    school_id   TEXT NOT NULL DEFAULT 'acs-001'
);

CREATE TABLE testimonials (
    id     SERIAL PRIMARY KEY,
    name   TEXT    NOT NULL,
    role   TEXT,
    text   TEXT,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    school_id TEXT NOT NULL DEFAULT 'acs-001'
);

CREATE TABLE students (
    id               TEXT PRIMARY KEY,
    serial_number    TEXT,
    password         TEXT NOT NULL,
    name             TEXT NOT NULL,
    grade            TEXT,
    image            TEXT,
    fee_history      JSONB DEFAULT '[]',
    results          JSONB DEFAULT '[]',
    previous_results JSONB DEFAULT '[]',
    attendance       JSONB DEFAULT '{}',
    admissions       JSONB DEFAULT '[]',
    school_id        TEXT NOT NULL DEFAULT 'acs-001'
);

CREATE TABLE metadata (
    key       TEXT NOT NULL,
    value     JSONB,
    school_id TEXT NOT NULL DEFAULT 'acs-001',
    PRIMARY KEY (school_id, key)
);

CREATE TABLE announcements (
    id         SERIAL PRIMARY KEY,
    title      TEXT    NOT NULL,
    content    TEXT,
    date       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    type       TEXT,
    active     BOOLEAN DEFAULT true,
    school_id  TEXT NOT NULL DEFAULT 'acs-001'
);

CREATE TABLE blogs (
    id         SERIAL PRIMARY KEY,
    title      TEXT NOT NULL,
    excerpt    TEXT,
    content    TEXT,
    author     TEXT        DEFAULT 'Admin',
    date       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    category   TEXT        DEFAULT 'Events',
    read_time  TEXT,
    image      TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    school_id  TEXT NOT NULL DEFAULT 'acs-001'
);

CREATE TABLE admins (
    id        SERIAL PRIMARY KEY,
    username  TEXT NOT NULL,
    password  TEXT NOT NULL,
    role      TEXT NOT NULL DEFAULT 'admin',
    school_id TEXT NOT NULL DEFAULT 'acs-001',
    UNIQUE (username, school_id)
);

-- 3. SAAS INFRASTRUCTURE
CREATE TABLE schools (
    school_id        TEXT PRIMARY KEY,
    school_name      TEXT NOT NULL,
    country          TEXT NOT NULL DEFAULT 'Pakistan',
    currency_symbol  TEXT NOT NULL DEFAULT 'RS',
    logo_url         TEXT,
    receipt_header   TEXT,
    contact_email    TEXT,
    contact_phone    TEXT,
    address          TEXT,
    is_active        BOOLEAN NOT NULL DEFAULT true,
    plan             TEXT NOT NULL DEFAULT 'basic',
    whatsapp_api_key TEXT,
    whatsapp_phone_id TEXT,
    auto_attendance_alert BOOLEAN DEFAULT FALSE,
    auto_fee_alert BOOLEAN DEFAULT FALSE,
    auto_admission_alert BOOLEAN DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE super_admins (
    id         SERIAL PRIMARY KEY,
    username   TEXT UNIQUE NOT NULL,
    password   TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE saas_info (
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

CREATE TABLE school_registration_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    whatsapp_number TEXT,
    requested_plan TEXT DEFAULT 'basic',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INITIAL DATA
INSERT INTO schools (school_id, school_name, country, currency_symbol)
VALUES ('acs-001', 'ACS School & College', 'Pakistan', 'RS')
ON CONFLICT (school_id) DO NOTHING;

INSERT INTO super_admins (username, password)
VALUES ('superadmin', 'SuperSecret@2025')
ON CONFLICT (username) DO NOTHING;

INSERT INTO admins (username, password, role, school_id)
VALUES ('admin', 'admin123', 'admin', 'acs-001')
ON CONFLICT DO NOTHING;

INSERT INTO saas_info (id, business_name)
VALUES ('global', 'ACS SaaS Platform')
ON CONFLICT (id) DO NOTHING;

-- 5. INDEXES for Performance
CREATE INDEX idx_students_grade        ON students(grade);
CREATE INDEX idx_students_serial       ON students(serial_number);
CREATE INDEX idx_students_name         ON students(name);
CREATE INDEX idx_students_school       ON students(school_id);
CREATE INDEX idx_faculty_school        ON faculty(school_id);
CREATE INDEX idx_announcements_school  ON announcements(school_id);
CREATE INDEX idx_blogs_school          ON blogs(school_id);
CREATE INDEX idx_admins_school         ON admins(school_id);
CREATE INDEX idx_announcements_date    ON announcements(date DESC);
CREATE INDEX idx_blogs_date            ON blogs(date DESC);
