-- ==============================================================================
-- HOW WE SPEAK — CORE PRODUCTION SCHEMA & ROW LEVEL SECURITY
-- Migration: 20261025000000_create_core_schema.sql
-- Description: Creates profiles, couples_spaces, workspace_invitations, 
--              rehearsal_plans, couples_exercises, private_reflections,
--              entitlements, and usage_records with strict RLS policies.
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. PROFILES TABLE ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    archetype TEXT NOT NULL DEFAULT 'Avoider',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ── 2. COUPLES SPACES TABLE ──────────────────────────────────────────────────
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

-- ── 3. WORKSPACE INVITATIONS TABLE ───────────────────────────────────────────
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

-- ── 4. REHEARSAL PLANS TABLE (INDIVIDUAL) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rehearsal_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    situation_raw TEXT NOT NULL,
    communication_goal TEXT NOT NULL,
    selected_tone TEXT NOT NULL,
    chosen_script TEXT NOT NULL,
    nervous_system_insight TEXT,
    practice_followups JSONB NOT NULL DEFAULT '[]'::jsonb,
    action_reminders JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_rehearsal_plans_user ON public.rehearsal_plans(user_id);

-- ── 5. COUPLES EXERCISES TABLE ───────────────────────────────────────────────
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

-- ── 6. PRIVATE REFLECTIONS TABLE ─────────────────────────────────────────────
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

-- ── 7. ENTITLEMENTS TABLE (COMMERCIAL ACCESS CONTROL) ────────────────────────
CREATE TABLE IF NOT EXISTS public.entitlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    customer_email TEXT NOT NULL,
    product_key TEXT NOT NULL CHECK (product_key IN ('trial', 'men-edition', 'women-edition', 'bundle', 'script-collection', 'sex-talk', 'workspace-pro')),
    source TEXT NOT NULL DEFAULT 'gumroad' CHECK (source IN ('gumroad', 'system_trial', 'admin', 'stripe')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'refunded', 'revoked')),
    valid_until TIMESTAMPTZ,
    gumroad_sale_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_entitlements_user ON public.entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_email ON public.entitlements(customer_email);
CREATE INDEX IF NOT EXISTS idx_entitlements_sale ON public.entitlements(gumroad_sale_id);

-- ── 8. USAGE RECORDS TABLE (AI USAGE AUDIT & RATE LIMITING) ──────────────────
CREATE TABLE IF NOT EXISTS public.usage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('ai_rehearsal', 'ai_followup', 'ai_joint_summary')),
    tokens_used INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_usage_records_user_created ON public.usage_records(user_id, created_at);

-- ── 9. HELPER FUNCTIONS & TRIGGERS ───────────────────────────────────────────

-- Automatic profile & trial provisioning upon Supabase Auth sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, archetype)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'archetype', 'Avoider')
    );

    -- Grant 3-rehearsal free trial entitlement
    INSERT INTO public.entitlements (user_id, customer_email, product_key, source, status)
    VALUES (
        NEW.id,
        NEW.email,
        'trial',
        'system_trial',
        'active'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Cryptographic couples invitation acceptance procedure
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

    -- Attach partner_2 to couples_spaces
    UPDATE public.couples_spaces
    SET partner_2_id = v_current_user_id,
        status = 'active',
        updated_at = timezone('utc'::text, now())
    WHERE id = v_invitation.space_id;

    -- Mark invitation accepted
    UPDATE public.workspace_invitations
    SET status = 'accepted',
        accepted_at = timezone('utc'::text, now())
    WHERE id = v_invitation.id;

    RETURN v_invitation.space_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 10. ROW LEVEL SECURITY (RLS) POLICIES ─────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rehearsal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;

-- 10.1 PROFILES POLICIES
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

-- 10.2 COUPLES SPACES POLICIES
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

-- 10.3 WORKSPACE INVITATIONS POLICIES
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

-- 10.4 REHEARSAL PLANS POLICIES (STRICT USER ISOLATION)
DROP POLICY IF EXISTS "rehearsal_plans_all" ON public.rehearsal_plans;
CREATE POLICY "rehearsal_plans_all" ON public.rehearsal_plans
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 10.5 COUPLES EXERCISES POLICIES
DROP POLICY IF EXISTS "couples_exercises_select" ON public.couples_exercises;
CREATE POLICY "couples_exercises_select" ON public.couples_exercises
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.couples_spaces cs
            WHERE cs.id = public.couples_exercises.space_id
              AND (cs.partner_1_id = auth.uid() OR cs.partner_2_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "couples_exercises_insert" ON public.couples_exercises;
CREATE POLICY "couples_exercises_insert" ON public.couples_exercises
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.couples_spaces cs
            WHERE cs.id = public.couples_exercises.space_id
              AND (cs.partner_1_id = auth.uid() OR cs.partner_2_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "couples_exercises_update" ON public.couples_exercises;
CREATE POLICY "couples_exercises_update" ON public.couples_exercises
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.couples_spaces cs
            WHERE cs.id = public.couples_exercises.space_id
              AND (cs.partner_1_id = auth.uid() OR cs.partner_2_id = auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.couples_spaces cs
            WHERE cs.id = public.couples_exercises.space_id
              AND (cs.partner_1_id = auth.uid() OR cs.partner_2_id = auth.uid())
        )
    );

-- 10.6 PRIVATE REFLECTIONS POLICIES (CORE PRIVACY BOUNDARY)
-- A user can ALWAYS read their own reflections.
-- A linked partner can ONLY read if is_shared is explicitly true.
DROP POLICY IF EXISTS "private_reflections_select" ON public.private_reflections;
CREATE POLICY "private_reflections_select" ON public.private_reflections
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid() OR (
            is_shared = true AND EXISTS (
                SELECT 1 FROM public.couples_spaces cs
                WHERE cs.id = public.private_reflections.space_id
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

-- 10.7 ENTITLEMENTS POLICIES (READ-ONLY FOR CLIENTS)
DROP POLICY IF EXISTS "entitlements_select_own" ON public.entitlements;
CREATE POLICY "entitlements_select_own" ON public.entitlements
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR customer_email = (auth.jwt()->>'email'));

-- Write access to entitlements is restricted exclusively to service_role (backend/webhooks)
DROP POLICY IF EXISTS "entitlements_write_blocked" ON public.entitlements;
CREATE POLICY "entitlements_write_blocked" ON public.entitlements
    FOR ALL TO authenticated
    USING (false)
    WITH CHECK (false);

-- 10.8 USAGE RECORDS POLICIES (READ-ONLY FOR CLIENTS)
DROP POLICY IF EXISTS "usage_records_select_own" ON public.usage_records;
CREATE POLICY "usage_records_select_own" ON public.usage_records
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Insertion and updates are performed strictly via backend service_role
DROP POLICY IF EXISTS "usage_records_write_blocked" ON public.usage_records;
CREATE POLICY "usage_records_write_blocked" ON public.usage_records
    FOR ALL TO authenticated
    USING (false)
    WITH CHECK (false);
