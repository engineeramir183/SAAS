import re

with open('src/pages/AdminPortal.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = '''    // --- ADMISSION FORM PRINTING & SAVING ---
    const printAdmissionForm = async () => {
        const d = admissionData;

        if (!d.studentName.trim()) {
            alert("Please enter Student Name first!");
            return;
        }'''

replacement = '''    // --- ADMISSION FORM PRINTING & SAVING ---
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
        }'''

# Replace ignoring line endings differences
text_normalized = text.replace('\r\n', '\n')
target_normalized = target.replace('\r\n', '\n')
replacement_normalized = replacement.replace('\r\n', '\n')

if target_normalized in text_normalized:
    text_normalized = text_normalized.replace(target_normalized, replacement_normalized, 1)
    with open('src/pages/AdminPortal.jsx', 'w', encoding='utf-8', newline='\r\n') as f:
        f.write(text_normalized)
    print('Updated printAdmissionForm successfully')
else:
    print('Target not found')
