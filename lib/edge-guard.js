import { getRedis } from "./redis.js";

export function getClientIp(request) {
  const vercelForwarded = request.headers.get("x-vercel-forwarded-for");
  if (vercelForwarded) return vercelForwarded.split(",")[0].trim();

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();

  return request.headers.get("x-real-ip") || "unknown";
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
