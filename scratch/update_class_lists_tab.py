with open('src/admin/tabs/ClassListsTab.jsx', 'rb') as f:
    content = f.read()

# 1. Add Layers to lucide-react import
old_import = b"import { ChevronRight, Upload, Download, PlusCircle, Users, Edit3, Trash2, GripVertical, ChevronUp, ChevronDown, X, Hash, Check, Settings } from 'lucide-react';"
new_import = b"import { ChevronRight, Upload, Download, PlusCircle, Users, Edit3, Trash2, GripVertical, ChevronUp, ChevronDown, X, Hash, Check, Settings, Layers } from 'lucide-react';"

# 2. Add empty state for sections and empty state for when no section is selected
old_section_block = b'''                        {/* Section tabs */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                            {(SECTIONS || []).map((sec, idx) => ('''

new_section_block = b'''                        {/* Section tabs */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                            {(!SECTIONS || SECTIONS.length === 0) && (
                                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '12px', color: '#64748b' }}>
                                    <Layers size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4, color: '#3b82f6' }} />
                                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b', marginBottom: '0.25rem' }}>No Sections Created Yet</div>
                                    <p style={{ fontSize: '0.85rem', margin: 0 }}>Add your first section (e.g. "Primary Section", "Boys Wing", or "Section A") using the input above.</p>
                                </div>
                            )}
                            {(SECTIONS || []).map((sec, idx) => ('''

old_import_crlf = old_import.replace(b'\n', b'\r\n')
new_import_crlf = new_import.replace(b'\n', b'\r\n')
old_sec_crlf = old_section_block.replace(b'\n', b'\r\n')
new_sec_crlf = new_section_block.replace(b'\n', b'\r\n')

changes = 0
if old_import_crlf in content:
    content = content.replace(old_import_crlf, new_import_crlf, 1)
    changes += 1

if old_sec_crlf in content:
    content = content.replace(old_sec_crlf, new_sec_crlf, 1)
    changes += 1
else:
    print("old_sec_crlf not found directly")

with open('src/admin/tabs/ClassListsTab.jsx', 'wb') as f:
    f.write(content)

print(f"Updated ClassListsTab with {changes} changes.")
