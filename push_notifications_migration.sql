-- ============================================================
-- PUSH NOTIFICATIONS MIGRATION
-- Web Push Notifications (FCM) — Per-School Feature Gates
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add push notification feature flags to the schools table
ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS push_notifications_enabled  BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS auto_push_attendance_alert  BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS auto_push_fee_alert         BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS auto_push_diary_alert       BOOLEAN DEFAULT FALSE;

-- 2. Create push_subscriptions table to store FCM device tokens per student
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   TEXT        NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
  student_id  TEXT        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  fcm_token   TEXT        NOT NULL,
  browser     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, fcm_token)
);

-- 3. Performance indexes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_school   ON push_subscriptions(school_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_student  ON push_subscriptions(student_id);

-- 4. Row Level Security (optional but recommended)
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
