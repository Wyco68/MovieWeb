const buckets = new Map();

function getClientIp(request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

function pruneBucket(bucket, now) {
  bucket.hits = bucket.hits.filter((timestamp) => now - timestamp < bucket.windowMs);
}

export function applyRateLimit(request, {
  bucketName,
  maxRequests = 120,
  windowMs = 60_000,
} = {}) {
  const now = Date.now();
  const ip = getClientIp(request);
  const key = `${bucketName || "default"}:${ip}`;

  let bucket = buckets.get(key);

  if (!bucket || bucket.windowMs !== windowMs) {
    bucket = { windowMs, hits: [] };
    buckets.set(key, bucket);
  }

  pruneBucket(bucket, now);

  if (bucket.hits.length >= maxRequests) {
    const oldest = bucket.hits[0] || now;
    const retryAfterMs = Math.max(1_000, windowMs - (now - oldest));

    return {
      ok: false,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
      remaining: 0,
    };
  }

  bucket.hits.push(now);

  if (buckets.size > 10_000) {
    for (const [bucketKey, value] of buckets.entries()) {
      pruneBucket(value, now);
      if (value.hits.length === 0) buckets.delete(bucketKey);
      if (buckets.size <= 8_000) break;
    }
  }

  return {
    ok: true,
    retryAfterSeconds: 0,
    remaining: Math.max(0, maxRequests - bucket.hits.length),
  };
}
