// ==============================================================================
// HOW WE SPEAK — SERVERLESS reCAPTCHA VERIFICATION ENDPOINT
// Endpoint: POST /api/auth/verify-captcha
// Verifies client-supplied reCAPTCHA token against Google's siteverify API.
// Rate-limited and validated before returning verification status.
// ==============================================================================

import { verifyRecaptchaToken } from '../../lib/recaptcha.js';
import { checkRateLimit, getClientIp } from '../../lib/rate-limiter.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      error: 'Method Not Allowed',
      code: 'METHOD_NOT_ALLOWED',
    });
  }

  const clientIp = getClientIp(req);

  // Rate limit: Max 40 verification attempts per minute per IP
  const rateLimit = checkRateLimit(`captcha_verify:${clientIp}`, {
    limit: 40,
    windowMs: 60000,
  });

  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', Math.ceil(rateLimit.resetMs / 1000));
    return res.status(429).json({
      error: 'Too many verification attempts. Please wait a moment before trying again.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(rateLimit.resetMs / 1000),
    });
  }

  const { token, action, minScore } = req.body || {};

  const verification = await verifyRecaptchaToken({
    token,
    expectedAction: action,
    minScore: typeof minScore === 'number' ? minScore : 0.5,
    remoteIp: clientIp,
  });

  if (!verification.success) {
    return res.status(400).json({
      success: false,
      error: verification.error || 'Security verification failed.',
      code: verification.code || 'CAPTCHA_VERIFICATION_FAILED',
    });
  }

  return res.status(200).json({
    success: true,
    score: verification.score,
    action: verification.action,
    hostname: verification.hostname,
  });
}
