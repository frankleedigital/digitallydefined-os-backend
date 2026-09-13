// src/middleware/rate-limit.js
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 60;

const rateLimitStore = globalThis.__digitallyDefinedRateLimitStore || { map: new Map(), lastCleanup: Date.now() };
if (!globalThis.__digitallyDefinedRateLimitStore) {
  globalThis.__digitallyDefinedRateLimitStore = rateLimitStore;
}

function cleanupRateLimitStore() {
  const now = Date.now();
  if (now - rateLimitStore.lastCleanup > 5 * 60 * 1000) {
    for (const [ip, bucket] of rateLimitStore.map.entries()) {
      if (now > bucket.resetAt) {
        rateLimitStore.map.delete(ip);
      }
    }
    rateLimitStore.lastCleanup = now;
  }
}

export function checkRateLimit(ip) {
  cleanupRateLimitStore();
  const now = Date.now();
  const bucket = rateLimitStore.map.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }
  
  bucket.count++;
  rateLimitStore.map.set(ip, bucket);
  
  if (bucket.count > RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - bucket.count };
}

export default { checkRateLimit };
