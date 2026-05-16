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
    is_active  BOOLEAN DEFAULT true,
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
    is_active        BOOLEAN DEFAULT true,
    school_id        TEXT NOT NULL DEFAULT 'acs-001',
    UNIQUE (school_id, serial_number)
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

CREATE TABLE attendance_records (
    id SERIAL PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    school_id TEXT NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (student_id, date)
);

CREATE TABLE fee_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id TEXT NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    month TEXT NOT NULL, -- e.g. "May 2026"
    tuition_fee NUMERIC DEFAULT 0,
    admission_fee NUMERIC DEFAULT 0,
    annual_fee NUMERIC DEFAULT 0,
    exam_fee NUMERIC DEFAULT 0,
    transport_fee NUMERIC DEFAULT 0,
    lab_fee NUMERIC DEFAULT 0,
    late_fine NUMERIC DEFAULT 0,
    discount NUMERIC DEFAULT 0,
    paid_amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'unpaid', -- paid, unpaid, partial
    payment_date DATE,
    payment_method TEXT,
    is_online BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, month)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_school ON attendance_records(school_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_records_school ON fee_records(school_id);
CREATE INDEX IF NOT EXISTS idx_fee_records_student ON fee_records(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_records_month ON fee_records(month);

CREATE TABLE exam_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id TEXT NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    term TEXT NOT NULL,
    subject TEXT NOT NULL,
    marks_obtained NUMERIC,
    is_absent BOOLEAN DEFAULT false,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, term, subject)
);

CREATE INDEX IF NOT EXISTS idx_exam_results_school ON exam_results(school_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_student ON exam_results(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_term ON exam_results(term);

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
CREATE INDEX idx_blogs_date            ON blogs(date DESC);

CREATE INDEX idx_attendance_school_date ON attendance_records(school_id, date);
CREATE INDEX idx_attendance_student ON attendance_records(student_id);

-- 6. FOREIGN KEY CONSTRAINTS (Ensures orphan data cleanup)
ALTER TABLE school_info ADD CONSTRAINT fk_school_info_school FOREIGN KEY (school_id) REFERENCES schools(school_id) ON DELETE CASCADE;
ALTER TABLE faculty ADD CONSTRAINT fk_faculty_school FOREIGN KEY (school_id) REFERENCES schools(school_id) ON DELETE CASCADE;
ALTER TABLE facilities ADD CONSTRAINT fk_facilities_school FOREIGN KEY (school_id) REFERENCES schools(school_id) ON DELETE CASCADE;
ALTER TABLE testimonials ADD CONSTRAINT fk_testimonials_school FOREIGN KEY (school_id) REFERENCES schools(school_id) ON DELETE CASCADE;
ALTER TABLE students ADD CONSTRAINT fk_students_school FOREIGN KEY (school_id) REFERENCES schools(school_id) ON DELETE CASCADE;
ALTER TABLE metadata ADD CONSTRAINT fk_metadata_school FOREIGN KEY (school_id) REFERENCES schools(school_id) ON DELETE CASCADE;
ALTER TABLE announcements ADD CONSTRAINT fk_announcements_school FOREIGN KEY (school_id) REFERENCES schools(school_id) ON DELETE CASCADE;
ALTER TABLE blogs ADD CONSTRAINT fk_blogs_school FOREIGN KEY (school_id) REFERENCES schools(school_id) ON DELETE CASCADE;
ALTER TABLE admins ADD CONSTRAINT fk_admins_school FOREIGN KEY (school_id) REFERENCES schools(school_id) ON DELETE CASCADE;

-- 7. AUTO-GENERATED STUDENT IDs (Prevents Race Conditions)
CREATE OR REPLACE FUNCTION generate_student_id() RETURNS TRIGGER AS $$
DECLARE
    prefix TEXT;
    seq_num INTEGER;
BEGIN
    -- Extract the prefix from school_id (e.g., 'ACS' from 'acs-001')
    prefix := UPPER(SPLIT_PART(NEW.school_id, '-', 1));
    
    -- If no prefix, default to 'ID'
    IF prefix = '' THEN
        prefix := 'ID';
    END IF;

    -- If ID is not provided or starts with TEMP-, generate one
    IF NEW.id IS NULL OR NEW.id = '' OR NEW.id LIKE 'TEMP-%' THEN
        -- Find the max sequence number for the current year and school
        SELECT COALESCE(MAX(SUBSTRING(id FROM '.*-.*-([0-9]+)$')::INTEGER), 0) INTO seq_num
        FROM students
        WHERE school_id = NEW.school_id AND id LIKE prefix || '-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-%';

        -- Generate the new ID: PREFIX-YYYY-000
        NEW.id := prefix || '-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD((seq_num + 1)::TEXT, 3, '0');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_student_id ON students;
CREATE TRIGGER trigger_generate_student_id
BEFORE INSERT ON students
FOR EACH ROW
EXECUTE FUNCTION generate_student_id();
