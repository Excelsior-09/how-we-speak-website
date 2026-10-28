// ==============================================================================
// HOW WE SPEAK — PARTNER INVITATION & RELATIONSHIP API
// Endpoint: /api/partner/invite
// Methods: GET (preview), POST (create, accept, disconnect, revoke)
// ==============================================================================

import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIp } from '../lib/rate-limiter.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

export default async function handler(req, res) {
  const clientIp = getClientIp(req);

  // Rate Limiting: 30 requests/min per IP
  const rateLimit = checkRateLimit(`partner_invite:${clientIp}`, { limit: 30, windowMs: 60000 });
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', Math.ceil(rateLimit.resetMs / 1000));
    return res.status(429).json({
      error: 'Too many requests. Please wait a moment before trying again.',
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }

  // 1. GET: Preview an invitation (Public safe endpoint for invited partners)
  if (req.method === 'GET') {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Missing invitation token parameter.' });
    }

    if (!supabaseAdmin) {
      return res.status(200).json({
        valid: true,
        inviter_name: 'Your Partner',
        inviter_archetype: 'Partner',
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
        token
      });
    }

    const { data: invitation, error: invErr } = await supabaseAdmin
      .from('workspace_invitations')
      .select('id, space_id, inviter_id, token, status, expires_at')
      .eq('token', token.trim())
      .maybeSingle();

    if (invErr || !invitation) {
      return res.status(404).json({ valid: false, error: 'Invitation not found.' });
    }

    if (invitation.status === 'revoked') {
      return res.status(410).json({ valid: false, error: 'This invitation was revoked by the sender.' });
    }

    if (invitation.status === 'accepted') {
      return res.status(410).json({ valid: false, error: 'This invitation has already been accepted.' });
    }

    const isExpired = new Date(invitation.expires_at).getTime() <= Date.now();
    if (isExpired) {
      return res.status(410).json({ valid: false, error: 'This invitation code has expired.' });
    }

    let inviterName = 'Your Partner';
    let inviterArchetype = 'Partner';
    const { data: inviter } = await supabaseAdmin
      .from('profiles')
      .select('display_name, archetype')
      .eq('id', invitation.inviter_id)
      .maybeSingle();

    if (inviter) {
      inviterName = inviter.display_name || inviterName;
      inviterArchetype = inviter.archetype || inviterArchetype;
    }

    return res.status(200).json({
      valid: true,
      inviter_name: inviterName,
      inviter_archetype: inviterArchetype,
      expires_at: invitation.expires_at,
      token: invitation.token
    });
  }

  // 2. POST actions require authentication
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const authHeader = req.headers.authorization;
  let authUser = null;

  if (authHeader && authHeader.startsWith('Bearer ') && supabaseAdmin) {
    const bearer = authHeader.replace('Bearer ', '').trim();
    try {
      const { data, error } = await supabaseAdmin.auth.getUser(bearer);
      if (!error && data?.user) {
        authUser = data.user;
      }
    } catch (e) {}
  }

  if (!authUser && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Authentication required for this partner action.' });
  }

  const userId = authUser?.id || req.body?.userId || '00000000-0000-0000-0000-000000000001';
  const { action, token, spaceId, invitationId } = req.body || {};

  // Action: CREATE invitation
  if (action === 'create') {
    if (!supabaseAdmin) {
      const dummyToken = `hws_${Math.random().toString(36).slice(2, 10)}`;
      return res.status(200).json({
        success: true,
        invitation: {
          token: dummyToken,
          expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
          status: 'pending'
        }
      });
    }

    // 1. Ensure couples space exists for this user
    let userSpace = null;
    const { data: existingSpace } = await supabaseAdmin
      .from('couples_spaces')
      .select('*')
      .or(`partner_1_id.eq.${userId},partner_2_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingSpace) {
      userSpace = existingSpace;
    } else {
      const { data: newSpace, error: createSpaceErr } = await supabaseAdmin
        .from('couples_spaces')
        .insert({
          partner_1_id: userId,
          status: 'pending_pair',
          room_name: 'Our Communication Room'
        })
        .select('*')
        .single();

      if (createSpaceErr) {
        return res.status(500).json({ error: 'Could not create couples space.' });
      }
      userSpace = newSpace;
    }

    // Check if active pending invite already exists
    const { data: activeInvite } = await supabaseAdmin
      .from('workspace_invitations')
      .select('*')
      .eq('space_id', userSpace.id)
      .eq('inviter_id', userId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (activeInvite) {
      return res.status(200).json({ success: true, invitation: activeInvite });
    }

    // Create new invite
    const newToken = `hws_${Math.random().toString(36).slice(2, 12)}`;
    const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();

    const { data: newInvite, error: inviteCreateErr } = await supabaseAdmin
      .from('workspace_invitations')
      .insert({
        space_id: userSpace.id,
        inviter_id: userId,
        token: newToken,
        status: 'pending',
        expires_at: expiresAt
      })
      .select('*')
      .single();

    if (inviteCreateErr) {
      return res.status(500).json({ error: 'Could not create invitation.' });
    }

    return res.status(200).json({ success: true, invitation: newInvite });
  }

  // Action: ACCEPT invitation
  if (action === 'accept') {
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Missing invitation token.' });
    }

    if (!supabaseAdmin) {
      return res.status(200).json({ success: true, spaceId: 'mock-space-id' });
    }

    // Use RPC if available
    const { data: rpcSpaceId, error: rpcErr } = await supabaseAdmin.rpc('accept_couples_invitation', {
      invite_token: token.trim()
    });

    if (!rpcErr && rpcSpaceId) {
      return res.status(200).json({ success: true, spaceId: rpcSpaceId });
    }

    // Direct fallback logic
    const { data: inv, error: findErr } = await supabaseAdmin
      .from('workspace_invitations')
      .select('*')
      .eq('token', token.trim())
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (findErr || !inv) {
      return res.status(400).json({ error: 'Invalid, expired, or previously accepted invitation code.' });
    }

    if (inv.inviter_id === userId) {
      return res.status(400).json({ error: 'You cannot accept your own invitation code.' });
    }

    // Deactivate previous solo space for this user
    await supabaseAdmin
      .from('couples_spaces')
      .update({ status: 'unlinked', updated_at: new Date().toISOString() })
      .eq('partner_1_id', userId)
      .is('partner_2_id', null)
      .eq('status', 'pending_pair');

    // Link partner 2
    await supabaseAdmin
      .from('couples_spaces')
      .update({
        partner_2_id: userId,
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', inv.space_id);

    // Mark accepted
    await supabaseAdmin
      .from('workspace_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', inv.id);

    return res.status(200).json({ success: true, spaceId: inv.space_id });
  }

  // Action: DISCONNECT space
  if (action === 'disconnect') {
    const targetSpaceId = spaceId;
    if (!targetSpaceId) {
      return res.status(400).json({ error: 'Missing spaceId parameter.' });
    }

    if (supabaseAdmin) {
      await supabaseAdmin
        .from('couples_spaces')
        .update({
          status: 'unlinked',
          partner_2_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetSpaceId);

      await supabaseAdmin
        .from('workspace_invitations')
        .update({ status: 'revoked' })
        .eq('space_id', targetSpaceId)
        .eq('status', 'pending');
    }

    return res.status(200).json({ success: true, message: 'Partner disconnected successfully.' });
  }

  // Action: REVOKE invitation
  if (action === 'revoke') {
    const targetInvId = invitationId;
    if (!targetInvId) {
      return res.status(400).json({ error: 'Missing invitationId parameter.' });
    }

    if (supabaseAdmin) {
      await supabaseAdmin
        .from('workspace_invitations')
        .update({ status: 'revoked' })
        .eq('id', targetInvId)
        .eq('inviter_id', userId);
    }

    return res.status(200).json({ success: true, message: 'Invitation revoked successfully.' });
  }

  return res.status(400).json({ error: `Unknown action: ${action}` });
}
