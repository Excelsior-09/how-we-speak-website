/** HOW WE SPEAK — MAIN INITIALIZATION */
'use strict';

/* ── NAVBAR ── */
function initNav() {
  const nav = document.getElementById('navbar');
  if (!nav) return;

  // Scroll state
  const updateNav = () => nav.classList.toggle('scrolled', window.scrollY > 80);
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  // Mobile toggle behavior is owned by the page's own nav script (see index.html).

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

/* ── GALLERY THUMBS ── */
function initGallery() {
  const mainImg = document.getElementById('galleryMain');
  const thumbs = document.querySelectorAll('.gallery-thumb');
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

/* ── ENTRY POPUP ── */
function initEntryPopup() {
  const popup = document.getElementById('entryPopup');
  if (!popup) return;

  const alreadyShown = sessionStorage.getItem('hws_entry_popup_shown');
  if (alreadyShown === 'true') return;

  setTimeout(() => {
    popup.classList.add('visible');
    document.body.style.overflow = 'hidden';
    sessionStorage.setItem('hws_entry_popup_shown', 'true');
  }, 1500);

  const closeBtn = popup.querySelector('.entry-popup__close');
  const backdrop = popup.querySelector('.entry-popup__backdrop');
  const dismissBtn = popup.querySelector('.entry-popup__dismiss');

  function close() {
    popup.classList.remove('visible');
    document.body.style.overflow = '';
  }

  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  dismissBtn.addEventListener('click', close);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && popup.classList.contains('visible')) {
      close();
    }
  });

  const ctaBtn = popup.querySelector('.entry-popup__cta');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
      setTimeout(close, 300);
    });
  }
}

window.closeEntryPopup = function () {
  const popup = document.getElementById('entryPopup');
  if (popup) {
    popup.classList.remove('visible');
    document.body.style.overflow = '';
  }
};

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  initEntryPopup();
  initNav();
  initCartUI();
  initQtyControl();
  initGallery();
  initReveal();
  initFAQ();
  initCounters();
  initTicker();
});
