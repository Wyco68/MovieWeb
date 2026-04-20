import Movies from "@/components/Movies";
import { getTmdbImageConfig, tmdbFetch } from "@/lib/tmdb";

const DISCOVERY_ENDPOINTS = {
  movie: {
    popular: "/movie/popular",
    topRated: "/movie/top_rated",
    upcoming: "/movie/upcoming",
    nowPlaying: "/movie/now_playing",
  },
  tv: {
    popular: "/tv/popular",
    topRated: "/tv/top_rated",
    upcoming: "/tv/airing_today",
    nowPlaying: "/tv/on_the_air",
  },
};

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default async function DiscoverPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;

  const mediaType = ["movie", "tv"].includes(resolvedSearchParams?.media)
    ? resolvedSearchParams.media
    : "movie";
  const genre = String(resolvedSearchParams?.genre ?? "").trim();
  const year = String(resolvedSearchParams?.year ?? "").trim();
  const language = String(resolvedSearchParams?.language ?? "").trim();
  const minRating = String(resolvedSearchParams?.rating ?? "").trim();
  const hasFilters =
    mediaType !== "movie" ||
    Boolean(genre) ||
    Boolean(year) ||
    Boolean(language) ||
    Boolean(minRating);

  const discoverParams = {
    sort_by: "popularity.desc",
    with_genres: genre || undefined,
    with_original_language: language || undefined,
    "vote_average.gte": parseNumber(minRating),
  };

  if (mediaType === "movie") {
    discoverParams.primary_release_year = year || undefined;
  } else {
    discoverParams.first_air_date_year = year || undefined;
  }

  const [
    trendingDay,
    trendingWeek,
    popular,
    topRated,
    upcoming,
    nowPlaying,
    genres,
    discovered,
    imageConfig,
  ] = await Promise.all([
    tmdbFetch("/trending/all/day"),
    tmdbFetch("/trending/all/week"),
    tmdbFetch(DISCOVERY_ENDPOINTS[mediaType].popular),
    tmdbFetch(DISCOVERY_ENDPOINTS[mediaType].topRated),
    tmdbFetch(DISCOVERY_ENDPOINTS[mediaType].upcoming),
    tmdbFetch(DISCOVERY_ENDPOINTS[mediaType].nowPlaying),
    tmdbFetch(`/genre/${mediaType}/list`),
    hasFilters
      ? tmdbFetch(`/discover/${mediaType}`, { params: discoverParams })
      : Promise.resolve(null),
    getTmdbImageConfig(),
  ]);

  const filteredResults = discovered?.results ?? [];

  return (
    <>
      <h2 className="text-[clamp(1.8rem,2.8vw,2.8rem)] leading-[1.1] font-semibold tracking-[-0.26px]">
        Discovery
      </h2>

      <form className="mt-4 grid gap-3 rounded-[8px] border border-[var(--app-panel-border)] p-4 md:grid-cols-5">
        <select
          name="media"
          defaultValue={mediaType}
          className="filter-select h-10 rounded-[6px] border border-[var(--app-panel-border)] px-3 text-[14px]"
        >
          <option value="movie">Movies</option>
          <option value="tv">TV Shows</option>
        </select>

        <select
          name="genre"
          defaultValue={genre}
          className="filter-select h-10 rounded-[6px] border border-[var(--app-panel-border)] px-3 text-[14px]"
        >
          <option value="">All Genres</option>
          {(genres?.genres ?? []).map((item) => {
            return (
              <option key={item.id} value={item.id}>
                {item.name}
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

        <div className="flex gap-2">
          <input
            name="rating"
            defaultValue={minRating}
            placeholder="Min Rating"
            className="h-10 flex-1 rounded-[6px] border border-[var(--app-panel-border)] bg-transparent px-3 text-[14px]"
          />
          <button
            type="submit"
            className="h-10 rounded-[6px] bg-[#533afd] px-4 text-[14px] font-medium text-white"
          >
            Apply
          </button>
        </div>
      </form>

      {hasFilters ? (
        <>
          <h3 className="section-title mt-8">Filtered Results</h3>
          {filteredResults.length ? (
            <Movies movies={filteredResults} mediaType={mediaType} imageConfig={imageConfig} />
          ) : (
            <p className="muted-label rounded-[8px] border border-[var(--app-panel-border)] px-4 py-3 text-[14px]">
              No result found.
            </p>
          )}
        </>
      ) : null}

      <h3 className="section-title mt-8">Trending Today</h3>
      <Movies movies={trendingDay?.results ?? []} imageConfig={imageConfig} />

      <h3 className="section-title mt-8">Trending This Week</h3>
      <Movies movies={trendingWeek?.results ?? []} imageConfig={imageConfig} />

      <h3 className="section-title mt-8">
        {mediaType === "movie" ? "Popular Movies" : "Popular TV Shows"}
      </h3>
      <Movies movies={popular?.results ?? []} mediaType={mediaType} imageConfig={imageConfig} />

      <h3 className="section-title mt-8">Top Rated</h3>
      <Movies movies={topRated?.results ?? []} mediaType={mediaType} imageConfig={imageConfig} />

      <h3 className="section-title mt-8">
        {mediaType === "movie" ? "Upcoming" : "Airing Today"}
      </h3>
      <Movies movies={upcoming?.results ?? []} mediaType={mediaType} imageConfig={imageConfig} />

      <h3 className="section-title mt-8">
        {mediaType === "movie" ? "Now Playing" : "On The Air"}
      </h3>
      <Movies movies={nowPlaying?.results ?? []} mediaType={mediaType} imageConfig={imageConfig} />
    </>
  );
}
