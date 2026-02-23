/**
 * Fix Script: Replace all hardcoded localhost:5000 URLs with env variable
 * Run: node fix-localhost-urls.cjs
 */
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'Frontend', 'src');
let fixedFiles = 0;
let totalReplacements = 0;

function processDir(dir) {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && entry !== 'node_modules') {
            processDir(fullPath);
        } else if (entry.endsWith('.jsx') || entry.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('http://localhost:5000')) {
                let newContent = content;
                let count = 0;

                // Case 1: Single-quoted full URL strings
                // 'http://localhost:5000/api/some/path'  -> `${ENV}/some/path`
                newContent = newContent.replace(
                    /'http:\/\/localhost:5000\/api([^']*)'/g,
                    (match, urlPath) => {
                        count++;
                        return `\`\${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}${urlPath}\``;
                    }
                );

                // Case 2: Template literal URLs (backtick-wrapped)
                // `http://localhost:5000/api/some/${var}` -> `${ENV}/some/${var}`
                newContent = newContent.replace(
                    /`http:\/\/localhost:5000\/api([^`]*)`/g,
                    (match, urlPath) => {
                        count++;
                        return `\`\${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}${urlPath}\``;
                    }
                );

                if (newContent !== content) {
                    fs.writeFileSync(fullPath, newContent, 'utf8');
                    fixedFiles++;
                    totalReplacements += count;
                    const relativePath = fullPath.replace(srcDir, '').replace(/\\/g, '/');
                    console.log(`✅ Fixed (${count} URLs): ${relativePath}`);
                }
            }
        }
    }
}

console.log('🔧 Scanning for hardcoded localhost URLs...\n');
processDir(srcDir);
console.log(`\n✅ Done! Fixed ${totalReplacements} URLs across ${fixedFiles} files.`);
