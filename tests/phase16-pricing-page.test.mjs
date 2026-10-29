// ==============================================================================
// TEST SUITE: Phase 16 — TryHowWeSpeak /pricing Page Verification
// Tests catalog data integrity, section architecture, responsive CSS, SEO & routing.
// ==============================================================================

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

test('Phase 16: TryHowWeSpeak /pricing Page Implementation & Quality Verification', async (t) => {

  await t.test('1. Centralized Catalog Integrity & Pricing Math', () => {
    const catalogPath = path.join(ROOT_DIR, 'assets', 'js', 'pricing-catalog.js');
    assert.ok(fs.existsSync(catalogPath), 'pricing-catalog.js must exist');
    const catalogCode = fs.readFileSync(catalogPath, 'utf8');

    // Evaluate HWS_CATALOG in mock window
    const mockWindow = {};
    const evalFunc = new Function('window', catalogCode);
    evalFunc(mockWindow);

    const catalog = mockWindow.HWS_CATALOG;
    assert.ok(catalog, 'HWS_CATALOG must be exported');
    assert.strictEqual(catalog.currency, 'USD');

    // 1.1 Verify Products
    const products = catalog.products;
    assert.ok(Array.isArray(products) && products.length >= 6, 'Must contain all 6 catalog products');

    const men = products.find(p => p.id === 'men-edition');
    assert.ok(men, 'Men Edition must exist');
    assert.strictEqual(men.price, 37, 'Men Edition must be $37');
    assert.strictEqual(men.outcomes.length, 3, 'Must have 3 verified outcomes');

    const women = products.find(p => p.id === 'women-edition');
    assert.ok(women, 'Women Edition must exist');
    assert.strictEqual(women.price, 37, 'Women Edition must be $37');

    const scripts = products.find(p => p.id === 'script-collection');
    assert.ok(scripts, 'Script Collection must exist');
    assert.strictEqual(scripts.price, 27, 'Script Collection must be $27');

    const sexTalk = products.find(p => p.id === 'sex-talk');
    assert.ok(sexTalk, 'Sex Talk Framework must exist');
    assert.strictEqual(sexTalk.price, 27, 'Sex Talk must be $27');

    const freeScripts = products.find(p => p.id === 'free-scripts');
    assert.ok(freeScripts, 'Free Scripts must exist');
    assert.strictEqual(freeScripts.price, 0, 'Free Scripts must be $0');

    // 1.2 Verify Bundle Mathematics
    const bundle = catalog.bundle;
    assert.ok(bundle, 'Featured Bundle must exist');
    assert.strictEqual(bundle.bundlePrice, 97, 'Bundle price must be $97');
    assert.strictEqual(bundle.totalIndividualPrice, 128, 'Individual sum must be $128 (37+37+27+27)');
    assert.strictEqual(bundle.savingsAmount, 31, 'Savings amount must be exactly $31 (128 - 97)');
    assert.strictEqual(bundle.savingsPercentage, 24, 'Savings percentage must be 24%');

    // 1.3 Verify Membership Plans
    const memberships = catalog.memberships;
    assert.strictEqual(memberships.length, 3, 'Must have 3 verified membership tiers');
    const freePlan = memberships.find(m => m.id === 'starter');
    const bundlePlan = memberships.find(m => m.id === 'bundle_lifetime');
    const proPlan = memberships.find(m => m.id === 'workspace_pro');
    assert.ok(freePlan && freePlan.price === 0, 'Free starter plan must exist at $0');
    assert.ok(bundlePlan && bundlePlan.price === 97, 'Complete bundle lifetime must exist at $97');
    assert.ok(proPlan && proPlan.price === 19, 'Workspace Pro must exist at $19/mo');
  });

  await t.test('2. HTML Structure, Hero, and Sections A-I', () => {
    const pricingHtmlPath = path.join(ROOT_DIR, 'pricing.html');
    assert.ok(fs.existsSync(pricingHtmlPath), 'pricing.html must exist');
    const html = fs.readFileSync(pricingHtmlPath, 'utf8');

    // Section A: Hero
    assert.ok(html.includes('YOUR NEXT CHAPTER STARTS HERE'), 'Hero eyebrow must be present');
    assert.ok(html.includes('Better Conversations Start With the Right Tools.'), 'Hero headline must be present');
    assert.ok(html.includes('href="#collection"'), 'Hero CTA must scroll to collection');
    assert.ok(html.includes('href="#memberships"'), 'Hero secondary CTA must scroll to memberships');
    assert.ok(html.includes('30-day money-back guarantee'), 'Reassurance claim must be present');

    // Section B: Category Navigation
    assert.ok(html.includes('category-nav'), 'Category nav must exist');
    assert.ok(html.includes('data-category="all"'), 'All Resources filter must exist');
    assert.ok(html.includes('data-category="ebooks"'), 'eBooks filter must exist');
    assert.ok(html.includes('data-category="scripts"'), 'Scripts filter must exist');
    assert.ok(html.includes('data-category="bundles"'), 'Bundles filter must exist');
    assert.ok(html.includes('data-category="memberships"'), 'Memberships filter must exist');
    assert.ok(html.includes('pricingSort'), 'Sort select control must exist');

    // Section C: Grid
    assert.ok(html.includes('id="pricingGrid"'), 'Pricing grid container must exist');

    // Section D: Featured Bundle
    assert.ok(html.includes('Everything You Need, in One Collection.'), 'Bundle headline must be present');
    assert.ok(html.includes('$97'), 'Bundle $97 price must be present');
    assert.ok(html.includes('Save $31 (24% Off)'), 'Mathematically accurate savings must be present');

    // Section E: Memberships & Comparison Table
    assert.ok(html.includes('Choose How You Want to Grow.'), 'Memberships headline must be present');
    assert.ok(html.includes('Free Starter'), 'Free starter tier must be present');
    assert.ok(html.includes('Workspace Pro'), 'Workspace pro tier must be present');
    assert.ok(html.includes('comparison-table'), 'Membership comparison table must exist');

    // Section F: Decision Support
    assert.ok(html.includes('Not Sure Where to Start?'), 'Decision support headline must be present');
    assert.ok(html.includes('I want practical advice & understanding'), 'Pathway 1 must be present');
    assert.ok(html.includes('I want ready-to-use words'), 'Pathway 2 must be present');
    assert.ok(html.includes('I want interactive practice & ongoing support'), 'Pathway 3 must be present');

    // Section G: Educational Blog Bridge
    assert.ok(html.includes('Learn Something That Changes Your Next Conversation.'), 'Blog bridge headline must be present');
    assert.ok(html.includes('Why You Shut Down During Arguments'), 'Article 1 must be present');
    assert.ok(html.includes('How to Stop Spiraling When Your Partner Needs Space'), 'Article 2 must be present');
    assert.ok(html.includes('What to Say When Your Partner Shuts Down'), 'Article 3 must be present');

    // Section H: FAQs
    assert.ok(html.includes('faq__question'), 'FAQ accordion questions must be present');
    assert.ok(html.includes('What is TryHowWeSpeak?'), 'FAQ 1 must be present');
    assert.ok(html.includes('Can I request a refund?'), 'FAQ refund question must be present');
    assert.ok(html.includes('Is TryHowWeSpeak a substitute for professional therapy'), 'FAQ therapy disclaimer must be present');

    // Section I: Final CTA
    assert.ok(html.includes('Your Next Conversation Can Be Different.'), 'Final CTA headline must be present');

    // Navigation & Footer Injection Slots
    assert.ok(html.includes('id="hws-nav"'), 'Must have #hws-nav slot');
    assert.ok(html.includes('id="hws-footer"'), 'Must have #hws-footer slot');
  });

  await t.test('3. SEO, Canonical URLs, Structured Data & Metadata', () => {
    const html = fs.readFileSync(path.join(ROOT_DIR, 'pricing.html'), 'utf8');

    // Canonical & robots
    assert.ok(html.includes('<link rel="canonical" href="https://tryhowwespeak.com/pricing" />'), 'Canonical URL must point to /pricing');
    assert.ok(html.includes('name="robots" content="index, follow'), 'Robots tag must allow indexing');

    // OpenGraph & Twitter
    assert.ok(html.includes('property="og:url" content="https://tryhowwespeak.com/pricing"'), 'og:url must be set');
    assert.ok(html.includes('name="twitter:card" content="summary_large_image"'), 'twitter:card must be set');

    // JSON-LD Structured Data
    assert.ok(html.includes('"@type": "WebPage"'), 'JSON-LD must define WebPage');
    assert.ok(html.includes('"@type": "ItemList"'), 'JSON-LD must define ItemList');
    assert.ok(html.includes('"@type": "Product"'), 'JSON-LD must define real Products');
    assert.ok(html.includes('"priceCurrency": "USD"'), 'Currency must be USD');

    // Sitemap check
    const sitemap = fs.readFileSync(path.join(ROOT_DIR, 'sitemap.xml'), 'utf8');
    assert.ok(sitemap.includes('https://www.tryhowwespeak.com/pricing'), 'Sitemap must contain /pricing');
  });

  await t.test('4. CSS Design Tokens, Accessibility & Responsive Breakpoints', () => {
    const cssPath = path.join(ROOT_DIR, 'assets', 'css', 'pricing.css');
    assert.ok(fs.existsSync(cssPath), 'pricing.css must exist');
    const css = fs.readFileSync(cssPath, 'utf8');

    // Token references
    assert.ok(css.includes('var(--crimson)'), 'CSS must use crimson brand token');
    assert.ok(css.includes('var(--cream)'), 'CSS must use cream brand token');
    assert.ok(css.includes('var(--font-display)'), 'CSS must use Cormorant display font token');
    assert.ok(css.includes('var(--font-body)'), 'CSS must use Inter body font token');

    // Breakpoints
    assert.ok(css.includes('@media (max-width: 1024px)'), 'Must include 1024px tablet breakpoint');
    assert.ok(css.includes('@media (max-width: 768px)'), 'Must include 768px mobile breakpoint');
    assert.ok(css.includes('prefers-reduced-motion'), 'Must support prefers-reduced-motion');
    assert.ok(css.includes(':focus-visible'), 'Must have accessible focus-visible styles');
  });

  await t.test('5. Server Route & Local Dev Server Integration', () => {
    const devServerCode = fs.readFileSync(path.join(ROOT_DIR, 'dev-server.mjs'), 'utf8');
    assert.ok(devServerCode.includes("app.get('/pricing'"), 'dev-server.mjs must serve /pricing');

    const componentsJs = fs.readFileSync(path.join(ROOT_DIR, 'assets', 'js', 'components.js'), 'utf8');
    assert.ok(componentsJs.includes('href="/pricing"'), 'components.js navbar/footer must include /pricing link');
  });
});

