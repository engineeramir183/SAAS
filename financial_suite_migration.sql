-- ============================================================
-- FINANCIAL SUITE MIGRATION
-- Creates relational payroll_records and expense_records tables.
-- Run ONCE in Supabase SQL Editor.
-- ============================================================

-- 1. Payroll Records (replaces faculty.payroll_history JSONB)
CREATE TABLE IF NOT EXISTS payroll_records (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id       TEXT        NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    faculty_id      INTEGER     NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    month           TEXT        NOT NULL,           -- e.g. 'May 2026'
    base_salary     NUMERIC     NOT NULL DEFAULT 0,
    allowance       NUMERIC     NOT NULL DEFAULT 0,
    deduction       NUMERIC     NOT NULL DEFAULT 0,
    net_paid        NUMERIC     NOT NULL DEFAULT 0,
    paid_on         DATE,
    status          TEXT        NOT NULL DEFAULT 'paid',  -- paid | pending
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (school_id, faculty_id, month)           -- one record per staff per month
);

CREATE INDEX IF NOT EXISTS idx_payroll_school    ON payroll_records(school_id);
CREATE INDEX IF NOT EXISTS idx_payroll_faculty   ON payroll_records(faculty_id);
CREATE INDEX IF NOT EXISTS idx_payroll_month     ON payroll_records(month);

-- 2. Expense Records (replaces metadata.EXPENSES JSON blob)
CREATE TABLE IF NOT EXISTS expense_records (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id       TEXT        NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    title           TEXT        NOT NULL,
    amount          NUMERIC     NOT NULL DEFAULT 0,
    category        TEXT        NOT NULL DEFAULT 'Other',
    expense_date    DATE        NOT NULL DEFAULT CURRENT_DATE,
    status          TEXT        NOT NULL DEFAULT 'Paid',   -- Paid | Pending
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expense_school    ON expense_records(school_id);
CREATE INDEX IF NOT EXISTS idx_expense_date      ON expense_records(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expense_category  ON expense_records(category);

-- 3. Note: After verifying data is migrated, you can optionally:
--    ALTER TABLE faculty DROP COLUMN IF EXISTS payroll_history;
--    And remove EXPENSES from the metadata table.
