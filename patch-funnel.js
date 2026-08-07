const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(
    /<div class="product-card__footer">\s*<span class="product-card__price">([^<]+)<\/span>\s*<a href="bundle\.html"[^>]*>View Guide<\/a>\s*<\/div>/g,
    (match, price) => {
        return `<div class="product-card__footer" style="flex-wrap:wrap;gap:12px;padding-top:20px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">
              <span class="product-card__price">${price}</span>
              <div style="display:flex; gap:8px;">
                <button class="btn btn-secondary" style="padding:10px 14px; font-size:13px;" onclick="Products.openModal(this.dataset.id)">Read Now</button>
                <button class="btn btn-primary" style="padding:10px 14px; font-size:13px;" onclick="Cart.add(this.dataset.id)">Add to Cart</button>
              </div>
            </div>`;
    }
);
let _pCount = 0;
const _ids = ['men-edition', 'women-edition', 'script-collection', 'sex-talk'];
html = html.replace(/onclick="Products\.openModal\(this\.dataset\.id\)"/g, () => `onclick="Products.openModal('${_ids[_pCount]}')"`);
_pCount = 0;
html = html.replace(/onclick="Cart\.add\(this\.dataset\.id\)"/g, () => `onclick="Cart.add('${_ids[_pCount++]}')"`);

let _tCount = 0;
html = html.replace(/<td><a href="bundle\.html" class="btn btn-secondary"[^>]*>Buy<\/a><\/td>/g, () => {
    return `<td><button class="btn btn-secondary" style="width:100%;justify-content:center;padding:10px 16px;font-size:13px;" onclick="Cart.add('${_ids[_tCount++]}')">Add to Cart</button></td>`;
});
html = html.replace(
    /<a href="#bundle" class="btn btn-primary"[^>]*>Get Bundle<\/a>/g,
    '<a href="https://stripe.com" target="_blank" class="btn btn-primary" style="width:100%;justify-content:center;padding:12px 16px;font-size:14px;"><!-- STRIPE LINK -->Get Bundle</a>'
);
html = html.replace(
    /<a href="bundle\.html" class="btn btn-white btn-lg">\s*Get The Complete Bundle[^<]*<svg[^>]*>.*?<\/svg>\s*<\/a>/gs,
    `<a href="https://stripe.com" target="_blank" class="btn btn-white btn-lg"><!-- STRIPE LINK -->Get The Complete Bundle <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></a>`
);
html = html.replace(
    /<a href="#bundle" class="btn btn-primary">Get The Complete Bundle<\/a>/g,
    `<a href="https://stripe.com" target="_blank" class="btn btn-primary"><!-- STRIPE LINK -->Get The Complete Bundle</a>`
);
html = html.replace(
    /<a href="mailto:admin@tryhowwespeak\.com\?subject=Couple Session Booking"[^>]*>[\s]*Book a Session[\s]*<\/a>/s,
    `<a href="https://stripe.com" target="_blank" class="btn btn-primary btn-lg" style="width:100%;max-width:300px;"><!-- STRIPE LINK -->Book a Session</a>`
);

const megaBundleSection = `
  <!-- ============================================================
       MEGA BUNDLE
       High converting pricing tier ($580)
  ============================================================ -->
  <section class="bundle section" id="mega-bundle" style="background:var(--crimson);color:#fff;position:relative;">
    <div class="container">
      <div class="bundle__inner">
        <!-- LEFT: CONTENT -->
        <div class="bundle__content reveal">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
            <p class="eyebrow" style="color:var(--gold-light);margin-bottom:0;">Mega Bundle</p>
            <span style="background:var(--gold-light);color:var(--charcoal);padding:4px 10px;border-radius:4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Best Value</span>
            <span style="background:#fff;color:var(--crimson);padding:4px 10px;border-radius:4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Most Popular</span>
          </div>
          <h2 class="bundle__headline" style="color:#fff;">
            The Ultimate<br>
            Transformation.<br>
            <em>Everything.</em>
          </h2>
          <p class="bundle__desc" style="color:rgba(255,255,255,0.85);">
            Includes all four How We Speak guides plus the private, 45-minute live Couples Communication Session with the founders.
          </p>
          <ul class="bundle__includes" role="list" style="color:rgba(255,255,255,0.9);">
            <li>How We Speak: Men Edition (for women)</li>
            <li>How We Speak: Women Edition (for men)</li>
            <li>Complete Script Collection — 75+ scripts</li>
            <li>Sex Talk Framework — intimacy communication</li>
            <li><strong style="color:var(--gold-light);">45-Min Private Relationship Session</strong></li>
            <li>3 custom conversation scripts post-session</li>
          </ul>
          <div class="bundle__pricing" style="color:#fff;border-color:rgba(255,255,255,0.15);">
            <span class="bundle__price-current">$580</span>
            <span class="bundle__price-was" style="color:rgba(255,255,255,0.4);">$628</span>
            <span class="bundle__price-save" style="background:rgba(255,255,255,0.1);color:var(--gold-light);">Save $48</span>
          </div>
          <div class="bundle__ctas">
            <a href="https://stripe.com" target="_blank" class="btn btn-white btn-lg" style="color:var(--crimson);padding:20px 40px;font-size:17px;"><!-- STRIPE LINK -->
              Get The Mega Bundle
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style="margin-left:8px;"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </a>
          </div>
          <p class="bundle__fine-print" style="color:rgba(255,255,255,0.5);">
            Instant download · Session scheduling link sent immediately · 30-day money-back guarantee
          </p>
        </div>
        <!-- RIGHT: MEGA BUNDLE MOCKUP IMAGE -->
        <div class="bundle__image reveal reveal-delay-2">
          <div class="img-placeholder" style="height:520px;background:rgba(255,255,255,0.03);border-color:rgba(255,255,255,0.1);">
            <svg class="img-placeholder-icon" viewBox="0 0 40 40" fill="none" style="opacity:0.3"><rect x="4" y="4" width="32" height="32" rx="4" stroke="white" stroke-width="1.5"/><circle cx="15" cy="15" r="4" stroke="white" stroke-width="1.5"/><path d="M4 28l8-8 6 6 4-4 10 10" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span style="color:rgba(255,255,255,0.35);"><img src="https://i.ibb.co/84LyRsYY/Chat-GPT-Image-Aug-7-2026-12-18-35-AM.png" alt=""></span>
            <span style="font-size:10px;color:rgba(255,255,255,0.20);">Mega Bundle Mockup</span>
          </div>
        </div>
      </div>
    </div>
  </section>

`;

if (!html.includes('id="mega-bundle"')) {
    html = html.replace('<!-- ============================================================\r\n       BUNDLE', megaBundleSection + '<!-- ============================================================\r\n       BUNDLE');
    // fallback for \n
    if (!html.includes('id="mega-bundle"')) {
        html = html.replace('<!-- ============================================================\n       BUNDLE', megaBundleSection + '<!-- ============================================================\n       BUNDLE');
    }
}

fs.writeFileSync('index.html', html);
console.log('Homepage routing patched successfully!!');
