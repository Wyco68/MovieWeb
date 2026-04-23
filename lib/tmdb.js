const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p";
const TMDB_IMAGE_VARIANTS = {
  poster: {
    sm: "w185",
    md: "w342",
    lg: "w500",
    xl: "w780",
  },
  backdrop: {
    sm: "w300",
    md: "w780",
    lg: "w1280",
    xl: "original",
  },
  profile: {
    sm: "w185",
    md: "h632",
    lg: "w780",
    xl: "original",
  },
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
  if (typeof structuredClone === "function") {
    return structuredClone(payload);
  }

  return JSON.parse(JSON.stringify(payload));
}

function getCacheTtlMs(revalidate) {
  if (!Number.isFinite(Number(revalidate)) || Number(revalidate) <= 0) {
    return 0;
  }

  const ttlFromRevalidate = Math.floor(Number(revalidate) * 1000);
  return Math.min(ttlFromRevalidate, 5 * 60 * 1000);
}

function pruneTmdbResponseCache(now = Date.now()) {
  for (const [key, entry] of tmdbResponseCache.entries()) {
    if (!entry || entry.expiresAt <= now) {
      tmdbResponseCache.delete(key);
    }
  }

  if (tmdbResponseCache.size <= TMDB_CACHE_MAX_ENTRIES) {
    return;
  }

  const overflow = tmdbResponseCache.size - TMDB_CACHE_MAX_ENTRIES;
  let removed = 0;

  for (const key of tmdbResponseCache.keys()) {
    tmdbResponseCache.delete(key);
    removed += 1;

    if (removed >= overflow) {
      break;
    }
  }
}

function getAuthHeaders() {
  if (!token) {
    throw new Error("Missing TMDB_TOKEN environment variable.");
  }

  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
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

  if (cachedEntry && cachedEntry.expiresAt > now) {
    return clonePayload(cachedEntry.payload);
  }

  if (tmdbInFlightRequests.has(cacheKey)) {
    return tmdbInFlightRequests.get(cacheKey);
  }

  const requestPromise = (async () => {
    const res = await fetch(url, {
      headers: getAuthHeaders(),
      next: { revalidate },
    });

    if (!res.ok) {
      throw new Error(`TMDB request failed: ${res.status} ${res.statusText}`);
    }

    const payload = await res.json();
    const ttlMs = getCacheTtlMs(revalidate);

    if (ttlMs > 0) {
      tmdbResponseCache.set(cacheKey, {
        payload,
        expiresAt: Date.now() + ttlMs,
      });

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

export async function tmdbFetchMultiPage(
  endpoint,
  { params = {}, pages = 2, startPage = 1, revalidate = 3600 } = {},
) {
  const requestedPages = Number.isFinite(Number(pages))
    ? Math.max(1, Math.floor(Number(pages)))
    : 1;

  const paramsPage = Number.parseInt(String(params?.page ?? ""), 10);
  const initialPage = Number.isFinite(paramsPage) && paramsPage > 0
    ? paramsPage
    : Math.max(1, Math.floor(Number(startPage) || 1));

  const sharedParams = { ...params };
  delete sharedParams.page;

  const requests = [];

  for (let offset = 0; offset < requestedPages; offset += 1) {
    const page = initialPage + offset;

    if (page > 500) {
      break;
    }

    requests.push(
      tmdbFetch(endpoint, {
        params: {
          ...sharedParams,
          page,
        },
        revalidate,
      }),
    );
  }

  const responses = await Promise.all(requests);
  const firstResponse = responses[0] ?? { results: [] };
  const seen = new Set();
  const mergedResults = [];

  responses.forEach((payload) => {
    (payload?.results ?? []).forEach((item, index) => {
      const key = `${item?.media_type || "unknown"}:${item?.id ?? `idx-${index}`}`;

      if (!seen.has(key)) {
        seen.add(key);
        mergedResults.push(item);
      }
    });
  });

  return {
    ...firstResponse,
    page: initialPage,
    results: mergedResults,
  };
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
  if (!Array.isArray(availableSizes) || !availableSizes.length) {
    return preferredSize;
  }

  if (preferredSize && availableSizes.includes(preferredSize)) {
    return preferredSize;
  }

  return availableSizes[availableSizes.length - 1];
}

export function getConfiguredImageUrl(
  path,
  { config, type = "poster", variant = "md", size } = {},
) {
  if (!path) {
    return null;
  }

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
  if (!path) {
    return null;
  }

  return `${TMDB_IMAGE_URL}/${size}${path}`;
}