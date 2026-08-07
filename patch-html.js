const fs = require('fs');
const path = require('path');

const dir = '.';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    let html = fs.readFileSync(file, 'utf8');
    let hasChanges = false;

    // Extract style tag
    let pageCss = '';
    if (file === 'index.html') {
        pageCss = 'index.css';
        const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
        if (styleMatch) {
            html = html.replace(styleMatch[0], '');
            hasChanges = true;
        }
    } else {
        const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
        if (styleMatch && styleMatch[1].trim() !== '') {
            const cssName = file.replace('.html', '.css');
            fs.writeFileSync(path.join('assets', 'css', cssName), styleMatch[1].trim() + '\n');
            console.log(`Created assets/css/${cssName}`);
            pageCss = cssName;
            html = html.replace(styleMatch[0], '');
            hasChanges = true;
        }
    }

    // Remove existing global.css and index.css if any
    html = html.replace(/<link rel="stylesheet" href="assets\/css\/global\.css"\s*\/?>/g, '');
    html = html.replace(/<link rel="stylesheet" href="assets\/css\/index\.css"\s*\/?>/g, '');

    const linksToInject = [
        `<link rel="stylesheet" href="assets/css/main.css"/>`,
        `<link rel="stylesheet" href="assets/css/components.css"/>`,
        `<link rel="stylesheet" href="assets/css/animations.css"/>`,
        pageCss ? `<link rel="stylesheet" href="assets/css/${pageCss}"/>` : '',
        `<link rel="stylesheet" href="assets/css/responsive.css"/>`
    ].filter(Boolean).join('\n  ');

    if (!html.includes('assets/css/main.css')) {
        // Find where to inject - effectively above </head>
        html = html.replace('</head>', `  ${linksToInject}\n</head>`);
        fs.writeFileSync(file, html);
        console.log(`Patched ${file}`);
    }
});

try { fs.unlinkSync('assets/css/global.css'); console.log('Removed global.css'); } catch (e) { }
try { fs.unlinkSync('assets/css/index_inline.css'); console.log('Removed index_inline.css'); } catch (e) { }
