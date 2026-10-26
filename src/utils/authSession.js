/**
 * Authentication & Session persistence utility
 * Manages active user sessions across page reloads and remembers school codes.
 */

const AUTH_STORAGE_KEY = 'saas_auth_session';
const SAVED_SCHOOL_KEY = 'saas_saved_school_code';

export const saveAuthSession = ({ role, schoolId, user, page }) => {
    try {
        const session = {
            role,         // 'admin' | 'student' | 'developer' | 'superadmin'
            schoolId,     // e.g. 'khr-107'
            user,         // user metadata or student object
            page,         // page to restore e.g. 'admin', 'portal', 'developer', 'superadmin'
            savedAt: Date.now()
        };
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
        if (schoolId) {
            saveSchoolCode(schoolId);
        }
    } catch (e) {
        console.error('Failed to save session to localStorage:', e);
    }
};

export const getAuthSession = () => {
    try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) {
        console.error('Failed to read session from localStorage:', e);
        return null;
    }
};

export const clearAuthSession = () => {
    try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
        console.error('Failed to clear session from localStorage:', e);
    }
};

export const saveSchoolCode = (schoolCode) => {
    try {
        if (schoolCode && schoolCode.trim()) {
            localStorage.setItem(SAVED_SCHOOL_KEY, schoolCode.trim().toLowerCase());
        }
    } catch (e) {
        console.error('Failed to save school code:', e);
    }
};

export const getSavedSchoolCode = () => {
    try {
        return localStorage.getItem(SAVED_SCHOOL_KEY) || '';
    } catch (e) {
        return '';
    }
};
