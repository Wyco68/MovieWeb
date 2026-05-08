import HorizontalMediaRow from "@/components/HorizontalMediaRow";
import { getTmdbImageConfig, tmdbFetch } from "@/lib/tmdb";

export default async function TVShowsPage() {
  const [popular, topRated, airingToday, onAir, imageConfig] = await Promise.all([
    tmdbFetch("/tv/popular", { revalidate: 600 }),
    tmdbFetch("/tv/top_rated", { revalidate: 600 }),
    tmdbFetch("/tv/airing_today", { revalidate: 600 }),
    tmdbFetch("/tv/on_the_air", { revalidate: 600 }),
    getTmdbImageConfig(),
  ]);

  return (
    <>
      <h2 className="text-[clamp(1.8rem,2.8vw,2.8rem)] leading-[1.1] font-semibold tracking-[-0.26px]">
        TV Shows
      </h2>

      <HorizontalMediaRow
        title="Popular"
        items={popular?.results ?? []}
        mediaType="tv"
        imageConfig={imageConfig}
        error={false}
        fetchKey="popular_tv"
        initialPage={popular?.page ?? 1}
        initialTotalPages={popular?.total_pages ?? 1}
      />

      <HorizontalMediaRow
        title="Top Rated"
        items={topRated?.results ?? []}
        mediaType="tv"
        imageConfig={imageConfig}
        error={false}
        fetchKey="top_rated_tv"
        initialPage={topRated?.page ?? 1}
        initialTotalPages={topRated?.total_pages ?? 1}
      />

      <HorizontalMediaRow
        title="Airing Today"
        items={airingToday?.results ?? []}
        mediaType="tv"
        imageConfig={imageConfig}
        error={false}
        fetchKey="airing_today_tv"
        initialPage={airingToday?.page ?? 1}
        initialTotalPages={airingToday?.total_pages ?? 1}
      />

      <HorizontalMediaRow
        title="On The Air"
        items={onAir?.results ?? []}
        mediaType="tv"
        imageConfig={imageConfig}
        error={false}
        fetchKey="on_the_air_tv"
        initialPage={onAir?.page ?? 1}
        initialTotalPages={onAir?.total_pages ?? 1}
      />
    </>
  );
}
