with open('src/pages/AdminPortal.jsx', 'rb') as f:
    content = f.read()

target = b'''        if (d.bForm && d.bForm.trim()) {
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
        }'''

replacement = b'''        // B-Form / CNIC is strictly COMPULSORY and unique key
        const bErr = validateCNIC(d.bForm, 'Student B-Form / CNIC', true);
        if (bErr) {
            alert(bErr);
            return;
        }
        const dupErr = checkDuplicateCNIC(d.bForm, students);
        if (dupErr) {
            alert(dupErr);
            return;
        }'''

target_crlf = target.replace(b'\n', b'\r\n')
replacement_crlf = replacement.replace(b'\n', b'\r\n')

if target_crlf in content:
    content = content.replace(target_crlf, replacement_crlf, 1)
    with open('src/pages/AdminPortal.jsx', 'wb') as f:
        f.write(content)
    print("SUCCESS")
else:
    print("Target not found")
