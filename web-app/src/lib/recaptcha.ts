// ==============================================================================
// HOW WE SPEAK — CLIENT-SIDE GOOGLE reCAPTCHA v3 ENGINE
// Public Site Key: Safe for browser inclusion.
// Private secret key is strictly server-side and never present here.
// ==============================================================================

export const RECAPTCHA_SITE_KEY = (
  import.meta.env.VITE_RECAPTCHA_SITE_KEY ||
  '6LdoeAUuAAAAAPVldBT3ZQpe7yX1Gz1ncbz14Kdo'
).trim();

let scriptLoaded = false;
let loadPromise: Promise<void> | null = null;

/**
 * Dynamically load Google reCAPTCHA v3 script if not already present in DOM.
 */
export function loadRecaptchaScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();

  const win = window as any;
  if (win.grecaptcha && scriptLoaded) {
    return Promise.resolve();
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve) => {
    // Check if script element is already added to document
    const existing = document.getElementById('google-recaptcha-v3-script');
    if (existing && win.grecaptcha) {
      win.grecaptcha.ready(() => {
        scriptLoaded = true;
        resolve();
      });
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-recaptcha-v3-script';
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(RECAPTCHA_SITE_KEY)}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (win.grecaptcha) {
        win.grecaptcha.ready(() => {
          scriptLoaded = true;
          resolve();
        });
      } else {
        scriptLoaded = true;
        resolve();
      }
    };

    script.onerror = (e) => {
      console.warn('[SECURITY][reCAPTCHA] Failed to load Google script:', e);
      resolve(); // Graceful resolve to avoid unhandled crash
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

/**
 * Execute an invisible reCAPTCHA v3 action to retrieve a verification token.
 * @param action - Action identifier (e.g. 'login', 'signup', 'password_reset', 'mira_chat')
 * @returns Promise<string | null> The generated single-use token or null on failure
 */
export async function executeRecaptcha(action: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    await loadRecaptchaScript();
    const win = window as any;

    if (!win.grecaptcha || typeof win.grecaptcha.execute !== 'function') {
      console.warn('[SECURITY][reCAPTCHA] grecaptcha.execute is unavailable');
      return null;
    }

    const token = await win.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
    return token || null;
  } catch (err: any) {
    console.warn('[SECURITY][reCAPTCHA] Execution error for action:', action, err.message);
    return null;
  }
}

/**
 * Verify reCAPTCHA token against TryHowWeSpeak server verification endpoint.
 * @param token - Token from executeRecaptcha
 * @param action - Expected action
 */
export async function verifyTokenOnServer(token: string, action?: string): Promise<{ success: boolean; score?: number; error?: string }> {
  try {
    const res = await fetch('/api/auth/verify-captcha', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, action }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Security verification failed.',
      };
    }

    return {
      success: true,
      score: data.score,
    };
  } catch (err: any) {
    return {
      success: false,
      error: 'Security verification request failed.',
    };
  }
}
