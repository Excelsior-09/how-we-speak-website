/**
 * HOW WE SPEAK — GLOBAL JAVASCRIPT
 * Handles: cart, navbar, scroll reveal, FAQ, mobile menu
 * Version: 1.0.0
 */

'use strict';

/* ── PRODUCT REGISTRY ─────────────────────────────────────── */
const HWS = {
  LOGO: 'https://i.ibb.co/hR2KXFd4/Gemini-Generated-Image-bbp6v6bbp6v6bbp6-1-removebg-preview.png',
  IMAGES: {
    hero:          'https://i.ibb.co/fdbkn9P9/Image-20260807002710-599-9.jpg',
    solution:      'https://i.ibb.co/BKrQ9R53/Chat-GPT-Image-Aug-7-2026-12-06-50-AM.png',
    bundle:        'https://i.ibb.co/84LyRsYY/Chat-GPT-Image-Aug-7-2026-12-18-35-AM.png',
    founder:       'https://i.ibb.co/67tXYqrh/Gemini-Generated-Image-u49ddbu49ddbu49d.png',
    menFront:      'https://i.ibb.co/rffWKyGB/Chat-GPT-Image-Aug-5-2026-07-50-17-PM.png',
    menBack:       'https://i.ibb.co/SgZSkGv/Chat-GPT-Image-Aug-5-2026-08-07-55-PM.png',
    womenFront:    'https://i.ibb.co/j9fk1Qq0/Chat-GPT-Image-Aug-6-2026-10-23-22-AM.png',
    womenBack:     'https://i.ibb.co/b51mxMRh/Chat-GPT-Image-Aug-7-2026-12-21-33-AM.png',
    scriptsFront:  'https://i.ibb.co/KxgzQmtY/Chat-GPT-Image-Aug-6-2026-11-17-13-AM.png',
    scriptsBack:   'https://i.ibb.co/My7dwTJH/Chat-GPT-Image-Aug-6-2026-11-26-29-AM.png',
    sexFront:      'https://i.ibb.co/dJpxv1hb/Chat-GPT-Image-Aug-6-2026-11-36-39-AM.png',
    sexBack:       'https://i.ibb.co/TqhrG4kK/Chat-GPT-Image-Aug-7-2026-12-26-10-AM.png',
  },
  PRODUCTS: {
    'men-edition':       { id:'men-edition',       name:'How We Speak: Men Edition',      subtitle:'Understanding How Men Think, Communicate and Love',         price:37, tag:'For Women', url:'men-edition.html',       img:'menFront'    },
    'women-edition':     { id:'women-edition',     name:'How We Speak: Women Edition',    subtitle:'Understanding How Women Think, Communicate and Connect',      price:37, tag:'For Men',   url:'women-edition.html',     img:'womenFront'  },
    'script-collection': { id:'script-collection', name:'Complete Script Collection',     subtitle:'75+ Scripts for Every Relationship Situation',               price:27, tag:'75 Scripts',url:'script-collection.html', img:'scriptsFront'},
    'sex-talk':          { id:'sex-talk',          name:'Sex Talk Framework',             subtitle:'Communicating Comfortably About Intimacy',                   price:27, tag:'Intimacy',  url:'sex-talk.html',          img:'sexFront'    },
    'bundle':            { id:'bundle',            name:'Complete Bundle — All 4 Guides', subtitle:'Every How We Speak guide. One price. Instant access.',        price:97, originalPrice:128, tag:'Best Value', url:'bundle.html', img:'bundle' }
  },
  PROMO_CODES: {
    'LAUNCH30':  0.30,
    'WELCOME10': 0.10,
    'COUPLE20':  0.20,
    'HOWWESPEAK': 0.15
  }
};

/* ── CART ENGINE ──────────────────────────────────────────── */
const Cart = {
  _key: 'hws_cart_v1',

  get() {
    try { return JSON.parse(sessionStorage.getItem(this._key)) || []; }
    catch { return []; }
  },

  save(items) {
    sessionStorage.setItem(this._key, JSON.stringify(items));
    this._dispatch();
  },

  add(id, qty = 1) {
    const items = this.get();
    const existing = items.find(i => i.id === id);
    if (existing) {
      existing.qty = Math.min(existing.qty + qty, 10);
    } else {
      items.push({ id, qty: Math.min(qty, 10) });
    }
    this.save(items);
  },

  remove(id) {
    this.save(this.get().filter(i => i.id !== id));
  },

  updateQty(id, qty) {
    if (qty <= 0) { this.remove(id); return; }
    const items = this.get();
    const item = items.find(i => i.id === id);
    if (item) { item.qty = Math.min(qty, 10); this.save(items); }
  },

  clear() {
    sessionStorage.removeItem(this._key);
    this._dispatch();
  },

  count() { return this.get().reduce((s, i) => s + i.qty, 0); },

  subtotal() {
    return this.get().reduce((s, i) => {
      const p = HWS.PRODUCTS[i.id];
      return s + (p ? p.price * i.qty : 0);
    }, 0);
  },

  applyDiscount(code) {
    const rate = HWS.PROMO_CODES[code.toUpperCase()];
    if (!rate) return null;
    return Math.round(this.subtotal() * rate);
  },

  _dispatch() {
    window.dispatchEvent(new CustomEvent('hws:cart', {
      detail: { count: this.count(), subtotal: this.subtotal() }
    }));
  }
};

window.Cart = Cart;
window.HWS   = HWS;

/* ── NAVBAR ───────────────────────────────────────────────── */
function initNav() {
  const nav    = document.getElementById('navbar');
  const toggle = document.querySelector('.nav__mobile-toggle');
  const links  = document.querySelector('.nav__links');
  const cta    = document.querySelector('.nav__cta');
  if (!nav) return;

  // Scroll state
  const updateNav = () => nav.classList.toggle('scrolled', window.scrollY > 80);
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  // Mobile toggle
  if (toggle) {
    let open = false;
    toggle.addEventListener('click', () => {
      open = !open;
      toggle.setAttribute('aria-expanded', String(open));
      if (links) {
        if (open) {
          links.style.cssText = 'display:flex;flex-direction:column;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(250,250,248,0.98);backdrop-filter:blur(20px);padding:100px 32px 40px;gap:28px;z-index:998;align-items:center;justify-content:center';
          // Animate spans to X
          const spans = toggle.querySelectorAll('span');
          spans[0].style.transform = 'rotate(45deg) translate(5px,5px)';
          spans[1].style.opacity = '0';
          spans[2].style.transform = 'rotate(-45deg) translate(5px,-5px)';
        } else {
          links.style.cssText = '';
          const spans = toggle.querySelectorAll('span');
          spans[0].style.transform = '';
          spans[1].style.opacity = '';
          spans[2].style.transform = '';
        }
      }
    });
    // Close on link click
    if (links) {
      links.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
          if (open) { open = false; toggle.click(); }
        });
      });
    }
  }

  // Active link
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href && !href.startsWith('#') && !href.startsWith('mailto') && href === currentPage) {
      a.classList.add('active');
    }
  });

  // Smooth scroll for hash links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });
}

/* ── CART UI ──────────────────────────────────────────────── */
function initCartUI() {
  const bar     = document.getElementById('cartBar');
  const badge   = document.getElementById('cartBadge');
  const count   = document.getElementById('cartBarCount');
  const total   = document.getElementById('cartBarTotal');
  const toast   = document.getElementById('cartToast');

  function updateBar() {
    const c = Cart.count();
    const t = Cart.subtotal();
    if (badge)  badge.textContent  = c;
    if (count)  count.textContent  = c + ' item' + (c !== 1 ? 's' : '') + ' in cart';
    if (total)  total.textContent  = '$' + t;
    if (bar)    bar.classList.toggle('visible', c > 0);
  }

  window.addEventListener('hws:cart', updateBar);
  updateBar();

  window.showCartToast = function(msg) {
    if (!toast) return;
    const textEl = toast.querySelector('.toast-msg');
    if (textEl) textEl.textContent = msg || 'Added to cart';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
  };
}

/* ── ADD TO CART HELPER ───────────────────────────────────── */
window.addToCart = function(productId, qty) {
  qty = qty || parseInt(document.getElementById('qtyInput')?.value || '1', 10);
  productId = productId || document.body.dataset.product;
  if (!productId) return;
  Cart.add(productId, qty);
  window.showCartToast?.('Added to cart ✓');
};

/* ── QTY CONTROL ──────────────────────────────────────────── */
function initQtyControl() {
  const minus = document.getElementById('qtyMinus');
  const plus  = document.getElementById('qtyPlus');
  const input = document.getElementById('qtyInput');
  if (!minus || !plus || !input) return;

  minus.addEventListener('click', () => {
    const v = parseInt(input.value, 10);
    if (v > 1) input.value = v - 1;
  });
  plus.addEventListener('click', () => {
    const v = parseInt(input.value, 10);
    if (v < 10) input.value = v + 1;
  });
}

/* ── GALLERY THUMBS ───────────────────────────────────────── */
function initGallery() {
  const mainImg = document.getElementById('galleryMain');
  const thumbs  = document.querySelectorAll('.gallery-thumb');
  if (!mainImg || !thumbs.length) return;

  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      const src = thumb.dataset.src;
      const alt = thumb.dataset.alt || '';
      mainImg.src = src;
      mainImg.alt = alt;
      thumbs.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });
}

/* ── SCROLL REVEAL ────────────────────────────────────────── */
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => obs.observe(el));
}

/* ── FAQ ACCORDION ────────────────────────────────────────── */
function initFAQ() {
  document.querySelectorAll('.faq__question').forEach(btn => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      document.querySelectorAll('.faq__question').forEach(b => {
        b.setAttribute('aria-expanded', 'false');
        const ans = document.getElementById(b.getAttribute('aria-controls'));
        if (ans) ans.classList.remove('open');
      });
      if (!expanded) {
        btn.setAttribute('aria-expanded', 'true');
        const ans = document.getElementById(btn.getAttribute('aria-controls'));
        if (ans) ans.classList.add('open');
      }
    });
  });
}

/* ── COUNTER ANIMATION ────────────────────────────────────── */
function initCounters() {
  const els = document.querySelectorAll('[data-count]');
  if (!els.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el  = e.target;
      const end = parseInt(el.dataset.count, 10);
      let   cur = 0;
      const step = end / 60;
      const timer = setInterval(() => {
        cur = Math.min(cur + step, end);
        el.textContent = Math.floor(cur).toLocaleString();
        if (cur >= end) clearInterval(timer);
      }, 16);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  els.forEach(el => obs.observe(el));
}

/* ── TICKER PAUSE ON HOVER ────────────────────────────────── */
function initTicker() {
  const t = document.querySelector('.ticker__track');
  if (!t) return;
  t.addEventListener('mouseenter', () => t.style.animationPlayState = 'paused');
  t.addEventListener('mouseleave', () => t.style.animationPlayState = 'running');
}

/* ── INIT ─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initCartUI();
  initQtyControl();
  initGallery();
  initReveal();
  initFAQ();
  initCounters();
  initTicker();
});
