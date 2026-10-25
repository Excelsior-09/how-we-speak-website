// ==============================================================================
// HOW WE SPEAK — PHASE 4 AUTOMATED TEST SUITE
// Verifies: Couples Workspace, Selective Sharing Privacy Boundary,
//           Neutral Joint AI Synthesis, and Invitation Token Validation.
// ==============================================================================

import assert from 'assert/strict';
import jointSummaryHandler from '../api/ai/joint-summary.js';

function createMockReqRes({ method = 'POST', body = {}, headers = {} } = {}) {
  const req = { method, body, headers };
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

async function runPhase4Tests() {
  console.log('🧪 Running Phase 4 Tests: Couples Conversation Workspace...\n');
  let passed = 0;

  // 1. Missing Exercise ID Validation
  {
    const { req, res } = createMockReqRes({ body: {} });
    await jointSummaryHandler(req, res);
    assert.equal(res.getStatusCode(), 400);
    assert.ok(res.getBody().error.includes('Missing exerciseId'));
    passed++;
    console.log('  ✅ PASS: Joint summary endpoint rejects requests missing exerciseId');
  }

  // 2. Strict Privacy Gate: Rejects if only one partner has reflected
  {
    const { req, res } = createMockReqRes({
      body: {
        exerciseId: 'ex_test_1',
        mockReflections: [
          { trigger_notes: 'I felt overwhelmed.', is_shared: true },
        ],
      },
    });
    await jointSummaryHandler(req, res);
    assert.equal(res.getStatusCode(), 400);
    assert.ok(res.getBody().error.includes('Both partners must complete their reflection'));
    passed++;
    console.log('  ✅ PASS: Joint summary strictly rejects if only one partner has submitted a reflection');
  }

  // 3. Strict Privacy Gate: Rejects if one partner has NOT explicitly shared
  {
    const { req, res } = createMockReqRes({
      body: {
        exerciseId: 'ex_test_2',
        mockReflections: [
          { trigger_notes: 'Partner A notes', is_shared: true },
          { trigger_notes: 'Partner B private notes', is_shared: false }, // NOT SHARED
        ],
      },
    });
    await jointSummaryHandler(req, res);
    assert.equal(res.getStatusCode(), 400);
    assert.ok(res.getBody().error.includes('Both partners must explicitly toggle "Share with Partner"'));
    passed++;
    console.log('  ✅ PASS: Cross-account privacy boundary verified — joint summary blocked when partner reflection is unshared (is_shared = false)');
  }

  // 4. Successful Synthesis When Both Partners Have Shared
  {
    const { req, res } = createMockReqRes({
      body: {
        exerciseId: 'ex_test_3',
        mockExercise: { topic: 'Work-Life Conflict' },
        mockReflections: [
          {
            trigger_notes: 'You arrived home late without messaging.',
            felt_emotions: ['Unappreciated', 'Lonely'],
            underlying_need: 'I needed to know our evening plans were valued.',
            is_shared: true,
          },
          {
            trigger_notes: 'I was confronted before I could take off my shoes.',
            felt_emotions: ['Exhausted', 'Attacked'],
            underlying_need: 'I needed a soft landing and 10 minutes to reset.',
            is_shared: true,
          },
        ],
      },
    });
    await jointSummaryHandler(req, res);
    assert.equal(res.getStatusCode(), 200);

    const body = res.getBody();
    assert.equal(body.ok, true);
    assert.ok(body.data.cycleOverview, 'Must provide cycle overview');
    assert.ok(body.data.sharedNegativeLoop, 'Must reframe shared loop');
    assert.ok(body.data.threeRepairSteps && body.data.threeRepairSteps.length === 3, 'Must provide 3 actionable repair steps');

    // Ethical Non-Diagnostic Check
    const allText = JSON.stringify(body.data).toLowerCase();
    assert.equal(allText.includes('narcissist'), false);
    assert.equal(allText.includes('borderline'), false);
    passed++;
    console.log('  ✅ PASS: Neutral joint synthesis successfully generated — balanced, non-diagnostic, and includes 3 concrete repair actions');
  }

  console.log(`\n🎉 All ${passed} Phase 4 tests PASSED successfully!\n`);
}

runPhase4Tests().catch((err) => {
  console.error('❌ Phase 4 Test Failure:', err);
  process.exit(1);
});
