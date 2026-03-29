import React, { useState } from 'react';
import { Save, Edit3, Trash2, Camera, PlusCircle, Users, DollarSign, Download, Printer, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../supabaseClient';

// Print Payslip Helper
function printPayslip(member, monthLabel, schoolName) {
    const pHistory = member.payroll_history || [];
    const payroll = pHistory.find(p => p.month === monthLabel);
    if (!payroll) {
        alert('No payroll record found for this month.');
        return;
    }

    const { base_salary, allowance, deduction, net_paid, paid_on } = payroll;
    const dateGenerated = new Date().toLocaleDateString();

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Payslip - ${member.name} - ${monthLabel}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
            body { font-family: 'Inter', sans-serif; background: #fff; color: #0f172a; padding: 40px; }
            .slip { max-width: 600px; margin: 0 auto; border: 2px solid #e2e8f0; border-radius: 12px; padding: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
            .header { text-align: center; border-bottom: 2px solid #1e3a5f; padding-bottom: 20px; margin-bottom: 20px; }
            .school { font-size: 24px; font-weight: 800; color: #1e3a5f; margin-bottom: 5px; }
            .title { font-size: 14px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; }
            .label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
            .value { font-size: 15px; font-weight: 700; color: #1e293b; }
            .calc-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .calc-table th { text-align: left; padding: 12px; font-size: 12px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; }
            .calc-table td { padding: 12px; font-size: 14px; font-weight: 600; color: #1e293b; border-bottom: 1px solid #f1f5f9; }
            .calc-table .amt { text-align: right; }
            .net-row td { font-size: 18px; font-weight: 800; color: #16a34a; background: #f0fdf4; border: none; }
            .footer { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 50px; text-align: center; }
            .sig-line { border-top: 1.5px solid #cbd5e1; padding-top: 8px; font-size: 12px; color: #64748b; font-weight: 600; }
            @media print { body { padding: 0; } .slip { box-shadow: none; border: none; } }
        </style>
    </head>
    <body>
        <div class="slip">
            <div class="header">
                <div class="school">${schoolName || 'School'}</div>
                <div class="title">Official Payslip - ${monthLabel}</div>
            </div>
            
            <div class="details-grid">
                <div><div class="label">Employee Name</div><div class="value">${member.name}</div></div>
                <div><div class="label">Designation</div><div class="value">${member.role || 'Staff'}</div></div>
                <div><div class="label">Department</div><div class="value">${member.department || 'General'}</div></div>
                <div><div class="label">Payment Status</div><div class="value" style="color: #16a34a;">PAID on ${paid_on}</div></div>
            </div>

            <table class="calc-table">
                <thead><tr><th>Earnings & Deductions</th><th class="amt">Amount</th></tr></thead>
                <tbody>
                    <tr><td>Basic Salary</td><td class="amt">${base_salary.toLocaleString()}</td></tr>
                    <tr><td>Allowances / Bonus</td><td class="amt" style="color:#2563eb;">+ ${allowance.toLocaleString()}</td></tr>
                    <tr><td>Deductions / Absents</td><td class="amt" style="color:#dc2626;">- ${deduction.toLocaleString()}</td></tr>
                    <tr class="net-row"><td>Net Salary Paid</td><td class="amt">${net_paid.toLocaleString()}</td></tr>
                </tbody>
            </table>

            <div class="footer">
                <div class="sig-line">Employer Signature</div>
                <div class="sig-line">Employee Signature</div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; font-size: 10px; color: #cbd5e1;">Generated on ${dateGenerated}</div>
        </div>
        <script>window.onload = () => { window.print(); }</script>
    </body>
    </html>
    `;
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
}


const FacultyTab = ({
    schoolData, editingFacultyId, setEditingFacultyId,
    tempFacultyMember, setTempFacultyMember,
    addFaculty, saveFaculty, deleteFaculty, facultyFileRef,
    fetchData, showSaveMessage
}) => {
    const [subTab, setSubTab] = useState('directory'); // directory, payroll
    
    // Payroll state
    const currentMonthLabel = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const [selectedMonth, setSelectedMonth] = useState(currentMonthLabel);
    const [payrollEdits, setPayrollEdits] = useState({});

    const facultyList = schoolData?.faculty || [];
    const schoolName = schoolData?.name || 'Your School';

    // Handle Payroll Processing
    const handleSavePayroll = async (memberId) => {
        const edits = payrollEdits[memberId] || {};
        const member = facultyList.find(m => m.id === memberId);
        if (!member) return;

        const baseSalary = edits.base_salary !== undefined ? Number(edits.base_salary) : Number(member.base_salary || 0);
        const allowance = edits.allowance !== undefined ? Number(edits.allowance) : 0;
        const deduction = edits.deduction !== undefined ? Number(edits.deduction) : 0;
        const netPaid = baseSalary + allowance - deduction;

        const history = [...(member.payroll_history || [])];
        const existingIdx = history.findIndex(h => h.month === selectedMonth);
        
        const newRecord = {
            month: selectedMonth,
            base_salary: baseSalary,
            allowance,
            deduction,
            net_paid: netPaid,
            paid_on: new Date().toLocaleDateString('en-CA'),
            status: 'paid'
        };

        if (existingIdx >= 0) {
            history[existingIdx] = newRecord;
        } else {
            history.push(newRecord);
        }

        // Update in Supabase
        const { error } = await supabase.from('faculty').update({
            base_salary: baseSalary, // updates their default
            payroll_history: history
        }).eq('id', memberId);

        if (!error) {
            showSaveMessage(`Paid ${netPaid} to ${member.name} for ${selectedMonth}!`);
            const clone = { ...payrollEdits };
            delete clone[memberId];
            setPayrollEdits(clone);
            fetchData();
        } else {
            alert('Failed to save payroll: ' + error.message);
        }
    };

    // Calculate dynamic net pay for UI
    const getNetPay = (memberId, base) => {
        const edits = payrollEdits[memberId] || {};
        const s = edits.base_salary !== undefined ? Number(edits.base_salary) : Number(base || 0);
        const a = edits.allowance !== undefined ? Number(edits.allowance) : 0;
        const d = edits.deduction !== undefined ? Number(edits.deduction) : 0;
        return s + a - d;
    };


    return (
        <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
            
            {/* ── HEADER & SUB-TABS ── */}
            <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 'var(--font-weight-bold)' }}>HR & Payroll</h2>
                    <p style={{ color: '#64748b' }}>Manage staff directory, salaries, and generate payslips.</p>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '0.4rem', borderRadius: '12px' }}>
                    <button 
                        onClick={() => setSubTab('directory')}
                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: subTab === 'directory' ? 'white' : 'transparent', color: subTab === 'directory' ? '#0f172a' : '#64748b', fontWeight: 600, boxShadow: subTab === 'directory' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s' }}>
                        <Users size={16} /> Directory
                    </button>
                    <button 
                        onClick={() => setSubTab('payroll')}
                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: subTab === 'payroll' ? 'white' : 'transparent', color: subTab === 'payroll' ? '#0f172a' : '#64748b', fontWeight: 600, boxShadow: subTab === 'payroll' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s' }}>
                        <DollarSign size={16} /> Payroll & Slips
                    </button>
                </div>
                
                {subTab === 'directory' && (
                    <button onClick={addFaculty} className="btn btn-primary">
                        <PlusCircle size={18} /> Add Staff
                    </button>
                )}
            </div>

            {/* ── SUB-TAB: DIRECTORY ── */}
            {subTab === 'directory' && (
                <>
                    {/* Add/Edit Form */}
                    {editingFacultyId && tempFacultyMember && (
                        <div className="card animate-fade-in" style={{ padding: '2rem', marginBottom: '2rem', border: '2px solid #2563eb', background: '#eff6ff' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: '#1e3a5f' }}>
                                {editingFacultyId === 'new' ? '✨ New Staff Member' : '✏ Edit Staff Profile'}
                            </h3>
                            <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '150px', height: '150px', borderRadius: '12px', overflow: 'hidden', background: '#fff', border: '2px dashed #94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {tempFacultyMember?.image
                                            ? <img src={tempFacultyMember.image} alt="Faculty" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <Camera size={40} color="#94a3b8" />}
                                    </div>
                                    <button onClick={() => facultyFileRef.current.click()} className="btn btn-sm" style={{ background: '#1e3a5f', color: 'white' }}>Upload Photo</button>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                                        <div>
                                            <label className="form-label">Full Name</label>
                                            <input type="text" className="form-input" value={tempFacultyMember.name || ''} onChange={e => setTempFacultyMember({ ...tempFacultyMember, name: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="form-label">Contact / Phone</label>
                                            <input type="text" className="form-input" placeholder="e.g. 0300-1234567" value={tempFacultyMember.phone || ''} onChange={e => setTempFacultyMember({ ...tempFacultyMember, phone: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                                        <div>
                                            <label className="form-label">Role / Designation</label>
                                            <input type="text" className="form-input" value={tempFacultyMember.role || ''} onChange={e => setTempFacultyMember({ ...tempFacultyMember, role: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="form-label">Department</label>
                                            <input type="text" className="form-input" value={tempFacultyMember.department || ''} onChange={e => setTempFacultyMember({ ...tempFacultyMember, department: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                                        <div>
                                            <label className="form-label">Joining Date</label>
                                            <input type="date" className="form-input" value={tempFacultyMember.joining_date || ''} onChange={e => setTempFacultyMember({ ...tempFacultyMember, joining_date: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="form-label">Base Salary (/month)</label>
                                            <input type="number" className="form-input" placeholder="0" value={tempFacultyMember.base_salary || ''} onChange={e => setTempFacultyMember({ ...tempFacultyMember, base_salary: e.target.value })} />
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2" style={{ marginTop: '1rem' }}>
                                        <button onClick={saveFaculty} className="btn btn-success" style={{ flex: 1 }}><Save size={18} /> Save Member</button>
                                        <button onClick={() => { setEditingFacultyId(null); setTempFacultyMember(null); }} className="btn" style={{ background: '#f1f5f9', color: '#64748b' }}>Cancel</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Directory Cards */}
                    {facultyList.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #cbd5e1' }}>
                            <Users size={48} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
                            <h3 style={{ fontSize: '1.25rem', color: '#475569', fontWeight: 700 }}>No Staff Added Yet</h3>
                            <p style={{ color: '#64748b' }}>Click "Add Staff" to build your HR directory.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3" style={{ gap: '1.5rem' }}>
                            {facultyList.map(member => (
                                <div key={member.id} className="card" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid #e2e8f0' }}>
                                            <img src={member.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=eff6ff&color=2563eb`} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>{member.name}</div>
                                            <div style={{ color: '#2563eb', fontWeight: 600, fontSize: '0.85rem' }}>{member.role || 'Staff'}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>{member.department || 'General Dept.'}</div>
                                        </div>
                                    </div>
                                    
                                    <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', color: '#475569', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span>📞 Contact:</span> <span style={{ fontWeight: 600 }}>{member.phone || 'N/A'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span>🗓 Joined:</span> <span style={{ fontWeight: 600 }}>{member.joining_date || 'N/A'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>💰 Base Salary:</span> <span style={{ fontWeight: 700, color: '#16a34a' }}>{member.base_salary ? member.base_salary.toLocaleString() : 'Not Set'}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                                        <button onClick={() => { setEditingFacultyId(member.id); setTempFacultyMember(member); }} className="btn btn-sm" style={{ background: '#f1f5f9', color: '#2563eb', flex: 1 }}><Edit3 size={15} /> Edit</button>
                                        <button onClick={() => deleteFaculty(member.id)} className="btn btn-sm" style={{ background: '#fef2f2', color: '#dc2626' }}><Trash2 size={15} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}


            {/* ── SUB-TAB: PAYROLL ── */}
            {subTab === 'payroll' && (
                <div className="animate-fade-in">
                    
                    <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, #1e3a5f, #0f172a)', color: 'white' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>Process Payroll</h3>
                                <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: 0 }}>Select a month to disburse salaries and generate slips.</p>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '8px' }}>
                                <select 
                                    className="form-input" 
                                    style={{ background: 'white', color: '#0f172a', border: 'none', fontWeight: 600, minWidth: '200px' }}
                                    value={selectedMonth} 
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                >
                                    {[...Array(6)].map((_, i) => {
                                        const d = new Date();
                                        d.setMonth(d.getMonth() - i);
                                        const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
                                        return <option key={label} value={label}>{label}</option>;
                                    })}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                        <th style={{ padding: '1rem', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase' }}>Staff Member</th>
                                        <th style={{ padding: '1rem', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase' }}>Base Salary</th>
                                        <th style={{ padding: '1rem', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase' }}>Bonus/Allowance</th>
                                        <th style={{ padding: '1rem', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase' }}>Deductions</th>
                                        <th style={{ padding: '1rem', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase' }}>Net Pay</th>
                                        <th style={{ padding: '1rem', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'center' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {facultyList.length === 0 && (
                                        <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No staff found.</td></tr>
                                    )}
                                    {facultyList.map(member => {
                                        const history = member.payroll_history || [];
                                        const isPaid = history.find(h => h.month === selectedMonth);

                                        if (isPaid) {
                                            // Render Paid View
                                            return (
                                                <tr key={member.id} style={{ borderBottom: '1px solid #f1f5f9', background: '#f0fdf4' }}>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{member.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{member.role}</div>
                                                    </td>
                                                    <td style={{ padding: '1rem', color: '#64748b', fontWeight: 600 }}>{isPaid.base_salary.toLocaleString()}</td>
                                                    <td style={{ padding: '1rem', color: '#2563eb', fontWeight: 600 }}>+{isPaid.allowance.toLocaleString()}</td>
                                                    <td style={{ padding: '1rem', color: '#ef4444', fontWeight: 600 }}>-{isPaid.deduction.toLocaleString()}</td>
                                                    <td style={{ padding: '1rem', color: '#16a34a', fontWeight: 800, fontSize: '1.1rem' }}>{isPaid.net_paid.toLocaleString()}</td>
                                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                            <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <CheckCircle size={14} /> Paid
                                                            </div>
                                                            <button 
                                                                onClick={() => printPayslip(member, selectedMonth, schoolName)}
                                                                className="btn btn-sm" style={{ background: '#1e3a5f', color: 'white', padding: '0.4rem 0.8rem' }} title="Print Payslip">
                                                                <Printer size={14} /> Slip
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }

                                        // Render Unpaid Form Input View
                                        const edits = payrollEdits[member.id] || {};
                                        return (
                                            <tr key={member.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{member.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{member.role}</div>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <input type="number" className="form-input" 
                                                        style={{ width: '100px', padding: '0.4rem', fontSize: '0.9rem' }} 
                                                        value={edits.base_salary !== undefined ? edits.base_salary : (member.base_salary || '')}
                                                        onChange={e => setPayrollEdits({...payrollEdits, [member.id]: { ...edits, base_salary: e.target.value }})}
                                                    />
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <input type="number" className="form-input" 
                                                        style={{ width: '90px', padding: '0.4rem', fontSize: '0.9rem', background: '#eff6ff', borderColor: '#bfdbfe' }} placeholder="0"
                                                        value={edits.allowance || ''}
                                                        onChange={e => setPayrollEdits({...payrollEdits, [member.id]: { ...edits, allowance: e.target.value }})}
                                                    />
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <input type="number" className="form-input" 
                                                        style={{ width: '90px', padding: '0.4rem', fontSize: '0.9rem', background: '#fef2f2', borderColor: '#fecaca' }} placeholder="0"
                                                        value={edits.deduction || ''}
                                                        onChange={e => setPayrollEdits({...payrollEdits, [member.id]: { ...edits, deduction: e.target.value }})}
                                                    />
                                                </td>
                                                <td style={{ padding: '1rem', color: '#0f172a', fontWeight: 800, fontSize: '1.1rem' }}>
                                                    {getNetPay(member.id, member.base_salary).toLocaleString()}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <button onClick={() => handleSavePayroll(member.id)} className="btn btn-sm" style={{ background: '#2563eb', color: 'white', width: '100%' }}>
                                                        Mark Paid
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacultyTab;
