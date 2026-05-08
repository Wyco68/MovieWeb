import HorizontalMediaRow from "@/components/HorizontalMediaRow";
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
    tmdbFetch("/trending/all/day", { revalidate: 600 }),
    tmdbFetch("/trending/all/week", { revalidate: 600 }),
    tmdbFetch(DISCOVERY_ENDPOINTS[mediaType].popular, { revalidate: 600 }),
    tmdbFetch(DISCOVERY_ENDPOINTS[mediaType].topRated, { revalidate: 600 }),
    tmdbFetch(DISCOVERY_ENDPOINTS[mediaType].upcoming, { revalidate: 600 }),
    tmdbFetch(DISCOVERY_ENDPOINTS[mediaType].nowPlaying, { revalidate: 600 }),
    tmdbFetch(`/genre/${mediaType}/list`, { revalidate: 86400 }),
    hasFilters
      ? tmdbFetch(`/discover/${mediaType}`, { params: discoverParams, revalidate: 300 })
      : Promise.resolve(null),
    getTmdbImageConfig(),
  ]);

  return (
    <>
      <h2 className="text-[clamp(1.8rem,2.8vw,2.8rem)] leading-[1.1] font-semibold tracking-[-0.26px]">
        Discovery
      </h2>

      <form className="mt-4 grid min-w-0 max-w-full grid-cols-1 gap-3 rounded-[8px] border border-[var(--app-panel-border)] p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
          {(genres?.genres ?? []).map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
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

        <div className="flex min-w-0 gap-2 sm:col-span-2 lg:col-span-2 xl:col-span-1">
          <input
            name="rating"
            defaultValue={minRating}
            placeholder="Min Rating"
            className="h-10 min-w-0 flex-1 rounded-[6px] border border-[var(--app-panel-border)] bg-transparent px-3 text-[14px]"
          />
          <button
            type="submit"
            className="h-10 rounded-[6px] bg-[#533afd] px-4 text-[14px] font-medium text-white sm:px-5"
          >
            Apply
          </button>
        </div>
      </form>

      {hasFilters && discovered ? (
        <HorizontalMediaRow
          title="Filtered Results"
          items={discovered?.results ?? []}
          mediaType={mediaType}
          imageConfig={imageConfig}
          error={false}
          fetchKey="discover_filtered"
          fetchParams={{
            media: mediaType,
            with_genres: genre || undefined,
            with_original_language: language || undefined,
            "vote_average.gte": parseNumber(minRating),
            year: year || undefined,
            sort_by: "popularity.desc",
          }}
          initialPage={discovered?.page ?? 1}
          initialTotalPages={discovered?.total_pages ?? 1}
        />
      ) : null}

      <HorizontalMediaRow
        title="Trending Today"
        items={trendingDay?.results ?? []}
        imageConfig={imageConfig}
        error={false}
        fetchKey="discover_trending_day"
        initialPage={trendingDay?.page ?? 1}
        initialTotalPages={trendingDay?.total_pages ?? 1}
      />

      <HorizontalMediaRow
        title="Trending This Week"
        items={trendingWeek?.results ?? []}
        imageConfig={imageConfig}
        error={false}
        fetchKey="discover_trending_week"
        initialPage={trendingWeek?.page ?? 1}
        initialTotalPages={trendingWeek?.total_pages ?? 1}
      />

      <HorizontalMediaRow
        title="Popular"
        items={popular?.results ?? []}
        mediaType={mediaType}
        imageConfig={imageConfig}
        error={false}
        fetchKey="discover_section"
        fetchParams={{ media: mediaType, section: "popular" }}
        initialPage={popular?.page ?? 1}
        initialTotalPages={popular?.total_pages ?? 1}
      />

      <HorizontalMediaRow
        title="Top Rated"
        items={topRated?.results ?? []}
        mediaType={mediaType}
        imageConfig={imageConfig}
        error={false}
        fetchKey="discover_section"
        fetchParams={{ media: mediaType, section: "top_rated" }}
        initialPage={topRated?.page ?? 1}
        initialTotalPages={topRated?.total_pages ?? 1}
      />

      <HorizontalMediaRow
        title={mediaType === "movie" ? "Upcoming" : "Airing Today"}
        items={upcoming?.results ?? []}
        mediaType={mediaType}
        imageConfig={imageConfig}
        error={false}
        fetchKey="discover_section"
        fetchParams={{ media: mediaType, section: "upcoming" }}
        initialPage={upcoming?.page ?? 1}
        initialTotalPages={upcoming?.total_pages ?? 1}
      />

      <HorizontalMediaRow
        title={mediaType === "movie" ? "Now Playing" : "On The Air"}
        items={nowPlaying?.results ?? []}
        mediaType={mediaType}
        imageConfig={imageConfig}
        error={false}
        fetchKey="discover_section"
        fetchParams={{ media: mediaType, section: "now_playing" }}
        initialPage={nowPlaying?.page ?? 1}
        initialTotalPages={nowPlaying?.total_pages ?? 1}
      />
    </>
  );
}
