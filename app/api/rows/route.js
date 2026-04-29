import { NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/tmdb";
import { applyRateLimit } from "@/lib/rate-limit";

const STATIC_ENDPOINTS = {
  popular_movies: "/movie/popular",
  trending_movies_week: "/trending/movie/week",
  popular_tv: "/tv/popular",
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
const REVALIDATE_STATIC = 600;
const REVALIDATE_FILTERED = 180;

function clampPage(rawPage) {
  const parsed = Number.parseInt(String(rawPage || "1"), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  if (parsed > 500) return 500;
  return parsed;
}

function cacheHeaders(maxAgeSeconds) {
  return {
    "Cache-Control": `public, max-age=${maxAgeSeconds}, stale-while-revalidate=${maxAgeSeconds * 2}`,
  };
}

export async function GET(request) {
  const rate = applyRateLimit(request, {
    bucketName: "api-rows",
    maxRequests: 120,
    windowMs: 60_000,
  });

  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please retry later." },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      },
    );
  }

  const { searchParams } = new URL(request.url);
  const key = String(searchParams.get("key") || "");
  const page = clampPage(searchParams.get("page"));

  let endpoint = STATIC_ENDPOINTS[key];
  const tmdbParams = { page };
  let revalidate = REVALIDATE_STATIC;

  if (!endpoint) {
    if (key === "discover_section") {
      const media = searchParams.get("media") === "tv" ? "tv" : "movie";
      const section = String(searchParams.get("section") || "popular");
      endpoint = SECTION_ENDPOINTS[media]?.[section];

      if (!endpoint) {
        return NextResponse.json({ error: "Invalid section." }, { status: 400 });
      }
    } else if (key === "discover_filtered") {
      const media = searchParams.get("media") === "tv" ? "tv" : "movie";
      endpoint = `/discover/${media}`;
      revalidate = REVALIDATE_FILTERED;

      for (const fk of FILTER_PARAM_KEYS) {
        const val = searchParams.get(fk);
        if (val) tmdbParams[fk] = val;
      }
      if (!tmdbParams.sort_by) tmdbParams.sort_by = "popularity.desc";
    } else {
      return NextResponse.json({ error: "Invalid row key." }, { status: 400 });
    }
  }

  try {
    const payload = await tmdbFetch(endpoint, { params: tmdbParams, revalidate });

    return NextResponse.json(
      {
        page: payload?.page || page,
        total_pages: payload?.total_pages || 1,
        results: Array.isArray(payload?.results) ? payload.results : [],
      },
      { headers: cacheHeaders(revalidate) },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch row data." },
      { status: 500 },
    );
  }
}
