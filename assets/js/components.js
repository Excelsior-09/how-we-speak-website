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
        <li><a href="articles.html">Articles</a></li>
        <li><a href="/index.html#bundle">Bundle</a></li>
        <li><a href="index.html#story">Our Story</a></li>
        <li><a href="index.html#faq">FAQ</a></li>
        <li class="mobile-cta" style="display:none;">
          <a href="/index.html#bundle" class="btn btn-primary">Break the Silence</a>
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
          <a href="/index.html#bundle" class="btn btn-primary">Break the Silence</a>
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
    <div class="container">
      <div class="footer__top">
        <div>
          <a href="index.html" aria-label="How We Speak — Home" style="display:inline-block;margin-bottom:20px;">
            <img src="https://i.ibb.co/hR2KXFd4/Gemini-Generated-Image-bbp6v6bbp6v6bbp6-1-removebg-preview.png"
              alt="How We Speak" width="160" height="64" loading="lazy" decoding="async" style="
                display: block;
                width: 160px;
                height: auto;
                max-width: 100%;
                object-fit: contain;
                filter: brightness(0) invert(1);
                opacity: 0.92;
                image-rendering: -webkit-optimize-contrast;
                transition: opacity 250ms ease;
              " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.92'" />
          </a>
          <p class="footer__brand-desc">
            Helping couples build stronger relationships through better communication.
          </p>
          <p style="font-size:13px;color:rgba(255,255,255,0.40);margin-top:8px;margin-bottom:20px;">
            <a href="mailto:admin@tryhowwespeak.com" style="color:rgba(255,255,255,0.40);transition:color 250ms ease;"
              onmouseover="this.style.color='rgba(255,255,255,0.75)'"
              onmouseout="this.style.color='rgba(255,255,255,0.40)'">admin@tryhowwespeak.com</a>
          </p>
          <div class="footer__socials">
            <a href="https://www.instagram.com/anass_paccino/" class="footer__social" aria-label="Instagram"
              target="_blank" rel="noopener noreferrer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
            <a href="https://www.facebook.com/anas.ziraoui.7/" class="footer__social" aria-label="Facebook"
              target="_blank" rel="noopener noreferrer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
          </div>
        </div>

        <div>
          <h3 class="footer__col-title">Products</h3>
          <ul class="footer__links" role="list">
            <li><a href="https://themindly.gumroad.com/l/How-We-Speak-Men-Edition?wanted=true" target="_blank" rel="noopener noreferrer">Men Edition</a></li>
            <li><a href="https://themindly.gumroad.com/l/howwespeak-women?wanted=true" target="_blank" rel="noopener noreferrer">Women Edition</a></li>
            <li><a href="https://themindly.gumroad.com/l/howwespeak-scripts?wanted=true" target="_blank" rel="noopener noreferrer">Complete Script Collection</a></li>
            <li><a href="https://themindly.gumroad.com/l/howwespeak-sextalk?wanted=true" target="_blank" rel="noopener noreferrer">Sex Talk Framework</a></li>
            <li><a href="https://themindly.gumroad.com/l/howwespeak-bundle" target="_blank" rel="noopener noreferrer">Complete Bundle</a></li>
            <li><a href="mailto:admin@tryhowwespeak.com?subject=Couple Session Booking">Couple Session</a></li>
          </ul>
        </div>

        <div>
          <h3 class="footer__col-title">Company</h3>
          <ul class="footer__links" role="list">
            <li><a href="/index.html#story">Our Story</a></li>
            <li><a href="/index.html#faq">FAQ</a></li>
            <li><a href="mailto:admin@tryhowwespeak.com">Contact</a></li>
          </ul>
        </div>

        <div>
          <h3 class="footer__col-title">Support</h3>
          <ul class="footer__links" role="list">
            <li><a href="refund-policy.html">Refund Policy</a></li>
            <li><a href="privacy-policy.html">Privacy Policy</a></li>
            <li><a href="terms.html">Terms of Service</a></li>
            <li><a href="mailto:admin@tryhowwespeak.com">admin@tryhowwespeak.com</a></li>
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
