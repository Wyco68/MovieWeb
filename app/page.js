import Image from "next/image";
import Link from "next/link";
import HorizontalMediaRow from "@/components/HorizontalMediaRow";
import {
  getConfiguredImageUrl,
  getTmdbImageConfig,
  tmdbFetch,
} from "@/lib/tmdb";

function asPage(value) {
  const parsed = Number.parseInt(String(value || "1"), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  if (parsed > 500) return 500;
  return parsed;
}

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
  const page = asPage(resolvedSearchParams?.page);

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
    <div>
      {featured && featuredBackdrop ? (
        <section className="hero-panel">
          <Image
            src={featuredBackdrop}
            alt={`${featured.title} backdrop`}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 960px"
          />
          <div className="hero-overlay" />
          <div className="hero-content">
            <p className="hero-kicker">Featured Tonight</p>
            <h2 className="hero-title">{featured.title}</h2>
            <p className="hero-meta">
              {featuredYear} &bull; Rating {featured.vote_average?.toFixed?.(1) || "-"}
            </p>
            <p className="hero-copy">
              {featured.overview ||
                "Explore one of the most talked-about titles right now and dive into a complete cast and detail view."}
            </p>
            <div className="mt-5 flex gap-2">
              <Link href={`/movie/${featured.id}`}>
                <span className="inline-flex items-center rounded-[4px] bg-[#533afd] px-4 py-2 text-[14px] text-white">
                  View Details
                </span>
              </Link>
              <Link href="/search">
                <span className="hero-cta-soft inline-flex items-center rounded-[4px] border px-4 py-2 text-[14px] backdrop-blur-sm">
                  Explore More
                </span>
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <HorizontalMediaRow
        title="Popular Movies"
        items={popular.items}
        imageConfig={imageConfig}
        error={popular.error}
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
  );
}
