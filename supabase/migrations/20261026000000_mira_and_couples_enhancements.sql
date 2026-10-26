-- ==============================================================================
-- HOW WE SPEAK — MIRA AI COMPANION, SCRIPTS, AND COUPLES ENHANCEMENTS
-- Migration: 20261026000000_mira_and_couples_enhancements.sql
-- Description: Creates tables for Mira conversations, messages, preferences,
--              consent-based memory, script favorites, and shared couples sessions
--              with strict Row Level Security (RLS) policies.
-- ==============================================================================

-- ── 1. MIRA CONVERSATIONS TABLE ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mira_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Conversation',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_mira_conversations_user ON public.mira_conversations(user_id);

ALTER TABLE public.mira_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own Mira conversations"
    ON public.mira_conversations
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ── 2. MIRA MESSAGES TABLE ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mira_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.mira_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    structured_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_mira_messages_conv ON public.mira_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_mira_messages_user ON public.mira_messages(user_id);

ALTER TABLE public.mira_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own Mira messages"
    ON public.mira_messages
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ── 3. MIRA PREFERENCES TABLE ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mira_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    communication_preference TEXT NOT NULL DEFAULT 'balanced' CHECK (communication_preference IN ('gentle', 'balanced', 'direct')),
    advice_style TEXT NOT NULL DEFAULT 'practical' CHECK (advice_style IN ('listen', 'practical', 'words', 'challenge', 'both-perspectives')),
    response_length TEXT NOT NULL DEFAULT 'moderate' CHECK (response_length IN ('short', 'moderate', 'detailed')),
    personal_priorities JSONB NOT NULL DEFAULT '[]'::jsonb,
    custom_priority TEXT,
    persistent_memory_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_mira_preferences_user ON public.mira_preferences(user_id);

ALTER TABLE public.mira_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own Mira preferences"
    ON public.mira_preferences
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ── 4. MIRA MEMORIES TABLE (CONSENT-BASED) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mira_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT 'relationship_context',
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_mira_memories_user ON public.mira_memories(user_id);

ALTER TABLE public.mira_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own Mira memories"
    ON public.mira_memories
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ── 5. SCRIPT FAVORITES TABLE ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.script_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    script_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_script UNIQUE (user_id, script_id)
);

CREATE INDEX IF NOT EXISTS idx_script_favorites_user ON public.script_favorites(user_id);

ALTER TABLE public.script_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their script favorites"
    ON public.script_favorites
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ── 6. SHARED COUPLE SESSIONS TABLE ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shared_couple_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.couples_spaces(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    partner_1_perspective TEXT,
    partner_1_shared BOOLEAN NOT NULL DEFAULT false,
    partner_2_perspective TEXT,
    partner_2_shared BOOLEAN NOT NULL DEFAULT false,
    mira_assistance_requested BOOLEAN NOT NULL DEFAULT false,
    mira_suggestion TEXT,
    agreed_next_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_shared_sessions_space ON public.shared_couple_sessions(space_id);

ALTER TABLE public.shared_couple_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can read and update shared sessions in their space"
    ON public.shared_couple_sessions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.couples_spaces
            WHERE public.couples_spaces.id = shared_couple_sessions.space_id
              AND (public.couples_spaces.partner_1_id = auth.uid() OR public.couples_spaces.partner_2_id = auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.couples_spaces
            WHERE public.couples_spaces.id = shared_couple_sessions.space_id
              AND (public.couples_spaces.partner_1_id = auth.uid() OR public.couples_spaces.partner_2_id = auth.uid())
        )
    );

-- ── 7. COUPLE MIRA SETTINGS TABLE ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.couple_mira_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL UNIQUE REFERENCES public.couples_spaces(id) ON DELETE CASCADE,
    individual_prefs JSONB NOT NULL DEFAULT '{}'::jsonb,
    joint_rules JSONB NOT NULL DEFAULT '{"no_blaming": true, "no_taking_sides": true, "reflect_both": true, "realistic_actions": true, "avoid_clinical_jargon": true}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_couple_mira_settings_space ON public.couple_mira_settings(space_id);

ALTER TABLE public.couple_mira_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can read and update couple Mira settings in their space"
    ON public.couple_mira_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.couples_spaces
            WHERE public.couples_spaces.id = couple_mira_settings.space_id
              AND (public.couples_spaces.partner_1_id = auth.uid() OR public.couples_spaces.partner_2_id = auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.couples_spaces
            WHERE public.couples_spaces.id = couple_mira_settings.space_id
              AND (public.couples_spaces.partner_1_id = auth.uid() OR public.couples_spaces.partner_2_id = auth.uid())
        )
    );
