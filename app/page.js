"use client";

import { useEffect, useState } from "react";
import HorizontalMediaRow from "@/components/HorizontalMediaRow";
import HeroSection from "@/components/HeroSection";
import Loading from "@/app/loading";
import { fetchTmdb } from "@/lib/api";
import { getConfiguredImageUrl } from "@/lib/tmdb-image";

// Image config is not fetched — getConfiguredImageUrl falls back to TMDB's
// standard base URL + sizes, which are identical to the configured values.
const imageConfig = null;

function settledSection(result) {
  if (result?.status !== "fulfilled") {
    return { items: [], totalPages: 1, currentPage: 1, error: true };
  }
  return {
    items: result.value?.results ?? [],
    totalPages: result.value?.total_pages ?? 1,
    currentPage: result.value?.page ?? 1,
    error: false,
  };
}

export default function Home() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;

    Promise.allSettled([
      fetchTmdb({ key: "popular_movies" }),
      fetchTmdb({ key: "trending_movies_week" }),
      fetchTmdb({ key: "popular_tv" }),
      fetchTmdb({ key: "top_rated_movies" }),
    ]).then(([popularResult, trendingResult, tvPopularResult, topRatedResult]) => {
      if (!active) return;
      setData({
        popular: settledSection(popularResult),
        trending: settledSection(trendingResult),
        tvPopular: settledSection(tvPopularResult),
        topRated: settledSection(topRatedResult),
      });
    });

    return () => {
      active = false;
    };
  }, []);

  if (!data) return <Loading />;

  const { popular, trending, tvPopular, topRated } = data;

  const featured = popular.items[0] || trending.items[0] || tvPopular.items[0];
  const featuredBackdrop = getConfiguredImageUrl(featured?.backdrop_path, {
    config: imageConfig,
    type: "backdrop",
    variant: "lg",
  });
  const featuredYear = featured?.release_date?.split("-")[0] ?? "N/A";

  return (
    <div className="flex flex-col gap-8 pb-12">
      <HeroSection
        featured={featured}
        featuredBackdrop={featuredBackdrop}
        featuredYear={featuredYear}
      />

      <div className="flex flex-col gap-10">
        <HorizontalMediaRow
          title="Popular Movies"
          items={popular.items}
          imageConfig={imageConfig}
          error={popular.error}
          priorityFirstImage
          fetchKey="popular_movies"
          initialPage={popular.currentPage}
          initialTotalPages={popular.totalPages}
        />

        <HorizontalMediaRow
          title="Trending This Week"
          items={trending.items}
          imageConfig={imageConfig}
          error={trending.error}
          fetchKey="trending_movies_week"
          initialPage={trending.currentPage}
          initialTotalPages={trending.totalPages}
        />

        <HorizontalMediaRow
          title="Popular TV Shows"
          items={tvPopular.items}
          mediaType="tv"
          imageConfig={imageConfig}
          error={tvPopular.error}
          fetchKey="popular_tv"
          initialPage={tvPopular.currentPage}
          initialTotalPages={tvPopular.totalPages}
        />

        <HorizontalMediaRow
          title="Top Rated Movies"
          items={topRated.items}
          imageConfig={imageConfig}
          error={topRated.error}
          fetchKey="top_rated_movies"
          initialPage={topRated.currentPage}
          initialTotalPages={topRated.totalPages}
        />
      </div>
    </div>
  );
}
