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
//   - Real Google Gemini API calls (zero mock fallbacks masking failures)
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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const correlationId = 'mira_edge_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);

  console.log(`[EDGE_MIRA_DIAGNOSTIC][${correlationId}] Stage 1: Request received. method=${req.method}`);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.warn(`[EDGE_MIRA_DIAGNOSTIC][${correlationId}] Missing authorization header.`);
      return new Response(
        JSON.stringify({ error: "Missing authorization header. Please sign in.", correlationId }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const geminiApiKey = (Deno.env.get("GEMINI_API_KEY") || Deno.env.get("AI_API_KEY") || "").trim();
    const geminiModel = Deno.env.get("GEMINI_MODEL") || "gemini-flash-latest";

    // Validate Supabase User
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.warn(`[EDGE_MIRA_DIAGNOSTIC][${correlationId}] Unauthorized user session.`);
      return new Response(
        JSON.stringify({ error: "Unauthorized session. Please sign in again.", correlationId }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[EDGE_MIRA_DIAGNOSTIC][${correlationId}] Stage 2: User authenticated. userId=${user.id}`);

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
        JSON.stringify({ error: "Message content is required.", correlationId }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Verify Usage Entitlements
    const { data: allowanceData } = await supabaseAdmin.rpc("check_user_ai_allowance", {
      check_user_id: user.id,
    });

    if (allowanceData && allowanceData.allowed === false) {
      console.warn(`[EDGE_MIRA_DIAGNOSTIC][${correlationId}] User ${user.id} exceeded daily allowance.`);
      return new Response(
        JSON.stringify({
          error: "Daily AI conversation allowance reached. Upgrade to the Complete Bundle for unlimited access.",
          code: "ALLOWANCE_EXCEEDED",
          upgradeUrl: "https://themindly.gumroad.com/l/howwespeak-bundle",
          correlationId,
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Validate Conversation Ownership
    let validConvId = conversationId;
    if (validConvId && validConvId !== "default" && !validConvId.startsWith("conv-")) {
      const { data: existingConv } = await supabaseAdmin
        .from("mira_conversations")
        .select("id, user_id")
        .eq("id", validConvId)
        .maybeSingle();

      if (existingConv && existingConv.user_id !== user.id) {
        console.error(`[EDGE_MIRA_DIAGNOSTIC][${correlationId}] User ${user.id} attempted to access conversation owned by ${existingConv.user_id}`);
        return new Response(
          JSON.stringify({ error: "Forbidden: You do not own this conversation.", correlationId }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

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

    // 3. Verify Server Secret GEMINI_API_KEY
    if (!geminiApiKey) {
      console.error(`[EDGE_MIRA_DIAGNOSTIC][${correlationId}] GEMINI_API_KEY is missing from Supabase Edge secrets.`);
      return new Response(
        JSON.stringify({
          error: "Mira couldn't connect right now. Your message has not been lost. Please try again.",
          code: "MISSING_GEMINI_API_KEY",
          details: "GEMINI_API_KEY is not set in Supabase Edge Function Secrets.",
          correlationId,
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Build Structured Context & Prompt
    let userContext = `User Tone Preference: ${preferences.communication_preference || "balanced"}\n`;
    userContext += `Advice Style: ${preferences.advice_style || "practical"}\n`;
    userContext += `Response Length: ${preferences.response_length || "moderate"}\n`;

    if (preferences.persistent_memory_enabled && memories.length > 0) {
      userContext += `User-Approved Saved Context:\n- ${memories.slice(0, 5).join("\n- ")}\n`;
    }

    const systemInstructionContent = `${MIRA_SYSTEM_INSTRUCTION}\n\nUSER PREFERENCES & CONTEXT:\n${userContext}`;

    // Normalize turns to guarantee strict user/model alternation
    const rawTurns = [];
    for (const h of history.slice(-6)) {
      if (h.content && typeof h.content === 'string') {
        rawTurns.push({
          role: h.role === "assistant" ? "model" : "user",
          text: h.content.trim()
        });
      }
    }
    rawTurns.push({ role: "user", text: message.trim() });

    const contents = [];
    for (const turn of rawTurns) {
      if (contents.length === 0) {
        contents.push({ role: turn.role, parts: [{ text: turn.text }] });
      } else {
        const prev = contents[contents.length - 1];
        if (prev.role === turn.role) {
          prev.parts[0].text += `\n\n${turn.text}`;
        } else {
          contents.push({ role: turn.role, parts: [{ text: turn.text }] });
        }
      }
    }

    if (contents.length > 0 && contents[0].role === 'model') {
      contents.shift();
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;

    console.log(`[EDGE_MIRA_DIAGNOSTIC][${correlationId}] Stage 3: Calling Google Gemini API model=${geminiModel}`);
    const startGemini = Date.now();

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemInstructionContent }],
        },
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 1500,
          responseMimeType: "application/json",
        },
        contents,
      }),
    });

    const elapsed = Date.now() - startGemini;
    console.log(`[EDGE_MIRA_DIAGNOSTIC][${correlationId}] Stage 4: Gemini responded with status ${response.status} (${elapsed}ms)`);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[EDGE_MIRA_DIAGNOSTIC][${correlationId}] Gemini API error:`, response.status, errText);
      return new Response(
        JSON.stringify({
          error: "Mira couldn't connect right now. Your message has not been lost. Please try again.",
          code: "GEMINI_UPSTREAM_ERROR",
          upstreamStatus: response.status,
          correlationId,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiData = await response.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText || !rawText.trim()) {
      console.error(`[EDGE_MIRA_DIAGNOSTIC][${correlationId}] Gemini returned empty response text.`);
      return new Response(
        JSON.stringify({
          error: "Mira couldn't connect right now. Your message has not been lost. Please try again.",
          code: "EMPTY_GEMINI_RESPONSE",
          correlationId,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
    let aiResult;
    try {
      aiResult = JSON.parse(cleanJson);
    } catch {
      aiResult = {
        message: rawText,
        structuredAdvice: null,
        suggestedFollowUps: []
      };
    }

    // 5. Persist to Supabase Database (both user message and assistant message)
    await supabaseAdmin.from("mira_messages").insert([
      {
        conversation_id: validConvId,
        user_id: user.id,
        role: "user",
        content: message.trim(),
        idempotency_key: idempotencyKey || null,
      },
      {
        conversation_id: validConvId,
        user_id: user.id,
        role: "assistant",
        content: aiResult.message,
        structured_data: aiResult.structuredAdvice || null,
      }
    ]);

    await supabaseAdmin
      .from("mira_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", validConvId);

    await supabaseAdmin.from("usage_records").insert({
      user_id: user.id,
      action_type: "ai_mira",
      tokens_used: 1,
      model_used: geminiModel,
    });

    console.log(`[EDGE_MIRA_DIAGNOSTIC][${correlationId}] Stage 5: Persistence completed for conversation ${validConvId}`);

    return new Response(
      JSON.stringify({
        success: true,
        conversationId: validConvId,
        message: aiResult.message,
        structuredAdvice: aiResult.structuredAdvice,
        suggestedFollowUps: aiResult.suggestedFollowUps || [],
        correlationId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error(`[EDGE_MIRA_DIAGNOSTIC][${correlationId}] Execution error:`, error);
    return new Response(
      JSON.stringify({
        error: "Mira couldn't connect right now. Your message has not been lost. Please try again.",
        code: "INTERNAL_ERROR",
        correlationId,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
