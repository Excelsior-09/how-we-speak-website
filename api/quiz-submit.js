// ════════════════════════════════════════════════════
// HOW WE SPEAK — QUIZ SUBMISSION SERVERLESS ENDPOINT
// Destination: Telegram Bot API (sendMessage)
// Credentials: TELEGRAM_BOT_TOKEN & TELEGRAM_CHAT_ID
// ════════════════════════════════════════════════════

const MAX_TG_MESSAGE_LENGTH = 4000; // Telegram limit is 4096 characters

/**
 * Escapes HTML characters for safe Telegram HTML parse_mode
 */
export function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Splits message text into chunks that fit within Telegram's character limits
 */
export function splitMessage(text, maxLength = MAX_TG_MESSAGE_LENGTH) {
    if (text.length <= maxLength) return [text];

    const lines = text.split('\n');
    const chunks = [];
    let currentChunk = '';

    for (const line of lines) {
        if ((currentChunk + '\n' + line).length > maxLength) {
            if (currentChunk.trim().length > 0) {
                chunks.push(currentChunk.trim());
                currentChunk = line;
            } else {
                // Line itself exceeds maxLength, split forcibly
                let start = 0;
                while (start < line.length) {
                    chunks.push(line.slice(start, start + maxLength));
                    start += maxLength;
                }
                currentChunk = '';
            }
        } else {
            currentChunk = currentChunk ? (currentChunk + '\n' + line) : line;
        }
    }

    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
    }

    if (chunks.length > 1) {
        return chunks.map((chunk, idx) => `[Part ${idx + 1} of ${chunks.length}]\n\n${chunk}`);
    }

    return chunks;
}

/**
 * Builds the structured Telegram message lines matching the required template
 */
export function buildQuizMessage(payload) {
    const {
        submissionId,
        submittedAt,
        name,
        email,
        archetype,
        archetypeTitle,
        archetypeIcon,
        scores,
        responses = [],
        answers = [],
        meta = {},
        test = false
    } = payload;

    const timestamp = submittedAt || new Date().toISOString();
    const id = submissionId || `HWS-${Date.now().toString(36).toUpperCase()}`;

    const lines = [];

    // Header
    if (test) {
        lines.push('🧪 <b>[TEST] NEW TRYHOWWESPEAK QUIZ SUBMISSION</b>');
    } else {
        lines.push('🔔 <b>NEW TRYHOWWESPEAK QUIZ SUBMISSION</b>');
    }
    lines.push('');
    lines.push(`<b>Submission ID:</b> <code>${escapeHtml(id)}</code>`);
    lines.push(`<b>Submitted at:</b> ${escapeHtml(timestamp)}`);
    lines.push('');

    // Contact Information
    lines.push('📋 <b>CONTACT INFORMATION</b>');
    lines.push(`<b>Name:</b> ${name ? escapeHtml(name) : '<i>(not provided)</i>'}`);
    lines.push(`<b>Email:</b> ${email ? escapeHtml(email) : '<i>(skipped / not provided)</i>'}`);
    lines.push('');

    // Quiz Result
    const categoryDisplay = archetypeTitle
        ? `${archetypeIcon ? archetypeIcon + ' ' : ''}${archetypeTitle} (${archetype || 'N/A'})`
        : (archetype || 'N/A');

    lines.push('🎯 <b>QUIZ RESULT</b>');
    lines.push(`<b>Result category:</b> <b>${escapeHtml(categoryDisplay)}</b>`);
    if (scores && typeof scores === 'object') {
        const scoreStr = Object.entries(scores)
            .map(([k, v]) => `${k}: ${v}`)
            .join(' | ');
        lines.push(`<b>Score breakdown:</b> ${escapeHtml(scoreStr)}`);
    }
    lines.push('');

    // Quiz Responses
    lines.push('💬 <b>QUIZ RESPONSES</b>');

    // Handle responses whether structured objects or legacy array
    if (Array.isArray(responses) && responses.length > 0) {
        responses.forEach((r, idx) => {
            const qNum = r.questionNumber || idx + 1;
            const qText = r.question ? escapeHtml(r.question) : `Question ${qNum}`;
            const aText = escapeHtml(r.answer || r.text || 'No answer');
            lines.push(`<b>Question ${qNum}:</b> ${qText}`);
            lines.push(`<b>Answer:</b> ${aText}`);
            lines.push('');
        });
    } else if (Array.isArray(answers) && answers.length > 0) {
        answers.forEach((ans, idx) => {
            lines.push(`<b>Question ${idx + 1}:</b> <i>(see options)</i>`);
            lines.push(`<b>Answer:</b> ${escapeHtml(ans)}`);
            lines.push('');
        });
    } else {
        lines.push('<i>No question responses recorded.</i>');
        lines.push('');
    }

    // Source & Metadata
    lines.push('🌐 <b>SOURCE</b>');
    lines.push('<b>Website:</b> tryhowwespeak.com');
    lines.push('<b>Form:</b> Take Quiz');
    if (meta && (meta.device || meta.referrer)) {
        lines.push(`<b>Device:</b> ${escapeHtml(meta.device || 'unknown')}`);
        if (meta.referrer) {
            lines.push(`<b>Referrer:</b> ${escapeHtml(meta.referrer)}`);
        }
    }

    return lines.join('\n');
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, error: 'Method not allowed. Use POST.' });
    }

    const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TOKEN || !CHAT_ID) {
        console.error('[quiz-submit] Telegram credentials not configured in environment');
        return res.status(500).json({
            ok: false,
            error: 'Server configuration error: Telegram credentials missing'
        });
    }

    const body = req.body || {};
    if (typeof body !== 'object') {
        return res.status(400).json({ ok: false, error: 'Invalid JSON payload' });
    }

    // Basic size guard
    if (JSON.stringify(body).length > 25000) {
        return res.status(413).json({ ok: false, error: 'Payload too large' });
    }

    const { email } = body;
    // If email is provided, validate its format
    if (email && (!email.includes('@') || !email.includes('.'))) {
        return res.status(400).json({ ok: false, error: 'Invalid email format' });
    }

    const submissionId = body.submissionId || `HWS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const payload = { ...body, submissionId };

    const fullMessageText = buildQuizMessage(payload);
    const messageChunks = splitMessage(fullMessageText);

    try {
        for (let i = 0; i < messageChunks.length; i++) {
            const chunk = messageChunks[i];
            const tgRes = await fetch(
                `https://api.telegram.org/bot${TOKEN}/sendMessage`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: CHAT_ID,
                        text: chunk,
                        parse_mode: 'HTML',
                        disable_web_page_preview: true
                    }),
                    signal: AbortSignal.timeout(8000)
                }
            );

            const data = await tgRes.json().catch(() => null);

            if (!tgRes.ok || !data || !data.ok) {
                const errorCode = data?.error_code || tgRes.status;
                const errorDesc = data?.description || 'Unknown Telegram API error';
                console.error(`[quiz-submit] Telegram API delivery error [${errorCode}]: ${errorDesc}`);
                return res.status(502).json({
                    ok: false,
                    error: `Telegram delivery failed: ${errorDesc}`,
                    submissionId
                });
            }
        }

        console.log(`[quiz-submit] Successfully delivered submission ${submissionId} (${messageChunks.length} message part(s))`);
        return res.status(200).json({
            ok: true,
            submissionId,
            partsDelivered: messageChunks.length
        });

    } catch (err) {
        if (err.name === 'TimeoutError' || err.name === 'AbortError') {
            console.error('[quiz-submit] Telegram request timed out after 8s');
            return res.status(504).json({
                ok: false,
                error: 'Gateway timeout contacting Telegram',
                submissionId
            });
        }
        console.error('[quiz-submit] Network / runtime error:', err.message);
        return res.status(502).json({
            ok: false,
            error: 'Network error connecting to Telegram API',
            submissionId
        });
    }
}
