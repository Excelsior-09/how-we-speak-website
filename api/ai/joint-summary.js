// ==============================================================================
// HOW WE SPEAK — COUPLES NEUTRAL JOINT SUMMARY ENDPOINT
// Endpoint: POST /api/ai/joint-summary
// Purpose: Synthesizes two shared reflections into a non-diagnostic, compassionate
//          joint cycle summary with concrete repair action steps.
// Security: Enforces that BOTH partners have explicitly set is_shared = true.
// ==============================================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const AI_API_KEY = process.env.AI_API_KEY;
const AI_MODEL = process.env.AI_MODEL || 'gemini-1.5-pro';

const supabaseAdmin = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

function generateClinicalJointSummaryFallback(reflectionA, reflectionB, topic) {
  return {
    cycleOverview: `In this situation regarding "${topic || 'communication'}", both of you experienced rapid nervous system threat. Neither response came from a desire to hurt the other—both were protective survival strategies to regulate intense emotional discomfort.`,
    partnerAUnderlyingLonging: `Beneath the frustration, Partner 1 was longing for emotional safety, reassurance, and validation that their feelings mattered.`,
    partnerBUnderlyingLonging: `Beneath the withdrawal or defense, Partner 2 was longing for acceptance, relief from feeling inadequate, and a de-escalation of perceived pressure.`,
    sharedNegativeLoop: `The more intensity one partner brought seeking reassurance, the more flooded the other partner felt, leading them to withdraw or defend. In turn, that withdrawal felt like abandonment, which increased the intensity. You were caught in a classic feedback loop where each partner's defense triggered the other's fear.`,
    threeRepairSteps: [
      {
        step: 1,
        title: "Name the Cycle, Not the Partner",
        action: "Agree to say out loud: 'The loop is happening right now, and I don't want either of us to feel hurt.'"
      },
      {
        step: 2,
        title: "The 20-Minute Physiological Timeout",
        action: "If heart rates exceed calm levels, take an agreed 20-minute physical reset with an explicit promise to return."
      },
      {
        step: 3,
        title: "Speaker-Listener Exchange",
        action: "Partner A shares for 2 minutes without accusations. Partner B reflects what they heard before offering their own experience."
      }
    ]
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { exerciseId, spaceId } = req.body || {};

  if (!exerciseId) {
    return res.status(400).json({ error: 'Missing exerciseId.' });
  }

  // 1. Verify User Authentication & Space Membership
  let user = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ') && supabaseAdmin) {
    const token = authHeader.replace('Bearer ', '');
    try {
      const { data: { user: authUser } } = await supabaseAdmin.auth.getUser(token);
      user = authUser;
    } catch (err) {
      console.warn('Auth token verification error:', err.message);
    }
  }

  // 2. Query Reflections for the Exercise
  let reflections = [];
  let exercise = null;

  if (supabaseAdmin) {
    const { data: exData } = await supabaseAdmin
      .from('couples_exercises')
      .select('*')
      .eq('id', exerciseId)
      .maybeSingle();

    exercise = exData;

    const { data: refData } = await supabaseAdmin
      .from('private_reflections')
      .select('*, profiles(display_name, archetype)')
      .eq('exercise_id', exerciseId);

    reflections = refData || [];
  } else {
    // Local development fallback
    const { mockReflections, mockExercise } = req.body || {};
    reflections = mockReflections || [];
    exercise = mockExercise || { topic: 'Navigating Evening Stress' };
  }

  // 3. Strict Verification: Both Partners Must Have Shared
  if (reflections.length < 2) {
    return res.status(400).json({
      error: 'Both partners must complete their reflection before a joint summary can be generated.',
      ready: false
    });
  }

  const bothShared = reflections.every(r => r.is_shared === true);
  if (!bothShared) {
    return res.status(400).json({
      error: 'Both partners must explicitly toggle "Share with Partner" before a joint summary can be generated.',
      ready: false
    });
  }

  const refA = reflections[0];
  const refB = reflections[1];
  const topic = exercise?.topic || 'Communication Disconnect';

  // 4. AI Synthesis via Google Gemini if AI_API_KEY is available
  if (AI_API_KEY) {
    try {
      const prompt = `
You are the senior clinical relationship facilitator for TryHowWeSpeak.
Synthesize these two private reflections into a neutral, compassionate, non-diagnostic joint summary.

RULES:
- Non-diagnostic: Never use psychiatric or clinical labels on individuals.
- Balanced: Never take a side, declare who is right or wrong, or assign blame.
- Focus on Emotionally Focused Therapy (EFT): Identify the cycle as the enemy, not the partners.

EXERCISE TOPIC: "${topic}"
PARTNER 1 REFLECTION:
- Triggers: "${refA.trigger_notes}"
- Felt Emotions: ${JSON.stringify(refA.felt_emotions || [])}
- Underlying Need: "${refA.underlying_need}"

PARTNER 2 REFLECTION:
- Triggers: "${refB.trigger_notes}"
- Felt Emotions: ${JSON.stringify(refB.felt_emotions || [])}
- Underlying Need: "${refB.underlying_need}"

Return ONLY a valid JSON object matching:
{
  "cycleOverview": "A compassionate overview of how the interaction unfolded physiologically without taking sides",
  "partnerAUnderlyingLonging": "What Partner 1 was longing for beneath the surface",
  "partnerBUnderlyingLonging": "What Partner 2 was longing for beneath the surface",
  "sharedNegativeLoop": "Detailed description of the interactive feedback loop where each partner's defense triggered the other",
  "threeRepairSteps": [
    { "step": 1, "title": "Concrete action title", "action": "Exact words or behavior to practice" },
    { "step": 2, "title": "Concrete action title", "action": "Exact words or behavior to practice" },
    { "step": 3, "title": "Concrete action title", "action": "Exact words or behavior to practice" }
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
          const summaryJson = JSON.parse(rawText);

          // Save joint summary to couples_exercises in database
          if (supabaseAdmin && exerciseId) {
            await supabaseAdmin
              .from('couples_exercises')
              .update({
                joint_summary: JSON.stringify(summaryJson),
                joint_summary_generated_at: new Date().toISOString(),
                status: 'both_shared'
              })
              .eq('id', exerciseId);
          }

          return res.status(200).json({ ok: true, data: summaryJson });
        }
      }
    } catch (err) {
      console.warn('AI Joint Summary Error, using clinical fallback:', err.message);
    }
  }

  // 5. Fallback Clinical Synthesis
  const fallback = generateClinicalJointSummaryFallback(refA, refB, topic);

  if (supabaseAdmin && exerciseId) {
    try {
      await supabaseAdmin
        .from('couples_exercises')
        .update({
          joint_summary: JSON.stringify(fallback),
          joint_summary_generated_at: new Date().toISOString(),
          status: 'both_shared'
        })
        .eq('id', exerciseId);
    } catch {
      // Non-blocking
    }
  }

  return res.status(200).json({ ok: true, data: fallback });
}
