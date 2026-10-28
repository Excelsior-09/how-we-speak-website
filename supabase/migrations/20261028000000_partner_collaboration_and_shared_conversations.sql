-- ==============================================================================
-- HOW WE SPEAK — MIGRATION 20261028000000
-- Feature: Persistent Conversations, My Partner Collaboration & Shared Dialogue
-- ==============================================================================

-- ── 1. ENHANCE MIRA CONVERSATIONS FOR SHARED SPACES ──────────────────────────
ALTER TABLE public.mira_conversations
    ADD COLUMN IF NOT EXISTS is_shared BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS space_id UUID REFERENCES public.couples_spaces(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_mira_conversations_space ON public.mira_conversations(space_id);
CREATE INDEX IF NOT EXISTS idx_mira_conversations_shared ON public.mira_conversations(is_shared);

-- ── 2. CREATE CONVERSATION ANALYSES TABLE ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.conversation_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.mira_conversations(id) ON DELETE CASCADE,
    space_id UUID NOT NULL REFERENCES public.couples_spaces(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    analysis_type TEXT NOT NULL DEFAULT 'shared_dialogue_analysis',
    overview TEXT NOT NULL,
    partner_1_perspective TEXT,
    partner_2_perspective TEXT,
    misunderstandings JSONB NOT NULL DEFAULT '[]'::jsonb,
    shared_longings JSONB NOT NULL DEFAULT '[]'::jsonb,
    repair_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    clarifying_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    raw_analysis JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_analyses_conv ON public.conversation_analyses(conversation_id);
CREATE INDEX IF NOT EXISTS idx_analyses_space ON public.conversation_analyses(space_id);

ALTER TABLE public.conversation_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversation_analyses_select" ON public.conversation_analyses;
CREATE POLICY "conversation_analyses_select" ON public.conversation_analyses
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.couples_spaces cs
            WHERE cs.id = conversation_analyses.space_id
              AND (cs.partner_1_id = auth.uid() OR cs.partner_2_id = auth.uid())
              AND cs.status = 'active'
        )
    );

DROP POLICY IF EXISTS "conversation_analyses_insert" ON public.conversation_analyses;
CREATE POLICY "conversation_analyses_insert" ON public.conversation_analyses
    FOR INSERT TO authenticated
    WITH CHECK (
        requested_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.couples_spaces cs
            WHERE cs.id = space_id
              AND (cs.partner_1_id = auth.uid() OR cs.partner_2_id = auth.uid())
              AND cs.status = 'active'
        )
    );

DROP POLICY IF EXISTS "conversation_analyses_delete" ON public.conversation_analyses;
CREATE POLICY "conversation_analyses_delete" ON public.conversation_analyses
    FOR DELETE TO authenticated
    USING (
        requested_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.couples_spaces cs
            WHERE cs.id = conversation_analyses.space_id
              AND (cs.partner_1_id = auth.uid() OR cs.partner_2_id = auth.uid())
        )
    );

-- ── 3. UPDATED RLS POLICIES FOR MIRA CONVERSATIONS ─────────────────────────────
DROP POLICY IF EXISTS "mira_conversations_all" ON public.mira_conversations;
DROP POLICY IF EXISTS "mira_conversations_select" ON public.mira_conversations;
DROP POLICY IF EXISTS "mira_conversations_insert" ON public.mira_conversations;
DROP POLICY IF EXISTS "mira_conversations_update" ON public.mira_conversations;
DROP POLICY IF EXISTS "mira_conversations_delete" ON public.mira_conversations;

CREATE POLICY "mira_conversations_select" ON public.mira_conversations
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid()
        OR (
            is_shared = true
            AND space_id IS NOT NULL
            AND EXISTS (
                SELECT 1 FROM public.couples_spaces cs
                WHERE cs.id = mira_conversations.space_id
                  AND (cs.partner_1_id = auth.uid() OR cs.partner_2_id = auth.uid())
                  AND cs.status = 'active'
            )
        )
    );

CREATE POLICY "mira_conversations_insert" ON public.mira_conversations
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid()
        AND (
            is_shared = false
            OR (
                space_id IS NOT NULL
                AND EXISTS (
                    SELECT 1 FROM public.couples_spaces cs
                    WHERE cs.id = space_id
                      AND (cs.partner_1_id = auth.uid() OR cs.partner_2_id = auth.uid())
                      AND cs.status = 'active'
                )
            )
        )
    );

CREATE POLICY "mira_conversations_update" ON public.mira_conversations
    FOR UPDATE TO authenticated
    USING (
        user_id = auth.uid()
        OR (
            is_shared = true
            AND space_id IS NOT NULL
            AND EXISTS (
                SELECT 1 FROM public.couples_spaces cs
                WHERE cs.id = mira_conversations.space_id
                  AND (cs.partner_1_id = auth.uid() OR cs.partner_2_id = auth.uid())
                  AND cs.status = 'active'
            )
        )
    )
    WITH CHECK (
        user_id = auth.uid()
        OR (
            is_shared = true
            AND space_id IS NOT NULL
            AND EXISTS (
                SELECT 1 FROM public.couples_spaces cs
                WHERE cs.id = space_id
                  AND (cs.partner_1_id = auth.uid() OR cs.partner_2_id = auth.uid())
                  AND cs.status = 'active'
            )
        )
    );

CREATE POLICY "mira_conversations_delete" ON public.mira_conversations
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- ── 4. UPDATED RLS POLICIES FOR MIRA MESSAGES ─────────────────────────────────
DROP POLICY IF EXISTS "mira_messages_select" ON public.mira_messages;
DROP POLICY IF EXISTS "mira_messages_insert" ON public.mira_messages;
DROP POLICY IF EXISTS "mira_messages_update" ON public.mira_messages;
DROP POLICY IF EXISTS "mira_messages_delete" ON public.mira_messages;

CREATE POLICY "mira_messages_select" ON public.mira_messages
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.mira_conversations c
            WHERE c.id = mira_messages.conversation_id
              AND (
                  (c.is_shared = false AND c.user_id = auth.uid())
                  OR
                  (c.is_shared = true AND EXISTS (
                      SELECT 1 FROM public.couples_spaces cs
                      WHERE cs.id = c.space_id
                        AND (cs.partner_1_id = auth.uid() OR cs.partner_2_id = auth.uid())
                        AND cs.status = 'active'
                  ))
              )
        )
    );

CREATE POLICY "mira_messages_insert" ON public.mira_messages
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.mira_conversations c
            WHERE c.id = conversation_id
              AND (
                  (c.is_shared = false AND c.user_id = auth.uid())
                  OR
                  (c.is_shared = true AND EXISTS (
                      SELECT 1 FROM public.couples_spaces cs
                      WHERE cs.id = c.space_id
                        AND (cs.partner_1_id = auth.uid() OR cs.partner_2_id = auth.uid())
                        AND cs.status = 'active'
                  ))
              )
        )
    );

CREATE POLICY "mira_messages_update" ON public.mira_messages
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "mira_messages_delete" ON public.mira_messages
    FOR DELETE TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.mira_conversations c
            WHERE c.id = conversation_id AND c.user_id = auth.uid()
        )
    );

-- ── 5. STORED PROCEDURES FOR MY PARTNER COLLABORATION ─────────────────────────

-- 5.1 Create or Get Current Couples Space
CREATE OR REPLACE FUNCTION public.create_or_get_couples_space()
RETURNS jsonb AS $$
DECLARE
    v_user_id UUID;
    v_space RECORD;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    -- Look for an existing active space first
    SELECT * INTO v_space
    FROM public.couples_spaces
    WHERE (partner_1_id = v_user_id OR partner_2_id = v_user_id)
      AND status = 'active'
    ORDER BY updated_at DESC
    LIMIT 1;

    IF FOUND THEN
        RETURN to_jsonb(v_space);
    END IF;

    -- Look for a pending space created by this user
    SELECT * INTO v_space
    FROM public.couples_spaces
    WHERE partner_1_id = v_user_id
      AND status = 'pending_pair'
    ORDER BY created_at DESC
    LIMIT 1;

    IF FOUND THEN
        RETURN to_jsonb(v_space);
    END IF;

    -- Create a new pending space
    INSERT INTO public.couples_spaces (partner_1_id, status, room_name)
    VALUES (v_user_id, 'pending_pair', 'Our Communication Room')
    RETURNING * INTO v_space;

    RETURN to_jsonb(v_space);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.2 Create Partner Invitation
CREATE OR REPLACE FUNCTION public.create_partner_invitation()
RETURNS jsonb AS $$
DECLARE
    v_user_id UUID;
    v_space_id UUID;
    v_token TEXT;
    v_invitation RECORD;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to create partner invitation.';
    END IF;

    -- Find or create space
    SELECT id INTO v_space_id
    FROM public.couples_spaces
    WHERE partner_1_id = v_user_id OR partner_2_id = v_user_id
    ORDER BY (status = 'active') DESC, created_at DESC
    LIMIT 1;

    IF v_space_id IS NULL THEN
        INSERT INTO public.couples_spaces (partner_1_id, status, room_name)
        VALUES (v_user_id, 'pending_pair', 'Our Communication Room')
        RETURNING id INTO v_space_id;
    END IF;

    -- Check if active pending invitation already exists and is not expired
    SELECT * INTO v_invitation
    FROM public.workspace_invitations
    WHERE space_id = v_space_id
      AND inviter_id = v_user_id
      AND status = 'pending'
      AND expires_at > timezone('utc'::text, now())
    ORDER BY created_at DESC
    LIMIT 1;

    IF FOUND THEN
        RETURN to_jsonb(v_invitation);
    END IF;

    -- Generate secure random token
    v_token := 'hws_' || lower(replace(gen_random_uuid()::text, '-', ''));

    INSERT INTO public.workspace_invitations (
        space_id,
        inviter_id,
        token,
        status,
        expires_at
    )
    VALUES (
        v_space_id,
        v_user_id,
        v_token,
        'pending',
        timezone('utc'::text, now()) + interval '7 days'
    )
    RETURNING * INTO v_invitation;

    RETURN to_jsonb(v_invitation);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.3 Preview Partner Invitation (Safe public metadata for invited users)
CREATE OR REPLACE FUNCTION public.get_invitation_preview(invite_token TEXT)
RETURNS jsonb AS $$
DECLARE
    v_invitation RECORD;
    v_inviter RECORD;
BEGIN
    IF invite_token IS NULL OR trim(invite_token) = '' THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Missing invitation code.');
    END IF;

    SELECT * INTO v_invitation
    FROM public.workspace_invitations
    WHERE token = trim(invite_token);

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Invitation code not found.');
    END IF;

    IF v_invitation.status = 'revoked' THEN
        RETURN jsonb_build_object('valid', false, 'error', 'This invitation has been revoked by the sender.');
    END IF;

    IF v_invitation.status = 'accepted' THEN
        RETURN jsonb_build_object('valid', false, 'error', 'This invitation has already been accepted.');
    END IF;

    IF v_invitation.expires_at <= timezone('utc'::text, now()) THEN
        RETURN jsonb_build_object('valid', false, 'error', 'This invitation has expired.');
    END IF;

    SELECT display_name, archetype INTO v_inviter
    FROM public.profiles
    WHERE id = v_invitation.inviter_id;

    RETURN jsonb_build_object(
        'valid', true,
        'inviter_name', COALESCE(v_inviter.display_name, 'Your Partner'),
        'inviter_archetype', COALESCE(v_inviter.archetype, 'Partner'),
        'expires_at', v_invitation.expires_at,
        'token', v_invitation.token
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.4 Enhanced Secure Invitation Acceptance
CREATE OR REPLACE FUNCTION public.accept_couples_invitation(invite_token TEXT)
RETURNS UUID AS $$
DECLARE
    v_invitation RECORD;
    v_current_user_id UUID;
    v_target_space_id UUID;
BEGIN
    v_current_user_id := auth.uid();
    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to accept invitations.';
    END IF;

    SELECT * INTO v_invitation
    FROM public.workspace_invitations
    WHERE token = trim(invite_token)
      AND status = 'pending'
      AND expires_at > timezone('utc'::text, now());

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid, expired, or previously accepted invitation code.';
    END IF;

    IF v_invitation.inviter_id = v_current_user_id THEN
        RAISE EXCEPTION 'You cannot accept your own invitation.';
    END IF;

    v_target_space_id := v_invitation.space_id;

    -- Deactivate any previous solitary pending space created by the accepting user
    UPDATE public.couples_spaces
    SET status = 'unlinked', updated_at = timezone('utc'::text, now())
    WHERE partner_1_id = v_current_user_id
      AND partner_2_id IS NULL
      AND status = 'pending_pair';

    -- Link into the invitation space as partner 2
    UPDATE public.couples_spaces
    SET partner_2_id = v_current_user_id,
        status = 'active',
        updated_at = timezone('utc'::text, now())
    WHERE id = v_target_space_id;

    -- Mark invitation accepted
    UPDATE public.workspace_invitations
    SET status = 'accepted',
        accepted_at = timezone('utc'::text, now())
    WHERE id = v_invitation.id;

    RETURN v_target_space_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.5 Disconnect Partner Relationship
CREATE OR REPLACE FUNCTION public.disconnect_partner_space(target_space_id UUID)
RETURNS boolean AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    UPDATE public.couples_spaces
    SET status = 'unlinked',
        partner_2_id = NULL,
        updated_at = timezone('utc'::text, now())
    WHERE id = target_space_id
      AND (partner_1_id = v_user_id OR partner_2_id = v_user_id);

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Couples space not found or you are not authorized to disconnect it.';
    END IF;

    -- Revoke any pending invitations for this space
    UPDATE public.workspace_invitations
    SET status = 'revoked'
    WHERE space_id = target_space_id
      AND status = 'pending';

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.6 Revoke Specific Partner Invitation
CREATE OR REPLACE FUNCTION public.revoke_partner_invitation(invitation_id UUID)
RETURNS boolean AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    UPDATE public.workspace_invitations
    SET status = 'revoked'
    WHERE id = invitation_id
      AND inviter_id = v_user_id
      AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pending invitation not found or unauthorized.';
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 6. GRANTS ─────────────────────────────────────────────────────────────────
GRANT ALL ON public.conversation_analyses TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_or_get_couples_space() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_partner_invitation() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_invitation_preview(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.accept_couples_invitation(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.disconnect_partner_space(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_partner_invitation(UUID) TO authenticated;
