import InfiniteMoviesGrid from "@/components/InfiniteMoviesGrid";
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
    if (mediaType !== "all" && item.media_type !== mediaType) {
      return false;
    }

    if (genre && !item?.genre_ids?.includes(Number(genre))) {
      return false;
    }

    if (year && normalizeYear(item) !== year) {
      return false;
    }

    if (minRating !== undefined && Number(item.vote_average || 0) < minRating) {
      return false;
    }

    return true;
  });
}

export default async function Search({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const q = String(resolvedSearchParams?.q ?? "").trim();
  const mediaType = ["all", "movie", "tv", "person"].includes(
    resolvedSearchParams?.type,
  )
    ? resolvedSearchParams.type
    : "all";
  const genre = String(resolvedSearchParams?.genre ?? "").trim();
  const year = String(resolvedSearchParams?.year ?? "").trim();
  const language = String(resolvedSearchParams?.language ?? "").trim();
  const rating = String(resolvedSearchParams?.rating ?? "").trim();

  const [search, movieGenres, tvGenres, imageConfig] = await Promise.all([
    q
      ? tmdbFetch("/search/multi", {
          params: {
            query: q,
            language: language || undefined,
            include_adult: false,
          },
        })
      : Promise.resolve({ results: [] }),
    tmdbFetch("/genre/movie/list"),
    tmdbFetch("/genre/tv/list"),
    getTmdbImageConfig(),
  ]);

  const genreMap = new Map();

  (movieGenres?.genres ?? []).forEach((item) => {
    genreMap.set(item.id, item.name);
  });

  (tvGenres?.genres ?? []).forEach((item) => {
    genreMap.set(item.id, item.name);
  });

  const filteredResults = filterSearchResults(search?.results ?? [], {
    mediaType,
    genre,
    year,
    minRating: parseNumber(rating),
  });

  return (
    <>
      <h3 className="section-title">Search: {q || "-"}</h3>

      <form className="mb-4 mt-3 grid grid-cols-1 gap-3 rounded-[8px] border border-[var(--app-panel-border)] p-4 sm:grid-cols-2 lg:grid-cols-5">
        <input type="hidden" name="q" defaultValue={q} />

        <select
          name="type"
          defaultValue={mediaType}
          className="filter-select h-10 rounded-[6px] border border-[var(--app-panel-border)] px-3 text-[14px]"
        >
          <option value="all">All Types</option>
          <option value="movie">Movies</option>
          <option value="tv">TV Shows</option>
          <option value="person">People</option>
        </select>

        <select
          name="genre"
          defaultValue={genre}
          className="filter-select h-10 rounded-[6px] border border-[var(--app-panel-border)] px-3 text-[14px]"
        >
          <option value="">All Genres</option>
          {Array.from(genreMap.entries()).map(([id, name]) => {
            return (
              <option key={id} value={id}>
                {name}
              </option>
            );
          })}
        </select>

        <input
          name="year"
          defaultValue={year}
          placeholder="Year"
          className="h-10 rounded-[6px] border border-[var(--app-panel-border)] bg-transparent px-3 text-[14px]"
        />

        <input
          name="language"
          defaultValue={language}
          placeholder="Language (en)"
          className="h-10 rounded-[6px] border border-[var(--app-panel-border)] bg-transparent px-3 text-[14px]"
        />

        <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
          <input
            name="rating"
            defaultValue={rating}
            placeholder="Min Rating"
            className="h-10 flex-1 rounded-[6px] border border-[var(--app-panel-border)] bg-transparent px-3 text-[14px]"
          />
          <button
            type="submit"
            className="h-10 rounded-[6px] bg-[#533afd] px-4 text-[14px] font-medium text-white sm:px-5"
          >
            Apply
          </button>
        </div>
      </form>

      <InfiniteMoviesGrid
        initialItems={filteredResults}
        imageConfig={imageConfig}
        fetchKey="search_multi_filtered"
        fetchParams={{
          q,
          language,
          type: mediaType,
          genre,
          year,
          rating,
        }}
        initialPage={search?.page ?? 1}
        initialTotalPages={search?.total_pages ?? 1}
      />
    </>
  );
}
