-- ============================================================
-- PUSH SUBSCRIPTIONS RLS POLICY FIX
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Option A: Disable RLS completely for push_subscriptions (Highly Recommended for maximum reliability)
ALTER TABLE push_subscriptions DISABLE ROW LEVEL SECURITY;

-- Option B: Alternatively, if you want to keep RLS active, uncomment and run this policy:
-- DROP POLICY IF EXISTS "Allow public all access to push_subscriptions" ON push_subscriptions;
-- CREATE POLICY "Allow public all access to push_subscriptions"
--   ON push_subscriptions FOR ALL TO public
--   USING (true) WITH CHECK (true);
