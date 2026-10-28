// ==============================================================================
// HOW WE SPEAK — SERVER-SIDE RATE LIMITER & BOT FLOOD DEFENSE
// In-memory sliding window token-bucket rate limiter for Serverless Functions.
// Protects expensive AI generation, auth attempts, and password reset endpoints.
// ==============================================================================

const memoryBuckets = new Map();

/**
 * Check and record a hit against a rate limit bucket.
 * @param {string} key - Unique rate-limit identifier (e.g. IP address or userId)
 * @param {Object} options
 * @param {number} [options.limit=20] - Max allowed requests within window
 * @param {number} [options.windowMs=60000] - Window size in milliseconds (default: 60s)
 * @returns {{ allowed: boolean, count: number, remaining: number, resetMs: number }}
 */
export function checkRateLimit(key, { limit = 20, windowMs = 60000 } = {}) {
  const now = Date.now();
  let record = memoryBuckets.get(key);

  if (!record || now > record.resetTime) {
    record = {
      count: 1,
      resetTime: now + windowMs,
    };
    memoryBuckets.set(key, record);
    return {
      allowed: true,
      count: 1,
      remaining: Math.max(0, limit - 1),
      resetMs: windowMs,
    };
  }

  record.count += 1;
  const remaining = Math.max(0, limit - record.count);
  const resetMs = Math.max(0, record.resetTime - now);

  if (record.count > limit) {
    return {
      allowed: false,
      count: record.count,
      remaining: 0,
      resetMs,
    };
  }

  return {
    allowed: true,
    count: record.count,
    remaining,
    resetMs,
  };
}

/**
 * Extract client IP safely from request headers.
 * Uses x-forwarded-for or socket address. Does not log personal data.
 * @param {Object} req - Node / Vercel HTTP Request
 * @returns {string} Client IP string
 */
export function getClientIp(req) {
  if (!req) return '127.0.0.1';
  const forwarded = req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'];
  if (forwarded) {
    const ips = typeof forwarded === 'string' ? forwarded.split(',') : forwarded;
    const clientIp = (ips[0] || '').trim();
    if (clientIp) return clientIp;
  }
  return req.socket?.remoteAddress || req.connection?.remoteAddress || '127.0.0.1';
}

/**
 * Helper to purge stale buckets periodically to conserve memory.
 */
export function purgeStaleRateLimitBuckets() {
  const now = Date.now();
  for (const [k, v] of memoryBuckets.entries()) {
    if (now > v.resetTime) {
      memoryBuckets.delete(k);
    }
  }
}
