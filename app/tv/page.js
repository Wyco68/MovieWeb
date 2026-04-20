import Movies from "@/components/Movies";
import { getTmdbImageConfig, tmdbFetch } from "@/lib/tmdb";

export default async function TVShowsPage() {
  const [data, imageConfig] = await Promise.all([
    tmdbFetch("/tv/popular"),
    getTmdbImageConfig(),
  ]);

  return (
    <>
      <h3 className="section-title">Popular TV Shows</h3>
      <Movies movies={data?.results ?? []} mediaType="tv" imageConfig={imageConfig} />
    </>
  );
}
