import Movies from "@/components/Movies";
import { tmdbFetch } from "@/lib/tmdb";

export default async function TVShowsPage() {
  const data = await tmdbFetch("/tv/popular");

  return (
    <>
      <h3 className="section-title">Popular TV Shows</h3>
      <Movies movies={data?.results ?? []} mediaType="tv" />
    </>
  );
}
