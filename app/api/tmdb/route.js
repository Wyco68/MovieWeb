export const runtime = "edge";

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

const FILTER_PARAM_KEYS = [
  "with_genres",
  "with_original_language",
  "vote_average.gte",
  "primary_release_year",
  "first_air_date_year",
  "sort_by",
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function cacheHeaders() {
  return {
    "Content-Type": "application/json",
    "Cache-Control": `public, s-maxage=${REVALIDATE}, stale-while-revalidate=86400`,
  };
}

function clampPage(raw) {
  const parsed = Number.parseInt(String(raw || "1"), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  if (parsed > 5) return 5;
  return parsed;
}

function isValidId(value) {
  return /^\d{1,8}$/.test(String(value || "").trim());
}

function isValidLanguage(value) {
  const lang = String(value || "").trim();
  if (!lang) return true;
  return /^[a-z]{2}(-[A-Z]{2})?$/.test(lang);
}

function isValidYear(value) {
  const y = String(value || "").trim();
  if (!y) return true;
  return /^(19|20)\d{2}$/.test(y);
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
      const data = await fetchTmdb(url, token);

      return new Response(
        JSON.stringify({
          page: data?.page ?? page,
          total_pages: Math.min(Number(data?.total_pages) || 1, 5),
          results: Array.isArray(data?.results) ? data.results : [],
        }),
        { status: 200, headers: cacheHeaders() },
      );
    }

    // ── discover section (popular/top_rated/upcoming/now_playing) ──────────
    if (key === "discover_section") {
      const media = searchParams.get("media") === "tv" ? "tv" : "movie";
      const section = String(searchParams.get("section") || "popular");
      const endpoint = SECTION_ENDPOINTS[media]?.[section];

      if (!endpoint) return jsonError("Invalid section.", 400);

      const url = `${TMDB_BASE}${endpoint}?page=${page}`;
      const data = await fetchTmdb(url, token);

      return new Response(
        JSON.stringify({
          page: data?.page ?? page,
          total_pages: Math.min(Number(data?.total_pages) || 1, 5),
          results: Array.isArray(data?.results) ? data.results : [],
        }),
        { status: 200, headers: cacheHeaders() },
      );
    }

    // ── discover filtered ──────────────────────────────────────────────────
    if (key === "discover_filtered") {
      const media = searchParams.get("media") === "tv" ? "tv" : "movie";
      const params = new URLSearchParams({ page: String(page), sort_by: "popularity.desc" });

      for (const fk of FILTER_PARAM_KEYS) {
        const val = searchParams.get(fk);
        if (val) params.set(fk, val);
      }

      const language = searchParams.get("with_original_language") || searchParams.get("language") || "";
      if (language && !isValidLanguage(language)) return jsonError("Invalid language.", 400);

      const year = searchParams.get("year") || "";
      if (year) {
        if (!isValidYear(year)) return jsonError("Invalid year.", 400);
        if (media === "movie") params.set("primary_release_year", year);
        else params.set("first_air_date_year", year);
      }

      const url = `${TMDB_BASE}/discover/${media}?${params.toString()}`;
      const data = await fetchTmdb(url, token);

      return new Response(
        JSON.stringify({
          page: data?.page ?? page,
          total_pages: Math.min(Number(data?.total_pages) || 1, 5),
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
          total_pages: Math.min(Number(data?.total_pages) || 1, 5),
          results: Array.isArray(data?.results) ? data.results : [],
        }),
        { status: 200, headers: cacheHeaders() },
      );
    }

    // ── search multi ───────────────────────────────────────────────────────
    if (key === "search_multi_filtered") {
      const query = String(searchParams.get("q") || "").trim();
      if (!query || query.length < 2 || query.length > 50) return jsonError("Invalid query.", 400);

      const language = String(searchParams.get("language") || "").trim();
      if (language && !isValidLanguage(language)) return jsonError("Invalid language.", 400);

      const type = searchParams.get("type") || "all";
      if (!["all", "movie", "tv", "person"].includes(type)) return jsonError("Invalid type.", 400);

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

      const genre = searchParams.get("genre") || "";
      if (genre) {
        const genreNum = Number.parseInt(genre, 10);
        if (Number.isFinite(genreNum)) {
          results = results.filter((item) => (item?.genre_ids ?? []).includes(genreNum));
        }
      }

      const year = searchParams.get("year") || "";
      if (year) {
        results = results.filter((item) => {
          const date = item?.release_date || item?.first_air_date || "";
          return date.startsWith(year);
        });
      }

      const rating = searchParams.get("rating") || "";
      if (rating) {
        const minRating = Number(rating);
        if (Number.isFinite(minRating)) {
          results = results.filter((item) => Number(item?.vote_average || 0) >= minRating);
        }
      }

      return new Response(
        JSON.stringify({
          page: data?.page ?? page,
          total_pages: Math.min(Number(data?.total_pages) || 1, 5),
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
          total_pages: Math.min(Number(data?.total_pages) || 1, 5),
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
          total_pages: Math.min(Number(data?.total_pages) || 1, 5),
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

      return new Response(JSON.stringify(data), { status: 200, headers: cacheHeaders() });
    }

    // ── people popular ────────────────────────────────────────────────────
    if (key === "tv_popular_key" || key === "people_popular") {
      const endpoint = key === "people_popular" ? "/person/popular" : "/tv/popular";
      const url = `${TMDB_BASE}${endpoint}?page=${page}`;
      const data = await fetchTmdb(url, token);

      return new Response(
        JSON.stringify({
          page: data?.page ?? page,
          total_pages: Math.min(Number(data?.total_pages) || 1, 5),
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
