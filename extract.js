const fs = require('fs');

const indexHtml = fs.readFileSync('index.html', 'utf8');
const match = indexHtml.match(/<style>([\s\S]*?)<\/style>/);

if (match) {
  const css = match[1];
  fs.writeFileSync('assets/css/index_inline.css', css);
  console.log(`Extracted ${css.length} characters of CSS to assets/css/index_inline.css`);
  
  // also check if we can parse the sections easily based on /* ==== */ headers
  const sections = css.split(/\/\*\s*={10,}\s*\n/);
  console.log(`Found ${sections.length - 1} sections in the CSS.`);
  for (let i = 1; i < sections.length; i++) {
    const titleMatch = sections[i].match(/\s*([^\n]+)\s*\n\s*={10,}\s*\*\//);
    if (titleMatch) {
       console.log(`Section ${i}: ${titleMatch[1].trim()}`);
    }
  }
} else {
  console.log('No <style> block found in index.html');
}
