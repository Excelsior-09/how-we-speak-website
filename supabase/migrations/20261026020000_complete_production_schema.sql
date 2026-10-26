-- ==============================================================================
-- TRYHOWWESPEAK — COMPLETE PRODUCTION SUPABASE DATABASE SCHEMA
-- Migration: 20261026020000_complete_production_schema.sql
-- Standalone Setup File: supabase/COMPLETE_DATABASE_SETUP.sql
--
-- Features:
--   1. Profiles, Onboarding & Conflict Archetypes
--   2. Mira AI Preferences, Conversations, Messages, & Consent-Based Memory
--   3. 130 Communication Scripts & User Favorites
--   4. Couples Spaces, Cryptographic Invitations & Shared Sessions
--   5. Individual Rehearsal Plans & Private Emotional Reflections
--   6. Gumroad Digital Entitlements & Rate-Limited AI Usage Records
--   7. Product Catalog for Storefront & Ebooks
--   8. Zero-Leak Row Level Security (RLS) on all 16 exposed tables
--   9. Safe Idempotent Triggers (handle_new_user, accept_couples_invitation, delete_user_account)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. PROFILES TABLE ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    archetype TEXT NOT NULL DEFAULT 'Avoider',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS archetype TEXT NOT NULL DEFAULT 'Avoider';

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ── 2. MIRA PREFERENCES TABLE ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mira_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    communication_preference TEXT NOT NULL DEFAULT 'balanced' CHECK (communication_preference IN ('gentle', 'balanced', 'direct')),
    communication_tone TEXT NOT NULL DEFAULT 'balanced',
    advice_style TEXT NOT NULL DEFAULT 'practical' CHECK (advice_style IN ('listen', 'practical', 'words', 'challenge', 'both-perspectives')),
    guidance_level TEXT NOT NULL DEFAULT 'practical',
    response_length TEXT NOT NULL DEFAULT 'moderate' CHECK (response_length IN ('short', 'moderate', 'detailed')),
    personal_priorities JSONB NOT NULL DEFAULT '[]'::jsonb,
    relationship_goals JSONB NOT NULL DEFAULT '[]'::jsonb,
    onboarding_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    custom_priority TEXT,
    persistent_memory_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.mira_preferences
    ADD COLUMN IF NOT EXISTS communication_tone TEXT NOT NULL DEFAULT 'balanced',
    ADD COLUMN IF NOT EXISTS guidance_level TEXT NOT NULL DEFAULT 'practical',
    ADD COLUMN IF NOT EXISTS relationship_goals JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS onboarding_preferences JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_mira_preferences_user ON public.mira_preferences(user_id);

-- ── 3. MIRA CONVERSATIONS TABLE ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mira_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Conversation',
    conversation_type TEXT NOT NULL DEFAULT 'general' CHECK (conversation_type IN ('general', 'practice', 'repair', 'boundary', 'partner')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.mira_conversations
    ADD COLUMN IF NOT EXISTS conversation_type TEXT NOT NULL DEFAULT 'general',
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_mira_conversations_user ON public.mira_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_mira_conversations_user_updated ON public.mira_conversations(user_id, updated_at DESC);

-- ── 4. MIRA MESSAGES TABLE ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mira_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.mira_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    structured_data JSONB,
    idempotency_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.mira_messages
    ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
    ADD COLUMN IF NOT EXISTS structured_data JSONB;

CREATE INDEX IF NOT EXISTS idx_mira_messages_conv ON public.mira_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_mira_messages_user ON public.mira_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_mira_messages_idempotency ON public.mira_messages(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_mira_messages_created ON public.mira_messages(conversation_id, created_at ASC);

-- ── 5. MIRA MEMORIES TABLE (TRANSPARENT, CONSENT-BASED) ───────────────────────
CREATE TABLE IF NOT EXISTS public.mira_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT 'relationship_context',
    content TEXT NOT NULL,
    consent_granted BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.mira_memories
    ADD COLUMN IF NOT EXISTS consent_granted BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_mira_memories_user ON public.mira_memories(user_id);

-- ── 6. COMMUNICATION SCRIPTS TABLE ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.communication_scripts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    category_name TEXT NOT NULL,
    situation TEXT NOT NULL,
    communication_goal TEXT NOT NULL,
    main_script TEXT NOT NULL,
    why_it_works TEXT NOT NULL,
    softer_version TEXT,
    direct_version TEXT,
    personalization_advice TEXT,
    search_tags TEXT[] NOT NULL DEFAULT '{}'::text[],
    tone TEXT NOT NULL DEFAULT 'balanced',
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_scripts_category ON public.communication_scripts(category);
CREATE INDEX IF NOT EXISTS idx_scripts_tone ON public.communication_scripts(tone);
CREATE INDEX IF NOT EXISTS idx_scripts_published ON public.communication_scripts(is_published);

-- ── 7. SCRIPT FAVORITES TABLE ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.script_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    script_id TEXT NOT NULL REFERENCES public.communication_scripts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_script UNIQUE (user_id, script_id)
);

CREATE INDEX IF NOT EXISTS idx_script_favorites_user ON public.script_favorites(user_id);

-- ── 8. COUPLES SPACES TABLE ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.couples_spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    partner_2_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending_pair' CHECK (status IN ('pending_pair', 'active', 'unlinked')),
    room_name TEXT NOT NULL DEFAULT 'Our Communication Room',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_couples_spaces_partner1 ON public.couples_spaces(partner_1_id);
CREATE INDEX IF NOT EXISTS idx_couples_spaces_partner2 ON public.couples_spaces(partner_2_id);

-- ── 9. WORKSPACE INVITATIONS TABLE ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workspace_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.couples_spaces(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    invitee_email TEXT,
    token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '7 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    accepted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.workspace_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_space_id ON public.workspace_invitations(space_id);

-- ── 10. SHARED COUPLE SESSIONS TABLE ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shared_couple_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.couples_spaces(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    session_type TEXT NOT NULL DEFAULT 'guided_reflection',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    partner_1_perspective TEXT,
    partner_1_shared BOOLEAN NOT NULL DEFAULT false,
    partner_2_perspective TEXT,
    partner_2_shared BOOLEAN NOT NULL DEFAULT false,
    mira_assistance_requested BOOLEAN NOT NULL DEFAULT false,
    mira_suggestion TEXT,
    summary TEXT,
    agreed_next_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_shared_sessions_space ON public.shared_couple_sessions(space_id);

-- ── 11. COUPLE MIRA SETTINGS TABLE ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.couple_mira_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL UNIQUE REFERENCES public.couples_spaces(id) ON DELETE CASCADE,
    individual_prefs JSONB NOT NULL DEFAULT '{}'::jsonb,
    joint_rules JSONB NOT NULL DEFAULT '{"no_blaming": true, "no_taking_sides": true, "reflect_both": true, "realistic_actions": true, "avoid_clinical_jargon": true}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_couple_mira_settings_space ON public.couple_mira_settings(space_id);

-- ── 12. REHEARSAL PLANS TABLE (INDIVIDUAL CONVERSATIONS) ─────────────────────
CREATE TABLE IF NOT EXISTS public.rehearsal_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    situation_raw TEXT NOT NULL,
    situation_category TEXT NOT NULL DEFAULT 'other',
    communication_goal TEXT NOT NULL,
    selected_tone TEXT NOT NULL,
    communication_method TEXT NOT NULL DEFAULT 'face-to-face',
    additional_context TEXT,
    chosen_script TEXT NOT NULL,
    nervous_system_insight TEXT,
    structured_result JSONB NOT NULL DEFAULT '{}'::jsonb,
    custom_edits JSONB NOT NULL DEFAULT '{}'::jsonb,
    practice_followups JSONB NOT NULL DEFAULT '[]'::jsonb,
    action_reminders JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_rehearsal_plans_user ON public.rehearsal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_rehearsal_plans_user_created ON public.rehearsal_plans(user_id, created_at DESC);

-- ── 13. COUPLES EXERCISES & PRIVATE REFLECTIONS TABLE ────────────────────────
CREATE TABLE IF NOT EXISTS public.couples_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.couples_spaces(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'both_shared', 'completed')),
    joint_summary TEXT,
    joint_summary_generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_couples_exercises_space ON public.couples_exercises(space_id);

CREATE TABLE IF NOT EXISTS public.private_reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id UUID NOT NULL REFERENCES public.couples_exercises(id) ON DELETE CASCADE,
    space_id UUID NOT NULL REFERENCES public.couples_spaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    trigger_notes TEXT NOT NULL,
    felt_emotions JSONB NOT NULL DEFAULT '[]'::jsonb,
    underlying_need TEXT NOT NULL,
    hopes_for_conversation TEXT,
    is_shared BOOLEAN NOT NULL DEFAULT false,
    shared_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_exercise_user UNIQUE (exercise_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_private_reflections_exercise ON public.private_reflections(exercise_id);
CREATE INDEX IF NOT EXISTS idx_private_reflections_user ON public.private_reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_private_reflections_space ON public.private_reflections(space_id);

-- ── 14. ENTITLEMENTS TABLE (GUMROAD ACCESS CONTROL) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.entitlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    customer_email TEXT NOT NULL,
    product_key TEXT NOT NULL CHECK (product_key IN ('trial', 'men-edition', 'women-edition', 'bundle', 'script-collection', 'sex-talk', 'workspace-pro')),
    source TEXT NOT NULL DEFAULT 'gumroad' CHECK (source IN ('gumroad', 'system_trial', 'admin', 'stripe')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'refunded', 'revoked')),
    daily_ai_limit INTEGER NOT NULL DEFAULT 10,
    monthly_ai_limit INTEGER NOT NULL DEFAULT 100,
    valid_until TIMESTAMPTZ,
    gumroad_sale_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.entitlements
    ADD COLUMN IF NOT EXISTS daily_ai_limit INTEGER NOT NULL DEFAULT 10,
    ADD COLUMN IF NOT EXISTS monthly_ai_limit INTEGER NOT NULL DEFAULT 100;

CREATE INDEX IF NOT EXISTS idx_entitlements_user ON public.entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_email ON public.entitlements(customer_email);
CREATE INDEX IF NOT EXISTS idx_entitlements_sale ON public.entitlements(gumroad_sale_id);

-- ── 15. USAGE RECORDS TABLE (RATE LIMITS & SECURITY AUDIT) ───────────────────
CREATE TABLE IF NOT EXISTS public.usage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('ai_rehearsal', 'ai_followup', 'ai_joint_summary', 'ai_mira')),
    tokens_used INTEGER NOT NULL DEFAULT 0,
    model_used TEXT NOT NULL DEFAULT 'gemini-flash-latest',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.usage_records
    ADD COLUMN IF NOT EXISTS model_used TEXT NOT NULL DEFAULT 'gemini-flash-latest';

CREATE INDEX IF NOT EXISTS idx_usage_records_user_created ON public.usage_records(user_id, created_at DESC);

-- ── 16. PRODUCT CATALOG TABLE ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_catalog (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    was_price NUMERIC,
    currency TEXT NOT NULL DEFAULT 'USD',
    gumroad_url TEXT NOT NULL,
    cover_image TEXT,
    category TEXT NOT NULL DEFAULT 'guide',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_product_catalog_active ON public.product_catalog(is_active);

-- ── 17. DATABASE FUNCTIONS & PROCEDURES ───────────────────────────────────────

-- 17.1 Automatic Profile & Preferences Provisioning
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_display_name TEXT;
    v_archetype TEXT;
BEGIN
    v_display_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );
    v_archetype := COALESCE(NEW.raw_user_meta_data->>'archetype', 'Avoider');

    -- Insert Profile
    INSERT INTO public.profiles (id, email, display_name, archetype, onboarding_completed)
    VALUES (NEW.id, NEW.email, v_display_name, v_archetype, false)
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
        updated_at = timezone('utc'::text, now());

    -- Provision Default Mira Preferences
    INSERT INTO public.mira_preferences (user_id, communication_preference, advice_style, response_length)
    VALUES (NEW.id, 'balanced', 'practical', 'moderate')
    ON CONFLICT (user_id) DO NOTHING;

    -- Provision Initial Trial Entitlement
    INSERT INTO public.entitlements (user_id, customer_email, product_key, source, status, daily_ai_limit, monthly_ai_limit)
    VALUES (NEW.id, NEW.email, 'trial', 'system_trial', 'active', 10, 100)
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 17.2 Secure Invitation Acceptance
CREATE OR REPLACE FUNCTION public.accept_couples_invitation(invite_token TEXT)
RETURNS UUID AS $$
DECLARE
    v_invitation RECORD;
    v_current_user_id UUID;
BEGIN
    v_current_user_id := auth.uid();
    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to accept invitations.';
    END IF;

    SELECT * INTO v_invitation
    FROM public.workspace_invitations
    WHERE token = invite_token
      AND status = 'pending'
      AND expires_at > timezone('utc'::text, now());

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid, expired, or previously accepted invitation code.';
    END IF;

    IF v_invitation.inviter_id = v_current_user_id THEN
        RAISE EXCEPTION 'You cannot accept your own invitation.';
    END IF;

    UPDATE public.couples_spaces
    SET partner_2_id = v_current_user_id,
        status = 'active',
        updated_at = timezone('utc'::text, now())
    WHERE id = v_invitation.space_id;

    UPDATE public.workspace_invitations
    SET status = 'accepted',
        accepted_at = timezone('utc'::text, now())
    WHERE id = v_invitation.id;

    RETURN v_invitation.space_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 17.3 AI Usage Allowance Verification
CREATE OR REPLACE FUNCTION public.check_user_ai_allowance(check_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_has_bundle BOOLEAN;
    v_today_count INTEGER;
    v_month_count INTEGER;
    v_daily_limit INTEGER := 10;
    v_monthly_limit INTEGER := 100;
BEGIN
    -- Check if user owns unlimited bundle or workspace pro
    SELECT EXISTS (
        SELECT 1 FROM public.entitlements
        WHERE user_id = check_user_id
          AND status = 'active'
          AND product_key IN ('bundle', 'workspace-pro')
    ) INTO v_has_bundle;

    IF v_has_bundle THEN
        RETURN jsonb_build_object(
            'allowed', true,
            'is_unlimited', true,
            'plan_tier', 'bundle',
            'remaining_today', 9999
        );
    END IF;

    -- Count today''s usage
    SELECT count(*) INTO v_today_count
    FROM public.usage_records
    WHERE user_id = check_user_id
      AND created_at >= date_trunc('day', timezone('utc'::text, now()));

    -- Count this month''s usage
    SELECT count(*) INTO v_month_count
    FROM public.usage_records
    WHERE user_id = check_user_id
      AND created_at >= date_trunc('month', timezone('utc'::text, now()));

    IF v_today_count >= v_daily_limit OR v_month_count >= v_monthly_limit THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'is_unlimited', false,
            'plan_tier', 'trial',
            'today_count', v_today_count,
            'daily_limit', v_daily_limit,
            'remaining_today', 0
        );
    END IF;

    RETURN jsonb_build_object(
        'allowed', true,
        'is_unlimited', false,
        'plan_tier', 'trial',
        'today_count', v_today_count,
        'daily_limit', v_daily_limit,
        'remaining_today', (v_daily_limit - v_today_count)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 17.4 Complete User Account Deletion & Cleanup
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required for account deletion.';
    END IF;

    -- Unlink or update shared couples spaces
    -- If user is partner_2, unbind partner_2
    UPDATE public.couples_spaces
    SET partner_2_id = NULL,
        status = 'pending_pair',
        updated_at = timezone('utc'::text, now())
    WHERE partner_2_id = v_user_id;

    -- If user is partner_1 and partner_2 exists, transfer to partner_2
    UPDATE public.couples_spaces
    SET partner_1_id = partner_2_id,
        partner_2_id = NULL,
        status = 'pending_pair',
        updated_at = timezone('utc'::text, now())
    WHERE partner_1_id = v_user_id AND partner_2_id IS NOT NULL;

    -- Delete couples spaces where user was sole partner
    DELETE FROM public.couples_spaces
    WHERE partner_1_id = v_user_id AND partner_2_id IS NULL;

    -- Delete private reflections
    DELETE FROM public.private_reflections WHERE user_id = v_user_id;

    -- Delete individual rehearsal plans
    DELETE FROM public.rehearsal_plans WHERE user_id = v_user_id;

    -- Delete Mira messages, conversations, memories, and preferences
    DELETE FROM public.mira_messages WHERE user_id = v_user_id;
    DELETE FROM public.mira_conversations WHERE user_id = v_user_id;
    DELETE FROM public.mira_memories WHERE user_id = v_user_id;
    DELETE FROM public.mira_preferences WHERE user_id = v_user_id;

    -- Delete script favorites
    DELETE FROM public.script_favorites WHERE user_id = v_user_id;

    -- Delete usage records
    DELETE FROM public.usage_records WHERE user_id = v_user_id;

    -- Delete profile
    DELETE FROM public.profiles WHERE id = v_user_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 18. ROW LEVEL SECURITY (RLS) POLICIES ─────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mira_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mira_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mira_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mira_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.script_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_couple_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_mira_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rehearsal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_catalog ENABLE ROW LEVEL SECURITY;

-- 18.1 PROFILES POLICIES
DROP POLICY IF EXISTS "profiles_select_own_or_partner" ON public.profiles;
CREATE POLICY "profiles_select_own_or_partner" ON public.profiles
    FOR SELECT TO authenticated
    USING (
        id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.couples_spaces cs
            WHERE (cs.partner_1_id = auth.uid() AND cs.partner_2_id = public.profiles.id)
               OR (cs.partner_2_id = auth.uid() AND cs.partner_1_id = public.profiles.id)
        )
    );

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
CREATE POLICY "profiles_delete_own" ON public.profiles
    FOR DELETE TO authenticated
    USING (id = auth.uid());

-- 18.2 MIRA PREFERENCES POLICIES
DROP POLICY IF EXISTS "mira_preferences_all" ON public.mira_preferences;
CREATE POLICY "mira_preferences_all" ON public.mira_preferences
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 18.3 MIRA CONVERSATIONS POLICIES
DROP POLICY IF EXISTS "mira_conversations_all" ON public.mira_conversations;
CREATE POLICY "mira_conversations_all" ON public.mira_conversations
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 18.4 MIRA MESSAGES POLICIES (STRICT VERIFICATION OF CONVERSATION OWNERSHIP)
DROP POLICY IF EXISTS "mira_messages_select" ON public.mira_messages;
CREATE POLICY "mira_messages_select" ON public.mira_messages
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid() AND
        EXISTS (SELECT 1 FROM public.mira_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "mira_messages_insert" ON public.mira_messages;
CREATE POLICY "mira_messages_insert" ON public.mira_messages
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (SELECT 1 FROM public.mira_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "mira_messages_update" ON public.mira_messages;
CREATE POLICY "mira_messages_update" ON public.mira_messages
    FOR UPDATE TO authenticated
    USING (
        user_id = auth.uid() AND
        EXISTS (SELECT 1 FROM public.mira_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
    )
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (SELECT 1 FROM public.mira_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "mira_messages_delete" ON public.mira_messages;
CREATE POLICY "mira_messages_delete" ON public.mira_messages
    FOR DELETE TO authenticated
    USING (
        user_id = auth.uid() AND
        EXISTS (SELECT 1 FROM public.mira_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
    );

-- 18.5 MIRA MEMORIES POLICIES
DROP POLICY IF EXISTS "mira_memories_all" ON public.mira_memories;
CREATE POLICY "mira_memories_all" ON public.mira_memories
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 18.6 COMMUNICATION SCRIPTS POLICIES
DROP POLICY IF EXISTS "scripts_select" ON public.communication_scripts;
CREATE POLICY "scripts_select" ON public.communication_scripts
    FOR SELECT
    USING (is_published = true OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "scripts_write_blocked" ON public.communication_scripts;
CREATE POLICY "scripts_write_blocked" ON public.communication_scripts
    FOR ALL TO authenticated
    USING (false)
    WITH CHECK (false);

-- 18.7 SCRIPT FAVORITES POLICIES
DROP POLICY IF EXISTS "script_favorites_all" ON public.script_favorites;
CREATE POLICY "script_favorites_all" ON public.script_favorites
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 18.8 COUPLES SPACES POLICIES
DROP POLICY IF EXISTS "couples_spaces_select" ON public.couples_spaces;
CREATE POLICY "couples_spaces_select" ON public.couples_spaces
    FOR SELECT TO authenticated
    USING (partner_1_id = auth.uid() OR partner_2_id = auth.uid());

DROP POLICY IF EXISTS "couples_spaces_insert" ON public.couples_spaces;
CREATE POLICY "couples_spaces_insert" ON public.couples_spaces
    FOR INSERT TO authenticated
    WITH CHECK (partner_1_id = auth.uid());

DROP POLICY IF EXISTS "couples_spaces_update" ON public.couples_spaces;
CREATE POLICY "couples_spaces_update" ON public.couples_spaces
    FOR UPDATE TO authenticated
    USING (partner_1_id = auth.uid() OR partner_2_id = auth.uid())
    WITH CHECK (partner_1_id = auth.uid() OR partner_2_id = auth.uid());

DROP POLICY IF EXISTS "couples_spaces_delete" ON public.couples_spaces;
CREATE POLICY "couples_spaces_delete" ON public.couples_spaces
    FOR DELETE TO authenticated
    USING (partner_1_id = auth.uid());

-- 18.9 WORKSPACE INVITATIONS POLICIES
DROP POLICY IF EXISTS "invitations_select" ON public.workspace_invitations;
CREATE POLICY "invitations_select" ON public.workspace_invitations
    FOR SELECT TO authenticated
    USING (inviter_id = auth.uid());

DROP POLICY IF EXISTS "invitations_insert" ON public.workspace_invitations;
CREATE POLICY "invitations_insert" ON public.workspace_invitations
    FOR INSERT TO authenticated
    WITH CHECK (inviter_id = auth.uid());

DROP POLICY IF EXISTS "invitations_update" ON public.workspace_invitations;
CREATE POLICY "invitations_update" ON public.workspace_invitations
    FOR UPDATE TO authenticated
    USING (inviter_id = auth.uid())
    WITH CHECK (inviter_id = auth.uid());

DROP POLICY IF EXISTS "invitations_delete" ON public.workspace_invitations;
CREATE POLICY "invitations_delete" ON public.workspace_invitations
    FOR DELETE TO authenticated
    USING (inviter_id = auth.uid());

-- 18.10 SHARED COUPLE SESSIONS POLICIES
DROP POLICY IF EXISTS "shared_couple_sessions_all" ON public.shared_couple_sessions;
CREATE POLICY "shared_couple_sessions_all" ON public.shared_couple_sessions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.couples_spaces cs
            WHERE cs.id = shared_couple_sessions.space_id
              AND (cs.partner_1_id = auth.uid() OR cs.partner_2_id = auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.couples_spaces cs
            WHERE cs.id = shared_couple_sessions.space_id
              AND (cs.partner_1_id = auth.uid() OR cs.partner_2_id = auth.uid())
        )
    );

-- 18.11 COUPLE MIRA SETTINGS POLICIES
DROP POLICY IF EXISTS "couple_mira_settings_all" ON public.couple_mira_settings;
CREATE POLICY "couple_mira_settings_all" ON public.couple_mira_settings
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.couples_spaces cs
            WHERE cs.id = couple_mira_settings.space_id
              AND (cs.partner_1_id = auth.uid() OR cs.partner_2_id = auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.couples_spaces cs
            WHERE cs.id = couple_mira_settings.space_id
              AND (cs.partner_1_id = auth.uid() OR cs.partner_2_id = auth.uid())
        )
    );

-- 18.12 REHEARSAL PLANS POLICIES (INDIVIDUAL STRICT ISOLATION)
DROP POLICY IF EXISTS "rehearsal_plans_all" ON public.rehearsal_plans;
CREATE POLICY "rehearsal_plans_all" ON public.rehearsal_plans
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 18.13 COUPLES EXERCISES POLICIES
DROP POLICY IF EXISTS "couples_exercises_all" ON public.couples_exercises;
CREATE POLICY "couples_exercises_all" ON public.couples_exercises
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.couples_spaces cs
            WHERE cs.id = couples_exercises.space_id
              AND (cs.partner_1_id = auth.uid() OR cs.partner_2_id = auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.couples_spaces cs
            WHERE cs.id = couples_exercises.space_id
              AND (cs.partner_1_id = auth.uid() OR cs.partner_2_id = auth.uid())
        )
    );

-- 18.14 PRIVATE REFLECTIONS POLICIES (CORE PRIVACY BOUNDARY)
DROP POLICY IF EXISTS "private_reflections_select" ON public.private_reflections;
CREATE POLICY "private_reflections_select" ON public.private_reflections
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid() OR (
            is_shared = true AND EXISTS (
                SELECT 1 FROM public.couples_spaces cs
                WHERE cs.id = private_reflections.space_id
                  AND (cs.partner_1_id = auth.uid() OR cs.partner_2_id = auth.uid())
            )
        )
    );

DROP POLICY IF EXISTS "private_reflections_insert" ON public.private_reflections;
CREATE POLICY "private_reflections_insert" ON public.private_reflections
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "private_reflections_update" ON public.private_reflections;
CREATE POLICY "private_reflections_update" ON public.private_reflections
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "private_reflections_delete" ON public.private_reflections;
CREATE POLICY "private_reflections_delete" ON public.private_reflections
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- 18.15 ENTITLEMENTS POLICIES (READ-ONLY FOR CLIENTS)
DROP POLICY IF EXISTS "entitlements_select_own" ON public.entitlements;
CREATE POLICY "entitlements_select_own" ON public.entitlements
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR customer_email = (auth.jwt()->>'email'));

DROP POLICY IF EXISTS "entitlements_write_blocked" ON public.entitlements;
CREATE POLICY "entitlements_write_blocked" ON public.entitlements
    FOR ALL TO authenticated
    USING (false)
    WITH CHECK (false);

-- 18.16 USAGE RECORDS POLICIES (READ-ONLY FOR CLIENTS)
DROP POLICY IF EXISTS "usage_records_select_own" ON public.usage_records;
CREATE POLICY "usage_records_select_own" ON public.usage_records
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "usage_records_write_blocked" ON public.usage_records;
CREATE POLICY "usage_records_write_blocked" ON public.usage_records
    FOR ALL TO authenticated
    USING (false)
    WITH CHECK (false);

-- 18.17 PRODUCT CATALOG POLICIES
DROP POLICY IF EXISTS "product_catalog_select" ON public.product_catalog;
CREATE POLICY "product_catalog_select" ON public.product_catalog
    FOR SELECT
    USING (is_active = true OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "product_catalog_write_blocked" ON public.product_catalog;
CREATE POLICY "product_catalog_write_blocked" ON public.product_catalog
    FOR ALL TO authenticated
    USING (false)
    WITH CHECK (false);

-- ── 19. GRANTS ────────────────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON public.product_catalog TO anon, authenticated;
GRANT SELECT ON public.communication_scripts TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated, service_role;

-- ── 20. SEED DATA: PRODUCT CATALOG ────────────────────────────────────────────
INSERT INTO public.product_catalog (id, name, description, price, was_price, currency, gumroad_url, cover_image, category, is_active)
VALUES 
  ('bundle', 'The Complete Bundle', 'All 4 Guides + Practice workspace access. Comprehensive blueprint for understanding each other.', 97.00, 128.00, 'USD', 'https://themindly.gumroad.com/l/howwespeak-bundle', 'https://i.ibb.co/84LyRsYY/Chat-GPT-Image-Aug-7-2026-12-18-35-AM.png', 'bundle', true),
  ('men-edition', 'Men Edition Guide', 'Written for women. Explains why men go silent during conflict and what they need to open up.', 37.00, NULL, 'USD', 'https://themindly.gumroad.com/l/How-We-Speak-Men-Edition', 'https://i.ibb.co/rffWKyGB/Chat-GPT-Image-Aug-5-2026-07-50-17-PM.png', 'guide', true),
  ('women-edition', 'Women Edition Guide', 'Written for men. Explains why old arguments resurface and what she hears when you speak.', 37.00, NULL, 'USD', 'https://themindly.gumroad.com/l/howwespeak-women', 'https://i.ibb.co/j9fk1Qq0/Chat-GPT-Image-Aug-6-2026-10-23-22-AM.png', 'guide', true),
  ('script-collection', '75+ Script Collection', 'The words you have been searching for. Word-for-word scripts for every sensitive moment.', 27.00, NULL, 'USD', 'https://themindly.gumroad.com/l/howwespeak-scripts', 'https://i.ibb.co/KxgzQmtY/Chat-GPT-Image-Aug-6-2026-11-17-13-AM.png', 'scripts', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  was_price = EXCLUDED.was_price,
  gumroad_url = EXCLUDED.gumroad_url,
  cover_image = EXCLUDED.cover_image,
  category = EXCLUDED.category,
  is_active = EXCLUDED.is_active,
  updated_at = timezone('utc'::text, now());

-- ── 21. SEED DATA: 130 COMMUNICATION SCRIPTS ──────────────────────────────────

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'fn-01',
  'Bringing up emotional distance without blame',
  'FEELINGS_AND_NEEDS',
  'Expressing Feelings & Needs',
  'You have noticed less connection recently and want to understand what has changed without putting your partner on trial.',
  'Open a warm, non-accusatory conversation about closeness.',
  'I''ve been feeling a little disconnected from you lately, and I really miss feeling close. I don''t want to make assumptions about what''s going on. Could we talk about how we''ve both been feeling when you have some quiet time?',
  'It owns the speaker''s emotional experience (''I feel disconnected'') rather than judging the partner (''You never talk to me''), inviting collaboration.',
  'I miss feeling close to you. Is there a good time tonight where we can check in and just be together for a few minutes?',
  'I''ve noticed we''ve had less emotional connection this week. I want us to talk honestly about whether either of us is overwhelmed.',
  'Replace ''disconnected'' with the specific change you''ve felt (e.g. fewer check-ins, rushed evenings).',
  '{"distance","vulnerability","closeness","check-in"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'fn-02',
  'Asking for emotional support instead of advice',
  'FEELINGS_AND_NEEDS',
  'Expressing Feelings & Needs',
  'You are exhausted from your day and need comforting empathy, but your partner immediately offers tactical solutions.',
  'Guide your partner toward emotional attunement without dismissing their helpful intent.',
  'I really appreciate that you want to help solve this, but right now my head is just tired. What would help me most is just a hug and hearing you say ''that really sucks.'' Can we do that first?',
  'Validates their desire to help before explicitly asking for the specific type of support needed.',
  'I love that you want to fix things for me. Right now I just need to vent and feel your support. Could you just listen for five minutes?',
  'I don''t need solutions right now—I need empathy. When you try to troubleshoot, I end up feeling unheard. Can you just hold space for me?',
  'Name the exact physical or emotional comfort that calms you (e.g. a hug, sitting on the couch together).',
  '{"support","empathy","venting","problem-solving"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'fn-03',
  'Expressing feeling taken for granted in daily chores',
  'FEELINGS_AND_NEEDS',
  'Expressing Feelings & Needs',
  'You have been carrying most of the domestic or mental load and resentment is beginning to build.',
  'Address chore balance without turning the conversation into an itemized attack.',
  'I''ve been feeling overwhelmed keeping up with household tasks, and when it feels like I''m tracking everything alone, I end up feeling drained. I want us to be a team on this. Can we look at our weekly routines together tonight?',
  'Frames the issue around teamwork rather than failure or laziness, keeping defensiveness low.',
  'I''m feeling a bit tired with everything at home right now. Could we split up dinner and dishes tonight so I can catch my breath?',
  'The current balance of household responsibilities isn''t sustainable for me. I need us to sit down and divide these tasks clearly.',
  'Focus on 1 or 2 specific tasks rather than a vague complaint about ''everything.''',
  '{"chores","resentment","teamwork","domestic load"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'fn-04',
  'Sharing a hidden insecurity without fishing for compliments',
  'FEELINGS_AND_NEEDS',
  'Expressing Feelings & Needs',
  'You are feeling inadequate or worried about your standing in the relationship and want to be honest.',
  'Reveal vulnerability without putting the burden on your partner to rescue you.',
  'I have a vulnerability I want to share because I value transparency with you. A part of me has been feeling insecure about where I stand lately. I know that''s my feeling to navigate, but speaking it out loud helps me take its power away.',
  'Owns the emotion as personal responsibility while letting the partner witness real vulnerability.',
  'Sometimes I get quiet because I feel insecure. I love you, and just wanted to share what was going on in my head.',
  'I''m noticing an insecurity popping up around our relationship. I want to tell you directly rather than acting distant.',
  'Acknowledge that this is your internal experience so your partner doesn''t feel blamed.',
  '{"insecurity","vulnerability","honesty","intimacy"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'fn-05',
  'Asking for words of appreciation when effort goes unnoticed',
  'FEELINGS_AND_NEEDS',
  'Expressing Feelings & Needs',
  'You made an effort for your partner or the home, and felt unseen when they said nothing.',
  'Communicate your need for verbal acknowledgment without sounding resentful.',
  'I put quite a bit of care into cooking that dinner tonight, and hearing a quick ''thank you'' or knowing you enjoyed it really fills my cup. Words of appreciation mean a lot to me.',
  'Directly instructs the partner on how to make you feel loved, avoiding passive-aggressive silence.',
  'Did you like the meal tonight? A little verbal feedback always makes my evening.',
  'I notice that when I do things for us and they go unacknowledged, I feel invisible. I need verbal appreciation to stay motivated.',
  'Replace the action with the specific thing you did (e.g. organizing plans, fixing something, cooking).',
  '{"appreciation","words of affirmation","gratitude","unseen"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'fn-06',
  'Admitting you were wrong before an argument develops',
  'FEELINGS_AND_NEEDS',
  'Expressing Feelings & Needs',
  'You realized you snapped or made an unfair comment and want to disarm the situation immediately.',
  'Take instant accountability before nervous systems escalate.',
  'Before we go any further, I want to rewind. The way I answered you just now was sharp and unfair, and it had more to do with my workday stress than with you. I''m sorry.',
  'Pre-empts defensiveness by taking unprompted responsibility and identifying the root cause.',
  'I didn''t like how that came out of my mouth. I''m sorry—let me try again with kindness.',
  'That was my fault. I was irritable and took it out on you. I apologize.',
  'Name the external stressor so your partner understands it wasn''t personal malice.',
  '{"accountability","fast repair","humility","de-escalation"}'::text[],
  'direct',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'fn-07',
  'Expressing that a joke or tease crossed an emotional line',
  'FEELINGS_AND_NEEDS',
  'Expressing Feelings & Needs',
  'Your partner made a teasing remark in private or in front of others that actually hurt your feelings.',
  'Clarify your boundary around humor without being labeled as having "no sense of humor."',
  'I know you were just teasing earlier and didn''t mean to hurt me, but that comment about my work actually hit a tender spot. Even in fun, that topic is sensitive for me right now.',
  'Assumes positive intent (''I know you were just teasing'') while maintaining the boundary on impact.',
  'Ouch, that joke stung a little more than you probably meant it to. Can we leave that topic out of jokes?',
  'That comment crossed the line for me. It didn''t feel like playful teasing—it felt critical.',
  'Specify the exact phrase or topic that stung so they know what to avoid.',
  '{"teasing","boundaries","respect","sensitivity"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'fn-08',
  'Telling your partner you feel emotionally overwhelmed',
  'FEELINGS_AND_NEEDS',
  'Expressing Feelings & Needs',
  'Too many conversations, decisions, or family demands have overloaded your nervous system.',
  'Communicate mental saturation so your partner does not mistake it for rejection.',
  'My brain has reached max capacity today with work and family demands. If I seem quiet or slow to respond, it''s not because of you. I just need an hour to decompress in silence.',
  'Reassures your partner of relationship safety while clearly communicating reduced bandwidth.',
  'I''m running on empty right now. I love you, and I need a little quiet time to reset.',
  'I am completely overwhelmed right now. I cannot make any more decisions or discuss heavy topics tonight.',
  'Give an estimated timeframe (e.g. an hour, until tomorrow morning) for when you will be present.',
  '{"flooding","overwhelm","introversion","bandwidth"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'fn-09',
  'Asking for physical reassurance without demanding sex',
  'FEELINGS_AND_NEEDS',
  'Expressing Feelings & Needs',
  'You are craving non-sexual physical closeness—cuddling, hand-holding, or a long hug.',
  'Ask for non-demanding touch that builds safety and comfort.',
  'Could we just lie together and hold each other for ten minutes? Zero expectations, no agenda—I just need to feel physically grounded with you.',
  'Removes performance pressure by explicitly defining the touch as comfort-oriented.',
  'Can I get a long hug? I''ve missed your arms today.',
  'I need physical affection right now. Can we cuddle on the couch without our phones?',
  'Specify ''zero expectations'' if your partner sometimes worries hugs lead to unwanted pressure.',
  '{"affection","touch","reassurance","comfort"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'fn-10',
  'Expressing a desire to reconnect after a busy week',
  'FEELINGS_AND_NEEDS',
  'Expressing Feelings & Needs',
  'Life, kids, or jobs have turned you into roommates exchanging logistics.',
  'Shift the dynamic back toward romantic and emotional partnership.',
  'We''ve done an amazing job managing schedules this week, but I feel like we''ve been running as co-managers rather than partners. Can we put the logistics aside this weekend and have a real date together?',
  'Celebrates teamwork while calling out the roommate trap with warmth and optimism.',
  'I miss my partner. Let''s make time for just us this Saturday, even if it''s just coffee on the patio.',
  'We''re in roommate mode right now. I want us to deliberately schedule uninterrupted time together this week.',
  'Offer one concrete date idea (e.g. dinner, a walk, watching a movie without laptops).',
  '{"reconnection","date night","roommate phase","romance"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'dc-01',
  'Scheduling a serious conversation in advance',
  'DIFFICULT_CONVERSATIONS',
  'Difficult Conversations',
  'You have a significant issue to discuss and want to avoid ambushing your partner while they are busy.',
  'Create an agreed, calm container for a serious talk.',
  'There''s an important topic on my mind about our budget that I want us to work through thoughtfully. When would be a good 30-minute window this weekend where neither of us is hurried or tired?',
  'Giving notice prevents the fight-or-flight response caused by sudden conversational ambushes.',
  'I want to talk through our plans for the holidays. What day this week looks quiet for you?',
  'We need to discuss our finances. I don''t want to rush it, so let''s pick a specific time tonight to sit down.',
  'State the topic name briefly so their mind doesn''t spiral into worst-case catastrophic guessing.',
  '{"timing","scheduling","serious talks","container"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'dc-02',
  'Addressing unequal spending or financial habits',
  'DIFFICULT_CONVERSATIONS',
  'Difficult Conversations',
  'You are worried about recent purchases or different spending philosophies.',
  'Open financial discussion focused on shared security rather than policing.',
  'I''ve been feeling some anxiety about our savings goals and recent outflows. I don''t want to be critical of your choices—I want us to both feel secure and aligned on our targets. Can we review our monthly numbers together?',
  'Frames the conversation around shared financial safety rather than micro-managing the partner''s spending.',
  'Money conversations can be stressful, but I want to make sure we''re on the same page. Can we do a calm budget check-in?',
  'Our current spending is higher than what we agreed on, and it''s making me anxious. We need to look at the numbers tonight.',
  'Emphasize ''our shared targets'' rather than pointing at their individual transactions.',
  '{"finances","money","budget","security"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'dc-03',
  'Raising concerns about in-law or family interference',
  'DIFFICULT_CONVERSATIONS',
  'Difficult Conversations',
  'Your partner’s family is overstepping boundaries or making unsolicited demands.',
  'Express your relational boundary without making your partner feel forced to pick between you and their parents.',
  'I respect your relationship with your family and know how much you care about them. At the same time, when plans are decided without asking us first, I feel like our partnership isn''t being prioritized. How can we protect our unit together?',
  'Affirms their bond with family while reinforcing the primary commitment to the couple''s unit.',
  'I want your family to feel welcome, but I also need us to decide our weekend plans together first.',
  'We need clearer boundaries with your parents. Right now, their preferences are overriding our agreements.',
  'Use the word ''our unit'' or ''our partnership'' to evoke solidarity.',
  '{"in-laws","family","boundaries","loyalty"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'dc-04',
  'Talking about unequal emotional labor in parenting or pets',
  'DIFFICULT_CONVERSATIONS',
  'Difficult Conversations',
  'You are carrying the calendar, medical appointments, and planning alone.',
  'Share the invisible mental load without calling your partner negligent.',
  'I''m noticing that the mental burden of tracking doctors, schedules, and school requirements is wearing me down. It''s not just the physical tasks—it''s the constant mental vigilance. I need us to share the planning load.',
  'Distinguishes ''mental labor'' from physical tasks, illuminating invisible work without hostility.',
  'I''m feeling overwhelmed tracking everything for the kids. Can you take ownership of doctor appointments going forward?',
  'I am carrying 90% of the mental planning for our home. I need you to step into full ownership of specific areas.',
  'Hand over complete ownership of one domain (e.g. vet care, sports) rather than micromanaging.',
  '{"mental load","parenting","responsibilities","invisible labor"}'::text[],
  'direct',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'dc-05',
  'Addressing excessive phone use during quality time',
  'DIFFICULT_CONVERSATIONS',
  'Difficult Conversations',
  'Your partner is continually scrolling social media or emails during dinners or relaxation time.',
  'Ask for presence without sounding like an angry parent taking away a screen.',
  'I notice that when we''re together and phones are out, I feel like I''m competing for your attention. I really value our time—could we do a phone-free dinner tonight so we can actually catch up?',
  'Focuses on desire for the partner''s company (''I value our time'') rather than scolding screen time.',
  'Can we put our phones away for the next hour? I miss your undivided attention.',
  'The phone use during dinner makes me feel disconnected. I want us to agree to a no-screens policy at the table.',
  'Put your own phone away visibly first to set a mutual tone of presence.',
  '{"phones","screens","presence","quality time"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'dc-06',
  'Bringing up a hygiene or self-care decline with kindness',
  'DIFFICULT_CONVERSATIONS',
  'Difficult Conversations',
  'Your partner has stopped caring for their health, hygiene, or grooming, possibly due to burnout.',
  'Express care and concern without shaming their body or dignity.',
  'I''ve noticed you seem worn down lately and haven''t had the energy for your usual routines. Because I love you, I care about your well-being. How are you genuinely feeling on the inside right now?',
  'Treats hygiene or energy drop as an indicator of internal emotional state rather than a superficial flaw.',
  'You seem exhausted lately, love. Is there anything heavy weighing on you that you want to talk about?',
  'I''ve noticed a shift in your self-care recently. I want to check in because I care about you and want to help if you''re struggling.',
  'Ask about their internal energy before mentioning specific external habits.',
  '{"health","self-care","burnout","compassion"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'dc-07',
  'Discussing alcohol or substance use when it affects the relationship',
  'DIFFICULT_CONVERSATIONS',
  'Difficult Conversations',
  'Their drinking or substance use changes their personality or creates anxiety for you.',
  'Address behavioral impact without triggering defensive denial.',
  'I want to share something because I care deeply about our future. When you have multiple drinks, the way you speak changes, and I end up feeling anxious and disconnected from the person I love. Can we talk about this honestly?',
  'Focuses on relational impact (''I feel anxious and disconnected'') rather than moral condemnation.',
  'I feel worried when drinking enters our evenings because our communication changes. Can we talk about where things stand?',
  'Your drinking is negatively impacting our relationship and my sense of emotional safety. We need to address this directly.',
  'Describe the specific behavioral change (e.g. slurred words, irritability) rather than generalizing.',
  '{"alcohol","substance","safety","hard talk"}'::text[],
  'direct',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'dc-08',
  'Talking about career shifts or relocation dreams',
  'DIFFICULT_CONVERSATIONS',
  'Difficult Conversations',
  'You are considering a major life move or career pivot that will impact both of your futures.',
  'Explore the vision together without making it sound like a unilateral decision.',
  'There''s an aspiration I''ve been reflecting on regarding my career direction. It''s not a finalized decision—I want us to explore what it could look like together and whether it could work for our shared life.',
  'Explicitly states ''it is not a finalized decision,'' immediately neutralizing partner panic.',
  'I''ve been dreaming about some future possibilities. Can I share them with you and see what you think?',
  'I am feeling unfulfilled in my current job and want to look into a shift. I need us to discuss the financial and lifestyle implications.',
  'Ask ''What concerns would you have?'' early so they feel their security is valued.',
  '{"career","future","relocation","big decisions"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'dc-09',
  'Addressing feeling judged or micromanaged',
  'DIFFICULT_CONVERSATIONS',
  'Difficult Conversations',
  'Your partner frequently corrects how you drive, load the dishwasher, or speak to others.',
  'Set a boundary against micromanagement while affirming mutual respect.',
  'I know you have a preferred way of doing things, but when every small task is corrected, I end up feeling like an incompetent assistant rather than your equal partner. I need trust that I can do things my way.',
  'Names the emotional consequence (''incompetent assistant vs equal partner'') with striking clarity.',
  'I know you''re trying to help, but can you let me handle this my way even if it''s different from yours?',
  'The constant corrections make me feel micromanaged. I need you to step back and let me complete tasks without commentary.',
  'Use humor or light tone if it''s over chores; use direct tone if it affects self-esteem.',
  '{"micromanagement","criticism","equality","respect"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'dc-10',
  'Opening up about mismatched sexual frequency',
  'DIFFICULT_CONVERSATIONS',
  'Difficult Conversations',
  'Differences in libido are causing unspoken tension, rejection, or guilt.',
  'Discuss intimacy without shame, blame, or performance pressure.',
  'I care about our physical intimacy and I also know libido fluctuates naturally. I want us to talk about our differences in desire without either of us feeling guilty or rejected. Can we have a relaxed chat about where we both are?',
  'Normalizes libido differences right away, removing the toxic ''you are broken / you are demanding'' dynamic.',
  'I miss our closeness, and I want us to talk about how we can connect without any pressure tonight.',
  'The gap in our physical intimacy is causing distance between us. I want us to be honest about what we both need.',
  'Emphasize that the conversation itself has zero requirement for sex that evening.',
  '{"intimacy","sex","libido","desire"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'rd-01',
  'Calling a physiological timeout during a heated argument',
  'REPAIR_AND_DEESCALATION',
  'Repair & De-escalation',
  'Heart rates are elevated, voices are rising, and productive communication has stopped.',
  'Pause the fight safely with a guaranteed return time.',
  'My heart is beating too fast and I can feel myself getting defensive. I care too much about you to say something hurtful. Let''s take 20 minutes to breathe, and I promise to come back to this couch at [time].',
  'Affirms commitment to the partner, takes responsibility for personal flooding, and sets an exact resumption timestamp.',
  'I''m feeling flooded right now, love. Let me take a walk for 15 minutes so I can listen to you with a calm mind.',
  'We are shouting and nothing helpful is happening. I am stepping out for 20 minutes to reset. We will resume at 8:15.',
  'Always name an exact time (e.g. 7:30 PM) so anxious attachment is not triggered.',
  '{"timeout","de-escalation","flooding","heart rate"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'rd-02',
  'Offering the peace branch after silent treatment',
  'REPAIR_AND_DEESCALATION',
  'Repair & De-escalation',
  'Both of you have been sitting in uncomfortable icy silence for hours or days.',
  'Melt the freeze and open the door without demanding immediate surrender.',
  'I hate this cold distance between us, and I don''t want to spend tonight disconnected. We don''t have to solve everything this second, but can we agree that we''re on the same team?',
  'Prioritizes relational warmth over winning the debate, which lowers mutual defensiveness.',
  'Can I bring you a glass of water? I miss you and don''t like being mad at each other.',
  'This silence is exhausting and harmful to us. Let''s sit down and talk through this calmly.',
  'A small physical gesture (tea, a blanket) reinforces the spoken words.',
  '{"silence","peace branch","repair","reconnection"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'rd-03',
  'Recognizing that an old wound was accidentally triggered',
  'REPAIR_AND_DEESCALATION',
  'Repair & De-escalation',
  'Your emotional reaction was disproportionate to the actual event due to past trauma or childhood pain.',
  'Contextualize the emotional explosion so your partner does not bear full blame.',
  'When that happened earlier, a very old wound from my past got touched, and I reacted out of that old pain rather than what was actually in front of me. You didn''t cause that past, and I''m sorry for unloading it on you.',
  'Separates the partner''s innocent mistake from past emotional baggage, restoring reality.',
  'I overreacted earlier because it hit an old sensitivity. I''m sorry I took that out on you.',
  'My reaction was out of proportion to what you did. I was triggered by an old memory, and I take responsibility for my reaction.',
  'Briefly mention the core fear (e.g. fear of abandonment, fear of being controlled).',
  '{"triggers","trauma","self-awareness","overreaction"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'rd-04',
  'Stopping the "You always / You never" cycle',
  'REPAIR_AND_DEESCALATION',
  'Repair & De-escalation',
  'The fight has turned into sweeping generalizations about character and history.',
  'Bring the conversation back to the specific observable moment.',
  'Hold on—I hear myself using words like ''always'' and ''never,'' and that''s not fair or accurate. Let me pull back. What I''m really frustrated about is specifically what happened this afternoon.',
  'Catches personal cognitive distortions in real time, serving as a powerful model of maturity.',
  'I''m generalizing because I''m upset, and that''s not fair to you. Let''s focus on just today.',
  'Let''s stop bringing up the last five years. Can we agree to talk only about today''s issue?',
  'Acknowledge the positive things they HAVE done to counter the ''never'' claim.',
  '{"generalizations","conflict","fair fighting","clarity"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'rd-05',
  'Re-approaching a partner who shut down and left',
  'REPAIR_AND_DEESCALATION',
  'Repair & De-escalation',
  'Your partner walked away into the bedroom or outside to escape the argument.',
  'Re-engage gently without re-igniting the fire.',
  'I''m knocking gently because I want to make sure you''re okay. When you''re ready, I''m here. I''m ready to listen without interrupting or arguing my side.',
  'Replaces invasive pursuit with a respectful invitation, allowing their nervous system to settle.',
  'Just checking on you, love. Take your time—I''ll be in the living room when you''re ready.',
  'I want us to finish this conversation when you feel calm. Let me know when you have bandwidth.',
  'Leave a note or send a soft text if speaking through the door feels too intrusive.',
  '{"withdrawal","stonewalling","gentle re-entry","respect"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'rd-06',
  'Acknowledging your partner''s hurt even if you disagree on facts',
  'REPAIR_AND_DEESCALATION',
  'Repair & De-escalation',
  'You both remember an interaction differently, but your partner is genuinely in pain.',
  'Validate the emotional impact without lying about your own perception.',
  'We may not agree on the exact sequence of what happened, but I can see how deeply hurt you feel right now. Seeing you in pain matters to me far more than proving my memory right.',
  'Prioritizes relational compassion over proving factual supremacy.',
  'I hate seeing you hurt. Regardless of details, I''m truly sorry that my words left you feeling that way.',
  'I see things differently, but your feelings are real to me. Let''s focus on healing the hurt rather than debating the facts.',
  'Remind yourself: ''Do I want to be right, or do I want to be connected?''',
  '{"validation","impact vs intent","empathy","compassion"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'rd-07',
  'Checking in the morning after a fight',
  'REPAIR_AND_DEESCALATION',
  'Repair & De-escalation',
  'You went to bed with unresolved tension and morning has arrived.',
  'Reset the emotional weather for the day.',
  'Good morning. Last night was heavy for both of us, and I woke up wanting you to know I love you. Let''s carry kindness into today, and we can revisit the topic tonight with fresh energy.',
  'Separates the ongoing discussion from daily relational warmth, preventing an agonizing day.',
  'Morning, love. I''m still processing last night, but I wanted to hug you before we start our day.',
  'Last night was rough. I want to check in on how you''re feeling before we head into work.',
  'Offer their favorite morning beverage as a quiet physical reassurance.',
  '{"morning reset","next day","soft landing","reassurance"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'rd-08',
  'Interrupting your own defensiveness mid-sentence',
  'REPAIR_AND_DEESCALATION',
  'Repair & De-escalation',
  'You realize you are listing excuses, counter-attacks, or minimizing their point.',
  'Pivot from defense to authentic presence.',
  'Wait—listen to me, I''m making excuses and trying to defend myself. That''s not helpful. Tell me again what you felt, and I promise to just listen this time.',
  'Shockingly effective because few people expect someone to call themselves out mid-argument.',
  'I''m being defensive. Let me take a breath and try to hear you properly.',
  'Stop me right there. I was defending instead of listening. What did you need me to understand?',
  'Take a deep breath and physically relax your shoulders as you speak this.',
  '{"defensiveness","self-correction","active listening","maturity"}'::text[],
  'direct',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'rd-09',
  'Suggesting a joint repair ritual after an argument ends',
  'REPAIR_AND_DEESCALATION',
  'Repair & De-escalation',
  'The disagreement has concluded logically, but emotional residue lingers.',
  'Transition from cognitive agreement to emotional restoration.',
  'Now that we''ve talked through the issue, can we do a little reset? Let''s take a walk around the block together and leave the problem behind us.',
  'Changes the physical environment, using bilateral movement (walking) to regulate nervous systems.',
  'Can we just sit together and watch something funny? I want us to feel light again.',
  'The conversation is resolved. Let''s make a conscious choice to transition back to normal.',
  'A change of scenery (porch, kitchen, walk) physically resets tension.',
  '{"reset","recovery","post-argument","bonding"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'rd-10',
  'Saying "I am on your side" when the partner feels attacked',
  'REPAIR_AND_DEESCALATION',
  'Repair & De-escalation',
  'Your partner has put up emotional walls and treats your words as hostile arrows.',
  'Break through their paranoia with unshakeable alliance.',
  'Look at me for a second. I am not your enemy. I love you, and I am fighting for our relationship, not against you. We are on the same team.',
  'Disarms survival instincts by directly declaring allegiance to the person.',
  'I''m on your team, always. Even when we disagree, I love you.',
  'Stop treating me like an adversary. I am your partner and I want us to succeed together.',
  'Make warm eye contact and open your palms upward.',
  '{"teamwork","alliance","safety","disarming"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'bp-01',
  'Setting a boundary on raised voices or shouting',
  'BOUNDARIES_AND_SPACE',
  'Boundaries & Personal Space',
  'Your partner starts shouting, slamming items, or using intimidating volume.',
  'Establish an unequivocal safety boundary without escalating tone.',
  'I want to hear what you have to say, but I cannot process information when voices are raised. I need us to speak calmly, or I will step into the other room until we can speak with respect.',
  'Clearly links willingness to listen with a firm consequence that you personally control.',
  'The volume is too loud for me to hear your heart. Can we lower our voices so I can listen?',
  'I will not participate in a conversation where I am being shouted at. I am stepping away until voices are calm.',
  'Follow through immediately by stepping into the other room if volume continues.',
  '{"yelling","shouting","respect","safety boundary"}'::text[],
  'direct',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'bp-02',
  'Protecting solo recharge time on weekends',
  'BOUNDARIES_AND_SPACE',
  'Boundaries & Personal Space',
  'Your partner assumes all weekend hours are shared, leaving you depleted.',
  'Claim necessary solitary recovery without signaling dissatisfaction with the partner.',
  'I love our weekends together, and to be my best self, I need two uninterrupted hours Saturday morning to read and recharge alone. What time works best so we can plan the rest of the day around it?',
  'Frames personal space as an investment in the relationship''s quality rather than an escape.',
  'I''m craving a little alone time tomorrow morning. How about I take two hours, and then we do lunch together?',
  'I need solitary recharge time this weekend. I''m carving out Saturday from 9 to 11 AM for myself.',
  'Offer an attractive plan for the time after your solo window.',
  '{"alone time","introvert","weekends","self-care"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'bp-03',
  'Setting a boundary around late-night serious discussions',
  'BOUNDARIES_AND_SPACE',
  'Boundaries & Personal Space',
  'Your partner brings up heavy existential or relationship dilemmas at 11:30 PM in bed.',
  'Protect sleep hygiene while reassuring them of your commitment to discuss it tomorrow.',
  'This is too important for us to tackle when our brains are running on empty at midnight. I love you, and I promise we will sit down over coffee tomorrow at 10 AM to give this full attention.',
  'Protects sleep while giving an exact morning commitment, stopping middle-of-the-night spiraling.',
  'My brain is shutting down, love. Can we sleep now and talk about this first thing in the morning?',
  'I do not make decisions or discuss relationship issues after 10 PM. Let''s resume tomorrow.',
  'Write the topic on a notepad beside the bed to show it won''t be forgotten.',
  '{"sleep","late night","timing","boundaries"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'bp-04',
  'Stopping name-calling or contemptuous sarcasm',
  'BOUNDARIES_AND_SPACE',
  'Boundaries & Personal Space',
  'Your partner calls you an insulting name or rolls their eyes with contempt.',
  'Enforce zero-tolerance for contempt, the #1 predictor of relationship failure.',
  'Name-calling is a line we do not cross in this home. When insults enter, respect leaves. I am pausing this conversation until we can address the problem without tearing each other down.',
  'Grounded, uncompromising, and establishes that contempt destroys safety.',
  'That name really hurt. Please don''t speak to me like that, even when you''re angry.',
  'I will not accept being called names. If that happens again, I am ending this conversation for the night.',
  'Maintain steady eye contact and zero anger in your vocal tone.',
  '{"name-calling","contempt","respect","hard boundary"}'::text[],
  'direct',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'bp-05',
  'Setting a boundary on work calls during family meals',
  'BOUNDARIES_AND_SPACE',
  'Boundaries & Personal Space',
  'Work emails and Slack notifications interrupt every shared meal.',
  'Protect sacred relationship ritual without devaluing their professional dedication.',
  'I respect how hard you work for our family. During dinner, however, I want our attention on each other. Let''s make our 30-minute meals a phone-free sanctuary.',
  'Honors their career ambition while drawing a clean circle around mealtime presence.',
  'Can we put work on pause just while we eat? I want to hear about your day without pings.',
  'No work calls at the dinner table. It damages our connection, and I need this time to be shared.',
  'Offer to handle dinner cleanup so they can finish any urgent work before sitting down.',
  '{"work-life","dinner","notifications","sanctuary"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'bp-06',
  'Declining an invitation without guilt or over-explaining',
  'BOUNDARIES_AND_SPACE',
  'Boundaries & Personal Space',
  'Your partner wants you to attend an optional social gathering that you have zero energy for.',
  'Say no with loving clarity while encouraging them to go have fun.',
  'I''m so glad you want to go, and I want you to have a wonderful time, but my social battery is at zero tonight. I''m going to stay in and rest. Go enjoy yourself and tell me all about it later!',
  'Empowers the partner to enjoy themselves without tethering your presence to their happiness.',
  'I''m too drained for a party tonight, but please go! I''ll be cozy here waiting for you.',
  'I am not attending tonight. I need quiet rest. You should definitely go if you want to.',
  'Send them off with a warm kiss so they feel supported in going solo.',
  '{"social events","saying no","autonomy","recharge"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'bp-07',
  'Setting a boundary on unsolicited physical advice or body comments',
  'BOUNDARIES_AND_SPACE',
  'Boundaries & Personal Space',
  'Your partner makes passive comments about what you eat, wear, or how you look.',
  'Protect bodily autonomy with clear, firm self-respect.',
  'I know you may think you''re helping, but comments about my food or body leave me feeling scrutinized rather than loved. I need you to trust me to manage my own body.',
  'Clarifies that body policing erodes romantic safety, asking for trust over monitoring.',
  'Comments like that make me feel self-conscious. Can you please keep opinions on my food to yourself?',
  'My body and food choices are not up for discussion. Please stop making commentary on them.',
  'Use this script early before resentment compounds over months.',
  '{"body image","autonomy","comments","self-respect"}'::text[],
  'direct',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'bp-08',
  'Asking a partner not to share your private struggles with friends',
  'BOUNDARIES_AND_SPACE',
  'Boundaries & Personal Space',
  'You discover your partner discussed your health, job loss, or bedroom life with their friends.',
  'Re-establish the sacred privacy envelope of your partnership.',
  'What happens in our relationship and my personal challenges are private to us. When that was shared with friends, it felt like a breach of emotional trust. I need our vulnerable matters kept inside our circle.',
  'Defines the boundary between personal privacy and external gossip with clear values.',
  'I felt exposed hearing that my situation was shared. Please check with me before discussing my struggles with others.',
  'My private life is not fodder for group chats. I need an explicit agreement that our private matters stay between us.',
  'Agree together on who (e.g. a therapist, a designated best friend) is an acceptable confidant.',
  '{"privacy","trust","gossip","confidentiality"}'::text[],
  'direct',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'bp-09',
  'Setting a boundary against being treated as their only emotional therapist',
  'BOUNDARIES_AND_SPACE',
  'Boundaries & Personal Space',
  'Your partner dumps immense existential trauma onto you daily without seeking professional help.',
  'Protect your emotional capacity while encouraging healthy professional support.',
  'I love you and want to support you, but I don''t have the professional capacity to carry this level of emotional distress for you. Because I care about your healing, I want to help you find a qualified therapist who can truly guide you.',
  'Loving honesty: acknowledges human limits and points toward sustainable healing.',
  'I want to be your loving partner, but this is heavier than what I know how to navigate. Let''s find a professional to help.',
  'I cannot be your therapist. It is draining our relationship. I need you to seek professional support for this.',
  'Offer to help research providers or sit with them during the first phone consultation.',
  '{"therapy","emotional dumping","burnout","limits"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'bp-10',
  'Holding a boundary when your partner tests or pushes back',
  'BOUNDARIES_AND_SPACE',
  'Boundaries & Personal Space',
  'Your partner responds to a stated boundary with guilt-tripping or anger.',
  'Remain calm, grounded, and immovable without counter-attacking.',
  'I understand that my boundary is frustrating for you, and it''s okay for you to feel disappointed. My decision remains what I stated. I love you, and this is what I need right now.',
  'Validates their disappointment without negotiating away the boundary.',
  'I hear that you''re unhappy about this. I still need to hold to what I said, with love.',
  'I''m not going to argue about this. My boundary is set, and I expect it to be respected.',
  'Do not JADE (Justify, Argue, Defend, or Explain) once the boundary has been communicated.',
  '{"pushback","holding lines","groundedness","guilt-trips"}'::text[],
  'direct',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'rs-01',
  'Asking for explicit verbal reassurance during an anxious spiral',
  'REASSURANCE_AND_SECURITY',
  'Reassurance & Security',
  'Anxiety is telling you your partner has fallen out of love or is secretly disgusted with you.',
  'Ask for reassurance cleanly without testing them or acting out.',
  'My anxious brain is acting up today and telling me silly stories that you''re tired of me. Could you just look at me and tell me that we''re okay and that you love me?',
  'Labels the anxiety accurately and asks for the exact medicine needed without drama.',
  'Can you tell me you love me today? I''m feeling a little insecure and just need to hear your voice.',
  'I''m spiraling into relationship anxiety right now. I need reassurance that our foundation is solid.',
  'Acknowledge that it''s ''anxious brain'' so your partner doesn''t feel accused of doing something wrong.',
  '{"anxiety","reassurance","spiraling","verbal affirmation"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'rs-02',
  'Offering reassurance to an anxiously attached partner',
  'REASSURANCE_AND_SECURITY',
  'Reassurance & Security',
  'Your partner is seeking reassurance repeatedly or asking "Are you mad at me?"',
  'Provide generous, warm emotional safety without frustration.',
  'I am right here, and I am not going anywhere. I love you, I choose you, and we are completely okay. Take a deep breath with me.',
  'Offers steady, grounded presence instead of irritated dismissiveness.',
  'I''m not mad at you at all, sweetie. You are safe with me, always.',
  'We are good. I love being with you. Let the anxiety rest.',
  'Take both their hands and breathe out slowly together.',
  '{"anxious partner","safety","grounding","presence"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'rs-03',
  'Reassuring an avoidant partner before raising an issue',
  'REASSURANCE_AND_SECURITY',
  'Reassurance & Security',
  'Your partner anticipates that every discussion is a catastrophe or breakup talk.',
  'De-fang the catastrophic fear before sharing your thought.',
  'Before I say anything: our relationship is safe, I love you, and this is not a crisis or a breakup talk. I just have a small logistical matter I want us to figure out together.',
  'Immediately turns off their sympathetic nervous system''s threat alarm.',
  'Everything is okay between us. I just want to ask your thoughts on something small.',
  'We are solid. Do not worry. I just want to talk through one simple detail.',
  'Keep your vocal tone light, relaxed, and unhurried.',
  '{"avoidance","catastrophizing","pre-framing","safety"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'rs-04',
  'Checking in when your partner has been unusually quiet',
  'REASSURANCE_AND_SECURITY',
  'Reassurance & Security',
  'Your partner seems withdrawn into their thoughts and you want to offer presence.',
  'Offer presence without demanding immediate disclosure.',
  'I noticed you''ve been quiet this evening. You don''t have to talk if you don''t feel like it—I just wanted you to know I''m right here if you want company or an ear.',
  'Removes performance pressure while leaving the door wide open for connection.',
  'Thinking of you. I''m around whenever you feel like chatting, love.',
  'You seem quiet today. Is there something on your mind you want to share with me?',
  'Sit nearby quietly with a book to demonstrate peaceful companionable presence.',
  '{"quiet partner","companionable silence","presence","no pressure"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'rs-05',
  'Reaffirming love after a disagreement without conceding your boundary',
  'REASSURANCE_AND_SECURITY',
  'Reassurance & Security',
  'You had to say no to your partner, and they look deflated or hurt.',
  'Affirm love and connection while maintaining your self-respect.',
  'Even though we see this specific topic differently, my love for you hasn''t changed one bit. We can hold different perspectives and still be deeply devoted to each other.',
  'Demonstrates high differentiation: relationship security is not contingent on identical opinions.',
  'I love you so much, even when we don''t agree on everything.',
  'My ''no'' on this topic is not a ''no'' to you as my partner. I love you completely.',
  'A gentle touch on the shoulder anchors this reassuring truth.',
  '{"differentiation","unconditional love","boundaries","security"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'rs-06',
  'Asking for reassurance about physical attraction',
  'REASSURANCE_AND_SECURITY',
  'Reassurance & Security',
  'Body changes, aging, or postpartum phases have made you feel unsexy.',
  'Ask for intimacy reassurance with candid vulnerability.',
  'I''ve been feeling a little disconnected from my own body lately and feeling self-conscious. I could really use a reminder from you that you still find me desirable.',
  'Direct, charmingly vulnerable, and gives your partner clear instructions to make you feel cherished.',
  'Tell me I look pretty today? I''m feeling a little frumpy and need your eyes on me.',
  'I need to know where we stand with physical attraction. A little verbal flirtation goes a long way for me.',
  'Celebrate when they compliment you rather than deflecting or arguing with them.',
  '{"attraction","body confidence","desire","flirting"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'rs-07',
  'Reassuring your partner when they make an honest mistake',
  'REASSURANCE_AND_SECURITY',
  'Reassurance & Security',
  'Your partner forgot an errand, burnt dinner, or damaged something and looks terrified of your anger.',
  'Respond with generous grace that builds lifelong psychological safety.',
  'Hey, it''s totally okay. It''s just a thing, and things can be replaced. You are what matters to me. Let''s order takeout and laugh about it.',
  'Proves that people matter more than possessions or perfection, cementing emotional safety.',
  'Don''t beat yourself up, honey. It happens to all of us. I love you.',
  'Accidents happen. It''s not a big deal. Let''s solve it together.',
  'Never bring up an honest mistake during future arguments.',
  '{"grace","mistakes","psychological safety","compassion"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'rs-08',
  'Giving reassurance before a temporary period of physical separation',
  'REASSURANCE_AND_SECURITY',
  'Reassurance & Security',
  'One of you is traveling for a week for work or family.',
  'Anchor relational permanence across geographic distance.',
  'I''m going to miss you while I''m away. Let''s agree on a quick morning text and a 10-minute bedtime call every evening so we stay anchored no matter how busy the days get.',
  'Sets predictable connection rituals before departure, eliminating uncertainty.',
  'Can''t wait to be back in your arms before I''ve even left. Let''s talk every night before sleep.',
  'Let''s set our daily call times now so we don''t play phone tag while I''m traveling.',
  'Leave a handwritten note in their suitcase for them to find upon arrival.',
  '{"travel","distance","rituals","anchoring"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'rs-09',
  'Asking what your partner needs to feel more secure with you',
  'REASSURANCE_AND_SECURITY',
  'Reassurance & Security',
  'You want to proactively nurture relationship trust before problems arise.',
  'Show proactive curiosity about their attachment needs.',
  'I want to be the best partner I can be for you. Is there anything I''ve been doing lately that makes you feel uneasy, or something I could do more of that makes you feel deeply loved?',
  'Demonstrates extraordinary emotional maturity and proactive devotion.',
  'What''s one small thing I could do this week to make you feel extra loved?',
  'I want to do an emotional check-in. How secure have you been feeling in our partnership lately?',
  'Listen without defending—take notes and implement at least one suggestion within 48 hours.',
  '{"proactive","check-in","curiosity","security"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'rs-10',
  'Reassuring your partner when their work is stressful',
  'REASSURANCE_AND_SECURITY',
  'Reassurance & Security',
  'Your partner is carrying intense professional pressure and feels like they are failing.',
  'Act as their peaceful anchor and unwavering supporter.',
  'You are carrying an enormous amount on your shoulders right now. I believe in your capabilities, and even if work feels chaotic, our home and my love for you are steady ground.',
  'Reminds them that their worth is not defined by their output, providing sanctuary.',
  'I''m so proud of how hard you try. Remember that you have a sanctuary here with me.',
  'Work is tough right now, but you are tougher. Let home be your place of rest.',
  'Draw them a warm bath or prepare their favorite snack without ceremony.',
  '{"work stress","anchor","encouragement","sanctuary"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'lv-01',
  'Reflecting back what you heard before answering',
  'LISTENING_AND_VALIDATION',
  'Listening & Validation',
  'Your partner just explained a grievance and you want to ensure complete comprehension.',
  'Practice active attunement before jumping into rebuttal.',
  'Let me make sure I''m truly understanding what you said before I respond. What I''m hearing is that when I arrive late, you feel disrespected and like your evening schedule was disregarded. Did I capture that accurately?',
  'Makes your partner feel genuinely understood, which immediately lowers their emotional urgency.',
  'If I hear you correctly, you felt forgotten tonight. Is that what it felt like?',
  'Let me mirror back: you need more reliability on timing. Is that right?',
  'Ask ''Did I capture that accurately?'' and genuinely let them correct you.',
  '{"mirroring","active listening","attunement","validation"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'lv-02',
  'Validating emotion without admitting factual guilt',
  'LISTENING_AND_VALIDATION',
  'Listening & Validation',
  'Your partner’s interpretation of an event differs from yours, but their distress is genuine.',
  'Validate the emotional reality without sacrificing your integrity.',
  'I can completely understand why you would feel hurt seeing it from that angle. If I perceived things that way, I would feel upset too.',
  'Validates the emotional logic (''If I saw it that way, I would hurt too'') without lying about facts.',
  'It makes total sense that you feel upset. I''m listening.',
  'I understand why that interpretation caused you pain.',
  'Never add the word ''BUT'' after this sentence; let the validation breathe.',
  '{"validation","perspective","empathy","non-defensive"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'lv-03',
  'Asking open-ended questions when a partner is hesitant to speak',
  'LISTENING_AND_VALIDATION',
  'Listening & Validation',
  'Your partner is holding back, looking down, or giving one-word answers.',
  'Gently invite deeper reflection without grilling them.',
  'Take your time. There''s no rush and no right answer. What is the heaviest part of this situation for you right now?',
  'A specific, compassionate question (''What is the heaviest part?'') is much easier to answer than ''What''s wrong?''',
  'I''m right here with you. What does this feel like on the inside?',
  'Help me understand what''s bothering you most so I can support you properly.',
  'Lower your voice pitch and slow your speaking rate by 30%.',
  '{"open questions","hesitant","gentle inquiry","presence"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'lv-04',
  'Acknowledging the validity of their anger',
  'LISTENING_AND_VALIDATION',
  'Listening & Validation',
  'Your partner is angry at you, and you instinctively want to tell them to calm down.',
  'Allow anger to exist without escalating or tone-policing.',
  'You have every right to be angry with me about this. I broke our agreement, and your frustration is completely justified. I''m here to hear it.',
  'Telling someone they have a right to be angry almost instantly defuses the urgency of the anger.',
  'I see your anger, and I understand why you''re mad. I''m not running away from it.',
  'Your anger is justified. I messed up. Tell me what needs to happen to fix it.',
  'Never say ''Calm down''—say ''You have a right to be angry.''',
  '{"anger","justified","tone policing","safety"}'::text[],
  'direct',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'lv-05',
  'Validating childhood or family roots in a reaction',
  'LISTENING_AND_VALIDATION',
  'Listening & Validation',
  'You recognize that their reaction connects to how their family treated them growing up.',
  'Connect the dots with compassionate insight.',
  'Knowing what you went through in your family around criticism, it makes complete sense why my feedback felt so threatening. I want our home to feel different and safe for you.',
  'Deepens emotional intimacy by showing you remember their history and care for their inner child.',
  'Given your history, it''s so understandable that this felt scary. You''re safe with me.',
  'I know where this fear comes from in your past. I want to handle it with care.',
  'Only use this if they have previously shared their family background voluntarily.',
  '{"childhood","family wounds","compassion","deep intimacy"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'lv-06',
  'Checking if your partner wants comfort or problem-solving',
  'LISTENING_AND_VALIDATION',
  'Listening & Validation',
  'Your partner enters the room complaining about a bad day or conflict at work.',
  'Establish the conversational contract upfront.',
  'Do you want me to just listen and validate, or are you looking for ideas to troubleshoot? I''m happy to do whichever helps you most right now.',
  'Saves hours of friction by agreeing on the mode before proceeding.',
  'Do you want a hug and a listener, or some strategy brainstorm?',
  'Tell me what mode you need right now: empathy or action steps?',
  '90% of the time people need empathy first, solutions second.',
  '{"mode check","listening","troubleshooting","clarity"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'lv-07',
  'Acknowledging when their perspective helped you grow',
  'LISTENING_AND_VALIDATION',
  'Listening & Validation',
  'After a hard conversation, you realize their challenge made you a better person.',
  'Express gratitude for constructive friction.',
  'Even though that talk was hard for me to hear yesterday, I want to thank you for bringing it up. You helped me see a blind spot I had, and I appreciate your honesty.',
  'Reinforces that honesty is safe and celebrated in your relationship.',
  'Thank you for being brave enough to tell me the truth yesterday. It helped me grow.',
  'You were right to call me out on that. I learned something important about myself.',
  'Name the exact blind spot (e.g. interrupting, rushing plans).',
  '{"growth","blind spots","gratitude","maturity"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'lv-08',
  'Validating when a partner feels grief or nostalgia',
  'LISTENING_AND_VALIDATION',
  'Listening & Validation',
  'Your partner is mourning a lost loved one, an old phase of life, or a milestone.',
  'Sit alongside grief without rushing them to cheer up.',
  'There''s no timeline on grief, and you don''t have to put on a brave face with me. It is completely okay to feel sad today, and I''m right here beside you.',
  'Gives permission for sadness to exist without treating it as an emergency to fix.',
  'It''s okay to cry, love. I''m right here holding your hand.',
  'Take all the space you need for this grief. I''m with you through it.',
  'Resist the urge to offer silver linings or optimistic cliches.',
  '{"grief","sadness","holding space","compassion"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'lv-09',
  'Reframing their complaint as a hidden longing',
  'LISTENING_AND_VALIDATION',
  'Listening & Validation',
  'Your partner says "You never spend time with me anymore!" with frustration.',
  'Hear the desire for connection beneath the prickly complaint.',
  'Beneath the frustration, what I''m hearing is that you miss me and want more quality time together. That means a lot to me, and I want that too. Let''s look at our calendar.',
  'Transforms criticism into an invitation for intimacy by answering the deeper attachment longing.',
  'You miss me, don''t you? I miss you too. Let''s make time tonight.',
  'I hear that you want more quality time. Let''s set a date right now.',
  'Smile softly to communicate that you see their love beneath the sharp words.',
  '{"hidden longing","complaints","attachment","Gottman"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'lv-10',
  'Validating when a partner is experiencing imposter syndrome',
  'LISTENING_AND_VALIDATION',
  'Listening & Validation',
  'Your partner got promoted or took a risk and feels like a fraud.',
  'Remind them of their real strengths without dismissing their fear.',
  'It makes sense that taking this big leap feels terrifying—any meaningful growth feels like that. But I see your resilience and dedication every day, and you earned this seat at the table.',
  'Validates fear as a natural byproduct of growth while holding up a mirror to their real character.',
  'You''ve worked so hard for this, love. The fear is just proof of how much you care.',
  'You are not a fraud. You have the skills and the heart for this job. I believe in you.',
  'Cite 1 specific past accomplishment where they overcame similar doubts.',
  '{"imposter syndrome","career","encouragement","strengths"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'tt-01',
  'Offering radical transparency after a breach of trust',
  'TRUST_AND_TRANSPARENCY',
  'Trust & Transparency',
  'You hid something, lied, or crossed a boundary, and want to rebuild broken trust.',
  'Take proactive accountability with zero defensiveness.',
  'I know I broke your trust, and I understand that words alone won''t fix it. I am committed to complete transparency: my schedule, my phone, and my thoughts are open to you for as long as you need to feel safe again.',
  'Recognizes that trust requires verifiable behavioral transparency over time, not just apologies.',
  'I broke your faith in me, and I will do whatever it takes to help you feel safe again.',
  'I take full responsibility for lying. I am giving you complete transparency going forward.',
  'Never complain about being asked questions during the rebuilding phase.',
  '{"trust","betrayal","transparency","accountability"}'::text[],
  'direct',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'tt-02',
  'Asking for clarity when something doesn’t add up',
  'TRUST_AND_TRANSPARENCY',
  'Trust & Transparency',
  'A story or explanation feels inconsistent and your intuition is tingling.',
  'Ask for clarity directly without being accusatory.',
  'Something in this story feels inconsistent to me, and it''s making me feel uneasy. Because I value honesty in our relationship, can you walk me through the timeline again so we can clear this up?',
  'States your internal discomfort directly while giving them an open invitation to explain.',
  'I''m feeling a little confused about how that happened. Can you help me understand the timeline?',
  'Those two explanations contradict each other. I need the straightforward truth.',
  'Stick to objective facts and timelines rather than speculating on motives.',
  '{"honesty","inconsistency","clarity","truth"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'tt-03',
  'Admitting a mistake before your partner discovers it',
  'TRUST_AND_TRANSPARENCY',
  'Trust & Transparency',
  'You overspent, dented the car, or made an error that your partner hasn’t noticed yet.',
  'Disclose upfront to build unshakeable credibility.',
  'I want to tell you something before you hear it or see it elsewhere. I made a mistake today—I [describe fact]. I wanted to be honest with you immediately because hiding things from you is something I never want to do.',
  'Proactive confession is the single highest-integrity act in relationship communication.',
  'I messed up today, and I wanted to come clean to you right away. Here''s what happened.',
  'I made a mistake with [topic]. I''m telling you directly so we can deal with it together.',
  'Disclose within hours of the event occurring.',
  '{"integrity","proactive honesty","confession","credibility"}'::text[],
  'direct',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'tt-04',
  'Expressing lingering anxiety during the trust-rebuilding phase',
  'TRUST_AND_TRANSPARENCY',
  'Trust & Transparency',
  'Your partner has been trying hard, but an unexpected wave of suspicion hits you.',
  'Share the fear without erasing their positive progress.',
  'I see the effort you''ve been putting in, and I appreciate it. Today, a wave of fear hit me out of nowhere about what happened in the past. I wanted to share it with you so I don''t carry it alone in silence.',
  'Acknowledges their effort while allowing the non-linear reality of trauma recovery to be heard.',
  'I had a scary thought about the past today. Can you just hold me and remind me we''re okay?',
  'I''m experiencing triggers today about our past breach of trust. I need extra reassurance right now.',
  'Emphasize ''I see your effort'' so they don''t conclude that trying is hopeless.',
  '{"rebuilding trust","triggers","patience","healing"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'tt-05',
  'Setting a boundary around secret friendships or messaging',
  'TRUST_AND_TRANSPARENCY',
  'Trust & Transparency',
  'Your partner has an emotional friendship or text thread that they hide or delete.',
  'Define transparency around external relationships.',
  'In our relationship, secrecy around messaging or friendships destroys safety. If an interaction has to be hidden, deleted, or minimized, it crosses a boundary for me. I need complete openness about external connections.',
  'Defines emotional fidelity with precision: if it must be hidden, it is not safe.',
  'Secrecy makes me feel unsafe. I need us to be completely open about who we message.',
  'Deleting messages or keeping private friendships is unacceptable to me. We need open transparency.',
  'Ask: ''Would you be comfortable with me reading this thread in front of you?''',
  '{"infidelity","secrecy","boundaries","friendships"}'::text[],
  'direct',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'tt-06',
  'Acknowledging that forgiveness takes time and patience',
  'TRUST_AND_TRANSPARENCY',
  'Trust & Transparency',
  'Your partner apologized, but expects everything to return to 100% normal the next morning.',
  'Explain the difference between forgiveness and reconstructed trust.',
  'I forgive you in my heart and I want our relationship to heal. At the same time, trust is rebuilt in drops and lost in buckets. I need patience as my nervous system learns to feel completely secure again.',
  'Distinguishes forgiveness (a choice) from trust (a felt physiological safety built over time).',
  'I love you and want to heal, but I need time. Please be patient with me.',
  'Forgiveness doesn''t mean instant trust. Trust will take consistent action over months.',
  'Use the metaphor ''trust is rebuilt in drops and lost in buckets.''',
  '{"forgiveness","patience","rebuilding","trust"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'tt-07',
  'Creating an open-door policy for financial clarity',
  'TRUST_AND_TRANSPARENCY',
  'Trust & Transparency',
  'Secret credit cards or hidden debt have created financial fear in the relationship.',
  'Institute a mutual open-books agreement.',
  'I want our financial partnership to be completely free of secrets or hidden anxiety. Can we agree to an open-books policy where all accounts, debts, and major purchases over $100 are shared openly?',
  'Establishes a concrete, verifiable policy rather than vague promises to ''do better.''',
  'Let''s put all our financial cards on the table so neither of us has to worry in secret.',
  'I need complete transparency on all bank accounts and credit cards to stay in this partnership.',
  'Agree on an exact threshold amount (e.g. $100 or $250) for purchases requiring discussion.',
  '{"financial trust","debt","open books","security"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'tt-08',
  'Reaffirming your commitment after a difficult season',
  'TRUST_AND_TRANSPARENCY',
  'Trust & Transparency',
  'You survived an intense storm or near-breakup and are coming out the other side.',
  'Re-anchor your dedication to the relationship.',
  'We''ve walked through fire over the last few months, and it tested both of us. Seeing how we fought for each other made me love you even deeper. I am fully committed to building our future together.',
  'Frames adversity as proof of shared resilience rather than proof of fundamental incompatibility.',
  'We made it through the hardest part, love. I''m so proud of us and so committed to you.',
  'That season tested us, but I choose you today with complete clarity. Let''s build forward.',
  'Plan a small celebratory ritual to mark the closing of the painful chapter.',
  '{"commitment","resilience","hard times","re-anchor"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'tt-09',
  'Asking your partner to stop interrogating you after repair is done',
  'TRUST_AND_TRANSPARENCY',
  'Trust & Transparency',
  'You took full accountability, made restitution, but your partner continues to interrogate you repeatedly.',
  'Ask for mutual commitment to move forward rather than perpetual punishment.',
  'I took full responsibility for my mistake and have lived with total transparency. When I''m questioned repeatedly about things we resolved, it feels like I''m serving a life sentence rather than rebuilding a partnership. How can we transition into healing together?',
  'Addresses perpetual punishment while maintaining commitment to healthy healing.',
  'I want to keep building with you, but I need us to look forward rather than re-prosecuting the past.',
  'I cannot stay in a dynamic where I am perpetually interrogated. We need to decide if we are healing or staying stuck.',
  'Only use this if you have genuinely provided months of verifiable consistency.',
  '{"interrogation","closure","healing","forward momentum"}'::text[],
  'direct',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'tt-10',
  'Thanking a partner for choosing honesty over an easy lie',
  'TRUST_AND_TRANSPARENCY',
  'Trust & Transparency',
  'Your partner told you an uncomfortable truth that would have been easier to conceal.',
  'Reward honesty to reinforce safety for future transparency.',
  'Thank you for telling me the truth about that, even though you knew it was uncomfortable. Hearing honesty from you matters more to me than perfection, and it makes me trust you even more.',
  'Psychological positive reinforcement: proves that honesty brings safety, not punishment.',
  'I appreciate your honesty so much, honey. It means everything to me.',
  'You chose integrity over an easy excuse today. Thank you. That builds real trust.',
  'Never punish someone for being honest after the fact.',
  '{"reinforcement","rewarding honesty","trust building","gratitude"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'ai-01',
  'Initiating physical touch with zero sexual pressure',
  'AFFECTION_AND_INTIMACY',
  'Affection & Intimacy',
  'Physical touch has become associated only with sex, causing the lower-desire partner to pull away.',
  'Rebuild safe, non-demanding touch and affection.',
  'Can I just hold your hand and rest my head on your shoulder? Zero expectations for anything else tonight—I just want to feel your warmth.',
  'De-escalates performance fear, allowing intimacy to rebuild naturally.',
  'Just want to cuddle for five minutes. No agenda at all.',
  'I want non-sexual affection tonight. Let''s cuddle on the sofa.',
  'Keep hand placement neutral and non-erogenous to reinforce safety.',
  '{"touch","affection","cuddling","safety"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'ai-02',
  'Declining sexual intimacy with love and reassurance',
  'AFFECTION_AND_INTIMACY',
  'Affection & Intimacy',
  'Your partner initiates sex, but you are physically exhausted or not in the mood.',
  'Say no without triggering feelings of rejection or inadequacy.',
  'I love that you desire me and find me attractive, and that means so much to me. My body is just physically exhausted tonight. Can we snuggle close instead, and let''s find time tomorrow when I have real energy?',
  'Validates their desire first, names physical exhaustion, and offers a future rain check.',
  'I''m so exhausted tonight, love. Can we cuddle now and make time for each other this weekend?',
  'I''m not up for sex tonight, but I love being close to you. Let''s reconnect tomorrow.',
  'Always follow through on the rain check to prevent rejection spirals.',
  '{"saying no","rejection","libido","rain check"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'ai-03',
  'Expressing a desire to explore new things in intimacy',
  'AFFECTION_AND_INTIMACY',
  'Affection & Intimacy',
  'Bedroom routines have become predictable and you want to introduce novelty.',
  'Introduce curiosity without criticizing your existing sex life.',
  'I love our intimacy, and because I feel so safe with you, I''d love for us to explore some new things together. What is something you''ve always had curiosity about in the bedroom that we haven''t tried?',
  'Starts with the safety of existing intimacy, then asks about THEIR curiosity first.',
  'I love being close with you. What''s a fantasy you''ve wondered about lately?',
  'I want to add some playfulness and novelty to our sex life. Let''s discuss ideas we''d both enjoy.',
  'Focus on curiosity and play rather than performance or technique.',
  '{"novelty","intimacy","exploration","bedroom"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'ai-04',
  'Talking about needing more emotional foreplay before sex',
  'AFFECTION_AND_INTIMACY',
  'Affection & Intimacy',
  'Your partner jumps straight to physical initiation without emotional connection during the day.',
  'Explain how emotional connection unlocks physical arousal.',
  'For my body to feel genuinely aroused, it starts hours before the bedroom with laughing, texting, and feeling emotionally connected throughout the day. When we have that warmth, physical intimacy feels so natural for me.',
  'Educates your partner on your arousal blueprint without criticizing their technique.',
  'I love when we flirt during the day. It makes bedtime with you so much more exciting.',
  'I need emotional connection and warmth during the day to feel in the mood at night.',
  'Give an example of a daytime gesture (e.g. sweet text, gentle kiss before leaving) that turns you on.',
  '{"foreplay","emotional connection","arousal","intimacy"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'ai-05',
  'Praising what your partner did in the bedroom',
  'AFFECTION_AND_INTIMACY',
  'Affection & Intimacy',
  'Your partner did something especially wonderful during intimacy and you want more of it.',
  'Provide positive sexual reinforcement outside the bedroom.',
  'I couldn''t stop thinking about what you did last night. When you [mention specific action], it made me feel so desired and close to you. You are incredible at that.',
  'Positive reinforcement outside the bedroom dramatically boosts sexual confidence and frequency.',
  'Last night was amazing. You made me feel so loved and wanted.',
  'What you did last night was fantastic. Let''s do that more often.',
  'Send this as a spicy daytime text message while they are at work.',
  '{"sexual praise","affirmation","intimacy","pleasure"}'::text[],
  'direct',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'ai-06',
  'Discussing sex after having a baby or during major body transitions',
  'AFFECTION_AND_INTIMACY',
  'Affection & Intimacy',
  'Postpartum recovery, hormonal changes, or menopause have altered physical comfort.',
  'Navigate physiological changes as a loving team.',
  'My body has gone through significant hormonal and physical changes recently, and intimacy feels different right now. I want us to take things slow and gentle so we can rediscover pleasure without pain or pressure.',
  'Treats biological reality with scientific self-compassion, removing shame.',
  'My body needs extra patience right now. Let''s take things very slow tonight.',
  'We need to adjust our physical pace. My body requires more time and gentleness right now.',
  'Incorporate lubrication and slow sensual massage to remove physical friction.',
  '{"postpartum","hormones","patience","intimacy"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'ai-07',
  'Expressing that you feel like sex is just a routine checklist',
  'AFFECTION_AND_INTIMACY',
  'Affection & Intimacy',
  'Intimacy has become predictable Saturday night maintenance sex.',
  'Inject soul, passion, and true presence back into intimacy.',
  'I miss the passion where we genuinely lose track of time together. Lately intimacy has felt a little hurried and routine. I want us to slow down, look into each other''s eyes, and really be present together.',
  'Expresses longing for deep presence rather than mechanical performance.',
  'Let''s slow things way down tonight. I want to feel your soul, not just check a box.',
  'Our intimacy feels like routine maintenance. I want us to bring real passion back.',
  'Light candles and turn off all overhead lighting to slow down sensory pacing.',
  '{"passion","maintenance sex","presence","spark"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'ai-08',
  'Asking for eye contact and verbal connection during sex',
  'AFFECTION_AND_INTIMACY',
  'Affection & Intimacy',
  'Your partner closes their eyes or stays silent, leaving you feeling isolated during lovemaking.',
  'Deepen emotional attunement during intimate moments.',
  'When we''re intimate, looking into your eyes and hearing your voice makes me feel ten times closer to you. Can you look at me right now?',
  'Gentle in-the-moment guidance that turns physical sex into emotional union.',
  'Look at me, love. I want to see your eyes.',
  'Stay with me emotionally. Keep your eyes on mine.',
  'Whisper this softly while holding their face with both hands.',
  '{"eye contact","attunement","presence","deep intimacy"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'ai-09',
  'Talking about feeling rejected when attempts at affection are dodged',
  'AFFECTION_AND_INTIMACY',
  'Affection & Intimacy',
  'You reached out for a hug or kiss and your partner stiffened or turned away.',
  'Share the sting of rejection without starting a fight.',
  'When I reached for your hand earlier and you pulled away, it stung and left me feeling rejected. I know you might have been distracted, but physical rejection hurts. What was happening for you in that moment?',
  'Describes the impact clearly, then asks with curiosity about their internal state.',
  'Did I catch you at a bad time earlier? When you pulled away from my hug, it made me sad.',
  'Pulling away from my touch hurts. If you''re overwhelmed, tell me with words instead of turning away.',
  'Ask what kind of touch feels good when they are stressed.',
  '{"rejection","affection","bids for connection","Gottman"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'ai-10',
  'Flirting during the day to build anticipation for the evening',
  'AFFECTION_AND_INTIMACY',
  'Affection & Intimacy',
  'You want to build romantic excitement hours before you see each other.',
  'Create erotic tension and anticipation through text.',
  'Just walked past our bed and thought of you. Counting down the hours until tonight.',
  'Short, confident, playful, and lets them know they are desired across distance.',
  'Thinking of you today, handsome/beautiful. Can''t wait to see you tonight.',
  'You and me tonight. Clear your schedule after 9.',
  'Send when you know they have a quiet lunch break so they can savor the message.',
  '{"flirting","texting","anticipation","romance"}'::text[],
  'direct',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'tp-01',
  'Asking for 15 minutes of uninterrupted daily check-in',
  'TIME_AND_PRIORITIES',
  'Time, Attention & Priorities',
  'You talk only about kids, bills, and logistics, never about each other’s inner worlds.',
  'Institute Gottman''s classic daily "stress-reducing conversation."',
  'Can we institute a 15-minute ritual every evening after dinner with tea, no phones, just asking ''How was your day on the inside?'' It would mean the world to our connection.',
  'Small, measurable commitment that prevents the slow drift into emotional distance.',
  'Can we take just 10 minutes tonight to sit on the porch and talk about our day?',
  'We need 15 minutes of dedicated daily conversation without screens. Let''s make it a daily rule.',
  'Set a recurring alarm on both phones named ''Our 15 Minutes.''',
  '{"daily ritual","quality time","stress reduction","connection"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'tp-02',
  'Addressing feeling second to their friends or hobbies',
  'TIME_AND_PRIORITIES',
  'Time, Attention & Priorities',
  'Your partner has endless energy for golf, gaming, or happy hours, but zero energy for you.',
  'Address priority imbalance without demanding they abandon their passions.',
  'I love that you have passions and friends that light you up. What hurts is when it feels like they get the enthusiastic, energized version of you, while I get the exhausted leftovers at the end of the day. I want us to have prime-time energy too.',
  'The ''prime-time vs leftovers'' distinction is poignant and hard to argue against.',
  'I miss having fun with you. Can we plan something exciting where we have real energy for each other?',
  'I feel like a low priority compared to your hobbies. I need us to dedicate prime energy to our relationship.',
  'Suggest scheduling your date night before their hobby day.',
  '{"priorities","hobbies","friends","leftover energy"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'tp-03',
  'Negotiating calendar commitments before saying yes to others',
  'TIME_AND_PRIORITIES',
  'Time, Attention & Priorities',
  'Your partner commits you both to weekend social events without consulting you.',
  'Establish the "two yeses, one no" rule for joint social calendar.',
  'Can we agree on a standard policy going forward? Before either of us commits our joint weekend to friends or family, we check in with each other first. It ensures we both feel respected.',
  'Creates a reciprocal rule that protects both people equally.',
  'Could you ask me before RSVPing for both of us next time? I want to make sure I have energy.',
  'Do not commit my time without asking me first. We need to agree together before saying yes.',
  'Use the phrase ''Let me check with my partner and get back to you'' as the automatic response.',
  '{"calendar","social commitments","respect","boundaries"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'tp-04',
  'Asking your partner to be on time without nagging',
  'TIME_AND_PRIORITIES',
  'Time, Attention & Priorities',
  'Your partner is chronically 20 minutes late, causing you intense stress before events.',
  'Address lateness as an issue of emotional respect rather than scheduling.',
  'When we run late, my nervous system gets spiked with anxiety. Being on time helps me feel calm and respected. If we need to leave at 6:30, what can I do to help us walk out the door at 6:30?',
  'Explains the internal impact (anxiety spike) and offers partnership rather than scolding.',
  'Running late stresses me out. Can we aim to be in the car ten minutes early today?',
  'Chronic lateness is disrespectful to my time. We need to leave on time today.',
  'Agree on the ''shoes on and keys in hand'' departure time, not just the event start time.',
  '{"punctuality","lateness","respect","anxiety"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'tp-05',
  'Communicating that overtime work is harming the relationship',
  'TIME_AND_PRIORITIES',
  'Time, Attention & Priorities',
  'Your partner is working 70-hour weeks and has vanished emotionally from home.',
  'Raise the relationship cost of workaholism with love and urgency.',
  'I know you are pushing hard for our future financial security, and I appreciate your sacrifice. But our relationship is paying the cost in the present. I don''t want a comfortable future if it means losing our closeness now. Can we talk about realistic boundaries on work?',
  'Validates their financial intention while challenging the trade-off of sacrificing the present.',
  'I miss you so much. Work is swallowing our life right now. Can we find a way to step back a little?',
  'Your work hours are actively damaging our marriage. We need to set a limit on late nights.',
  'Acknowledge their hard work first so they don''t feel unappreciated.',
  '{"workaholism","overtime","balance","sacrifices"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'tp-06',
  'Asking for help so you can pursue your personal goals',
  'TIME_AND_PRIORITIES',
  'Time, Attention & Priorities',
  'You want to take a class, go to the gym, or launch a project, but family tasks keep you stuck.',
  'Request practical spousal support for your personal evolution.',
  'There''s a fitness goal/class that is really important for my mental health and growth. For me to do it, I need you to take solo ownership of the kids on Tuesday evenings from 6 to 8. Can you support me in making that space?',
  'Very clear, concrete request tied directly to mental well-being and growth.',
  'I''d love to take a class on Tuesdays. Could you cover the evening routine for me?',
  'I need dedicated time for my personal goals. I need you to cover Tuesday nights from 6 to 8.',
  'Offer to reciprocate by giving them an equivalent solo evening on another day.',
  '{"personal growth","fitness","reciprocity","support"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'tp-07',
  'Ending an aimless conversation that has gone on too long',
  'TIME_AND_PRIORITIES',
  'Time, Attention & Priorities',
  'A discussion has been going in circles for an hour and both of you are repeating yourselves.',
  'Wrap up gracefully with clear action steps.',
  'We''ve shared our perspectives thoroughly and I think we''re starting to repeat ourselves now. Let''s summarize our one action step for tomorrow and pause here so we can rest.',
  'Cuts through conversational fatigue and prevents circular arguments from degrading into cruelty.',
  'I think we''ve covered a lot of ground tonight, love. Let''s sleep on it and see how we feel tomorrow.',
  'We are talking in circles. Let''s agree on step one and end this conversation for tonight.',
  'Always summarize the agreed action step in one sentence before stopping.',
  '{"circular talks","closure","fatigue","next steps"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'tp-08',
  'Asking for equal participation in weekend chore sprints',
  'TIME_AND_PRIORITIES',
  'Time, Attention & Priorities',
  'You want to clean the house quickly together on Saturday morning so the rest of the weekend is free.',
  'Turn boring cleaning into an energized team sprint.',
  'Let''s put on a great playlist and do a concentrated 45-minute power clean together right now. If we both sprint, we can finish the whole house and have the entire rest of the weekend completely free.',
  'Fun, energizing, time-boxed (45 minutes), and clearly highlights the shared reward (free weekend).',
  'Want to do a quick 30-minute tidy up with me so we can relax for the rest of the day?',
  'Let''s knock out these chores together right now so we don''t spend all Saturday cleaning.',
  'Set a physical timer on the counter and blast upbeat music.',
  '{"chores","power clean","teamwork","weekends"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'tp-09',
  'Setting a boundary on work calls during vacation',
  'TIME_AND_PRIORITIES',
  'Time, Attention & Priorities',
  'You are on a beach vacation and your partner is taking Zoom calls all day.',
  'Protect vacation rest and couple connection.',
  'We saved money and took time off specifically to reconnect and rest. When work comes on vacation, it feels like we never left home. Can we agree to check emails only from 8:00 to 8:30 AM and keep the rest of the day sacred?',
  'Allows a 30-minute emergency window so their anxiety is soothed while protecting the rest of the day.',
  'I want you all to myself on this trip. Can we limit work to just a quick check in the morning?',
  'Work calls are ruining this vacation. We need to put the laptops away.',
  'Agreeing on a brief morning window is far more realistic than demanding total zero-tech.',
  '{"vacation","work boundary","travel","presence"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'tp-10',
  'Saying thank you for making time when life is chaotic',
  'TIME_AND_PRIORITIES',
  'Time, Attention & Priorities',
  'Your partner made effort to carve out 20 minutes for you amidst extreme work pressure.',
  'Express deep gratitude for prioritized connection.',
  'I know how crazy your schedule was today, and the fact that you still carved out time to sit with me means everything. Thank you for prioritizing us.',
  'Validates the sacrifice of their time, encouraging them to repeat it happily.',
  'Thank you for making time for me today. I love you so much.',
  'You made us a priority today amidst chaos. I noticed, and I appreciate it.',
  'Give a warm, unhurried kiss right after saying this.',
  '{"gratitude","appreciation","priorities","connection"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'ra-01',
  'Naming the loop out loud when it begins',
  'RECURRING_ARGUMENTS',
  'Recurring Arguments',
  'You feel the exact familiar tension rising that has caused 50 previous arguments.',
  'Interrupt the unconscious script before autopilot takes over.',
  'Wait—pause for a second. We are starting our usual loop right now. I start pushing, you start pulling away, and we both end up hurt. I don''t want to do that dance today. Can we stop and sit together?',
  'Externalizes the conflict pattern as an enemy outside the couple, uniting both people against the loop.',
  'We''re doing our dance again, love. Let''s take a breath so we don''t go down that road.',
  'This is our classic loop starting. I refuse to repeat it. Let''s pause.',
  'Give your recurring argument a neutral nickname (e.g. ''The Dish Dance'', ''The Sunday Loop'').',
  '{"loop","pattern interrupt","EFT","cycle"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'ra-02',
  'Separating the solvable problem from the perpetual difference',
  'RECURRING_ARGUMENTS',
  'Recurring Arguments',
  'You are fighting over an innate personality difference (e.g. neat freak vs relaxed, introvert vs extrovert).',
  'Accept the perpetual difference and shift to management rather than conversion.',
  'Gottman research shows that 69% of relationship conflicts are perpetual personality differences that can''t be ''solved,'' only managed with humor and respect. You are naturally more spontaneous, and I am naturally more structured. How do we live peacefully with this difference?',
  'Relieves the impossible pressure of trying to change your partner''s core personality.',
  'We are wired differently on this, and that''s okay. How can we make it work for both of us?',
  'Neither of us is going to change our basic personality. Let''s negotiate a compromise instead of trying to convert each other.',
  'Celebrate how their opposite trait actually benefits the relationship in other contexts.',
  '{"perpetual problems","personality","Gottman","compromise"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'ra-03',
  'Asking what their position represents on a deeper level',
  'RECURRING_ARGUMENTS',
  'Recurring Arguments',
  'You are gridlocked on a specific decision (e.g. spending holidays, moving, money).',
  'Explore the underlying dream or fear beneath their rigid position.',
  'We''ve been gridlocked on this decision for weeks. Let''s stop debating the logistics for ten minutes. What is the deeper dream, value, or fear that this position represents for you?',
  'Moves from stubborn tactical trench warfare to emotional storytelling, melting stalemates.',
  'Tell me what this really means to you on the inside. I want to understand your heart.',
  'Behind every stubborn position is a core value. What value are you protecting right now?',
  'Listen without debating for 5 minutes straight.',
  '{"gridlock","dreams within conflict","core values","stalemate"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'ra-04',
  'Admitting your role in keeping the argument alive',
  'RECURRING_ARGUMENTS',
  'Recurring Arguments',
  'Both of you have been stubborn and defensive for hours.',
  'Break the deadlock by stepping forward with personal humility.',
  'It takes two people to keep an argument going, and I can see my part in this: I got sarcastic, I dug my heels in, and I refused to hear you. I''m letting down my guard right now.',
  'Disarms the other person completely—it is impossible to fight someone who refuses to defend themselves.',
  'I''ve been stubborn today, and I''m sorry. I want to listen now.',
  'I contributed to this fight by being defensive. I''m dropping my weapons.',
  'Drop your physical posture (sit on the floor or lean back) as a physical surrender of hostility.',
  '{"humility","de-escalation","taking ownership","breakthrough"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'ra-05',
  'Proposing a 30-day experiment instead of a permanent commitment',
  'RECURRING_ARGUMENTS',
  'Recurring Arguments',
  'You can’t agree on a new system for budgeting, cooking, or weekend schedules.',
  'Lower the stakes from "forever" to a temporary test trial.',
  'We don''t have to agree to do this forever. Can we just agree to try this new system as a 30-day experiment? If either of us hates it after 30 days, we''ll sit down and redesign it.',
  'Removes the fear of being trapped in a permanent undesirable change.',
  'Let''s just try it for two weeks and see how it feels. No pressure after that.',
  'Let''s treat this as a 30-day test run. We will evaluate results on the 30th.',
  'Put an exact review date on the calendar so your partner knows it will be evaluated.',
  '{"experiment","compromise","testing","stalemate"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'ra-06',
  'Asking "What do you need most from me right now to feel better?"',
  'RECURRING_ARGUMENTS',
  'Recurring Arguments',
  'The fight has left your partner drained, tearful, or disoriented.',
  'Directly invite repair by asking for their needs.',
  'I want us to heal from this. Right now in this exact moment, what do you need most from me to feel a little more safe and cared for?',
  'Replaces guesswork with direct emotional inquiry, making them feel centered.',
  'What can I do right now to make you feel loved?',
  'What do you need from me right now to close this argument?',
  'Be ready to do whatever they ask (e.g. space, a hug, listening, tea).',
  '{"repair","needs","healing","attunement"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'ra-07',
  'Agreeing to disagree on non-essential opinions with humor',
  'RECURRING_ARGUMENTS',
  'Recurring Arguments',
  'You are fighting over a movie plot, a historical fact, or a taste preference.',
  'Inject laughter and release the need to win trivial arguments.',
  'You know what? I love you, and you have completely terrible taste in movies, and I am totally okay with that. Let''s agree to disagree before we waste our whole evening.',
  'Uses playful affectionate teasing to restore perspective on low-stakes disagreements.',
  'We are never going to agree on this silly thing, and that''s fine. I love you anyway.',
  'This is a trivial matter. Let''s drop it and enjoy our night.',
  'Only use this for non-values, low-stakes issues (movies, food, trivial details).',
  '{"humor","agree to disagree","perspective","lightness"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'ra-08',
  'Recognizing when hunger, fatigue, or low blood sugar is fueling the fight',
  'RECURRING_ARGUMENTS',
  'Recurring Arguments',
  'It’s 7:45 PM, dinner hasn’t happened, and tempers are flaring over nothing.',
  'Call out the HALT state (Hungry, Angry, Lonely, Tired).',
  'Timeout. Neither of us has eaten in six hours. We are biologically hangry and fighting over nonsense. Let''s eat some food first, and if we''re still upset after a meal, we can resume.',
  '90% of weeknight arguments evaporate after blood sugar is restored.',
  'Let''s eat something first, love. I think our empty stomachs are doing the talking.',
  'We are exhausted and hungry. We are pausing this until we''ve eaten.',
  'Hand them a piece of bread or fruit immediately.',
  '{"HALT","hunger","fatigue","biology"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'ra-09',
  'Asking a partner to restate your point so you know you were heard',
  'RECURRING_ARGUMENTS',
  'Recurring Arguments',
  'Your partner keeps refuting an argument you never actually made.',
  'Ensure mutual understanding before defending yourself again.',
  'I feel like you are answering an argument that I''m not actually making. Before you reply, can you tell me what you think my main point is? I want to make sure I explained myself clearly.',
  'Politely exposes the straw-man argument without being accusatory (''make sure I explained myself clearly'').',
  'Did I explain that poorly? What did it sound like I was saying to you?',
  'You are arguing against something I didn''t say. What do you think my point was?',
  'Take responsibility for potential lack of clarity to avoid sounding condescending.',
  '{"straw man","clarification","communication breakdown","clarity"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'ra-10',
  'Holding a scheduled weekly "State of the Union" meeting',
  'RECURRING_ARGUMENTS',
  'Recurring Arguments',
  'Issues pile up during the week and explode randomly on Friday nights.',
  'Create an organized, recurring container for regular relationship maintenance.',
  'Let''s adopt Gottman''s ''State of the Union'' meeting: every Sunday for 30 minutes, we start with 5 appreciations for each other, address one logistical issue, and plan our week. That way issues don''t leak out during dinner.',
  'Provides a predictable container so partners don''t walk on eggshells during the week.',
  'Can we do a cozy Sunday check-in over coffee to talk about what''s working and what needs tweaking?',
  'We need a structured weekly meeting. Sunday mornings, 30 minutes. Let''s start this week.',
  'Always start with five genuine appreciations before touching any complaints.',
  '{"state of the union","Gottman","weekly meeting","maintenance"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'af-01',
  'A complete four-part clinical apology',
  'APOLOGY_AND_FORGIVENESS',
  'Apologies & Forgiveness',
  'You made a clear mistake or hurt your partner and want to deliver a genuine repair.',
  'Deliver a gold-standard apology with zero excuses or "buts."',
  'I am genuinely sorry for speaking to you with disrespect yesterday. It was wrong, and you did not deserve that tone. I understand that it made you feel small and unsafe. Going forward, when I feel overwhelmed, I will take a 10-minute pause instead of snapping. Will you forgive me?',
  'Covers all four pillars: names the action, validates the impact, provides a concrete prevention plan, and asks for forgiveness.',
  'I''m so sorry, love. I was wrong to snap at you. I''m going to do better.',
  'I take 100% ownership. That was my mistake, and I have a clear plan so it won''t happen again.',
  'Never include the word ''but'' anywhere in your apology.',
  '{"apology","accountability","four-part apology","integrity"}'::text[],
  'direct',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'af-02',
  'Apologizing for being defensive instead of listening',
  'APOLOGY_AND_FORGIVENESS',
  'Apologies & Forgiveness',
  'Your partner brought up a concern earlier and you met them with walls and counter-attacks.',
  'Acknowledge your defensiveness and invite them to share again.',
  'When you brought that up earlier, my ego got in the way and I became defensive instead of being the supportive partner you deserve. I''m sorry for closing down. I''m ready to listen now with an open heart.',
  'Calls out your own ego, clearing the path for genuine repair.',
  'I''m sorry I got defensive earlier. You were right to speak up. Can you tell me again?',
  'My defensive reaction was wrong. I should have listened. What did you need me to hear?',
  'Sit in an open, relaxed posture without arms crossed.',
  '{"defensiveness","ego","repair","second chance"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'af-03',
  'Accepting an apology with grace without brushing it off as "fine"',
  'APOLOGY_AND_FORGIVENESS',
  'Apologies & Forgiveness',
  'Your partner gave you a sincere apology and you want to honor it gracefully.',
  'Receive the apology meaningfully instead of using dismissive phrases like "it’s fine."',
  'Thank you for that apology. Hearing you acknowledge the impact of what happened means a lot to me, and I appreciate your accountability. I accept your apology and I forgive you.',
  'Saying ''it''s fine'' minimizes your own feelings; accepting the apology honors both people''s dignity.',
  'Thank you for apologizing, love. That meant a lot to hear. I forgive you.',
  'I accept your apology. Thank you for owning your mistake directly.',
  'Don''t bring up the forgiven mistake again in future unrelated fights.',
  '{"accepting apology","grace","dignity","forgiveness"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'af-04',
  'Apologizing for breaking a promise or commitment',
  'APOLOGY_AND_FORGIVENESS',
  'Apologies & Forgiveness',
  'You promised to do something by Thursday and completely dropped the ball.',
  'Restore trust around reliability.',
  'I dropped the ball on my promise to take care of that today. There''s no excuse—I should have prioritized it. I am handling it right now, and I will set a calendar reminder next time so you don''t have to carry the burden of reminding me.',
  'Takes immediate corrective action while implementing a system to prevent recurrence.',
  'I''m so sorry I forgot that errand, honey. I''m doing it right this minute.',
  'I failed to follow through on my word. I am fixing it immediately.',
  'Fix the issue immediately before apologizing if possible.',
  '{"broken promise","reliability","follow through","action"}'::text[],
  'direct',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'af-05',
  'Asking for forgiveness when you don’t fully understand why they are hurt',
  'APOLOGY_AND_FORGIVENESS',
  'Apologies & Forgiveness',
  'You know your partner is hurt by something you said, but logically you don’t understand why.',
  'Prioritize their heart while seeking to understand the mechanism of pain.',
  'I can see that what I said caused you real pain, and for that impact, I am deeply sorry. I want to understand what it felt like on your end so I don''t accidentally repeat it. Can you help me see what it felt like from your side?',
  'Apologizes for the emotional impact without pretending to know something you don''t.',
  'I hate that I hurt you, even though I didn''t intend to. Help me understand how it felt.',
  'I am sorry for hurting you. Help me understand your perspective so I can avoid doing it again.',
  'Listen without saying ''Well, most people wouldn''t take it that way.''',
  '{"intent vs impact","humility","learning","empathy"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'af-06',
  'Expressing readiness to forgive while still needing time to feel normal',
  'APOLOGY_AND_FORGIVENESS',
  'Apologies & Forgiveness',
  'You are ready to let go of resentment, but your emotional energy is still recovering.',
  'Communicate forgiveness without faking cheerful enthusiasm.',
  'I want you to know that I forgive you and I am not holding a grudge. My heart is just still recovering its energy today. Please don''t mistake my quietness for anger—we are okay.',
  'Reassures your partner while granting yourself permission for quiet emotional healing.',
  'We are good, love. I just need a little time for my heart to feel light again.',
  'I have forgiven you. I just need some quiet space today to finish resetting.',
  'Give them a gentle kiss to reinforce that there is no lingering hostility.',
  '{"emotional recovery","forgiveness","honesty","no grudge"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'af-07',
  'Apologizing for bringing work or financial stress into the home',
  'APOLOGY_AND_FORGIVENESS',
  'Apologies & Forgiveness',
  'You walked in the door tense, slammed cupboards, and spoke curtly to everyone.',
  'Clean up the emotional pollution you brought into the shared home.',
  'I brought external stress into our home tonight and polluted our space with my bad mood. You and the kids did not deserve that energy. Let me wash my face, reset, and start our evening over properly.',
  'Uses the metaphor of ''emotional pollution,'' taking responsibility for household climate.',
  'I was irritable when I walked in, and I''m sorry. Let me reset and give you a proper hug.',
  'I took my work frustrations out on this house. That was wrong. I''m resetting right now.',
  'Literally walk back out the front door and walk back in with a smile.',
  '{"home climate","work stress","reset","family"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'af-08',
  'Apologizing for neglecting physical intimacy or affection',
  'APOLOGY_AND_FORGIVENESS',
  'Apologies & Forgiveness',
  'You have been distracted and haven’t kissed, hugged, or touched your partner in weeks.',
  'Acknowledge the physical drought and initiate closeness.',
  'I''ve been so wrapped up in logistics lately that I''ve neglected our physical connection and affection. You deserve to feel desired and adored every day. I''m sorry for letting that slip, and I want to change that tonight.',
  'Affirms that their desire to be touched and wanted is valid and beautiful.',
  'I''ve been awful at giving hugs lately. Come here—I miss your warmth.',
  'I have neglected our physical connection. I am sorry, and I am prioritizing it starting now.',
  'Pull them into a long 30-second hug right as you say this.',
  '{"affection drought","touch","desire","apology"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'af-09',
  'Apologizing for breaking an agreed budget limit',
  'APOLOGY_AND_FORGIVENESS',
  'Apologies & Forgiveness',
  'You bought something expensive without consulting your partner as agreed.',
  'Own the financial boundary breach and propose immediate restitution.',
  'I bought that item without discussing it with you, and that violated our agreement. I''m sorry for being impulsive. I can return it immediately, or I can cut from my personal discretionary fund to cover it. You decide.',
  'Offers immediate practical restitution (return it or cut personal fund), restoring partner agency.',
  'I shouldn''t have bought this without asking you first. I''m sorry. Should I return it?',
  'I broke our financial agreement. That was selfish. I will return it today if you want.',
  'Keep the receipt in your hand as you speak.',
  '{"financial breach","restitution","impulsive spending","accountability"}'::text[],
  'direct',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'af-10',
  'Closing an old argument permanently and releasing it forever',
  'APOLOGY_AND_FORGIVENESS',
  'Apologies & Forgiveness',
  'An old mistake keeps being resurrected whenever a new unrelated fight happens.',
  'Officially bury the past with mutual consent.',
  'We have apologized, forgiven, and rebuilt from that situation two years ago. Keeping it as ammunition in new fights prevents us from ever feeling safe. Can we make a sacred agreement right now to bury that topic permanently?',
  'Draws a line between past lessons and weaponized resentment, allowing true closure.',
  'Can we agree to leave that old memory in the past? It hurts us both every time it comes up.',
  'We cannot keep resurrecting that resolved issue. Let''s agree to bury it permanently today.',
  'Write the topic on a piece of paper and physically burn or shred it together as a ritual.',
  '{"closure","buried hatchet","forgiveness","no ammunition"}'::text[],
  'direct',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'fe-01',
  'Discussing the timeline for marriage or long-term commitment',
  'FUTURE_AND_EXPECTATIONS',
  'Future & Compatibility',
  'You have been dating for years and need clarity on whether marriage or commitment is happening.',
  'Ask for life timeline alignment with self-worth and clarity.',
  'I love our relationship and I see a future with you. At this stage in my life, I want to be heading toward marriage within the next couple of years. I''d love to know what your timeline and vision look like so we can see if our goals align.',
  'States your personal timeline with confidence without delivering a frantic ultimatum.',
  'Where do you see us in two years? I want to make sure we''re building toward the same dream.',
  'I am looking for marriage and commitment. What is your timeline for our future?',
  'Do this during a calm weekend coffee, not during an argument.',
  '{"marriage","commitment","timeline","future"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'fe-02',
  'Discussing whether to have children or how many',
  'FUTURE_AND_EXPECTATIONS',
  'Future & Compatibility',
  'You need to know if you are fundamentally aligned on kids before committing deeper.',
  'Explore parenthood desires with absolute, unvarnished honesty.',
  'Having children is a fundamental life fork in the road where there''s no halfway compromise. I want to share my honest feelings about having kids, and I want to hear yours with zero judgment.',
  'Acknowledges that parenting is a binary choice that requires radical truthfulness.',
  'How do you feel about kids these days? Let''s talk about what each of us genuinely wants.',
  'We need clarity on children. My desire is [state desire]. Where do you stand?',
  'Never assume someone will ''change their mind later.''',
  '{"kids","parenting","compatibility","family planning"}'::text[],
  'direct',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'fe-03',
  'Aligning on lifestyle inflation vs savings goals',
  'FUTURE_AND_EXPECTATIONS',
  'Future & Compatibility',
  'One partner wants luxury vacations and new cars; the other wants early retirement and emergency reserves.',
  'Find a middle path between enjoying today and securing tomorrow.',
  'We have different natural relationship with money: one of us values enjoying today''s fruits, and the other values safety for tomorrow. Both values are valid. How can we build a budget that gives us both some joy now and safety later?',
  'Validates both spending archetypes (Enjoyer vs Saver) as healthy when balanced.',
  'Let''s find a way to save for our future while still enjoying some fun trips today.',
  'We are clashing on spending. We need an agreed percentage for savings and for fun money.',
  'Create a ''no-questions-asked'' monthly allowance for each partner to spend guilt-free.',
  '{"money","lifestyle","savings","financial values"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'fe-04',
  'Discussing division of labor when one partner earns significantly more',
  'FUTURE_AND_EXPECTATIONS',
  'Future & Compatibility',
  'An income disparity is creating an unspoken hierarchy where the lower earner feels subordinate.',
  'Establish equal partnership dignity regardless of paycheck size.',
  'Even though our paychecks are different, our value in this partnership is 100% equal. I want to make sure neither of us feels entitled or diminished because of income. How can we ensure our contributions feel equally honored?',
  'Nips financial superiority in the bud and reinforces equal dignity.',
  'I want us to feel like equal teammates regardless of who brings in what amount of money.',
  'Income disparity is creating an unhealthy power dynamic. We are equal partners.',
  'Use ''our money'' language rather than ''my money / your money.''',
  '{"income disparity","equality","power dynamic","finances"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'fe-05',
  'Talking about aging parents and future caretaking plans',
  'FUTURE_AND_EXPECTATIONS',
  'Future & Compatibility',
  'Parents are getting older and you foresee caretaking or housing questions on the horizon.',
  'Start proactive long-term planning before a health crisis hits.',
  'As our parents age, I want us to be proactive about what caretaking and boundaries might look like in 5 or 10 years. What are your thoughts on supporting aging parents while keeping our marriage protected?',
  'Addresses a predictable life transition years before emotional crisis strikes.',
  'How do you see us handling our parents as they get older? Let''s start thinking about it.',
  'We need a plan for your/my parents'' care so we aren''t blindsided when a crisis occurs.',
  'Discuss both financial support and physical living arrangements.',
  '{"aging parents","elder care","future","family"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'fe-06',
  'Discussing religious or spiritual values and child-rearing',
  'FUTURE_AND_EXPECTATIONS',
  'Future & Compatibility',
  'You come from different faith or philosophical backgrounds and need an agreement for your children.',
  'Harmonize spiritual traditions without forcing conversion.',
  'Our spiritual traditions are both part of who we are. When it comes to raising our family, how can we expose our children to our values with respect rather than confusion?',
  'Treats dual backgrounds as a rich tapestry rather than a zero-sum religious war.',
  'How would you like to handle holidays and faith traditions with the kids?',
  'We need an agreement on religious education for our family.',
  'Focus on shared moral virtues (kindness, honesty) as the unifying common ground.',
  '{"religion","spirituality","faith","parenting"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'fe-07',
  'Addressing different social needs (Extrovert vs Introvert)',
  'FUTURE_AND_EXPECTATIONS',
  'Future & Compatibility',
  'One partner wants people over 4 nights a week; the other wants a fortress of solitude.',
  'Negotiate social rhythms that honor both nervous systems.',
  'Your extroversion brings so much fun into our life, and my introversion keeps our home grounded and peaceful. How can we structure our calendar so you get your social battery filled and I get my quiet recharge?',
  'Celebrates both traits as complementary strengths rather than annoying defects.',
  'Let''s plan two social nights and two quiet nights this week so we both get what we need.',
  'Our social calendar is too crowded for my battery. I need us to cap hosting to one night a week.',
  'Allow the extrovert partner to attend some events solo without guilt.',
  '{"introvert","extrovert","social battery","lifestyle"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'fe-08',
  'Discussing prenuptial agreements with love and pragmatism',
  'FUTURE_AND_EXPECTATIONS',
  'Future & Compatibility',
  'You want to discuss a prenup without implying you expect the marriage to fail.',
  'Frame legal planning as an act of loving mutual care.',
  'I view a prenup like car insurance: we hope to never use it, but having clear, loving agreements when we love each other most is the kindest thing we can do for our future. Can we talk about it openly?',
  'De-stigmatizes prenups by framing them as an act of love negotiated at your highest point of goodwill.',
  'Let''s talk through a prenuptial agreement calmly. It''s about protecting both of us.',
  'I require a prenuptial agreement before marriage. Let''s hire attorneys who can help us write one respectfully.',
  'Emphasize that the agreement must protect BOTH parties equally.',
  '{"prenup","legal","finances","marriage prep"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'fe-09',
  'Discussing differing political values with mutual respect',
  'FUTURE_AND_EXPECTATIONS',
  'Future & Compatibility',
  'Elections or current events are sparking hostility between differing political viewpoints.',
  'De-escalate political friction and prioritize relational love.',
  'We see certain political solutions differently, but I know the goodness of your character and the values you live out every day. Let''s make sure national headlines never destroy the kindness in our living room.',
  'Distinguishes abstract national rhetoric from the lived human character of your spouse.',
  'Let''s take a break from news and politics tonight. You are my partner and I love you.',
  'We are not going to agree on politics. Let''s agree to respect our differences and keep political debates out of our bedroom.',
  'Agree to a ''no cable news or political social media after 8 PM'' rule.',
  '{"politics","values","kindness","respect"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'fe-10',
  'Re-evaluating relationship agreements every New Year',
  'FUTURE_AND_EXPECTATIONS',
  'Future & Compatibility',
  'You want an annual tradition of renewing and refining your relationship vows and systems.',
  'Institute a positive annual renewal ritual.',
  'Just like any thriving organization updates its mission, let''s take a weekend getaway every January to celebrate our wins, renew our commitments, and tweak any systems that aren''t serving us.',
  'Turns relationship growth into an exciting annual celebration rather than an emergency fix.',
  'Can we plan a weekend getaway this winter just to dream and plan our next year together?',
  'Let''s do an annual relationship audit every January to keep our partnership thriving.',
  'Combine this with a romantic spa or cabin weekend.',
  '{"annual review","vision","long-term growth","tradition"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'dd-01',
  'Clarifying tone when a text message sounded cold or passive-aggressive',
  'DIGITAL_AND_DISTANCE',
  'Text & Digital Communication',
  'Your partner sent a short "Fine." or "K." and you are overthinking the tone.',
  'Clarify meaning over text without escalating into an essay.',
  'Text has no vocal tone—was that a happy ''fine'' or an upset ''fine''? Checking in with love before my brain writes a whole story!',
  'Lighthearted, transparent, and openly acknowledges the limits of digital messaging.',
  'Checking in: are we good? Just wanted to make sure my text didn''t sound wrong.',
  'Your text sounded cold. Are you upset about something or just busy?',
  'Use a warm emoji (❤️ or 😊) to visually signal non-defensiveness.',
  '{"texting","tone","misunderstanding","digital communication"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'dd-02',
  'Moving a texting argument to a voice call',
  'DIGITAL_AND_DISTANCE',
  'Text & Digital Communication',
  'Paragraphs are flying back and forth over iMessage or WhatsApp and tension is exploding.',
  'Halt text fighting immediately and switch to voice.',
  'This is too important for thumbs and screens. We are misunderstanding each other. I am calling you in two minutes so I can hear your voice and we can talk with kindness.',
  'Rule of thumb: Never fight over text. This script enforces that rule with loving leadership.',
  'Can I call you? I miss hearing your real voice—texts make everything sound harsh.',
  'Stop texting. I am calling you now. We do not fight over text.',
  'Immediately hit dial after sending this text.',
  '{"no text fighting","phone call","escalation","digital rules"}'::text[],
  'direct',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'dd-03',
  'Letting your partner know you are busy without triggering abandonment',
  'DIGITAL_AND_DISTANCE',
  'Text & Digital Communication',
  'You have back-to-back meetings and can’t reply to their midday messages.',
  'Provide a quick anchor so they don’t feel ignored.',
  'Heading into back-to-back meetings until 4:30 PM! Love you so much—will call you on my drive home at 5:00.',
  'Answers the three subconscious questions: What are you doing? Do you still love me? When will we talk next?',
  'Thinking of you! Crazy day at work today—can''t wait to hear your voice tonight.',
  'In meetings all afternoon. Will call you at 5.',
  'Takes 6 seconds to send and prevents 6 hours of anxiety.',
  '{"busy day","anchor","responsiveness","reassurance"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'dd-04',
  'Creating a long-distance virtual date ritual',
  'DIGITAL_AND_DISTANCE',
  'Text & Digital Communication',
  'You are living in different cities and FaceTime calls have turned into boring screen stares.',
  'Inject romance and novelty into long-distance video calls.',
  'Let''s do a real FaceTime date tonight: let''s both dress up, order the same style of Thai food, light a candle, and watch that documentary together at 8:00.',
  'Shared sensory experience (same food, candles, dress code) closes geographic distance.',
  'Want to have a dinner date over FaceTime tonight? Let''s both eat together at 8.',
  'Let''s plan a real virtual date night this Friday instead of just a casual check-in.',
  'Order their food delivery to their door as a romantic surprise.',
  '{"long distance","virtual date","FaceTime","romance"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'dd-05',
  'Expressing that you need more consistency in long-distance communication',
  'DIGITAL_AND_DISTANCE',
  'Text & Digital Communication',
  'Calls are erratic, texts go unanswered for 12 hours, and you feel adrift.',
  'Establish predictable rhythms of connection across miles.',
  'Long distance is hard enough, and when our calls are unpredictable, I feel disconnected from your daily world. Can we agree on set morning and bedtime check-in windows so we always know when we connect?',
  'Predictability is the oxygen of long-distance relationships.',
  'I miss you so much. Can we pick a fixed time every night for our phone calls?',
  'The current sporadic communication isn''t working for me. I need set daily call times.',
  'Account for time zone differences when setting the windows.',
  '{"long distance","predictability","rituals","consistency"}'::text[],
  'balanced',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'dd-06',
  'Asking your partner to put the phone on Do Not Disturb when together',
  'DIGITAL_AND_DISTANCE',
  'Text & Digital Communication',
  'A buzzing phone keeps lighting up the night stand or dinner table.',
  'Eliminate ambient digital interruptions.',
  'Can we both flip our phones onto Do Not Disturb mode for the next two hours? I want the outside world locked out while we''re together.',
  'Mutual commitment (''Can we BOTH'') feels romantic rather than punitive.',
  'Let''s put our phones on airplane mode for an hour and just be in our own little world.',
  'Please silence your phone. The vibrations are breaking our conversation.',
  'Make it a mutual game to see whose phone stays untouched the longest.',
  '{"do not disturb","digital detox","presence","quality time"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'dd-07',
  'Sending an unexpected text of gratitude during the day',
  'DIGITAL_AND_DISTANCE',
  'Text & Digital Communication',
  'Nothing is wrong; you just want to put a smile on their face while they work.',
  'Deposit emotional currency into your relational bank account.',
  'Just paused between tasks and thought of how lucky I am to have you as my partner. Thank you for being you.',
  'Random unexpected deposits of praise create high relational security.',
  'Thinking of you today, my love. Hope your afternoon is smooth and sweet.',
  'You are an incredible partner. Just wanted to remind you.',
  'Send randomly once every two weeks without asking for anything in return.',
  '{"appreciation text","emotional bank account","spontaneous","love"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'dd-08',
  'Asking your partner to stop checking read receipts or tracking location obsessively',
  'DIGITAL_AND_DISTANCE',
  'Text & Digital Communication',
  'Your partner monitors your blue read checks or "Find My" location and questions your every move.',
  'Set a healthy digital boundary against surveillance anxiety.',
  'When you question me about when I read a text or where my GPS pinged, it feels like surveillance rather than trust. I am faithful to you, and I need digital breathing room without constant tracking.',
  'Distinguishes loving connection from controlling digital surveillance.',
  'I get distracted during work and can''t always reply immediately. Please trust me and don''t worry about read receipts.',
  'The constant location and read receipt questioning needs to stop. It damages trust.',
  'Offer to turn off read receipts together to eliminate the anxiety trigger.',
  '{"surveillance","read receipts","digital boundaries","trust"}'::text[],
  'direct',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'dd-09',
  'Handling a partner who ghosts or stops replying when upset',
  'DIGITAL_AND_DISTANCE',
  'Text & Digital Communication',
  'Your partner abruptly leaves you on read for 24 hours after a disagreement.',
  'Call out digital stonewalling while maintaining your dignity.',
  'Leaving me on read for 24 hours when we disagree is digital stonewalling, and it creates severe anxiety rather than resolution. If you need space, tell me with words. Silence without explanation is not acceptable.',
  'Clear, dignified, and demands verbal communication over punitive digital silence.',
  'If you need space, just tell me ''I need space until tomorrow.'' Leaving me in total silence hurts.',
  'Digital stonewalling is toxic to our relationship. Tell me when you will be ready to speak.',
  'Do not send 20 panic texts in response; send this single clear boundary text.',
  '{"stonewalling","on read","silence","digital boundary"}'::text[],
  'direct',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  'dd-10',
  'Celebrating the countdown to reunion in long-distance',
  'DIGITAL_AND_DISTANCE',
  'Text & Digital Communication',
  'The long-distance trip is finally coming to an end in 3 days.',
  'Build magnetic excitement for reunion.',
  '72 hours until I''m holding you at the airport gate. Get ready for the longest hug of your life.',
  'Concrete countdown creates shared celebratory momentum.',
  'Three more sleeps until you''re in my arms! Counting down every second.',
  '3 days left. The hardest part is over. See you Friday.',
  'Send a photo of the two of you from your last reunion.',
  '{"reunion","long distance","countdown","anticipation"}'::text[],
  'gentle',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_name = EXCLUDED.category_name,
  situation = EXCLUDED.situation,
  communication_goal = EXCLUDED.communication_goal,
  main_script = EXCLUDED.main_script,
  why_it_works = EXCLUDED.why_it_works,
  softer_version = EXCLUDED.softer_version,
  direct_version = EXCLUDED.direct_version,
  personalization_advice = EXCLUDED.personalization_advice,
  search_tags = EXCLUDED.search_tags,
  tone = EXCLUDED.tone,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc'::text, now());

-- Finished complete schema and seeding.
