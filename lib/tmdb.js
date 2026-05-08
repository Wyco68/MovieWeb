const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p";
const TMDB_IMAGE_VARIANTS = {
  poster: { sm: "w185", md: "w342", lg: "w500", xl: "w780" },
  backdrop: { sm: "w300", md: "w780", lg: "w1280", xl: "original" },
  profile: { sm: "w185", md: "h632", lg: "w780", xl: "original" },
};

const token = process.env.TMDB_TOKEN;
let tmdbImageConfigPromise;
const tmdbInFlightRequests = new Map();
const tmdbResponseCache = new Map();
const TMDB_CACHE_MAX_ENTRIES = 800;

function getTmdbCacheKey(url, revalidate) {
  return `${url}::${revalidate}`;
}

function clonePayload(payload) {
  if (typeof structuredClone === "function") return structuredClone(payload);
  return JSON.parse(JSON.stringify(payload));
}

function getCacheTtlMs(revalidate) {
  if (!Number.isFinite(Number(revalidate)) || Number(revalidate) <= 0) return 0;
  return Math.min(Math.floor(Number(revalidate) * 1000), 5 * 60 * 1000);
}

function pruneTmdbResponseCache(now = Date.now()) {
  for (const [key, entry] of tmdbResponseCache.entries()) {
    if (!entry || entry.expiresAt <= now) tmdbResponseCache.delete(key);
  }

  if (tmdbResponseCache.size <= TMDB_CACHE_MAX_ENTRIES) return;

  const overflow = tmdbResponseCache.size - TMDB_CACHE_MAX_ENTRIES;
  let removed = 0;

  for (const key of tmdbResponseCache.keys()) {
    tmdbResponseCache.delete(key);
    removed += 1;
    if (removed >= overflow) break;
  }
}

function getAuthHeaders() {
  if (!token) throw new Error("Missing TMDB_TOKEN environment variable.");
  return { Accept: "application/json", Authorization: `Bearer ${token}` };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** @param {Response} res */
function parseRetryAfterSeconds(res) {
  const h = res.headers.get("Retry-After");
  if (!h) return null;
  const sec = Number.parseInt(h, 10);
  if (Number.isFinite(sec) && sec > 0) return Math.min(sec, 60);
  return null;
}

function isRetriableStatus(status) {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

/**
 * Fetches TMDB with limited retries on transient errors (502/503/504/429).
 * Does not cache failed responses.
 */
async function fetchTmdbWithRetry(url, revalidate) {
  const maxAttempts = 4;
  let lastStatus = 502;
  let lastRetryAfter = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const res = await fetch(url, {
      headers: getAuthHeaders(),
      next: { revalidate },
    });

    lastStatus = res.status;

    if (res.ok) return res;

    const ra = parseRetryAfterSeconds(res);
    if (ra != null) lastRetryAfter = ra;

    if (!isRetriableStatus(res.status) || attempt === maxAttempts - 1) {
      throw new Error(`TMDB request failed: ${res.status} ${res.statusText}`);
    }

    const waitMs =
      (lastRetryAfter != null ? lastRetryAfter * 1000 : 280 * 2 ** attempt) +
      Math.floor(Math.random() * 150);

    await sleep(Math.min(waitMs, 8000));
  }

  throw new Error(`TMDB request failed: ${lastStatus}`);
}

export async function tmdbFetch(endpoint, { params = {}, revalidate = 3600 } = {}) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  const url = `${TMDB_API_URL}${endpoint}${query ? `?${query}` : ""}`;
  const cacheKey = getTmdbCacheKey(url, revalidate);
  const now = Date.now();

  pruneTmdbResponseCache(now);

  const cachedEntry = tmdbResponseCache.get(cacheKey);
  if (cachedEntry && cachedEntry.expiresAt > now) return clonePayload(cachedEntry.payload);

  if (tmdbInFlightRequests.has(cacheKey)) return tmdbInFlightRequests.get(cacheKey);

  const requestPromise = (async () => {
    const res = await fetchTmdbWithRetry(url, revalidate);
    const payload = await res.json();
    const ttlMs = getCacheTtlMs(revalidate);

    if (ttlMs > 0) {
      tmdbResponseCache.set(cacheKey, { payload, expiresAt: Date.now() + ttlMs });
      pruneTmdbResponseCache();
    }

    return clonePayload(payload);
  })();

  tmdbInFlightRequests.set(cacheKey, requestPromise);

  try {
    return await requestPromise;
  } finally {
    tmdbInFlightRequests.delete(cacheKey);
  }
}

export async function getTmdbImageConfig() {
  if (!tmdbImageConfigPromise) {
    tmdbImageConfigPromise = tmdbFetch("/configuration", { revalidate: 86400 })
      .then((config) => config?.images ?? null)
      .catch(() => null);
  }
  return tmdbImageConfigPromise;
}

function getConfiguredSize(availableSizes, preferredSize) {
  if (!Array.isArray(availableSizes) || !availableSizes.length) return preferredSize;
  if (preferredSize && availableSizes.includes(preferredSize)) return preferredSize;
  return availableSizes[availableSizes.length - 1];
}

export function getConfiguredImageUrl(path, { config, type = "poster", variant = "md", size } = {}) {
  if (!path) return null;

  const resolvedType = TMDB_IMAGE_VARIANTS[type] ? type : "poster";
  const defaultSize = TMDB_IMAGE_VARIANTS[resolvedType][variant] || "w342";
  const preferredSize = size || defaultSize;

  const sizeCollection =
    resolvedType === "backdrop"
      ? config?.backdrop_sizes
      : resolvedType === "profile"
        ? config?.profile_sizes
        : config?.poster_sizes;

  const resolvedSize = getConfiguredSize(sizeCollection, preferredSize);
  const baseUrl = config?.secure_base_url || `${TMDB_IMAGE_URL}/`;

  return `${baseUrl}${resolvedSize}${path}`;
}

export function getImageUrl(path, size = "w342") {
  if (!path) return null;
  return `${TMDB_IMAGE_URL}/${size}${path}`;
}
