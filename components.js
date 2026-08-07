/**
 * HOW WE SPEAK — SHARED COMPONENTS
 * Injects consistent nav and footer into every page
 * Usage: Add <div id="hws-nav"></div> and <div id="hws-footer"></div>
 * Then include this script. Components inject themselves.
 */

(function () {
  const LOGO = 'https://i.ibb.co/hR2KXFd4/Gemini-Generated-Image-bbp6v6bbp6v6bbp6-1-removebg-preview.png';

  /* ── NAV HTML ─────────────────────────────────────────── */
  const NAV_HTML = `
<div class="cart-toast" id="cartToast">
  <span class="cart-toast-check">✓</span>
  <span class="toast-msg">Added to cart</span>
</div>
<div class="cart-bar" id="cartBar">
  <div class="cart-bar__left">
    <span class="cart-bar__count" id="cartBarCount">0 items in cart</span>
    <span class="cart-bar__total" id="cartBarTotal">$0</span>
  </div>
  <div class="cart-bar__actions">
    <a href="cart.html" class="btn btn-secondary" style="padding:12px 22px;font-size:14px;">
      Cart <span class="cart-badge" id="cartBadge">0</span>
    </a>
    <a href="checkout.html" class="btn btn-primary" style="padding:12px 26px;font-size:14px;">Checkout →</a>
  </div>
</div>
<nav class="nav" id="navbar" role="navigation" aria-label="Main navigation">
  <div class="container">
    <div class="nav__inner">
      <a href="index.html" class="nav__logo" aria-label="How We Speak — Home">
        <img src="${LOGO}" alt="How We Speak" class="nav__logo-img" width="156" height="62" fetchpriority="high" decoding="async"/>
      </a>
      <ul class="nav__links" role="list">
        <li><a href="index.html">Home</a></li>
        <li><a href="index.html#guides">Our Guides</a></li>
        <li><a href="bundle.html">Bundle</a></li>
        <li><a href="index.html#story">Our Story</a></li>
        <li><a href="index.html#faq">FAQ</a></li>
        <li><a href="mailto:admin@tryhowwespeak.com">Contact</a></li>
      </ul>
      <div class="nav__cta">
        <a href="bundle.html" class="btn btn-primary">Start Understanding</a>
      </div>
      <button class="nav__mobile-toggle" aria-label="Open menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</nav>`;

  /* ── FOOTER HTML ─────────────────────────────────────── */
  const FOOTER_HTML = `
<footer class="footer" role="contentinfo">
  <div class="container">
    <div class="footer__top">
      <div>
        <a href="index.html" aria-label="How We Speak — Home" style="display:inline-block;margin-bottom:20px;">
          <img src="${LOGO}" alt="How We Speak" width="160" height="64" loading="lazy" decoding="async"
            style="display:block;width:160px;height:auto;max-width:100%;object-fit:contain;filter:brightness(0) invert(1);opacity:0.92;transition:opacity 250ms ease;"
            onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.92'"/>
        </a>
        <p class="footer__brand-desc">Helping couples build stronger relationships through better communication.</p>
        <p style="font-size:13px;color:rgba(255,255,255,0.40);margin-top:8px;margin-bottom:20px;">
          <a href="mailto:admin@tryhowwespeak.com" style="color:rgba(255,255,255,0.40);transition:color 250ms ease;"
             onmouseover="this.style.color='rgba(255,255,255,0.75)'" onmouseout="this.style.color='rgba(255,255,255,0.40)'">
            admin@tryhowwespeak.com
          </a>
        </p>
        <div class="footer__socials">
          <a href="https://instagram.com/howwespeak" class="footer__social" aria-label="Instagram" rel="noopener noreferrer" target="_blank">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
          </a>
          <a href="https://facebook.com/howwespeak" class="footer__social" aria-label="Facebook" rel="noopener noreferrer" target="_blank">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
        </div>
      </div>
      <div>
        <h3 class="footer__col-title">Products</h3>
        <ul class="footer__links" role="list">
          <li><a href="men-edition.html">Men Edition</a></li>
          <li><a href="women-edition.html">Women Edition</a></li>
          <li><a href="script-collection.html">Complete Script Collection</a></li>
          <li><a href="sex-talk.html">Sex Talk Framework</a></li>
          <li><a href="bundle.html">Complete Bundle</a></li>
          <li><a href="mailto:admin@tryhowwespeak.com?subject=Couple Session Booking">Couple Session</a></li>
        </ul>
      </div>
      <div>
        <h3 class="footer__col-title">Company</h3>
        <ul class="footer__links" role="list">
          <li><a href="index.html#story">Our Story</a></li>
          <li><a href="index.html#faq">FAQ</a></li>
          <li><a href="cart.html">Cart</a></li>
          <li><a href="mailto:admin@tryhowwespeak.com">Contact Us</a></li>
        </ul>
      </div>
      <div>
        <h3 class="footer__col-title">Support</h3>
        <ul class="footer__links" role="list">
          <li><a href="refund-policy.html">Refund Policy</a></li>
          <li><a href="privacy-policy.html">Privacy Policy</a></li>
          <li><a href="terms.html">Terms of Service</a></li>
          <li><a href="checkout.html">Checkout</a></li>
        </ul>
      </div>
    </div>
    <div class="footer__bottom">
      <p class="footer__copyright">© 2026 How We Speak. All rights reserved.</p>
      <div class="footer__legal-links">
        <a href="privacy-policy.html">Privacy</a>
        <a href="terms.html">Terms</a>
        <a href="refund-policy.html">Refunds</a>
      </div>
    </div>
  </div>
</footer>`;

  /* ── INJECT ──────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    const navSlot    = document.getElementById('hws-nav');
    const footerSlot = document.getElementById('hws-footer');
    if (navSlot)    navSlot.outerHTML    = NAV_HTML;
    if (footerSlot) footerSlot.outerHTML = FOOTER_HTML;
  });
})();
