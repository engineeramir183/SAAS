const fs = require('fs');
const path = 'c:\\\\Professional Projects\\\\SAAS\\\\src\\\\admin\\\\tabs\\\\FeeTab.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add arrears calculation helper
const helperCode = `
const calculateArrears = (student, currentMonth, defaults) => {
    if (!student.feeHistory) return 0;
    const currentIdx = student.feeHistory.findIndex(h => h.month === currentMonth);
    // If not found or it's the first record, we could consider all records if currentMonth is newer?
    // Let's assume feeHistory is chronological or we can just sort by month.
    // For safety, let's just sum all records where month < currentMonth (alphabetically sortable if format is YYYY-MM, but here it's "May 2026", so maybe use index if it's there).
    // Actually, "openNewFeeMonth" pushes to the end. So index works.
    
    // We will just find all records that appear BEFORE currentMonth in the array
    let arrears = 0;
    for (let i = 0; i < student.feeHistory.length; i++) {
        const h = student.feeHistory[i];
        if (h.month === currentMonth) break; // Stop at current month
        
        const t = h.tuitionFee ?? defaults.tuitionFee ?? 1000;
        const a = h.admissionFee ?? defaults.admissionFee ?? 0;
        const an = h.annualFee ?? defaults.annualFee ?? 0;
        const ex = h.examFee ?? defaults.examFee ?? 0;
        const tr = h.transportFee ?? defaults.transportFee ?? 0;
        const la = h.labFee ?? defaults.labFee ?? 0;
        const late = h.lateFine ?? 0;
        const disc = h.discount ?? 0;
        const net = Number(t) + Number(a) + Number(an) + Number(ex) + Number(tr) + Number(la) + Number(late) - Number(disc);
        const paid = Number(h.paidAmount ?? (h.status === 'paid' ? net : 0));
        arrears += (net - paid);
    }
    return arrears > 0 ? arrears : 0;
};
`;

if (!content.includes('calculateArrears')) {
    content = content.replace(/const FeeModal =/, helperCode + '\nconst FeeModal =');
}

// 2. Update FeeModal to use arrears
content = content.replace(/const netPayable = baseTotal \+ Number\(formData\.lateFine\) - Number\(formData\.discount\);/, 
    `const previousArrears = calculateArrears(student, record.month, classDefaults);\n    const netPayable = baseTotal + Number(formData.lateFine) - Number(formData.discount) + previousArrears;`);

// 3. Show arrears in FeeModal UI
content = content.replace(/<div style=\{\{ display: 'flex', justifyContent: 'space-between', padding: '0\.75rem', background: '#f8fafc', borderRadius: '8px', marginTop: '1rem', fontWeight: 700 \}\}>\s*<span>Base Total:<\/span><span style=\{\{ color: '#1e3a8a' \}\}>\{currencySymbol\} \{baseTotal\}<\/span>\s*<\/div>/, 
    `<div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', marginTop: '1rem', fontWeight: 700 }}>
        <span>Base Total:</span><span style={{ color: '#1e3a8a' }}>{currencySymbol} {baseTotal}</span>
    </div>
    {previousArrears > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', marginTop: '0.5rem', fontWeight: 700 }}>
            <span style={{ color: '#dc2626' }}>Previous Arrears:</span><span style={{ color: '#dc2626' }}>+ {currencySymbol} {previousArrears}</span>
        </div>
    )}`);

// 4. Update generateReceiptHTML to use arrears
content = content.replace(/const generateReceiptHTML = \(student, h, localDefaults\) => \{/, `const generateReceiptHTML = (student, h, localDefaults) => {
        const previousArrears = calculateArrears(student, h.month, localDefaults);`);
        
content = content.replace(/const netPayable = \(tuition \+ admission \+ annual \+ exam \+ transport \+ lab\) \+ late - discount;/,
    `const netPayable = (tuition + admission + annual + exam + transport + lab) + late - discount + previousArrears;`);

content = content.replace(/\$\{Number\(discount\) > 0 \? \`<div style="font-size:12px; display:flex; justify-content:space-between; margin-bottom:4px; color:#16a34a;"><span>Concession<\/span> <span>- \$\{currencySymbol\} \$\{discount\}<\/span><\/div>\` : ''\}/,
    `\${Number(discount) > 0 ? \`<div style="font-size:12px; display:flex; justify-content:space-between; margin-bottom:4px; color:#16a34a;"><span>Concession</span> <span>- \${currencySymbol} \${discount}</span></div>\` : ''}
            \${previousArrears > 0 ? \`<div style="font-size:12px; display:flex; justify-content:space-between; margin-bottom:4px; color:#dc2626; font-weight:700;"><span>Previous Arrears</span> <span>+ \${currencySymbol} \${previousArrears}</span></div>\` : ''}`);

// 5. Add Class Fee Report Print
const printReportCode = `
    const printClassFeeReport = (month) => {
        let printHTML = \`<!DOCTYPE html><html><head><title>Class Fee Summary - \${selectedClass} - \${month}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
                body { font-family: 'Inter', sans-serif; padding: 30px; color: #1e293b; background: white; margin: 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background: #f1f5f9; padding: 12px; text-align: left; border: 1px solid #cbd5e1; font-weight: 700; font-size: 12px; text-transform: uppercase; }
                td { padding: 10px 12px; border: 1px solid #cbd5e1; font-size: 13px; }
                h2 { color: #1e3a8a; margin-top: 0; text-align: center; margin-bottom: 5px; }
                .summary { display: flex; justify-content: space-between; margin-top: 30px; border-top: 2px solid #e2e8f0; padding-top: 20px; font-weight: 700; font-size: 16px; }
                @media print { .btn-print { display: none; } body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
            </style></head>
            <body><button class="btn-print" onclick="window.print()" style="margin-bottom:20px; padding:10px 20px; background:#10b981; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">🖨️ Print Report</button>
            <div style="text-align:center; margin-bottom: 20px;">
                <h2>\${schoolName}</h2>
                <div style="font-size: 16px; font-weight: 600;">Monthly Fee Report - \${selectedClass} (\${month})</div>
            </div>
            <table>
                <thead><tr><th>Student</th><th>Current Fee</th><th>Arrears</th><th>Total Due</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead>
                <tbody>\`;
        
        let grandTotal = 0, grandPaid = 0, grandBalance = 0;

        classStudents.forEach((student) => {
            const h = (student.feeHistory || []).find(hf => hf.month === month) || { month, status: 'unpaid' };
            const previousArrears = calculateArrears(student, month, classDefaults);
            
            const t = h.tuitionFee ?? classDefaults.tuitionFee ?? 1000;
            const a = h.admissionFee ?? classDefaults.admissionFee ?? 0;
            const an = h.annualFee ?? classDefaults.annualFee ?? 0;
            const ex = h.examFee ?? classDefaults.examFee ?? 0;
            const tr = h.transportFee ?? classDefaults.transportFee ?? 0;
            const la = h.labFee ?? classDefaults.labFee ?? 0;
            const late = h.lateFine ?? 0;
            const disc = h.discount ?? 0;
            
            const currentFee = (t + a + an + ex + tr + la) + late - disc;
            const totalDue = currentFee + previousArrears;
            const paid = Number(h.paidAmount ?? (h.status === 'paid' ? totalDue : 0));
            const balance = totalDue - paid;
            
            grandTotal += totalDue;
            grandPaid += paid;
            grandBalance += balance;

            printHTML += \`<tr>
                <td><strong>\${student.name}</strong><br><span style="color:#64748b; font-size:11px;">\${student.id}</span></td>
                <td>\${currencySymbol} \${currentFee}</td>
                <td style="color:\${previousArrears > 0 ? '#dc2626' : 'inherit'}">\${currencySymbol} \${previousArrears}</td>
                <td style="font-weight:700">\${currencySymbol} \${totalDue}</td>
                <td style="color:#16a34a">\${currencySymbol} \${paid}</td>
                <td style="color:\${balance > 0 ? '#dc2626' : 'inherit'}; font-weight:700;">\${currencySymbol} \${balance}</td>
                <td><strong style="text-transform:uppercase; color:\${h.status === 'paid' ? '#16a34a' : (h.status === 'partial' ? '#b45309' : '#dc2626')};">\${h.status || 'unpaid'}</strong></td>
            </tr>\`;
        });
        
        printHTML += \`</tbody></table>
            <div class="summary">
                <div>Total Expected: \${currencySymbol} \${grandTotal}</div>
                <div style="color:#16a34a">Total Collected: \${currencySymbol} \${grandPaid}</div>
                <div style="color:#dc2626">Total Arrears: \${currencySymbol} \${grandBalance}</div>
            </div>
            <div style="margin-top: 30px; text-align: right; font-size: 12px; color: #64748b;">Generated Date: \${new Date().toLocaleDateString()}</div>
            </body></html>\`;
        
        const win = window.open('', '_blank');
        win.document.write(printHTML);
        win.document.close();
    };
`;

if (!content.includes('printClassFeeReport')) {
    content = content.replace(/const printDefaultersList = \(\) => \{/, printReportCode + '\n    const printDefaultersList = () => {');
}

// 6. Add Summary Report button to UI
content = content.replace(/<button onClick=\{\(\) => printBulkChallans\(month\)\}/, 
    `<button onClick={() => printClassFeeReport(month)} style={{ flex: 1, padding: '0.3rem', fontSize: '0.7rem', fontWeight: 700, background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}><Printer size={12}/> Report</button>
                                        <button onClick={() => printBulkChallans(month)}`);

fs.writeFileSync(path, content);
console.log('Done patching FeeTab.jsx');
