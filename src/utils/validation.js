/**
 * Shared input validation utilities for the SAAS platform.
 *
 * Provides formatter/filter functions (used in onChange handlers to restrict keystrokes)
 * and validator functions (used before submit to check correctness).
 */

// ─── Name Validation ────────────────────────────────────────────────────────
// Allows only letters (including Urdu/Arabic Unicode block), spaces, and periods.
// Blocks numbers and special characters.

/** Strips any characters that aren't letters, spaces, or periods from a name. */
export const filterName = (value) =>
    (value || '').replace(/[^A-Za-z\u0600-\u06FF\s.]/g, '');

/** Returns an error string if the name is invalid, or '' if valid. */
export const validateName = (value, label = 'Name') => {
    const trimmed = (value || '').trim();
    if (!trimmed) return `${label} is required.`;
    if (trimmed.length < 2) return `${label} must be at least 2 characters.`;
    if (/[0-9]/.test(trimmed)) return `${label} must not contain numbers.`;
    if (/[^A-Za-z\u0600-\u06FF\s.]/.test(trimmed))
        return `${label} must not contain special characters.`;
    return '';
};


// ─── CNIC / B-Form Validation ───────────────────────────────────────────────
// Format: 35202-1234567-0  (5 digits, dash, 7 digits, dash, 1 digit) = 13 digits total

/**
 * Formats raw digits into the CNIC pattern (XXXXX-XXXXXXX-X) as the user types.
 * Also enforces a max of 13 digits and blocks non-digit characters.
 */
export const formatCNIC = (value) => {
    // Strip everything that isn't a digit
    const digits = (value || '').replace(/[^0-9]/g, '').slice(0, 13);
    if (digits.length <= 5) return digits;
    if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
};

/** Returns an error string if the CNIC is invalid, or '' if valid (empty is allowed). */
export const validateCNIC = (value, label = 'CNIC') => {
    const trimmed = (value || '').trim();
    if (!trimmed) return ''; // allow empty — not every form makes it required
    const digits = trimmed.replace(/[^0-9]/g, '');
    if (digits.length !== 13)
        return `${label} must be exactly 13 digits (format: XXXXX-XXXXXXX-X).`;
    if (!/^\d{5}-\d{7}-\d{1}$/.test(trimmed))
        return `${label} format must be XXXXX-XXXXXXX-X.`;
    return '';
};


// ─── Phone / Contact Number Validation ──────────────────────────────────────
// Pakistani mobile: starts with 03, total 11 digits. Auto-inserts dash after 4th digit.
// Format: 0300-1234567
// Also prevents repeating key-press runaway (e.g. typing zero repeatedly or runaway characters)

/**
 * Formats raw digits into the phone pattern (03XX-XXXXXXX) as the user types.
 * Enforces:
 * 1. Only digits allowed
 * 2. Must start strictly with '03'
 * 3. Max length: 11 digits (formatted length: 12 chars including dash)
 * 4. Prevents entering junk characters or holding down '0'
 */
export const formatPhone = (value) => {
    let digits = (value || '').replace(/[^0-9]/g, '');

    if (!digits) return '';

    // Enforce starting with 03
    if (digits.length === 1) {
        // If user typed '0', accept it. If user typed '3', auto-prepend '0'
        if (digits !== '0') {
            if (digits === '3') {
                digits = '03';
            } else {
                return ''; // Ignore invalid first digit
            }
        }
    } else if (digits.length >= 2) {
        if (!digits.startsWith('03')) {
            // If they typed something like '300...', auto prefix with '0'
            if (digits.startsWith('3')) {
                digits = ('0' + digits).slice(0, 11);
            } else {
                // If it starts with '0' but second digit isn't 3, keep only '0' or drop invalid
                digits = '03' + digits.slice(2);
            }
        }
    }

    // Limit to max 11 digits
    digits = digits.slice(0, 11);

    if (digits.length <= 4) return digits;
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
};

/** Returns an error string if the phone is invalid, or '' if valid (empty is allowed). */
export const validatePhone = (value, label = 'Contact number') => {
    const trimmed = (value || '').trim();
    if (!trimmed) return ''; // allow empty
    const digits = trimmed.replace(/[^0-9]/g, '');
    if (digits.length !== 11)
        return `${label} must be exactly 11 digits (e.g. 0300-1234567).`;
    if (!digits.startsWith('03'))
        return `${label} must start with 03 (e.g. 0300-1234567).`;
    if (!/^\d{4}-\d{7}$/.test(trimmed))
        return `${label} format must be 03XX-XXXXXXX.`;
    return '';
};


// ─── Nationality / Religion Validation ──────────────────────────────────────
// Letters and spaces only — no numbers, no special characters.

export const filterTextOnly = (value) =>
    (value || '').replace(/[^A-Za-z\u0600-\u06FF\s]/g, '');

export const validateTextOnly = (value, label = 'Field') => {
    const trimmed = (value || '').trim();
    if (!trimmed) return '';
    if (/[0-9]/.test(trimmed)) return `${label} must not contain numbers.`;
    if (/[^A-Za-z\u0600-\u06FF\s]/.test(trimmed))
        return `${label} must not contain special characters.`;
    return '';
};


// ─── Address Validation ─────────────────────────────────────────────────────
// Allow letters, digits, spaces, commas, periods, hashes, dashes, slashes.

export const filterAddress = (value) =>
    (value || '').replace(/[^A-Za-z0-9\u0600-\u06FF\s.,#/\-()]/g, '');


// ─── Duplicate CNIC / B-Form Check ──────────────────────────────────────────

/**
 * Checks if a CNIC/B-Form already exists among the students array.
 * @param {string} cnic  – The formatted CNIC to check
 * @param {Array}  students – The students list
 * @param {string} [excludeId] – Student ID to exclude (for edit mode)
 * @returns {string} Error message, or '' if no duplicate
 */
export const checkDuplicateCNIC = (cnic, students, excludeId = null) => {
    const trimmed = (cnic || '').trim();
    if (!trimmed) return '';
    const cleanCnic = trimmed.replace(/[^0-9]/g, '');
    if (cleanCnic.length < 5) return ''; // Don't check duplicates until meaningful input

    const match = (students || []).find(s => {
        if (excludeId && s.id === excludeId) return false;
        // Check admissions array (bForm)
        const adm = s.admissions?.[0] || {};
        const studentBForm = (adm.bForm || s.bForm || '').trim().replace(/[^0-9]/g, '');
        return studentBForm && studentBForm === cleanCnic;
    });

    if (match) {
        return `This B-Form/CNIC is already assigned to "${match.name}" (${match.grade || 'N/A'}). Two students cannot have the same CNIC/B-Form number.`;
    }
    return '';
};
