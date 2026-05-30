import { Ratelimit } from "@upstash/ratelimit";
import { getClientIp, isIpBanned } from "./edge-guard.js";
import { getRedis, isRedisConfigured } from "./redis.js";

export { getClientIp, isIpBanned };

/** @typedef {{ limit: number, windowSeconds: number }} RateLimitPolicy */

export const RATE_LIMIT_POLICIES = {
  TMDB_API: { limit: 60, windowSeconds: 60 },
  TMDB_SEARCH: { limit: 30, windowSeconds: 60 },
  AUTH: { limit: 5, windowSeconds: 60 },
  FALLBACK: { limit: 10, windowSeconds: 60 },
};

const VIOLATION_THRESHOLD = 15;
const VIOLATION_WINDOW_SECONDS = 3600;
const BAN_DURATION_SECONDS = 86400;

const limiterCache = new Map();
const fallbackBuckets = new Map();

function buildRateLimitKey(scope, identifier) {
  return `ratelimit:${scope}:${identifier}`;
}

function extractIpFromKey(key) {
  const match = String(key).match(/^ratelimit:[^:]+:(.+)$/);
  return match?.[1] || "unknown";
}

function getLimiter({ limit, windowSeconds, prefix = "ratelimit" }) {
  const redis = getRedis();
  if (!redis) return null;

  const analytics = process.env.UPSTASH_RATELIMIT_ANALYTICS === "true";
  const cacheKey = `${prefix}:${limit}:${windowSeconds}:${analytics}`;
  if (!limiterCache.has(cacheKey)) {
    limiterCache.set(
      cacheKey,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
        prefix,
        analytics,
      }),
    );
  }

  return limiterCache.get(cacheKey);
}

function logRateLimitViolation({ ip, redisKey, policy, remaining }) {
  console.warn(
    JSON.stringify({
      type: "rate_limit_violation",
      ip,
      key: redisKey,
      limit: policy.limit,
      remaining,
      timestamp: new Date().toISOString(),
    }),
  );
}

function logIpBan(ip, violationCount) {
  console.warn(
    JSON.stringify({
      type: "ip_ban",
      ip,
      violationCount,
      banDurationSeconds: BAN_DURATION_SECONDS,
      timestamp: new Date().toISOString(),
    }),
  );
}

async function recordAbuseStrike(ip) {
  const redis = getRedis();
  if (!redis || !ip || ip === "unknown") return;

  try {
    const abuseKey = `abuse:ip:${ip}`;
    const count = await redis.incr(abuseKey);
    if (count === 1) {
      await redis.expire(abuseKey, VIOLATION_WINDOW_SECONDS);
    }

    if (count >= VIOLATION_THRESHOLD) {
      await redis.set(`ban:ip:${ip}`, "1", { ex: BAN_DURATION_SECONDS });
      logIpBan(ip, count);
    }
  } catch {
    // Abuse tracking failures must not block legitimate traffic.
  }
}

function pruneFallbackBucket(bucket, now, windowMs) {
  bucket.hits = bucket.hits.filter((timestamp) => now - timestamp < windowMs);
}

function applyFallbackRateLimit(redisKey, policy) {
  const now = Date.now();
  const windowMs = policy.windowSeconds * 1000;
  const limit = Math.min(policy.limit, RATE_LIMIT_POLICIES.FALLBACK.limit);

  let bucket = fallbackBuckets.get(redisKey);
  if (!bucket) {
    bucket = { hits: [] };
    fallbackBuckets.set(redisKey, bucket);
  }

  pruneFallbackBucket(bucket, now, windowMs);

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0] || now;
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(Math.max(1_000, windowMs - (now - oldest)) / 1000),
      source: "fallback",
    };
  }

  bucket.hits.push(now);

  if (fallbackBuckets.size > 5_000) {
    for (const [key, value] of fallbackBuckets.entries()) {
      pruneFallbackBucket(value, now, windowMs);
      if (value.hits.length === 0) fallbackBuckets.delete(key);
      if (fallbackBuckets.size <= 4_000) break;
    }
  }

  return {
    ok: true,
    remaining: Math.max(0, limit - bucket.hits.length),
    retryAfterSeconds: 0,
    source: "fallback",
  };
}

/**
 * Global Redis-backed sliding-window rate limiter.
 * Falls back to a strict in-memory allowance when Redis is unavailable.
 */
export async function checkRateLimit({ key, limit, window, skipBanCheck = false }) {
  const windowSeconds =
    typeof window === "number"
      ? window
      : typeof window?.windowSeconds === "number"
        ? window.windowSeconds
        : 60;

  const resolvedLimit =
    typeof limit === "number"
      ? limit
      : typeof limit?.limit === "number"
        ? limit.limit
        : RATE_LIMIT_POLICIES.TMDB_API.limit;

  const policy = { limit: resolvedLimit, windowSeconds };
  const ip = extractIpFromKey(key);

  if (!skipBanCheck && (await isIpBanned(ip))) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: BAN_DURATION_SECONDS,
      source: "ban",
    };
  }

  if (!isRedisConfigured()) {
    return applyFallbackRateLimit(key, policy);
  }

  const limiter = getLimiter(policy);
  if (!limiter) {
    return applyFallbackRateLimit(key, policy);
  }

  try {
    const result = await limiter.limit(key);

    if (!result.success) {
      logRateLimitViolation({
        ip,
        redisKey: key,
        policy,
        remaining: result.remaining,
      });
      await recordAbuseStrike(ip);
    }

    return {
      ok: result.success,
      remaining: result.remaining,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((result.reset - Date.now()) / 1000),
      ),
      source: "redis",
    };
  } catch {
    return applyFallbackRateLimit(key, policy);
  }
}

export async function applyRateLimit(request, {
  bucketName,
  maxRequests = RATE_LIMIT_POLICIES.TMDB_API.limit,
  windowMs = RATE_LIMIT_POLICIES.TMDB_API.windowSeconds * 1000,
} = {}) {
  const ip = getClientIp(request);
  const key = buildRateLimitKey(bucketName || "default", ip);

  return checkRateLimit({
    key,
    limit: maxRequests,
    window: Math.ceil(windowMs / 1000),
    skipBanCheck: false,
  });
}
