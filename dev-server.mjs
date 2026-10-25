import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import quizSubmitHandler from './api/quiz-submit.js';
import rehearsalHandler from './api/ai/rehearsal.js';
import followupHandler from './api/ai/followup.js';
import jointSummaryHandler from './api/ai/joint-summary.js';
import gumroadWebhookHandler from './api/webhooks/gumroad.js';
import authMeHandler from './api/auth/me.js';

const app = express();
const port = process.env.PORT || 3000;

// Load .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
if (fs.existsSync(path.join(__dirname, '.env'))) {
    const env = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
    env.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const [k, ...v] = trimmed.split('=');
            process.env[k.trim()] = v.join('=').trim();
        }
    });
}

app.use(express.json());
app.use(express.static(__dirname));

// Adapter for Vercel/Node Serverless handler compatibility
function createVercelAdapter(handler) {
    return async (req, res) => {
        const vercelRes = {
            status: (code) => {
                res.status(code);
                return vercelRes;
            },
            json: (data) => res.json(data),
            send: (data) => res.send(data),
            setHeader: (k, v) => res.setHeader(k, v)
        };
        try {
            await handler(req, vercelRes);
        } catch (err) {
            console.error('API Error:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: "Internal Server Error" });
            }
        }
    };
}

// Register API Routes
app.post('/api/quiz-submit', createVercelAdapter(quizSubmitHandler));
app.post('/api/ai/rehearsal', createVercelAdapter(rehearsalHandler));
app.post('/api/ai/followup', createVercelAdapter(followupHandler));
app.post('/api/ai/joint-summary', createVercelAdapter(jointSummaryHandler));
app.post('/api/webhooks/gumroad', createVercelAdapter(gumroadWebhookHandler));
app.get('/api/auth/me', createVercelAdapter(authMeHandler));

// SPA Fallback for /app routes (matching vercel.json rewrites, Express 5 compatible)
app.get(/^\/app/, (req, res) => {
    res.sendFile(path.join(__dirname, 'app', 'index.html'));
});

app.listen(port, () => {
    console.log(`\n\n✅ How We Speak Local Dev Server running on http://localhost:${port}`);
    console.log(`   - Marketing: http://localhost:${port}/index.html`);
    console.log(`   - Web App:   http://localhost:${port}/app/`);
    console.log(`   - Quiz:      http://localhost:${port}/quiz.html\n\n`);
});
