import { getRedis } from "./redis.js";

const CACHE_TTL_SECONDS = 300;

export function buildTmdbCacheKey(key, page, suffix = "") {
  const extra = suffix ? `:${suffix}` : "";
  return `cache:tmdb:${key}:${page}${extra}`;
}

export async function getTmdbCache(cacheKey) {
  const redis = getRedis();
  if (!redis) return null;

  try {
    return await redis.get(cacheKey);
  } catch {
    return null;
  }
}

export async function setTmdbCache(cacheKey, payload) {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(cacheKey, payload, { ex: CACHE_TTL_SECONDS });
  } catch {
    // Cache write failures must not break the API.
  }
}
