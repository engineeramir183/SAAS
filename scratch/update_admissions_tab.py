with open('src/admin/tabs/AdmissionsTab.jsx', 'rb') as f:
    content = f.read()

# Update B-Form field in AdmissionsTab.jsx
old_bform = b'''                                <div>
                                    <label className="form-label">National ID / B-Form Number</label>
                                    <input type="text" className="form-input" placeholder="e.g. 35202-0000000-0" value={admissionData.bForm}
                                        onChange={e => {
                                             const formatted = formatCNIC(e.target.value);
                                             update('bForm', formatted);
                                             const err = validateCNIC(formatted, 'B-Form');
                                             err ? setError('bForm', err) : clearError('bForm');
                                             // Check duplicate
                                             if (!err && formatted.length === 15) {
                                                 const dup = checkDuplicateCNIC(formatted, students);
                                                 dup ? setError('bForm', dup) : clearError('bForm');
                                             }
                                         }}
                                        maxLength={15}
                                        style={errors.bForm ? { borderColor: '#dc2626' } : {}}
                                    />
                                    <FieldError field="bForm" />
                                </div>'''

new_bform = b'''                                <div>
                                    <label className="form-label">
                                        National ID / B-Form Number <span style={{ color: '#dc2626', fontWeight: 800 }}>* (Required / Unique Key)</span>
                                    </label>
                                    <input type="text" className="form-input" placeholder="e.g. 35202-0000000-0" value={admissionData.bForm}
                                        onChange={e => {
                                            const formatted = formatCNIC(e.target.value);
                                            update('bForm', formatted);
                                            const err = validateCNIC(formatted, 'Student B-Form / CNIC', true);
                                            if (err) {
                                                setError('bForm', err);
                                            } else {
                                                const dup = checkDuplicateCNIC(formatted, students);
                                                dup ? setError('bForm', dup) : clearError('bForm');
                                            }
                                        }}
                                        onBlur={e => {
                                            const err = validateCNIC(e.target.value, 'Student B-Form / CNIC', true);
                                            if (err) setError('bForm', err);
                                        }}
                                        maxLength={15}
                                        style={errors.bForm ? { borderColor: '#dc2626' } : {}}
                                    />
                                    <FieldError field="bForm" />
                                </div>'''

# Update button with Loader2 and instant feedback
old_button = b'''                            <button
                                onClick={printAdmissionForm}
                                disabled={isSavingAdmission}
                                className="btn btn-primary"
                                style={{
                                    background: isSavingAdmission ? '#65a30d' : '#4d7c0f',
                                    borderColor: '#4d7c0f',
                                    opacity: isSavingAdmission ? 0.75 : 1,
                                    cursor: isSavingAdmission ? 'not-allowed' : 'pointer'
                                }}
                            >
                                <Save size={18} /> {isSavingAdmission ? 'Saving Student...' : 'Save & Print Form'}
                            </button>'''

new_button = b'''                            <button
                                type="button"
                                onClick={printAdmissionForm}
                                disabled={isSavingAdmission}
                                className="btn btn-primary"
                                style={{
                                    background: isSavingAdmission ? '#65a30d' : '#4d7c0f',
                                    borderColor: '#4d7c0f',
                                    opacity: isSavingAdmission ? 0.8 : 1,
                                    cursor: isSavingAdmission ? 'not-allowed' : 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'all 0.2s ease-in-out'
                                }}
                            >
                                {isSavingAdmission ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" /> Saving & Admitting Student...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} /> Save & Print Form
                                    </>
                                )}
                            </button>'''

# Add Loader2 to lucide imports
old_import = b'''import { Save, Trash2, Camera, User, Users, Award, CheckCircle, Printer, ChevronDown, X, ClipboardList, Clipboard, CheckCircle2, FileText } from 'lucide-react';'''
new_import = b'''import { Save, Trash2, Camera, User, Users, Award, CheckCircle, Printer, ChevronDown, X, ClipboardList, Clipboard, CheckCircle2, FileText, Loader2 } from 'lucide-react';'''

old_bform_crlf = old_bform.replace(b'\n', b'\r\n')
new_bform_crlf = new_bform.replace(b'\n', b'\r\n')
old_button_crlf = old_button.replace(b'\n', b'\r\n')
new_button_crlf = new_button.replace(b'\n', b'\r\n')
old_import_crlf = old_import.replace(b'\n', b'\r\n')
new_import_crlf = new_import.replace(b'\n', b'\r\n')

changes = 0
if old_import_crlf in content:
    content = content.replace(old_import_crlf, new_import_crlf, 1)
    changes += 1

if old_bform_crlf in content:
    content = content.replace(old_bform_crlf, new_bform_crlf, 1)
    changes += 1
else:
    print("old_bform not found directly, checking normalized spaces")

if old_button_crlf in content:
    content = content.replace(old_button_crlf, new_button_crlf, 1)
    changes += 1

with open('src/admin/tabs/AdmissionsTab.jsx', 'wb') as f:
    f.write(content)

print(f"AdmissionsTab updated with {changes} changes.")
