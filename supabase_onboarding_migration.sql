-- ============================================================
-- ONBOARDING SYSTEM: Track configuration status
-- ============================================================

-- 1. Add `is_onboarded` to schools table
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN NOT NULL DEFAULT false;

-- 2. Backfill existing school(s) as already onboarded so their workflow isn't interrupted
UPDATE schools SET is_onboarded = true WHERE school_id = 'acs-001';
