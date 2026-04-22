import { NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/tmdb";

const ROW_ENDPOINTS = {
  popular_movies: "/movie/popular",
  trending_movies_week: "/trending/movie/week",
  popular_tv: "/tv/popular",
  popular_people: "/person/popular",
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

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const key = String(searchParams.get("key") || "");
  const page = clampPage(searchParams.get("page"));
  const endpoint = ROW_ENDPOINTS[key];

  if (!endpoint) {
    return NextResponse.json({ error: "Invalid row key." }, { status: 400 });
  }

  try {
    const payload = await tmdbFetch(endpoint, {
      params: { page },
      revalidate: 300,
    });

    return NextResponse.json({
      page: payload?.page || page,
      total_pages: payload?.total_pages || 1,
      results: Array.isArray(payload?.results) ? payload.results : [],
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch row data." }, { status: 500 });
  }
}
