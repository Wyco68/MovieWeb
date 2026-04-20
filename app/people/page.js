import Movies from "@/components/Movies";
import { getTmdbImageConfig, tmdbFetch } from "@/lib/tmdb";

export default async function PeoplePage() {
  const [data, imageConfig] = await Promise.all([
    tmdbFetch("/person/popular"),
    getTmdbImageConfig(),
  ]);

  return (
    <>
      <h3 className="section-title">Popular People</h3>
      <Movies movies={data?.results ?? []} mediaType="person" imageConfig={imageConfig} />
    </>
  );
}
