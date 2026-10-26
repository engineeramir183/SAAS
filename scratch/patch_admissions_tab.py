with open('src/admin/tabs/AdmissionsTab.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('\r\n', '\n')

# 1. Accept isSavingAdmission prop
target_props = '''const AdmissionsTab = ({
    admissionData, setAdmissionData, admissionInitialState,
    printAdmissionForm, printAdmissionFormBulk, printBlankAdmissionForm,
    handleAdmissionPhotoUpload, photoFileRef,
    sectionClasses = [], students = [],
    INQUIRIES = [], saveInquiry, deleteInquiry
}) => {'''

replacement_props = '''const AdmissionsTab = ({
    admissionData, setAdmissionData, admissionInitialState,
    printAdmissionForm, printAdmissionFormBulk, printBlankAdmissionForm,
    handleAdmissionPhotoUpload, photoFileRef,
    sectionClasses = [], students = [],
    INQUIRIES = [], saveInquiry, deleteInquiry,
    isSavingAdmission = false
}) => {'''

# 2. Update Save & Print Form button to show disabled state and spinner / loading text
target_btn = '''                            <button onClick={printAdmissionForm} className="btn btn-primary" style={{ background: '#4d7c0f', borderColor: '#4d7c0f' }}>
                                <Save size={18} /> Save &amp; Print Form
                            </button>'''

replacement_btn = '''                            <button
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

# 3. Enhance class selector fallback: if sectionClasses is empty or doesn't have classes, allow typing or fallback
target_select = '''                                <select className="form-input" value={admissionData.applyingFor} onChange={e => update('applyingFor', e.target.value)}>
                                    {sectionClasses.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>'''

replacement_select = '''                                <select
                                    className="form-input"
                                    value={admissionData.applyingFor || sectionClasses[0] || ''}
                                    onChange={e => update('applyingFor', e.target.value)}
                                    style={{ fontWeight: 600 }}
                                >
                                    {sectionClasses.map(c => <option key={c} value={c}>{c}</option>)}
                                    {admissionData.applyingFor && !sectionClasses.includes(admissionData.applyingFor) && (
                                        <option value={admissionData.applyingFor}>{admissionData.applyingFor}</option>
                                    )}
                                </select>'''

if target_props in text:
    text = text.replace(target_props, replacement_props, 1)
    print("Props updated")
else:
    print("target_props not found")

if target_btn in text:
    text = text.replace(target_btn, replacement_btn, 1)
    print("Btn updated")
else:
    print("target_btn not found")

if target_select in text:
    text = text.replace(target_select, replacement_select, 1)
    print("Select updated")
else:
    print("target_select not found")

with open('src/admin/tabs/AdmissionsTab.jsx', 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(text)

print("Saved AdmissionsTab.jsx")
