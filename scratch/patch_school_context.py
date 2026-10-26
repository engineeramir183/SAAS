with open('src/context/SchoolDataContext.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('\r\n', '\n')

old_code = '''            let loadedSections = metaMap['SECTIONS'] || [];
            if (!Array.isArray(loadedSections) || loadedSections.length === 0) {
                loadedSections = [
                    { id: "sec-a", name: "Section A", classes: currentClasses },
                    { id: "sec-b", name: "Section B", classes: currentClasses }
                ];
            }
            setSections(loadedSections);'''

new_code = '''            let loadedSections = metaMap['SECTIONS'] || [];
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

if old_code in text:
    text = text.replace(old_code, new_code, 1)
    with open('src/context/SchoolDataContext.jsx', 'w', encoding='utf-8', newline='\r\n') as f:
        f.write(text)
    print("Updated SchoolDataContext sections self-healing successfully")
else:
    print("Could not find old_code in SchoolDataContext")
