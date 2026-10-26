with open('src/context/SchoolDataContext.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('\r\n', '\n')

target = '''            setSections(metaMap['SECTIONS'] || []);'''

replacement = '''            let loadedSections = metaMap['SECTIONS'] || [];
            if (!Array.isArray(loadedSections) || loadedSections.length === 0) {
                loadedSections = [
                    { id: "sec-a", name: "Section A", classes: currentClasses },
                    { id: "sec-b", name: "Section B", classes: currentClasses }
                ];
            }
            setSections(loadedSections);'''

if target in text:
    text = text.replace(target, replacement, 1)
    with open('src/context/SchoolDataContext.jsx', 'w', encoding='utf-8', newline='\r\n') as f:
        f.write(text)
    print("Updated SchoolDataContext sections fallback successfully")
else:
    print("Target not found in SchoolDataContext")
