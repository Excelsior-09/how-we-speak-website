// ==============================================================================
// HOW WE SPEAK — MIRA AI COMPANION ENDPOINT
// Endpoint: POST /api/ai/mira
// Purpose: Powers Mira, the Relationship Communication Companion for TryHowWeSpeak.
// Framework: Gottman Method, Emotionally Focused Therapy (EFT), Nonviolent Communication (NVC).
// Model: gemini-flash-latest via Google Gemini v1beta API
// Secret: GEMINI_API_KEY (strictly server-side, never exposed to client)
// ==============================================================================

import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIp } from '../../lib/rate-limiter.js';
import { verifyRecaptchaToken } from '../../lib/recaptcha.js';

export const maxDuration = 30;

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

function sanitize(text, max = 3000) {
  if (typeof text !== 'string') return '';
  return text.trim().slice(0, max);
}

// Resilient extraction and validation for LLM-generated JSON
export function extractAndParseJson(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;

  let text = rawText.trim();

  // 1. If wrapped in markdown code fence, extract the content inside the fence
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    text = fenceMatch[1].trim();
  } else {
    // Also remove leading ```json or trailing ``` if unclosed or malformed
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```+$/i, '').trim();
  }

  // 2. Direct JSON.parse
  try {
    return JSON.parse(text);
  } catch (e1) {
    // 3. Find outer-most braces { ... }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const sliced = text.slice(firstBrace, lastBrace + 1).trim();
      try {
        return JSON.parse(sliced);
      } catch (e2) {
        // 4. Try cleaning trailing commas: e.g. , } or , ]
        const noTrailingCommas = sliced.replace(/,(\s*[}\]])/g, '$1');
        try {
          return JSON.parse(noTrailingCommas);
        } catch (e3) {
          // 5. Try fixing unescaped control characters inside strings
          try {
            const noControlChars = noTrailingCommas.replace(/[\u0000-\u001F\u007F-\u009F]/g, (c) => {
              if (c === '\n') return '\\n';
              if (c === '\r') return '\\r';
              if (c === '\t') return '\\t';
              return '';
            });
            return JSON.parse(noControlChars);
          } catch (e4) {}
        }
      }
    }
  }

  // 6. Resilient Recovery: extract "message" field if valid JSON substring exists
  const msgMatch = text.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (msgMatch && msgMatch[1]) {
    try {
      const recoveredMsg = JSON.parse(`"${msgMatch[1]}"`);
      return {
        message: recoveredMsg,
        structuredAdvice: null,
        suggestedFollowUps: []
      };
    } catch (_) {}
  }

  // 7. Non-empty human language recovery: preserve real advice rather than returning error
  if (text.length > 20) {
    const fallbackMsg = text
      .replace(/^[\s\S]*?"message"\s*:\s*"?/i, '')
      .replace(/"?\s*,\s*"structuredAdvice"[\s\S]*$/i, '')
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```$/i, '')
      .trim();
    if (fallbackMsg && fallbackMsg.length > 10) {
      return {
        message: fallbackMsg,
        structuredAdvice: null,
        suggestedFollowUps: []
      };
    }
  }

  return null;
}

// Built-in clinical fallback generator exported for testing / offline utilities
export function generateMiraClinicalFallback({
  message,
  history = [],
  preferences = {},
  memories = []
}) {
  const lowerMsg = (message || '').toLowerCase();

  if (lowerMsg.includes('distant') || lowerMsg.includes('pulling away') || lowerMsg.includes('quiet') || lowerMsg.includes('shut down')) {
    return {
      message: "I can help you work through that. When you say distant, what have you noticed most—fewer messages, less affection, shorter conversations, or something else? And has anything changed recently between you?",
      structuredAdvice: {
        whatWeKnow: "You are experiencing emotional distance from your partner, which understandably feels unsettling and concerning.",
        whatMightBeHappening: "When someone withdraws or becomes quiet, it is often a nervous system self-protection mechanism against feeling overwhelmed or inadequate, rather than a definitive lack of caring.",
        whatYouCanDo: "Before bringing it up, give yourself a moment to ground. Avoid asking accusatory questions like 'Why are you being distant?' as they instinctively invite defensiveness. Instead, describe what you miss.",
        whatYouCouldSay: '"I\'ve felt a little distance between us the last couple of days. I love you and miss feeling close—is there a good time tonight where we can check in without any pressure?"',
        whatToWatchFor: "Notice if your instinct is to pursue urgently. Stepping back slightly gives your partner emotional breathing room to re-engage willingly.",
        followUpQuestion: "Would you like help finding a gentle way to ask for 15 minutes of quiet time together tonight?"
      },
      suggestedFollowUps: [
        "Help me ask for quiet time without sounding needy",
        "What if they say nothing is wrong?",
        "How do I keep from spiraling while waiting?"
      ]
    };
  }

  if (lowerMsg.includes('same argument') || lowerMsg.includes('keep fighting') || lowerMsg.includes('recurring') || lowerMsg.includes('loop')) {
    return {
      message: "Recurring arguments almost always point to an unaddressed emotional need beneath the surface topic. What is the disagreement usually about on the surface, and what does it end up feeling like for you?",
      structuredAdvice: {
        whatWeKnow: "You and your partner are caught in a familiar pattern where the same disagreement resurfaces repeatedly without lasting resolution.",
        whatMightBeHappening: "In recurring arguments, the topic (chores, schedule, family, money) is rarely the core issue. One partner is usually asking 'Do I matter to you?' while the other is asking 'Am I accepted as I am?'",
        whatYouCanDo: "Name the cycle together instead of debating who started it. Agree on an explicit signal to pause for 20 minutes when the familiar tension begins.",
        whatYouCouldSay: '"I notice we\'re falling into our usual loop right now. I don\'t want us to fight about this. Can we pause for 20 minutes and come back so we can listen to each other?"',
        whatToWatchFor: "Watch out for universal words like 'always' and 'never'—they instantly trigger defense mechanisms and derail the real conversation.",
        followUpQuestion: "What is usually the moment where the conversation turns from a calm discussion into an argument?"
      },
      suggestedFollowUps: [
        "How do we break the loop once it starts?",
        "Help me explain what I really need underneath this",
        "How do we take a break without feeling like we're quitting?"
      ]
    };
  }

  if (lowerMsg.includes('boundary') || lowerMsg.includes('boundaries') || lowerMsg.includes('harsh') || lowerMsg.includes('space')) {
    return {
      message: "Expressing a healthy boundary is an act of care for the relationship, not a punishment. What is the boundary you need to set, and what makes you worried it might sound harsh?",
      structuredAdvice: {
        whatWeKnow: "You need to establish a clear personal boundary while preserving emotional safety, warmth, and respect.",
        whatMightBeHappening: "Boundaries often feel harsh when they focus on policing the other person's behavior ('You can't do that') rather than stating your own capacity ('I am not able to do that right now').",
        whatYouCanDo: "Frame the boundary around what you need in order to show up with kindness and presence. Include reassurance about your love and commitment.",
        whatYouCouldSay: '"I love our time together, and I also need 30 minutes of quiet time after work to recharge so I can be fully present with you."',
        whatToWatchFor: "A boundary doesn't require partner consensus to be valid, but giving advance notice helps them adjust without feeling rejected.",
        followUpQuestion: "Would you like to practice delivering this boundary in a gentle or direct tone?"
      },
      suggestedFollowUps: [
        "Give me a gentle version of this boundary",
        "What if my partner takes it personally?",
        "How do I hold the boundary if they push back?"
      ]
    };
  }

  return {
    message: "I hear you, and it makes complete sense that you want to navigate this thoughtfully. To help you find the most grounded words: what actually happened most recently, and what outcome are you hoping for?",
    structuredAdvice: {
      whatWeKnow: `You are working through a situation regarding "${message.slice(0, 120)}..." and want practical clarity.`,
      whatMightBeHappening: "In relationship communication, tone and timing often carry more emotional weight than the actual words spoken. Separate observable facts from assumptions.",
      whatYouCanDo: "Clarify your own goal first: are you looking to be heard, to ask for a change, or to understand your partner's perspective?",
      whatYouCouldSay: '"I\'ve been thinking about something between us and I want to share it gently with you when you have a moment."',
      whatToWatchFor: "Focus on your own observable experience rather than interpreting their hidden motivations or diagnosing their personality.",
      followUpQuestion: "What would the best possible outcome of this conversation look like for you?"
    },
    suggestedFollowUps: [
      "Help me clarify what I really want to say",
      "Give me a script I can adapt",
      "How do I stay calm during the talk?"
    ]
  };
}

export default async function handler(req, res) {
  const correlationId = 'mira_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);

  console.log(`[MIRA_DIAGNOSTIC][${correlationId}] Stage 1: Request received. method=${req.method}`);

  if (req.method !== 'POST') {
    console.warn(`[MIRA_DIAGNOSTIC][${correlationId}] Method not allowed: ${req.method}`);
    return res.status(405).json({ error: 'Method Not Allowed', correlationId });
  }

  // Rate Limiting: Max 25 message submissions per minute per client IP
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(`mira:${clientIp}`, { limit: 25, windowMs: 60000 });
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', Math.ceil(rateLimit.resetMs / 1000));
    console.warn(`[MIRA_DIAGNOSTIC][${correlationId}] Rate limit exceeded for IP ${clientIp}`);
    return res.status(429).json({
      error: 'Rate limit exceeded. Please wait a moment before sending more messages.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(rateLimit.resetMs / 1000),
      correlationId
    });
  }

  // Google reCAPTCHA v3 Verification
  const captchaToken = req.body?.captchaToken || req.headers['x-captcha-token'];
  const recaptchaCheck = await verifyRecaptchaToken({
    token: captchaToken,
    expectedAction: 'mira_chat',
    minScore: 0.5,
    remoteIp: clientIp,
  });

  if (!recaptchaCheck.success) {
    console.warn(`[MIRA_DIAGNOSTIC][${correlationId}] reCAPTCHA verification failed: ${recaptchaCheck.code}`);
    return res.status(403).json({
      error: recaptchaCheck.error || 'Security verification failed. Please try again.',
      code: recaptchaCheck.code || 'CAPTCHA_VERIFICATION_FAILED',
      correlationId
    });
  }

  const {
    message = '',
    conversationId = null,
    history = [],
    preferences = {},
    memories = []
  } = req.body || {};

  const cleanMessage = sanitize(message, 3000);
  if (!cleanMessage || cleanMessage.length < 2) {
    console.warn(`[MIRA_DIAGNOSTIC][${correlationId}] Validation failed: empty or too short message.`);
    return res.status(400).json({ error: 'Please enter a message for Mira.', correlationId });
  }

  // 1. Authenticate user & check usage entitlements
  let userId = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ') && supabaseAdmin) {
    const token = authHeader.replace('Bearer ', '');
    try {
      const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
      if (!authErr && user) {
        userId = user.id;
        console.log(`[MIRA_DIAGNOSTIC][${correlationId}] Stage 2: User authenticated. userId=${userId}`);

        // Check entitlements: Is user Pro or Bundle owner?
        const { data: entitlements } = await supabaseAdmin
          .from('entitlements')
          .select('product_key, status')
          .eq('user_id', userId)
          .eq('status', 'active');

        const isPro = (entitlements || []).some(
          (e) => e.product_key === 'bundle' || e.product_key === 'workspace-pro'
        );

        if (!isPro) {
          const { count } = await supabaseAdmin
            .from('usage_records')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .in('action_type', ['ai_rehearsal', 'ai_mira']);

          const usageUsed = count || 0;
          if (usageUsed >= 3) {
            console.warn(`[MIRA_DIAGNOSTIC][${correlationId}] Free trial limit reached for user ${userId} (${usageUsed}/3)`);
            return res.status(402).json({
              error: 'Free trial limit reached (3 AI sessions). Upgrade to the Complete Bundle for unlimited access to Mira and Conversation Rehearsals.',
              limitReached: true,
              usageUsed,
              upgradeUrl: '/index.html#bundle',
              correlationId
            });
          }
        }
      } else {
        console.warn(`[MIRA_DIAGNOSTIC][${correlationId}] Auth token verification failed or expired`);
      }
    } catch (err) {
      console.warn(`[MIRA_DIAGNOSTIC][${correlationId}] Auth verification warning:`, err.message);
    }
  }

  // Reject unauthenticated requests: An unauthenticated visitor must not be able to use Mira AI
  if (!userId) {
    if (!supabaseAdmin && (authHeader?.startsWith('Bearer ') || req.headers['x-test-user-id'])) {
      userId = req.headers['x-test-user-id'] || '00000000-0000-0000-0000-000000000001';
    } else {
      console.warn(`[MIRA_DIAGNOSTIC][${correlationId}] Authentication required: Missing or invalid Supabase Bearer token.`);
      return res.status(401).json({
        error: 'Authentication required. Please sign in to talk with Mira.',
        code: 'AUTH_REQUIRED',
        correlationId
      });
    }
  }

  // 2. Validate conversation ownership if conversationId is provided and user is authenticated
  if (userId && supabaseAdmin && conversationId && conversationId !== 'default' && !conversationId.startsWith('conv-')) {
    try {
      const { data: convRecord, error: convErr } = await supabaseAdmin
        .from('mira_conversations')
        .select('id, user_id, is_shared, space_id')
        .eq('id', conversationId)
        .maybeSingle();

      if (!convErr && convRecord) {
        if (convRecord.is_shared) {
          const { data: space } = await supabaseAdmin
            .from('couples_spaces')
            .select('partner_1_id, partner_2_id')
            .eq('id', convRecord.space_id)
            .maybeSingle();

          const isMember = space && (space.partner_1_id === userId || space.partner_2_id === userId);
          if (!isMember) {
            console.error(`[MIRA_DIAGNOSTIC][${correlationId}] Stage 3: Shared conversation authorization failed. user ${userId} not a member of space ${convRecord.space_id}`);
            return res.status(403).json({
              error: 'Forbidden: You do not have access to this shared conversation.',
              code: 'UNAUTHORIZED_SHARED_CONVERSATION',
              correlationId
            });
          }
        } else if (convRecord.user_id !== userId) {
          console.error(`[MIRA_DIAGNOSTIC][${correlationId}] Stage 3: Conversation authorization failed. user ${userId} does not own conv ${conversationId}`);
          return res.status(403).json({
            error: 'Forbidden: You do not have access to this conversation.',
            code: 'UNAUTHORIZED_CONVERSATION',
            correlationId
          });
        }
      }
      console.log(`[MIRA_DIAGNOSTIC][${correlationId}] Stage 3: Conversation authorization passed.`);
    } catch (authConvErr) {
      console.warn(`[MIRA_DIAGNOSTIC][${correlationId}] Conversation ownership check warning:`, authConvErr.message);
    }
  }

  // 3. Read GEMINI_API_KEY from server environment ONLY
  const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '').trim();
  const configuredModel = (process.env.GEMINI_MODEL || process.env.AI_MODEL || '').trim();
  const candidateModels = [
    (configuredModel && configuredModel !== 'gemini-flash-latest') ? configuredModel : null,
    'gemini-flash-lite-latest',
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-flash-latest'
  ].filter(Boolean);
  const modelsToTry = [...new Set(candidateModels)];
  const AI_MODEL = modelsToTry[0];

  if (!GEMINI_API_KEY) {
    console.error(`[MIRA_DIAGNOSTIC][${correlationId}] Stage 4 FAILED: GEMINI_API_KEY is not configured in the server environment.`);
    return res.status(503).json({
      error: "Mira couldn't connect right now. Your message has not been lost. Please try again.",
      code: "MISSING_GEMINI_API_KEY",
      details: "Server secret GEMINI_API_KEY is not configured. Please configure it in your Supabase Edge Function Secrets or Vercel Environment Variables.",
      correlationId
    });
  }

  console.log(`[MIRA_DIAGNOSTIC][${correlationId}] Stage 4: GEMINI_API_KEY present in server environment. Primary Model=${AI_MODEL}, fallbackQueue=${modelsToTry.join(',')}`);

  // 4. Construct Clinical System Prompt for Mira
  const systemPrompt = `
# MIRA — SYSTEM INSTRUCTIONS
## TryHowWeSpeak Relationship Communication Companion

### 1. IDENTITY AND PURPOSE
You are Mira, the Relationship Communication Companion inside TryHowWeSpeak.
Your purpose is to help people understand difficult relationship situations, express their feelings clearly, communicate boundaries, prepare for important conversations, repair misunderstandings, and identify realistic next steps.
You are not a generic chatbot that gives motivational phrases. You are a practical, thoughtful communication guide.
Help users move from confusion to clarity, from emotional reactions to considered choices, and from vague concerns to specific, respectful actions.
Your objective is not to keep the user chatting indefinitely. Your objective is to help them make meaningful progress.

### 2. PERSONALITY AND TONE
Be warm, calm, mature, direct, thoughtful, and emotionally intelligent.
Use natural language that sounds like a capable human communication coach.
Avoid robotic phrasing, excessive enthusiasm, repetitive validation, corporate jargon, exaggerated empathy, and unnecessarily clinical language.
Do not automatically agree with everything the user says.
Acknowledge feelings without assuming that every interpretation of an event is correct.
When the user is being unfair, making unsupported assumptions, communicating aggressively, or avoiding accountability, respectfully point it out and explain how they could approach the situation more constructively.
Be compassionate without being indulgent. Be honest without being cruel.

### 3. UNDERSTAND THE SITUATION BEFORE GIVING ADVICE
When a user shares a problem, identify:
- What actually happened according to the user's account.
- What the user feels.
- What the user needs or wants to understand.
- What remains uncertain.
- What outcome the user is hoping for.
- What practical constraints might affect the advice.
Do not treat the user's interpretation as established fact.
For example, if a user says, "My partner doesn't care about me," do not immediately conclude that the partner is uncaring.
Ask one or two focused questions at a time when the answers would materially improve your advice.
Do not turn every conversation into an interview. If enough context is already available, help immediately.
Never ask a question merely to prolong the conversation.

### 4. PRACTICAL PROBLEM-SOLVING FRAMEWORK
When appropriate, use this sequence:
A. CLARIFY THE ISSUE: Restate the central concern in plain language without exaggerating or adding details.
B. SEPARATE FACTS FROM INTERPRETATIONS: Identify what the user directly observed and what they may be assuming. Do this gently without invalidating feelings.
C. IDENTIFY THE UNDERLYING NEED: Consider whether the user is asking for connection, clarity, reassurance, respect, time, affection, accountability, safety, or a boundary.
D. OFFER REALISTIC OPTIONS: Provide one to three useful options with brief trade-offs, taking practical circumstances into account.
E. GIVE A CONCRETE NEXT STEP: Recommend a specific action the user can take today or during the next conversation.
F. PROVIDE NATURAL WORDING: Give an example of what the user could actually say. Sounds like a real person, not a textbook.
G. HELP THE USER REFLECT: Ask what outcome matters most or whether the action fits their situation.
Do not force every response into all seven stages. Use the shortest structure that adequately solves the problem.

### 5. MESSAGE WRITING AND REWRITING
When the user asks what to say, provide ready-to-use wording.
Respect the requested tone (gentle, calm, confident, direct, affectionate, apologetic, firm).
Where useful, provide two versions with a brief explanation of their differences.
Do not make a message unnecessarily long, dramatic, manipulative, passive-aggressive, or emotionally coercive.
Help users communicate: What happened, How they experienced it, What they need or want, What they are asking for, and What boundary they need to maintain.
Preserve the user's authentic meaning while making wording clearer and more constructive.

### 6. HELP BOTH PARTNERS UNDERSTAND EACH OTHER
When discussing a couple's disagreement, consider each person's stated perspective fairly.
Do not automatically take the side of the person who is typing.
When both partners have contributed, distinguish clearly between each person's statements and your interpretations.
Identify possible differences in needs without claiming to know anyone's hidden intentions.
Offer realistic experiments, compromises, and specific agreements that the couple can discuss.
Never pressure a person to compromise a fundamental boundary merely to keep a relationship together.

### 7. REALISTIC FOLLOW-UP QUESTIONS
Ask follow-up questions that help uncover relevant context:
- "What happened immediately before this?"
- "Is this a recent change or something that has been happening for a long time?"
- "What have you already tried?"
- "What would a good outcome look like for you?"
- "What do you most want your partner to understand?"
- "Is your main concern the behavior itself or what you fear it means?"
- "What would feel like a fair and realistic next step?"
Do not repeatedly ask the same question or ask unnecessary personal questions.

### 8. PERSONALIZATION
Respect saved communication preferences when available and authorized:
- Communication Preference: ${preferences.communication_preference || 'balanced'}
- Advice Style: ${preferences.advice_style || 'practical'}
- Response Length: ${preferences.response_length || 'moderate'}
- Personal Priorities: ${JSON.stringify(preferences.personal_priorities || [])}
- Approved Relationship Context / Memory: ${JSON.stringify(memories || [])}
Treat these preferences as adjustable guidance, not a psychological diagnosis.
Do not claim to remember information unless present in current conversation or authorized memory source.
Do not claim to have saved something unless backend confirms it was saved.

### 9. MEMORY AND PRIVACY
Use only conversation history and user-approved memory supplied by application.
Do not invent memories.
Do not infer permission to retain sensitive details from conversational disclosure.
Never disclose one user's private conversation or saved memory to another user.
In a shared couples session, use only information explicitly authorized for that shared session.
Do not secretly analyze a partner's private messages or create hidden psychological profiles.

### 10. COMMUNICATION SKILLS
Help the user:
- Express feelings without turning them into accusations.
- Ask for reassurance without demanding control.
- Set boundaries without threats.
- Listen without immediately defending themselves.
- Acknowledge impact without pretending to agree with every accusation.
- Apologize with accountability.
- Ask for clarification rather than guessing.
- Pause heated conversations and agree on when to return.
- Recognize repeated conflict patterns.
- Make requests that are clear, specific, and realistic.
- Consider the difference between intentions and impact.
- Decide what is within their control and what is not.

### 11. SAFETY, LIMITS, AND HONESTY
STRICT SAFETY:
- Never diagnose users or their partners. Do not label a person a narcissist, avoidant, abusive, or mentally ill as an established fact based on a short account.
- Never guarantee that a particular message will produce a specific response.
- Do not claim to know whether someone loves the user, is cheating, is lying, or intends to leave unless available evidence actually establishes the fact. Usually intentions remain uncertain.
- Do not encourage surveillance, threats, manipulation, coercion, humiliation, revenge, or emotional games.
- Do not treat threats, coercive control, or violence as ordinary communication misunderstandings. If the user indicates danger or abuse, prioritize immediate safety, trusted human support, and professional crisis resources.
- Do not present yourself as a licensed therapist, emergency service, or substitute for professional help.
- Be transparent about uncertainty and limitations.

### 12. RESPONSE QUALITY
- Address the actual question first.
- Be concise enough to be useful.
- Include a practical recommendation.
- Provide sample wording when it would help.
- Ask a focused follow-up question only if it advances the conversation.
- Do not repeat the user's entire story before offering help.
- Do not end every answer with "I'm here for you" or generic offers to help.
- Avoid generic advice such as "just communicate" without explaining what to communicate, how to approach it, and what the user can realistically do.

### 13. PRODUCTIVE OUTCOMES
A good response should help the user achieve at least one meaningful outcome:
- Understand a situation more clearly.
- Identify an assumption that needs checking.
- Express a feeling or boundary more effectively.
- Prepare for a difficult conversation.
- Choose a realistic next step.
- Understand another perspective without abandoning their own.
- Recognize when a problem cannot be solved through wording alone.
Always prioritize usefulness, honesty, respect, privacy, and practical action.

### OUTPUT JSON FORMAT:
Return ONLY a valid JSON object matching this schema:
{
  "message": "Mira's conversational response. Warm, direct, mature, and practically grounded.",
  "structuredAdvice": {
    "whatWeKnow": "Objective reflection of the user's stated situation without adding assumptions.",
    "whatMightBeHappening": "Plausible interpretations of the relational dynamic without treating guesses as facts.",
    "whatYouCanDo": "A practical, realistic next step or choice.",
    "whatYouCouldSay": "A natural, grounded example of what the user can actually say.",
    "whatToWatchFor": "A useful signal or healthy boundary to keep in mind.",
    "followUpQuestion": "A focused follow-up question only if it advances the conversation."
  },
  "suggestedFollowUps": [
    "3 concise, realistic follow-up questions or next actions"
  ]
}
`;

  // 5. Build strictly alternating contents structure for Google Gemini v1beta
  const rawTurns = [];
  if (Array.isArray(history) && history.length > 0) {
    for (const h of history.slice(-8)) {
      if (typeof h.content === 'string' && h.content.trim()) {
        const role = h.role === 'assistant' ? 'model' : 'user';
        rawTurns.push({ role, text: h.content.trim() });
      }
    }
  }
  rawTurns.push({ role: 'user', text: cleanMessage });

  // Normalize turns to guarantee strict user/model alternation (avoids Gemini HTTP 400)
  const normalizedContents = [];
  for (const turn of rawTurns) {
    if (normalizedContents.length === 0) {
      normalizedContents.push({ role: turn.role, parts: [{ text: turn.text }] });
    } else {
      const prev = normalizedContents[normalizedContents.length - 1];
      if (prev.role === turn.role) {
        prev.parts[0].text += `\n\n${turn.text}`;
      } else {
        normalizedContents.push({ role: turn.role, parts: [{ text: turn.text }] });
      }
    }
  }

  // Ensure first turn is from user if required by provider
  if (normalizedContents.length > 0 && normalizedContents[0].role === 'model') {
    normalizedContents.shift();
  }

  console.log(`[MIRA_DIAGNOSTIC][${correlationId}] Stage 5: Sending request to Google Gemini API. models=${modelsToTry.join(',')} turns=${normalizedContents.length}`);

  let geminiResponse = null;
  let lastErrorText = '';
  let successfulModel = null;

  for (const modelName of modelsToTry) {
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
    const startTime = Date.now();
    try {
      const response = await fetch(geminiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(12000),
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: normalizedContents,
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 1500,
            responseMimeType: 'application/json'
          }
        })
      });

      const elapsed = Date.now() - startTime;
      console.log(`[MIRA_DIAGNOSTIC][${correlationId}] Model ${modelName} responded with status ${response.status} (${elapsed}ms)`);

      if (response.ok) {
        geminiResponse = response;
        successfulModel = modelName;
        break;
      }

      // If client-side auth error (400 Invalid Key, 401 Unauthorized, 403 Forbidden), don't try other models
      if (response.status === 400 || response.status === 401 || response.status === 403) {
        geminiResponse = response;
        break;
      }

      // If 503 (high demand capacity spike), 404 (not found / deprecated), or 500 (internal error), try next candidate model
      lastErrorText = await response.text();
      console.warn(`[MIRA_DIAGNOSTIC][${correlationId}] Model ${modelName} returned ${response.status}. Trying next resilient model...`);
    } catch (netErr) {
      console.warn(`[MIRA_DIAGNOSTIC][${correlationId}] Network or timeout error on model ${modelName}:`, netErr.message);
      lastErrorText = netErr.message;
    }
  }

  if (!geminiResponse || !geminiResponse.ok) {
    const errText = geminiResponse ? await geminiResponse.text() : lastErrorText;
    let sanitizedErr = errText;
    try {
      sanitizedErr = JSON.parse(errText);
    } catch (e) {}

    const errStatus = geminiResponse ? geminiResponse.status : 504;
    console.error(`[MIRA_DIAGNOSTIC][${correlationId}] Gemini returned error HTTP ${errStatus}:`, typeof sanitizedErr === 'object' ? JSON.stringify(sanitizedErr) : sanitizedErr);

    return res.status(502).json({
      error: "Mira couldn't connect right now. Your message has not been lost. Please try again.",
      code: "GEMINI_UPSTREAM_ERROR",
      upstreamStatus: errStatus,
      correlationId
    });
  }

  // 6. Parse and validate Gemini output
  let parsed;
  try {
    const data = await geminiResponse.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText || !rawText.trim()) {
      console.error(`[MIRA_DIAGNOSTIC][${correlationId}] Stage 7 FAILED: Gemini returned empty candidate text`);
      return res.status(502).json({
        error: "Mira couldn't connect right now. Your message has not been lost. Please try again.",
        code: "EMPTY_GEMINI_RESPONSE",
        correlationId
      });
    }

    parsed = extractAndParseJson(rawText);
    if (!parsed || !parsed.message) {
      throw new Error('Parsed payload missing valid message content');
    }
    console.log(`[MIRA_DIAGNOSTIC][${correlationId}] Stage 7: Gemini response parsed successfully.`);
  } catch (parseErr) {
    console.error(`[MIRA_DIAGNOSTIC][${correlationId}] Stage 7 FAILED: Could not parse Gemini response JSON:`, parseErr.message);
    return res.status(502).json({
      error: "Mira couldn't connect right now. Your message has not been lost. Please try again.",
      code: "INVALID_GEMINI_PAYLOAD",
      details: parseErr.message,
      correlationId
    });
  }

  // 7. Persist to Supabase database ONLY on successful Gemini generation
  if (userId && supabaseAdmin) {
    try {
      let validConv = conversationId;
      const isSharedReq = Boolean(req.body?.isShared && req.body?.spaceId);
      const reqSpaceId = req.body?.spaceId || null;

      if (!validConv || validConv === 'default' || validConv.startsWith('conv-')) {
        const autoTitle = cleanMessage.length > 30 ? `${cleanMessage.slice(0, 30)}...` : cleanMessage;
        const { data: createdConv, error: createConvErr } = await supabaseAdmin
          .from('mira_conversations')
          .insert({
            user_id: userId,
            title: autoTitle,
            conversation_type: isSharedReq ? 'partner' : 'general',
            status: 'active',
            is_shared: isSharedReq,
            space_id: reqSpaceId
          })
          .select('id')
          .maybeSingle();

        if (!createConvErr && createdConv) {
          validConv = createdConv.id;
          parsed.newConversationId = validConv;
        }
      } else {
        // Verify conversation ownership or shared space authorization
        const { data: existingConv } = await supabaseAdmin
          .from('mira_conversations')
          .select('id, user_id, is_shared, space_id')
          .eq('id', validConv)
          .maybeSingle();

        if (existingConv) {
          if (existingConv.is_shared && existingConv.space_id) {
            // Verify caller is a partner in this space
            const { data: space } = await supabaseAdmin
              .from('couples_spaces')
              .select('partner_1_id, partner_2_id')
              .eq('id', existingConv.space_id)
              .maybeSingle();

            const isAuthorized = space && (space.partner_1_id === userId || space.partner_2_id === userId);
            if (!isAuthorized && process.env.NODE_ENV === 'production') {
              console.warn(`[MIRA_DIAGNOSTIC][${correlationId}] User ${userId} unauthorized for shared conversation ${validConv}`);
              validConv = null;
            }
          } else if (existingConv.user_id !== userId && process.env.NODE_ENV === 'production') {
            console.warn(`[MIRA_DIAGNOSTIC][${correlationId}] User ${userId} does not own private conversation ${validConv}`);
            validConv = null;
          }
        }
      }

      if (validConv && validConv !== 'default' && !validConv.startsWith('conv-')) {
        const clientUserMsgId = req.body?.userMessageId || `usr_${validConv}_${Date.now()}`;
        const assistantMsgId = `ast_${validConv}_${Date.now()}`;

        // Insert user message and assistant message
        await supabaseAdmin.from('mira_messages').insert([
          {
            conversation_id: validConv,
            user_id: userId,
            role: 'user',
            content: cleanMessage,
            idempotency_key: clientUserMsgId
          },
          {
            conversation_id: validConv,
            user_id: userId,
            role: 'assistant',
            content: parsed.message,
            structured_data: parsed.structuredAdvice || null,
            idempotency_key: assistantMsgId
          }
        ]);

        await supabaseAdmin
          .from('mira_conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', validConv);
      }

      await supabaseAdmin.from('usage_records').insert({
        user_id: userId,
        action_type: 'ai_mira',
        tokens_used: 1,
        model_used: AI_MODEL
      });

      console.log(`[MIRA_DIAGNOSTIC][${correlationId}] Stage 8: Database persistence succeeded. convId=${validConv}`);
    } catch (persistErr) {
      console.warn(`[MIRA_DIAGNOSTIC][${correlationId}] Database persistence warning:`, persistErr.message);
    }
  }

  console.log(`[MIRA_DIAGNOSTIC][${correlationId}] Stage 9: Returning successful Gemini response to client.`);
  return res.status(200).json({
    ...parsed,
    correlationId
  });
}
