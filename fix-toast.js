const fs = require('fs');
const path = require('path');

const cssDir = path.join('assets', 'css');
const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));

cssFiles.forEach(file => {
    if (file === 'components.css') return;

    let css = fs.readFileSync(path.join(cssDir, file), 'utf8');

    let originalLength = css.length;

    css = css.replace(/\/\*\s*CART TOAST\s*\*\//g, '');
    css = css.replace(/\.cart-toast\s*{[^}]*}\s*/g, '');
    css = css.replace(/\.cart-toast\.show\s*{[^}]*}\s*/g, '');
    css = css.replace(/\.cart-toast-check\s*{[^}]*}\s*/g, '');

    if (css.length !== originalLength) {
        fs.writeFileSync(path.join(cssDir, file), css);
        console.log(`Cleaned toast from ${file}`);
    }
});

let components = fs.readFileSync(path.join(cssDir, 'components.css'), 'utf8');

const properToastAndCart = `
/* ============================================================
   TOAST NOTIFICATION
============================================================ */
.cart-toast {
  position: fixed;
  top: 32px;
  right: 32px;
  background: var(--charcoal);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  padding: 16px 24px;
  border-radius: 12px;
  z-index: 10000;
  opacity: 0;
  transform: translateX(120%);
  transition: all 400ms cubic-bezier(.34, 1.56, .64, 1);
  pointer-events: none;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.15);
}

.cart-toast.show {
  opacity: 1;
  transform: translateX(0);
}

.cart-toast-check {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--crimson);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
  color: #fff;
}

/* ============================================================
   NAV CART ICON
============================================================ */
.nav__cart {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--charcoal);
  transition: color var(--transition);
}

.nav__cart:hover {
  color: var(--crimson);
}

.cart-badge {
  position: absolute;
  top: -6px;
  right: -8px;
  background: var(--crimson);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(196,30,58,0.25);
}

.cart-bar {
  display: none !important;
}
`;

if (!components.includes('TOAST NOTIFICATION')) {
    fs.writeFileSync(path.join(cssDir, 'components.css'), components + '\n' + properToastAndCart);
    console.log('Appended proper toast & cart styles to components.css');
}
