import { getRedis } from "./redis.js";

/**
 * Resolves the client IP for rate limiting.
 * Never trusts client-supplied X-Forwarded-For (spoofable).
 * On Vercel, x-vercel-forwarded-for is set by the platform.
 * On self-hosted setups, set TRUSTED_PROXY=true only when your
 * reverse proxy overwrites X-Forwarded-For and sets x-real-ip.
 */
export function getClientIp(request) {
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
