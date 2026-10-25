// ==============================================================================
// HOW WE SPEAK — CURRENT USER PROFILE & ENTITLEMENTS STATUS
// Endpoint: GET /api/auth/me
// Purpose: Returns authenticated profile, space, owned ebooks, and trial quotas
// ==============================================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token.' });
  }

  const token = authHeader.replace('Bearer ', '');

  if (!supabaseAdmin) {
    // Sandbox default response
    return res.status(200).json({
      ok: true,
      user: {
        id: 'sandbox-usr-1',
        email: 'alex@tryhowwespeak.com',
      },
      profile: {
        display_name: 'Alex Rivera',
        archetype: 'Avoider',
      },
      entitlements: [
        { product_key: 'bundle', status: 'active' }
      ],
      usage: {
        trialRehearsalsUsed: 1,
        trialRehearsalsMax: 3,
        canRehearse: true,
        isPro: true,
      }
    });
  }

  try {
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token.' });
    }

    // 1. Fetch Profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    // 2. Fetch Active Space
    const { data: space } = await supabaseAdmin
      .from('couples_spaces')
      .select('*')
      .or(`partner_1_id.eq.${user.id},partner_2_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 3. Fetch Entitlements
    const { data: entitlements } = await supabaseAdmin
      .from('entitlements')
      .select('*')
      .eq('status', 'active')
      .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`);

    // 4. Count Rehearsals Used
    const { count: rehearsalsUsed } = await supabaseAdmin
      .from('usage_records')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('action_type', 'ai_rehearsal');

    const activeProducts = (entitlements || []).map(e => e.product_key);
    const isPro = activeProducts.includes('bundle') || activeProducts.includes('workspace-pro');
    const trialUsed = rehearsalsUsed || 0;
    const canRehearse = isPro || trialUsed < 3;

    return res.status(200).json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
      },
      profile,
      space,
      entitlements: activeProducts,
      usage: {
        trialRehearsalsUsed: trialUsed,
        trialRehearsalsMax: 3,
        canRehearse,
        isPro,
      }
    });
  } catch (err) {
    console.error('Error in /api/auth/me:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
