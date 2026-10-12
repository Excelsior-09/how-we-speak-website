// ════════════════════════════════════════════════════
// HOW WE SPEAK — QUIZ SUBMISSION ENDPOINT (DISABLED)
// Telegram functionality has been completely removed per user request.
// ════════════════════════════════════════════════════

export default async function handler(req, res) {
    return res.status(200).json({
        ok: true,
        message: 'Telegram notifications have been disabled.'
    });
}
