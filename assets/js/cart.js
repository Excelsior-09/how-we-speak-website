const Cart = {
  _key: 'hws_cart_v2',

  get() {
    const data = localStorage.getItem(this._key);
    return data ? JSON.parse(data) : {};
  },

  save(items) {
    localStorage.setItem(this._key, JSON.stringify(items));
    this.render();
  },

  add(id) {
    const items = this.get();
    if (items[id]) {
      items[id]++;
    } else {
      items[id] = 1;
    }
    this.save(items);
    this.openDrawer();
    this.showToast('Added to cart');
  },

  remove(id) {
    const items = this.get();
    delete items[id];
    this.save(items);
  },

  updateQty(id, delta) {
    const items = this.get();
    if (!items[id]) return;
    items[id] += delta;
    if (items[id] <= 0) {
      delete items[id];
    }
    this.save(items);
  },

  openDrawer() {
    const overlay = document.getElementById('cartOverlay');
    const drawer = document.getElementById('cartDrawer');
    if (overlay && drawer) {
      overlay.classList.add('show');
      drawer.classList.add('show');
    }
    this.render();
  },

  closeDrawer() {
    const overlay = document.getElementById('cartOverlay');
    const drawer = document.getElementById('cartDrawer');
    if (overlay && drawer) {
      overlay.classList.remove('show');
      drawer.classList.remove('show');
    }
  },

  render() {
    const items = this.get();
    const body = document.getElementById('cartDrawerBody');
    const bSubtotal = document.getElementById('cartDrawerSubtotal');
    const bTotal = document.getElementById('cartDrawerTotal');
    const navBadge = document.getElementById('cartBadge');
    const floatBadge = document.getElementById('floatingCartBadge');

    let totalItems = 0;
    let subtotal = 0;

    let html = '';

    // Check if products exist in window scope
    if (!window.Products || !window.Products.data) return;

    for (const [id, qty] of Object.entries(items)) {
      const p = window.Products.data[id];
      if (!p) continue;

      totalItems += qty;
      subtotal += p.price * qty;

      html += `
        <div class="cart-item">
          <img src="${p.image}" alt="${p.title}" class="cart-item__img">
          <div class="cart-item__info">
            <h4 class="cart-item__title">${p.title}</h4>
            <div class="cart-item__price">$${p.price}</div>
            
            <div style="display:flex;align-items:center;">
              <div class="cart-qty-ctrl">
                <button onclick="Cart.updateQty('${id}', -1)" aria-label="Decrease quantity">−</button>
                <span style="font-size:14px;font-weight:600;min-width:16px;text-align:center;">${qty}</span>
                <button onclick="Cart.updateQty('${id}', 1)" aria-label="Increase quantity">+</button>
              </div>
              <button class="cart-item__remove" onclick="Cart.remove('${id}')">Remove</button>
            </div>
          </div>
        </div>
      `;
    }

    if (totalItems === 0) {
      html = '<div style="text-align:center;padding:40px 0;color:var(--gray);">Your cart is empty.</div>';
    }

    if (body) body.innerHTML = html;
    if (bSubtotal) bSubtotal.textContent = '$' + subtotal;
    if (bTotal) bTotal.textContent = '$' + subtotal;
    if (navBadge) {
      navBadge.textContent = totalItems;
      if (totalItems > 0) navBadge.classList.add('has-items');
      else navBadge.classList.remove('has-items');
    }
    if (floatBadge) {
      floatBadge.textContent = totalItems;
      if (totalItems > 0) floatBadge.classList.add('has-items');
      else floatBadge.classList.remove('has-items');
    }
  },

  showToast(msg) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:10px;';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.cssText = 'background:var(--charcoal);color:#fff;padding:12px 24px;border-radius:4px;font-size:14px;box-shadow:var(--shadow-lg);opacity:0;transform:translateY(-10px);transition:all 0.3s ease;';
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    }, 10);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
};

window.Cart = Cart;

document.addEventListener('DOMContentLoaded', () => {
  // Bind close buttons
  const closeBtn = document.getElementById('cartCloseBtn');
  const overlay = document.getElementById('cartOverlay');

  if (closeBtn) closeBtn.addEventListener('click', () => Cart.closeDrawer());
  if (overlay) overlay.addEventListener('click', (e) => {
    if (e.target === overlay) Cart.closeDrawer();
  });

  // Bind nav toggle
  const navToggle = document.getElementById('navCartToggle');
  if (navToggle) navToggle.addEventListener('click', (e) => {
    e.preventDefault();
    Cart.openDrawer();
  });

  // Bind mobile nav toggle
  const mobileToggle = document.getElementById('navCartToggleMobile');
  if (mobileToggle) mobileToggle.addEventListener('click', (e) => {
    e.preventDefault();
    Cart.openDrawer();
  });

  // Bind floating toggle
  const floatToggle = document.getElementById('floatingCartBtn');
  if (floatToggle) floatToggle.addEventListener('click', (e) => {
    e.preventDefault();
    Cart.openDrawer();
  });

  // Initial render
  Cart.render();
});
