// ════════════════════════════════════════════════════
// TELEGRAM CREDENTIALS — SET IN VERCEL ENV VARS
//
//   Vercel Dashboard → Project → Settings →
//   Environment Variables
//
//   TELEGRAM_BOT_TOKEN = [PASTE BOT TOKEN HERE]
//   TELEGRAM_CHAT_ID   = [PASTE CHANNEL ID HERE]
//
// HOW TO GET THE CHANNEL ID:
//   1. Add your bot to the channel as an ADMIN
//      with "Post Messages" enabled
//   2. Post any message in the channel
//   3. Forward that message to @userinfobot
//      OR visit:
//      https://api.telegram.org/bot<TOKEN>/getUpdates
//   4. Look for "chat":{"id":-100XXXXXXXXXX}
//
//   Public channel alternative:
//      TELEGRAM_CHAT_ID = @yourchannelname
//
// NEVER commit these values. Add .env to .gitignore.
// ════════════════════════════════════════════════════

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TOKEN || !CHAT_ID) {
        console.error('[quiz-submit] Telegram env vars missing');
        return res.status(200).json({ ok: false, reason: 'not_configured' });
    }

    const body = req.body || {};
    if (JSON.stringify(body).length > 8000) {
        return res.status(413).json({ error: 'Payload too large' });
    }

    const { name, email, archetype, answers, meta, test } = body;

    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Invalid email' });
    }

    const esc = (s) => String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const header = test
        ? '🧪 <b>TEST SUBMISSION</b>'
        : '🔔 <b>NEW QUIZ COMPLETION</b>';

    const lines = [
        header,
        '',
        `<b>Name:</b> ${esc(name) || '(not provided)'}`,
        `<b>Email:</b> ${esc(email)}`,
        `<b>Result:</b> ${esc(archetype)}`,
        '',
        '<b>─── ANSWERS ───</b>',
        ...(answers || []).map((a, i) =>
            `<b>Q${i + 1}.</b> ${esc(a)}`
        ),
        '',
        '<b>─── CONTEXT ───</b>',
        `Time: ${new Date().toISOString()}`,
        `Device: ${esc(meta?.device) || 'unknown'}`,
        `Source: ${esc(meta?.referrer) || 'direct'}`,
        '',
        '📩 Send personalized plan to this address.'
    ];

    try {
        const tg = await fetch(
            `https://api.telegram.org/bot${TOKEN}/sendMessage`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    text: lines.join('\n'),
                    parse_mode: 'HTML',
                    disable_web_page_preview: true
                })
            }
        );

        const data = await tg.json();

        if (!data.ok) {
            console.error('[quiz-submit] Telegram rejected:',
                data.error_code, data.description);
            return res.status(200).json({
                ok: false,
                reason: data.description
            });
        }

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('[quiz-submit] Network error:', err);
        return res.status(200).json({ ok: false, reason: 'network' });
    }
}
