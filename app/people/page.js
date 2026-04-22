import InfiniteMoviesGrid from "@/components/InfiniteMoviesGrid";
import { getTmdbImageConfig, tmdbFetch } from "@/lib/tmdb";

export default async function PeoplePage() {
  const [data, imageConfig] = await Promise.all([
    tmdbFetch("/person/popular"),
    getTmdbImageConfig(),
  ]);

  return (
    <>
      <h3 className="section-title">Popular People</h3>
      <InfiniteMoviesGrid
        initialItems={data?.results ?? []}
        mediaType="person"
        imageConfig={imageConfig}
        fetchKey="people_popular"
        initialPage={data?.page ?? 1}
        initialTotalPages={data?.total_pages ?? 1}
      />
    </>
  );
}
