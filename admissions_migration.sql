-- Migration Script: Lead Pipeline / Inquiries Refactor
-- This script moves the JSONB INQUIRIES from the metadata table into a dedicated relational table.

-- 1. Create the new inquiry_records table
CREATE TABLE IF NOT EXISTS inquiry_records (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    inquiry_number TEXT,
    student_name TEXT NOT NULL,
    father_name TEXT,
    contact TEXT,
    applying_for TEXT,
    inquiry_date DATE,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    fee_admission NUMERIC DEFAULT 0,
    fee_paper_fund NUMERIC DEFAULT 0,
    fee_monthly NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Migrate existing INQUIRIES data from metadata table
-- We unpack the JSONB array stored in metadata where key = 'INQUIRIES'
DO $$
DECLARE
    r RECORD;
    inq_element JSONB;
BEGIN
    FOR r IN SELECT school_id, value FROM metadata WHERE key = 'INQUIRIES'
    LOOP
        IF r.value IS NOT NULL AND jsonb_typeof(r.value) = 'array' THEN
            FOR inq_element IN SELECT * FROM jsonb_array_elements(r.value)
            LOOP
                BEGIN
                    INSERT INTO inquiry_records (
                        id,
                        school_id,
                        inquiry_number,
                        student_name,
                        father_name,
                        contact,
                        applying_for,
                        inquiry_date,
                        notes,
                        status,
                        fee_admission,
                        fee_paper_fund,
                        fee_monthly
                    ) VALUES (
                        COALESCE(inq_element->>'id', 'INQ-' || extract(epoch from now())::text || '-' || floor(random() * 1000)::text),
                        r.school_id,
                        inq_element->>'inquiryNumber',
                        inq_element->>'studentName',
                        inq_element->>'fatherName',
                        inq_element->>'contact',
                        inq_element->>'applyingFor',
                        NULLIF(inq_element->>'date', '')::DATE,
                        inq_element->>'notes',
                        COALESCE(inq_element->>'status', 'pending'),
                        NULLIF(inq_element->>'feeAdmission', '')::NUMERIC,
                        NULLIF(inq_element->>'feePaperFund', '')::NUMERIC,
                        NULLIF(inq_element->>'feeMonthly', '')::NUMERIC
                    ) ON CONFLICT (id) DO NOTHING;
                EXCEPTION WHEN OTHERS THEN
                    -- Ignore type casting errors for bad historical data
                    RAISE NOTICE 'Skipping invalid inquiry record: %', inq_element;
                END;
            END LOOP;
        END IF;
    END LOOP;
END $$;

-- 3. Delete the old JSONB record to prevent out-of-sync states
DELETE FROM metadata WHERE key = 'INQUIRIES';
