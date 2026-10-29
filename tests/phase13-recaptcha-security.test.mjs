// ==============================================================================
// HOW WE SPEAK — TEST SUITE: PHASE 13 GOOGLE reCAPTCHA & BOT DEFENSE
// Validates:
// 1. Site Key vs Secret Key separation (Zero secret leakage to client bundles or git)
// 2. Server-side reCAPTCHA verification engine (Google siteverify, action, hostname, score)
// 3. Sliding window token-bucket rate limiter (IP tracking, 429 status, Retry-After header)
// 4. Serverless verify-captcha endpoint (/api/auth/verify-captcha)
// 5. Protected AI endpoints (/api/ai/mira, rehearsal, followup, joint-summary)
// 6. Frontend reCAPTCHA module and AuthContext integration
// ==============================================================================

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const SITE_KEY = '6LdoeAUuAAAAAPVldBT3ZQpe7yX1Gz1ncbz14Kdo';
// Read from environment — NEVER hardcode private secret in git
const SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || 'test_recaptcha_secret_env';

describe('Phase 13: Google reCAPTCHA, Bot Protection & Secret Security', () => {

  // ── 1. SECRET KEY CONFIDENTIALITY ──────────────────────────────────────────
  it('1. Secret Key is never leaked into frontend files, public bundles, or HTML', () => {
    const frontendDirs = [
      path.join(ROOT, 'web-app/src'),
      path.join(ROOT, 'assets'),
    ];

    function scanDir(dir) {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js') || entry.name.endsWith('.html'))) {
          const content = fs.readFileSync(fullPath, 'utf8');
          assert.ok(
            !content.includes(SECRET_KEY),
            `Security Violation: Secret Key found in client file: ${path.relative(ROOT, fullPath)}`
          );
        }
      }
    }

    for (const d of frontendDirs) {
      scanDir(d);
    }

    // Check all root HTML files
    const rootHtmlFiles = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
    for (const htmlFile of rootHtmlFiles) {
      const content = fs.readFileSync(path.join(ROOT, htmlFile), 'utf8');
      assert.ok(
        !content.includes(SECRET_KEY),
        `Security Violation: Secret Key found in HTML: ${htmlFile}`
      );
    }
  });

  // ── 2. PUBLIC SITE KEY CONFIGURATION ───────────────────────────────────────
  it('2. Public Site Key is cleanly configured on client without exposing secrets', () => {
    const recaptchaClientPath = path.join(ROOT, 'web-app/src/lib/recaptcha.ts');
    assert.ok(fs.existsSync(recaptchaClientPath), 'web-app/src/lib/recaptcha.ts must exist');

    const content = fs.readFileSync(recaptchaClientPath, 'utf8');
    assert.ok(content.includes(SITE_KEY), 'recaptcha.ts must define public SITE_KEY as fallback');
    assert.ok(!content.includes(SECRET_KEY), 'recaptcha.ts must NEVER contain SECRET_KEY');
    assert.ok(content.includes('executeRecaptcha'), 'recaptcha.ts must export executeRecaptcha');
    assert.ok(content.includes('loadRecaptchaScript'), 'recaptcha.ts must export loadRecaptchaScript');
  });

  // ── 3. RATE LIMITER ENGINE ─────────────────────────────────────────────────
  it('3. In-memory sliding window rate limiter throttles excessive requests', async () => {
    const { checkRateLimit, getClientIp } = await import('../lib/rate-limiter.js');

    const testKey = 'test_ip_' + Date.now();
    const limit = 5;

    // First 5 requests should pass
    for (let i = 1; i <= limit; i++) {
      const result = checkRateLimit(testKey, { limit, windowMs: 10000 });
      assert.equal(result.allowed, true, `Request #${i} should be allowed`);
      assert.equal(result.count, i);
      assert.equal(result.remaining, limit - i);
    }

    // 6th request must be rejected
    const blocked = checkRateLimit(testKey, { limit, windowMs: 10000 });
    assert.equal(blocked.allowed, false, 'Request #6 exceeding limit must be blocked');
    assert.equal(blocked.remaining, 0);
    assert.ok(blocked.resetMs > 0, 'Reset time must be positive');

    // Test getClientIp
    const mockReq = { headers: { 'x-forwarded-for': '198.51.100.42, 10.0.0.1' } };
    assert.equal(getClientIp(mockReq), '198.51.100.42');
  });

  // ── 4. SERVER-SIDE reCAPTCHA VERIFICATION ENGINE ────────────────────────────
  it('4. Server-side verifyRecaptchaToken enforces token validity and secret protection', async () => {
    const { verifyRecaptchaToken } = await import('../lib/recaptcha.js');

    // Test A: Missing token when secret is set
    const originalSecret = process.env.RECAPTCHA_SECRET_KEY;
    process.env.RECAPTCHA_SECRET_KEY = SECRET_KEY;

    try {
      const missingTokenRes = await verifyRecaptchaToken({ token: '' });
      assert.equal(missingTokenRes.success, false);
      assert.equal(missingTokenRes.code, 'CAPTCHA_TOKEN_MISSING');

      // Test B: Invalid token against real Google verification API
      const invalidTokenRes = await verifyRecaptchaToken({ token: 'invalid_dummy_token_xyz' });
      assert.equal(invalidTokenRes.success, false);
      assert.equal(invalidTokenRes.code, 'CAPTCHA_VERIFICATION_FAILED');
      assert.ok(invalidTokenRes.error, 'Must provide clear error message');
    } finally {
      if (originalSecret) {
        process.env.RECAPTCHA_SECRET_KEY = originalSecret;
      } else {
        delete process.env.RECAPTCHA_SECRET_KEY;
      }
    }
  });

  // ── 5. STANDALONE VERIFY-CAPTCHA ENDPOINT ──────────────────────────────────
  it('5. /api/auth/verify-captcha endpoint exists, rejects GET, and enforces rate limits', async () => {
    const { default: handler } = await import('../api/auth/verify-captcha.js');

    // Test GET method rejection
    let statusCode = 200;
    let jsonResponse = null;
    const reqGet = { method: 'GET', headers: {} };
    const resGet = {
      setHeader() {},
      status(c) { statusCode = c; return this; },
      json(d) { jsonResponse = d; return this; }
    };
    await handler(reqGet, resGet);
    assert.equal(statusCode, 405, 'Should return HTTP 405 for GET');

    // Test POST with missing token
    const origSecret = process.env.RECAPTCHA_SECRET_KEY;
    process.env.RECAPTCHA_SECRET_KEY = SECRET_KEY;

    try {
      let postStatus = 200;
      let postJson = null;
      const reqPost = { method: 'POST', headers: {}, body: { token: '' } };
      const resPost = {
        setHeader() {},
        status(c) { postStatus = c; return this; },
        json(d) { postJson = d; return this; }
      };
      await handler(reqPost, resPost);
      assert.equal(postStatus, 400, 'Should return HTTP 400 for empty token');
      assert.equal(postJson.success, false);
    } finally {
      if (origSecret) process.env.RECAPTCHA_SECRET_KEY = origSecret;
      else delete process.env.RECAPTCHA_SECRET_KEY;
    }
  });

  // ── 6. AUTHENTICATION & MIRA BOT PROTECTION ────────────────────────────────
  it('6. AuthContext and MiraView integrate invisible reCAPTCHA v3 bot protection', () => {
    const authContextPath = path.join(ROOT, 'web-app/src/lib/AuthContext.tsx');
    const authContent = fs.readFileSync(authContextPath, 'utf8');

    assert.ok(authContent.includes("executeRecaptcha('signup')"), 'signUp must execute reCAPTCHA');
    assert.ok(authContent.includes("executeRecaptcha('login')"), 'signIn must execute reCAPTCHA');
    assert.ok(authContent.includes("executeRecaptcha('password_reset')"), 'resetPassword must execute reCAPTCHA');
    assert.ok(authContent.includes("executeRecaptcha('oauth_google')"), 'signInWithOAuth must execute reCAPTCHA');
    assert.ok(authContent.includes("captchaToken"), 'Must pass captchaToken to Supabase options');

    const miraViewPath = path.join(ROOT, 'web-app/src/components/MiraView.tsx');
    const miraContent = fs.readFileSync(miraViewPath, 'utf8');
    assert.ok(miraContent.includes("executeRecaptcha('mira_chat')"), 'MiraView must execute reCAPTCHA for mira_chat');
    assert.ok(miraContent.includes("x-captcha-token"), 'MiraView must include x-captcha-token header');
    assert.ok(miraContent.includes("Protected by Google reCAPTCHA"), 'MiraView must display reCAPTCHA compliance notice');
  });

  // ── 7. PROTECTED AI ENDPOINTS RATE LIMITING & reCAPTCHA ─────────────────────
  it('7. AI endpoints (mira, rehearsal, followup, joint-summary) enforce rate limiting', async () => {
    const endpoints = [
      'api/ai/mira.js',
      'api/ai/rehearsal.js',
      'api/ai/followup.js',
      'api/ai/joint-summary.js'
    ];

    for (const ep of endpoints) {
      const fullPath = path.join(ROOT, ep);
      assert.ok(fs.existsSync(fullPath), `${ep} must exist`);
      const code = fs.readFileSync(fullPath, 'utf8');
      assert.ok(code.includes('checkRateLimit'), `${ep} must implement rate limiting`);
      assert.ok(code.includes('verifyRecaptchaToken'), `${ep} must implement verifyRecaptchaToken`);
      assert.ok(code.includes('429'), `${ep} must handle HTTP 429 status`);
      assert.ok(!code.includes(SECRET_KEY), `${ep} must not hardcode raw SECRET_KEY in source`);
    }
  });

});
