import puppeteer from 'puppeteer';
import { join } from 'path';

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>KHR Educo - Testing Checklist</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        @page {
            size: A4;
            margin: 15mm 15mm 15mm 15mm;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            color: #1e293b;
            line-height: 1.5;
            margin: 0;
            padding: 0;
            font-size: 11pt;
            background: #fff;
        }

        h1, h2, h3, h4 {
            color: #003B95;
            margin: 0;
        }

        h1 {
            font-size: 20pt;
            font-weight: 800;
            text-align: center;
            letter-spacing: -0.5px;
            margin-bottom: 5px;
        }

        .subtitle {
            text-align: center;
            font-size: 10pt;
            color: #64748b;
            margin-bottom: 25px;
            font-weight: 500;
        }

        .section-divider {
            height: 3px;
            background: linear-gradient(90deg, #003B95 0%, #FF7A00 100%);
            margin-bottom: 25px;
            border-radius: 2px;
        }

        /* Metadata Table */
        .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            font-size: 9.5pt;
        }

        .meta-table td {
            padding: 8px 12px;
            border: 1px solid #cbd5e1;
        }

        .meta-table td.label {
            font-weight: 700;
            background-color: #f8fafc;
            color: #334155;
            width: 20%;
        }

        .meta-table td.value {
            color: #0f172a;
        }

        /* Checkbox Box Styles */
        .print-box {
            display: inline-block;
            width: 13px;
            height: 13px;
            border: 1.5px solid #64748b;
            border-radius: 3px;
            vertical-align: middle;
            margin-right: 8px;
        }

        /* Section Header */
        .section-header {
            background-color: #f1f5f9;
            border-left: 5px solid #003B95;
            padding: 8px 15px;
            margin: 25px 0 15px 0;
            font-size: 13pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: flex;
            align-items: center;
            page-break-after: avoid;
        }

        .section-subtitle {
            font-size: 9pt;
            color: #64748b;
            font-weight: 500;
            margin-top: -12px;
            margin-bottom: 15px;
            text-transform: none;
            letter-spacing: 0;
        }

        /* Test Case Block */
        .test-case {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 15px;
            margin-bottom: 12px;
            page-break-inside: avoid;
            background: #fafafa;
        }

        .tc-header {
            display: flex;
            align-items: center;
            font-weight: 700;
            font-size: 10.5pt;
            color: #0f172a;
            margin-bottom: 8px;
            border-bottom: 1px dashed #e2e8f0;
            padding-bottom: 6px;
        }

        .tc-header .checkbox {
            display: inline-block;
            width: 15px;
            height: 15px;
            border: 2px solid #003B95;
            border-radius: 4px;
            margin-right: 10px;
            background: #fff;
        }

        .tc-details {
            margin-left: 25px;
            font-size: 9.5pt;
        }

        .tc-row {
            margin: 4px 0;
        }

        .tc-label {
            font-weight: 700;
            color: #475569;
        }

        .tc-status {
            margin-top: 8px;
            display: flex;
            gap: 20px;
            font-weight: 600;
            color: #475569;
            font-size: 9pt;
            border-top: 1px solid #f1f5f9;
            padding-top: 8px;
        }

        .status-box {
            display: inline-block;
            width: 10px;
            height: 10px;
            border: 1.5px solid #94a3b8;
            border-radius: 2px;
            vertical-align: middle;
            margin-right: 5px;
        }

        /* Footer page validation notes */
        .page-validation {
            font-size: 7.5pt;
            color: #94a3b8;
            text-align: center;
            margin-top: 40px;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
        }

        .notes-area {
            border: 1px dashed #cbd5e1;
            height: 80px;
            border-radius: 8px;
            margin-top: 10px;
            padding: 10px;
            font-size: 9pt;
            color: #94a3b8;
        }
    </style>
</head>
<body>

    <h1>🧪 KHR Educo / EduCore</h1>
    <div class="subtitle">Complete Multi-Tenant School Software Testing Protocol & Checklist</div>
    <div class="section-divider"></div>

    <table class="meta-table">
        <tr>
            <td class="label">Tester Name</td>
            <td class="value">_________________________________</td>
            <td class="label">Testing Date</td>
            <td class="value">_____ / _____ / 2026</td>
        </tr>
        <tr>
            <td class="label">Environment</td>
            <td class="value">
                <span class="print-box"></span> Localhost (Port 3000/3001) &nbsp;&nbsp;&nbsp;&nbsp;
                <span class="print-box"></span> Production (khrlabs.vercel.app)
            </td>
            <td class="label">Overall Status</td>
            <td class="value">
                <span class="print-box"></span> PASS &nbsp;&nbsp;
                <span class="print-box"></span> FAIL &nbsp;&nbsp;
                <span class="print-box"></span> RE-TEST
            </td>
        </tr>
    </table>

    <!-- SECTION 1 -->
    <div class="section-header">🌐 Section 1: Saas Landing Page & Registration Flow</div>
    <div class="section-subtitle">Testing the public brand presence, contact sync, and school self-onboarding request forms.</div>

    <div class="test-case">
        <div class="tc-header">
            <span class="checkbox"></span>
            <span>TC-1.1: Brand Header & Visual Typography</span>
        </div>
        <div class="tc-details">
            <div class="tc-row"><span class="tc-label">Action:</span> Open landing page. Inspect the top-left branding header.</div>
            <div class="tc-row"><span class="tc-label">Expected:</span> Brand logo (emblem icon) loads sharp. The written text says "KHR Educo" (Royal Blue "KHR" and Electric Orange "Educo").</div>
            <div class="tc-status">
                <span><span>Verification Result:</span></span>
                <span><span class="status-box"></span> PASS</span>
                <span><span class="status-box"></span> FAIL</span>
                <span><span class="status-box"></span> N/A</span>
            </div>
        </div>
    </div>

    <div class="test-case">
        <div class="tc-header">
            <span class="checkbox"></span>
            <span>TC-1.2: Support Contact Alignment</span>
        </div>
        <div class="tc-details">
            <div class="tc-row"><span class="tc-label">Action:</span> Scroll down to landing contact options. Review Email & WhatsApp.</div>
            <div class="tc-row"><span class="tc-label">Expected:</span> Email shows "sales@khreduco.com" (or your support email) and WhatsApp shows "+92 345 7685122" dynamically.</div>
            <div class="tc-status">
                <span><span>Verification Result:</span></span>
                <span><span class="status-box"></span> PASS</span>
                <span><span class="status-box"></span> FAIL</span>
                <span><span class="status-box"></span> N/A</span>
            </div>
        </div>
    </div>

    <div class="test-case">
        <div class="tc-header">
            <span class="checkbox"></span>
            <span>TC-1.3: School Onboarding Request Submission</span>
        </div>
        <div class="tc-details">
            <div class="tc-row"><span class="tc-label">Action:</span> Click "Register Your School". Fill out Step 1-3. Submit request.</div>
            <div class="tc-row"><span class="tc-label">Expected:</span> Submits with clean spinner. Shows success screen, prompts user with a quick direct chat link to "+92 345 7685122".</div>
            <div class="tc-status">
                <span><span>Verification Result:</span></span>
                <span><span class="status-box"></span> PASS</span>
                <span><span class="status-box"></span> FAIL</span>
                <span><span class="status-box"></span> N/A</span>
            </div>
        </div>
    </div>

    <!-- SECTION 2 -->
    <div class="section-header">👑 Section 2: Super Admin Portal (Master Control)</div>
    <div class="section-subtitle">Testing master platform-level credentials, registrations, approvals, and suspension triggers.</div>

    <div class="test-case">
        <div class="tc-header">
            <span class="checkbox"></span>
            <span>TC-2.1: Authentication & Brand Header Alignment</span>
        </div>
        <div class="tc-details">
            <div class="tc-row"><span class="tc-label">Action:</span> Navigate to Login. Enter Super Admin master credentials. Sign in.</div>
            <div class="tc-row"><span class="tc-label">Expected:</span> Enters dashboard. Top navbar displays "KHR Educo" text, the brand logo, and a prominent "Super Admin" label.</div>
            <div class="tc-status">
                <span><span>Verification Result:</span></span>
                <span><span class="status-box"></span> PASS</span>
                <span><span class="status-box"></span> FAIL</span>
                <span><span class="status-box"></span> N/A</span>
            </div>
        </div>
    </div>

    <div class="test-case">
        <div class="tc-header">
            <span class="checkbox"></span>
            <span>TC-2.2: Active School Directory & Suspension Toggles</span>
        </div>
        <div class="tc-details">
            <div class="tc-row"><span class="tc-label">Action:</span> Open "Requests". Approve test school (e.g. Matrix Academy with ID: matrix-01). Suspend the school, then reactivate.</div>
            <div class="tc-row"><span class="tc-label">Expected:</span> Status changes in real-time in the schools directory database. Seeding scripts create corresponding admins/infos table rows automatically.</div>
            <div class="tc-status">
                <span><span>Verification Result:</span></span>
                <span><span class="status-box"></span> PASS</span>
                <span><span class="status-box"></span> FAIL</span>
                <span><span class="status-box"></span> N/A</span>
            </div>
        </div>
    </div>

    <!-- SECTION 3 -->
    <div class="section-header">🔒 Section 3: School Login Portal & Suspension gateway</div>
    <div class="section-subtitle">Testing tenant routing, suspension modals, and secure platform branding indicators.</div>

    <div class="test-case">
        <div class="tc-header">
            <span class="checkbox"></span>
            <span>TC-3.1: Suspended School Interception</span>
        </div>
        <div class="tc-details">
            <div class="tc-row"><span class="tc-label">Action:</span> Attempt to log in with school ID matrix-01 while the school status is suspended.</div>
            <div class="tc-row"><span class="tc-label">Expected:</span> Authentication is blocked. Overlay modal flashes "School Account Suspended" and shows WhatsApp button pointing to "+92 345 7685122".</div>
            <div class="tc-status">
                <span><span>Verification Result:</span></span>
                <span><span class="status-box"></span> PASS</span>
                <span><span class="status-box"></span> FAIL</span>
                <span><span class="status-box"></span> N/A</span>
            </div>
        </div>
    </div>

    <div class="test-case">
        <div class="tc-header">
            <span class="checkbox"></span>
            <span>TC-3.2: Successful Login & Infrastructure secure badge</span>
        </div>
        <div class="tc-details">
            <div class="tc-row"><span class="tc-label">Action:</span> Reactivate school. Fill credentials. Inspect login card footer. Sign in.</div>
            <div class="tc-row"><span class="tc-label">Expected:</span> Login succeeds. Login card has the branded secure badge "🔒 Infrastructure secured by KHR Educo" at the bottom.</div>
            <div class="tc-status">
                <span><span>Verification Result:</span></span>
                <span><span class="status-box"></span> PASS</span>
                <span><span class="status-box"></span> FAIL</span>
                <span><span class="status-box"></span> N/A</span>
            </div>
        </div>
    </div>

    <!-- SECTION 4 -->
    <div class="section-header">🏫 Section 4: School Admin Portal — Setup, HR & Faculty</div>
    <div class="section-subtitle">Testing navigation branding, Section setups, subject registers, and employee databases.</div>

    <div class="test-case">
        <div class="tc-header">
            <span class="checkbox"></span>
            <span>TC-4.1: Sidebar Power-Branding Indicator</span>
        </div>
        <div class="tc-details">
            <div class="tc-row"><span class="tc-label">Action:</span> Expand left sidebar. Scroll down to base menu.</div>
            <div class="tc-row"><span class="tc-label">Expected:</span> Elegant footer block reads "[SCHOOL_NAME] PORTAL — Powered by KHR Educo".</div>
            <div class="tc-status">
                <span><span>Verification Result:</span></span>
                <span><span class="status-box"></span> PASS</span>
                <span><span class="status-box"></span> FAIL</span>
                <span><span class="status-box"></span> N/A</span>
            </div>
        </div>
    </div>

    <div class="test-case">
        <div class="tc-header">
            <span class="checkbox"></span>
            <span>TC-4.2: Curriculum definition & Faculty onboarding</span>
        </div>
        <div class="tc-details">
            <div class="tc-row"><span class="tc-label">Action:</span> Create "Class 9th" with sections and core subjects. Add a Class Teacher.</div>
            <div class="tc-row"><span class="tc-label">Expected:</span> Records save and load flawlessly. Core settings populate all dropdowns in other dashboards.</div>
            <div class="tc-status">
                <span><span>Verification Result:</span></span>
                <span><span class="status-box"></span> PASS</span>
                <span><span class="status-box"></span> FAIL</span>
                <span><span class="status-box"></span> N/A</span>
            </div>
        </div>
    </div>

    <!-- SECTION 5 -->
    <div class="section-header">📝 Section 5: Admissions & Student Profile isolation</div>
    <div class="section-subtitle">Testing enrollment, student roll numbers generation, and multi-tenant data barriers.</div>

    <div class="test-case">
        <div class="tc-header">
            <span class="checkbox"></span>
            <span>TC-5.1: Student Admission Form Processing</span>
        </div>
        <div class="tc-details">
            <div class="tc-row"><span class="tc-label">Action:</span> Enroll test student (e.g., Haris Khan) with father's name, phone, address in Class 9-A.</div>
            <div class="tc-row"><span class="tc-label">Expected:</span> Unique Student ID / Roll Number generates automatically (e.g. S9-001) and student populates registries.</div>
            <div class="tc-status">
                <span><span>Verification Result:</span></span>
                <span><span class="status-box"></span> PASS</span>
                <span><span class="status-box"></span> FAIL</span>
                <span><span class="status-box"></span> N/A</span>
            </div>
        </div>
    </div>

    <div class="test-case">
        <div class="tc-header">
            <span class="checkbox"></span>
            <span>TC-5.2: Multi-Tenant Data Barriers (CRITICAL)</span>
        </div>
        <div class="tc-details">
            <div class="tc-row"><span class="tc-label">Action:</span> Log into school account alpha-02. Perform lookup searches for "Haris Khan".</div>
            <div class="tc-row"><span class="tc-label">Expected:</span> Haris Khan is completely hidden/invisible. No data leaks occur between tenants.</div>
            <div class="tc-status">
                <span><span>Verification Result:</span></span>
                <span><span class="status-box"></span> PASS</span>
                <span><span class="status-box"></span> FAIL</span>
                <span><span class="status-box"></span> N/A</span>
            </div>
        </div>
    </div>

    <!-- SECTION 6 -->
    <div class="section-header">📅 Section 6: Attendance Registers & QR Tracking</div>
    <div class="section-subtitle">Testing roll-calls, manual entries, and QR code arrivals automation.</div>

    <div class="test-case">
        <div class="tc-header">
            <span class="checkbox"></span>
            <span>TC-6.1: Manual Attendance sheet submission</span>
        </div>
        <div class="tc-details">
            <div class="tc-row"><span class="tc-label">Action:</span> Select Class 9-A, current date. Load register. Toggle Present/Absent. Submit.</div>
            <div class="tc-row"><span class="tc-label">Expected:</span> Records save and percentage aggregations update immediately.</div>
            <div class="tc-status">
                <span><span>Verification Result:</span></span>
                <span><span class="status-box"></span> PASS</span>
                <span><span class="status-box"></span> FAIL</span>
                <span><span class="status-box"></span> N/A</span>
            </div>
        </div>
    </div>

    <div class="test-case">
        <div class="tc-header">
            <span class="checkbox"></span>
            <span>TC-6.2: QR Arrival scan automation</span>
        </div>
        <div class="tc-details">
            <div class="tc-row"><span class="tc-label">Action:</span> Open QR scanner page. Scan student's QR ID card.</div>
            <div class="tc-row"><span class="tc-label">Expected:</span> Flash green success border, plays chime tone, registers immediate arrival in attendance log.</div>
            <div class="tc-status">
                <span><span>Verification Result:</span></span>
                <span><span class="status-box"></span> PASS</span>
                <span><span class="status-box"></span> FAIL</span>
                <span><span class="status-box"></span> N/A</span>
            </div>
        </div>
    </div>

    <!-- SECTION 7 -->
    <div class="section-header">💵 Section 7: Fee Ledgers, Vouchers, discounts & Arrears</div>
    <div class="section-subtitle">Testing bill generation, discount application, rolling arrears and print layouts.</div>

    <div class="test-case">
        <div class="tc-header">
            <span class="checkbox"></span>
            <span>TC-7.1: Bulk Voucher generation & Discounts</span>
        </div>
        <div class="tc-details">
            <div class="tc-row"><span class="tc-label">Action:</span> Generate bulk invoices for May 2026. Apply discount to student Haris Khan.</div>
            <div class="tc-row"><span class="tc-label">Expected:</span> Total outstanding adjusts automatically. Previous arrears are carried forward.</div>
            <div class="tc-status">
                <span><span>Verification Result:</span></span>
                <span><span class="status-box"></span> PASS</span>
                <span><span class="status-box"></span> FAIL</span>
                <span><span class="status-box"></span> N/A</span>
            </div>
        </div>
    </div>

    <div class="test-case">
        <div class="tc-header">
            <span class="checkbox"></span>
            <span>TC-7.2: Partial payments, Rolling Arrears & Printed invoices</span>
        </div>
        <div class="tc-details">
            <div class="tc-row"><span class="tc-label">Action:</span> Record a partial payment. Inspect receipt invoice. Print receipt.</div>
            <div class="tc-row"><span class="tc-label">Expected:</span> Unpaid amount becomes outstanding Rolling Arrears. Printed document matches preview.</div>
            <div class="tc-status">
                <span><span>Verification Result:</span></span>
                <span><span class="status-box"></span> PASS</span>
                <span><span class="status-box"></span> FAIL</span>
                <span><span class="status-box"></span> N/A</span>
            </div>
        </div>
    </div>

    <!-- SECTION 8 -->
    <div class="section-header">🏆 Section 8: Academics, Grading, Remarks & Printed Report Cards</div>
    <div class="section-subtitle">Testing grading boundaries, remark persistence, and beautiful co-branded PDF transcript printouts.</div>

    <div class="test-case">
        <div class="tc-header">
            <span class="checkbox"></span>
            <span>TC-8.1: Exam Gradebook Entry & Automatic Letter Grades</span>
        </div>
        <div class="tc-details">
            <div class="tc-row"><span class="tc-label">Action:</span> Enter Term Marks. Enter grades. Submit.</div>
            <div class="tc-row"><span class="tc-label">Expected:</span> Math grades write successfully and calculate standard grade boundaries (A+, B, etc) automatically.</div>
            <div class="tc-status">
                <span><span>Verification Result:</span></span>
                <span><span class="status-box"></span> PASS</span>
                <span><span class="status-box"></span> FAIL</span>
                <span><span class="status-box"></span> N/A</span>
            </div>
        </div>
    </div>

    <div class="test-case">
        <div class="tc-header">
            <span class="checkbox"></span>
            <span>TC-8.2: Persistent Teacher Remarks System</span>
        </div>
        <div class="tc-details">
            <div class="tc-row"><span class="tc-label">Action:</span> Type a customized remark for a student. Save remarks. Navigate away and back.</div>
            <div class="tc-row"><span class="tc-label">Expected:</span> Custom remarks persist in database and load instantly back inside the progress worksheet.</div>
            <div class="tc-status">
                <span><span>Verification Result:</span></span>
                <span><span class="status-box"></span> PASS</span>
                <span><span class="status-box"></span> FAIL</span>
                <span><span class="status-box"></span> N/A</span>
            </div>
        </div>
    </div>

    <div class="test-case">
        <div class="tc-header">
            <span class="checkbox"></span>
            <span>TC-8.3: Single-Page A4 Printed Report Card & Branded Footer</span>
        </div>
        <div class="tc-details">
            <div class="tc-row"><span class="tc-label">Action:</span> Open printed report card preview. Inspect bottom margin.</div>
            <div class="tc-row"><span class="tc-label">Expected:</span> Layout sits cleanly on one A4 page. Base validation reads: "Official transcript generated via KHR Educo Smart Platform".</div>
            <div class="tc-status">
                <span><span>Verification Result:</span></span>
                <span><span class="status-box"></span> PASS</span>
                <span><span class="status-box"></span> FAIL</span>
                <span><span class="status-box"></span> N/A</span>
            </div>
        </div>
    </div>

    <!-- SECTION 9 -->
    <div class="section-header">👤 Section 9: Student/Parent Portal Gateway</div>
    <div class="section-subtitle">Testing credentials, student sidebar branding, results worksheets, and payment histories.</div>

    <div class="test-case">
        <div class="tc-header">
            <span class="checkbox"></span>
            <span>TC-9.1: Student Login & Dynamic Side Navigation Footer</span>
        </div>
        <div class="tc-details">
            <div class="tc-row"><span class="tc-label">Action:</span> Login as student Haris Khan. View main layout.</div>
            <div class="tc-row"><span class="tc-label">Expected:</span> Access granted. Sidebar features branding "Matrix Academy PORTAL — Powered by KHR Educo" at bottom.</div>
            <div class="tc-status">
                <span><span>Verification Result:</span></span>
                <span><span class="status-box"></span> PASS</span>
                <span><span class="status-box"></span> FAIL</span>
                <span><span class="status-box"></span> N/A</span>
            </div>
        </div>
    </div>

    <div class="test-case">
        <div class="tc-header">
            <span class="checkbox"></span>
            <span>TC-9.2: Fee ledgers & Result verification</span>
        </div>
        <div class="tc-details">
            <div class="tc-row"><span class="tc-label">Action:</span> Check dynamic Fee tabs and Results worksheets inside student panel.</div>
            <div class="tc-row"><span class="tc-label">Expected:</span> Exact billing items, recorded partial payments, letter grades, and custom remarks load instantly.</div>
            <div class="tc-status">
                <span><span>Verification Result:</span></span>
                <span><span class="status-box"></span> PASS</span>
                <span><span class="status-box"></span> FAIL</span>
                <span><span class="status-box"></span> N/A</span>
            </div>
        </div>
    </div>

    <!-- SECTION 10 -->
    <div class="section-header">💬 Section 10: WhatsApp Notification Automations</div>
    <div class="section-subtitle">Testing SMS/WhatsApp templates and KHR secure messaging footers.</div>

    <div class="test-case">
        <div class="tc-header">
            <span class="checkbox"></span>
            <span>TC-10.1: Payment Received Alerts Layout</span>
        </div>
        <div class="tc-details">
            <div class="tc-row"><span class="tc-label">Action:</span> Generate a fee payment received alert from fee logs dashboard.</div>
            <div class="tc-row"><span class="tc-label">Expected:</span> Text contains payment summary + platform notice: "Payment processed. System secured by KHR Educo Support".</div>
            <div class="tc-status">
                <span><span>Verification Result:</span></span>
                <span><span class="status-box"></span> PASS</span>
                <span><span class="status-box"></span> FAIL</span>
                <span><span class="status-box"></span> N/A</span>
            </div>
        </div>
    </div>

    <!-- SECTION 11 -->
    <div class="section-header">💾 Section 11: Database Backups & Infrastructure Resilience</div>
    <div class="section-subtitle">Testing backup scripts and physical offline archive files compilation.</div>

    <div class="test-case">
        <div class="tc-header">
            <span class="checkbox"></span>
            <span>TC-11.1: Database Daily Backup Compilation</span>
        </div>
        <div class="tc-details">
            <div class="tc-row"><span class="tc-label">Action:</span> Execute manual daily_backup.bat or backup_database.js.</div>
            <div class="tc-row"><span class="tc-label">Expected:</span> Compiles fully structured SQL backup schema and dumps compressed file with date stamp inside backups folder.</div>
            <div class="tc-status">
                <span><span>Verification Result:</span></span>
                <span><span class="status-box"></span> PASS</span>
                <span><span class="status-box"></span> FAIL</span>
                <span><span class="status-box"></span> N/A</span>
            </div>
        </div>
    </div>

    <!-- TEST SUMMARY REMARKS -->
    <div class="section-header" style="margin-top: 40px; page-break-before: always;">📝 Additional Tester Notes & handwritten Remarks</div>
    <div class="notes-area">1. __________________________________________________________________________________________</div>
    <div class="notes-area" style="border-top: none; margin-top: 0; height: 50px;">2. __________________________________________________________________________________________</div>
    <div class="notes-area" style="border-top: none; margin-top: 0; height: 50px;">3. __________________________________________________________________________________________</div>

    <div class="page-validation">
        Official Testing Document generated via KHR Educo Developer Suite &copy; 2026. All rights reserved.
    </div>

</body>
</html>
`;

async function generate() {
    console.log("Starting Puppeteer and generating testing checklist PDF...");
    try {
        const browser = await puppeteer.launch({
            headless: "new"
        });
        const page = await browser.newPage();
        
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        const saasPdfPath = join('c:', 'Professional Projects', 'SAAS', 'software_testing_checklist.pdf');
        const eduCorePdfPath = join('c:', 'Professional Projects', 'EduCore', 'software_testing_checklist.pdf');

        // Write to SAAS folder
        await page.pdf({
            path: saasPdfPath,
            format: 'A4',
            margin: {
                top: '15mm',
                bottom: '15mm',
                left: '15mm',
                right: '15mm'
            },
            printBackground: true
        });
        console.log(`Successfully generated PDF for SAAS at: ${saasPdfPath}`);

        // Write to EduCore folder
        await page.pdf({
            path: eduCorePdfPath,
            format: 'A4',
            margin: {
                top: '15mm',
                bottom: '15mm',
                left: '15mm',
                right: '15mm'
            },
            printBackground: true
        });
        console.log(`Successfully generated PDF for EduCore at: ${eduCorePdfPath}`);

        await browser.close();
        console.log("SUCCESS! All PDFs compiled flawlessly!");
    } catch (error) {
        console.error("PDF Generation failed:", error);
    }
}

generate();
