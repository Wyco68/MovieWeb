import InfiniteMoviesGrid from "@/components/InfiniteMoviesGrid";
import { getTmdbImageConfig, tmdbFetch } from "@/lib/tmdb";

export default async function Home({ params }) {
  const resolvedParams = await params;
  const [byGenres, imageConfig] = await Promise.all([
    tmdbFetch("/discover/movie", {
      params: { with_genres: resolvedParams.id },
    }),
    getTmdbImageConfig(),
  ]);

  return (
    <>
      <h3 className="section-title">{resolvedParams.name}</h3>
      <InfiniteMoviesGrid
        initialItems={byGenres?.results ?? []}
        imageConfig={imageConfig}
        fetchKey="genre_movies"
        fetchParams={{ genreId: resolvedParams.id }}
        initialPage={byGenres?.page ?? 1}
        initialTotalPages={byGenres?.total_pages ?? 1}
      />
    </>
  );
}
