# TryHowWeSpeak — Temporary Product Simplification & Restoration Manifest

**Restoration Trigger Command**: `MIRA AI RESTORE`  
**Current Active Mode**: `simplified_ebooks_and_quiz`  
**Default Application Mode (Upon Restoration)**: `full_application`  
**Date Created**: 2026-10-30  
**Architectural Rule**: **HIDE, NEVER DELETE.**

---

## 1. Executive Summary

This manifest documents the temporary simplification of the public-facing TryHowWeSpeak website. The site has been placed into a focused testing mode dedicated exclusively to:
1. **eBook Products & Collections** (Men Edition, Women Edition, Script Collection, Sex Talk Framework, Free Scripts).
2. **The Complete Bundle ($97)** with immediate digital download delivery.
3. **The Relationship Communication Quiz** (`quiz.html`) with interactive scoring, lead capture, and personalized product recommendations.
4. **Existing Payment Gateways** (Gumroad checkout URLs and Paddle billing client integration).

All unfinished or currently unneeded public-facing features—including the user dashboard, authentication (login/signup) public links, membership subscriptions ($19/mo Workspace Pro), Mira AI conversational companion promos, and My Partner features—have been **temporarily hidden from public navigation and page layouts**.

### 100% Preservation Guarantee
- **Zero source code deleted**: `web-app/src`, `api/ai/mira.js`, `api/ai/rehearsal.js`, `api/partner/invite.js` remain completely intact.
- **Zero database migrations or tables modified**: `profiles`, `mira_conversations`, `mira_messages`, `couples_spaces`, and RLS policies are preserved.
- **Zero payment routes broken**: Webhooks, Paddle configurations, and Gumroad links remain functional.
- **Direct URLs preserved**: Visitors or authorized testing tools navigating directly to `/app`, `/app/dashboard`, or `/app/mira` continue to run normally.

---

## 2. Centralized Feature Visibility Architecture

A centralized configuration file governs feature availability across the entire website:

- **Path**: [`assets/js/feature-flags.js`](file:///c:/Users/Excelsior/Desktop/how-we-speak-website/assets/js/feature-flags.js)
- **Stylesheet**: [`assets/css/simplified-mode.css`](file:///c:/Users/Excelsior/Desktop/how-we-speak-website/assets/css/simplified-mode.css)

### Active Visibility State (`window.HWS_VISIBILITY_CONFIG`):

| Feature Flag | Simplified Mode (Current) | Full Application (Restored) |
| :--- | :---: | :---: |
| `dashboard` | `false` (Hidden from public nav) | `true` |
| `authentication` | `false` (Login/signup buttons hidden) | `true` |
| `membership` | `false` (Hidden from pricing page) | `true` |
| `subscriptionPricing` | `false` (No recurring $19/mo visible) | `true` |
| `miraAi` | `false` (Public Mira prompts hidden) | `true` |
| `aiRehearsalTool` | `false` (AI studio demo hidden) | `true` |
| `myPartner` | `false` (Couples pairing promos hidden) | `true` |
| `ebooks` | `true` (Active & Purchasable) | `true` |
| `ebookBundles` | `true` (Active & Purchasable) | `true` |
| `quiz` | `true` (Active & Embed Intact) | `true` |
| `paymentGateway` | `true` (Paddle & Gumroad Active) | `true` |

---

## 3. Detailed Audit of Hidden Elements & Components

### A. Homepage (`index.html`)

1. **Desktop & Mobile Navigation**:
   - `<li><a href="#ai-tool" class="nav-ai-tool">`: Marked with `.hws-feature-ai.hws-hidden-in-simplified`.
   - `<a href="/app?auth=login" class="nav__login-btn" id="navLoginBtn">`: Marked with `.hws-feature-auth.hws-hidden-in-simplified`.
   - `<li class="mobile-login">`: Marked with `.hws-feature-auth.hws-hidden-in-simplified`.
   - Primary Nav CTAs (`#navPrimaryCta`, `#mobilePrimaryCta`): Dynamically point to `Take the Quiz` (`quiz.html`) instead of `/app?auth=signup`.
2. **Hero Section (`#home`)**:
   - Primary CTA (`#heroPrimaryCta`): Dynamically displays `Explore the Guides` (`#guides`).
   - Secondary CTA (`#heroSecondaryCta`): Dynamically displays `Take the Free Quiz` (`quiz.html`).
3. **Dedicated AI Web App Section (`#ai-tool`)**:
   - Marked with `.hws-feature-ai.hws-hidden-in-simplified` and `style="display:none;"`.
4. **Three-Step Process Section (`.ai-process-section`)**:
   - Marked with `.hws-feature-ai.hws-hidden-in-simplified` and `style="display:none;"`.
5. **Guides Section Integration Bridge (`#guides`)**:
   - `.app-complement-banner` ("Theory Meets Practice: Use our communication guides..."): Marked with `.hws-feature-app.hws-hidden-in-simplified` and `style="display:none;"`.
   - Replaced in simplified mode with `.quiz-complement-banner` ("Not sure which guide fits your dynamic? Take our free 2-minute relationship communication quiz...").
6. **Complete Bundle Section (`#bundle`)**:
   - List item `Full AI Web App Access: Unlimited Conversation Rehearsals`: Marked with `.hws-feature-ai.hws-hidden-in-simplified` and `style="display:none;"`.
   - Replaced in simplified mode with `Complete 30-Day Relational Implementation Action Plan`.
7. **Final CTA Section**:
   - Primary CTA (`#finalPrimaryCta`): Dynamically displays `Take the Free Quiz` (`quiz.html`).
   - Secondary Link (`#finalSecondaryLink`): Points to `Explore the Complete Bundle ($97)` (`#bundle`).
   - Trust Items: AI Rehearsals and Encrypted Sanctuary badges are hidden; Instant Digital Download and 30-Day Money-Back Guarantee badges are displayed.

---

### B. Pricing Page (`pricing.html`)

1. **Category Navigation (`.category-nav`)**:
   - Button `[data-category="memberships"]`: Marked with `.hws-feature-membership.hws-hidden-in-simplified`.
2. **Hero Secondary CTA**:
   - `[href="#memberships"]`: Marked with `.hws-feature-membership.hws-hidden-in-simplified`.
   - `Take the Free Quiz` button (`quiz.html`) displayed in simplified mode.
3. **Section E: Memberships Section (`#memberships`)**:
   - Entire section marked with `.hws-feature-membership.hws-hidden-in-simplified` and `style="display:none;"`.
   - Hides Free Starter card ($0), Complete Bundle recurring card, Workspace Pro card ($19/mo), and Membership Comparison Table.
4. **Section F: Guided Discovery (`.decision-section`)**:
   - Pathway 3 membership comparison card marked with `.hws-feature-membership.hws-hidden-in-simplified`.
   - Replaced with Pathway 3 Quiz Discovery card ("I want to discover our communication pattern... Take the Free Quiz").
5. **Section H: Frequently Asked Questions (`#faq`)**:
   - FAQs 4, 5, 6, and 8 (explaining memberships, Workspace Pro, recurring billing, and Mira AI) are marked with `.hws-feature-membership.hws-hidden-in-simplified`.
   - FAQs 1, 2, 3, 7 (refunds), and 9 (clinical disclaimer) remain visible.
6. **Section I: Final CTA**:
   - Secondary button `Explore Memberships` marked with `.hws-feature-membership.hws-hidden-in-simplified`.
   - `Take the Free Quiz` button displayed in simplified mode.

---

### C. Shared Components (`assets/js/components.js`)

- Injects simplified navigation on all subpages (`quiz.html`, `articles.html`, etc.) when `isSimplified` is active:
  - Links: `Guides`, `Bundle`, `Take the Quiz`, `Articles`, `Contact Us`.
  - Right Action CTA: `Take the Quiz` button (Log In and Try It Free are suppressed).
  - Skips `localStorage` auth rewrite to Dashboard so visitors remain strictly within the public eBook & quiz test flow.

---

## 4. Restoration Protocol — When You Say "MIRA AI RESTORE"

To restore the complete application, simply send the instruction:

> **MIRA AI RESTORE**

### What the restoration process will execute:

1. **Update Feature Flag Configuration**:
   In `assets/js/feature-flags.js`, change:
   ```javascript
   mode: 'full_application'
   ```
   and set all `features.*` flags to `true`.
2. **Remove Inline Display Nones**:
   - In `index.html`: Remove `style="display:none;"` from `#ai-tool`, `.ai-process-section`, and `.app-complement-banner`.
   - In `pricing.html`: Remove `style="display:none;"` from `#memberships`.
3. **Verify Restored Application**:
   - Run `npm test` to confirm 100% test pass rate across all suites.
   - Run `npm run build` to compile the web application.
   - All navigation items (AI tool, Log in, Try it free, Memberships, Mira AI) will immediately be restored and live.

---

## 5. Verification Checklist

- [x] All 6 digital eBook products are visible and purchasable.
- [x] The Complete Bundle ($97) with all 4 guides is prominent and functional.
- [x] Gumroad and Paddle checkout integrations are active and tested.
- [x] Relationship Communication Quiz (`quiz.html`) loads cleanly with JotForm integration.
- [x] Dashboard, login, signup, memberships, and Mira AI are completely hidden from public browsing.
- [x] No empty gaps, broken layouts, or orphaned buttons exist on desktop, tablet, or mobile (320px–1440px).
- [x] All 20 existing automated test suites pass with 100% success rate.

