import Movies from "@/components/Movies";
import { tmdbFetch } from "@/lib/tmdb";

export default async function Search({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const q = String(resolvedSearchParams?.q ?? "").trim();
  const search = q
    ? await tmdbFetch("/search/movie", { params: { query: q } })
    : { results: [] };

  return (
    <>
      <h3 className="section-title">Search: {q || "-"}</h3>
      <Movies movies={search?.results ?? []} />
    </>
  );
}
