-- ============================================================
-- STUDENT DIARY MODULE — Database Migration
-- Run this ONCE in your Supabase SQL Editor.
-- ============================================================

-- 1. Create the student_diaries table
CREATE TABLE IF NOT EXISTS student_diaries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id       TEXT    NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,

    -- Targeting: who sees this entry?
    class           TEXT    NOT NULL,             -- e.g. 'One', 'Nursery', '9th'
    section         TEXT    DEFAULT 'All',        -- e.g. 'A', 'B', or 'All'
    student_id      TEXT    REFERENCES students(id) ON DELETE CASCADE, -- NULL = class-wide

    -- Content
    type            TEXT    NOT NULL DEFAULT 'Homework',  -- Homework | Classwork | Notice | Behavior
    subject         TEXT    DEFAULT 'General',            -- e.g. 'English', 'Math'
    title           TEXT,                                 -- Short title
    content         TEXT    NOT NULL,                     -- The actual message / instructions
    is_urgent       BOOLEAN DEFAULT false,                -- Urgent notices trigger WhatsApp alert

    -- Attachments (list of URLs)
    attachments     JSONB   DEFAULT '[]'::jsonb,

    -- Scheduling
    diary_date      DATE    NOT NULL DEFAULT CURRENT_DATE,

    -- Acknowledgments: array of student_ids who clicked "Read"
    acknowledgments JSONB   DEFAULT '[]'::jsonb,

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_diary_school         ON student_diaries(school_id);
CREATE INDEX IF NOT EXISTS idx_diary_school_class   ON student_diaries(school_id, class);
CREATE INDEX IF NOT EXISTS idx_diary_date           ON student_diaries(diary_date DESC);
CREATE INDEX IF NOT EXISTS idx_diary_student        ON student_diaries(student_id);
CREATE INDEX IF NOT EXISTS idx_diary_type           ON student_diaries(type);

-- 3. Add to MASTER_SETUP.sql note:
-- This table should also be added to backup_database.js TABLES array.
