import assert from 'assert/strict';
import handler from './api/quiz-submit.js';

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

async function runTests() {
    console.log('🧪 Verifying Quiz Submit Endpoint (Telegram Disabled)...\n');
    let passed = 0;

    const { req, res } = createMockReqRes({ body: { email: 'user@example.com' } });
    await handler(req, res);

    assert.equal(res.getStatusCode(), 200);
    assert.equal(res.getBody().ok, true);
    assert.ok(res.getBody().message.includes('disabled'));
    passed++;
    console.log('  ✅ PASS: Endpoint cleanly confirms Telegram notifications are disabled');

    console.log(`\n📊 Test Summary: ${passed} Passed, 0 Failed`);
}

runTests();
