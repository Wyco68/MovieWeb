import InfiniteMoviesGrid from "@/components/InfiniteMoviesGrid";
import { getTmdbImageConfig, tmdbFetch } from "@/lib/tmdb";

export default async function TVShowsPage() {
  const [data, imageConfig] = await Promise.all([
    tmdbFetch("/tv/popular"),
    getTmdbImageConfig(),
  ]);

  return (
    <>
      <h3 className="section-title">Popular TV Shows</h3>
      <InfiniteMoviesGrid
        initialItems={data?.results ?? []}
        mediaType="tv"
        imageConfig={imageConfig}
        fetchKey="tv_popular"
        initialPage={data?.page ?? 1}
        initialTotalPages={data?.total_pages ?? 1}
      />
    </>
  );
}
