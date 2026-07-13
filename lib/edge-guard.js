import { getRedis } from "./redis.js";

/**
 * Resolves the client IP for rate limiting.
 * Never trusts client-supplied X-Forwarded-For (spoofable).
 * On Cloudflare, CF-Connecting-IP is set by the edge and cannot be spoofed.
 * (Legacy fallbacks: Vercel's x-vercel-forwarded-for, or x-real-ip when
 * TRUSTED_PROXY=true behind a reverse proxy that overwrites it.)
 */
export function getClientIp(request) {
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  const vercelForwarded = request.headers.get("x-vercel-forwarded-for");
  if (vercelForwarded) return vercelForwarded.split(",")[0].trim();

  if (process.env.TRUSTED_PROXY === "true") {
    const realIp = request.headers.get("x-real-ip");
    if (realIp) return realIp.trim();
  }

  return "unknown";
}

export function isBlockedUserAgent(userAgent, { allowApiTools = false } = {}) {
  const trimmed = String(userAgent || "").trim();
  if (!trimmed || trimmed.length < 5) return true;

  if (allowApiTools) return false;

  const scraperPatterns = [
    /^curl\//i,
    /^wget\//i,
    /^python-requests\//i,
    /^scrapy\//i,
    /^Go-http-client\//i,
    /^java\//i,
    /^libwww-perl/i,
    /^httpclient\//i,
    /^okhttp\//i,
    /^aiohttp\//i,
  ];

  return scraperPatterns.some((pattern) => pattern.test(trimmed));
}

export async function isIpBanned(ip) {
  const redis = getRedis();
  if (!redis || !ip || ip === "unknown") return false;

  try {
    return Boolean(await redis.get(`ban:ip:${ip}`));
  } catch {
    return false;
  }
}
