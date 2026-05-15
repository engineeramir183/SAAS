# 🧪 KHR Educo / EduCore — Complete Software Testing Checklist

This document is a comprehensive, production-ready quality assurance (QA) testing protocol for your multi-tenant school management SaaS platform. 

**Instructions:** Print this checklist out, proceed step-by-step through each test case, perform the action, verify the expected result, and mark the checkbox with a pen.

---

## 📋 General Testing Metadata

*   **Tester Name:** ___________________________  
*   **Test Date:** _____ / _____ / 2026
*   **Testing Environment:** [ ] Localhost (Port 3000/3001)  |  [ ] Live Production (khrlabs.vercel.app / Live URL)
*   **Database Host:** Supabase Cloud Instance  
*   **Overall Test Result:** [ ] PASS  |  [ ] FAIL  |  [ ] PENDING RE-TEST

---

## 🌐 Section 1: Saas Landing Page & Registration Flow
*Testing the public brand presence, responsiveness, and school registration onboarding.*

- [ ] **TC-1.1: Brand Header Legibility**
  *   **Action:** Open the landing page (`http://localhost:3000` or live URL). Scroll to the top and inspect the logo area.
  *   **Expected:** The high-resolution square logo loads correctly. The text **`KHR Educo`** is sharp and highly legible (deep blue `KHR` and electric orange `Educo`).
  *   **Result:** [ ] Pass  |  [ ] Fail  |  [ ] N/A  |  *Notes:* _______________________________________

- [ ] **TC-1.2: Support Details Sync**
  *   **Action:** Scroll down to the contact options section of the landing page. Inspect the Email and WhatsApp boxes.
  *   **Expected:** The email shows `sales@khreduco.com` (or your chosen support email) and the WhatsApp displays the active number **`+92 345 7685122`**.
  *   **Result:** [ ] Pass  |  [ ] Fail  |  [ ] N/A  |  *Notes:* _______________________________________

- [ ] **TC-1.3: School Registration Request**
  *   **Action:** Click the **"Register Your School"** or **"Register School"** button in the header. Fill out the multi-step form:
      *   *Step 1 (School Info):* Enter a test school name (e.g., "Matrix Academy"), country ("Pakistan").
      *   *Step 2 (Contact & Location):* Enter a real phone number and your test email.
      *   *Step 3 (Admin Account):* Choose a secure admin username (e.g., `matrix_admin`) and a password.
      *   *Action:* Click **"Submit Request"**.
  *   **Expected:** The request submits successfully with a loading spinner. The **Success Screen** appears with a checkmark and instructions. A direct WhatsApp click-to-chat button loads with the correct preset message.
  *   **Result:** [ ] Pass  |  [ ] Fail  |  [ ] N/A  |  *Notes:* _______________________________________

---

## 👑 Section 2: Super Admin Portal (Master Control)
*Testing platform management, global analytics, and school onboarding operations.*

- [ ] **TC-2.1: Super Admin Authentication**
  *   **Action:** Navigate to the login screen. Attempt to sign in using your Super Admin master credentials.
  *   **Expected:** Access is granted. The interface routes to the **SaaS Master Control** dashboard.
  *   **Result:** [ ] Pass  |  [ ] Fail  |  [ ] N/A  |  *Notes:* _______________________________________

- [ ] **TC-2.2: Master Brand Header & Logo**
  *   **Action:** Inspect the top navigation bar of the Super Admin Portal.
  *   **Expected:** The KHR Educo logo displays properly on the dark background. The branding reads **`KHR Educo`** in clean typography next to an official, highlighted **`Super Admin`** badge.
  *   **Result:** [ ] Pass  |  [ ] Fail  |  [ ] N/A  |  *Notes:* _______________________________________

- [ ] **TC-2.3: Global Statistics Aggregation**
  *   **Action:** Review the analytic counters at the top of the dashboard.
  *   **Expected:** Real-time totals of **Total Registered Schools**, **Active Schools**, **Total Students**, and **Total Faculty** are calculated and rendered correctly.
  *   **Result:** [ ] Pass  |  [ ] Fail  |  [ ] N/A  |  *Notes:* _______________________________________

- [ ] **TC-2.4: Managing Pending Registration Requests**
  *   **Action:** Click on the **"Requests"** or **"Onboarding"** tab inside the Super Admin panel. Locate your submitted request ("Matrix Academy").
  *   **Expected:** All form data submitted in TC-1.3 displays accurately. 
  *   **Result:** [ ] Pass  |  [ ] Fail  |  [ ] N/A  |  *Notes:* _______________________________________

- [ ] **TC-2.5: Approving and Initializing School Tenant**
  *   **Action:** Click **"Approve"** on the registration request. Assign a unique **School ID** (e.g., `matrix-01`) and select a subscription plan (e.g., "Pro"). Submit the approval.
  *   **Expected:** The request status updates instantly. The system dynamically creates a school tenant profile in the database, provisions empty defaults, and seeds the initial admin account.
  *   **Result:** [ ] Pass  |  [ ] Fail  |  [ ] N/A  |  *Notes:* _______________________________________

- [ ] **TC-2.6: Active School Directory & Controls**
  *   **Action:** Navigate to the **"Schools"** list. Locate your newly approved school.
  *   **Expected:** The school appears in the directory with its assigned School ID, subscription plan, and an **"Active"** status badge.
  *   **Action:** Click the **"Deactivate"** or **"Suspend"** button next to the school.
  *   **Expected:** The school status changes to **"Inactive"** in the table.
  *   **Result:** [ ] Pass  |  [ ] Fail  |  [ ] N/A  |  *Notes:* _______________________________________

---

## 🔒 Section 3: School Login Portal & Suspension Gateway
*Testing authentication, tenant isolation, and subscription enforcement limits.*

- [ ] **TC-3.1: Suspended School Account Interception**
  *   **Action:** Navigate to the Portal Login screen. Attempt to sign in as the administrator of the **suspended** school (Matrix Academy) using `matrix-01` and the credentials.
  *   **Expected:** The system blocks authentication and triggers a blurred backdrop overlay modal reading **"School Account Suspended"**. The modal features a prominent WhatsApp contact button pointing to **`+92 345 7685122`** with a prefilled subscription renewal message.
  *   **Result:** [ ] Pass  |  [ ] Fail  |  [ ] N/A  |  *Notes:* _______________________________________

- [ ] **TC-3.2: Reactivating School Account**
  *   **Action:** Log back into the **Super Admin Portal**. Click **"Reactivate"** next to Matrix Academy.
  *   **Expected:** Status reverts to **"Active"** in the database.
  *   **Result:** [ ] Pass  |  [ ] Fail  |  [ ] N/A  |  *Notes:* _______________________________________

- [ ] **TC-3.3: Successful School Admin Login**
  *   **Action:** Return to the Portal Login box. Sign in using School ID: `matrix-01`, username: `matrix_admin`, and your password.
  *   **Expected:** Login succeeds. The system redirects to the **School Admin Portal** and loads the workspace for Matrix Academy.
  *   **Result:** [ ] Pass  |  [ ] Fail  |  [ ] N/A  |  *Notes:* _______________________________________

- [ ] **TC-3.4: Infrastructure Secure Indicator**
  *   **Action:** Inspect the login card layout at the bottom before/during login.
  *   **Expected:** The base footer of the login box displays an elegant, high-contrast security badge:  
      **`🔒 Infrastructure secured by KHR Educo`**
  *   **Result:** [ ] Pass  |  [ ] Fail  |  [ ] N/A  |  *Notes:* _______________________________________

---

## 🏫 Section 4: School Admin Portal — Setup, HR & Faculty
*Testing settings, layout structure, and school staff management.*

- [ ] **TC-4.1: Sidebar Branded Navigation Footer**
  *   **Action:** Expand/view the left sidebar navigation menu inside the Admin Portal. Scroll to the very bottom of the menu container.
  *   **Expected:** A clean, high-contrast co-branding line reads:  
      **`Matrix Academy PORTAL — Powered by KHR Educo`** (along with the brand logo).
  *   **Result:** [ ] Pass  |  [ ] Fail  |  [ ] N/A  |  *Notes:* _______________________________________

- [ ] **TC-4.2: Defining Class & Subject Curriculum**
  *   **Action:** Go to **"Academics"** or **"Setup"** > **"Classes"**. Create a Class (e.g., "Class 9th"). Add sections (e.g., "9-A", "9-B") and assign multiple core subjects (e.g., Mathematics, Physics, Chemistry, English).
  *   **Expected:** All classes and subjects save successfully and render in interactive dropdowns across other administrative modules.
  *   **Result:** [ ] Pass  |  [ ] Fail  |  [ ] N/A  |  *Notes:* _______________________________________

- [ ] **TC-4.3: Staff & Faculty Registration**
  *   **Action:** Go to the **"HR / Payroll"** or **"Staff"** tab. Click **"Add Staff Member"**. Enter personal details, designate a role (e.g., "Class Teacher"), select assigned classes, and set their basic monthly salary. Save the profile.
  *   **Expected:** The staff member registers successfully, generates a unique employee ID, and populates the school staff database list.
  *   **Result:** [ ] Pass  |  [ ] Fail  |  [ ] N/A  |  *Notes:* _______________________________________

---

## 📝 Section 5: Admissions & Student Profile Management
*Testing student onboarding, search filters, and multi-tenant data isolation.*

- [ ] **TC-5.1: Student Admission Form Processing**
  *   **Action:** Navigate to the **"Admissions"** or **"Students"** tab. Click **"New Admission"**. Fill out the enrollment form:
      *   *Details:* Name (e.g., "Haris Khan"), Father's Name ("Zia Khan"), Contact Phone, Gender, Address.
      *   *Academics:* Assign to Class "9th" (Section "9-A").
      *   *Action:* Click **"Enroll Student"**.
  *   **Expected:** The student record is written. A unique **Student ID / Roll Number** is generated dynamically (e.g., `S9-001`). The welcome confirmation box loads.
  *   **Result:** [ ] Pass  |  [ ] Fail  |  [ ] N/A  |  *Notes:* _______________________________________

- [ ] **TC-5.2: Multi-Tenant Isolation Verification (CRITICAL)**
  *   **Action:** Log into a completely different school account (e.g., School ID: `alpha-02`) on another browser tab/window. Search the student database.
  *   **Expected:** Haris Khan (and all data from `matrix-01`) is **completely invisible** to `alpha-02`. No overlapping database leaks occur under Row-Level Security (RLS).
  *   **Result:** [ ] Pass  |  [ ] Fail  |  [ ] N/A  |  *Notes:* _______________________________________

---

## 📅 Section 6: Attendance Tracking & QR Code Automation
*Testing attendance taking, register updates, and QR scanner performance.*

- [ ] **TC-6.1: Manual Class Attendance Register**
  *   **Action:** Navigate to the **"Attendance"** module. Select Class "9th", Section "9-A", and current date. Click **"Load Register"**.
  *   **Expected:** All students enrolled in Class 9-A load inside a clean grid table.
  *   **Action:** Toggle status indicators for students (Present, Absent, Late). Click **"Submit Attendance"**.
  *   **Expected:** Attendance is stored. Summary percentages update instantly.
  *   **Result:** [ ] Pass  |  [ ] Fail  |  [ ] N/A  |  *Notes:* _______________________________________

- [ ] **TC-6.2: Attendance QR Code Scanning Verification**
  *   **Action:** Open the QR scanner interface. Generate/Print the QR Code for student Haris Khan. Present the QR code to the scanner.
  *   **Expected:** The scanner captures the input instantly, flashes a green success border, playing a confirmation tone, and registers the student's arrival timestamp in the attendance table.
  *   **Result:** [ ] Pass  |  [ ] Fail  |  [ ] N/A  |  *Notes:* _______________________________________

---

## 💵 Section 7: Fee Management, Invoices & Receipt Verification
*Testing fee generation, partial payments, discounts, arrears, and receipts.*

- [ ] **TC-7.1: Bulk Fee Voucher Generation**
  *   **Action:** Go to the **"Fees"** module. Select Class "9th", billing month (e.g., "May 2026"), and enter a base tuition fee (e.g., Rs. 5,000). Click **"Generate Invoices"**.
  *   **Expected:** Invoices are created for all students in the class. The base fee, previous unpaid arrears, and total outstanding balances are calculated.
  *   **Result:** [ ] Pass  |  [ ] Fail  |  [ ] N/A  |  *Notes:* _______________________________________

- [ ] **TC-7.2: Applying Custom Discounts**
  *   **Action:** Select a student's profile. Click **"Apply Discount"**. Apply a flat or percentage discount (e.g., 10% / Rs. 500 sibling discount). Save.
  *   **Expected:** The total outstanding balance updates to Rs. 4,500.
  *   **Result:** [ ] Pass  |  [ ] Fail  |  [ ] N/A  |  *Notes:* _______________________________________

- [ ] **TC-7.3: Recording Payments & Rolling Arrears**
  *   **Action:** Open the invoice for Haris Khan. Record a **Partial Payment** of Rs. 3,000. Submit.
  *   **Expected:** The system registers Rs. 3,000 as paid. The remaining Rs. 1,500 is flagged, saved as **"Rolling Arrears"**, and is automatically carried forward to next month's ledger.
  *   **Result:** [ ] Pass  |  [ ] Fail  |  [ ] N/A  |  *Notes:* _______________________________________

- [ ] **TC-7.4: Printing Professional Receipts**
  *   **Action:** Click **"Print Receipt"** for the recorded payment.
  *   **Expected:** A clean, compact, print-ready receipt preview launches, detailing the school name, student ID, payment breakdown, discount, paid amount, and remaining rolling arrears.
  *   **Result:** [ ] Pass  |  [ ] Fail  |  [ ] N/A  |  *Notes:* _______________________________________

---

## 🏆 Section 8: Gradebooks, Remarks & Printable Report Cards
*Testing marks entry, remarks persistence, grade boundaries, and print layouts.*

- [ ] **TC-8.1: Exam Term Setup & Marks Entry Grid**
  *   **Action:** Go to **"Academics"** > **"Gradebook"** (or **"Reports"**). Set exam term (e.g., "First Term 2026"). Select Class "9th", Subject "Mathematics". Click **"Enter Marks"**.
  *   **Expected:** A clean grading worksheet loads.
  *   **Action:** Enter Total Marks (e.g., 100), passing marks (33), and input obtained marks for students. Click **"Save Marks"**.
  *   **Expected:** Marks write successfully. Dynamic calculations immediately display grades (e.g., A+, B, F) based on standard percentage boundaries.
  *   **Result:** [ ] Pass  |  [ ] Fail  |  [ ] N/A  |  *Notes:* _______________________________________

- [ ] **TC-8.2: Persistent Teacher Remarks System**
  *   **Action:** Open a student's academic progress report. Locate the **"Remarks"** box. Type a descriptive note (e.g., *"Haris is highly motivated and excels in logic, but needs to work on algebraic formulas."*). Click **"Save Remarks"**.
  *   **Expected:** The remarks write to the database and persist securely.
  *   **Action:** Navigate to another screen, then return to verify the saved text loads perfectly in the input area.
  *   **Result:** [ ] Pass  |  [ ] Fail  |  [ ] N/A  |  *Notes:* _______________________________________

- [ ] **TC-8.3: Printable A4 Report Card Rendering**
  *   **Action:** Click **"Print Report Card / Result Card"** for a student.
  *   **Expected:** An elegant A4-optimized print window opens. It displays the school name, dynamic exam header, student information (father's name, roll no), a clean marks matrix table, custom grade badges, the saved teacher remarks, and signature lines.
  *   **Result:** [ ] Pass  |  [ ] Fail  |  [ ] N/A  |  *Notes:* _______________________________________

- [ ] **TC-8.4: Branded Transcript Report Footer Verification**
  *   **Action:** Inspect the very bottom margins of the printed report card preview sheet.
  *   **Expected:** A professional transcript validation statement displays at the base of the page:  
      **`Official transcript generated via KHR Educo Smart Platform`**
  *   **Result:** [ ] Pass  |  [ ] Fail  |  [ ] N/A  |  *Notes:* _______________________________________

---

## 👤 Section 9: Parent & Student Portal Access
*Testing credentials, dashboard view, and fee/result records.*

- [ ] **TC-9.1: Logging in as a Student**
  *   **Action:** Open the Portal Login. Select "Student Login" (or enter School ID + Student Credentials, e.g., Student Roll Number as username/password).
  *   **Expected:** Access is granted. The student dashboard loads.
  *   **Result:** [ ] Pass  |  [ ] Fail  |  [ ] N/A  |  *Notes:* _______________________________________

- [ ] **TC-9.2: Dashboard View & Co-Branded Footer**
  *   **Action:** Verify the layout structure of the Student Portal.
  *   **Expected:** The portal has a clean sidebar with a co-branding footer block at the bottom reading **`Matrix Academy PORTAL — Powered by KHR Educo`**.
  *   **Result:** [ ] Pass  |  [ ] Fail  |  [ ] N/A  |  *Notes:* _______________________________________

- [ ] **TC-9.3: Checking Fee Ledgers & Exam Results**
  *   **Action:** Navigate to **"My Fees"** and **"My Results"** tabs.
  *   **Expected:** Haris Khan's recorded partial payments, arrears history, and term exam marks / teacher remarks load accurately with zero delays.
  *   **Result:** [ ] Pass  |  [ ] Fail  |  [ ] N/A  |  *Notes:* _______________________________________

---

## 💬 Section 10: Automated WhatsApp & Notification Testing
*Testing template formatting and Meta Cloud WhatsApp API integrations.*

- [ ] **TC-10.1: Fee Payment Notification Delivery**
  *   **Action:** Navigate to the **"Fees"** module in the Admin Portal. Open a student's unpaid invoice. Record a payment. Click **"Send WhatsApp Receipt"**.
  *   **Expected:** The message delivers (or falls back to console logger if credentials are not configured).
  *   **Expected Message Structure:**  
      `Fee received! [Amount] for [Month] ([StudentName]). Remaining Balance: [Balance]. Thank you for your payment.`  
      `Payment processed. System secured by KHR Educo Support`  
      `- [School Name]`
  *   **Result:** [ ] Pass  |  [ ] Fail  |  [ ] N/A  |  *Notes:* _______________________________________

- [ ] **TC-10.2: Daily Absence Notification**
  *   **Action:** Take Class Attendance (as in TC-6.1). Mark a student as **Absent**. Click **"Submit & Notify Parents"**.
  *   **Expected:** The system generates and sends a parent-alert text matching:  
      `Dear Parent, this is to inform you that [StudentName] is ABSENT today ([Date]). Please ensure regular attendance.`  
      `- Regards, [School Name]`
  *   **Result:** [ ] Pass  |  [ ] Fail  |  [ ] N/A  |  *Notes:* _______________________________________

---

## 💾 Section 11: System Backups & Infrastructure
*Testing the everyday backup scripts and SQL logs.*

- [ ] **TC-11.1: Automated Database Backup Execution**
  *   **Action:** Open terminal/command prompt. Run the backup command or double-click **`daily_backup.bat`**.
  *   **Expected:** A command window opens, triggers `node backup_database.js`, reads the database table structures, compiles a compressed SQL schema & data dump file, and writes it with a timestamp inside your **`c:\Professional Projects\SAAS\backups\`** folder.
  *   **Result:** [ ] Pass  |  [ ] Fail  |  [ ] N/A  |  *Notes:* _______________________________________

---

## 📝 Tester's Summary Notes & Feedback

Use this area to write down any additional observations, minor UI layout adjustments, or custom features you want to add next:

*   __________________________________________________________________________________________
*   __________________________________________________________________________________________
*   __________________________________________________________________________________________
*   __________________________________________________________________________________________
*   __________________________________________________________________________________________
*   __________________________________________________________________________________________
*   __________________________________________________________________________________________
*   __________________________________________________________________________________________
*   __________________________________________________________________________________________
*   __________________________________________________________________________________________
