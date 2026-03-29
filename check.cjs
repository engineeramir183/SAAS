const fs = require('fs');
const path = require('path');

function checkDir(dir) {
    let missingFound = false;
    const files = fs.readdirSync(dir, { withFileTypes: true });

    files.forEach(file => {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
            if (checkDir(fullPath)) missingFound = true;
        } else if (file.name.endsWith('.jsx')) {
            const code = fs.readFileSync(fullPath, 'utf8');

            const importMatch = code.match(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/);
            let importedLucide = [];
            if (importMatch) {
                importedLucide = importMatch[1].split(',').map(i => i.split(' as ')[0].trim());
            }

            const tagRegex = /<([A-Z][a-zA-Z0-9]*)/g;
            let match;
            const tags = new Set();
            while ((match = tagRegex.exec(code)) !== null) {
                tags.add(match[1]);
            }

            const nativeElements = new Set(['Fragment', 'Date', 'Math', 'URL', 'Array', 'String', 'Object', 'Promise']);
            
            const missing = [...tags].filter(tag => {
                if (importedLucide.includes(tag)) return false;
                if (code.includes(`const ${tag} `) || code.includes(`let ${tag} `) || code.includes(`function ${tag}`) || code.includes(`class ${tag}`)) return false;
                if (code.includes(`import ${tag}`)) return false;
                if (code.includes(`import { ${tag}`)) return false;
                if (code.includes(`import {${tag}`)) return false;
                if (code.includes(`import {  ${tag}`)) return false;
                const altImport = new RegExp(`import\\s+\\{[^}]*\\b${tag}\\b[^}]*\\}`);
                if (altImport.test(code)) return false;
                if (nativeElements.has(tag)) return false;
                return true;
            });

            if (missing.length > 0) {
                console.log(`${file.name}: possibly missing imports: ${missing.join(', ')}`);
                missingFound = true;
            }
        }
    });
    return missingFound;
}

checkDir('C:/Professional Projects/SAAS/src');
