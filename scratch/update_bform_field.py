with open('src/admin/tabs/AdmissionsTab.jsx', 'rb') as f:
    lines = f.readlines()

out = []
i = 0
while i < len(lines):
    line = lines[i]
    if b'<label className="form-label">National ID / B-Form Number</label>' in line:
        out.append(b'                                    <label className="form-label">\r\n')
        out.append(b'                                        National ID / B-Form Number <span style={{ color: "#dc2626", fontWeight: 800 }}>* (Required / Unique Key)</span>\r\n')
        out.append(b'                                    </label>\r\n')
        # next line is input
        i += 1
        out.append(lines[i]) # <input type="text"...
        i += 1 # onChange start
        out.append(b'                                        onChange={e => {\r\n')
        out.append(b'                                            const formatted = formatCNIC(e.target.value);\r\n')
        out.append(b'                                            update("bForm", formatted);\r\n')
        out.append(b'                                            const err = validateCNIC(formatted, "Student B-Form / CNIC", true);\r\n')
        out.append(b'                                            if (err) {\r\n')
        out.append(b'                                                setError("bForm", err);\r\n')
        out.append(b'                                            } else {\r\n')
        out.append(b'                                                const dup = checkDuplicateCNIC(formatted, students);\r\n')
        out.append(b'                                                dup ? setError("bForm", dup) : clearError("bForm");\r\n')
        out.append(b'                                            }\r\n')
        out.append(b'                                        }}\r\n')
        out.append(b'                                        onBlur={e => {\r\n')
        out.append(b'                                            const err = validateCNIC(e.target.value, "Student B-Form / CNIC", true);\r\n')
        out.append(b'                                            if (err) setError("bForm", err);\r\n')
        out.append(b'                                        }}\r\n')
        # skip lines until maxLength
        while i < len(lines) and b'maxLength={15}' not in lines[i]:
            i += 1
        out.append(lines[i]) # maxLength={15}
        i += 1
    else:
        out.append(line)
        i += 1

with open('src/admin/tabs/AdmissionsTab.jsx', 'wb') as f:
    f.writelines(out)

print("Updated bform field in AdmissionsTab.jsx")
