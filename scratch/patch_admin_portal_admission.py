with open('src/pages/AdminPortal.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('\r\n', '\n')

# 1. Add isSavingAdmission state
target_state = "    const [admissionData, setAdmissionData] = useState(admissionInitialState);"
replacement_state = """    const [admissionData, setAdmissionData] = useState(admissionInitialState);
    const [isSavingAdmission, setIsSavingAdmission] = useState(false);"""

# 2. Update printAdmissionForm
target_func = '''    // --- ADMISSION FORM PRINTING & SAVING ---
    const printAdmissionForm = async () => {
        const d = admissionData;

        // Validations
        const nameErr = validateName(d.studentName, "Student's Name");
        if (nameErr) {
            alert(nameErr);
            return;
        }

        if (d.bForm && d.bForm.trim()) {
            const bErr = validateCNIC(d.bForm, 'B-Form / CNIC');
            if (bErr) {
                alert(bErr);
                return;
            }
            const dupErr = checkDuplicateCNIC(d.bForm, students);
            if (dupErr) {
                alert(dupErr);
                return;
            }
        }

        if (d.fatherName && d.fatherName.trim()) {
            const fnErr = validateName(d.fatherName, "Father's Name");
            if (fnErr) {
                alert(fnErr);
                return;
            }
        }

        if (d.fatherCnic && d.fatherCnic.trim()) {
            const fcErr = validateCNIC(d.fatherCnic, "Father's CNIC");
            if (fcErr) {
                alert(fcErr);
                return;
            }
        }

        if (d.contact && d.contact.trim()) {
            const cErr = validatePhone(d.contact, 'Contact Number');
            if (cErr) {
                alert(cErr);
                return;
            }
        }

        if (d.whatsapp && d.whatsapp.trim()) {
            const wErr = validatePhone(d.whatsapp, 'WhatsApp Number');
            if (wErr) {
                alert(wErr);
                return;
            }
        }

        // 1. Save to Supabase
        try {
            // Generate a temporary ID. The database trigger will replace this with a real sequential ID.
            let studentId = `TEMP-${Date.now()}`;

            // Auto-assign serial number — globally unique across ALL students
            let autoSerial = d.serialNumber ? d.serialNumber : null;
            if (!autoSerial) {
                const classStart = CLASS_SERIAL_STARTS?.[d.applyingFor];
                if (classStart !== undefined && classStart !== null) {
                    // Floor: start from class starting serial (or 1 below it)
                    const floor = parseInt(classStart, 10) - 1;
                    // Find the highest serial across ALL students in the entire college
                    const globalMaxSerial = students.reduce((max, s) => {
                        const sn = parseInt(s.serialNumber, 10);
                        return !isNaN(sn) ? Math.max(max, sn) : max;
                    }, floor);
                    // New serial = max(floor, globalMax) + 1
                    autoSerial = String(Math.max(floor, globalMaxSerial) + 1);
                }
            }
            // Also validate if admin manually entered a serial — block duplicates
            if (autoSerial && students.some(s => String(s.serialNumber) === String(autoSerial))) {
                alert(`Serial number ${autoSerial} is already in use by another student. Please assign a unique serial number.`);
                return;
            }

            const newStudentRecord = {
                id: studentId,
                serial_number: autoSerial || null,
                name: d.studentName,
                password: (schoolSettings?.school_id?.split('-')[0]?.toLowerCase() || 'pass') + Math.floor(1000 + Math.random() * 9000),
                grade: d.applyingFor,
                image: d.photo,
                admissions: [d],
                school_id: currentSchoolId
            };

            const { error } = await supabase.from('students').insert([newStudentRecord]);

            if (error) throw error;

            await fetchData(); // Refresh local state
            ActivityLogService.logActivity({
                schoolId: currentSchoolId,
                username: adminCredentials.username || 'admin',
                role: 'admin',
                action: 'Register Student',
                targetName: `${d.studentName} (ID: ${studentId})`,
                details: { class: d.applyingFor, serial: autoSerial }
            });
            showSaveMessage(`Student ${d.studentName} saved with ID: ${studentId}${autoSerial ? ` (Serial: ${autoSerial})` : ''}`);

            // WhatsApp Automation: Welcome Message
            if (schoolSettings?.auto_admission_alert) {
                const welcomeMsg = WhatsAppTemplates.admissionWelcome(d.studentName, studentId, schoolName);
                sendWhatsAppMessage(d.whatsapp, welcomeMsg, schoolSettings);
            }
        } catch (error) {
            console.error("Error saving admission:", error.message);
            alert("Error saving to database, but printing will continue: " + error.message);
        }

        // 2. Print Logic

        // Helper to create boxed character spans
        const boxChars = (str, length) => {
            const chars = (str || '').replace(/[^A-Z0-9 ]/gi, '').toUpperCase().split('');
            let html = '';
            for (let i = 0; i < length; i++) {
                html += `<span class="cbox">${chars[i] === ' ' ? '&nbsp;' : (chars[i] || '')}</span>`;
            }
            return html;
        };


        // 2. Print Logic
        const html = buildAdmissionFormHTML(d);
        const printWin = window.open('', '_blank');
        if (!printWin) {
            alert('Popup blocked! Please allow popups for this site to print the admission form.');
            return;
        }
        printWin.document.write(`<!DOCTYPE html><html><head><title>Admission Form - ${d.studentName || 'New Student'}</title><style>${ADMISSION_FORM_CSS}</style></head><body onload="setTimeout(()=>{window.print();},600)"><div class="no-print" style="text-align:center;padding:14px 20px;background:#0f172a;border-bottom:3px solid #1e293b;display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;"><span style="color:white;font-weight:700;font-size:13px;">📄 To save as PDF: change <strong>Destination</strong> to <em>"Save as PDF"</em> in the print dialog</span><button onclick="window.print()" style="padding:9px 22px;background:white;color:#0f172a;border:none;border-radius:8px;cursor:pointer;font-weight:800;font-size:13px;">🖨️ Print / Save as PDF</button></div>${html}</body></html>`);
        printWin.document.close();
    };'''

replacement_func = '''    // --- ADMISSION FORM PRINTING & SAVING ---
    const printAdmissionForm = async () => {
        if (isSavingAdmission) return; // Prevent double-clicking / duplicate submissions

        const d = { ...admissionData };
        // Ensure class is selected (fallback to first available class if empty)
        const targetClass = d.applyingFor || sectionClasses[0] || (CLASSES && CLASSES[0]) || '';
        d.applyingFor = targetClass;

        // Validations
        const nameErr = validateName(d.studentName, "Student's Name");
        if (nameErr) {
            alert(nameErr);
            return;
        }

        if (d.bForm && d.bForm.trim()) {
            const bErr = validateCNIC(d.bForm, 'B-Form / CNIC');
            if (bErr) {
                alert(bErr);
                return;
            }
            const dupErr = checkDuplicateCNIC(d.bForm, students);
            if (dupErr) {
                alert(dupErr);
                return;
            }
        }

        if (d.fatherName && d.fatherName.trim()) {
            const fnErr = validateName(d.fatherName, "Father's Name");
            if (fnErr) {
                alert(fnErr);
                return;
            }
        }

        if (d.fatherCnic && d.fatherCnic.trim()) {
            const fcErr = validateCNIC(d.fatherCnic, "Father's CNIC");
            if (fcErr) {
                alert(fcErr);
                return;
            }
        }

        if (d.contact && d.contact.trim()) {
            const cErr = validatePhone(d.contact, 'Contact Number');
            if (cErr) {
                alert(cErr);
                return;
            }
        }

        if (d.whatsapp && d.whatsapp.trim()) {
            const wErr = validatePhone(d.whatsapp, 'WhatsApp Number');
            if (wErr) {
                alert(wErr);
                return;
            }
        }

        setIsSavingAdmission(true);

        // 1. Save to Supabase
        try {
            // Generate a temporary ID. The database trigger will replace this with a real sequential ID.
            let studentId = `TEMP-${Date.now()}`;

            // Auto-assign serial number — globally unique across ALL students
            let autoSerial = d.serialNumber ? d.serialNumber : null;
            if (!autoSerial) {
                const classStart = CLASS_SERIAL_STARTS?.[targetClass];
                if (classStart !== undefined && classStart !== null) {
                    const floor = parseInt(classStart, 10) - 1;
                    const globalMaxSerial = students.reduce((max, s) => {
                        const sn = parseInt(s.serialNumber, 10);
                        return !isNaN(sn) ? Math.max(max, sn) : max;
                    }, floor);
                    autoSerial = String(Math.max(floor, globalMaxSerial) + 1);
                }
            }
            // Also validate if admin manually entered a serial — block duplicates
            if (autoSerial && students.some(s => String(s.serialNumber) === String(autoSerial))) {
                alert(`Serial number ${autoSerial} is already in use by another student. Please assign a unique serial number.`);
                setIsSavingAdmission(false);
                return;
            }

            d.serialNumber = autoSerial || d.serialNumber || '';

            const newStudentRecord = {
                id: studentId,
                serial_number: autoSerial || null,
                name: d.studentName,
                password: (schoolSettings?.school_id?.split('-')[0]?.toLowerCase() || 'pass') + Math.floor(1000 + Math.random() * 9000),
                grade: targetClass,
                image: d.photo,
                admissions: [d],
                school_id: currentSchoolId
            };

            const { data: savedRows, error } = await supabase.from('students').insert([newStudentRecord]).select();

            if (error) throw error;

            const savedStudent = savedRows && savedRows[0] ? savedRows[0] : newStudentRecord;
            const finalId = savedStudent.id || studentId;

            await fetchData(); // Refresh local state
            ActivityLogService.logActivity({
                schoolId: currentSchoolId,
                username: adminCredentials.username || 'admin',
                role: 'admin',
                action: 'Register Student',
                targetName: `${d.studentName} (ID: ${finalId})`,
                details: { class: targetClass, serial: autoSerial }
            });

            // WhatsApp Automation: Welcome Message
            if (schoolSettings?.auto_admission_alert) {
                const welcomeMsg = WhatsAppTemplates.admissionWelcome(d.studentName, finalId, schoolName);
                sendWhatsAppMessage(d.whatsapp, welcomeMsg, schoolSettings);
            }

            // 2. Print Logic (using captured d)
            const html = buildAdmissionFormHTML(d);
            const printWin = window.open('', '_blank');
            if (printWin) {
                printWin.document.write(`<!DOCTYPE html><html><head><title>Admission Form - ${d.studentName || 'New Student'}</title><style>${ADMISSION_FORM_CSS}</style></head><body onload="setTimeout(()=>{window.print();},600)"><div class="no-print" style="text-align:center;padding:14px 20px;background:#0f172a;border-bottom:3px solid #1e293b;display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;"><span style="color:white;font-weight:700;font-size:13px;">📄 To save as PDF: change <strong>Destination</strong> to <em>"Save as PDF"</em> in the print dialog</span><button onclick="window.print()" style="padding:9px 22px;background:white;color:#0f172a;border:none;border-radius:8px;cursor:pointer;font-weight:800;font-size:13px;">🖨️ Print / Save as PDF</button></div>${html}</body></html>`);
                printWin.document.close();
            }

            // 3. Clear form and provide positive system evaluation (UI feedback)
            setAdmissionData({
                ...admissionInitialState,
                applyingFor: targetClass
            });
            showSaveMessage(`✅ Student ${d.studentName} successfully registered in "${targetClass}"! ID: ${finalId}`);
            alert(`✅ Student "${d.studentName}" has been successfully admitted and added to Class "${targetClass}"!\n\nID: ${finalId}\nSerial: ${autoSerial || 'N/A'}\n\nThe form data has been cleared for the next entry.`);

            // Navigate to Class view to directly show the newly registered student in their class
            setViewingClass(targetClass);
            setActiveTab('classes');
        } catch (error) {
            console.error("Error saving admission:", error.message);
            alert("Error saving student to database: " + error.message);
        } finally {
            setIsSavingAdmission(false);
        }
    };'''

# 3. Pass isSavingAdmission to AdmissionsTab
target_tab_props = '''                                        admissionData={admissionData} setAdmissionData={setAdmissionData}
                                        admissionInitialState={admissionInitialState}
                                        printAdmissionForm={printAdmissionForm}'''

replacement_tab_props = '''                                        admissionData={admissionData} setAdmissionData={setAdmissionData}
                                        admissionInitialState={admissionInitialState}
                                        printAdmissionForm={printAdmissionForm}
                                        isSavingAdmission={isSavingAdmission}'''

if target_state in text:
    text = text.replace(target_state, replacement_state, 1)
    print("State replaced")
else:
    print("target_state not found")

if target_func in text:
    text = text.replace(target_func, replacement_func, 1)
    print("Function replaced")
else:
    print("target_func not found")

if target_tab_props in text:
    text = text.replace(target_tab_props, replacement_tab_props, 1)
    print("Tab props replaced")
else:
    print("target_tab_props not found")

with open('src/pages/AdminPortal.jsx', 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(text)

print("Saved AdminPortal.jsx")
