// ==============================================================================
// HOW WE SPEAK — PRICING PAGE INTERACTION CONTROLLER
// Handles filtering, sorting, category switching, and checkout integration.
// ==============================================================================

(function (window, document) {
  'use strict';

  var activeCategory = 'all';
  var activeSort = 'default';

  function getCatalog() {
    return window.HWS_CATALOG || { products: [], memberships: [], articles: [], faqs: [] };
  }

  function renderProducts() {
    var catalog = getCatalog();
    var grid = document.getElementById('pricingGrid');
    var countEl = document.getElementById('resultsCount');
    if (!grid) return;

    var filtered = catalog.products.filter(function (item) {
      if (activeCategory === 'all') return true;
      if (activeCategory === 'ebooks') return item.category === 'ebooks';
      if (activeCategory === 'scripts') return item.category === 'scripts';
      if (activeCategory === 'bundles') return item.category === 'bundles';
      return true;
    });

    // Sorting logic
    if (activeSort === 'price-asc') {
      filtered.sort(function (a, b) { return a.price - b.price; });
    } else if (activeSort === 'price-desc') {
      filtered.sort(function (a, b) { return b.price - a.price; });
    } else {
      filtered.sort(function (a, b) { return a.displayOrder - b.displayOrder; });
    }

    if (countEl) {
      countEl.textContent = 'Showing ' + filtered.length + ' ' + (filtered.length === 1 ? 'resource' : 'resources');
    }

    if (filtered.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 60px 0; color: var(--gray); font-size: 15px;">No products found in this category.</div>';
      return;
    }

    var html = filtered.map(function (p) {
      var priceHtml = p.price === 0
        ? '<span class="pricing-card__price">Free</span>'
        : '<span class="pricing-card__price">$' + p.price + '</span>' +
          (p.wasPrice ? '<span class="pricing-card__price-was">$' + p.wasPrice + '</span>' : '');

      var badgeHtml = p.badge
        ? '<span class="pricing-card__badge ' + (p.badge === 'Best Value' ? 'pricing-card__badge--gold' : '') + '">' + p.badge + '</span>'
        : '';

      var hasDistinctBack = p.covers && p.covers.back && p.covers.back !== p.covers.front;
      var backCoverHtml = hasDistinctBack
        ? '<img src="' + p.covers.back + '" alt="' + p.title + ' back cover" class="pricing-card__cover pricing-card__cover--back" loading="lazy" width="340" height="425" onerror="this.style.display=\'none\';" />'
        : '';

      var outcomesHtml = (p.outcomes || []).map(function (outcome) {
        return '<li class="pricing-card__outcome-item">' +
          '<svg class="pricing-card__outcome-icon" width="15" height="15" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>' +
          '<span>' + outcome + '</span>' +
          '</li>';
      }).join('');

      var ctaText = p.price === 0 ? 'Download Free' : (p.category === 'bundles' ? 'Get The Bundle' : 'Get This Guide');
      var btnClass = p.price === 0 ? 'btn btn-secondary pricing-card__btn pricing-card__btn--free' : 'btn btn-primary pricing-card__btn';

      return '<article class="pricing-card ' + (hasDistinctBack ? 'pricing-card--has-flip' : '') + '" data-category="' + p.category + '" id="product-' + p.id + '">' +
        '<div class="pricing-card__media">' +
          badgeHtml +
          '<div class="pricing-card__cover-wrap">' +
            '<img src="' + p.covers.front + '" alt="' + p.title + ' cover" class="pricing-card__cover pricing-card__cover--front" loading="lazy" width="340" height="425" onerror="this.onerror=null; this.src=\'/assets/images/covers/bundle-cover.png\';" />' +
            backCoverHtml +
          '</div>' +
        '</div>' +
        '<div class="pricing-card__body">' +
          '<div class="pricing-card__tag">' + p.categoryLabel + '</div>' +
          '<h3 class="pricing-card__title">' + p.title + '</h3>' +
          '<p class="pricing-card__desc">' + p.description + '</p>' +
          '<ul class="pricing-card__outcomes" role="list">' + outcomesHtml + '</ul>' +
          '<div class="pricing-card__footer">' +
            '<div class="pricing-card__price-wrap">' +
              '<div>' + priceHtml + '</div>' +
              '<span class="pricing-card__price-sub">' + p.format + '</span>' +
            '</div>' +
            '<a href="' + p.checkoutUrl + '" target="_blank" rel="noopener noreferrer" class="' + btnClass + '" aria-label="' + ctaText + ' — ' + p.title + '">' +
              ctaText +
            '</a>' +
          '</div>' +
        '</div>' +
      '</article>';
    }).join('');

    grid.innerHTML = html;
  }

  function initCategoryFilter() {
    var pills = document.querySelectorAll('.category-pill');
    pills.forEach(function (pill) {
      pill.addEventListener('click', function () {
        var cat = pill.dataset.category;
        if (!cat) return;

        // If clicking memberships, smooth scroll to the memberships section
        if (cat === 'memberships') {
          var memSec = document.getElementById('memberships');
          if (memSec) {
            memSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          return;
        }

        // Otherwise filter catalog and scroll if below collection
        activeCategory = cat;
        pills.forEach(function (p) { p.classList.remove('active'); });
        pill.classList.add('active');
        renderProducts();

        var collection = document.getElementById('collection');
        if (collection && window.scrollY > collection.offsetTop) {
          collection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  function initSortControl() {
    var sortSelect = document.getElementById('pricingSort');
    if (!sortSelect) return;

    sortSelect.addEventListener('change', function (e) {
      activeSort = e.target.value;
      renderProducts();
    });
  }

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var href = anchor.getAttribute('href');
        if (href === '#' || !href) return;
        var target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  function initNavScroll() {
    var nav = document.getElementById('navbar');
    if (!nav) return;
    var updateNav = function () {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    };
    window.addEventListener('scroll', updateNav, { passive: true });
    updateNav();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNavScroll();
    renderProducts();
    initCategoryFilter();
    initSortControl();
    initSmoothScroll();
  });

})(window, document);

