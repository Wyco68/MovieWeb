"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Movies from "@/components/Movies";

const PAGE_LIMIT_NOTICE =
  "This project requests at most 5 pages per list from the API, so you will not see more than that here.";

function createItemKey(item, fallbackMediaType) {
  return `${item?.media_type || fallbackMediaType || "movie"}:${item?.id}`;
}

export default function InfiniteMoviesGrid({
  initialItems,
  mediaType,
  imageConfig,
  fetchKey,
  fetchParams,
  initialPage = 1,
  initialTotalPages = 1,
  batchSize = 30,
  enableScrollLoad = true,
}) {
  const [items, setItems] = useState(Array.isArray(initialItems) ? initialItems : []);
  const [totalPages, setTotalPages] = useState(Math.max(1, initialTotalPages));
  const [nextPageToFetch, setNextPageToFetch] = useState(Math.max(1, initialPage) + 1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const pendingTimerRef = useRef(null);
  const bufferRef = useRef([]);
  const isMountedRef = useRef(false);
  const sentinelRef = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const paramsString = useMemo(() => {
    const search = new URLSearchParams();
    search.set("key", fetchKey);

    Object.entries(fetchParams ?? {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        search.set(key, String(value));
      }
    });

    return search.toString();
  }, [fetchKey, fetchParams]);

  const hasMore = nextPageToFetch <= totalPages || bufferRef.current.length > 0;

  const clearPendingTimer = useCallback(() => {
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
  }, []);

  const loadNextPage = useCallback(async (requestedCount = batchSize) => {
    if (!fetchKey || isLoadingMore || !hasMore || loadError) return;

    const safeBatchSize = Number.isFinite(Number(batchSize)) ? Math.max(1, Math.floor(Number(batchSize))) : 30;
    const pageSize = 20;
    const parsedRequestedCount = Number.isFinite(Number(requestedCount))
      ? Math.max(1, Math.floor(Number(requestedCount)))
      : safeBatchSize;

    const collected = [];
    let pageCursor = nextPageToFetch;
    let knownTotalPages = totalPages;

    setIsLoadingMore(true);
    setLoadError(false);

    try {
      const seen = new Set(items.map((item) => createItemKey(item, mediaType)));

      while (bufferRef.current.length && collected.length < parsedRequestedCount) {
        const candidate = bufferRef.current.shift();
        const candidateKey = createItemKey(candidate, mediaType);
        if (!seen.has(candidateKey)) {
          seen.add(candidateKey);
          collected.push(candidate);
        }
      }

      while (collected.length < parsedRequestedCount && pageCursor <= knownTotalPages) {
        const response = await fetch(`/api/tmdb?${paramsString}&page=${pageCursor}`);
        if (!response.ok) throw new Error(`Feed request failed: ${response.status}`);

        const payload = await response.json();
        const pageItems = Array.isArray(payload?.results) ? payload.results : [];
        const nextTotalPages = Number.parseInt(String(payload?.total_pages ?? knownTotalPages), 10);

        if (Number.isFinite(nextTotalPages) && nextTotalPages > 0) knownTotalPages = nextTotalPages;
        pageCursor += 1;

        pageItems.forEach((candidate) => {
          const candidateKey = createItemKey(candidate, mediaType);
          if (seen.has(candidateKey)) return;
          seen.add(candidateKey);

          if (collected.length < parsedRequestedCount) {
            collected.push(candidate);
          } else {
            bufferRef.current.push(candidate);
          }
        });

        if (!pageItems.length || pageItems.length < pageSize) break;
      }

      setItems((current) => [...current, ...collected]);
      setNextPageToFetch(pageCursor);
      setTotalPages(knownTotalPages);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoadingMore(false);
    }
  }, [batchSize, fetchKey, hasMore, isLoadingMore, loadError, items, mediaType, nextPageToFetch, paramsString, totalPages]);

  const hasInitiallyLoadedRef = useRef(false);

  useEffect(() => {
    if (!fetchKey || isLoadingMore || !hasMore || hasInitiallyLoadedRef.current || !enableScrollLoad) return;

    hasInitiallyLoadedRef.current = true;

    const safeBatchSize = Number.isFinite(Number(batchSize)) ? Math.max(1, Math.floor(Number(batchSize))) : 30;
    if (items.length >= safeBatchSize) return;

    const needed = safeBatchSize - items.length;
    void loadNextPage(needed);
  }, [batchSize, enableScrollLoad, fetchKey, hasMore, isLoadingMore, items.length, loadNextPage]);

  useEffect(() => {
    if (!fetchKey || !enableScrollLoad || typeof window === "undefined") return undefined;

    const target = sentinelRef.current;
    if (!target) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (pendingTimerRef.current || isLoadingMore || !hasMore || loadError || !isMountedRef.current) return;

        pendingTimerRef.current = setTimeout(() => {
          pendingTimerRef.current = null;
          if (!isMountedRef.current || isLoadingMore || !hasMore || loadError) return;
          void loadNextPage();
        }, 220);
      },
      { root: null, threshold: 0, rootMargin: "0px 0px 420px 0px" },
    );

    observer.observe(target);
    return () => {
      clearPendingTimer();
      observer.disconnect();
    };
  }, [clearPendingTimer, enableScrollLoad, fetchKey, hasMore, isLoadingMore, loadError, loadNextPage]);

  const showPageLimitNotice =
    enableScrollLoad && items.length > 0 && (!hasMore || loadError);

  return (
    <>
      <Movies
        movies={items}
        mediaType={mediaType}
        imageConfig={imageConfig}
        showLoadingCard={false}
      />

      {showPageLimitNotice ? (
        <p className="row-message mt-3 text-[12px] leading-relaxed muted-label" role="note">
          {PAGE_LIMIT_NOTICE}
        </p>
      ) : null}

      {enableScrollLoad ? <div ref={sentinelRef} className="load-sentinel" aria-hidden="true" /> : null}
    </>
  );
}
