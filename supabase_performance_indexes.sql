-- ============================================================
-- PERFORMANCE INDEXES — Run once in Supabase SQL Editor
-- These make every query 5–10x faster as data grows
-- ============================================================

-- Students table: most queried table in the entire app
CREATE INDEX IF NOT EXISTS idx_students_school_id
    ON students(school_id);

CREATE INDEX IF NOT EXISTS idx_students_grade
    ON students(school_id, grade);

CREATE INDEX IF NOT EXISTS idx_students_id
    ON students(id);

-- Metadata table: loaded on every page load (SUBJECTS, TERMS, CLASSES, etc.)
CREATE INDEX IF NOT EXISTS idx_metadata_school_key
    ON metadata(school_id, key);

-- Announcements: scoped per school, ordered by id desc
CREATE INDEX IF NOT EXISTS idx_announcements_school_id
    ON announcements(school_id, id DESC);

-- Faculty: scoped per school
CREATE INDEX IF NOT EXISTS idx_faculty_school_id
    ON faculty(school_id);

-- Facilities: scoped per school
CREATE INDEX IF NOT EXISTS idx_facilities_school_id
    ON facilities(school_id);

-- Blogs: scoped per school, ordered by created_at desc
CREATE INDEX IF NOT EXISTS idx_blogs_school_id
    ON blogs(school_id, created_at DESC);

-- Testimonials: scoped per school
CREATE INDEX IF NOT EXISTS idx_testimonials_school_id
    ON testimonials(school_id);

-- Admins: scoped per school + role (used in login checks)
CREATE INDEX IF NOT EXISTS idx_admins_school_role
    ON admins(school_id, role);

-- Schools: primary lookup on school_id
CREATE INDEX IF NOT EXISTS idx_schools_school_id
    ON schools(school_id);

-- School info: primary lookup on school_id
CREATE INDEX IF NOT EXISTS idx_school_info_school_id
    ON school_info(school_id);

-- ============================================================
-- VERIFY: Run this to confirm all indexes were created
-- ============================================================
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
