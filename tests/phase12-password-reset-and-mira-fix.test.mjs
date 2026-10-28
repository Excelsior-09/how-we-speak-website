// ==============================================================================
// HOW WE SPEAK — TEST SUITE PHASE 12: PASSWORD RESET & MIRA SERVER FIX
// Verifies:
// 1. Absolute asset paths & <base href="/"> across all HTML files to prevent unstyled rendering
// 2. Vercel rewrites for password reset, recovery, and login routes
// 3. Client route parsing for reset-password and recovery
// 4. Dedicated ResetPasswordView component with Request & Update modes
// 5. AuthContext password reset & recovery handling (PASSWORD_RECOVERY event, PKCE code exchange)
// 6. Forgot Password link in AuthModal
// 7. Robust extractAndParseJson helper handling all LLM formatting quirks (markdown, newlines, commas)
// 8. Server maxDuration and multi-model cascade prioritization
// 9. MiraView error messaging and user input preservation
// ==============================================================================

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractAndParseJson } from '../api/ai/mira.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

console.log('🧪 Running Phase 12 Test Suite: Password Reset & Mira Server Pipeline Fix...\n');

// -----------------------------------------------------------------------------
// Test 1: HTML Asset Paths & Base Href Verification
// -----------------------------------------------------------------------------
console.log('Test 1: Verify all HTML files use absolute asset paths and <base href="/">...');
const htmlFiles = [
  'index.html',
  'articles.html',
  'article-template.html',
  'contact.html',
  'free-scripts.html',
  'how-to-stop-spiraling-when-your-partner-needs-space.html',
  'men-edition.html',
  'privacy-policy.html',
  'quiz.html',
  'refund-policy.html',
  'terms.html',
  'what-to-say-when-partner-shuts-down.html',
  'why-men-go-silent-during-arguments.html',
  'why-you-shut-down-during-arguments.html'
];

for (const file of htmlFiles) {
  const filePath = path.join(ROOT, file);
  const content = fs.readFileSync(filePath, 'utf8');

  assert.ok(content.includes('<base href="/"'), `${file} must include <base href="/">`);
  assert.ok(!content.includes('href="assets/css/'), `${file} must NOT use relative href="assets/css/"`);
  assert.ok(!content.includes('src="assets/js/'), `${file} must NOT use relative src="assets/js/"`);
  assert.ok(content.includes('/assets/css/'), `${file} must use absolute /assets/css/`);
}
console.log('  ✅ All HTML files contain <base href="/"> and absolute asset paths.\n');

// -----------------------------------------------------------------------------
// Test 2: Vercel Rewrites Configuration
// -----------------------------------------------------------------------------
console.log('Test 2: Verify vercel.json contains rewrites for auth and recovery routes...');
const vercelConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
const rewrites = vercelConfig.rewrites || [];

const expectedSources = ['/reset-password', '/password-reset', '/recovery', '/login', '/auth/callback', '/app/:path*'];
for (const src of expectedSources) {
  const match = rewrites.find((r) => r.source === src && r.destination === '/app/index.html');
  assert.ok(match, `vercel.json must rewrite ${src} to /app/index.html`);
}
console.log('  ✅ Vercel rewrites for password reset and recovery correctly configured.\n');

// -----------------------------------------------------------------------------
// Test 3: Route Parser for reset-password
// -----------------------------------------------------------------------------
console.log('Test 3: Verify routeParser handles reset-password and recovery routes...');
const routeParserSrc = fs.readFileSync(path.join(ROOT, 'web-app/src/lib/routeParser.ts'), 'utf8');
assert.ok(routeParserSrc.includes("'reset-password'"), 'AppRoute must include reset-password');
assert.ok(routeParserSrc.includes("clean === 'reset-password'"), 'parseRoute must match reset-password');
assert.ok(routeParserSrc.includes("clean === 'recovery'"), 'parseRoute must match recovery');
console.log('  ✅ routeParser correctly identifies reset-password and recovery routes.\n');

// -----------------------------------------------------------------------------
// Test 4: ResetPasswordView Component Implementation
// -----------------------------------------------------------------------------
console.log('Test 4: Verify ResetPasswordView luxury UI and functional requirements...');
const resetViewSrc = fs.readFileSync(path.join(ROOT, 'web-app/src/components/ResetPasswordView.tsx'), 'utf8');

// Required testing element IDs
assert.ok(resetViewSrc.includes('id="reset-email-input"'), 'Must have #reset-email-input for email entry');
assert.ok(resetViewSrc.includes('id="btn-send-reset"'), 'Must have #btn-send-reset button');
assert.ok(resetViewSrc.includes('id="new-password-input"'), 'Must have #new-password-input for new password');
assert.ok(resetViewSrc.includes('id="confirm-password-input"'), 'Must have #confirm-password-input for confirmation');
assert.ok(resetViewSrc.includes('id="btn-update-password"'), 'Must have #btn-update-password button');
assert.ok(resetViewSrc.includes('id="reset-success-alert"'), 'Must have #reset-success-alert notification');
assert.ok(resetViewSrc.includes('id="reset-error-alert"'), 'Must have #reset-error-alert notification');

// Token & Session verification
assert.ok(resetViewSrc.includes('type=recovery'), 'Must detect type=recovery in hash/query');
assert.ok(resetViewSrc.includes('exchangeCodeForSession'), 'Must exchange PKCE code for session');
assert.ok(resetViewSrc.includes('updatePassword'), 'Must call updatePassword from AuthContext');
console.log('  ✅ ResetPasswordView contains all required fields, IDs, and recovery handlers.\n');

// -----------------------------------------------------------------------------
// Test 5: AuthContext Password Reset & Recovery
// -----------------------------------------------------------------------------
console.log('Test 5: Verify AuthContext password recovery lifecycle and event listener...');
const authContextSrc = fs.readFileSync(path.join(ROOT, 'web-app/src/lib/AuthContext.tsx'), 'utf8');

assert.ok(authContextSrc.includes('isPasswordRecovery'), 'AuthContext must declare isPasswordRecovery state');
assert.ok(authContextSrc.includes("event === 'PASSWORD_RECOVERY'"), 'Must listen for PASSWORD_RECOVERY event');
assert.ok(authContextSrc.includes('/app/reset-password'), 'resetPassword must redirect to /app/reset-password');
assert.ok(authContextSrc.includes('supabase.auth.updateUser'), 'updatePassword must call supabase.auth.updateUser');
console.log('  ✅ AuthContext correctly handles recovery tokens, events, and updatePassword.\n');

// -----------------------------------------------------------------------------
// Test 6: AuthModal Forgot Password Integration
// -----------------------------------------------------------------------------
console.log('Test 6: Verify Forgot Password link in AuthModal...');
const authModalSrc = fs.readFileSync(path.join(ROOT, 'web-app/src/components/AuthModal.tsx'), 'utf8');
assert.ok(authModalSrc.includes('id="btn-forgot-password"'), 'AuthModal must include #btn-forgot-password');
assert.ok(authModalSrc.includes('/app/reset-password'), 'Forgot password button must navigate to /app/reset-password');
console.log('  ✅ AuthModal includes accessible Forgot Password link.\n');

// -----------------------------------------------------------------------------
// Test 7: Robust extractAndParseJson Utility
// -----------------------------------------------------------------------------
console.log('Test 7: Verify extractAndParseJson handles markdown, newlines, and trailing commas...');

// Case A: Standard code fence with trailing newline
const caseA = '```json\n{"message": "Valid advice", "structuredAdvice": null}\n```\n';
const resA = extractAndParseJson(caseA);
assert.ok(resA && resA.message === 'Valid advice', 'Case A: Failed on standard fence with newline');

// Case B: Unspecified code fence with trailing space
const caseB = '```\n{"message": "No tag fence", "structuredAdvice": null}\n```   ';
const resB = extractAndParseJson(caseB);
assert.ok(resB && resB.message === 'No tag fence', 'Case B: Failed on unspecified fence');

// Case C: Conversational intro and trailing commas
const caseC = 'Here is your guidance:\n```json\n{"message": "With trailing comma", "list": [1, 2, ],}\n```\nHope this helps!';
const resC = extractAndParseJson(caseC);
assert.ok(resC && resC.message === 'With trailing comma', 'Case C: Failed on trailing commas and surrounding text');

// Case D: Pure raw JSON without markdown
const caseD = '{"message": "Pure JSON without backticks", "structuredAdvice": {}}';
const resD = extractAndParseJson(caseD);
assert.ok(resD && resD.message === 'Pure JSON without backticks', 'Case D: Failed on pure raw JSON');

// Case E: Fallback extraction from message key
const caseE = 'Partial response: {"message": "Extracted from truncated string", "other":';
const resE = extractAndParseJson(caseE);
assert.ok(resE && resE.message === 'Extracted from truncated string', 'Case E: Failed on partial JSON message extraction');

console.log('  ✅ extractAndParseJson safely parsed all 5 challenging LLM payload variations.\n');

// -----------------------------------------------------------------------------
// Test 8: Server maxDuration & Model Cascades
// -----------------------------------------------------------------------------
console.log('Test 8: Verify api/ai/mira.js server config and resilient models...');
const miraServerSrc = fs.readFileSync(path.join(ROOT, 'api/ai/mira.js'), 'utf8');

assert.ok(miraServerSrc.includes('export const maxDuration = 30'), 'Must export maxDuration = 30 for Vercel');
assert.ok(miraServerSrc.includes('gemini-flash-lite-latest'), 'Must include gemini-flash-lite-latest in fallback queue');
assert.ok(miraServerSrc.includes('extractAndParseJson(rawText)'), 'Must use extractAndParseJson for payload validation');
console.log('  ✅ api/ai/mira.js has maxDuration = 30 and robust extraction wired.\n');

// -----------------------------------------------------------------------------
// Test 9: MiraView Error Handling and Message Preservation
// -----------------------------------------------------------------------------
console.log('Test 9: Verify MiraView preserves user input on failure and shows diagnostic refs...');
const miraViewSrc = fs.readFileSync(path.join(ROOT, 'web-app/src/components/MiraView.tsx'), 'utf8');

assert.ok(miraViewSrc.includes('setInputMessage(msg)'), 'MiraView must restore inputMessage on error');
assert.ok(miraViewSrc.includes('correlationId'), 'MiraView must include diagnostic correlation ID');
console.log('  ✅ MiraView error handling preserves message and provides diagnostic reference.\n');

console.log('======================================================================');
console.log('🎉 Phase 12 Test Suite Passed (9/9 checks completed successfully)');
console.log('======================================================================\n');
