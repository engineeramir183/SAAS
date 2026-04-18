-- ============================================================
-- Migration: Add WhatsApp API keys to saas_info
-- These are used for platform-level notifications (registration, approval)
-- ============================================================

ALTER TABLE saas_info ADD COLUMN IF NOT EXISTS whatsapp_api_key TEXT;
ALTER TABLE saas_info ADD COLUMN IF NOT EXISTS whatsapp_phone_id TEXT;
ALTER TABLE saas_info ADD COLUMN IF NOT EXISTS email_service_key TEXT; -- Optional for Email automation

-- Verify
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'saas_info';
