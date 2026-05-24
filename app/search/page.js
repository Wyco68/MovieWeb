import InfiniteMoviesGrid from "@/components/InfiniteMoviesGrid";
import FilterPanel from "@/components/FilterPanel";
import { getTmdbImageConfig, tmdbFetch } from "@/lib/tmdb";

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeYear(item) {
  const date = item?.release_date || item?.first_air_date;
  return date?.split("-")[0];
}

function filterSearchResults(results, { mediaType, genre, year, minRating }) {
  return results.filter((item) => {
    if (mediaType !== "all" && item.media_type !== mediaType) return false;
    if (genre && !item?.genre_ids?.includes(Number(genre))) return false;
    if (year && normalizeYear(item) !== year) return false;
    if (minRating !== undefined && Number(item.vote_average || 0) < minRating) return false;
    return true;
  });
}

export default async function Search({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const q = String(resolvedSearchParams?.q ?? "").trim();
  const mediaType = ["all", "movie", "tv", "person"].includes(resolvedSearchParams?.type)
    ? resolvedSearchParams.type
    : "all";
  const genre = String(resolvedSearchParams?.genre ?? "").trim();
  const year = String(resolvedSearchParams?.year ?? "").trim();
  const language = String(resolvedSearchParams?.language ?? "").trim();
  const rating = String(resolvedSearchParams?.rating ?? "").trim();

  const [search, movieGenres, tvGenres, imageConfig] = await Promise.all([
    q && q.length >= 2
      ? tmdbFetch("/search/multi", {
          params: { query: q, language: language || undefined, include_adult: false },
          revalidate: 300,
        })
      : Promise.resolve({ results: [] }),
    tmdbFetch("/genre/movie/list", { revalidate: 86400 }),
    tmdbFetch("/genre/tv/list", { revalidate: 86400 }),
    getTmdbImageConfig(),
  ]);

  const genreMap = new Map();
  (movieGenres?.genres ?? []).forEach((item) => genreMap.set(item.id, item.name));
  (tvGenres?.genres ?? []).forEach((item) => genreMap.set(item.id, item.name));

  const filteredResults = filterSearchResults(search?.results ?? [], {
    mediaType,
    genre,
    year,
    minRating: parseNumber(rating),
  });

  return (
    <div className="pb-12">
      <div className="mb-6 border-b border-[var(--app-panel-border)] pb-4">
        <h2 className="text-3xl font-light tracking-tight text-[#061b31] dark:text-white">
          {q ? `Search Results for "${q}"` : "Explore"}
        </h2>
        {q && (
          <p className="mt-2 text-sm text-[#64748d] dark:text-white/60">
            Found {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <FilterPanel
        q={q}
        mediaType={mediaType}
        genre={genre}
        year={year}
        language={language}
        rating={rating}
        genreMap={genreMap}
      />

      <div className="mt-8">
        {filteredResults.length > 0 ? (
          <InfiniteMoviesGrid
            initialItems={filteredResults}
            imageConfig={imageConfig}
            priorityFirstImage
            priorityImageCount={6}
            fetchKey="search_multi_filtered"
            fetchParams={{ q, language, type: mediaType, genre, year, rating }}
            initialPage={search?.page ?? 1}
            initialTotalPages={search?.total_pages ?? 1}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white dark:bg-[#1c1e54] rounded-lg border border-[var(--app-panel-border)] border-dashed">
            <h3 className="text-xl font-medium text-[#061b31] dark:text-white mb-2">No results found</h3>
            <p className="text-[#64748d] dark:text-white/60 max-w-md">
              We couldn't find any matches for your search. Try adjusting your filters or search query.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
