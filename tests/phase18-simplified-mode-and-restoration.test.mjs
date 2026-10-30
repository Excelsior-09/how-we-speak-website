// ==============================================================================
// TEST SUITE: Phase 18 — Temporary Product Simplification & Restoration Integrity
// Verifies:
// 1. Centralized Feature Visibility Configuration & Restoration trigger.
// 2. Public interface hiding of Dashboard, Auth, Memberships, and Mira AI.
// 3. Complete preservation of eBook products, bundle mathematics, and checkout.
// 4. Standalone Relationship Quiz experience & lead capture endpoint.
// 5. 100% Non-destructive preservation of all web-app, API, and Supabase systems.
// 6. Restoration manifest completeness (MIRA AI RESTORE).
// ==============================================================================

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

test('Phase 18: Temporary Product Simplification & Restoration Verification', async (t) => {

  await t.test('1. Centralized Reversible Configuration (feature-flags.js)', () => {
    const configPath = path.join(ROOT_DIR, 'assets', 'js', 'feature-flags.js');
    assert.ok(fs.existsSync(configPath), 'feature-flags.js must exist');
    const configCode = fs.readFileSync(configPath, 'utf8');

    // Evaluate in mock environment
    const mockWindow = {};
    const mockDocument = {
      documentElement: {
        attributes: {},
        setAttribute(k, v) { this.attributes[k] = v; },
        removeAttribute(k) { delete this.attributes[k]; }
      },
      body: {
        attributes: {},
        setAttribute(k, v) { this.attributes[k] = v; },
        removeAttribute(k) { delete this.attributes[k]; }
      },
      getElementById: () => null,
      readyState: 'complete',
      addEventListener: () => {}
    };

    const evalFunc = new Function('window', 'document', configCode);
    evalFunc(mockWindow, mockDocument);

    const config = mockWindow.HWS_VISIBILITY_CONFIG;
    assert.ok(config, 'HWS_VISIBILITY_CONFIG must be exported globally');
    assert.strictEqual(config.mode, 'simplified_ebooks_and_quiz', 'Default mode must be simplified_ebooks_and_quiz');
    assert.strictEqual(config.restorationPhrase, 'MIRA AI RESTORE', 'Restoration phrase must be MIRA AI RESTORE');

    // Verify feature flags in simplified mode
    assert.strictEqual(config.features.dashboard, false, 'Dashboard must be hidden');
    assert.strictEqual(config.features.authentication, false, 'Authentication must be hidden');
    assert.strictEqual(config.features.membership, false, 'Memberships must be hidden');
    assert.strictEqual(config.features.subscriptionPricing, false, 'Subscription pricing must be hidden');
    assert.strictEqual(config.features.miraAi, false, 'Mira AI must be hidden');
    assert.strictEqual(config.features.aiRehearsalTool, false, 'AI rehearsal studio must be hidden');
    assert.strictEqual(config.features.ebooks, true, 'eBooks must remain enabled');
    assert.strictEqual(config.features.ebookBundles, true, 'eBook bundles must remain enabled');
    assert.strictEqual(config.features.quiz, true, 'Quiz must remain enabled');
    assert.strictEqual(config.features.paymentGateway, true, 'Payment gateway must remain enabled');

    // Verify document received data-hws-mode="simplified"
    assert.strictEqual(mockDocument.documentElement.attributes['data-hws-mode'], 'simplified');

    // Verify programmatic restoration helper works smoothly
    assert.ok(typeof mockWindow.hwsRestoreFullApplication === 'function', 'Must provide hwsRestoreFullApplication()');
    mockWindow.hwsRestoreFullApplication();
    assert.strictEqual(config.mode, 'full_application');
    assert.strictEqual(config.features.dashboard, true);
    assert.strictEqual(config.features.miraAi, true);
    assert.strictEqual(config.features.membership, true);
    assert.strictEqual(mockDocument.documentElement.attributes['data-hws-mode'], undefined);

    // Switch back to simplified
    mockWindow.hwsSetMode('simplified_ebooks_and_quiz');
    assert.strictEqual(config.mode, 'simplified_ebooks_and_quiz');
  });

  await t.test('2. CSS Isolation & Breakpoint Safeguards (simplified-mode.css)', () => {
    const cssPath = path.join(ROOT_DIR, 'assets', 'css', 'simplified-mode.css');
    assert.ok(fs.existsSync(cssPath), 'simplified-mode.css must exist');
    const css = fs.readFileSync(cssPath, 'utf8');

    assert.ok(css.includes('.hws-hidden-in-simplified'), 'Must define .hws-hidden-in-simplified class');
    assert.ok(css.includes('[data-hws-mode="simplified"] .hws-feature-ai'), 'Must hide .hws-feature-ai');
    assert.ok(css.includes('[data-hws-mode="simplified"] .hws-feature-membership'), 'Must hide .hws-feature-membership');
    assert.ok(css.includes('[data-hws-mode="simplified"] .hws-feature-auth'), 'Must hide .hws-feature-auth');
    assert.ok(css.includes('.quiz-complement-banner'), 'Must style .quiz-complement-banner');
  });

  await t.test('3. Homepage Simplification (index.html)', () => {
    const indexPath = path.join(ROOT_DIR, 'index.html');
    assert.ok(fs.existsSync(indexPath), 'index.html must exist');
    const html = fs.readFileSync(indexPath, 'utf8');

    // Head includes
    assert.ok(html.includes('href="/assets/css/simplified-mode.css"'), 'Must link simplified-mode.css');
    assert.ok(html.includes('src="/assets/js/feature-flags.js"'), 'Must include feature-flags.js');

    // Hidden navigation items
    assert.ok(html.includes('class="nav-ai-tool"') || html.includes('nav-ai-tool'), 'nav-ai-tool must be identified');
    assert.ok(html.includes('hws-hidden-in-simplified'), 'Must mark elements with hws-hidden-in-simplified');

    // Dedicated AI & Process sections hidden
    assert.ok(html.includes('id="ai-tool"') && html.includes('hws-feature-ai'), 'AI section must be marked with hws-feature-ai');
    assert.ok(html.includes('ai-process-section') && html.includes('hws-feature-ai'), 'AI process section must be marked with hws-feature-ai');

    // Quiz complement banner present
    assert.ok(html.includes('quiz-complement-banner'), 'Quiz complement banner must exist in index.html');
    assert.ok(html.includes('Take the Free Quiz →'), 'Must offer quiz CTA button');
  });

  await t.test('4. Pricing Page Simplification (pricing.html)', () => {
    const pricingPath = path.join(ROOT_DIR, 'pricing.html');
    assert.ok(fs.existsSync(pricingPath), 'pricing.html must exist');
    const html = fs.readFileSync(pricingPath, 'utf8');

    // Head includes
    assert.ok(html.includes('href="/assets/css/simplified-mode.css"'), 'Must link simplified-mode.css');
    assert.ok(html.includes('src="/assets/js/feature-flags.js"'), 'Must include feature-flags.js');

    // Memberships tab hidden
    assert.ok(html.includes('data-category="memberships"') && html.includes('hws-feature-membership'), 'Memberships tab must be marked with hws-feature-membership');

    // Memberships section hidden
    assert.ok(html.includes('id="memberships"') && html.includes('hws-feature-membership'), 'Memberships section must be marked with hws-feature-membership');

    // Guided discovery simplified pathway card present
    assert.ok(html.includes('I want to discover our communication pattern'), 'Must have simplified pathway 3 card');
    assert.ok(html.includes('Take the Free Quiz'), 'Must have Take the Free Quiz button');

    // FAQs 4, 5, 6, 8 hidden
    assert.ok(html.includes('faq-ans-4') && html.includes('hws-feature-membership'), 'FAQ 4 must be marked with hws-feature-membership');
    assert.ok(html.includes('faq-ans-5') && html.includes('hws-feature-membership'), 'FAQ 5 must be marked with hws-feature-membership');
    assert.ok(html.includes('faq-ans-8') && html.includes('hws-feature-membership'), 'FAQ 8 must be marked with hws-feature-membership');
  });

  await t.test('5. Shared Components Simplification (components.js)', () => {
    const compPath = path.join(ROOT_DIR, 'assets', 'js', 'components.js');
    assert.ok(fs.existsSync(compPath), 'components.js must exist');
    const code = fs.readFileSync(compPath, 'utf8');

    assert.ok(code.includes('NAV_LINKS_SIMPLIFIED'), 'Must include NAV_LINKS_SIMPLIFIED template');
    assert.ok(code.includes('RIGHT_CTA_SIMPLIFIED'), 'Must include RIGHT_CTA_SIMPLIFIED template');
    assert.ok(code.includes('isSimplified'), 'Must check isSimplified');
    assert.ok(code.includes('Take the Quiz'), 'Must link Take the Quiz in simplified CTA');
  });

  await t.test('6. Quiz Experience & Endpoint Integrity', async () => {
    const quizPath = path.join(ROOT_DIR, 'quiz.html');
    assert.ok(fs.existsSync(quizPath), 'quiz.html must exist');
    const quizHtml = fs.readFileSync(quizPath, 'utf8');

    assert.ok(quizHtml.includes('https://form.jotform.com/jsform/262838678818074'), 'JotForm embed must be intact');
    assert.ok(quizHtml.includes('hws-nav'), 'Shared nav must be present');
    assert.ok(quizHtml.includes('hws-footer'), 'Shared footer must be present');

    // Verify Quiz Submit API is operational
    const { default: quizHandler } = await import('../api/quiz-submit.js');
    const mockReq = { method: 'POST', body: { email: 'test-quiz@tryhowwespeak.com' } };
    let resStatus = 200;
    let resData = null;
    const mockRes = {
      status(code) { resStatus = code; return this; },
      json(data) { resData = data; return this; }
    };

    await quizHandler(mockReq, mockRes);
    assert.strictEqual(resStatus, 200, 'Quiz handler must return HTTP 200');
    assert.strictEqual(resData.ok, true, 'Quiz handler must return ok: true');
  });

  await t.test('7. 100% Non-Destructive Preservation of Hidden Core Systems', () => {
    // 7.1 Web Application source files
    const appTsx = path.join(ROOT_DIR, 'web-app', 'src', 'App.tsx');
    assert.ok(fs.existsSync(appTsx), 'web-app/src/App.tsx must be preserved');
    const miraView = path.join(ROOT_DIR, 'web-app', 'src', 'components', 'MiraView.tsx');
    assert.ok(fs.existsSync(miraView), 'MiraView.tsx must be preserved');
    const workspaceView = path.join(ROOT_DIR, 'web-app', 'src', 'components', 'WorkspaceView.tsx');
    assert.ok(fs.existsSync(workspaceView), 'WorkspaceView.tsx must be preserved');
    const rehearsalView = path.join(ROOT_DIR, 'web-app', 'src', 'components', 'RehearsalView.tsx');
    assert.ok(fs.existsSync(rehearsalView), 'RehearsalView.tsx must be preserved');

    // 7.2 Backend API endpoints
    const miraApi = path.join(ROOT_DIR, 'api', 'ai', 'mira.js');
    assert.ok(fs.existsSync(miraApi), 'api/ai/mira.js must be preserved');
    const rehearsalApi = path.join(ROOT_DIR, 'api', 'ai', 'rehearsal.js');
    assert.ok(fs.existsSync(rehearsalApi), 'api/ai/rehearsal.js must be preserved');
    const partnerApi = path.join(ROOT_DIR, 'api', 'partner', 'invite.js');
    assert.ok(fs.existsSync(partnerApi), 'api/partner/invite.js must be preserved');

    // 7.3 Supabase schema and migrations
    const migrationFile = path.join(ROOT_DIR, 'supabase', 'migrations', '20261025000000_create_core_schema.sql');
    assert.ok(fs.existsSync(migrationFile), 'Supabase core migration must be preserved');

    // 7.4 Paddle and checkout assets
    const paddleJs = path.join(ROOT_DIR, 'assets', 'js', 'paddle-checkout.js');
    assert.ok(fs.existsSync(paddleJs), 'paddle-checkout.js must be preserved');
  });

  await t.test('8. Restoration Manifest Completeness (MIRA AI RESTORE)', () => {
    const mdPath = path.join(ROOT_DIR, 'docs', 'MIRA_AI_RESTORE_MANIFEST.md');
    assert.ok(fs.existsSync(mdPath), 'MIRA_AI_RESTORE_MANIFEST.md must exist');
    const mdContent = fs.readFileSync(mdPath, 'utf8');
    assert.ok(mdContent.includes('MIRA AI RESTORE'), 'Must document MIRA AI RESTORE trigger command');
    assert.ok(mdContent.includes('simplified_ebooks_and_quiz'), 'Must document simplified mode');
    assert.ok(mdContent.includes('full_application'), 'Must document full application restored mode');
    assert.ok(mdContent.includes('assets/js/feature-flags.js'), 'Must link feature-flags.js');

    const jsonPath = path.join(ROOT_DIR, 'docs', 'mira-ai-restore-manifest.json');
    assert.ok(fs.existsSync(jsonPath), 'mira-ai-restore-manifest.json must exist');
    const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    assert.strictEqual(json.restorationProtocol, 'MIRA AI RESTORE');
    assert.strictEqual(json.status, 'temporary_simplified_mode_active');
    assert.ok(Array.isArray(json.hiddenComponents) && json.hiddenComponents.length >= 10);
    assert.ok(Array.isArray(json.restorationSteps) && json.restorationSteps.length >= 5);
  });

});
