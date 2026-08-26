import fs from 'fs';
import path from 'path';

const dir = './';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const metaTag = '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>';

for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');

    if (!content.includes('viewport-fit=cover')) {
        // try to replace existing first
        if (content.match(/<meta name="viewport"[^>]*>/i)) {
            content = content.replace(/<meta name="viewport"[^>]*>/i, metaTag);
        } else {
            content = content.replace('<head>', '<head>\n    ' + metaTag);
        }
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
    }
}
