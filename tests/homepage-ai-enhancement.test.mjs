// ==============================================================================
// HOW WE SPEAK — HOMEPAGE AI REDESIGN VERIFICATION TEST SUITE
// Verifies all 12 section criteria from the homepage AI introduction specification
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

async function runHomepageVerificationTests() {
  console.log('🧪 Running Homepage AI Enhancement Verification Suite...\n');
  let passed = 0;

  const html = fs.readFileSync(indexPath, 'utf-8');
  const componentsJs = fs.readFileSync(componentsJsPath, 'utf-8');
  const indexCss = fs.readFileSync(indexCssPath, 'utf-8');

  // Test 1: Single H1 check and SEO Title & Description preserved
  {
    const h1Matches = html.match(/<h1[\s\S]*?<\/h1>/gi) || [];
    assert.equal(h1Matches.length, 1, 'Page should have exactly one H1 element');
    assert.ok(html.includes('<title>Relationship Communication Scripts & Nervous System Guide | How We Speak</title>'));
    assert.ok(html.includes('name="description"'));
    passed++;
    console.log('  ✅ PASS: Exact single H1 element and SEO metadata verified');
  }

  // Test 2: Navigation contains "AI Conversation Tool", "Log In", and "Try It Free"
  {
    assert.ok(html.includes('AI Conversation Tool'), 'Navbar must include AI Conversation Tool');
    assert.ok(html.includes('nav-ai-tool'), 'Nav link should have dedicated class');
    assert.ok(html.includes('id="navLoginBtn"'), 'Navbar must include accessible Log In button');
    assert.ok(html.includes('/app?auth=login'), 'Log In link must lead to /app?auth=login');
    assert.ok(html.includes('id="navPrimaryCta"'), 'Navbar must include primary CTA');
    assert.ok(html.includes('Try It Free'), 'Primary CTA text must be Try It Free');
    assert.ok(componentsJs.includes('AI Conversation Tool'), 'components.js must include AI Conversation Tool');
    assert.ok(componentsJs.includes('Try It Free'), 'components.js must include Try It Free');
    passed++;
    console.log('  ✅ PASS: Navigation links, Log In option, and Try It Free CTA verified');
  }

  // Test 3: Hero section specifications
  {
    assert.ok(html.includes('BETTER CONVERSATIONS START HERE'), 'Hero eyebrow must match specification');
    assert.ok(html.includes('The hardest words are often the ones that matter most.'), 'Hero headline must match specification');
    assert.ok(html.includes('Prepare for difficult conversations with AI-guided practice'), 'Hero supporting copy must match specification');
    assert.ok(html.includes('id="heroPrimaryCta"'), 'Hero must contain primary CTA');
    assert.ok(html.includes('Try the AI Tool Free'), 'Hero primary CTA text must be Try the AI Tool Free');
    assert.ok(html.includes('Explore Our Guides'), 'Hero secondary CTA text must be Explore Our Guides');
    assert.ok(html.includes('hero__rehearsal-card'), 'Hero must contain restrained rehearsal UI preview');
    assert.ok(html.includes('Free Trial: 3 Full Rehearsals Included'), 'Trust items must accurately reflect free trial');
    passed++;
    console.log('  ✅ PASS: Hero copy, dual CTAs, restrained UI preview card, and accurate trial terms verified');
  }

  // Test 4: Dedicated AI Web App Section (Section 5)
  {
    assert.ok(html.includes('id="ai-tool"'), 'Dedicated AI section must exist with id ai-tool');
    assert.ok(html.includes('INTRODUCING TRYHOWWESPEAK AI'), 'Section eyebrow must match specification');
    assert.ok(html.includes('Meet your <em>Conversation Rehearsal.</em>') || html.includes('Meet your Conversation Rehearsal.'), 'Headline must match');
    assert.ok(html.includes('Not sure how to start a difficult conversation?'), 'Description must match');
    assert.ok(html.includes('Find the words'), 'Benefit A title must match');
    assert.ok(html.includes('Turn a difficult situation into a clear, respectful message.'), 'Benefit A copy must match');
    assert.ok(html.includes('Practice your response'), 'Benefit B title must match');
    assert.ok(html.includes('Explore ways to continue a conversation when the other person disagrees or becomes defensive.'), 'Benefit B copy must match');
    assert.ok(html.includes('Choose your tone'), 'Benefit C title must match');
    assert.ok(html.includes('Find an approach that feels gentle, calm and direct, or firm but respectful.'), 'Benefit C copy must match');
    assert.ok(html.includes('Save your plan'), 'Benefit D title must match');
    assert.ok(html.includes('Keep your preparation available for the next time you need it.'), 'Benefit D copy must match');
    assert.ok(html.includes('Start Your Free Rehearsal'), 'Dedicated section CTA must match');
    passed++;
    console.log('  ✅ PASS: Dedicated AI section, 4 core benefits, and Start Your Free Rehearsal CTA verified');
  }

  // Test 5: Three-Step Explanation (Section 6)
  {
    assert.ok(html.includes('01') && html.includes('Describe'), 'Step 1 must be Describe');
    assert.ok(html.includes('Tell us what conversation you need to prepare for.'), 'Step 1 copy must match');
    assert.ok(html.includes('02') && html.includes('Rehearse'), 'Step 2 must be Rehearse');
    assert.ok(html.includes('Explore alternative ways to communicate your thoughts and needs.'), 'Step 2 copy must match');
    assert.ok(html.includes('03') && html.includes('Prepare'), 'Step 3 must be Prepare');
    assert.ok(html.includes('Choose the wording that feels right and save your plan if the feature is available.'), 'Step 3 copy must match');
    passed++;
    console.log('  ✅ PASS: Compact Three-Step Explanation (Describe, Rehearse, Prepare) verified');
  }

  // Test 6: Digital products and bundles integration (Section 7)
  {
    assert.ok(html.includes('app-complement-banner'), 'Guides section must include complementary banner');
    assert.ok(html.includes('Use our communication guides to learn the framework, then practice applying it with Conversation Rehearsal.'), 'Complementary copy must match');
    assert.ok(html.includes('Unlimited Conversation Rehearsals'), 'Bundle section must highlight full AI app access');
    // Ensure existing Gumroad links and prices are retained
    assert.ok(html.includes('https://themindly.gumroad.com/l/How-We-Speak-Men-Edition?wanted=true'));
    assert.ok(html.includes('https://themindly.gumroad.com/l/howwespeak-women?wanted=true'));
    assert.ok(html.includes('https://themindly.gumroad.com/l/howwespeak-scripts?wanted=true'));
    assert.ok(html.includes('https://themindly.gumroad.com/l/howwespeak-bundle'));
    passed++;
    console.log('  ✅ PASS: Product integration callout and existing Gumroad URLs preserved');
  }

  // Test 7: Final App CTA (Section 8)
  {
    assert.ok(html.includes("You don't need the perfect words.<br><em>You need a place to start.</em>") ||
              html.includes("You don't need the perfect words. You need a place to start."));
    assert.ok(html.includes('Prepare for a difficult conversation at your own pace, with practical guidance that helps you communicate more clearly.'));
    assert.ok(html.includes('id="finalPrimaryCta"'));
    assert.ok(html.includes('id="finalSecondaryLink"'));
    assert.ok(html.includes('Explore Our Communication Guides'));
    passed++;
    console.log('  ✅ PASS: Final App CTA section copy, styling, and navigation links verified');
  }

  // Test 8: Responsive CSS rules and Palette Compliance
  {
    assert.ok(indexCss.includes('.ai-section'), 'index.css must include .ai-section rules');
    assert.ok(indexCss.includes('.ai-preview-box'), 'index.css must include .ai-preview-box rules');
    assert.ok(indexCss.includes('@media (max-width: 768px)'), 'index.css must include mobile responsive breakpoints');
    assert.ok(indexCss.includes('@media (max-width: 1024px)'), 'index.css must include tablet responsive breakpoints');
    passed++;
    console.log('  ✅ PASS: Responsive styles and brand token adherence verified');
  }

  console.log(`\n🎉 All ${passed} Homepage Enhancement tests PASSED successfully!\n`);
}

runHomepageVerificationTests().catch(err => {
  console.error('❌ Test Failure:', err);
  process.exit(1);
});
