with open('src/pages/Login.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('\r\n', '\n')

# 1. Add imports for authSession
import_target = "import { hashPassword } from '../utils/crypto';"
import_replacement = """import { hashPassword } from '../utils/crypto';
import { saveAuthSession, saveSchoolCode, getSavedSchoolCode } from '../utils/authSession';"""

# 2. Update initial credentials state to auto-fill saved school code or ?school= param
cred_target = "    const [credentials, setCredentials] = useState({ schoolCode: '', username: '', password: '' });"
cred_replacement = """    const urlSchool = new URLSearchParams(window.location.search).get('school') || '';
    const rememberedSchool = getSavedSchoolCode() || urlSchool || '';

    const [credentials, setCredentials] = useState({
        schoolCode: rememberedSchool,
        username: '',
        password: ''
    });"""

# 3. SuperAdmin save
superadmin_target = """                if (result.success) {
                    setCurrentPage('superadmin');"""
superadmin_replacement = """                if (result.success) {
                    saveAuthSession({ role: 'superadmin', page: 'superadmin' });
                    setCurrentPage('superadmin');"""

# 4. Developer save
dev_target = """            if (devUser && devPass && username === devUser && password === devPass) {
                setIsDeveloper(true);
                setCurrentPage('developer');
                return;
            }"""
dev_replacement = """            if (devUser && devPass && username === devUser && password === devPass) {
                setIsDeveloper(true);
                saveAuthSession({ role: 'developer', page: 'developer' });
                setCurrentPage('developer');
                return;
            }"""

# 5. Admin save
admin_target = """            if (adminData) {
                setActiveSchoolId(sid);
                setIsAdmin(true);
                setCurrentPage('admin');"""
admin_replacement = """            if (adminData) {
                saveSchoolCode(sid);
                saveAuthSession({ role: 'admin', schoolId: sid, user: { username }, page: 'admin' });
                setActiveSchoolId(sid);
                setIsAdmin(true);
                setCurrentPage('admin');"""

# 6. Student save
student_target = """            if (studentData) {
                setActiveSchoolId(sid);
                setIsLoggedIn(true);
                setLoggedInStudent(studentData);
                setCurrentPage('portal');"""
student_replacement = """            if (studentData) {
                saveSchoolCode(sid);
                saveAuthSession({ role: 'student', schoolId: sid, user: studentData, page: 'portal' });
                setActiveSchoolId(sid);
                setIsLoggedIn(true);
                setLoggedInStudent(studentData);
                setCurrentPage('portal');"""

if import_target in text:
    text = text.replace(import_target, import_replacement, 1)
    print("Imports added")
else:
    print("import_target not found")

if cred_target in text:
    text = text.replace(cred_target, cred_replacement, 1)
    print("Credentials updated")
else:
    print("cred_target not found")

if superadmin_target in text:
    text = text.replace(superadmin_target, superadmin_replacement, 1)
    print("Superadmin updated")
else:
    print("superadmin_target not found")

if dev_target in text:
    text = text.replace(dev_target, dev_replacement, 1)
    print("Dev updated")
else:
    print("dev_target not found")

if admin_target in text:
    text = text.replace(admin_target, admin_replacement, 1)
    print("Admin updated")
else:
    print("admin_target not found")

if student_target in text:
    text = text.replace(student_target, student_replacement, 1)
    print("Student updated")
else:
    print("student_target not found")

with open('src/pages/Login.jsx', 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(text)

print("Saved Login.jsx")
