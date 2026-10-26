with open('src/pages/DeveloperPanel.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('\r\n', '\n')

import_target = "import { supabase } from '../supabaseClient';"
import_replacement = """import { supabase } from '../supabaseClient';
import { clearAuthSession } from '../utils/authSession';"""

logout_target = """    const handleLogout = () => {
        setIsDeveloper(false);
        setCurrentPage('home');
    };"""

logout_replacement = """    const handleLogout = () => {
        clearAuthSession();
        setIsDeveloper(false);
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

with open('src/pages/DeveloperPanel.jsx', 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(text)

print("Saved DeveloperPanel.jsx")
