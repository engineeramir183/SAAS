with open('src/context/SchoolDataContext.jsx', 'rb') as f:
    content = f.read()

target = b'''            let loadedSections = metaMap['SECTIONS'] || [];
            if (!Array.isArray(loadedSections) || loadedSections.length === 0) {
                loadedSections = [
                    { id: "sec-a", name: "Section A", classes: currentClasses },
                    { id: "sec-b", name: "Section B", classes: currentClasses }
                ];
            } else {
                // Ensure all classes in currentClasses exist in at least one section so they are visible
                const assigned = new Set(loadedSections.flatMap(s => s.classes || []));
                const missing = currentClasses.filter(c => !assigned.has(c));
                if (missing.length > 0 && loadedSections.length > 0) {
                    loadedSections = loadedSections.map((s, idx) =>
                        idx === 0 ? { ...s, classes: [...(s.classes || []), ...missing] } : s
                    );
                }
            }
            setSections(loadedSections);'''

replacement = b'''            // Respect sections saved in database without forcing default Section A & B
            // If the user deletes all sections or leaves it empty, keep it empty.
            let loadedSections = metaMap['SECTIONS'];
            if (!Array.isArray(loadedSections)) {
                loadedSections = [];
            }
            setSections(loadedSections);'''

target_crlf = target.replace(b'\n', b'\r\n')
replacement_crlf = replacement.replace(b'\n', b'\r\n')

if target_crlf in content:
    content = content.replace(target_crlf, replacement_crlf, 1)
    with open('src/context/SchoolDataContext.jsx', 'wb') as f:
        f.write(content)
    print("SUCCESS: Updated loadedSections in SchoolDataContext.jsx")
else:
    print("ERROR: Target not found")
