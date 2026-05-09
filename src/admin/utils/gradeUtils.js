// ── Grade & Result Utility Functions ──
// Used across Gradebook, PDF Report, Student Report tabs.

export const calcGrade = (pct) => {
    if (pct === 'Absent' || pct === 'ABS' || pct === 'A') return 'Absent';
    if (pct === null || pct === undefined || pct === '') return '—';
    const num = Number(pct);
    if (isNaN(num)) return '—';
    if (num >= 95) return 'A++';
    if (num >= 90) return 'A+';
    if (num >= 85) return 'A';
    if (num >= 80) return 'B++';
    if (num >= 75) return 'B+';
    if (num >= 70) return 'B';
    if (num >= 60) return 'C';
    if (num >= 50) return 'D';
    if (num >= 40) return 'E';
    return 'U';
};

export const gradeColor = (pct) => {
    if (pct === 'Absent' || pct === 'ABS' || pct === 'A') return { bg: '#f3f4f6', text: '#4b5563', border: '#cbd5e1' };
    if (pct === null || pct === undefined || pct === '') return { bg: '#f8fafc', text: '#64748b', border: '#cbd5e1' };
    const num = Number(pct);
    if (isNaN(num)) return { bg: '#f8fafc', text: '#64748b', border: '#cbd5e1' };
    if (num >= 95) return { bg: '#f5f3ff', text: '#6d28d9', border: '#1e293b' }; // A++ (Violet)
    if (num >= 90) return { bg: '#f3e8ff', text: '#7c3aed', border: '#1e293b' }; // A+ (Purple)
    if (num >= 85) return { bg: '#ecfdf5', text: '#059669', border: '#1e293b' }; // A (Emerald)
    if (num >= 80) return { bg: '#f0fdf4', text: '#16a34a', border: '#1e293b' }; // B++ (Green)
    if (num >= 75) return { bg: '#f0fdfa', text: '#0d9488', border: '#1e293b' }; // B+ (Teal)
    if (num >= 70) return { bg: '#eff6ff', text: '#2563eb', border: '#1e293b' }; // B (Blue)
    if (num >= 60) return { bg: '#fef3c7', text: '#b45309', border: '#1e293b' }; // C (Amber)
    if (num >= 50) return { bg: '#fffbeb', text: '#d97706', border: '#1e293b' }; // D (Yellow)
    if (num >= 40) return { bg: '#fff7ed', text: '#ea580c', border: '#1e293b' }; // E (Orange)
    return { bg: '#fee2e2', text: '#dc2626', border: '#1e293b' }; // U (Red)
};

export const getGradeRemark = (grade) => {
    switch (grade) {
        case 'A++': return 'Absolutely Outstanding! Your dedication and hard work truly paid off. Keep up the amazing effort! Incredible achievement! ';
        case 'A+': return 'Excellent work! Fantastic results';
        case 'A': return 'Adorable!';
        case 'B++': return 'Great job';
        case 'B+': return 'Well done!';
        case 'B': return 'Good progress. Keep it up! You have potential to do even better!';
        case 'C': return 'Satisfactory! Don’t be discouraged! DO More';
        case 'D': return 'Don’t give up! We’re here to help you';
        case 'E': return 'Performance needs serious improvement. Strong effort and consistent support are urgently needed. We believe in your potential—let’s work together to improve.!';
        case 'U': return 'Unsatisfactory!';
        case 'Absent': return 'Absent';
        default: return '';
    }
};

export const calcOverallPct = (results, getSubjectTotal) => {
    if (!results || results.length === 0) return 0;
    let totalObtained = 0, totalMax = 0;
    results.forEach(r => {
        const subTotal = getSubjectTotal(r.subject, r.term);
        let obtained = r.obtained;
        if (obtained === undefined) obtained = Math.round((r.percentage / 100) * subTotal);
        const numObtained = obtained === 'A' ? 0 : Number(obtained);
        totalObtained += numObtained;
        totalMax += subTotal;
    });
    return totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
};

export const getTermResults = (student, termLabel) =>
    (student.results || []).filter(r => r.term === termLabel);

export const filterByGender = (studentsList, genderTab) => {
    if (genderTab === 'all') return studentsList;
    const genderVal = genderTab === 'boys' ? 'Male' : 'Female';
    return studentsList.filter(s => s.admissions?.[0]?.gender === genderVal);
};
