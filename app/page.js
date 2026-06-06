import HorizontalMediaRow from "@/components/HorizontalMediaRow";
import HeroSection from "@/components/HeroSection";
import { clampPage } from "@/lib/search-params";
import {
  getConfiguredImageUrl,
  getTmdbImageConfig,
  tmdbFetch,
} from "@/lib/tmdb";

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

export default async function Home({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const page = clampPage(resolvedSearchParams?.page);

  const [
    popularResult,
    trendingResult,
    tvPopularResult,
    topRatedResult,
    imageConfigResult,
  ] = await Promise.allSettled([
    tmdbFetch("/movie/popular", { params: { page }, revalidate: 600 }),
    tmdbFetch("/trending/movie/week", { params: { page }, revalidate: 600 }),
    tmdbFetch("/tv/popular", { params: { page }, revalidate: 600 }),
    tmdbFetch("/movie/top_rated", { params: { page }, revalidate: 600 }),
    getTmdbImageConfig(),
  ]);

  const imageConfig = imageConfigResult.status === "fulfilled" ? imageConfigResult.value : null;
  const popular = settledSection(popularResult);
  const trending = settledSection(trendingResult);
  const tvPopular = settledSection(tvPopularResult);
  const topRated = settledSection(topRatedResult);

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
