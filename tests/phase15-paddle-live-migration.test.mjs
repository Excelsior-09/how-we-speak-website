// ==============================================================================
// TEST SUITE: Phase 15 — Paddle Live Migration & Readiness Verification
// ==============================================================================

import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import paddleWebhookHandler, {
  isIpInCidr,
  verifyPaddleSignature,
  getPaddleLiveIps,
  verifyPaddleIp
} from '../api/webhooks/paddle.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

test('Phase 15: Paddle Live Migration, Security & Readiness', async (t) => {

  await t.test('1. Dynamic Paddle live IP allowlisting and CIDR verification', async () => {
    // 1.1 CIDR matching
    assert.strictEqual(isIpInCidr('34.237.3.244', '34.237.3.244/32'), true, 'Exact /32 match should pass');
    assert.strictEqual(isIpInCidr('34.237.3.245', '34.237.3.244/32'), false, 'Non-matching IP in /32 should fail');
    assert.strictEqual(isIpInCidr('192.168.1.50', '192.168.1.0/24'), true, '/24 subnet match should pass');
    assert.strictEqual(isIpInCidr('192.168.2.50', '192.168.1.0/24'), false, 'Out-of-subnet IP should fail');

    // 1.2 Fetch live IPs from api.paddle.com/ips
    const liveIps = await getPaddleLiveIps();
    assert.ok(Array.isArray(liveIps), 'getPaddleLiveIps must return an array');
    assert.ok(liveIps.length >= 6, 'Must contain at least 6 CIDRs');
    assert.ok(liveIps.includes('34.237.3.244/32'), 'Should include primary Paddle IP');

    // 1.3 verifyPaddleIp allows Paddle live IP and rejects rogue IP
    const allowed = await verifyPaddleIp('34.237.3.244');
    assert.strictEqual(allowed, true, 'Paddle live IP must be allowed');

    const blocked = await verifyPaddleIp('198.51.100.42');
    assert.strictEqual(blocked, false, 'Rogue external IP must be rejected');
  });

  await t.test('2. Paddle Webhook HMAC-SHA256 signature verification', async () => {
    const testSecret = 'pdl_ntf_set_test_secret_key_12345';
    const rawBody = JSON.stringify({
      event_id: 'evt_01test',
      event_type: 'transaction.completed',
      data: { id: 'txn_01test' }
    });
    const ts = Math.floor(Date.now() / 1000).toString();

    // Generate valid signature
    const validH1 = crypto
      .createHmac('sha256', testSecret)
      .update(`${ts}:${rawBody}`)
      .digest('hex');

    const validHeader = `ts=${ts};h1=${validH1}`;

    const isValid = verifyPaddleSignature(rawBody, validHeader, testSecret);
    assert.strictEqual(isValid, true, 'Valid HMAC signature must verify');

    // Tampered payload
    const tamperedBody = JSON.stringify({
      event_id: 'evt_01test',
      event_type: 'transaction.completed',
      data: { id: 'txn_tampered' }
    });
    const isTamperedValid = verifyPaddleSignature(tamperedBody, validHeader, testSecret);
    assert.strictEqual(isTamperedValid, false, 'Tampered payload must fail signature verification');

    // Invalid secret
    const isWrongSecretValid = verifyPaddleSignature(rawBody, validHeader, 'pdl_ntf_set_wrong');
    assert.strictEqual(isWrongSecretValid, false, 'Incorrect secret must fail signature verification');
  });

  await t.test('3. Webhook handler rejects unauthorized IP and processes valid transaction', async () => {
    // 3.1 Rejected IP
    let statusCode = null;
    let jsonBody = null;
    const mockRes = {
      status: (code) => { statusCode = code; return mockRes; },
      json: (data) => { jsonBody = data; return mockRes; }
    };

    const unauthorizedReq = {
      method: 'POST',
      headers: {
        'x-forwarded-for': '203.0.113.99'
      },
      body: { event_type: 'transaction.completed' }
    };

    await paddleWebhookHandler(unauthorizedReq, mockRes);
    assert.strictEqual(statusCode, 403, 'Unauthorized IP must return 403 Forbidden');
    assert.strictEqual(jsonBody?.error, 'Forbidden: IP address not in Paddle live allowlist.');

    // 3.2 Authorized IP with transaction payload
    const authorizedReq = {
      method: 'POST',
      headers: {
        'x-forwarded-for': '34.237.3.244'
      },
      rawBody: JSON.stringify({
        event_id: 'evt_test_001',
        event_type: 'transaction.completed',
        data: {
          id: 'txn_test_001',
          customer_id: 'ctm_test_123',
          customer: { email: 'buyer@example.com' },
          items: [{ price_id: 'bundle' }]
        }
      }),
      body: {
        event_id: 'evt_test_001',
        event_type: 'transaction.completed',
        data: {
          id: 'txn_test_001',
          customer_id: 'ctm_test_123',
          customer: { email: 'buyer@example.com' },
          items: [{ price_id: 'bundle' }]
        }
      }
    };

    let authStatusCode = null;
    let authJsonBody = null;
    const authRes = {
      status: (code) => { authStatusCode = code; return authRes; },
      json: (data) => { authJsonBody = data; return authRes; }
    };

    await paddleWebhookHandler(authorizedReq, authRes);
    assert.strictEqual(authStatusCode, 200, 'Authorized request must return 200 OK');
    assert.strictEqual(authJsonBody?.action, 'transaction_processed');
  });

  await t.test('4. Frontend Paddle.js live configuration & Retain pwCustomer compliance', () => {
    const paddleTsPath = path.join(ROOT_DIR, 'web-app', 'src', 'lib', 'paddle.ts');
    assert.ok(fs.existsSync(paddleTsPath), 'paddle.ts must exist');

    const content = fs.readFileSync(paddleTsPath, 'utf8');
    // Ensure Paddle.Environment.set('sandbox') is NEVER present
    assert.strictEqual(
      content.includes("Paddle.Environment.set('sandbox')"),
      false,
      'Must NOT call Paddle.Environment.set("sandbox")'
    );
    // Ensure pwCustomer for Retain is included
    assert.ok(
      content.includes('pwCustomer'),
      'Must support pwCustomer for Paddle Retain'
    );
  });

  await t.test('5. Pre-verification compliance: Legal documents & Paddle MoR disclosures', () => {
    // 5.1 terms.html
    const termsPath = path.join(ROOT_DIR, 'terms.html');
    assert.ok(fs.existsSync(termsPath), 'terms.html must exist');
    const terms = fs.readFileSync(termsPath, 'utf8');
    assert.ok(terms.includes('Paddle.com'), 'Terms must disclose Paddle.com as Merchant of Record');
    assert.ok(terms.includes('admin@tryhowwespeak.com'), 'Terms must list contact email');

    // 5.2 privacy-policy.html
    const privacyPath = path.join(ROOT_DIR, 'privacy-policy.html');
    assert.ok(fs.existsSync(privacyPath), 'privacy-policy.html must exist');
    const privacy = fs.readFileSync(privacyPath, 'utf8');
    assert.ok(privacy.includes('Paddle.com'), 'Privacy policy must disclose Paddle as payment provider');
    assert.strictEqual(privacy.includes('Stripe or similar'), false, 'Should not reference outdated processors');

    // 5.3 refund-policy.html
    const refundPath = path.join(ROOT_DIR, 'refund-policy.html');
    assert.ok(fs.existsSync(refundPath), 'refund-policy.html must exist');
    const refund = fs.readFileSync(refundPath, 'utf8');
    assert.ok(refund.includes('30-Day Guarantee'), 'Refund policy must declare guarantee');
    assert.ok(refund.includes('admin@tryhowwespeak.com'), 'Refund policy must list support email');

    // 5.4 .env.example
    const envExamplePath = path.join(ROOT_DIR, '.env.example');
    const envExample = fs.readFileSync(envExamplePath, 'utf8');
    assert.ok(envExample.includes('PADDLE_CLIENT_TOKEN'), '.env.example must include PADDLE_CLIENT_TOKEN');
    assert.ok(envExample.includes('PADDLE_API_KEY'), '.env.example must include PADDLE_API_KEY');
    assert.ok(envExample.includes('PADDLE_WEBHOOK_SECRET_KEY'), '.env.example must include PADDLE_WEBHOOK_SECRET_KEY');
  });
});

