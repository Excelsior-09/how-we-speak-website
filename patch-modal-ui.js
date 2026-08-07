const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const advancedModalHTML = `
  <!-- ============================================================
       ADVANCED PRODUCT MODAL
  ============================================================ -->
  <div class="modal-overlay" id="productModal">
    <div class="modal-content" style="max-width:1100px;">
      <button class="modal-close" id="modalCloseBtn" aria-label="Close modal">✕</button>
      <div class="modal-grid" style="grid-template-columns: 1fr 1.2fr;">
        <div class="modal-images" style="flex-direction:column; gap:16px;">
          <div class="img-placeholder" id="modalImgMain" style="aspect-ratio:3/4;border-radius:8px;background:#f5f4ef; width:100%;"></div>
          <div id="modalThumbs" style="display:grid; grid-template-columns: repeat(4, 1fr); gap:12px; width:100%;"></div>
        </div>
        <div class="modal-info" style="padding: 40px 48px; max-height:85vh; overflow-y:auto; overflow-x:hidden;">
          <p class="eyebrow" id="modalTag" style="margin-bottom:8px;">Tag</p>
          <h2 class="display-sm" id="modalTitle" style="margin-bottom:16px;line-height:1.2;">Title</h2>
          
          <div style="font-size:18px; color:var(--charcoal-mid); margin-bottom:24px; line-height:1.5;">
            <strong style="color:var(--charcoal); display:block; margin-bottom:4px; font-size:14px; text-transform:uppercase; letter-spacing:0.04em;">Description</strong>
            <span id="modalDesc"></span>
          </div>

          <div style="padding:20px; background:var(--cream); border-left:3px solid var(--crimson); border-radius:0 8px 8px 0; margin-bottom:32px;">
            <strong style="color:var(--charcoal); display:block; margin-bottom:8px; font-size:14px; text-transform:uppercase; letter-spacing:0.04em;">Who It's For</strong>
            <span id="modalWho" style="font-size:15px; line-height:1.6; color:var(--charcoal-mid);"></span>
          </div>

          <h4 style="font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:16px;">What You'll Learn</h4>
          <ul class="modal-includes" id="modalLearn" role="list"></ul>

          <div style="margin-top:32px; padding-top:32px; border-top:1px solid var(--border);">
            <div style="font-size:16px; font-style:italic; color:var(--charcoal); margin-bottom:24px; line-height:1.5;" id="modalTestimonial"></div>
            
            <div class="modal-actions" style="display:flex;align-items:center;gap:20px;background:var(--warm-white);padding:24px;border-radius:12px;box-shadow:var(--shadow-md);border:1px solid var(--border);">
              <span id="modalPrice" style="font-family:var(--font-display);font-size:32px;font-weight:600;color:var(--charcoal);">$0</span>
              <button class="btn btn-primary btn-lg" id="modalAddBtn" style="flex:1;">Add to Cart</button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  </div>
`;

// Target the old modal from <div class="modal-overlay" id="productModal"> to its closing </div> which is immediately before </body> or <div id="hws-footer">
// Just regex replace it.
html = html.replace(/<div class="modal-overlay" id="productModal">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/i, advancedModalHTML);
html = html.replace(/<div class="modal-overlay" id="productModal">[\s\S]*?<\/div>[\s]*<\/div>[\s]*<\/div>[\s]*<\/div>/i, advancedModalHTML);

// Wait, the regex might be brittle. I'll just rewrite the whole bottom piece. 
// I know <div class="cart-overlay" id="cartOverlay"> starts that block. Let's rebuild the entire block to be 100% safe.
const cartHTML = `
  <div class="cart-overlay" id="cartOverlay"></div>
  <div class="cart-drawer" id="cartDrawer" aria-label="Shopping Cart">
    <div class="cart-drawer__header">
      <h2 style="font-family:var(--font-display);font-size:24px;font-weight:400;">Your Cart</h2>
      <button class="cart-drawer__close" id="cartCloseBtn" aria-label="Close cart">✕</button>
    </div>
    <div class="cart-drawer__body" id="cartDrawerBody"></div>
    <div class="cart-drawer__footer">
      <div class="cart-drawer__totals">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;color:var(--gray);">
          <span>Subtotal</span>
          <span id="cartDrawerSubtotal">$0</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-weight:600;font-size:18px;color:var(--charcoal);margin-bottom:16px;">
          <span>Total</span>
          <span id="cartDrawerTotal">$0</span>
        </div>
      </div>
      <!-- STRIPE PAYMENT LINK HERE -->
      <a href="#" class="btn btn-primary btn-lg" style="width:100%;justify-content:center;">Continue to Checkout</a>
    </div>
  </div>

  <button class="floating-cart" id="floatingCartBtn" aria-label="Open Cart">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
    <span class="floating-cart__badge" id="floatingCartBadge">0</span>
  </button>
`;

let baseHTML = fs.readFileSync('index.html', 'utf8');

// Strip old overlays
baseHTML = baseHTML.replace(/<div class="cart-overlay" id="cartOverlay">[\s\S]*?<\/button>\s*<\/div>/i, '');
baseHTML = baseHTML.replace(/<div class="modal-overlay" id="productModal">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/i, '');

// Strip again anything below main up to footer to clear everything nicely!
baseHTML = baseHTML.replace(/<\/main>[\s\S]*?<div id="hws-footer">/i, '</main>\n  ' + cartHTML + advancedModalHTML + '\n  <div id="hws-footer">');

fs.writeFileSync('index.html', baseHTML);
console.log('Advanced Modal & Cart rewritten securely.');
