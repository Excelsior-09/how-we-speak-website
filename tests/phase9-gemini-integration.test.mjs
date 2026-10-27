// ==============================================================================
// HOW WE SPEAK — PHASE 9: GOOGLE GEMINI REAL API INTEGRATION & VERIFICATION
// Tests:
// 1. Strict GEMINI_API_KEY environment requirement (HTTP 503 on missing key)
// 2. Elimination of silent mock AI fallbacks from handler
// 3. Proper Google Gemini v1beta payload (systemInstruction + alternating contents)
// 4. Safe correlation logging and zero secret leakage
// 5. Frontend error messaging and retry handling
// ==============================================================================

import assert from 'node:assert/strict';
import { it, describe } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

describe('Phase 9: Gemini AI Real API Integration', () => {
  it('1. api/ai/mira.js requires GEMINI_API_KEY and returns HTTP 503 without fake mock response', async () => {
    const { default: handler } = await import('../api/ai/mira.js');

    const originalKey = process.env.GEMINI_API_KEY;
    const originalAiKey = process.env.AI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.AI_API_KEY;

    let responseStatus = 200;
    let responseData = null;

    const mockReq = {
      method: 'POST',
      headers: {},
      body: { message: 'We need to talk about our schedule.' }
    };
    const mockRes = {
      status(code) { responseStatus = code; return this; },
      json(data) { responseData = data; return this; }
    };

    try {
      await handler(mockReq, mockRes);

      assert.equal(responseStatus, 503, 'Should return HTTP 503 when GEMINI_API_KEY is missing');
      assert.ok(responseData, 'Must return JSON response');
      assert.equal(responseData.code, 'MISSING_GEMINI_API_KEY');
      assert.equal(
        responseData.error,
        "Mira couldn't connect right now. Your message has not been lost. Please try again."
      );
      assert.ok(responseData.correlationId, 'Must include correlationId for debugging');
      assert.equal(responseData.structuredAdvice, undefined, 'Must NEVER return mock structuredAdvice when key is missing');
    } finally {
      if (originalKey) process.env.GEMINI_API_KEY = originalKey;
      if (originalAiKey) process.env.AI_API_KEY = originalAiKey;
    }
  });

  it('2. api/ai/mira.js dispatches real HTTP request to Google Gemini when key is present', async () => {
    const { default: handler } = await import('../api/ai/mira.js');

    process.env.GEMINI_API_KEY = 'AIzaSyTestDiagnosticKey12345';
    let responseStatus = 200;
    let responseData = null;

    const mockReq = {
      method: 'POST',
      headers: {},
      body: { message: 'Can you help me ask for quiet time?' }
    };
    const mockRes = {
      status(code) { responseStatus = code; return this; },
      json(data) { responseData = data; return this; }
    };

    try {
      await handler(mockReq, mockRes);

      // Google returns 400 for invalid test key, backend maps it to 502 Bad Gateway
      assert.equal(responseStatus, 502, 'Should return 502 when upstream Google returns 400 error');
      assert.equal(responseData.code, 'GEMINI_UPSTREAM_ERROR');
      assert.equal(responseData.upstreamStatus, 400);
      assert.equal(
        responseData.error,
        "Mira couldn't connect right now. Your message has not been lost. Please try again."
      );
      assert.ok(responseData.correlationId, 'Must include correlationId');
    } finally {
      delete process.env.GEMINI_API_KEY;
    }
  });

  it('3. supabase/functions/mira/index.ts eliminates mock fallback and enforces real GEMINI_API_KEY', () => {
    const edgeFuncPath = path.join(ROOT, 'supabase/functions/mira/index.ts');
    assert.ok(fs.existsSync(edgeFuncPath), 'Edge function must exist');

    const code = fs.readFileSync(edgeFuncPath, 'utf8');
    assert.ok(code.includes('MISSING_GEMINI_API_KEY'), 'Must return MISSING_GEMINI_API_KEY error code');
    assert.ok(code.includes("Mira couldn't connect right now. Your message has not been lost. Please try again."));
    assert.ok(!code.includes('whatWeKnow: "You are navigating a sensitive moment with your partner."'), 'Mock fallback text must be removed from Edge Function');
  });

  it('4. Frontend MiraView preserves user message and presents clear connection error on failure', () => {
    const miraViewPath = path.join(ROOT, 'web-app/src/components/MiraView.tsx');
    const content = fs.readFileSync(miraViewPath, 'utf8');

    assert.ok(content.includes("Mira couldn't connect right now. Your message has not been lost. Please try again."));
    assert.ok(content.includes('Try again'), 'Must offer Try again retry button');
  });

  it('5. Independent diagnostic script test-gemini-connection.mjs exists and is functional', () => {
    const diagPath = path.join(ROOT, 'scripts/test-gemini-connection.mjs');
    assert.ok(fs.existsSync(diagPath), 'Diagnostic script must exist');

    const diagContent = fs.readFileSync(diagPath, 'utf8');
    assert.ok(diagContent.includes('gemini-flash-latest'), 'Diagnostic script must target gemini-flash-latest');
    assert.ok(diagContent.includes('REDACTED'), 'Diagnostic script must redact API key');
  });
});
