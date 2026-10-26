// ==============================================================================
// TRYHOWWESPEAK — HEADER OVERFLOW & NAVIGATION REDESIGN VERIFICATION SUITE
// Verifies all requirements from the header, navigation, and hero redesign spec
// ==============================================================================

import assert from 'assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const indexPath = path.join(rootDir, 'index.html');
const componentsJsPath = path.join(rootDir, 'assets', 'js', 'components.js');
const indexCssPath = path.join(rootDir, 'assets', 'css', 'index.css');
const componentsCssPath = path.join(rootDir, 'assets', 'css', 'components.css');
const responsiveCssPath = path.join(rootDir, 'assets', 'css', 'responsive.css');
const sitemapPath = path.join(rootDir, 'sitemap.xml');

async function runHeaderAndHeroVerificationTests() {
  console.log('🧪 Running Header Overflow & Navigation Redesign Verification Suite...\n');
  let passed = 0;

  const html = fs.readFileSync(indexPath, 'utf-8');
  const componentsJs = fs.readFileSync(componentsJsPath, 'utf-8');
  const indexCss = fs.readFileSync(indexCssPath, 'utf-8');
  const componentsCss = fs.readFileSync(componentsCssPath, 'utf-8');
  const responsiveCss = fs.readFileSync(responsiveCssPath, 'utf-8');
  const sitemap = fs.readFileSync(sitemapPath, 'utf-8');

  // Test 1: Root Cause Fix - Hero has content-driven height (no min-height: 100vh)
  {
    assert.ok(!indexCss.includes('min-height: 100vh;'), 'index.css should remove min-height: 100vh from .hero');
    assert.ok(indexCss.includes('padding-bottom: 80px;') || indexCss.includes('padding-bottom: 72px;'), 'hero must reserve dedicated bottom clearance');
    assert.ok(indexCss.includes('overflow: clip;'), 'hero should use overflow: clip to prevent horizontal scroll without clipping document flow');
    passed++;
    console.log('  ✅ PASS: Hero content-driven height and safe padding envelope verified');
  }

  // Test 2: Hero float-card and rehearsal card position within safe bounds
  {
    assert.ok(!indexCss.includes('bottom: -24px;'), 'hero__float-card must not have negative bottom margin/positioning');
    assert.ok(indexCss.includes('.hero__float-card'), 'hero__float-card must exist');
    assert.ok(indexCss.includes('bottom: 20px;') || indexCss.includes('bottom: 16px;'), 'float card must be anchored safely within image layout');
    assert.ok(indexCss.includes('.hero__rehearsal-card'), 'hero__rehearsal-card must exist');
    passed++;
    console.log('  ✅ PASS: Hero floating stat card safely anchored within hero container bounds');
  }

  // Test 3: Normal document flow for statistics strip and overflow protection for ticker
  {
    assert.ok(componentsCss.includes('.proof-strip'), 'proof-strip must exist in components.css');
    assert.ok(componentsCss.includes('clear: both;'), 'proof-strip should have clear: both');
    assert.ok(componentsCss.includes('.ticker'), 'ticker must exist in components.css');
    assert.ok(componentsCss.includes('max-width: 100vw;'), 'ticker must have max-width constraint to prevent horizontal overflow');
    passed++;
    console.log('  ✅ PASS: Statistics strip and ticker document flow and horizontal bounds verified');
  }

  // Test 4: Simplified Navigation Structure (Logo Left, 5 Links Center including Contact Us, Log In + CTA Right)
  {
    // Logo links home
    assert.ok(html.includes('class="nav__logo" aria-label="How We Speak — Home"'));
    assert.ok(html.includes('href="index.html" class="nav__logo"'));

    // Desktop navbar has the center destinations
    assert.ok(html.includes('AI Conversation Tool'));
    assert.ok(html.includes('>Guides<'));
    assert.ok(html.includes('>Articles<'));
    assert.ok(html.includes('>Take the Quiz<'));
    assert.ok(html.includes('href="https://form.jotform.com/262898494732071"') && html.includes('>Contact Us<'));

    // Badge removed from Quiz link
    assert.ok(!html.includes('nav-quiz-badge'), 'No extra badges should clutter the main navigation links');

    // Right action buttons
    assert.ok(html.includes('id="navLoginBtn"') && html.includes('/app?auth=login'));
    assert.ok(html.includes('id="navPrimaryCta"') && html.includes('/app/rehearse'));
    assert.ok(html.includes('Try It Free'));

    // components.js shared nav also has the center links
    assert.ok(componentsJs.includes('AI Conversation Tool'));
    assert.ok(componentsJs.includes('Guides'));
    assert.ok(componentsJs.includes('Articles'));
    assert.ok(componentsJs.includes('Take the Quiz'));
    assert.ok(componentsJs.includes('https://form.jotform.com/262898494732071') && componentsJs.includes('Contact Us'));
    assert.ok(componentsJs.includes('id="navLoginBtn"'));
    assert.ok(componentsJs.includes('id="navPrimaryCta"'));

    passed++;
    console.log('  ✅ PASS: Unified desktop navigation (5 center links including Jotform Contact Us, right actions, no extraneous badges) verified');
  }

  // Test 5: Nonessential links removed from desktop navbar but preserved in footer and contextual areas
  {
    // Footer contains Our Story, FAQ, Contact, and Bundle
    assert.ok(html.includes('href="#story">Our Story</a>'), 'Footer must retain Our Story');
    assert.ok(html.includes('href="#faq">FAQ</a>'), 'Footer must retain FAQ');
    assert.ok(html.includes('https://form.jotform.com/262898494732071'), 'Footer must retain Contact link');
    assert.ok(html.includes('https://themindly.gumroad.com/l/howwespeak-bundle'), 'Footer must retain Gumroad bundle link');
    assert.ok(html.includes('id="top-sticky-vault-bar"'), 'Sticky announcement bar must retain bundle offer');
    assert.ok(html.includes('id="guides"'), 'Digital products section must be present');
    assert.ok(html.includes('id="bundle"'), 'Bundle section must be present');
    assert.ok(html.includes('id="story"'), 'Story section must be present');
    assert.ok(html.includes('id="faq"'), 'FAQ section must be present');

    passed++;
    console.log('  ✅ PASS: Removed header links verified discoverable and accessible via footer and page sections');
  }

  // Test 6: Responsive Collapse & Mobile Drawer Accessibility
  {
    // Breakpoint at 991px/992px
    assert.ok(componentsCss.includes('@media (max-width: 991px)'), 'components.css must define tablet collapse breakpoint');
    // Mobile toggle attributes
    assert.ok(html.includes('aria-label="Open menu"'));
    assert.ok(html.includes('aria-expanded="false"'));
    assert.ok(html.includes('aria-controls="navLinks"'));
    // Mobile CTA retained on mobile
    assert.ok(componentsCss.includes('.nav__cta .btn-primary'), 'Signup CTA must be preserved on tablet and mobile');
    assert.ok(html.includes('id="mobilePrimaryCta"'), 'Mobile drawer must retain full CTA');
    // Escape key handling
    assert.ok(componentsJs.includes("e.key === 'Escape'"), 'components.js must handle Escape key for accessibility');

    passed++;
    console.log('  ✅ PASS: Responsive collapse, accessible drawer, and mobile signup CTA visibility verified');
  }

  // Test 7: Technical SEO & Sitemap Integrity
  {
    assert.ok(html.includes('rel="canonical" href="https://tryhowwespeak.com/"'));
    assert.ok(html.includes('name="robots"'));
    assert.ok(html.includes('type="application/ld+json"'));
    assert.ok(sitemap.includes('https://www.tryhowwespeak.com/'));
    assert.ok(sitemap.includes('https://www.tryhowwespeak.com/articles'));
    assert.ok(sitemap.includes('https://www.tryhowwespeak.com/quiz'));
    assert.ok(sitemap.includes('https://www.tryhowwespeak.com/contact'));

    passed++;
    console.log('  ✅ PASS: SEO metadata, canonical tags, and sitemap integrity verified');
  }

  console.log(`\n🎉 All ${passed} Header & Hero Redesign tests PASSED successfully!\n`);
}

runHeaderAndHeroVerificationTests().catch(err => {
  console.error('❌ Test Failure:', err);
  process.exit(1);
});
