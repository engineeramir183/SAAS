with open('src/admin/tabs/ClassListsTab.jsx', 'rb') as f:
    lines = f.readlines()

out = []
for line in lines:
    if b'{(SECTIONS || []).map((sec, idx) => (' in line:
        indent = b'                            '
        out.append(indent + b'{(!SECTIONS || SECTIONS.length === 0) && (\r\n')
        out.append(indent + b'    <div style={{ textAlign: "center", padding: "2.5rem 1rem", background: "#f8fafc", border: "2px dashed #cbd5e1", borderRadius: "12px", color: "#64748b" }}>\r\n')
        out.append(indent + b'        <Layers size={36} style={{ margin: "0 auto 0.75rem", opacity: 0.4, color: "#3b82f6" }} />\r\n')
        out.append(indent + b'        <div style={{ fontWeight: 700, fontSize: "1rem", color: "#1e293b", marginBottom: "0.25rem" }}>No Sections Created Yet</div>\r\n')
        out.append(indent + b'        <p style={{ fontSize: "0.85rem", margin: 0 }}>Add your first section (e.g. "Primary Section", "Boys Wing", or "Section A") using the input above.</p>\r\n')
        out.append(indent + b'    </div>\r\n')
        out.append(indent + b')}\r\n')
        out.append(line)
    else:
        out.append(line)

with open('src/admin/tabs/ClassListsTab.jsx', 'wb') as f:
    f.writelines(out)

print("ClassListsTab successfully updated with empty state.")
