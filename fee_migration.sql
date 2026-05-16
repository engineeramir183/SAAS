-- 1. Create the fee_records table
CREATE TABLE IF NOT EXISTS fee_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(student_id, month)
);

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_fee_records_school ON fee_records(school_id);
CREATE INDEX IF NOT EXISTS idx_fee_records_student ON fee_records(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_records_month ON fee_records(month);

-- 3. Migration Function: Move JSONB fee_history to relational table
DO $$
DECLARE
    s RECORD;
    f JSONB;
BEGIN
    FOR s IN SELECT id, school_id, fee_history FROM students WHERE fee_history IS NOT NULL AND jsonb_array_length(fee_history) > 0 LOOP
        FOR f IN SELECT jsonb_array_elements(s.fee_history) LOOP
            INSERT INTO fee_records (
                school_id,
                student_id,
                month,
                tuition_fee,
                admission_fee,
                annual_fee,
                exam_fee,
                transport_fee,
                lab_fee,
                late_fine,
                discount,
                paid_amount,
                status,
                payment_date,
                payment_method,
                is_online
            ) VALUES (
                s.school_id,
                s.id,
                f->>'month',
                COALESCE((f->>'tuitionFee')::NUMERIC, 0),
                COALESCE((f->>'admissionFee')::NUMERIC, 0),
                COALESCE((f->>'annualFee')::NUMERIC, 0),
                COALESCE((f->>'examFee')::NUMERIC, 0),
                COALESCE((f->>'transportFee')::NUMERIC, 0),
                COALESCE((f->>'labFee')::NUMERIC, 0),
                COALESCE((f->>'lateFine')::NUMERIC, 0),
                COALESCE((f->>'discount')::NUMERIC, 0),
                COALESCE((f->>'paidAmount')::NUMERIC, 0),
                COALESCE(f->>'status', 'unpaid'),
                (CASE WHEN f->>'paymentDate' IS NOT NULL AND f->>'paymentDate' != '' THEN (f->>'paymentDate')::DATE ELSE NULL END),
                f->>'paymentMethod',
                COALESCE((f->>'isOnline')::BOOLEAN, false)
            ) ON CONFLICT (student_id, month) DO UPDATE SET
                tuition_fee = EXCLUDED.tuition_fee,
                admission_fee = EXCLUDED.admission_fee,
                annual_fee = EXCLUDED.annual_fee,
                exam_fee = EXCLUDED.exam_fee,
                transport_fee = EXCLUDED.transport_fee,
                lab_fee = EXCLUDED.lab_fee,
                late_fine = EXCLUDED.late_fine,
                discount = EXCLUDED.discount,
                paid_amount = EXCLUDED.paid_amount,
                status = EXCLUDED.status,
                payment_date = EXCLUDED.payment_date,
                payment_method = EXCLUDED.payment_method,
                is_online = EXCLUDED.is_online;
        END LOOP;
    END LOOP;
END $$;
