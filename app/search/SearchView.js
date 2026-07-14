"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import InfiniteMoviesGrid from "@/components/InfiniteMoviesGrid";
import FilterPanel from "@/components/FilterPanel";
import Loading from "@/app/loading";
import { fetchTmdb } from "@/lib/api";
import { sanitizeSearchPageParams } from "@/lib/search-params";

const imageConfig = null;

export default function SearchView() {
  const searchParams = useSearchParams();
  const [data, setData] = useState(null);

  const { q, mediaType, genre, year, language, rating } = sanitizeSearchPageParams({
    q: searchParams.get("q"),
    type: searchParams.get("type"),
    genre: searchParams.get("genre"),
    year: searchParams.get("year"),
    language: searchParams.get("language"),
    rating: searchParams.get("rating"),
  });

  useEffect(() => {
    let active = true;
    setData(null);

    const hasQuery = Boolean(q && q.length >= 2);

    Promise.all([
      hasQuery
        ? fetchTmdb({ key: "search_multi_filtered", q, language, type: mediaType, genre, year, rating })
            .catch(() => ({ results: [], page: 1, total_pages: 1 }))
        : Promise.resolve({ results: [], page: 1, total_pages: 1 }),
      fetchTmdb({ key: "genre_list", media: "movie" }).catch(() => ({ genres: [] })),
      fetchTmdb({ key: "genre_list", media: "tv" }).catch(() => ({ genres: [] })),
    ]).then(([search, movieGenres, tvGenres]) => {
      if (!active) return;
      const genreMap = new Map();
      (movieGenres?.genres ?? []).forEach((item) => genreMap.set(item.id, item.name));
      (tvGenres?.genres ?? []).forEach((item) => genreMap.set(item.id, item.name));
      setData({
        results: search?.results ?? [],
        page: search?.page ?? 1,
        totalPages: search?.total_pages ?? 1,
        genreMap,
      });
    });

    return () => {
      active = false;
    };
  }, [q, mediaType, genre, year, language, rating]);

  const results = data?.results ?? [];

  return (
    <div className="pb-12">
      <div className="mb-6 border-b border-[var(--app-panel-border)] pb-4">
        <h2 className="text-3xl font-light tracking-tight text-[#061b31] dark:text-white">
          {q ? `Search Results for "${q}"` : "Explore"}
        </h2>
        {q && data && (
          <p className="mt-2 text-sm text-[#64748d] dark:text-white/60">
            Found {results.length} result{results.length !== 1 ? "s" : ""}
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
        genreMap={data?.genreMap ?? new Map()}
      />

      <div className="mt-8">
        {!data ? (
          <Loading />
        ) : results.length > 0 ? (
          <InfiniteMoviesGrid
            key={`${q}:${mediaType}:${genre}:${year}:${language}:${rating}`}
            initialItems={results}
            imageConfig={imageConfig}
            priorityFirstImage
            priorityImageCount={6}
            fetchKey="search_multi_filtered"
            fetchParams={{ q, language, type: mediaType, genre, year, rating }}
            initialPage={data.page}
            initialTotalPages={data.totalPages}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white dark:bg-[#1c1e54] rounded-lg border border-[var(--app-panel-border)] border-dashed">
            <h3 className="text-xl font-medium text-[#061b31] dark:text-white mb-2">No results found</h3>
            <p className="text-[#64748d] dark:text-white/60 max-w-md">
              {"We couldn't find any matches for your search. Try adjusting your filters or search query."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
