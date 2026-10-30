// ==============================================================================
// HOW WE SPEAK — CENTRALIZED REVERSIBLE FEATURE VISIBILITY CONFIGURATION
// Controls public visibility of dashboard, authentication, memberships, and AI.
//
// ACTIVE MODE: 'simplified_ebooks_and_quiz'
// RESTORATION TRIGGER: "MIRA AI RESTORE"
// ==============================================================================

(function (window, document) {
  'use strict';

  var CONFIG = {
    // Current application visibility mode:
    // 'simplified_ebooks_and_quiz' = temporary focus on eBooks, bundles, checkout & quiz
    // 'full_application'           = full software suite (dashboard, Mira AI, auth, memberships)
    mode: 'simplified_ebooks_and_quiz',

    // Secret restoration trigger phrase
    restorationPhrase: 'MIRA AI RESTORE',

    // Feature Flags (Fine-Grained)
    features: {
      dashboard: false,            // Dashboard navigation and access buttons
      authentication: false,       // Public login & signup links
      membership: false,           // Membership tiers & subscription pricing
      subscriptionPricing: false,  // Monthly/annual recurring plans
      miraAi: false,               // Mira AI conversational companion entry points & promos
      aiRehearsalTool: false,      // Conversation Rehearsal interactive studio demos
      myPartner: false,            // My Partner & couples shared space promotions
      ebooks: true,                // Individual relationship guides & descriptions
      ebookBundles: true,          // The Complete Bundle ($97)
      quiz: true,                  // Relationship Communication Quiz
      paymentGateway: true         // Gumroad & Paddle checkout integration for digital products
    },

    // Metadata
    updatedAt: '2026-10-30T14:55:00Z',
    manifestPath: '/docs/MIRA_AI_RESTORE_MANIFEST.md'
  };

  function isSimplified() {
    return CONFIG.mode === 'simplified_ebooks_and_quiz';
  }

  function applyVisibilityState() {
    var isSimp = isSimplified();
    var root = document.documentElement;
    var body = document.body;

    if (isSimp) {
      if (root && root.setAttribute) root.setAttribute('data-hws-mode', 'simplified');
      if (body && body.setAttribute) body.setAttribute('data-hws-mode', 'simplified');
    } else {
      if (root && root.removeAttribute) root.removeAttribute('data-hws-mode');
      if (body && body.removeAttribute) body.removeAttribute('data-hws-mode');
    }

    if (typeof document.getElementById !== 'function') return;

    // Apply runtime CTA and navigation adjustments
    if (isSimp) {
      // 1. Navigation CTAs: Point to Quiz rather than App Signup
      var navPrimary = document.getElementById('navPrimaryCta');
      if (navPrimary && !navPrimary.hasAttribute('data-hws-original-text')) {
        navPrimary.setAttribute('data-hws-original-text', navPrimary.textContent || '');
        navPrimary.setAttribute('data-hws-original-href', navPrimary.getAttribute('href') || '');
        navPrimary.textContent = 'Take the Quiz';
        navPrimary.setAttribute('href', 'quiz.html');
      }

      var mobilePrimary = document.getElementById('mobilePrimaryCta');
      if (mobilePrimary && !mobilePrimary.hasAttribute('data-hws-original-text')) {
        mobilePrimary.setAttribute('data-hws-original-text', mobilePrimary.textContent || '');
        mobilePrimary.setAttribute('data-hws-original-href', mobilePrimary.getAttribute('href') || '');
        mobilePrimary.textContent = 'Take the Quiz';
        mobilePrimary.setAttribute('href', 'quiz.html');
      }

      // 2. Hero CTAs: Guide visitors to eBooks & Quiz
      var heroPrimary = document.getElementById('heroPrimaryCta');
      if (heroPrimary && !heroPrimary.hasAttribute('data-hws-original-text')) {
        heroPrimary.setAttribute('data-hws-original-text', heroPrimary.innerHTML);
        heroPrimary.setAttribute('data-hws-original-href', heroPrimary.getAttribute('href') || '');
        heroPrimary.innerHTML = 'Explore the Guides <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        heroPrimary.setAttribute('href', '#guides');
      }

      var heroSecondary = document.getElementById('heroSecondaryCta');
      if (heroSecondary && !heroSecondary.hasAttribute('data-hws-original-text')) {
        heroSecondary.setAttribute('data-hws-original-text', heroSecondary.textContent || '');
        heroSecondary.setAttribute('data-hws-original-href', heroSecondary.getAttribute('href') || '');
        heroSecondary.textContent = 'Take the Free Quiz';
        heroSecondary.setAttribute('href', 'quiz.html');
      }

      // 3. Final Section CTA
      var finalPrimary = document.getElementById('finalPrimaryCta');
      if (finalPrimary && !finalPrimary.hasAttribute('data-hws-original-text')) {
        finalPrimary.setAttribute('data-hws-original-text', finalPrimary.innerHTML);
        finalPrimary.setAttribute('data-hws-original-href', finalPrimary.getAttribute('href') || '');
        finalPrimary.innerHTML = 'Take the Free Quiz <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        finalPrimary.setAttribute('href', 'quiz.html');
      }

      var finalSecondary = document.getElementById('finalSecondaryLink');
      if (finalSecondary && !finalSecondary.hasAttribute('data-hws-original-text')) {
        finalSecondary.setAttribute('data-hws-original-text', finalSecondary.textContent || '');
        finalSecondary.setAttribute('data-hws-original-href', finalSecondary.getAttribute('href') || '');
        finalSecondary.textContent = 'Explore the Complete Bundle ($97)';
        finalSecondary.setAttribute('href', '#bundle');
      }
    } else {
      // Revert CTAs to original full application values if restored
      var navPrimaryRestore = document.getElementById('navPrimaryCta');
      if (navPrimaryRestore && navPrimaryRestore.hasAttribute('data-hws-original-text')) {
        navPrimaryRestore.textContent = navPrimaryRestore.getAttribute('data-hws-original-text');
        navPrimaryRestore.setAttribute('href', navPrimaryRestore.getAttribute('data-hws-original-href'));
        navPrimaryRestore.removeAttribute('data-hws-original-text');
        navPrimaryRestore.removeAttribute('data-hws-original-href');
      }

      var mobilePrimaryRestore = document.getElementById('mobilePrimaryCta');
      if (mobilePrimaryRestore && mobilePrimaryRestore.hasAttribute('data-hws-original-text')) {
        mobilePrimaryRestore.textContent = mobilePrimaryRestore.getAttribute('data-hws-original-text');
        mobilePrimaryRestore.setAttribute('href', mobilePrimaryRestore.getAttribute('data-hws-original-href'));
        mobilePrimaryRestore.removeAttribute('data-hws-original-text');
        mobilePrimaryRestore.removeAttribute('data-hws-original-href');
      }

      var heroPrimaryRestore = document.getElementById('heroPrimaryCta');
      if (heroPrimaryRestore && heroPrimaryRestore.hasAttribute('data-hws-original-text')) {
        heroPrimaryRestore.innerHTML = heroPrimaryRestore.getAttribute('data-hws-original-text');
        heroPrimaryRestore.setAttribute('href', heroPrimaryRestore.getAttribute('data-hws-original-href'));
        heroPrimaryRestore.removeAttribute('data-hws-original-text');
        heroPrimaryRestore.removeAttribute('data-hws-original-href');
      }

      var heroSecondaryRestore = document.getElementById('heroSecondaryCta');
      if (heroSecondaryRestore && heroSecondaryRestore.hasAttribute('data-hws-original-text')) {
        heroSecondaryRestore.textContent = heroSecondaryRestore.getAttribute('data-hws-original-text');
        heroSecondaryRestore.setAttribute('href', heroSecondaryRestore.getAttribute('data-hws-original-href'));
        heroSecondaryRestore.removeAttribute('data-hws-original-text');
        heroSecondaryRestore.removeAttribute('data-hws-original-href');
      }

      var finalPrimaryRestore = document.getElementById('finalPrimaryCta');
      if (finalPrimaryRestore && finalPrimaryRestore.hasAttribute('data-hws-original-text')) {
        finalPrimaryRestore.innerHTML = finalPrimaryRestore.getAttribute('data-hws-original-text');
        finalPrimaryRestore.setAttribute('href', finalPrimaryRestore.getAttribute('data-hws-original-href'));
        finalPrimaryRestore.removeAttribute('data-hws-original-text');
        finalPrimaryRestore.removeAttribute('data-hws-original-href');
      }
    }
  }

  // Programmatic helper to restore full application anytime in browser or tests
  function setMode(newMode) {
    if (newMode === 'full_application' || newMode === 'simplified_ebooks_and_quiz') {
      CONFIG.mode = newMode;
      CONFIG.features.dashboard = (newMode === 'full_application');
      CONFIG.features.authentication = (newMode === 'full_application');
      CONFIG.features.membership = (newMode === 'full_application');
      CONFIG.features.subscriptionPricing = (newMode === 'full_application');
      CONFIG.features.miraAi = (newMode === 'full_application');
      CONFIG.features.aiRehearsalTool = (newMode === 'full_application');
      CONFIG.features.myPartner = (newMode === 'full_application');
      applyVisibilityState();
      console.log('[How We Speak] Feature visibility mode set to:', newMode);
      return true;
    }
    return false;
  }

  function restoreFullApplication() {
    return setMode('full_application');
  }

  // Export to global window
  window.HWS_VISIBILITY_CONFIG = CONFIG;
  window.hwsSetMode = setMode;
  window.hwsRestoreFullApplication = restoreFullApplication;

  // Run immediately on script evaluation to prevent layout flashes
  applyVisibilityState();

  // Run again once DOM is ready to bind to elements
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyVisibilityState);
  } else {
    applyVisibilityState();
  }

})(typeof window !== 'undefined' ? window : this, typeof document !== 'undefined' ? document : {});
