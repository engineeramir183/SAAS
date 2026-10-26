with open('src/context/SchoolDataContext.jsx', 'rb') as f:
    content = f.read()

target = b'''            const defaultSections = [
                { id: "sec-a", name: "Section A", classes: LOCAL_CLASSES },
                { id: "sec-b", name: "Section B", classes: LOCAL_CLASSES }
            ];

            await Promise.all([
                _upsertMeta('CLASSES', LOCAL_CLASSES),
                _upsertMeta('SUBJECTS', defaultSubjects),
                _upsertMeta('TERMS', defaultTerms),
                _upsertMeta('SECTIONS', defaultSections),'''

replacement = b'''            // Default sections start empty - user defines sections explicitly
            const defaultSections = [];

            await Promise.all([
                _upsertMeta('CLASSES', LOCAL_CLASSES),
                _upsertMeta('SUBJECTS', defaultSubjects),
                _upsertMeta('TERMS', defaultTerms),
                _upsertMeta('SECTIONS', defaultSections),'''

target_crlf = target.replace(b'\n', b'\r\n')
replacement_crlf = replacement.replace(b'\n', b'\r\n')

if target_crlf in content:
    content = content.replace(target_crlf, replacement_crlf, 1)
    with open('src/context/SchoolDataContext.jsx', 'wb') as f:
        f.write(content)
    print("SUCCESS: Updated onboarding defaultSections in SchoolDataContext.jsx")
else:
    print("ERROR: Target not found")
