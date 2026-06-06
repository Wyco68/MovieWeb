import InfiniteMoviesGrid from "@/components/InfiniteMoviesGrid";
import { isValidId } from "@/lib/search-params";
import { getTmdbImageConfig, tmdbFetch } from "@/lib/tmdb";
import { notFound } from "next/navigation";

export default async function GenrePage({ params }) {
  const resolvedParams = await params;
  if (!isValidId(resolvedParams.id)) notFound();

  const [byGenres, genreList, imageConfig] = await Promise.all([
    tmdbFetch("/discover/movie", {
      params: { with_genres: resolvedParams.id, sort_by: "popularity.desc" },
      revalidate: 600,
    }),
    tmdbFetch("/genre/movie/list", { revalidate: 86400 }),
    getTmdbImageConfig(),
  ]);

  const genre = genreList?.genres?.find((g) => String(g.id) === String(resolvedParams.id));
  const genreName = genre?.name || `Genre ${resolvedParams.id}`;

  return (
    <>
      <h3 className="section-title">{genreName}</h3>
      <InfiniteMoviesGrid
        initialItems={byGenres?.results ?? []}
        imageConfig={imageConfig}
        priorityFirstImage
        priorityImageCount={6}
        fetchKey="genre_movies"
        fetchParams={{ genreId: resolvedParams.id }}
        initialPage={byGenres?.page ?? 1}
        initialTotalPages={byGenres?.total_pages ?? 1}
      />
    </>
  );
}
