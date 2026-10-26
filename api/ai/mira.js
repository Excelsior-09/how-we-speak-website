// ==============================================================================
// HOW WE SPEAK — MIRA AI COMMUNICATION COMPANION ENDPOINT
// Endpoint: POST /api/ai/mira
// Features: Warm, grounded, emotionally intelligent relationship companion.
//           Asks thoughtful clarifying questions, provides actionable structured
//           advice, respects user preferences and consent-based memory.
// ==============================================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const AI_API_KEY = process.env.AI_API_KEY;
const AI_MODEL = process.env.AI_MODEL || 'gemini-1.5-pro';

const supabaseAdmin = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

function sanitize(text, max = 3000) {
  if (typeof text !== 'string') return '';
  return text.trim().slice(0, max);
}

// Built-in clinical fallback generator when AI API key is not supplied in local dev / test
export function generateMiraClinicalFallback({
  message,
  history = [],
  preferences = {},
  memories = []
}) {
  const lowerMsg = message.toLowerCase();

  // 1. Situation: Distant partner
  if (lowerMsg.includes('distant') || lowerMsg.includes('pulling away') || lowerMsg.includes('quiet') || lowerMsg.includes('shut down')) {
    return {
      message: "I can help you work through that. When you say distant, what have you noticed most—fewer messages, less affection, shorter conversations, or something else? And has anything changed recently between you?",
      structuredAdvice: {
        whatWeKnow: "You are experiencing emotional distance from your partner, which understandably feels unsettling.",
        whatMightBeHappening: "When someone withdraws, it is often a nervous system self-protection mechanism against feeling overwhelmed or inadequate, rather than a lack of caring.",
        whatYouCanDo: "Before bringing it up, give yourself a moment to ground. Avoid asking 'Why are you being distant?' as it invites defensiveness.",
        whatYouCouldSay: '"I\'ve felt a little distance between us the last couple of days. I love you and miss feeling connected—is there a good time tonight where we can check in without any pressure?"',
        whatToWatchFor: "Notice if your instinct is to pursue urgently. Stepping back slightly gives them emotional breathing room to re-engage.",
        followUpQuestion: "Would you like help finding a gentle way to ask for 15 minutes of quiet time together tonight?"
      },
      suggestedFollowUps: [
        "Help me ask for quiet time without sounding needy",
        "What if they say nothing is wrong?",
        "How do I keep from spiraling while waiting?"
      ]
    };
  }

  // 2. Situation: Same argument / Recurring conflict
  if (lowerMsg.includes('same argument') || lowerMsg.includes('keep fighting') || lowerMsg.includes('recurring') || lowerMsg.includes('loop')) {
    return {
      message: "Recurring arguments almost always point to an unaddressed emotional need beneath the surface topic. What is the disagreement usually about on the surface, and what does it end up feeling like for you?",
      structuredAdvice: {
        whatWeKnow: "You and your partner are caught in a familiar pattern where the same disagreement resurfaces repeatedly.",
        whatMightBeHappening: "In recurring arguments, the topic (dishes, schedule, family) is rarely the core issue. One partner is usually asking 'Do I matter to you?' while the other is asking 'Am I accepted as I am?'",
        whatYouCanDo: "Name the cycle together instead of debating who started it. Agree on a signal to pause when the familiar tension begins.",
        whatYouCouldSay: '"I notice we\'re falling into our usual loop right now. I don\'t want us to fight about this. Can we pause for 20 minutes and come back so we can listen to each other?"',
        whatToWatchFor: "Watch out for words like 'always' and 'never'—they instantly trigger defense mechanisms.",
        followUpQuestion: "What is usually the moment where the conversation turns from a discussion into an argument?"
      },
      suggestedFollowUps: [
        "How do we break the loop once it starts?",
        "Help me explain what I really need underneath this",
        "How do we take a break without feeling like we're quitting?"
      ]
    };
  }

  // 3. Situation: Boundaries
  if (lowerMsg.includes('boundary') || lowerMsg.includes('boundaries') || lowerMsg.includes('harsh') || lowerMsg.includes('space')) {
    return {
      message: "Expressing a healthy boundary is an act of care for the relationship, not a punishment. What is the boundary you need to set, and what makes you worried it might sound harsh?",
      structuredAdvice: {
        whatWeKnow: "You need to establish a clear personal boundary while preserving emotional safety and warmth.",
        whatMightBeHappening: "Boundaries often feel harsh when they focus on policing the other person's behavior ('You can't do that') rather than stating your own capacity ('I am not able to do that').",
        whatYouCanDo: "Frame the boundary around what you need in order to show up with kindness and presence.",
        whatYouCouldSay: '"I love our time together, and I also need 45 minutes of quiet time after work to recharge so I can be fully present with you."',
        whatToWatchFor: "A boundary doesn't require consensus to be valid, but giving advance notice helps your partner adjust without feeling rejected.",
        followUpQuestion: "Would you like to practice delivering this boundary in a gentle or direct tone?"
      },
      suggestedFollowUps: [
        "Give me a gentle version of this boundary",
        "What if my partner takes it personally?",
        "How do I hold the boundary if they push back?"
      ]
    };
  }

  // 4. Situation: Bringing up something difficult
  if (lowerMsg.includes('difficult') || lowerMsg.includes('bring up') || lowerMsg.includes('hard to talk') || lowerMsg.includes('nervous')) {
    return {
      message: "It takes courage to address something uncomfortable. What is the core topic you want to talk about, and what is your biggest hesitation right now?",
      structuredAdvice: {
        whatWeKnow: "You have an important issue to raise and want to do so without triggering defensiveness or conflict.",
        whatMightBeHappening: "When anticipating difficult talks, our minds often rehearse the worst-case reaction. Approaching with curiosity instead of a verdict completely changes the dynamic.",
        whatYouCanDo: "Choose a distraction-free window when neither of you is exhausted or rushed. Start with appreciation before naming the concern.",
        whatYouCouldSay: '"There\'s something on my mind that I\'d really appreciate your thoughts on. I want us to understand each other better—can we sit down for 15 minutes after dinner?"',
        whatToWatchFor: "Don't spring a serious talk while they are multitasking or driving.",
        followUpQuestion: "What is the single most important feeling or thought you want them to understand?"
      },
      suggestedFollowUps: [
        "Help me craft the opening sentence",
        "What should I do if they react defensively?",
        "How do I ask without making them feel blamed?"
      ]
    };
  }

  // Default general thoughtful response
  return {
    message: "I hear you, and it makes complete sense that you want to navigate this thoughtfully. To help you find the most grounded words: how long has this been on your mind, and how has your partner typically responded when you've discussed topics like this in the past?",
    structuredAdvice: {
      whatWeKnow: `You are working through a situation regarding "${message.slice(0, 120)}..." and want practical clarity.`,
      whatMightBeHappening: "In relationship communication, tone and timing often carry more emotional weight than the actual words spoken.",
      whatYouCanDo: "Clarify your own goal first: are you looking to be heard, to ask for a change, or to understand their perspective?",
      whatYouCouldSay: '"I\'ve been thinking about something between us and I want to share it gently with you when you have a moment."',
      whatToWatchFor: "Focus on your own observable experience rather than interpreting their hidden motivations.",
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
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
    return res.status(400).json({ error: 'Please enter a message for Mira.' });
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
          // Count rehearsals + mira messages consumed
          const { count, error: countErr } = await supabaseAdmin
            .from('usage_records')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .in('action_type', ['ai_rehearsal', 'ai_mira']);

          const usageUsed = count || 0;
          if (usageUsed >= 3) {
            return res.status(402).json({
              error: 'Free trial limit reached (3 AI sessions). Upgrade to the Complete Bundle for unlimited access to Mira and Conversation Rehearsals.',
              limitReached: true,
              usageUsed,
              upgradeUrl: '/index.html#bundle'
            });
          }
        }
      }
    } catch (err) {
      console.warn('Auth verification warning in Mira endpoint:', err.message);
    }
  }

  // 2. Real AI Generation via Gemini
  if (AI_API_KEY) {
    try {
      const systemPrompt = `
You are Mira, the Relationship Communication Companion for TryHowWeSpeak.
Your purpose is to help people communicate with greater clarity, emotional safety, and practical understanding with their partner.

CORE PERSONALITY & PRINCIPLES:
- Warm, grounded, mature, and emotionally intelligent.
- Clear and direct without being cold. Curious without interrogating the user.
- Respectful of diverse relationship dynamics and values.
- Practical rather than overly theoretical. Honest about uncertainty.
- Never condescending, clinical, or excessively agreeable.
- Never take sides or blindly validate attacks against an absent partner.
- STRICT SAFETY: Never diagnose either person with psychological labels (e.g. "narcissist", "avoidant personality", "toxic"). Do not pretend to know an absent partner's hidden thoughts.
- If abuse, coercion, or danger is described, prioritize safety and professional human crisis resources.

USER PREFERENCES:
- Communication Preference: ${preferences.communication_preference || 'balanced'}
- Advice Style: ${preferences.advice_style || 'practical'}
- Response Length: ${preferences.response_length || 'moderate'}
- Personal Priorities: ${JSON.stringify(preferences.personal_priorities || [])}
- Approved Relationship Context / Memory: ${JSON.stringify(memories || [])}

CONVERSATION CONTEXT GATHERING:
If the user's situation is ambiguous or missing critical context, ask 1 or 2 thoughtful, relevant questions to understand the situation better before giving long advice.

When the user is seeking advice, wording, or next steps, provide a structured JSON response:
{
  "message": "Mira's conversational response. Empathetic, insightful, and natural.",
  "structuredAdvice": {
    "whatWeKnow": "Objective reflection of the user's situation without inventing facts.",
    "whatMightBeHappening": "Plausible interpretations of the relational dynamic without treating guesses as facts.",
    "whatYouCanDo": "A practical, realistic next action.",
    "whatYouCouldSay": "A grounded, natural example script or phrase.",
    "whatToWatchFor": "A signal or personal boundary to keep in mind.",
    "followUpQuestion": "A thoughtful question to move the conversation forward if helpful."
  },
  "suggestedFollowUps": [
    "3 concise follow-up prompts the user might want to click next"
  ]
}
`;

      const formattedContents = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        ...history.slice(-8).map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        })),
        { role: 'user', parts: [{ text: cleanMessage }] }
      ];

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:generateContent?key=${AI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: formattedContents,
            generationConfig: {
              temperature: 0.35,
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

          // Record usage record in database
          if (userId && supabaseAdmin) {
            await supabaseAdmin.from('usage_records').insert({
              user_id: userId,
              action_type: 'ai_mira',
              tokens_used: 1
            });
          }

          return res.status(200).json(parsed);
        }
      }
    } catch (err) {
      console.warn('Mira Gemini call failed, falling back to structured clinical response:', err.message);
    }
  }

  // 3. Fallback response for dev / offline / test environments
  const fallback = generateMiraClinicalFallback({
    message: cleanMessage,
    history,
    preferences,
    memories
  });

  if (userId && supabaseAdmin) {
    try {
      await supabaseAdmin.from('usage_records').insert({
        user_id: userId,
        action_type: 'ai_mira',
        tokens_used: 1
      });
    } catch (e) {}
  }

  return res.status(200).json(fallback);
}
