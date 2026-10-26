with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('\r\n', '\n')

import_target = "import SchoolRegistrationForm from './pages/SchoolRegistrationForm';"
import_replacement = """import SchoolRegistrationForm from './pages/SchoolRegistrationForm';
import { getAuthSession, clearAuthSession, saveAuthSession } from './utils/authSession';"""

initial_state_target = """    // Priority: ?page= param → school home → SaaS landing
    const getInitialPage = () => {
        if (initialPage) return initialPage;   // direct deep-link
        if (isSaaSMode)  return 'saas';
        return 'home';
    };

    const [currentPage,     setCurrentPage]     = useState(getInitialPage());

    const [isLoggedIn,      setIsLoggedIn]      = useState(false);
    const [isAdmin,         setIsAdmin]         = useState(false);
    const [isDeveloper,     setIsDeveloper]     = useState(false);

    const [loggedInStudent, setLoggedInStudent] = useState(null);

    // ── Active school (tenant) ────────────────────────────────────────────────
    // Uses the ?school= URL parameter by default. If none, points to SaaS mode.
    const [activeSchoolId, setActiveSchoolId] = useState(initialSchool || null);"""

initial_state_replacement = """    // Check if we have a persisted session in localStorage
    const savedSession = getAuthSession();

    // Priority: saved active session -> ?page= param -> school home -> SaaS landing
    const getInitialPage = () => {
        if (savedSession && savedSession.page) {
            // Restore session page (e.g. admin, portal, developer, superadmin)
            return savedSession.page;
        }
        if (initialPage) return initialPage;   // direct deep-link
        if (isSaaSMode)  return 'saas';
        return 'home';
    };

    const [currentPage,     setCurrentPage]     = useState(getInitialPage());

    const [isLoggedIn,      setIsLoggedIn]      = useState(Boolean(savedSession?.role === 'student'));
    const [isAdmin,         setIsAdmin]         = useState(Boolean(savedSession?.role === 'admin'));
    const [isDeveloper,     setIsDeveloper]     = useState(Boolean(savedSession?.role === 'developer'));

    const [loggedInStudent, setLoggedInStudent] = useState(savedSession?.role === 'student' ? savedSession.user : null);

    // ── Active school (tenant) ────────────────────────────────────────────────
    // Uses saved session school ID, or URL parameter, or null
    const [activeSchoolId, setActiveSchoolId] = useState(
        savedSession?.schoolId || initialSchool || null
    );"""

if import_target in text:
    text = text.replace(import_target, import_replacement, 1)
    print("Import added")
else:
    print("import_target not found")

if initial_state_target in text:
    text = text.replace(initial_state_target, initial_state_replacement, 1)
    print("Initial state updated")
else:
    print("initial_state_target not found")

with open('src/App.jsx', 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(text)

print("Saved App.jsx")
