// ==============================================================================
// HOW WE SPEAK — FOLLOW-UP PRACTICE REHEARSAL ENDPOINT
// Endpoint: POST /api/ai/followup
// Purpose: Practice counter-scripts when partner responds defensively or goes silent
// ==============================================================================

import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIp } from '../../lib/rate-limiter.js';
import { verifyRecaptchaToken } from '../../lib/recaptcha.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const AI_API_KEY = process.env.AI_API_KEY;
const AI_MODEL = process.env.AI_MODEL || 'gemini-1.5-pro';

const supabaseAdmin = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

function sanitize(text) {
  if (typeof text !== 'string') return '';
  return text.trim().slice(0, 1000);
}

function generateClinicalFollowupFallback(chosenScript, partnerReaction) {
  const reaction = (partnerReaction || '').toLowerCase();

  if (reaction.includes('silent') || reaction.includes('shut down') || reaction.includes('walk away')) {
    return {
      partnerState: "Flooded / Freeze Response: Silence is rarely defiance; it is usually autonomic overload where their heart rate has spiked past 100 BPM.",
      counterOptions: [
        {
          id: 'opt-soothe',
          label: 'De-escalating Reassurance',
          counterScript: "I can see this feels heavy, and I don't want you to feel trapped. Take all the quiet you need. I'm going into the other room, and whenever you're ready, I'm here.",
          why: "Removes the feeling of being hunted down while reaffirming connection."
        },
        {
          id: 'opt-postpone',
          label: 'Structured Time-Check',
          counterScript: "I love you and I want this conversation to be easy for both of us. Let's not force it right now. How about we check back in after dinner?",
          why: "Names love explicitly so silence does not translate into abandonment panic."
        }
      ]
    };
  }

  // Defensive or accusatory reaction
  return {
    partnerState: "Defensive / Fight Response: The partner feels criticized or misunderstood and is striking back to defend their worth.",
    counterOptions: [
      {
        id: 'opt-reflect',
        label: 'Acknowledge Before Answering',
        counterScript: "You're right that I've brought this up clumsily before, and I understand why you feel defensive. I really don't want to fight with you—I just miss feeling close.",
        why: "Agreeing with the grain of truth instantly dissolves defensive momentum without conceding your boundary."
      },
      {
        id: 'opt-reassure',
        label: 'The Clarifying Pivot',
        counterScript: "I'm not trying to say you did anything wrong or that you aren't trying. I'm just trying to share what is going on in my own heart. Can we start over gently?",
        why: "Directly dispels their internal fear that you are attacking their character."
      }
    ]
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Rate Limiting: Max 20 followup requests per minute per client IP
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(`followup:${clientIp}`, { limit: 20, windowMs: 60000 });
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', Math.ceil(rateLimit.resetMs / 1000));
    return res.status(429).json({
      error: 'Rate limit exceeded. Please wait a moment before requesting more followups.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(rateLimit.resetMs / 1000)
    });
  }

  // reCAPTCHA Token Verification
  const captchaToken = req.body?.captchaToken || req.headers['x-captcha-token'];
  const recaptchaCheck = await verifyRecaptchaToken({
    token: captchaToken,
    expectedAction: 'followup',
    minScore: 0.5,
    remoteIp: clientIp
  });

  if (!recaptchaCheck.success) {
    return res.status(403).json({
      error: recaptchaCheck.error || 'Security verification failed. Please try again.',
      code: recaptchaCheck.code || 'CAPTCHA_VERIFICATION_FAILED'
    });
  }

  const { chosenScript, partnerReaction } = req.body || {};
  const cleanScript = sanitize(chosenScript);
  const cleanReaction = sanitize(partnerReaction) || 'They get defensive and say I am blaming them.';

  if (!cleanScript) {
    return res.status(400).json({ error: 'Please provide the script you plan to deliver.' });
  }

  // AI Generation if configured
  if (AI_API_KEY) {
    try {
      const prompt = `
You are the senior clinical relationship communication coach for TryHowWeSpeak.
A partner is practicing a conversation follow-up.

CONTEXT:
What user intends to say: "${cleanScript}"
What they anticipate their partner might react with: "${cleanReaction}"

STRICT GUIDELINES:
- Non-diagnostic: Do not label either party (no "stonewalling", "gaslighting", "narcissistic").
- Practical & Grounded: Provide 2 counter-scripts that defuse tension and maintain connection.

Return ONLY a valid JSON object matching:
{
  "partnerState": "short explanation of the partner's underlying nervous system threat",
  "counterOptions": [
    {
      "id": "opt-1",
      "label": "string label",
      "counterScript": "spoken words inside quotes",
      "why": "psychological mechanism"
    },
    {
      "id": "opt-2",
      "label": "string label",
      "counterScript": "spoken words inside quotes",
      "why": "psychological mechanism"
    }
  ]
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

      if (response.ok) {
        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          return res.status(200).json({ ok: true, data: parsed });
        }
      }
    } catch (err) {
      console.warn('AI Followup Error, using clinical fallback:', err.message);
    }
  }

  const fallback = generateClinicalFollowupFallback(cleanScript, cleanReaction);
  return res.status(200).json({ ok: true, data: fallback });
}
