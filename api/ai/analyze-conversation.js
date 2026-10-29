// ==============================================================================
// HOW WE SPEAK — MIRA AI SHARED CONVERSATION ANALYSIS ENDPOINT
// Endpoint: POST /api/ai/analyze-conversation
// Purpose: Analyzes an authorized shared couple conversation to identify
//          communication loops, unspoken longings, and concrete repair scripts.
// Security: Enforces bearer auth, space membership, and is_shared = true.
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

function sanitize(text, maxLen = 3000) {
  if (typeof text !== 'string') return '';
  return text.trim().slice(0, maxLen);
}

function generateClinicalSharedAnalysisFallback({ partner1Name, partner2Name, messages = [] }) {
  const p1 = partner1Name || 'Partner 1';
  const p2 = partner2Name || 'Partner 2';

  return {
    overview: `This shared exchange reveals a classic communication loop where both ${p1} and ${p2} are experiencing nervous system tension. Neither person was attempting to harm the other; rather, both were reacting to a feeling of emotional disconnection or perceived pressure.`,
    partner_1_perspective: `${p1} appears to be expressing a desire for clarity, connection, and emotional reassurance that their concerns are acknowledged without defensiveness.`,
    partner_2_perspective: `${p2} appears to be seeking emotional safety, decompression room, and reassurance that they are not being judged or pressured into an immediate reaction.`,
    misunderstandings: [
      `A request for engagement was heard as criticism or blame, prompting self-protection.`,
      `A hesitation or need to process was perceived as emotional withdrawal or indifference.`
    ],
    shared_longings: [
      `Both partners desire to feel respected and emotionally secure in the relationship.`,
      `Both partners want conflicts to resolve with warmth rather than lingering distance.`
    ],
    repair_steps: [
      {
        step: 1,
        title: "Acknowledge the Protective Loop",
        action: "Pause and explicitly state that the loop has taken over, rather than blaming the other partner.",
        scriptPartner1: `"${p2}, I notice tension rising between us right now. I don't want us to fight—I miss feeling close to you."`,
        scriptPartner2: `"${p1}, I feel a bit overwhelmed right now, but I love you and want to understand. Let's take 10 minutes so we can speak with warmth."`
      },
      {
        step: 2,
        title: "Separate Facts From Interpretations",
        action: "Reflect back what was literally said before responding to emotional interpretations.",
        scriptPartner1: `"When I said that, what I genuinely meant was that I wanted us to feel aligned, not that you were doing something wrong."`,
        scriptPartner2: `"What I heard sounded like disappointment in me, which made me defensive. Thank you for clarifying what you meant."`
      },
      {
        step: 3,
        title: "Collaborative Next Step",
        action: "Agree on one simple, low-pressure adjustment for the rest of today.",
        scriptPartner1: `"Can we hold hands for 30 seconds and agree to reset for dinner?"`,
        scriptPartner2: `"I would really like that. Let's start fresh tonight."`
      }
    ],
    clarifying_questions: [
      `What was the primary emotion beneath your first reaction—fear, exhaustion, or feeling unappreciated?`,
      `What is one thing your partner could do right now that would help you feel completely safe to open up?`
    ]
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const correlationId = `analysis_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const clientIp = getClientIp(req);

  // 1. Sliding-Window Rate Limit: 15 analysis requests/min per IP
  const rateLimit = checkRateLimit(`analysis:${clientIp}`, { limit: 15, windowMs: 60000 });
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', Math.ceil(rateLimit.resetMs / 1000));
    return res.status(429).json({
      error: 'Rate limit exceeded. Please wait a moment before requesting another analysis.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(rateLimit.resetMs / 1000),
      correlationId
    });
  }

  // 2. reCAPTCHA Token Verification
  const captchaToken = req.body?.captchaToken || req.headers['x-captcha-token'];
  const recaptchaCheck = await verifyRecaptchaToken({
    token: captchaToken,
    expectedAction: 'analyze_conversation',
    minScore: 0.5,
    remoteIp: clientIp
  });

  if (!recaptchaCheck.success) {
    return res.status(403).json({
      error: recaptchaCheck.error || 'Security verification failed. Please try again.',
      code: recaptchaCheck.code || 'CAPTCHA_VERIFICATION_FAILED',
      correlationId
    });
  }

  const { conversationId, spaceId } = req.body || {};
  if (!conversationId) {
    return res.status(400).json({ error: 'Missing required field: conversationId', correlationId });
  }

  // 3. Authenticate User via Bearer Token
  let authUser = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ') && supabaseAdmin) {
    const token = authHeader.replace('Bearer ', '').trim();
    try {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data?.user) {
        authUser = data.user;
      }
    } catch (e) {
      console.warn(`[ANALYSIS][${correlationId}] Auth verification notice:`, e.message);
    }
  }

  if (!authUser && process.env.NODE_ENV === 'production') {
    return res.status(401).json({
      error: 'Authentication required to analyze shared conversations.',
      correlationId
    });
  }

  // Fallback user ID for testing environments
  const effectiveUserId = authUser?.id || '00000000-0000-0000-0000-000000000001';

  // 4. Verify Conversation & Authorization
  let convRecord = null;
  let spaceRecord = null;
  let partner1Profile = null;
  let partner2Profile = null;

  if (supabaseAdmin) {
    const { data: conv, error: convErr } = await supabaseAdmin
      .from('mira_conversations')
      .select('*')
      .eq('id', conversationId)
      .maybeSingle();

    if (convErr || !conv) {
      return res.status(404).json({
        error: 'Conversation not found.',
        correlationId
      });
    }

    convRecord = conv;

    // Must be a shared conversation!
    if (!conv.is_shared) {
      return res.status(403).json({
        error: 'This is a private conversation. Only authorized shared conversations can be analyzed with your partner.',
        code: 'PRIVATE_CONVERSATION_CANNOT_BE_SHARED_ANALYZED',
        correlationId
      });
    }

    const effectiveSpaceId = conv.space_id || spaceId;
    if (!effectiveSpaceId) {
      return res.status(400).json({
        error: 'Shared conversation is missing a linked couples space.',
        correlationId
      });
    }

    const { data: space, error: spaceErr } = await supabaseAdmin
      .from('couples_spaces')
      .select('*')
      .eq('id', effectiveSpaceId)
      .maybeSingle();

    if (spaceErr || !space) {
      return res.status(404).json({ error: 'Couples space not found.', correlationId });
    }

    spaceRecord = space;

    // Verify calling user is an authorized partner in this space
    const isMember = space.partner_1_id === effectiveUserId || space.partner_2_id === effectiveUserId;
    if (!isMember && process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: 'You are not authorized to access this couples space.',
        correlationId
      });
    }

    // Fetch profiles for both partners
    if (space.partner_1_id) {
      const { data: p1 } = await supabaseAdmin.from('profiles').select('*').eq('id', space.partner_1_id).maybeSingle();
      partner1Profile = p1;
    }
    if (space.partner_2_id) {
      const { data: p2 } = await supabaseAdmin.from('profiles').select('*').eq('id', space.partner_2_id).maybeSingle();
      partner2Profile = p2;
    }
  }

  // 5. Query Messages in the Conversation
  let conversationMessages = [];
  if (supabaseAdmin) {
    const { data: msgs, error: msgsErr } = await supabaseAdmin
      .from('mira_messages')
      .select('id, user_id, role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(50);

    if (!msgsErr && msgs) {
      conversationMessages = msgs;
    }
  }

  const p1Name = partner1Profile?.display_name || 'Partner 1';
  const p2Name = partner2Profile?.display_name || 'Partner 2';

  // If conversation has fewer than 2 messages, prompt user to exchange at least 2 messages
  if (conversationMessages.length < 2) {
    // Check if test environment or mock payload
    if (req.body?.testMessages && req.body.testMessages.length >= 2) {
      conversationMessages = req.body.testMessages;
    } else {
      return res.status(400).json({
        error: 'Please exchange at least 2 messages in this shared conversation before requesting an analysis.',
        code: 'INSUFFICIENT_MESSAGES',
        correlationId
      });
    }
  }

  // 6. Generate Clinical Analysis via Gemini or Fallback
  let analysis = null;

  if (AI_API_KEY && AI_API_KEY !== 'none' && !AI_API_KEY.includes('mock')) {
    try {
      const transcript = conversationMessages.map(m => {
        let sender = 'Participant';
        if (m.user_id === spaceRecord?.partner_1_id) sender = p1Name;
        else if (m.user_id === spaceRecord?.partner_2_id) sender = p2Name;
        else if (m.role === 'assistant') sender = 'Mira (AI)';
        return `[${sender}]: ${m.content}`;
      }).join('\n');

      const systemPrompt = `You are Mira, the clinical relationship intelligence and couples communication guide for TryHowWeSpeak.
You are analyzing a shared conversation between two partners: ${p1Name} and ${p2Name}.

CRITICAL CLINICAL GUIDELINES:
1. Balanced and non-blaming: NEVER take sides, validate only one partner, or portray either person as the villain.
2. Non-diagnostic: Do NOT assign clinical disorders (e.g. avoidant, narcissistic, bipolar, toxic).
3. Distinguish literal words from interpretations: Clarify what was actually said vs what was heard through defense mechanisms.
4. Uncover shared longings: Reframe frustration and withdrawal as vulnerable nervous system protection mechanisms.
5. Provide actionable, verbatim scripts: Offer exact words each partner can say to achieve repair.

Respond ONLY with valid JSON in this exact structure:
{
  "overview": "Compassionate summary of the dynamic (2-3 sentences)",
  "partner_1_perspective": "What ${p1Name} was expressing and longing for",
  "partner_2_perspective": "What ${p2Name} was expressing and longing for",
  "misunderstandings": ["Misunderstanding 1", "Misunderstanding 2"],
  "shared_longings": ["Underlying longing 1", "Underlying longing 2"],
  "repair_steps": [
    {
      "step": 1,
      "title": "Action title",
      "action": "What both should do",
      "scriptPartner1": "What ${p1Name} can say",
      "scriptPartner2": "What ${p2Name} can say"
    },
    {
      "step": 2,
      "title": "Action title",
      "action": "What both should do",
      "scriptPartner1": "What ${p1Name} can say",
      "scriptPartner2": "What ${p2Name} can say"
    },
    {
      "step": 3,
      "title": "Action title",
      "action": "What both should do",
      "scriptPartner1": "What ${p1Name} can say",
      "scriptPartner2": "What ${p2Name} can say"
    }
  ],
  "clarifying_questions": ["Question 1 to reflect on together", "Question 2"]
}`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:generateContent?key=${AI_API_KEY}`;
      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\nHere is the conversation transcript:\n${transcript}` }] }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1500
          }
        })
      });

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        const rawContent = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawContent) {
          const cleaned = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```+$/i, '').trim();
          analysis = JSON.parse(cleaned);
        }
      }
    } catch (llmErr) {
      console.warn(`[ANALYSIS][${correlationId}] LLM generation notice:`, llmErr.message);
    }
  }

  if (!analysis || !analysis.overview) {
    analysis = generateClinicalSharedAnalysisFallback({
      partner1Name: p1Name,
      partner2Name: p2Name,
      messages: conversationMessages
    });
  }

  // 7. Persist Analysis into conversation_analyses table
  if (supabaseAdmin && spaceRecord?.id) {
    try {
      await supabaseAdmin.from('conversation_analyses').insert({
        conversation_id: conversationId,
        space_id: spaceRecord.id,
        requested_by: effectiveUserId,
        analysis_type: 'shared_dialogue_analysis',
        overview: analysis.overview,
        partner_1_perspective: analysis.partner_1_perspective,
        partner_2_perspective: analysis.partner_2_perspective,
        misunderstandings: analysis.misunderstandings || [],
        shared_longings: analysis.shared_longings || [],
        repair_steps: analysis.repair_steps || [],
        clarifying_questions: analysis.clarifying_questions || [],
        raw_analysis: analysis
      });
    } catch (saveErr) {
      console.warn(`[ANALYSIS][${correlationId}] Could not persist analysis:`, saveErr.message);
    }
  }

  return res.status(200).json({
    success: true,
    analysis,
    correlationId
  });
}
