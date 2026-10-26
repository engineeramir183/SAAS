with open('src/context/SuperAdminContext.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('\r\n', '\n')

import_target = "import { hashPassword } from '../utils/crypto';"
import_replacement = """import { hashPassword } from '../utils/crypto';
import { clearAuthSession, getAuthSession } from '../utils/authSession';"""

init_target = "    const [isSuperAdmin, setIsSuperAdmin] = useState(false);"
init_replacement = """    const initialSuperAdmin = Boolean(getAuthSession()?.role === 'superadmin');
    const [isSuperAdmin, setIsSuperAdmin] = useState(initialSuperAdmin);"""

logout_target = """    const logoutSuperAdmin = () => {
        setIsSuperAdmin(false);
        setSchools([]);
    };"""

logout_replacement = """    const logoutSuperAdmin = () => {
        clearAuthSession();
        setIsSuperAdmin(false);
        setSchools([]);
    };"""

if import_target in text:
    text = text.replace(import_target, import_replacement, 1)
    print("Import added")
else:
    print("import_target not found")

if init_target in text:
    text = text.replace(init_target, init_replacement, 1)
    print("Init state updated")
else:
    print("init_target not found")

if logout_target in text:
    text = text.replace(logout_target, logout_replacement, 1)
    print("Logout updated")
else:
    print("logout_target not found")

with open('src/context/SuperAdminContext.jsx', 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(text)

print("Saved SuperAdminContext.jsx")
