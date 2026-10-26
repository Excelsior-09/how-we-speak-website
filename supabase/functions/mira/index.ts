// ==============================================================================
// HOW WE SPEAK — SUPABASE EDGE FUNCTION: MIRA AI COMPANION
// Path: supabase/functions/mira/index.ts
//
// Purpose: Secure server-side AI integration for Mira Relationship Companion.
// Security:
//   - Zero frontend exposure of GEMINI_API_KEY
//   - Strict Supabase JWT validation & conversation ownership enforcement
//   - Server-side entitlement & rate-limit check
//   - Model: gemini-flash-latest
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MIRA_SYSTEM_INSTRUCTION = `You are Mira, the Relationship Communication Companion inside TryHowWeSpeak.
Your purpose is to help people understand difficult relationship situations, express their feelings clearly, communicate boundaries, prepare for important conversations, repair misunderstandings, and identify realistic next steps.
You are not a generic chatbot. You are a practical, thoughtful communication guide.
Help users move from confusion to clarity, from emotional reactions to considered choices, and from vague concerns to specific, respectful actions.

CLINICAL CORE PRINCIPLES:
1. Warmth, calm, emotional intelligence, and non-judgmental stance.
2. Emotional De-escalation First: Acknowledge felt reality before offering solutions.
3. Two Perspectives: Every relationship dynamic has two valid internal experiences.
4. NVC Structure: Observations without evaluation, Feelings without blame, Underlying Needs, Clear & Doable Requests.
5. Concrete Scripting: Provide word-for-word, gentle, clear phrases users can say or text.
6. Safety Boundary: If domestic abuse, coercive control, or severe danger is detected, prioritize safety and provide professional resources immediately.

RESPONSE STRUCTURE (Respond in valid JSON with these fields):
{
  "message": "Your conversational, warm, empathetic coaching response directly answering the user.",
  "structuredAdvice": {
    "whatWeKnow": "Concise neutral reflection of the situation.",
    "whatMightBeHappening": "Empathetic insight into possible nervous system or emotional dynamics.",
    "whatYouCanDo": "1-2 practical preparation steps.",
    "whatYouCouldSay": "A word-for-word example script in quotation marks.",
    "whatToWatchFor": "Common pitfall to avoid (e.g. defensiveness, 'always/never').",
    "followUpQuestion": "One thoughtful question to explore next."
  },
  "suggestedFollowUps": [
    "Follow-up option 1",
    "Follow-up option 2",
    "Follow-up option 3"
  ]
}`;

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header. Please sign in." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("AI_API_KEY") || "";
    const geminiModel = Deno.env.get("GEMINI_MODEL") || "gemini-flash-latest";

    // Create user-authenticated client
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized session. Please sign in again." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const {
      message,
      conversationId,
      history = [],
      preferences = {},
      memories = [],
      idempotencyKey
    } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return new Response(
        JSON.stringify({ error: "Message content is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Server-side admin client for authorization and rate enforcement
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Verify Usage Entitlements
    const { data: allowanceData } = await supabaseAdmin.rpc("check_user_ai_allowance", {
      check_user_id: user.id,
    });

    if (allowanceData && allowanceData.allowed === false) {
      return new Response(
        JSON.stringify({
          error: "Daily AI conversation allowance reached. Upgrade to the Complete Bundle for unlimited access.",
          code: "ALLOWANCE_EXCEEDED",
          upgradeUrl: "https://themindly.gumroad.com/l/howwespeak-bundle",
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Validate or Create Conversation Record
    let validConvId = conversationId;
    if (validConvId && validConvId !== "default" && !validConvId.startsWith("conv-")) {
      const { data: existingConv } = await supabaseAdmin
        .from("mira_conversations")
        .select("id, user_id")
        .eq("id", validConvId)
        .maybeSingle();

      if (existingConv && existingConv.user_id !== user.id) {
        return new Response(
          JSON.stringify({ error: "Forbidden: You do not own this conversation." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Create or retrieve conversation
    if (!validConvId || validConvId === "default" || validConvId.startsWith("conv-")) {
      const shortTitle = message.trim().slice(0, 36) + (message.trim().length > 36 ? "..." : "");
      const { data: newConv } = await supabaseAdmin
        .from("mira_conversations")
        .insert({
          user_id: user.id,
          title: shortTitle,
          conversation_type: "general",
          status: "active",
        })
        .select("id")
        .single();

      if (newConv) {
        validConvId = newConv.id;
      }
    }

    // 3. Save User Message
    const userMessagePayload = {
      conversation_id: validConvId,
      user_id: user.id,
      role: "user",
      content: message.trim(),
      idempotency_key: idempotencyKey || null,
    };

    await supabaseAdmin.from("mira_messages").insert(userMessagePayload);

    // 4. Construct AI System Prompt Context
    let userContext = `User Tone Preference: ${preferences.communication_preference || "balanced"}\n`;
    userContext += `Advice Style: ${preferences.advice_style || "practical"}\n`;
    userContext += `Response Length: ${preferences.response_length || "moderate"}\n`;

    if (preferences.persistent_memory_enabled && memories.length > 0) {
      userContext += `User-Approved Saved Context (use gently):\n- ${memories.slice(0, 5).join("\n- ")}\n`;
    }

    let aiResult;

    // 5. Call Google Gemini API
    if (geminiApiKey) {
      const systemInstructionContent = `${MIRA_SYSTEM_INSTRUCTION}\n\nUSER PREFERENCES & CONTEXT:\n${userContext}`;
      
      const contents = [];
      // Append sanitized recent history
      for (const h of history.slice(-6)) {
        contents.push({
          role: h.role === "assistant" ? "model" : "user",
          parts: [{ text: h.content }],
        });
      }
      contents.push({
        role: "user",
        parts: [{ text: message.trim() }],
      });

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;

      const response = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstructionContent }],
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1200,
            responseMimeType: "application/json",
          },
          contents,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Gemini API error:", response.status, errText);
        throw new Error(`Gemini Provider Error: ${response.status}`);
      }

      const geminiData = await response.json();
      const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

      try {
        aiResult = JSON.parse(rawText);
      } catch {
        aiResult = {
          message: rawText || "I'm listening and here to support you. Let's work through this together.",
          structuredAdvice: null,
          suggestedFollowUps: ["Help me find the right words", "What should I ask my partner?"]
        };
      }
    } else {
      // Safe fallback when GEMINI_API_KEY is not yet deployed in Edge secrets
      aiResult = {
        message: "I hear you. When conversations get difficult, it helps to pause and focus on what you both need rather than what went wrong. What outcome would feel like progress for you?",
        structuredAdvice: {
          whatWeKnow: "You are navigating a sensitive moment with your partner.",
          whatMightBeHappening: "Underlying emotional fatigue often causes conversations to feel heavier than intended.",
          whatYouCanDo: "Take a breath, choose one specific point to address, and ask for a time when you are both rested.",
          whatYouCouldSay: '"I want us to feel good talking through this. Can we check in when we have 15 quiet minutes?"',
          whatToWatchFor: "Avoid bringing up multiple past issues at the same time.",
          followUpQuestion: "Would you like help preparing a gentle opening phrase?"
        },
        suggestedFollowUps: [
          "Help me phrase a gentle opening",
          "What if my partner shuts down?",
          "How do I express what I need calmly?"
        ]
      };
    }

    // 6. Save Assistant Response to mira_messages
    const assistantMessagePayload = {
      conversation_id: validConvId,
      user_id: user.id,
      role: "assistant",
      content: aiResult.message,
      structured_data: aiResult.structuredAdvice,
    };

    const { data: savedAssistantMsg } = await supabaseAdmin
      .from("mira_messages")
      .insert(assistantMessagePayload)
      .select("id, created_at")
      .single();

    // 7. Update conversation timestamp
    await supabaseAdmin
      .from("mira_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", validConvId);

    // 8. Record AI Usage Audit
    await supabaseAdmin.from("usage_records").insert({
      user_id: user.id,
      action_type: "ai_mira",
      tokens_used: 1,
      model_used: geminiModel,
    });

    return new Response(
      JSON.stringify({
        success: true,
        conversationId: validConvId,
        message: aiResult.message,
        structuredAdvice: aiResult.structuredAdvice,
        suggestedFollowUps: aiResult.suggestedFollowUps || [],
        messageId: savedAssistantMsg?.id,
        createdAt: savedAssistantMsg?.created_at,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Edge function execution error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "An unexpected error occurred while communicating with Mira.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
