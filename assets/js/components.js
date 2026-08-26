/**
 * HOW WE SPEAK — SHARED COMPONENTS
 * Injects consistent nav and footer into every page
 * Usage: Add <div id="hws-nav"></div> and <div id="hws-footer"></div>
 * Then include this script. Components inject themselves.
 */

(function () {
  const LOGO = 'https://i.ibb.co/hR2KXFd4/Gemini-Generated-Image-bbp6v6bbp6v6bbp6-1-removebg-preview.png';

  /* Quiz page gets a minimal, distraction-free nav — just Home + Take the Quiz. */
  const isQuizPage = /(^|\/)quiz\.html$/.test(window.location.pathname);

  const NAV_LINKS_FULL = `
        <li><a href="index.html">Home</a></li>
        <li><a href="index.html#guides">Our Guides</a></li>
        <li>
          <a href="quiz.html" class="nav-quiz">
            Take the Quiz
            <span class="nav-quiz-badge">New</span>
          </a>
        </li>
        <li><a href="/index.html#bundle">Bundle</a></li>
        <li><a href="index.html#story">Our Story</a></li>
        <li><a href="index.html#faq">FAQ</a></li>
        <li class="mobile-cta" style="display:none;">
          <a href="/index.html#bundle" class="btn btn-primary">Start Understanding</a>
        </li>`;

  const NAV_LINKS_QUIZ = `
        <li><a href="index.html">Home</a></li>
        <li>
          <a href="quiz.html" class="nav-quiz" aria-current="page">
            Take the Quiz
            <span class="nav-quiz-badge">New</span>
          </a>
        </li>`;

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
      <ul class="nav__links" id="navLinks" role="list">${isQuizPage ? NAV_LINKS_QUIZ : NAV_LINKS_FULL}
      </ul>
      <div class="nav__right">
        <div class="nav__cta">
          <a href="/index.html#bundle" class="btn btn-primary">Start Understanding</a>
        </div>
        <button class="nav__cart" id="navCartToggle" aria-label="Open cart">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
          <span class="cart-badge" id="cartBadge">0</span>
        </button>
        <button class="nav__mobile-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="navLinks">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </div>
</nav>
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

    // Mobile Nav Logic
    const toggle = document.querySelector('.nav__mobile-toggle');
    const links = document.getElementById('navLinks');
    if (toggle && links) {
      function setOpen(open) {
        toggle.setAttribute('aria-expanded', String(open));
        links.classList.toggle('is-open', open);
        document.body.style.overflow = open ? 'hidden' : '';
      }

      toggle.addEventListener('click', () => {
        const open = toggle.getAttribute('aria-expanded') === 'true';
        setOpen(!open);
      });

      // close when any link is tapped
      links.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => setOpen(false));
      });

      // close on Escape
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') setOpen(false);
      });

      // close if resized back to desktop
      window.addEventListener('resize', () => {
        if (window.innerWidth > 860) setOpen(false);
      });
    }
  });
})();
