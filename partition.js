const fs = require('fs');
const path = require('path');

const css = fs.readFileSync('assets/css/index_inline.css', 'utf8');
const sections = css.split(/\/\*\s*={10,}\s*\n/);

const filemap = {
    'main.css': ['DESIGN TOKENS', 'RESET & BASE', 'TYPOGRAPHY SCALE', 'LAYOUT UTILITIES'],
    'animations.css': ['REVEAL ANIMATIONS'],
    'responsive.css': ['RESPONSIVE'],
    'components.css': ['BUTTONS', 'IMAGE PLACEHOLDERS', 'NAVIGATION', 'SOCIAL PROOF STRIP', 'ROTATING TESTIMONIAL TICKER', 'PRODUCTS', 'COMPARISON TABLE', 'TESTIMONIALS', 'FAQ', 'GUARANTEE', 'FINAL CTA', 'FOOTER'],
    'index.css': ['HERO', 'PROBLEM SECTION', 'SOLUTION SECTION', 'BUNDLE SECTION', 'BONUS / HIGH-TICKET', 'ABOUT / FOUNDERS']
};

const output = {
    'main.css': '',
    'components.css': '',
    'animations.css': '',
    'responsive.css': '',
    'index.css': '',
    'bundle.css': ''
};

for (let i = 1; i < sections.length; i++) {
    const content = sections[i];
    const titleMatch = content.match(/\s*([^\n]+)\s*\n\s*={10,}\s*\*\//);
    if (titleMatch) {
        const title = titleMatch[1].trim();
        let found = false;
        let block = `/* ============================================================\n   ${title}\n============================================================ */\n` + content.substring(titleMatch[0].length);

        for (const [filename, titles] of Object.entries(filemap)) {
            if (titles.includes(title)) {
                output[filename] += block + '\n';
                found = true;
                break;
            }
        }
        if (!found) {
            console.log('Unmapped section:', title, 'appending to index.css');
            output['index.css'] += block + '\n';
        }
    }
}

for (const [filename, content] of Object.entries(output)) {
    if (content) {
        fs.writeFileSync(path.join('assets', 'css', filename), content.trim() + '\n');
        console.log(`Wrote ${filename} (${content.length} chars)`);
    }
}
