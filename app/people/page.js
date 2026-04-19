import Movies from "@/components/Movies";
import { tmdbFetch } from "@/lib/tmdb";

export default async function PeoplePage() {
  const data = await tmdbFetch("/person/popular");

  return (
    <>
      <h3 className="section-title">Popular People</h3>
      <Movies movies={data?.results ?? []} mediaType="person" />
    </>
  );
}
