with open('src/pages/StudentPortal.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('\r\n', '\n')

import_target = "import NotificationPermissionBanner from '../components/NotificationPermissionBanner';"
import_replacement = """import NotificationPermissionBanner from '../components/NotificationPermissionBanner';
import { clearAuthSession } from '../utils/authSession';"""

logout_target = """    const handleLogout = () => {
        setIsLoggedIn(false);
        setLoggedInStudent(null);
        setCurrentPage('home');
    };"""

logout_replacement = """    const handleLogout = () => {
        clearAuthSession();
        setIsLoggedIn(false);
        setLoggedInStudent(null);
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

with open('src/pages/StudentPortal.jsx', 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(text)

print("Saved StudentPortal.jsx")
