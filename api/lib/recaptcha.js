// ==============================================================================
// HOW WE SPEAK — SERVER-SIDE GOOGLE reCAPTCHA VERIFICATION ENGINE
// Official Google Verification Endpoint: https://www.google.com/recaptcha/api/siteverify
// Never exposes RECAPTCHA_SECRET_KEY in responses, errors, or client bundles.
// ==============================================================================

const GOOGLE_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

// Legitimate hostnames authorized to interact with TryHowWeSpeak
const AUTHORIZED_HOSTNAMES = new Set([
  'tryhowwespeak.com',
  'www.tryhowwespeak.com',
  'localhost',
  '127.0.0.1',
]);

/**
 * Verifies a Google reCAPTCHA response token against Google's verification API.
 * 
 * @param {Object} options
 * @param {string} options.token - Client-submitted reCAPTCHA token
 * @param {string} [options.expectedAction] - Optional action name (e.g. 'mira_chat', 'login', 'signup', 'password_reset')
 * @param {number} [options.minScore=0.5] - Minimum required score for reCAPTCHA v3 (default 0.5)
 * @param {string} [options.remoteIp] - Client IP address
 * @returns {Promise<{ success: boolean, score?: number, action?: string, hostname?: string, error?: string, code?: string }>}
 */
export async function verifyRecaptchaToken({
  token,
  expectedAction,
  minScore = 0.5,
  remoteIp,
}) {
  const secretKey = (process.env.RECAPTCHA_SECRET_KEY || '').trim();

  // If secret key is not set in environment
  if (!secretKey) {
    const isProduction =
      process.env.NODE_ENV === 'production' ||
      process.env.VERCEL_ENV === 'production' ||
      process.env.APP_ENV === 'production';

    if (isProduction) {
      console.error('[SECURITY][reCAPTCHA] RECAPTCHA_SECRET_KEY is missing in production environment');
      return {
        success: false,
        error: 'Security verification service is temporarily unavailable. Please try again shortly.',
        code: 'RECAPTCHA_NOT_CONFIGURED',
      };
    }

    // In local development or automated test runners without secret keys, log warning and allow
    console.warn('[SECURITY][reCAPTCHA] RECAPTCHA_SECRET_KEY not set in non-production environment. Bypassing check for development/test.');
    return {
      success: true,
      score: 1.0,
      action: expectedAction || 'test',
      hostname: 'localhost',
    };
  }

  // Token is mandatory when secret is configured
  if (!token || typeof token !== 'string' || token.trim() === '') {
    return {
      success: false,
      error: 'Security verification token is required. Please refresh and try again.',
      code: 'CAPTCHA_TOKEN_MISSING',
    };
  }

  try {
    const params = new URLSearchParams();
    params.append('secret', secretKey);
    params.append('response', token.trim());
    if (remoteIp) {
      params.append('remoteip', remoteIp);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(GOOGLE_VERIFY_URL, {
      method: 'POST',
      body: params,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.error(`[SECURITY][reCAPTCHA] Google siteverify returned HTTP ${res.status}`);
      return {
        success: false,
        error: 'Security verification service temporarily unreachable. Please retry in a few moments.',
        code: 'CAPTCHA_SERVICE_UNAVAILABLE',
      };
    }

    const data = await res.json();

    if (!data.success) {
      const errorCodes = data['error-codes'] || [];
      console.warn(`[SECURITY][reCAPTCHA] Verification rejected by Google. Codes: ${errorCodes.join(', ')}`);

      if (errorCodes.includes('timeout-or-duplicate')) {
        return {
          success: false,
          error: 'Security token has expired or already been used. Please try again.',
          code: 'CAPTCHA_TOKEN_EXPIRED',
        };
      }

      return {
        success: false,
        error: 'Security verification failed. Please try again.',
        code: 'CAPTCHA_VERIFICATION_FAILED',
      };
    }

    // Hostname validation
    if (data.hostname && !AUTHORIZED_HOSTNAMES.has(data.hostname.toLowerCase())) {
      console.warn(`[SECURITY][reCAPTCHA] Hostname mismatch: ${data.hostname}`);
      return {
        success: false,
        error: 'Security verification failed: request originated from an unauthorized domain.',
        code: 'CAPTCHA_HOSTNAME_MISMATCH',
      };
    }

    // Action validation (reCAPTCHA v3)
    if (expectedAction && data.action && data.action !== expectedAction) {
      console.warn(`[SECURITY][reCAPTCHA] Action mismatch: expected "${expectedAction}", got "${data.action}"`);
      return {
        success: false,
        error: 'Security verification failed: action mismatch. Please try again.',
        code: 'CAPTCHA_ACTION_MISMATCH',
      };
    }

    // Risk score evaluation (reCAPTCHA v3)
    if (typeof data.score === 'number' && data.score < minScore) {
      console.warn(`[SECURITY][reCAPTCHA] Low risk score: ${data.score} < ${minScore}`);
      return {
        success: false,
        error: 'Automated activity detected. If you are a human user, please try again.',
        code: 'CAPTCHA_LOW_SCORE',
        score: data.score,
      };
    }

    return {
      success: true,
      score: data.score ?? 1.0,
      action: data.action,
      hostname: data.hostname,
      challengeTs: data.challenge_ts,
    };
  } catch (err) {
    console.error('[SECURITY][reCAPTCHA] Verification call exception:', err.message);
    return {
      success: false,
      error: 'Security verification failed due to network error. Please try again.',
      code: 'CAPTCHA_NETWORK_ERROR',
    };
  }
}
