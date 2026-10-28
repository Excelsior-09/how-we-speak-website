// ==============================================================================
// HOW WE SPEAK — INDIVIDUAL CONVERSATION REHEARSAL ENDPOINT
// Endpoint: POST /api/ai/rehearsal
// Technology: Node.js Serverless (Vercel & Supabase compatible)
// Purpose: Clinical conversation preparation flow based on Gottman & EFT frameworks
// Security: Server-side API key, Supabase JWT auth, server-side usage limits
// ==============================================================================

import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIp } from '../lib/rate-limiter.js';
import { verifyRecaptchaToken } from '../lib/recaptcha.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const AI_API_KEY = process.env.AI_API_KEY;
const AI_MODEL = process.env.AI_MODEL || 'gemini-1.5-pro';

const supabaseAdmin = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

function sanitize(text, max = 2000) {
  if (typeof text !== 'string') return '';
  return text.trim().slice(0, max);
}

// Built-in clinical fallback generator when AI API key is not supplied in local dev
export function generateClinicalStructuredFallback({
  situationCategory,
  situation,
  goal,
  preferredTone,
  communicationMethod,
  additionalContext
}) {
  const isText = communicationMethod === 'text';
  const isCall = communicationMethod === 'call';

  const methodPrefix = isText
    ? '[Text Message Draft]'
    : isCall
    ? '[Phone/Video Call Prep]'
    : '[Face-to-Face Prep]';

  return {
    neutralSummary: `You are preparing to address a relationship situation (${situationCategory || 'interpersonal topic'}) where the focus is to ${goal.replace(/-/g, ' ')}. Stated situation details: "${situation.substring(0, 160)}${situation.length > 160 ? '...' : ''}".`,
    openings: {
      gentle: `${methodPrefix} "I've been feeling a bit disconnected lately and I really miss feeling close to you. When you have some quiet time today, I'd love for us to talk for a few minutes without any pressure or blame."`,
      direct: `${methodPrefix} "I notice we've been hitting a familiar disconnect around this, and I want to talk about how we can handle it together. Can we find 15 minutes tonight to check in?"`,
      firm: `${methodPrefix} "I care about our relationship deeply, and this is something important that I need us to address respectfully. I'd like us to set aside time today where we can both be fully present."`
    },
    comparisonExplanation: "The Gentle opening leads with vulnerability and disarms potential defensiveness. The Direct option clearly states the topic and invites collaboration without preamble. The Firm opening establishes a clear emotional boundary while maintaining respect and commitment.",
    followups: {
      receptive: "If your partner is open and receptive: 'Thank you for listening to me. What has this felt like from your side?'",
      disagreement: "If your partner disagrees: 'I hear that you see it differently. I don't want to argue about who is right—I just want us to understand each other's experience.'",
      defensiveness: "If your partner gets defensive: 'I'm not saying this to attack you or make you feel inadequate. I care about us, and that's why I want to speak gently.'",
      requestForTime: "If your partner asks for time: 'I completely respect that you need time to process. Let's take a break, and can we agree to sit down at [specific time, e.g. 8:00 PM]?'"
    },
    nextStep: "Before initiating, take 3 slow diaphragmatic breaths to bring your physiological heart rate below 90 BPM. Avoid starting this discussion when either of you is hungry, hurried, or heading to sleep.",
    disclaimer: "This guidance is educational and practical, not clinical diagnosis or medical therapy. We do not predict partner responses or guarantee specific outcomes. If ongoing abuse or acute emotional distress is present, seek licensed professional relationship counseling."
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Rate Limiting: Max 20 rehearsals per minute per client IP
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(`rehearsal:${clientIp}`, { limit: 20, windowMs: 60000 });
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', Math.ceil(rateLimit.resetMs / 1000));
    return res.status(429).json({
      error: 'Rate limit exceeded. Please wait a moment before running more rehearsals.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(rateLimit.resetMs / 1000)
    });
  }

  // reCAPTCHA Token Verification
  const captchaToken = req.body?.captchaToken || req.headers['x-captcha-token'];
  const recaptchaCheck = await verifyRecaptchaToken({
    token: captchaToken,
    expectedAction: 'rehearsal',
    minScore: 0.5,
    remoteIp: clientIp
  });

  if (!recaptchaCheck.success) {
    return res.status(403).json({
      error: recaptchaCheck.error || 'Security verification failed. Please try again.',
      code: recaptchaCheck.code || 'CAPTCHA_VERIFICATION_FAILED'
    });
  }

  const {
    situationCategory = 'other',
    situation = '',
    goal = 'understand',
    preferredTone = 'gentle',
    communicationMethod = 'face-to-face',
    additionalContext = ''
  } = req.body || {};

  const cleanCategory = sanitize(situationCategory, 100) || 'other';
  const cleanSituation = sanitize(situation, 2000);
  const cleanGoal = sanitize(goal, 100) || 'understand';
  const cleanTone = sanitize(preferredTone, 100) || 'gentle';
  const cleanMethod = sanitize(communicationMethod, 100) || 'face-to-face';
  const cleanContext = sanitize(additionalContext, 500);

  if (!cleanSituation || cleanSituation.length < 5) {
    return res.status(400).json({
      error: 'Please provide a description of the situation or what you want to address (at least 5 characters).'
    });
  }

  // 1. Authenticate user & check server-side free trial limit
  let userId = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ') && supabaseAdmin) {
    const token = authHeader.replace('Bearer ', '');
    try {
      const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
      if (!authErr && user) {
        userId = user.id;

        // Check active entitlements
        const { data: entitlements } = await supabaseAdmin
          .from('entitlements')
          .select('product_key')
          .eq('user_id', userId)
          .eq('status', 'active');

        const isPro = (entitlements || []).some(
          (e) => e.product_key === 'bundle' || e.product_key === 'workspace-pro'
        );

        if (!isPro) {
          // Count rehearsals consumed
          const { count, error: countErr } = await supabaseAdmin
            .from('usage_records')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('action_type', 'ai_rehearsal');

          const rehearsalsUsed = count || 0;
          if (rehearsalsUsed >= 3) {
            return res.status(402).json({
              error: 'Free trial limit reached (3 AI Rehearsals). Upgrade to the Complete Bundle for unlimited rehearsals.',
              limitReached: true,
              rehearsalsUsed,
              upgradeUrl: '/index.html#bundle'
            });
          }
        }
      }
    } catch (err) {
      console.warn('Auth verification warning:', err.message);
    }
  }

  // 2. AI Generation via Google Gemini
  if (AI_API_KEY) {
    try {
      const prompt = `
You are the senior relationship communication specialist and conversation coach for TryHowWeSpeak.
Your task is to prepare an individual conversation rehearsal plan based on Gottman Method, Non-Violent Communication (NVC), and Emotionally Focused Therapy (EFT).

STRICT SAFETY AND ETHICAL BOUNDARIES:
- NON-DIAGNOSTIC: Never diagnose either person (e.g., no "narcissist", "bpd", "sociopath", "avoidant personality"). Reframe defenses as nervous system protective responses.
- NO MIND-READING: Do not claim to know what the absent partner thinks or feels. Clearly distinguish the user's stated facts from possible interpretations.
- NO MANIPULATION: Never provide manipulative tactics or guarantee specific partner reactions.
- EMPHASIZE RESPECT: Encourage self-responsibility, emotional boundaries, and professional support if distressed.

USER INPUT:
- Situation Category: "${cleanCategory}"
- Stated Situation / Raw Input: "${cleanSituation}"
- Stated Goal: "${cleanGoal}"
- Preferred Tone: "${cleanTone}"
- Communication Method: "${cleanMethod}"
- Additional Context: "${cleanContext}"

Generate a structured response adhering strictly to this JSON format:
{
  "neutralSummary": "A concise, objective summary of the user's stated situation, distinguishing stated facts from emotional interpretations.",
  "openings": {
    "gentle": "A softened, disarming opening script tailored for ${cleanMethod} delivery.",
    "direct": "A clear, respectful, non-blaming direct opening script for ${cleanMethod} delivery.",
    "firm": "A grounded opening establishing emotional clarity and boundaries for ${cleanMethod} delivery."
  },
  "comparisonExplanation": "A concise paragraph explaining the distinct emotional impact and purpose of the three alternatives.",
  "followups": {
    "receptive": "Script to continue connection if partner responds receptively.",
    "disagreement": "Script if partner disagrees without attacking.",
    "defensiveness": "Script if partner reacts with defensiveness or blame.",
    "requestForTime": "Script if partner asks for time or space to process."
  },
  "nextStep": "One practical next step before initiating (e.g. physiological grounding, scheduling a distraction-free window).",
  "disclaimer": "Standard ethical disclaimer that guidance is educational and non-diagnostic."
}
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:generateContent?key=${AI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              responseMimeType: 'application/json'
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI Provider Error:', response.status, errorText);
        return res.status(502).json({
          error: 'AI Provider service error. Your rehearsal input has been preserved. Please try again in a few moments.'
        });
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('Malformed AI provider response.');
      }

      const parsed = JSON.parse(rawText);

      // Record usage audit without storing private user conversation text in audit logs
      if (userId && supabaseAdmin) {
        await supabaseAdmin.from('usage_records').insert({
          user_id: userId,
          action_type: 'ai_rehearsal',
          tokens_used: data.usageMetadata?.totalTokenCount || 300
        });
      }

      return res.status(200).json({ ok: true, data: parsed });
    } catch (err) {
      console.error('AI Execution Error:', err.message);
      // If API key is present but call failed, return explicit 502 without silent fake fallback
      return res.status(502).json({
        error: `AI provider error: ${err.message || 'Unable to generate response'}. Your input is preserved; please retry.`
      });
    }
  }

  // 3. Clinical Fallback (only when AI_API_KEY is not configured in local environment)
  const fallback = generateClinicalStructuredFallback({
    situationCategory: cleanCategory,
    situation: cleanSituation,
    goal: cleanGoal,
    preferredTone: cleanTone,
    communicationMethod: cleanMethod,
    additionalContext: cleanContext
  });

  // Log usage record in database if authenticated
  if (userId && supabaseAdmin) {
    try {
      await supabaseAdmin.from('usage_records').insert({
        user_id: userId,
        action_type: 'ai_rehearsal',
        tokens_used: 150
      });
    } catch {
      // Non-blocking
    }
  }

  return res.status(200).json({
    ok: true,
    data: fallback,
    devNotice: 'Generated via built-in clinical rule engine (AI_API_KEY not configured in local environment).'
  });
}
