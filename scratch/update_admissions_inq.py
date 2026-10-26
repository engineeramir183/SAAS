with open('src/admin/tabs/AdmissionsTab.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('\r\n', '\n')

old_inquiry_save = '''    const handleSaveInquiry = () => {
        if (!inquiryData.studentName.trim() || !inquiryData.contact.trim()) {
            alert("Student Name and Contact are required.");
            return;
        }'''

new_inquiry_save = '''    const handleSaveInquiry = () => {
        const sNameErr = validateName(inquiryData.studentName, 'Student Name');
        if (sNameErr) {
            alert(sNameErr);
            return;
        }

        if (inquiryData.fatherName && inquiryData.fatherName.trim()) {
            const fNameErr = validateName(inquiryData.fatherName, 'Parent / Guardian Name');
            if (fNameErr) {
                alert(fNameErr);
                return;
            }
        }

        const phoneErr = validatePhone(inquiryData.contact, 'Contact Number');
        if (phoneErr) {
            alert(phoneErr);
            return;
        }'''

old_blank_save = '''    const handleSaveAndPrintBlankForm = () => {
        if (!inquiryData.studentName.trim() || !inquiryData.contact.trim()) {
            alert("Student Name and Contact are required.");
            return;
        }'''

new_blank_save = '''    const handleSaveAndPrintBlankForm = () => {
        const sNameErr = validateName(inquiryData.studentName, 'Student Name');
        if (sNameErr) { alert(sNameErr); return; }
        const phoneErr = validatePhone(inquiryData.contact, 'Contact Number');
        if (phoneErr) { alert(phoneErr); return; }'''

old_voucher_save = '''    const handleSaveAndGenerateVoucher = () => {
        if (!inquiryData.studentName.trim() || !inquiryData.contact.trim()) {
            alert("Student Name and Contact are required.");
            return;
        }'''

new_voucher_save = '''    const handleSaveAndGenerateVoucher = () => {
        const sNameErr = validateName(inquiryData.studentName, 'Student Name');
        if (sNameErr) { alert(sNameErr); return; }
        const phoneErr = validatePhone(inquiryData.contact, 'Contact Number');
        if (phoneErr) { alert(phoneErr); return; }'''

if old_inquiry_save in text:
    text = text.replace(old_inquiry_save, new_inquiry_save, 1)
    text = text.replace(old_blank_save, new_blank_save, 1)
    text = text.replace(old_voucher_save, new_voucher_save, 1)
    with open('src/admin/tabs/AdmissionsTab.jsx', 'w', encoding='utf-8', newline='\r\n') as f:
        f.write(text)
    print("Updated AdmissionsTab inquiry validations successfully")
else:
    print("Could not find old_inquiry_save")
