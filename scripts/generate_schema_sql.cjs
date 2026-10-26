// ==============================================================================
// Generate Complete Supabase Setup SQL & Migration
// ==============================================================================

const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '../web-app/src/data/scriptsLibrary.ts'), 'utf8');
const startIdx = content.indexOf('export const SCRIPTS_LIBRARY: ScriptRecord[] = [');
const endIdx = content.indexOf('];\n\n// Helper functions');
const rawArray = content.slice(startIdx + 'export const SCRIPTS_LIBRARY: ScriptRecord[] = '.length, endIdx + 1);
const vm = require('vm');
const sandbox = { library: null };
vm.runInNewContext('library = ' + rawArray, sandbox);

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

function escapeSqlArray(arr) {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return "'{}'::text[]";
  const escapedElements = arr.map(item => '"' + item.replace(/"/g, '\\"') + '"');
  return "'{" + escapedElements.join(',') + "}'::text[]";
}

const header = `-- ==============================================================================
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
`;

let scriptInserts = [];
for (const s of sandbox.library) {
  scriptInserts.push(`INSERT INTO public.communication_scripts (
  id, title, category, category_name, situation, communication_goal, main_script, why_it_works, softer_version, direct_version, personalization_advice, search_tags, tone, is_published
) VALUES (
  ${escapeSql(s.id)},
  ${escapeSql(s.title)},
  ${escapeSql(s.category)},
  ${escapeSql(s.categoryName)},
  ${escapeSql(s.situation)},
  ${escapeSql(s.goal)},
  ${escapeSql(s.script)},
  ${escapeSql(s.whyItWorks)},
  ${escapeSql(s.softerVersion)},
  ${escapeSql(s.directVersion)},
  ${escapeSql(s.personalizationTip)},
  ${escapeSqlArray(s.tags)},
  ${escapeSql(s.tone)},
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
  updated_at = timezone('utc'::text, now());`);
}

const fullSql = header + '\n' + scriptInserts.join('\n\n') + '\n\n-- Finished complete schema and seeding.\n';

fs.writeFileSync(path.join(__dirname, '../supabase/COMPLETE_DATABASE_SETUP.sql'), fullSql, 'utf8');
fs.writeFileSync(path.join(__dirname, '../supabase/migrations/20261026020000_complete_production_schema.sql'), fullSql, 'utf8');

console.log('Successfully wrote supabase/COMPLETE_DATABASE_SETUP.sql (' + fullSql.length + ' bytes)');
console.log('Successfully wrote supabase/migrations/20261026020000_complete_production_schema.sql');
