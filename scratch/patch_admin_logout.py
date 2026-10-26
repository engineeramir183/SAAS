with open('src/pages/AdminPortal.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('\r\n', '\n')

import_target = "import { validateName, validateCNIC, validatePhone, validateTextOnly, checkDuplicateCNIC } from '../utils/validation';"
import_replacement = """import { validateName, validateCNIC, validatePhone, validateTextOnly, checkDuplicateCNIC } from '../utils/validation';
import { clearAuthSession } from '../utils/authSession';"""

logout_target = """    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsAdmin(false);
        setCurrentPage('home');
    };"""

logout_replacement = """    const handleLogout = async () => {
        await supabase.auth.signOut();
        clearAuthSession();
        setIsAdmin(false);
        setCurrentPage('home');
    };"""

if import_target in text:
    text = text.replace(import_target, import_replacement, 1)
    print("Import added")
else:
    print("import_target not found")

if logout_target in text:
    text = text.replace(logout_target, logout_replacement, 1)
    print("Logout updated")
else:
    print("logout_target not found")

with open('src/pages/AdminPortal.jsx', 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(text)

print("Saved AdminPortal.jsx")
