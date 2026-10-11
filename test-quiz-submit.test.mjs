import assert from 'assert/strict';
import handler, { escapeHtml, splitMessage, buildQuizMessage } from './api/quiz-submit.js';

// Helper to create mock Express/Vercel request and response
function createMockReqRes({ method = 'POST', body = {} } = {}) {
    const req = { method, body };
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
        getBody: () => jsonBody
    };

    return { req, res };
}

let originalFetch = global.fetch;
let originalEnv = { ...process.env };

async function runTests() {
    console.log('🧪 Starting Unit & Integration Test Suite for Quiz -> Telegram API...\n');
    let passed = 0;
    let failed = 0;

    function report(name, success, details = '') {
        if (success) {
            passed++;
            console.log(`  ✅ PASS: ${name}`);
        } else {
            failed++;
            console.error(`  ❌ FAIL: ${name} — ${details}`);
        }
    }

    // ─────────────────────────────────────────────────────────
    // Test 1: HTML Escaping
    // ─────────────────────────────────────────────────────────
    try {
        const escaped = escapeHtml('<script>alert("xss & win")</script>');
        assert.equal(escaped, '&lt;script&gt;alert(&quot;xss &amp; win&quot;)&lt;/script&gt;');
        report('HTML entity escaping prevents tag injection', true);
    } catch (e) {
        report('HTML entity escaping prevents tag injection', false, e.message);
    }

    // ─────────────────────────────────────────────────────────
    // Test 2: Message Splitting (>4000 chars)
    // ─────────────────────────────────────────────────────────
    try {
        const longLine = 'A'.repeat(2500);
        const longText = `${longLine}\n${longLine}`; // 5001 chars
        const chunks = splitMessage(longText, 4000);
        assert.ok(chunks.length >= 2, `Expected 2+ chunks, got ${chunks.length}`);
        assert.ok(chunks[0].startsWith('[Part 1 of 2]'));
        assert.ok(chunks[1].startsWith('[Part 2 of 2]'));
        report('Long responses split cleanly without exceeding Telegram limits', true);
    } catch (e) {
        report('Long responses split cleanly without exceeding Telegram limits', false, e.message);
    }

    // ─────────────────────────────────────────────────────────
    // Test 3: Structured Message Builder matches required format
    // ─────────────────────────────────────────────────────────
    try {
        const payload = {
            submissionId: 'HWS-TEST-123',
            submittedAt: '2026-10-12T00:00:00Z',
            name: 'John Doe',
            email: 'john@example.com',
            archetype: 'AVOIDER',
            archetypeTitle: 'The Avoider',
            archetypeIcon: '🤐',
            scores: { AVOIDER: 6, PURSUER: 2 },
            responses: [
                { questionNumber: 1, question: 'When heated?', answer: 'We go quiet' },
                { questionNumber: 2, question: 'How long to recover?', answer: 'A few hours' }
            ]
        };
        const msg = buildQuizMessage(payload);
        assert.ok(msg.includes('NEW TRYHOWWESPEAK QUIZ SUBMISSION'));
        assert.ok(msg.includes('<b>Submission ID:</b> <code>HWS-TEST-123</code>'));
        assert.ok(msg.includes('<b>Name:</b> John Doe'));
        assert.ok(msg.includes('<b>Email:</b> john@example.com'));
        assert.ok(msg.includes('The Avoider (AVOIDER)'));
        assert.ok(msg.includes('<b>Question 1:</b> When heated?'));
        assert.ok(msg.includes('<b>Answer:</b> We go quiet'));
        report('Message builder accurately renders full questions, answers, and scores', true);
    } catch (e) {
        report('Message builder accurately renders full questions, answers, and scores', false, e.message);
    }

    // ─────────────────────────────────────────────────────────
    // Test 4: Missing Environment Variables
    // ─────────────────────────────────────────────────────────
    try {
        delete process.env.TELEGRAM_BOT_TOKEN;
        delete process.env.TELEGRAM_CHAT_ID;
        const { req, res } = createMockReqRes({ body: { email: 'test@example.com' } });
        await handler(req, res);
        assert.equal(res.getStatusCode(), 500);
        assert.equal(res.getBody().ok, false);
        report('Missing environment variables returns 500 error', true);
    } catch (e) {
        report('Missing environment variables returns 500 error', false, e.message);
    }

    // Restore env vars for subsequent mock tests
    process.env.TELEGRAM_BOT_TOKEN = '123456789:MOCK_TOKEN_STRING';
    process.env.TELEGRAM_CHAT_ID = '-1009999999';

    // ─────────────────────────────────────────────────────────
    // Test 5: Successful Mocked Telegram Delivery
    // ─────────────────────────────────────────────────────────
    try {
        global.fetch = async () => ({
            ok: true,
            status: 200,
            json: async () => ({ ok: true, result: { message_id: 101 } })
        });

        const { req, res } = createMockReqRes({
            body: {
                name: 'Alice',
                email: 'alice@example.com',
                archetype: 'PURSUER',
                responses: [{ questionNumber: 1, question: 'Q1?', answer: 'A1' }]
            }
        });
        await handler(req, res);
        assert.equal(res.getStatusCode(), 200);
        assert.equal(res.getBody().ok, true);
        assert.equal(res.getBody().partsDelivered, 1);
        report('Successful Telegram delivery returns 200 with ok: true', true);
    } catch (e) {
        report('Successful Telegram delivery returns 200 with ok: true', false, e.message);
    }

    // ─────────────────────────────────────────────────────────
    // Test 6: Missing Email Rejected (Per User Requirement)
    // ─────────────────────────────────────────────────────────
    try {
        const { req, res } = createMockReqRes({
            body: {
                name: null,
                email: null,
                archetype: 'FIXER',
                responses: [{ questionNumber: 1, question: 'Q1?', answer: 'A1' }]
            }
        });
        await handler(req, res);
        assert.equal(res.getStatusCode(), 400);
        assert.equal(res.getBody().ok, false);
        assert.ok(res.getBody().error.includes('email is required'));
        report('Missing email is rejected with 400 (notifications only sent when email provided)', true);
    } catch (e) {
        report('Missing email is rejected with 400 (notifications only sent when email provided)', false, e.message);
    }

    // ─────────────────────────────────────────────────────────
    // Test 7: Telegram API Error (e.g. Invalid chat ID or bot kicked)
    // ─────────────────────────────────────────────────────────
    try {
        global.fetch = async () => ({
            ok: false,
            status: 400,
            json: async () => ({ ok: false, error_code: 400, description: 'Bad Request: chat not found' })
        });

        const { req, res } = createMockReqRes({ body: { email: 'valid@example.com' } });
        await handler(req, res);
        assert.equal(res.getStatusCode(), 502);
        assert.equal(res.getBody().ok, false);
        assert.ok(res.getBody().error.includes('chat not found'));
        report('Telegram upstream rejection returns 502 with diagnostic reason', true);
    } catch (e) {
        report('Telegram upstream rejection returns 502 with diagnostic reason', false, e.message);
    }

    // ─────────────────────────────────────────────────────────
    // Test 8: Invalid Bot Credentials (401 Unauthorized)
    // ─────────────────────────────────────────────────────────
    try {
        global.fetch = async () => ({
            ok: false,
            status: 401,
            json: async () => ({ ok: false, error_code: 401, description: 'Unauthorized' })
        });

        const { req, res } = createMockReqRes({ body: { email: 'valid@example.com' } });
        await handler(req, res);
        assert.equal(res.getStatusCode(), 502);
        assert.equal(res.getBody().ok, false);
        assert.ok(res.getBody().error.includes('Unauthorized'));
        report('Invalid bot token error returns 502 Unauthorized', true);
    } catch (e) {
        report('Invalid bot token error returns 502 Unauthorized', false, e.message);
    }

    // ─────────────────────────────────────────────────────────
    // Test 9: Network Timeout Handling
    // ─────────────────────────────────────────────────────────
    try {
        global.fetch = async () => {
            const err = new Error('The operation was aborted due to timeout');
            err.name = 'TimeoutError';
            throw err;
        };

        const { req, res } = createMockReqRes({ body: { email: 'valid@example.com' } });
        await handler(req, res);
        assert.equal(res.getStatusCode(), 504);
        assert.equal(res.getBody().ok, false);
        assert.ok(res.getBody().error.includes('timeout'));
        report('Network timeout returns 504 Gateway Timeout', true);
    } catch (e) {
        report('Network timeout returns 504 Gateway Timeout', false, e.message);
    }

    // ─────────────────────────────────────────────────────────
    // Test 10: Invalid Email Format
    // ─────────────────────────────────────────────────────────
    try {
        const { req, res } = createMockReqRes({ body: { email: 'invalid-email-no-at' } });
        await handler(req, res);
        assert.equal(res.getStatusCode(), 400);
        assert.equal(res.getBody().ok, false);
        report('Malformed email returns 400 Bad Request', true);
    } catch (e) {
        report('Malformed email returns 400 Bad Request', false, e.message);
    }

    // ─────────────────────────────────────────────────────────
    // Test 11: Non-POST HTTP Method
    // ─────────────────────────────────────────────────────────
    try {
        const { req, res } = createMockReqRes({ method: 'GET' });
        await handler(req, res);
        assert.equal(res.getStatusCode(), 405);
        assert.equal(res.getBody().ok, false);
        report('GET request rejected with 405 Method Not Allowed', true);
    } catch (e) {
        report('GET request rejected with 405 Method Not Allowed', false, e.message);
    }

    // Cleanup
    global.fetch = originalFetch;
    process.env = originalEnv;

    console.log(`\n📊 Test Summary: ${passed} Passed, ${failed} Failed`);
    if (failed > 0) {
        process.exit(1);
    }
}

runTests();
