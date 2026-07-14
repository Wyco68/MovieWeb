"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import HorizontalMediaRow from "@/components/HorizontalMediaRow";
import Loading from "@/app/loading";
import { fetchTmdb } from "@/lib/api";
import { parseRatingNumber, sanitizeDiscoverParams } from "@/lib/search-params";

const imageConfig = null;

function section(result) {
  return {
    items: result?.results ?? [],
    page: result?.page ?? 1,
    totalPages: result?.total_pages ?? 1,
  };
}

export default function DiscoverView() {
  const searchParams = useSearchParams();
  const [data, setData] = useState(null);

  const {
    media: mediaType,
    with_genres: genre,
    with_original_language: language,
    year,
    rating: minRating,
    sort_by: sortBy,
  } = sanitizeDiscoverParams({
    media: searchParams.get("media"),
    genre: searchParams.get("genre"),
    language: searchParams.get("language"),
    year: searchParams.get("year"),
    rating: searchParams.get("rating"),
    sort_by: searchParams.get("sort_by"),
  });

  const hasFilters =
    mediaType !== "movie" ||
    Boolean(genre) ||
    Boolean(year) ||
    Boolean(language) ||
    Boolean(minRating);

  useEffect(() => {
    let active = true;
    setData(null);

    const filteredParams = {
      media: mediaType,
      with_genres: genre || undefined,
      with_original_language: language || undefined,
      "vote_average.gte": parseRatingNumber(minRating),
      year: year || undefined,
      sort_by: sortBy,
    };

    Promise.all([
      fetchTmdb({ key: "discover_trending_day" }).catch(() => null),
      fetchTmdb({ key: "discover_trending_week" }).catch(() => null),
      fetchTmdb({ key: "discover_section", media: mediaType, section: "popular" }).catch(() => null),
      fetchTmdb({ key: "discover_section", media: mediaType, section: "top_rated" }).catch(() => null),
      fetchTmdb({ key: "discover_section", media: mediaType, section: "upcoming" }).catch(() => null),
      fetchTmdb({ key: "discover_section", media: mediaType, section: "now_playing" }).catch(() => null),
      fetchTmdb({ key: "genre_list", media: mediaType }).catch(() => ({ genres: [] })),
      hasFilters
        ? fetchTmdb({ key: "discover_filtered", ...filteredParams }).catch(() => null)
        : Promise.resolve(null),
    ]).then(([trendingDay, trendingWeek, popular, topRated, upcoming, nowPlaying, genres, discovered]) => {
      if (!active) return;
      setData({
        trendingDay: section(trendingDay),
        trendingWeek: section(trendingWeek),
        popular: section(popular),
        topRated: section(topRated),
        upcoming: section(upcoming),
        nowPlaying: section(nowPlaying),
        genres: genres?.genres ?? [],
        discovered: discovered ? section(discovered) : null,
      });
    });

    return () => {
      active = false;
    };
  }, [mediaType, genre, language, year, minRating, sortBy, hasFilters]);

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
          {(data?.genres ?? []).map((item) => (
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

      {!data ? (
        <Loading />
      ) : (
        <>
          {hasFilters && data.discovered ? (
            <HorizontalMediaRow
              title="Filtered Results"
              items={data.discovered.items}
              mediaType={mediaType}
              imageConfig={imageConfig}
              error={false}
              priorityFirstImage
              fetchKey="discover_filtered"
              fetchParams={{
                media: mediaType,
                with_genres: genre || undefined,
                with_original_language: language || undefined,
                "vote_average.gte": parseRatingNumber(minRating),
                year: year || undefined,
                sort_by: sortBy,
              }}
              initialPage={data.discovered.page}
              initialTotalPages={data.discovered.totalPages}
            />
          ) : null}

          <HorizontalMediaRow
            title="Trending Today"
            items={data.trendingDay.items}
            imageConfig={imageConfig}
            error={false}
            priorityFirstImage={!hasFilters}
            fetchKey="discover_trending_day"
            initialPage={data.trendingDay.page}
            initialTotalPages={data.trendingDay.totalPages}
          />

          <HorizontalMediaRow
            title="Trending This Week"
            items={data.trendingWeek.items}
            imageConfig={imageConfig}
            error={false}
            fetchKey="discover_trending_week"
            initialPage={data.trendingWeek.page}
            initialTotalPages={data.trendingWeek.totalPages}
          />

          <HorizontalMediaRow
            title="Popular"
            items={data.popular.items}
            mediaType={mediaType}
            imageConfig={imageConfig}
            error={false}
            fetchKey="discover_section"
            fetchParams={{ media: mediaType, section: "popular" }}
            initialPage={data.popular.page}
            initialTotalPages={data.popular.totalPages}
          />

          <HorizontalMediaRow
            title="Top Rated"
            items={data.topRated.items}
            mediaType={mediaType}
            imageConfig={imageConfig}
            error={false}
            fetchKey="discover_section"
            fetchParams={{ media: mediaType, section: "top_rated" }}
            initialPage={data.topRated.page}
            initialTotalPages={data.topRated.totalPages}
          />

          <HorizontalMediaRow
            title={mediaType === "movie" ? "Upcoming" : "Airing Today"}
            items={data.upcoming.items}
            mediaType={mediaType}
            imageConfig={imageConfig}
            error={false}
            fetchKey="discover_section"
            fetchParams={{ media: mediaType, section: "upcoming" }}
            initialPage={data.upcoming.page}
            initialTotalPages={data.upcoming.totalPages}
          />

          <HorizontalMediaRow
            title={mediaType === "movie" ? "Now Playing" : "On The Air"}
            items={data.nowPlaying.items}
            mediaType={mediaType}
            imageConfig={imageConfig}
            error={false}
            fetchKey="discover_section"
            fetchParams={{ media: mediaType, section: "now_playing" }}
            initialPage={data.nowPlaying.page}
            initialTotalPages={data.nowPlaying.totalPages}
          />
        </>
      )}
    </>
  );
}
