const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const modalAndCartHTML = `
  <!-- ============================================================
       SLIDE-OUT CART DRAWER
  ============================================================ -->
  <div class="cart-overlay" id="cartOverlay"></div>
  <div class="cart-drawer" id="cartDrawer" aria-label="Shopping Cart">
    <div class="cart-drawer__header">
      <h2 style="font-family:var(--font-display);font-size:24px;font-weight:400;">Your Cart</h2>
      <button class="cart-drawer__close" id="cartCloseBtn" aria-label="Close cart">✕</button>
    </div>
    <div class="cart-drawer__body" id="cartDrawerBody">
      <!-- Cart items injected dynamically -->
    </div>
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
      <!-- STRIPE LINK -->
      <a href="https://stripe.com" target="_blank" class="btn btn-primary btn-lg" style="width:100%;justify-content:center;">Checkout with Stripe</a>
    </div>
  </div>

  <!-- FLOATING CART BUTTON -->
  <button class="floating-cart" id="floatingCartBtn" aria-label="Open Cart">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
    <span class="floating-cart__badge" id="floatingCartBadge">0</span>
  </button>

  <!-- ============================================================
       PRODUCT MODALS (Dynamic Shell)
  ============================================================ -->
  <div class="modal-overlay" id="productModal">
    <div class="modal-content">
      <button class="modal-close" id="modalCloseBtn" aria-label="Close modal">✕</button>
      <div class="modal-grid">
        <div class="modal-images">
          <div class="img-placeholder" id="modalImgFront" style="aspect-ratio:3/4;border-radius:8px;background:#f5f4ef;"></div>
        </div>
        <div class="modal-info">
          <p class="eyebrow" id="modalTag">Tag</p>
          <h2 class="display-sm" id="modalTitle" style="margin-bottom:16px;line-height:1.2;">Title</h2>
          <p class="body-md" id="modalDesc" style="color:var(--charcoal-mid);margin-bottom:24px;">Description</p>
          <h4 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:12px;">What's Included</h4>
          <ul class="modal-includes" id="modalIncludes" role="list">
            <!-- Injected list -->
          </ul>
          <div class="modal-actions" style="margin-top:32px;display:flex;align-items:center;gap:16px;">
            <span id="modalPrice" style="font-family:var(--font-display);font-size:28px;font-weight:500;">$0</span>
            <button class="btn btn-primary" id="modalAddBtn" style="flex:1;">Add to Cart</button>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

if (!html.includes('cart-drawer')) {
    html = html.replace('<div id="hws-footer"></div>', modalAndCartHTML + '\n  <div id="hws-footer"></div>');
    fs.writeFileSync('index.html', html);
    console.log('Modals and Cart injected into index.html');
}

// APPEND CSS TO COMPONENTS.CSS
let css = fs.readFileSync('assets/css/components.css', 'utf8');
const modalAndCartCSS = `
/* ============================================================
   SLIDE-OUT CART
============================================================ */
.cart-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 10000;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition);
}
.cart-overlay.show {
  opacity: 1;
  pointer-events: auto;
}
.cart-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  max-width: 440px;
  background: var(--warm-white);
  z-index: 10001;
  transform: translateX(100%);
  transition: transform 400ms cubic-bezier(.34, 1.56, .64, 1);
  display: flex;
  flex-direction: column;
  box-shadow: -10px 0 30px rgba(0,0,0,0.1);
}
.cart-drawer.show {
  transform: translateX(0);
}
.cart-drawer__header {
  padding: 24px 32px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.cart-drawer__close {
  background: transparent;
  border: none;
  font-size: 20px;
  color: var(--charcoal-mid);
  cursor: pointer;
  transition: color var(--transition);
}
.cart-drawer__close:hover {
  color: var(--crimson);
}
.cart-drawer__body {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}
.cart-drawer__footer {
  padding: 32px;
  border-top: 1px solid var(--border);
  background: #fff;
}
.cart-item {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}
.cart-item__img {
  width: 80px;
  border-radius: 6px;
  flex-shrink: 0;
}
.cart-item__info {
  flex: 1;
}
.cart-item__title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}
.cart-item__price {
  font-size: 13px;
  color: var(--gray);
  margin-bottom: 8px;
}
.cart-qty-ctrl {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 4px 8px;
  width: max-content;
}
.cart-qty-ctrl button {
  background: transparent;
  border: none;
  font-size: 14px;
  cursor: pointer;
  color: var(--charcoal);
}
.cart-item__remove {
  font-size: 12px;
  color: var(--crimson);
  background: transparent;
  border: none;
  cursor: pointer;
  margin-left: auto;
  display: block;
  margin-top: 10px;
  text-decoration: underline;
}

/* FLOATING CART BUTTON */
.floating-cart {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--charcoal);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-lg);
  border: none;
  cursor: pointer;
  z-index: 9999;
  transition: transform var(--transition), background var(--transition);
}
.floating-cart:hover {
  transform: translateY(-4px);
  background: var(--crimson);
}
.floating-cart__badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: var(--crimson);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}

/* ============================================================
   PRODUCT MODAL
============================================================ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition);
}
.modal-overlay.show {
  opacity: 1;
  pointer-events: auto;
}
.modal-content {
  background: var(--warm-white);
  border-radius: var(--radius-card);
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 24px 60px rgba(0,0,0,0.2);
  transform: scale(0.95);
  transition: transform 300ms cubic-bezier(.34, 1.56, .64, 1);
}
.modal-overlay.show .modal-content {
  transform: scale(1);
}
.modal-close {
  position: absolute;
  top: 24px;
  right: 24px;
  background: rgba(0,0,0,0.05);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  border: none;
  font-size: 16px;
  color: var(--charcoal);
  cursor: pointer;
  z-index: 2;
  transition: all var(--transition);
}
.modal-close:hover {
  background: var(--crimson);
  color: #fff;
}
.modal-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
@media (max-width: 768px) {
  .modal-grid { grid-template-columns: 1fr; }
}
.modal-images {
  background: var(--cream);
  padding: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-images .img-placeholder {
  width: 100%;
  max-width: 300px;
  box-shadow: var(--shadow-md);
}
.modal-info {
  padding: 56px 48px;
}
.modal-includes {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.modal-includes li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
  color: var(--charcoal-mid);
  line-height: 1.5;
}
.modal-includes li::before {
  content: '✓';
  color: var(--crimson);
  font-weight: 700;
  font-size: 12px;
  margin-top: 2px;
}
`;

if (!css.includes('SLIDE-OUT CART')) {
    fs.writeFileSync('assets/css/components.css', css + '\n' + modalAndCartCSS);
    console.log('Cart & Modal CSS injected.');
}
