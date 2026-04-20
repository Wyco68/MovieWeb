import Movies from "@/components/Movies";
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
      <Movies movies={byGenres?.results ?? []} imageConfig={imageConfig} />
    </>
  );
}
