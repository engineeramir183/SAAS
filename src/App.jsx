import React, { useState } from 'react';
import { SuperAdminProvider } from './context/SuperAdminContext';
import { SchoolDataProvider } from './context/SchoolDataContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Faculty from './pages/Faculty';
import Facilities from './pages/Facilities';
import Contact from './pages/Contact';
import Login from './pages/Login';
import StudentPortal from './pages/StudentPortal';
import AdminPortal from './pages/AdminPortal';
import DeveloperPanel from './pages/DeveloperPanel';
import Blog from './pages/Blog';
import WhatsAppButton from './components/WhatsAppButton';
import SuperAdminPortal from './pages/SuperAdminPortal';
import SaaSLanding from './pages/SaaSLanding';
import SchoolRegistrationForm from './pages/SchoolRegistrationForm';

// ─────────────────────────────────────────────────────────────────────────────
// App — Multi-Tenant SaaS Edition
//
// activeSchoolId controls which tenant's data is loaded.
// It defaults to 'acs-001' so the existing school works without any change.
//
// Provider hierarchy:
//   SuperAdminProvider   (platform-level: school registry, super auth)
//     └── SchoolDataProvider(schoolId)  (tenant-level: all school data)
//           └── App UI
// ─────────────────────────────────────────────────────────────────────────────

function App() {
    const searchParams = new URLSearchParams(window.location.search);
    const initialSchool = searchParams.get('school');
    const initialPage   = searchParams.get('page');   // e.g. ?page=login
    const isSaaSMode = !initialSchool;

    // Priority: ?page= param → school home → SaaS landing
    const getInitialPage = () => {
        if (initialPage) return initialPage;   // direct deep-link
        if (isSaaSMode)  return 'saas';
        return 'home';
    };

    const [currentPage,     setCurrentPage]     = useState(getInitialPage());

    const [isLoggedIn,      setIsLoggedIn]      = useState(false);
    const [isAdmin,         setIsAdmin]         = useState(false);
    const [isDeveloper,     setIsDeveloper]     = useState(false);
    const [isSuperAdminPage, setIsSuperAdminPage] = useState(false);
    const [loggedInStudent, setLoggedInStudent] = useState(null);

    // ── Active school (tenant) ────────────────────────────────────────────────
    // Uses the ?school= URL parameter by default. If none, points to SaaS mode.
    const [activeSchoolId, setActiveSchoolId] = useState(initialSchool || null);

    const renderPage = () => {
        switch (currentPage) {
            case 'saas':
                return <SaaSLanding setCurrentPage={setCurrentPage} />;
            case 'home':
                return <Home setCurrentPage={setCurrentPage} />;
            case 'about':
                return <About />;
            case 'faculty':
                return <Faculty isDeveloper={isDeveloper} />;
            case 'facilities':
                return <Facilities />;
            case 'contact':
                return <Contact />;
            case 'blog':
                return <Blog />;
            case 'login':
                return (
                    <Login
                        setIsLoggedIn={setIsLoggedIn}
                        setIsAdmin={setIsAdmin}
                        setIsDeveloper={setIsDeveloper}
                        setIsSuperAdminPage={setIsSuperAdminPage}
                        setCurrentPage={setCurrentPage}
                        setLoggedInStudent={setLoggedInStudent}
                        setActiveSchoolId={setActiveSchoolId}
                    />
                );
            case 'portal':
                return (
                    <StudentPortal
                        student={loggedInStudent}
                        setIsLoggedIn={setIsLoggedIn}
                        setCurrentPage={setCurrentPage}
                        setLoggedInStudent={setLoggedInStudent}
                    />
                );
            case 'admin':
                return (
                    <AdminPortal
                        setIsAdmin={setIsAdmin}
                        setCurrentPage={setCurrentPage}
                    />
                );
            case 'developer':
                return (
                    <DeveloperPanel
                        setIsDeveloper={setIsDeveloper}
                        setCurrentPage={setCurrentPage}
                    />
                );
            case 'superadmin':
                return (
                    <SuperAdminPortal
                        setCurrentPage={setCurrentPage}
                        setIsSuperAdminPage={setIsSuperAdminPage}
                    />
                );
            case 'register':
                return (
                    <SchoolRegistrationForm
                        setCurrentPage={setCurrentPage}
                    />
                );
            default:
                return <Home setCurrentPage={setCurrentPage} />;
        }
    };

    const isDashboard = ['portal', 'admin', 'developer', 'superadmin'].includes(currentPage);

    // Don't render school navigation elements on the SaaS, SuperAdmin, Login, or Register pages
    const hideTenantFrame = currentPage === 'saas' || currentPage === 'superadmin' || currentPage === 'login' || currentPage === 'register';

    return (
        // SuperAdminProvider wraps everything — it manages the school registry
        <SuperAdminProvider>
            {/*
              SchoolDataProvider receives activeSchoolId.
              Whenever a user logs in with a different school code,
              activeSchoolId changes → Provider re-fetches for that tenant.
            */}
            <SchoolDataProvider schoolId={activeSchoolId || 'acs-001'}>
                <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                    
                    {!hideTenantFrame && (
                        <Navbar
                            currentPage={currentPage}
                            setCurrentPage={setCurrentPage}
                            isLoggedIn={isLoggedIn}
                            isAdmin={isAdmin}
                            isDeveloper={isDeveloper}
                        />
                    )}

                    <main style={{ flex: 1, display: isDashboard ? 'flex' : 'block', flexDirection: 'column' }}>
                        {renderPage()}
                    </main>

                    {(!isDashboard && !hideTenantFrame) && <Footer />}
                    {!hideTenantFrame && <WhatsAppButton />}
                </div>
            </SchoolDataProvider>
        </SuperAdminProvider>
    );
}

export default App;
