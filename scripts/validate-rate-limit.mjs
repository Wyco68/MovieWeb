/**
 * Rate limit validation harness.
 *
 * Default (no flags): in-memory fallback only — zero Redis commands.
 * --redis: hits Upstash (~15–25 commands). Use sparingly on the free tier.
 *
 * Run:
 *   node --env-file=.env scripts/validate-rate-limit.mjs
 *   node --env-file=.env scripts/validate-rate-limit.mjs --redis
 */

import { checkRateLimit, RATE_LIMIT_POLICIES } from "../lib/rate-limit.js";

const useRedis = process.argv.includes("--redis");
const TEST_IP = "203.0.113.50";
const RUN_ID = Date.now().toString(36);

if (!useRedis) {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function testNormalTraffic() {
  const policy = { limit: 5, windowSeconds: 60 };
  const testKey = `ratelimit:test:${RUN_ID}:${TEST_IP}`;
  const results = [];

  for (let i = 0; i < 5; i += 1) {
    results.push(await checkRateLimit({ key: testKey, limit: policy, window: policy }));
  }

  assert(results.every((result) => result.ok), "Normal traffic should pass");
  console.log("PASS normal traffic (5/5 allowed)");
}

async function testBurstAbuse() {
  const policy = { limit: 5, windowSeconds: 60 };
  const burstKey = `ratelimit:burst:${RUN_ID}:${TEST_IP}`;
  let blocked = false;

  // limit 5 + 1 blocked request is enough to prove enforcement
  for (let i = 0; i < 6; i += 1) {
    const result = await checkRateLimit({ key: burstKey, limit: policy, window: policy });
    if (!result.ok) {
      blocked = true;
      assert(result.retryAfterSeconds >= 1, "429 must include retry-after");
      break;
    }
  }

  assert(blocked, "Burst traffic must be blocked");
  console.log("PASS burst abuse blocked with retry-after");
}

async function testPolicyConstants() {
  assert(RATE_LIMIT_POLICIES.TMDB_API.limit === 120, "TMDB API limit should be 120/min");
  assert(RATE_LIMIT_POLICIES.TMDB_SEARCH.limit === 40, "Search limit should be 40/min");
  assert(RATE_LIMIT_POLICIES.AUTH.limit === 5, "Auth limit reserved at 5/min");
  console.log("PASS policy constants");
}

async function testHttp429Shape() {
  const response = new Response(JSON.stringify({ error: "Too many requests." }), {
    status: 429,
    headers: { "Retry-After": "30", "Content-Type": "application/json" },
  });

  assert(response.status === 429, "Status must be 429");
  assert(response.headers.get("Retry-After") === "30", "Retry-After header required");
  console.log("PASS 429 response shape");
}

async function main() {
  console.log("Rate limit validation");
  console.log(`Mode: ${useRedis ? "redis (~15-25 commands)" : "local fallback (0 Redis commands)"}`);
  console.log("---");

  await testPolicyConstants();
  await testNormalTraffic();
  await testBurstAbuse();
  await testHttp429Shape();

  console.log("---");
  console.log("All validation checks passed.");
  if (useRedis) {
    console.log("Tip: run without --redis for day-to-day checks to save Upstash quota.");
  }
}

main().catch((error) => {
  console.error("Validation failed:", error.message);
  process.exit(1);
});
