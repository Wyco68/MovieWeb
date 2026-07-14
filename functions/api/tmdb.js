/**
 * Cloudflare Pages Function: TMDB proxy.
 *
 * This is the ONLY server-side code in the deployment. It exists so the TMDB
 * read token never reaches the browser. Everything else is static.
 *
 * Runs on the Cloudflare Pages/Workers runtime — configuration comes from
 * `context.env` (NOT process.env). Upstash Redis (optional) backs global
 * rate-limiting, IP bans and a short list-response cache; when it is not
 * configured the function degrades to a strict per-isolate in-memory limiter
 * so the endpoint still works. No Workers KV is used.
 *
 * Responses carry `Cache-Control: s-maxage=...` so Cloudflare's edge cache
 * (free, no KV) absorbs repeated requests and keeps TMDB call volume low.
 */

import { Redis } from "@upstash/redis/cloudflare";
import { Ratelimit } from "@upstash/ratelimit";
import {
  clampPage,
  isValidId,
  isValidLanguage,
  isValidMediaType,
  isValidYear,
  parseRatingNumber,
  sanitizeDiscoverParams,
  sanitizeSearchPageParams,
  SEARCH_QUERY_MAX,
  SEARCH_QUERY_MIN,
  TMDB_PAGE_MAX,
} from "../../lib/search-params.js";

const TMDB_BASE = "https://api.themoviedb.org/3";
const REVALIDATE = 600;
const DETAIL_APPEND = "credits,videos,recommendations,similar,keywords,watch/providers";

// ─── rate-limit policies ──────────────────────────────────────────────────────

const RATE_LIMIT_POLICIES = {
  TMDB_API: { limit: 120, windowSeconds: 60 },
  TMDB_SEARCH: { limit: 40, windowSeconds: 60 },
  FALLBACK: { limit: 30, windowSeconds: 60 },
};

const VIOLATION_THRESHOLD = 15;
const VIOLATION_WINDOW_SECONDS = 3600;
const BAN_DURATION_SECONDS = 86400;
const LIST_CACHE_TTL_SECONDS = 300;

// Per-isolate state (best-effort; resets when the isolate recycles).
const limiterCache = new Map();
const fallbackBuckets = new Map();
let redisClient = null;

// ─── allowed keys and their resolved TMDB endpoints ───────────────────────────

const STATIC_KEYS = {
  popular_movies: "/movie/popular",
  trending_movies_week: "/trending/movie/week",
  top_rated_movies: "/movie/top_rated",
  upcoming_movies: "/movie/upcoming",
  now_playing_movies: "/movie/now_playing",
  popular_tv: "/tv/popular",
  top_rated_tv: "/tv/top_rated",
  airing_today_tv: "/tv/airing_today",
  on_the_air_tv: "/tv/on_the_air",
  popular_people: "/person/popular",
  discover_trending_day: "/trending/all/day",
  discover_trending_week: "/trending/all/week",
};

const SECTION_ENDPOINTS = {
  movie: {
    popular: "/movie/popular",
    top_rated: "/movie/top_rated",
    upcoming: "/movie/upcoming",
    now_playing: "/movie/now_playing",
  },
  tv: {
    popular: "/tv/popular",
    top_rated: "/tv/top_rated",
    upcoming: "/tv/airing_today",
    now_playing: "/tv/on_the_air",
  },
};

// ─── redis helpers (env-injected) ─────────────────────────────────────────────

function isRedisConfigured(env) {
  return Boolean(env?.UPSTASH_REDIS_REST_URL && env?.UPSTASH_REDIS_REST_TOKEN);
}

function getRedis(env) {
  if (!isRedisConfigured(env)) return null;
  if (!redisClient) {
    redisClient = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redisClient;
}

function getClientIp(request) {
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();
  return "unknown";
}

function isBlockedUserAgent(userAgent) {
  const trimmed = String(userAgent || "").trim();
  // API tooling (curl, apps, etc.) is allowed; only obviously empty/garbage
  // user-agents are rejected.
  return trimmed.length < 5;
}

async function isIpBanned(env, ip) {
  const redis = getRedis(env);
  if (!redis || !ip || ip === "unknown") return false;
  try {
    return Boolean(await redis.get(`ban:ip:${ip}`));
  } catch {
    return false;
  }
}

async function recordAbuseStrike(env, ip) {
  const redis = getRedis(env);
  if (!redis || !ip || ip === "unknown") return;
  try {
    const abuseKey = `abuse:ip:${ip}`;
    const count = await redis.incr(abuseKey);
    if (count === 1) await redis.expire(abuseKey, VIOLATION_WINDOW_SECONDS);
    if (count >= VIOLATION_THRESHOLD) {
      await redis.set(`ban:ip:${ip}`, "1", { ex: BAN_DURATION_SECONDS });
    }
  } catch {
    // Abuse tracking failures must not block legitimate traffic.
  }
}

function getLimiter(env, policy) {
  const redis = getRedis(env);
  if (!redis) return null;
  const analytics = env.UPSTASH_RATELIMIT_ANALYTICS === "true";
  const cacheKey = `${policy.limit}:${policy.windowSeconds}:${analytics}`;
  if (!limiterCache.has(cacheKey)) {
    limiterCache.set(
      cacheKey,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(policy.limit, `${policy.windowSeconds} s`),
        prefix: "ratelimit",
        analytics,
      }),
    );
  }
  return limiterCache.get(cacheKey);
}

function applyFallbackRateLimit(key, policy) {
  const now = Date.now();
  const windowMs = policy.windowSeconds * 1000;
  const limit = Math.min(policy.limit, RATE_LIMIT_POLICIES.FALLBACK.limit);

  let bucket = fallbackBuckets.get(key);
  if (!bucket) {
    bucket = { hits: [] };
    fallbackBuckets.set(key, bucket);
  }
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0] || now;
    return {
      ok: false,
      retryAfterSeconds: Math.ceil(Math.max(1000, windowMs - (now - oldest)) / 1000),
    };
  }

  bucket.hits.push(now);
  if (fallbackBuckets.size > 5000) {
    for (const [k, v] of fallbackBuckets.entries()) {
      v.hits = v.hits.filter((t) => now - t < windowMs);
      if (v.hits.length === 0) fallbackBuckets.delete(k);
      if (fallbackBuckets.size <= 4000) break;
    }
  }
  return { ok: true, retryAfterSeconds: 0 };
}

async function checkRateLimit(env, { ip, policy }) {
  const key = `ratelimit:tmdb:${ip}`;

  const limiter = getLimiter(env, policy);
  if (!limiter) return applyFallbackRateLimit(key, policy);

  try {
    const result = await limiter.limit(key);
    if (!result.success) await recordAbuseStrike(env, ip);
    return {
      ok: result.success,
      retryAfterSeconds: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
    };
  } catch {
    return applyFallbackRateLimit(key, policy);
  }
}

// ─── list cache helpers (optional Upstash layer) ──────────────────────────────

function buildListCacheKey(key, page, suffix = "") {
  return `cache:tmdb:${key}:${page}${suffix ? `:${suffix}` : ""}`;
}

async function getListCache(env, cacheKey) {
  const redis = getRedis(env);
  if (!redis) return null;
  try {
    return await redis.get(cacheKey);
  } catch {
    return null;
  }
}

async function setListCache(env, cacheKey, payload) {
  const redis = getRedis(env);
  if (!redis) return;
  try {
    await redis.set(cacheKey, payload, { ex: LIST_CACHE_TTL_SECONDS });
  } catch {
    // Cache write failures must not break the API.
  }
}

// ─── response helpers ─────────────────────────────────────────────────────────

function jsonError(message, status, extraHeaders = {}) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...extraHeaders },
  });
}

function cacheHeaders() {
  return {
    "Content-Type": "application/json",
    "Cache-Control": `public, s-maxage=${REVALIDATE}, stale-while-revalidate=86400`,
  };
}

function jsonOk(payload) {
  return new Response(JSON.stringify(payload), { status: 200, headers: cacheHeaders() });
}

async function fetchTmdb(url, token) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!res.ok) {
    const err = new Error(`TMDB ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

function normalizeListPayload(data, page) {
  return {
    page: data?.page ?? page,
    total_pages: Math.min(Number(data?.total_pages) || 1, TMDB_PAGE_MAX),
    results: Array.isArray(data?.results) ? data.results : [],
  };
}

function listResponse(data, page) {
  return jsonOk(normalizeListPayload(data, page));
}

function normalizeSeasonPayload(data) {
  return {
    season_number: data?.season_number ?? null,
    name: data?.name ?? null,
    overview: data?.overview ?? null,
    episodes: (Array.isArray(data?.episodes) ? data.episodes : []).map((episode) => ({
      id: episode?.id,
      episode_number: episode?.episode_number,
      name: episode?.name,
      overview: episode?.overview,
      air_date: episode?.air_date,
      runtime: episode?.runtime,
      still_path: episode?.still_path,
      vote_average: episode?.vote_average,
    })),
  };
}

async function fetchCachedList(env, { cacheKey, url, token, page }) {
  const cached = await getListCache(env, cacheKey);
  if (cached) return jsonOk(cached);

  const data = await fetchTmdb(url, token);
  const payload = normalizeListPayload(data, page);
  await setListCache(env, cacheKey, payload);
  return jsonOk(payload);
}

// ─── main handler ─────────────────────────────────────────────────────────────

export async function onRequestGet(context) {
  const { request, env } = context;

  const token = env.TMDB_TOKEN;
  if (!token) return jsonError("Server not configured.", 500);

  // Bot / abuse guards.
  if (isBlockedUserAgent(request.headers.get("user-agent"))) {
    return jsonError("Forbidden.", 403);
  }

  const ip = getClientIp(request);
  if (await isIpBanned(env, ip)) return jsonError("Forbidden.", 403);

  const { searchParams } = new URL(request.url);
  const key = String(searchParams.get("key") || "");
  const page = clampPage(searchParams.get("page"));

  if (!key) return jsonError("Missing key.", 400);

  // Rate limit (search is stricter than browsing).
  const policy = key === "search_multi_filtered" ? RATE_LIMIT_POLICIES.TMDB_SEARCH : RATE_LIMIT_POLICIES.TMDB_API;
  const rateLimit = await checkRateLimit(env, { ip, policy });
  if (!rateLimit.ok) {
    return jsonError("Too many requests.", 429, {
      "Retry-After": String(rateLimit.retryAfterSeconds),
    });
  }

  try {
    // ── static list endpoints ──────────────────────────────────────────────
    if (STATIC_KEYS[key]) {
      const url = `${TMDB_BASE}${STATIC_KEYS[key]}?page=${page}`;
      return fetchCachedList(env, { cacheKey: buildListCacheKey(key, page), url, token, page });
    }

    // ── genre lists (movie/tv) ─────────────────────────────────────────────
    if (key === "genre_list") {
      const media = searchParams.get("media") === "tv" ? "tv" : "movie";
      const data = await fetchTmdb(`${TMDB_BASE}/genre/${media}/list`, token);
      return jsonOk({ genres: Array.isArray(data?.genres) ? data.genres : [] });
    }

    // ── discover section (popular/top_rated/upcoming/now_playing) ──────────
    if (key === "discover_section") {
      const media = searchParams.get("media") === "tv" ? "tv" : "movie";
      const section = String(searchParams.get("section") || "popular");
      const endpoint = SECTION_ENDPOINTS[media]?.[section];
      if (!endpoint) return jsonError("Invalid section.", 400);

      const url = `${TMDB_BASE}${endpoint}?page=${page}`;
      return fetchCachedList(env, {
        cacheKey: buildListCacheKey("discover_section", page, `${media}:${section}`),
        url,
        token,
        page,
      });
    }

    // ── discover filtered ──────────────────────────────────────────────────
    if (key === "discover_filtered") {
      const {
        media,
        with_genres: genre,
        with_original_language: language,
        year,
        rating,
        sort_by: sortBy,
      } = sanitizeDiscoverParams({
        media: searchParams.get("media"),
        with_genres: searchParams.get("with_genres"),
        language: searchParams.get("with_original_language") || searchParams.get("language"),
        year: searchParams.get("year"),
        rating: searchParams.get("vote_average.gte"),
        sort_by: searchParams.get("sort_by"),
      });

      const params = new URLSearchParams({ page: String(page), sort_by: sortBy });
      if (genre) params.set("with_genres", genre);
      if (language) params.set("with_original_language", language);
      const minRating = parseRatingNumber(rating);
      if (minRating !== undefined) params.set("vote_average.gte", String(minRating));
      if (year) {
        if (media === "movie") params.set("primary_release_year", year);
        else params.set("first_air_date_year", year);
      }

      const data = await fetchTmdb(`${TMDB_BASE}/discover/${media}?${params.toString()}`, token);
      return listResponse(data, page);
    }

    // ── genre movies ───────────────────────────────────────────────────────
    if (key === "genre_movies") {
      const genreId = String(searchParams.get("genreId") || "").trim();
      if (!isValidId(genreId)) return jsonError("Invalid genreId.", 400);

      const url = `${TMDB_BASE}/discover/movie?with_genres=${genreId}&sort_by=popularity.desc&page=${page}`;
      const data = await fetchTmdb(url, token);
      return listResponse(data, page);
    }

    // ── search multi ───────────────────────────────────────────────────────
    if (key === "search_multi_filtered") {
      const rawQuery = String(searchParams.get("q") || "").trim();
      if (!rawQuery || rawQuery.length < SEARCH_QUERY_MIN || rawQuery.length > SEARCH_QUERY_MAX) {
        return jsonError("Invalid query.", 400);
      }

      const rawLanguage = String(searchParams.get("language") || "").trim();
      if (rawLanguage && !isValidLanguage(rawLanguage)) return jsonError("Invalid language.", 400);

      const rawType = searchParams.get("type") || "all";
      if (!isValidMediaType(rawType)) return jsonError("Invalid type.", 400);

      const rawYear = String(searchParams.get("year") || "").trim();
      if (rawYear && !isValidYear(rawYear)) return jsonError("Invalid year.", 400);

      const rawGenre = String(searchParams.get("genre") || "").trim();
      if (rawGenre && !isValidId(rawGenre)) return jsonError("Invalid genre.", 400);

      const rawRating = String(searchParams.get("rating") || "").trim();
      if (rawRating && parseRatingNumber(rawRating) === undefined) {
        return jsonError("Invalid rating.", 400);
      }

      const { q: query, mediaType: type, genre, year, language, rating } = sanitizeSearchPageParams({
        q: rawQuery,
        type: rawType,
        genre: rawGenre,
        year: rawYear,
        language: rawLanguage,
        rating: rawRating,
      });

      const params = new URLSearchParams({ query, include_adult: "false", page: String(page) });
      if (language) params.set("language", language);

      const data = await fetchTmdb(`${TMDB_BASE}/search/multi?${params.toString()}`, token);
      let results = Array.isArray(data?.results) ? data.results : [];

      if (type !== "all") results = results.filter((item) => item?.media_type === type);
      if (genre) {
        const genreNum = Number.parseInt(genre, 10);
        results = results.filter((item) => (item?.genre_ids ?? []).includes(genreNum));
      }
      if (year) {
        results = results.filter((item) => {
          const date = item?.release_date || item?.first_air_date || "";
          return date.startsWith(year);
        });
      }
      const minRating = parseRatingNumber(rating);
      if (minRating !== undefined) {
        results = results.filter((item) => Number(item?.vote_average || 0) >= minRating);
      }

      return jsonOk({
        page: data?.page ?? page,
        total_pages: Math.min(Number(data?.total_pages) || 1, TMDB_PAGE_MAX),
        results,
      });
    }

    // ── movie detail (append_to_response) ──────────────────────────────────
    if (key === "movie_detail") {
      const movieId = String(searchParams.get("movieId") || "").trim();
      if (!isValidId(movieId)) return jsonError("Invalid movieId.", 400);
      const data = await fetchTmdb(
        `${TMDB_BASE}/movie/${movieId}?append_to_response=${encodeURIComponent(DETAIL_APPEND)}`,
        token,
      );
      return jsonOk(data);
    }

    // ── tv detail (append_to_response) ─────────────────────────────────────
    if (key === "tv_detail") {
      const tvId = String(searchParams.get("tvId") || "").trim();
      if (!isValidId(tvId)) return jsonError("Invalid tvId.", 400);
      const data = await fetchTmdb(
        `${TMDB_BASE}/tv/${tvId}?append_to_response=${encodeURIComponent(DETAIL_APPEND)}`,
        token,
      );
      return jsonOk(data);
    }

    // ── collection ─────────────────────────────────────────────────────────
    if (key === "collection") {
      const collectionId = String(searchParams.get("collectionId") || "").trim();
      if (!isValidId(collectionId)) return jsonError("Invalid collectionId.", 400);
      const data = await fetchTmdb(`${TMDB_BASE}/collection/${collectionId}`, token);
      return jsonOk(data);
    }

    // ── person detail + combined credits ───────────────────────────────────
    if (key === "person_detail") {
      const personId = String(searchParams.get("personId") || "").trim();
      if (!isValidId(personId)) return jsonError("Invalid personId.", 400);
      const data = await fetchTmdb(`${TMDB_BASE}/person/${personId}`, token);
      return jsonOk(data);
    }

    if (key === "person_credits") {
      const personId = String(searchParams.get("personId") || "").trim();
      if (!isValidId(personId)) return jsonError("Invalid personId.", 400);
      const data = await fetchTmdb(`${TMDB_BASE}/person/${personId}/combined_credits`, token);
      return jsonOk(data);
    }

    // ── movie / tv similar + recommendations ───────────────────────────────
    if (key === "movie_similar" || key === "movie_recommendations") {
      const movieId = String(searchParams.get("movieId") || "").trim();
      if (!isValidId(movieId)) return jsonError("Invalid movieId.", 400);
      const subPath = key === "movie_similar" ? "similar" : "recommendations";
      const data = await fetchTmdb(`${TMDB_BASE}/movie/${movieId}/${subPath}?page=${page}`, token);
      return listResponse(data, page);
    }

    if (key === "tv_similar" || key === "tv_recommendations") {
      const tvId = String(searchParams.get("tvId") || "").trim();
      if (!isValidId(tvId)) return jsonError("Invalid tvId.", 400);
      const subPath = key === "tv_similar" ? "similar" : "recommendations";
      const data = await fetchTmdb(`${TMDB_BASE}/tv/${tvId}/${subPath}?page=${page}`, token);
      return listResponse(data, page);
    }

    // ── tv season (lazy episode loading) ───────────────────────────────────
    if (key === "tv_season") {
      const tvId = String(searchParams.get("tvId") || "").trim();
      const seasonNum = String(searchParams.get("season") || "").trim();
      if (!isValidId(tvId)) return jsonError("Invalid tvId.", 400);
      if (!/^\d{1,3}$/.test(seasonNum)) return jsonError("Invalid season.", 400);
      const data = await fetchTmdb(`${TMDB_BASE}/tv/${tvId}/season/${seasonNum}`, token);
      return jsonOk(normalizeSeasonPayload(data));
    }

    // ── episode detail + videos ────────────────────────────────────────────
    if (key === "episode_detail" || key === "episode_videos") {
      const tvId = String(searchParams.get("tvId") || "").trim();
      const seasonNum = String(searchParams.get("season") || "").trim();
      const episodeNum = String(searchParams.get("episode") || "").trim();
      if (!isValidId(tvId)) return jsonError("Invalid tvId.", 400);
      if (!/^\d{1,3}$/.test(seasonNum)) return jsonError("Invalid season.", 400);
      if (!/^\d{1,4}$/.test(episodeNum)) return jsonError("Invalid episode.", 400);

      const suffix = key === "episode_videos" ? "/videos" : "";
      const data = await fetchTmdb(
        `${TMDB_BASE}/tv/${tvId}/season/${seasonNum}/episode/${episodeNum}${suffix}`,
        token,
      );
      return jsonOk(data);
    }

    // ── tv/person popular lists ────────────────────────────────────────────
    if (key === "tv_popular_key" || key === "people_popular") {
      const endpoint = key === "people_popular" ? "/person/popular" : "/tv/popular";
      const data = await fetchTmdb(`${TMDB_BASE}${endpoint}?page=${page}`, token);
      return listResponse(data, page);
    }

    return jsonError("Invalid key.", 400);
  } catch (err) {
    if (err?.status === 404) return jsonError("Not found.", 404);
    return jsonError("Upstream error.", 502);
  }
}
