import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import apiHandler from './api/quiz-submit.js';

const app = express();
const port = 3000;

// Load .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
if (fs.existsSync(path.join(__dirname, '.env'))) {
    const env = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
    env.split(/\r?\n/).forEach(line => {
        if (line.includes('=')) {
            const [k, v] = line.split('=');
            process.env[k] = v;
        }
    });
}

app.use(express.json());
app.use(express.static(__dirname));

app.post('/api/quiz-submit', async (req, res) => {
    const vercelRes = {
        status: (code) => {
            res.status(code);
            return vercelRes;
        },
        json: (data) => res.json(data)
    };
    try {
        await apiHandler(req, vercelRes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(port, () => {
    console.log(`\n\n✅ Local Server running! Visit: http://localhost:${port}/quiz.html\n\n`);
});
