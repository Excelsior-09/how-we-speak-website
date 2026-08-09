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
<nav class="nav" id="navbar" role="navigation" aria-label="Main navigation">
  <div class="container nav-container">
    <div class="nav__inner">
      <a href="index.html" class="nav__logo" aria-label="How We Speak — Home">
        <img src="${LOGO}" alt="How We Speak" class="nav__logo-img" fetchpriority="high" decoding="async"/>
      </a>
      
      <!-- Desktop Links -->
      <ul class="nav__links" role="list">
        <li><a href="index.html">Home</a></li>
        <li><a href="contact.html">Contact</a></li>
        <li><a href="refund-policy.html">Refund Policy</a></li>
        <li><a href="privacy-policy.html">Privacy Policy</a></li>
        <li><a href="terms.html">Terms</a></li>
      </ul>
      <div class="nav__cta">
        <button class="nav__cart" id="navCartToggle" aria-label="Open cart">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
          <span class="cart-badge" id="cartBadge">0</span>
        </button>
        <a href="index.html#bundle" class="btn btn-primary">Start Understanding</a>
      </div>

        <button class="nav__mobile-toggle" aria-label="Open menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </div>
</nav>

<!-- Mobile Drawer Escaped Stacking Context -->
<div class="nav__mobile-drawer" id="mobileDrawer">
  <button class="nav__mobile-close" id="navCloseBtn" aria-label="Close menu">✕</button>
  <ul class="drawer-links" role="list">
    <li><a href="index.html" class="mobile-nav-link">Home</a></li>
    <li><a href="contact.html" class="mobile-nav-link">Contact</a></li>
    <li><a href="refund-policy.html" class="mobile-nav-link">Refund Policy</a></li>
    <li><a href="privacy-policy.html" class="mobile-nav-link">Privacy Policy</a></li>
    <li><a href="terms.html" class="mobile-nav-link">Terms</a></li>
  </ul>
  <div class="drawer-cta">
    <a href="index.html#bundle" class="btn btn-primary" id="mobileCta">Start Understanding</a>
  </div>
</div>
`;

  /* ── FOOTER HTML ─────────────────────────────────────── */
  const FOOTER_HTML = `
<footer class="footer" role="contentinfo">
  <div class="container footer__grid">
    <div class="footer__brand">
      <a href="index.html" class="footer__logo">How We Speak</a>
      <p class="footer__desc">Stop guessing. Start understanding.</p>
      <a href="mailto:admin@tryhowwespeak.com" style="margin-top:16px;display:block;color:var(--charcoal-mid);text-decoration:underline;">admin@tryhowwespeak.com</a>
      <div style="display:flex;gap:16px;margin-top:20px;">
        <a href="https://www.instagram.com/anass_paccino/" target="_blank" rel="noopener noreferrer" style="color:var(--charcoal);" aria-label="Instagram">Instagram</a>
        <a href="https://www.facebook.com/anas.ziraoui.7/" target="_blank" rel="noopener noreferrer" style="color:var(--charcoal);" aria-label="Facebook">Facebook</a>
      </div>
    </div>
    <div>
      <h3 class="footer__col-title">Navigation</h3>
      <ul class="footer__links" role="list">
        <li><a href="index.html">Home</a></li>
        <li><a href="contact.html">Contact</a></li>
      </ul>
    </div>
    <div>
      <h3 class="footer__col-title">Policies</h3>
      <ul class="footer__links" role="list">
        <li><a href="privacy-policy.html">Privacy Policy</a></li>
        <li><a href="refund-policy.html">Refund Policy</a></li>
        <li><a href="terms.html">Terms of Service</a></li>
      </ul>
    </div>
  </div>
  <div class="container footer__bottom">
    <p>&copy; 2026 How We Speak. All rights reserved.</p>
  </div>
</footer>`;

  /* ── INJECT ──────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    const navSlot = document.getElementById('hws-nav');
    const footerSlot = document.getElementById('hws-footer');
    if (navSlot) navSlot.outerHTML = NAV_HTML;
    if (footerSlot) footerSlot.outerHTML = FOOTER_HTML;

    // Mobile Drawer Logic
    const toggle = document.querySelector('.nav__mobile-toggle');
    const closeBtn = document.getElementById('navCloseBtn');
    const drawer = document.getElementById('mobileDrawer');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');

    if (toggle && closeBtn && drawer) {
      toggle.addEventListener('click', () => {
        drawer.classList.add('nav__drawer--active');
        document.body.style.overflow = 'hidden'; // Stop scrolling
      });
      closeBtn.addEventListener('click', () => {
        drawer.classList.remove('nav__drawer--active');
        document.body.style.overflow = '';
      });
      // Close when clicking a link
      mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
          drawer.classList.remove('nav__drawer--active');
          document.body.style.overflow = '';
        });
      });
    }
  });
})();
