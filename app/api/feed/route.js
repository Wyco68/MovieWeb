import { NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/tmdb";

const DISCOVERY_ENDPOINTS = {
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

function clampPage(rawPage) {
  const parsed = Number.parseInt(String(rawPage || "1"), 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  if (parsed > 500) {
    return 500;
  }

  return parsed;
}

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeYear(item) {
  const date = item?.release_date || item?.first_air_date;
  return date?.split("-")[0];
}

function applySearchFilters(results, { type, genre, year, rating }) {
  const minRating = parseNumber(rating);
  const genreNumber = Number.parseInt(String(genre || ""), 10);

  return (results ?? []).filter((item) => {
    if (type && type !== "all" && item.media_type !== type) {
      return false;
    }

    if (Number.isFinite(genreNumber) && !(item?.genre_ids ?? []).includes(genreNumber)) {
      return false;
    }

    if (year && normalizeYear(item) !== year) {
      return false;
    }

    if (minRating !== undefined && Number(item?.vote_average || 0) < minRating) {
      return false;
    }

    return true;
  });
}

async function fetchByKey(key, page, searchParams) {
  if (key === "tv_popular") {
    return tmdbFetch("/tv/popular", { params: { page }, revalidate: 300 });
  }

  if (key === "people_popular") {
    return tmdbFetch("/person/popular", { params: { page }, revalidate: 300 });
  }

  if (key === "genre_movies") {
    const genreId = String(searchParams.get("genreId") || "").trim();

    return tmdbFetch("/discover/movie", {
      params: {
        with_genres: genreId || undefined,
        page,
      },
      revalidate: 300,
    });
  }

  if (key === "discover_trending_day") {
    return tmdbFetch("/trending/all/day", { params: { page }, revalidate: 300 });
  }

  if (key === "discover_trending_week") {
    return tmdbFetch("/trending/all/week", { params: { page }, revalidate: 300 });
  }

  if (key === "discover_section") {
    const media = String(searchParams.get("media") || "movie");
    const section = String(searchParams.get("section") || "popular");
    const endpoint = DISCOVERY_ENDPOINTS[media]?.[section];

    if (!endpoint) {
      throw new Error("Invalid discovery section.");
    }

    return tmdbFetch(endpoint, { params: { page }, revalidate: 300 });
  }

  if (key === "discover_filtered") {
    const media = String(searchParams.get("media") || "movie");
    const genre = String(searchParams.get("genre") || "").trim();
    const year = String(searchParams.get("year") || "").trim();
    const language = String(searchParams.get("language") || "").trim();
    const rating = String(searchParams.get("rating") || "").trim();

    const params = {
      sort_by: "popularity.desc",
      with_genres: genre || undefined,
      with_original_language: language || undefined,
      "vote_average.gte": parseNumber(rating),
      page,
    };

    if (media === "movie") {
      params.primary_release_year = year || undefined;
    } else {
      params.first_air_date_year = year || undefined;
    }

    return tmdbFetch(`/discover/${media}`, {
      params,
      revalidate: 300,
    });
  }

  if (key === "search_multi_filtered") {
    const query = String(searchParams.get("q") || "").trim();
    const language = String(searchParams.get("language") || "").trim();
    const type = String(searchParams.get("type") || "all");
    const genre = String(searchParams.get("genre") || "").trim();
    const year = String(searchParams.get("year") || "").trim();
    const rating = String(searchParams.get("rating") || "").trim();

    const payload = await tmdbFetch("/search/multi", {
      params: {
        query,
        language: language || undefined,
        include_adult: false,
        page,
      },
      revalidate: 300,
    });

    return {
      ...payload,
      results: applySearchFilters(payload?.results ?? [], {
        type,
        genre,
        year,
        rating,
      }),
    };
  }

  if (key === "movie_similar") {
    const movieId = String(searchParams.get("movieId") || "").trim();

    return tmdbFetch(`/movie/${movieId}/similar`, {
      params: { page },
      revalidate: 300,
    });
  }

  if (key === "movie_recommendations") {
    const movieId = String(searchParams.get("movieId") || "").trim();

    return tmdbFetch(`/movie/${movieId}/recommendations`, {
      params: { page },
      revalidate: 300,
    });
  }

  if (key === "tv_similar") {
    const tvId = String(searchParams.get("tvId") || "").trim();

    return tmdbFetch(`/tv/${tvId}/similar`, {
      params: { page },
      revalidate: 300,
    });
  }

  if (key === "tv_recommendations") {
    const tvId = String(searchParams.get("tvId") || "").trim();

    return tmdbFetch(`/tv/${tvId}/recommendations`, {
      params: { page },
      revalidate: 300,
    });
  }

  throw new Error("Invalid feed key.");
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const key = String(searchParams.get("key") || "");
  const page = clampPage(searchParams.get("page"));

  if (!key) {
    return NextResponse.json({ error: "Missing feed key." }, { status: 400 });
  }

  try {
    const payload = await fetchByKey(key, page, searchParams);

    return NextResponse.json({
      page: payload?.page || page,
      total_pages: payload?.total_pages || 1,
      results: Array.isArray(payload?.results) ? payload.results : [],
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch feed data." }, { status: 500 });
  }
}
