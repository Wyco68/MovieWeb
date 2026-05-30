/**
 * Minimal Upstash connectivity check (~4 Redis commands).
 * Run only when verifying credentials — not on every deploy.
 *
 *   node --env-file=.env scripts/test-redis-connection.mjs
 */
import { Redis } from "@upstash/redis/cloudflare";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  console.error("FAIL: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set");
  process.exit(1);
}

const redis = new Redis({ url, token });

try {
  const pong = await redis.ping();
  console.log("PASS: Redis PING ->", pong);

  const testKey = `healthcheck:${Date.now()}`;
  await redis.set(testKey, "ok", { ex: 10 });
  const value = await redis.get(testKey);
  await redis.del(testKey);

  if (value !== "ok") {
    console.error("FAIL: Redis read/write mismatch");
    process.exit(1);
  }

  console.log("PASS: Redis read/write");
  process.exit(0);
} catch (error) {
  console.error("FAIL: Redis connection error:", error.message);
  process.exit(1);
}
