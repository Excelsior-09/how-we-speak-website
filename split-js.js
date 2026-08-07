const fs = require('fs');

if (!fs.existsSync('assets/js')) {
    fs.mkdirSync('assets/js', { recursive: true });
}

// Ensure components.js is moved to assets/js/
if (fs.existsSync('components.js')) {
    fs.renameSync('components.js', 'assets/js/components.js');
    console.log('Moved components.js to assets/js/');
}

let code;
if (fs.existsSync('assets/js/main.js')) {
    code = fs.readFileSync('assets/js/main.js', 'utf8');
} else if (fs.existsSync('main.js')) {
    code = fs.readFileSync('main.js', 'utf8');
    fs.renameSync('main.js', 'assets/js/main.js.bak');
} else {
    console.log("No main.js found!");
    process.exit(1);
}

const sections = code.split(/\/\*\s*──\s*([^\n──]+)\s*──\s*\*\//);

const files = {
    'products.js': '',
    'cart.js': '',
    'animations.js': '',
    'main.js': ''
};

// sections[0] is the header text
files['products.js'] = `/** HOW WE SPEAK — PRODUCTS */\n'use strict';\n\n`;
files['cart.js'] = `/** HOW WE SPEAK — CART COMPONENT */\n'use strict';\n\n`;
files['animations.js'] = `/** HOW WE SPEAK — ANIMATIONS & UI */\n'use strict';\n\n`;
files['main.js'] = `/** HOW WE SPEAK — MAIN INITIALIZATION */\n'use strict';\n\n`;

if (sections.length > 1) {
    for (let i = 1; i < sections.length; i += 2) {
        const title = sections[i].trim();
        const content = sections[i + 1];
        const block = `/* ── ${title} ── */` + content;

        if (title === 'PRODUCT REGISTRY') {
            files['products.js'] += block;
        } else if (['CART ENGINE', 'CART UI', 'ADD TO CART HELPER', 'QTY CONTROL'].includes(title)) {
            files['cart.js'] += block;
        } else if (['SCROLL REVEAL', 'FAQ ACCORDION', 'COUNTER ANIMATION', 'TICKER PAUSE ON HOVER'].includes(title)) {
            files['animations.js'] += block;
        } else {
            // NAVBAR, GALLERY THUMBS, INIT
            files['main.js'] += block;
        }
    }
} else {
    console.log("Sections not parsed correctly", code.substring(0, 100));
}

for (const [name, data] of Object.entries(files)) {
    fs.writeFileSync(`assets/js/${name}`, data);
    console.log(`Wrote assets/js/${name}`);
}

// Now replace main.js links in all HTML files
const dir = '.';
const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

htmlFiles.forEach(file => {
    let html = fs.readFileSync(file, 'utf8');

    // Replace <script src="assets/js/main.js"></script> with the multiple scripts
    const scriptTags = `
  <script src="assets/js/products.js"></script>
  <script src="assets/js/cart.js"></script>
  <script src="assets/js/animations.js"></script>
  <script src="assets/js/checkout.js"></script>
  <script src="assets/js/main.js"></script>
  `.trim();

    // also fix component path if it's currently root <script src="components.js"></script>
    html = html.replace(/<script src="components\.js"><\/script>/g, '<script src="assets/js/components.js"></script>');
    html = html.replace(/<script src="main\.js"><\/script>/g, '<script src="assets/js/main.js"></script>');

    if (html.includes('<script src="assets/js/main.js"></script>')) {
        html = html.replace('<script src="assets/js/main.js"></script>', scriptTags);
        fs.writeFileSync(file, html);
        console.log(`Updated scripts in ${file}`);
    }
});

fs.writeFileSync('assets/js/checkout.js', `/** HOW WE SPEAK — CHECKOUT FLOW */\n'use strict';\n\n// Checkout logic ready for Stripe connection\n`);
console.log('Created assets/js/checkout.js');
