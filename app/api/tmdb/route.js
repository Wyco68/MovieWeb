import {
  buildTmdbCacheKey,
  getTmdbCache,
  setTmdbCache,
} from "@/lib/tmdb-cache";
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
} from "@/lib/search-params";

const TMDB_BASE = "https://api.themoviedb.org/3";
const REVALIDATE = 600;

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

// ─── helpers ──────────────────────────────────────────────────────────────────

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

async function fetchTmdb(url, token) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    next: { revalidate: REVALIDATE },
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

async function fetchCachedList({ cacheKey, url, token, page }) {
  const cached = await getTmdbCache(cacheKey);
  if (cached) {
    return new Response(JSON.stringify(cached), {
      status: 200,
      headers: cacheHeaders(),
    });
  }

  const data = await fetchTmdb(url, token);
  const payload = normalizeListPayload(data, page);
  await setTmdbCache(cacheKey, payload);

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: cacheHeaders(),
  });
}

// ─── main handler ─────────────────────────────────────────────────────────────

export async function GET(request) {
  const token = process.env.TMDB_TOKEN;
  if (!token) return jsonError("Server not configured.", 500);

  const { searchParams } = new URL(request.url);
  const key = String(searchParams.get("key") || "");
  const page = clampPage(searchParams.get("page"));

  if (!key) return jsonError("Missing key.", 400);

  try {
    // ── static list endpoints ──────────────────────────────────────────────
    if (STATIC_KEYS[key]) {
      const url = `${TMDB_BASE}${STATIC_KEYS[key]}?page=${page}`;
      return fetchCachedList({
        cacheKey: buildTmdbCacheKey(key, page),
        url,
        token,
        page,
      });
    }

    // ── discover section (popular/top_rated/upcoming/now_playing) ──────────
    if (key === "discover_section") {
      const media = searchParams.get("media") === "tv" ? "tv" : "movie";
      const section = String(searchParams.get("section") || "popular");
      const endpoint = SECTION_ENDPOINTS[media]?.[section];

      if (!endpoint) return jsonError("Invalid section.", 400);

      const url = `${TMDB_BASE}${endpoint}?page=${page}`;
      return fetchCachedList({
        cacheKey: buildTmdbCacheKey("discover_section", page, `${media}:${section}`),
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

      const params = new URLSearchParams({
        page: String(page),
        sort_by: sortBy,
      });

      if (genre) params.set("with_genres", genre);
      if (language) params.set("with_original_language", language);

      const minRating = parseRatingNumber(rating);
      if (minRating !== undefined) params.set("vote_average.gte", String(minRating));

      if (year) {
        if (media === "movie") params.set("primary_release_year", year);
        else params.set("first_air_date_year", year);
      }

      const url = `${TMDB_BASE}/discover/${media}?${params.toString()}`;
      const data = await fetchTmdb(url, token);

      return new Response(
        JSON.stringify({
          page: data?.page ?? page,
          total_pages: Math.min(Number(data?.total_pages) || 1, TMDB_PAGE_MAX),
          results: Array.isArray(data?.results) ? data.results : [],
        }),
        { status: 200, headers: cacheHeaders() },
      );
    }

    // ── genre movies ───────────────────────────────────────────────────────
    if (key === "genre_movies") {
      const genreId = String(searchParams.get("genreId") || "").trim();
      if (!isValidId(genreId)) return jsonError("Invalid genreId.", 400);

      const url = `${TMDB_BASE}/discover/movie?with_genres=${genreId}&sort_by=popularity.desc&page=${page}`;
      const data = await fetchTmdb(url, token);

      return new Response(
        JSON.stringify({
          page: data?.page ?? page,
          total_pages: Math.min(Number(data?.total_pages) || 1, TMDB_PAGE_MAX),
          results: Array.isArray(data?.results) ? data.results : [],
        }),
        { status: 200, headers: cacheHeaders() },
      );
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

      const params = new URLSearchParams({
        query,
        include_adult: "false",
        page: String(page),
      });
      if (language) params.set("language", language);

      const url = `${TMDB_BASE}/search/multi?${params.toString()}`;
      const data = await fetchTmdb(url, token);

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

      return new Response(
        JSON.stringify({
          page: data?.page ?? page,
          total_pages: Math.min(Number(data?.total_pages) || 1, TMDB_PAGE_MAX),
          results,
        }),
        { status: 200, headers: cacheHeaders() },
      );
    }

    // ── movie similar / recommendations ───────────────────────────────────
    if (key === "movie_similar" || key === "movie_recommendations") {
      const movieId = String(searchParams.get("movieId") || "").trim();
      if (!isValidId(movieId)) return jsonError("Invalid movieId.", 400);

      const subPath = key === "movie_similar" ? "similar" : "recommendations";
      const url = `${TMDB_BASE}/movie/${movieId}/${subPath}?page=${page}`;
      const data = await fetchTmdb(url, token);

      return new Response(
        JSON.stringify({
          page: data?.page ?? page,
          total_pages: Math.min(Number(data?.total_pages) || 1, TMDB_PAGE_MAX),
          results: Array.isArray(data?.results) ? data.results : [],
        }),
        { status: 200, headers: cacheHeaders() },
      );
    }

    // ── tv similar / recommendations ──────────────────────────────────────
    if (key === "tv_similar" || key === "tv_recommendations") {
      const tvId = String(searchParams.get("tvId") || "").trim();
      if (!isValidId(tvId)) return jsonError("Invalid tvId.", 400);

      const subPath = key === "tv_similar" ? "similar" : "recommendations";
      const url = `${TMDB_BASE}/tv/${tvId}/${subPath}?page=${page}`;
      const data = await fetchTmdb(url, token);

      return new Response(
        JSON.stringify({
          page: data?.page ?? page,
          total_pages: Math.min(Number(data?.total_pages) || 1, TMDB_PAGE_MAX),
          results: Array.isArray(data?.results) ? data.results : [],
        }),
        { status: 200, headers: cacheHeaders() },
      );
    }

    // ── tv season (lazy load) ─────────────────────────────────────────────
    if (key === "tv_season") {
      const tvId = String(searchParams.get("tvId") || "").trim();
      const seasonNum = String(searchParams.get("season") || "").trim();

      if (!isValidId(tvId)) return jsonError("Invalid tvId.", 400);
      if (!/^\d{1,3}$/.test(seasonNum)) return jsonError("Invalid season.", 400);

      const url = `${TMDB_BASE}/tv/${tvId}/season/${seasonNum}`;
      const data = await fetchTmdb(url, token);

      return new Response(JSON.stringify(normalizeSeasonPayload(data)), {
        status: 200,
        headers: cacheHeaders(),
      });
    }

    // ── people popular ────────────────────────────────────────────────────
    if (key === "tv_popular_key" || key === "people_popular") {
      const endpoint = key === "people_popular" ? "/person/popular" : "/tv/popular";
      const url = `${TMDB_BASE}${endpoint}?page=${page}`;
      const data = await fetchTmdb(url, token);

      return new Response(
        JSON.stringify({
          page: data?.page ?? page,
          total_pages: Math.min(Number(data?.total_pages) || 1, TMDB_PAGE_MAX),
          results: Array.isArray(data?.results) ? data.results : [],
        }),
        { status: 200, headers: cacheHeaders() },
      );
    }

    return jsonError("Invalid key.", 400);
  } catch (err) {
    if (err?.status === 404) return jsonError("Not found.", 404);
    return jsonError("Upstream error.", 502);
  }
}
