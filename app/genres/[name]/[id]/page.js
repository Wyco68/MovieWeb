import Movies from "@/components/Movies";
import { tmdbFetch } from "@/lib/tmdb";

export default async function Home({ params }) {
  const resolvedParams = await params;
  const byGenres = await tmdbFetch("/discover/movie", {
    params: { with_genres: resolvedParams.id },
  });

  return (
    <>
      <h3 className="section-title">{resolvedParams.name}</h3>
      <Movies movies={byGenres?.results ?? []} />
    </>
  );
}
