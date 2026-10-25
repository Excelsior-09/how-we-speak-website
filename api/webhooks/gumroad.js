// ==============================================================================
// HOW WE SPEAK — GUMROAD WEBHOOK HANDLER
// Endpoint: POST /api/webhooks/gumroad
// Purpose: Verifies Gumroad sale notifications and provisions digital entitlements
// Security: Secret verification, idempotency on sale_id, service_role execution
// ==============================================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GUMROAD_WEBHOOK_SECRET = process.env.GUMROAD_WEBHOOK_SECRET;

const supabaseAdmin = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

// Product Permalink to Product Key Mapping
const GUMROAD_PRODUCT_MAP = {
  'How-We-Speak-Men-Edition': 'men-edition',
  'how-we-speak-men-edition': 'men-edition',
  'howwespeak-women': 'women-edition',
  'howwespeak-scripts': 'script-collection',
  'howwespeak-sextalk': 'sex-talk',
  'howwespeak-bundle': 'bundle',
  'howwespeak-pro': 'workspace-pro'
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const payload = req.body || {};

  // 1. Secret Verification (if GUMROAD_WEBHOOK_SECRET is configured)
  const incomingSecret = req.headers['x-gumroad-signature'] || payload.webhook_secret || req.query?.secret;
  if (GUMROAD_WEBHOOK_SECRET && incomingSecret !== GUMROAD_WEBHOOK_SECRET) {
    return res.status(403).json({ error: 'Unauthorized: Invalid Gumroad webhook secret.' });
  }

  // Extract core sale fields from payload
  const email = (payload.email || payload.buyer_email || '').toLowerCase().trim();
  const permalink = (payload.permalink || payload.product_permalink || payload.short_product_id || '').trim();
  const saleId = payload.sale_id || payload.id;
  const isRefunded = payload.refunded === true || payload.refunded === 'true';

  if (!email || !permalink) {
    return res.status(400).json({ error: 'Missing required purchase fields (email or permalink).' });
  }

  const productKey = GUMROAD_PRODUCT_MAP[permalink] || 'bundle';

  // 2. Database Provisioning via Supabase Admin (service_role)
  if (supabaseAdmin) {
    try {
      // Find matching user profile by email if registered
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      const userId = profile ? profile.id : null;

      if (isRefunded) {
        // Mark entitlement as refunded
        await supabaseAdmin
          .from('entitlements')
          .update({
            status: 'refunded',
            updated_at: new Date().toISOString()
          })
          .eq('gumroad_sale_id', String(saleId));

        return res.status(200).json({
          ok: true,
          action: 'refund_processed',
          saleId,
          productKey
        });
      }

      // Check for existing entitlement by sale_id (Idempotency)
      if (saleId) {
        const { data: existing } = await supabaseAdmin
          .from('entitlements')
          .select('id')
          .eq('gumroad_sale_id', String(saleId))
          .maybeSingle();

        if (existing) {
          return res.status(200).json({
            ok: true,
            action: 'already_provisioned',
            saleId
          });
        }
      }

      // Provision new entitlement
      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from('entitlements')
        .insert({
          user_id: userId,
          customer_email: email,
          product_key: productKey,
          source: 'gumroad',
          status: 'active',
          gumroad_sale_id: saleId ? String(saleId) : null,
          metadata: {
            price: payload.price,
            currency: payload.currency,
            permalink,
            provisioned_at: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (insertErr) {
        throw insertErr;
      }

      return res.status(200).json({
        ok: true,
        action: 'entitlement_created',
        entitlementId: inserted?.id,
        productKey,
        email
      });
    } catch (err) {
      console.error('Failed to provision Gumroad entitlement:', err);
      return res.status(500).json({ error: 'Database error provisioning entitlement.' });
    }
  }

  // Sandbox simulation response
  return res.status(200).json({
    ok: true,
    action: isRefunded ? 'refund_simulated' : 'provision_simulated',
    email,
    productKey,
    saleId
  });
}
