const fs = require('fs');

if (fs.existsSync('assets/js/main.js.bak')) {
    const code = fs.readFileSync('assets/js/main.js.bak', 'utf8');
    const sections = code.split(/\/\*\s*──\s*([A-Z\s]+)\s*─+\s*\*\//);

    const files = {
        'products.js': `/** HOW WE SPEAK — PRODUCTS */\n'use strict';\n\n`,
        'cart.js': `/** HOW WE SPEAK — CART COMPONENT */\n'use strict';\n\n`,
        'animations.js': `/** HOW WE SPEAK — ANIMATIONS & UI */\n'use strict';\n\n`,
        'main.js': `/** HOW WE SPEAK — MAIN INITIALIZATION */\n'use strict';\n\n`
    };

    // sections[0] is the header
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
                files['main.js'] += block;
            }
        }

        for (const [name, data] of Object.entries(files)) {
            fs.writeFileSync(`assets/js/${name}`, data);
            console.log(`Wrote assets/js/${name} - ${data.length} bytes`);
        }

        // Update missing HTML files since only 3 were updated previously
        const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));
        htmlFiles.forEach(file => {
            let html = fs.readFileSync(file, 'utf8');
            const scriptTags = `
  <script src="assets/js/products.js"></script>
  <script src="assets/js/cart.js"></script>
  <script src="assets/js/animations.js"></script>
  <script src="assets/js/checkout.js"></script>
  <script src="assets/js/main.js"></script>
  `.trim();

            if (html.includes('<script src="assets/js/main.js"></script>')) {
                html = html.replace('<script src="assets/js/main.js"></script>', scriptTags);
                fs.writeFileSync(file, html);
                console.log(`Updated scripts in ${file}`);
            }
            if (html.includes('<script src="main.js"></script>')) {
                html = html.replace('<script src="main.js"></script>', scriptTags);
                fs.writeFileSync(file, html);
                console.log(`Updated scripts in ${file}`);
            }
        });
    } else {
        console.log('Regex failed again');
    }
} else {
    console.log('Backup not found, aborting. Check assets/js/main.js.bak');
}
