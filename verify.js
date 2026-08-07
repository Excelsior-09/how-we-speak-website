const fs = require('fs');
const path = require('path');

const dir = '.';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
const missingFiles = [];

files.forEach(file => {
    const html = fs.readFileSync(file, 'utf8');

    // Find script tags
    let scripts = [];
    let scriptRegex = /<script[^>]+src=["']([^"']+)["']/g;
    let match;
    while ((match = scriptRegex.exec(html)) !== null) {
        scripts.push(match[1]);
    }

    // Find images
    let images = [];
    let imgRegex = /<img[^>]+src=["']([^"']+)["']/g;
    while ((match = imgRegex.exec(html)) !== null) {
        images.push(match[1]);
    }

    // Find stylesheets
    let styles = [];
    let styleRegex = /<link[^>]+href=["']([^"']+)["']/g;
    while ((match = styleRegex.exec(html)) !== null) {
        styles.push(match[1]);
    }

    const check = (list, tagType) => {
        list.forEach(src => {
            if (!src.startsWith('http') && !src.startsWith('//') && !src.startsWith('data:')) {
                const p = path.join(dir, src);
                if (!fs.existsSync(p)) {
                    missingFiles.push(`Missing ${tagType} in ${file}: ${src}`);
                }
            }
        });
    };

    check(scripts, 'Script');
    check(images, 'Image');
    check(styles, 'Stylesheet');

    // Also check if scripts are injected properly. If not, log it.
    if (!scripts.includes('assets/js/products.js') && !scripts.includes('assets/js/main.js')) {
        console.log(`${file} is MISSING proper script injections! Found:`, scripts);

        // Auto-inject at the end of body
        if (html.includes('</body>')) {
            const injectedHtml = html.replace('</body>', `
  <script src="assets/js/products.js"></script>
  <script src="assets/js/cart.js"></script>
  <script src="assets/js/animations.js"></script>
  <script src="assets/js/checkout.js"></script>
  <script src="assets/js/main.js"></script>
  <script src="assets/js/components.js"></script>
</body>`);
            fs.writeFileSync(file, injectedHtml);
            console.log(`Auto-fixed scripts in ${file}`);
        }
    }
});

console.log('--- MISSING ASSETS SCAN ---');
if (missingFiles.length > 0) {
    console.log(missingFiles.join('\n'));
} else {
    console.log('No missing assets found!');
}
