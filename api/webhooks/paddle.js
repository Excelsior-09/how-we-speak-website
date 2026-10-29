// ==============================================================================
// HOW WE SPEAK — PADDLE BILLING WEBHOOK HANDLER (LIVE / PRODUCTION)
// Endpoint: POST /api/webhooks/paddle
// Purpose: Verifies Paddle webhook signatures, dynamically validates Paddle live IPs,
//          and provisions digital entitlements in Supabase idempotently.
// Security:
//   1. Dynamic Paddle IP allowlisting via https://api.paddle.com/ips
//   2. HMAC-SHA256 signature verification (Paddle-Signature: ts=...;h1=...)
//   3. Idempotency on transaction_id / event_id
// ==============================================================================

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PADDLE_WEBHOOK_SECRET_KEY = process.env.PADDLE_WEBHOOK_SECRET_KEY;

const supabaseAdmin = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

// Product / Price mapping: maps Paddle Price IDs (pri_...) to internal product keys
export const PADDLE_PRICE_MAP = {
  // Live Price IDs (from environment variables or defaults)
  [process.env.PADDLE_PRICE_BUNDLE || 'pri_bundle_live']: 'bundle',
  [process.env.PADDLE_PRICE_MEN_EDITION || 'pri_men_live']: 'men-edition',
  [process.env.PADDLE_PRICE_WOMEN_EDITION || 'pri_women_live']: 'women-edition',
  [process.env.PADDLE_PRICE_SCRIPTS || 'pri_scripts_live']: 'script-collection',
  [process.env.PADDLE_PRICE_SEX_TALK || 'pri_sextalk_live']: 'sex-talk',
  
  // Direct product key fallbacks
  'bundle': 'bundle',
  'men-edition': 'men-edition',
  'women-edition': 'women-edition',
  'script-collection': 'script-collection',
  'sex-talk': 'sex-talk',
  'workspace-pro': 'workspace-pro'
};

// ── 1. DYNAMIC PADDLE IP ALLOWLIST CACHE ─────────────────────────────────────
let cachedPaddleIps = null;
let lastIpFetchTime = 0;
const IP_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Fallback CIDRs from Paddle official documentation in case of network fetch failure
const FALLBACK_PADDLE_CIDRS = [
  '34.237.3.244/32',
  '34.195.105.136/32',
  '34.232.58.13/32',
  '35.155.119.135/32',
  '34.212.5.7/32',
  '52.11.166.252/32'
];

export async function getPaddleLiveIps() {
  const now = Date.now();
  if (cachedPaddleIps && (now - lastIpFetchTime < IP_CACHE_TTL_MS)) {
    return cachedPaddleIps;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://api.paddle.com/ips', { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const json = await res.json();
      if (json?.data?.ipv4_cidrs && Array.isArray(json.data.ipv4_cidrs)) {
        cachedPaddleIps = json.data.ipv4_cidrs;
        lastIpFetchTime = now;
        return cachedPaddleIps;
      }
    }
  } catch (err) {
    console.warn('[Paddle Webhook] Notice: Failed to fetch live IPs from api.paddle.com/ips, using verified fallback list:', err?.message || err);
  }

  return cachedPaddleIps || FALLBACK_PADDLE_CIDRS;
}

// Convert IPv4 string to 32-bit unsigned integer
function ipToLong(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

// Check if an IP address falls within a given CIDR notation
export function isIpInCidr(ip, cidr) {
  if (!ip || !cidr) return false;
  // Handle IPv6 mapped IPv4 addresses (e.g. ::ffff:1.2.3.4)
  const cleanIp = ip.replace(/^.*:/, '');

  const [range, prefixStr] = cidr.split('/');
  const prefix = prefixStr ? parseInt(prefixStr, 10) : 32;

  const ipLong = ipToLong(cleanIp);
  const rangeLong = ipToLong(range);

  if (ipLong === null || rangeLong === null) return false;

  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  return (ipLong & mask) === (rangeLong & mask);
}

// Verify client IP against Paddle live IP allowlist
export async function verifyPaddleIp(clientIp) {
  if (!clientIp) return false;

  // Local / staging bypass
  const cleanIp = clientIp.replace(/^.*:/, '');
  if (cleanIp === '127.0.0.1' || cleanIp === 'localhost' || cleanIp === '') {
    if (process.env.NODE_ENV !== 'production') return true;
  }

  const allowedCidrs = await getPaddleLiveIps();
  return allowedCidrs.some(cidr => isIpInCidr(clientIp, cidr));
}

// ── 2. PADDLE WEBHOOK SIGNATURE VERIFICATION ─────────────────────────────────
export function verifyPaddleSignature(rawBody, signatureHeader, secretKey) {
  if (!signatureHeader || !secretKey) return false;

  // Paddle-Signature header format: ts=1671552777;h1=eb387291a...
  const parts = signatureHeader.split(';').reduce((acc, part) => {
    const [k, v] = part.split('=');
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {});

  const ts = parts.ts;
  const h1 = parts.h1;

  if (!ts || !h1) return false;

  // Compute expected HMAC-SHA256 signature
  const signedPayload = `${ts}:${rawBody}`;
  const computedHash = crypto
    .createHmac('sha256', secretKey)
    .update(signedPayload)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computedHash, 'hex'),
      Buffer.from(h1, 'hex')
    );
  } catch {
    return false;
  }
}

// ── 3. MAIN WEBHOOK HANDLER ──────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. IP Allowlisting Check
  const forwarded = req.headers['x-forwarded-for'];
  const clientIp = forwarded ? forwarded.split(',')[0].trim() : req.headers['x-real-ip'] || req.socket?.remoteAddress;

  const isIpAllowed = await verifyPaddleIp(clientIp);
  if (!isIpAllowed) {
    console.warn(`[Paddle Webhook] Rejected unauthorized IP: ${clientIp}`);
    return res.status(403).json({ error: 'Forbidden: IP address not in Paddle live allowlist.' });
  }

  // 2. Signature Verification (if PADDLE_WEBHOOK_SECRET_KEY is configured)
  const signatureHeader = req.headers['paddle-signature'];
  const rawBody = req.rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

  if (PADDLE_WEBHOOK_SECRET_KEY) {
    const isValidSignature = verifyPaddleSignature(rawBody, signatureHeader, PADDLE_WEBHOOK_SECRET_KEY);
    if (!isValidSignature) {
      console.warn('[Paddle Webhook] Rejected request with invalid Paddle-Signature.');
      return res.status(403).json({ error: 'Unauthorized: Invalid Paddle signature.' });
    }
  }

  const payload = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const eventType = payload.event_type || payload.type;
  const eventData = payload.data || {};

  console.log(`[Paddle Webhook] Processing event: ${eventType} (Event ID: ${payload.event_id || 'N/A'})`);

  // 3. Process Events
  try {
    // 3.1 Transactions: Paid / Completed
    if (eventType === 'transaction.completed' || eventType === 'transaction.paid') {
      const customerEmail = (
        eventData.customer?.email ||
        eventData.custom_data?.user_email ||
        eventData.details?.payer?.email_address ||
        ''
      ).toLowerCase().trim();

      const transactionId = eventData.id;
      const paddleCustomerId = eventData.customer_id;

      // Extract items and map to product keys
      const items = eventData.items || [];
      const productKeys = [];

      for (const item of items) {
        const priceId = item.price?.id || item.price_id;
        const mappedKey = PADDLE_PRICE_MAP[priceId] || item.price?.custom_data?.product_key;
        if (mappedKey) {
          productKeys.push(mappedKey);
        }
      }

      // Default fallback if no specific price matched
      if (productKeys.length === 0) {
        productKeys.push('bundle');
      }

      if (!customerEmail) {
        console.warn('[Paddle Webhook] Transaction missing customer email.');
        return res.status(400).json({ error: 'Missing customer email in transaction data.' });
      }

      // Provision entitlements in Supabase
      if (supabaseAdmin) {
        // Link to existing user profile if one exists
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', customerEmail)
          .maybeSingle();

        const userId = profile ? profile.id : null;

        for (const productKey of productKeys) {
          // Check for existing entitlement by transaction ID (Idempotency)
          const { data: existing } = await supabaseAdmin
            .from('entitlements')
            .select('id')
            .eq('metadata->>paddle_transaction_id', transactionId)
            .eq('product_key', productKey)
            .maybeSingle();

          if (existing) {
            console.log(`[Paddle Webhook] Entitlement already provisioned for ${customerEmail} (${productKey})`);
            continue;
          }

          const entitlementRecord = {
            user_id: userId,
            customer_email: customerEmail,
            product_key: productKey,
            source: 'paddle',
            status: 'active',
            daily_ai_limit: productKey === 'bundle' || productKey === 'workspace-pro' ? 20 : 10,
            monthly_ai_limit: productKey === 'bundle' || productKey === 'workspace-pro' ? 200 : 100,
            gumroad_sale_id: transactionId, // Compatibility with existing queries
            metadata: {
              source: 'paddle_live',
              paddle_transaction_id: transactionId,
              paddle_customer_id: paddleCustomerId,
              event_id: payload.event_id,
              event_type: eventType,
              currency: eventData.currency_code,
              total: eventData.details?.totals?.total,
              occurred_at: payload.occurred_at
            }
          };

          const { error: insertErr } = await supabaseAdmin
            .from('entitlements')
            .insert(entitlementRecord);

          if (insertErr) {
            console.error(`[Paddle Webhook] DB Insert Error for ${productKey}:`, insertErr);
          } else {
            console.log(`[Paddle Webhook] Provisioned ${productKey} for ${customerEmail}`);
          }
        }
      }

      return res.status(200).json({
        ok: true,
        action: 'transaction_processed',
        transactionId,
        productKeys
      });
    }

    // 3.2 Refunds & Adjustments
    if (eventType === 'adjustment.updated' || eventType === 'transaction.refunded') {
      const transactionId = eventData.transaction_id || eventData.id;
      const isRefunded = eventData.status === 'approved' || eventData.action === 'refund' || eventType === 'transaction.refunded';

      if (isRefunded && transactionId && supabaseAdmin) {
        await supabaseAdmin
          .from('entitlements')
          .update({
            status: 'refunded',
            updated_at: new Date().toISOString(),
            metadata: {
              refunded_at: new Date().toISOString(),
              refund_event_id: payload.event_id
            }
          })
          .eq('gumroad_sale_id', transactionId);

        console.log(`[Paddle Webhook] Processed refund for transaction: ${transactionId}`);
        return res.status(200).json({ ok: true, action: 'refund_processed', transactionId });
      }
    }

    // 3.3 Subscriptions: Created / Updated / Canceled
    if (eventType?.startsWith('subscription.')) {
      const subId = eventData.id;
      const customerEmail = eventData.customer?.email?.toLowerCase()?.trim();
      const status = eventData.status; // active, trialing, past_due, paused, canceled

      if (supabaseAdmin && subId && customerEmail) {
        const entitlementStatus = status === 'canceled' ? 'expired' : 'active';
        await supabaseAdmin
          .from('entitlements')
          .update({
            status: entitlementStatus,
            updated_at: new Date().toISOString()
          })
          .eq('metadata->>paddle_subscription_id', subId);

        return res.status(200).json({ ok: true, action: 'subscription_updated', subId, status });
      }
    }

    // Acknowledge any other recognized event
    return res.status(200).json({ ok: true, message: 'Event acknowledged', eventType });

  } catch (err) {
    console.error('[Paddle Webhook] Processing exception:', err);
    return res.status(500).json({ error: 'Internal server error processing webhook.' });
  }
}

