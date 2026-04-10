-- ============================================================
-- Migration: Add missing columns to the `schools` table
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- 0. Ensure the 'branding' storage bucket exists and is public (for logo uploads)
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- RLS Policies for branding bucket
-- (Using DO blocks because CREATE POLICY IF NOT EXISTS is not supported)

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage'
          AND tablename  = 'objects'
          AND policyname = 'Public read access for branding'
    ) THEN
        CREATE POLICY "Public read access for branding"
            ON storage.objects FOR SELECT
            USING (bucket_id = 'branding');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage'
          AND tablename  = 'objects'
          AND policyname = 'Authenticated upload for branding'
    ) THEN
        CREATE POLICY "Authenticated upload for branding"
            ON storage.objects FOR INSERT
            WITH CHECK (bucket_id = 'branding');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage'
          AND tablename  = 'objects'
          AND policyname = 'Authenticated upsert for branding'
    ) THEN
        CREATE POLICY "Authenticated upsert for branding"
            ON storage.objects FOR UPDATE
            USING (bucket_id = 'branding');
    END IF;
END $$;

-- Payment & Billing columns
ALTER TABLE schools ADD COLUMN IF NOT EXISTS bank_name              TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS bank_account           TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS easypaisa_number       TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS jazzcash_number        TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS payment_instructions   TEXT;

-- WhatsApp Automation columns
ALTER TABLE schools ADD COLUMN IF NOT EXISTS whatsapp_api_key       TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS whatsapp_phone_id      TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS auto_attendance_alert  BOOLEAN DEFAULT FALSE;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS auto_fee_alert         BOOLEAN DEFAULT FALSE;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS auto_admission_alert   BOOLEAN DEFAULT FALSE;

-- Cleanup: remove the wrongly-added column from school_info (uncomment if needed)
-- ALTER TABLE school_info DROP COLUMN IF EXISTS auto_admission_alert;
