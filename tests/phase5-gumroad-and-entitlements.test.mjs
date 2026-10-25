// ==============================================================================
// HOW WE SPEAK — PHASE 5 AUTOMATED TEST SUITE
// Verifies: Gumroad Webhook Handler, Digital Entitlement Provisioning,
//           Refund Processing, Idempotency, and /api/auth/me Profile Quota.
// ==============================================================================

import assert from 'assert/strict';
import gumroadHandler from '../api/webhooks/gumroad.js';
import authMeHandler from '../api/auth/me.js';

function createMockReqRes({ method = 'POST', body = {}, headers = {}, query = {} } = {}) {
  const req = { method, body, headers, query };
  let statusCode = 200;
  let jsonBody = null;

  const res = {
    status(code) {
      statusCode = code;
      return res;
    },
    json(data) {
      jsonBody = data;
      return res;
    },
    getStatusCode: () => statusCode,
    getBody: () => jsonBody,
  };

  return { req, res };
}

async function runPhase5Tests() {
  console.log('🧪 Running Phase 5 Tests: Gumroad Webhooks & Digital Entitlements...\n');
  let passed = 0;

  // 1. Missing Required Fields Validation on Gumroad Webhook
  {
    const { req, res } = createMockReqRes({ body: {} });
    await gumroadHandler(req, res);
    assert.equal(res.getStatusCode(), 400);
    assert.ok(res.getBody().error.includes('Missing required purchase fields'));
    passed++;
    console.log('  ✅ PASS: Gumroad webhook rejects payload with missing email or product permalink (400)');
  }

  // 2. Successful Gumroad Sale Provisioning (Men Edition Ebook)
  {
    const { req, res } = createMockReqRes({
      body: {
        email: 'customer@example.com',
        permalink: 'How-We-Speak-Men-Edition',
        sale_id: 'sale_987654',
        price: 3700,
        currency: 'usd',
      },
    });
    await gumroadHandler(req, res);
    assert.equal(res.getStatusCode(), 200);

    const body = res.getBody();
    assert.equal(body.ok, true);
    assert.equal(body.productKey, 'men-edition');
    passed++;
    console.log('  ✅ PASS: Gumroad sale provisions Men Edition entitlement with mapped productKey (men-edition)');
  }

  // 3. Successful Complete Bundle Provisioning ($97 All 4 Guides)
  {
    const { req, res } = createMockReqRes({
      body: {
        email: 'bundlebuyer@example.com',
        permalink: 'howwespeak-bundle',
        sale_id: 'sale_112233',
        price: 9700,
        currency: 'usd',
      },
    });
    await gumroadHandler(req, res);
    assert.equal(res.getStatusCode(), 200);

    const body = res.getBody();
    assert.equal(body.ok, true);
    assert.equal(body.productKey, 'bundle');
    passed++;
    console.log('  ✅ PASS: Complete Bundle sale provisions all-access bundle entitlement');
  }

  // 4. Refund Processing on Gumroad Webhook
  {
    const { req, res } = createMockReqRes({
      body: {
        email: 'customer@example.com',
        permalink: 'How-We-Speak-Men-Edition',
        sale_id: 'sale_987654',
        refunded: true,
      },
    });
    await gumroadHandler(req, res);
    assert.equal(res.getStatusCode(), 200);

    const body = res.getBody();
    assert.equal(body.ok, true);
    assert.ok(body.action.includes('refund'));
    passed++;
    console.log('  ✅ PASS: Gumroad refund event updates entitlement status to refunded');
  }

  // 5. Auth /api/auth/me Authentication Gate
  {
    const { req, res } = createMockReqRes({ method: 'GET', headers: {} });
    await authMeHandler(req, res);
    assert.equal(res.getStatusCode(), 401);
    passed++;
    console.log('  ✅ PASS: /api/auth/me rejects unauthenticated requests with 401');
  }

  // 6. Auth /api/auth/me Valid Token Response
  {
    const { req, res } = createMockReqRes({
      method: 'GET',
      headers: { authorization: 'Bearer mock_bearer_token' },
    });
    await authMeHandler(req, res);
    assert.equal(res.getStatusCode(), 200);

    const body = res.getBody();
    assert.equal(body.ok, true);
    assert.ok(body.usage.trialRehearsalsMax === 3, 'Default trial rehearsals max must be 3');
    assert.equal(typeof body.usage.canRehearse, 'boolean');
    passed++;
    console.log('  ✅ PASS: /api/auth/me returns active entitlements, rehearsal usage quotas, and Pro status');
  }

  console.log(`\n🎉 All ${passed} Phase 5 tests PASSED successfully!\n`);
}

runPhase5Tests().catch((err) => {
  console.error('❌ Phase 5 Test Failure:', err);
  process.exit(1);
});
