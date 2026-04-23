"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Movies from "@/components/Movies";

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
  const MOBILE_BREAKPOINT = 960;
  const [items, setItems] = useState(Array.isArray(initialItems) ? initialItems : []);
  const [totalPages, setTotalPages] = useState(Math.max(1, initialTotalPages));
  const [nextPageToFetch, setNextPageToFetch] = useState(Math.max(1, initialPage) + 1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const pendingTimerRef = useRef(null);
  const bufferRef = useRef([]);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
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
    if (!fetchKey || isLoadingMore || !hasMore) {
      return;
    }

    const safeBatchSize = Number.isFinite(Number(batchSize))
      ? Math.max(1, Math.floor(Number(batchSize)))
      : 30;
    const pageSize = 20;
    const parsedRequestedCount = Number.isFinite(Number(requestedCount))
      ? Math.max(1, Math.floor(Number(requestedCount)))
      : safeBatchSize;
    const requiredCount = parsedRequestedCount;
    const collected = [];
    let pageCursor = nextPageToFetch;
    let knownTotalPages = totalPages;

    setIsLoadingMore(true);
    setLoadError(false);

    try {
      const seen = new Set(items.map((item) => createItemKey(item, mediaType)));

      while (bufferRef.current.length && collected.length < requiredCount) {
        const candidate = bufferRef.current.shift();
        const candidateKey = createItemKey(candidate, mediaType);

        if (!seen.has(candidateKey)) {
          seen.add(candidateKey);
          collected.push(candidate);
        }
      }

      while (collected.length < requiredCount && pageCursor <= knownTotalPages) {
        const response = await fetch(`/api/feed?${paramsString}&page=${pageCursor}`);

        if (!response.ok) {
          throw new Error(`Feed request failed: ${response.status}`);
        }

        const payload = await response.json();
        const pageItems = Array.isArray(payload?.results) ? payload.results : [];
        const nextTotalPages = Number.parseInt(String(payload?.total_pages ?? knownTotalPages), 10);

        if (Number.isFinite(nextTotalPages) && nextTotalPages > 0) {
          knownTotalPages = nextTotalPages;
        }

        pageCursor += 1;

        pageItems.forEach((candidate) => {
          const candidateKey = createItemKey(candidate, mediaType);

          if (seen.has(candidateKey)) {
            return;
          }

          seen.add(candidateKey);

          if (collected.length < requiredCount) {
            collected.push(candidate);
          } else {
            bufferRef.current.push(candidate);
          }
        });

        if (!pageItems.length || pageItems.length < pageSize) {
          break;
        }
      }

      setItems((current) => {
        const merged = [...current];

        merged.push(...collected);

        return merged;
      });

      setNextPageToFetch(pageCursor);
      setTotalPages(knownTotalPages);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoadingMore(false);
    }
  }, [batchSize, fetchKey, hasMore, isLoadingMore, items, mediaType, nextPageToFetch, paramsString, totalPages]);

  const hasInitiallyLoadedRef = useRef(false);

  useEffect(() => {
    if (!fetchKey || isLoadingMore || !hasMore || hasInitiallyLoadedRef.current || !enableScrollLoad) {
      return;
    }

    hasInitiallyLoadedRef.current = true;

    const safeBatchSize = Number.isFinite(Number(batchSize))
      ? Math.max(1, Math.floor(Number(batchSize)))
      : 30;

    if (items.length >= safeBatchSize) {
      return;
    }

    const needed = safeBatchSize - items.length;
    void loadNextPage(needed);
  }, [batchSize, enableScrollLoad, fetchKey, hasMore, isLoadingMore, items.length, loadNextPage]);

  useEffect(() => {
    if (!fetchKey || !enableScrollLoad) {
      return undefined;
    }

    const scheduleNextLoad = () => {
      if (pendingTimerRef.current || isLoadingMore || !hasMore) {
        return;
      }

      pendingTimerRef.current = setTimeout(() => {
        pendingTimerRef.current = null;
        if (!isMountedRef.current) {
          return;
        }
        void loadNextPage();
      }, 0);
    };

    const onScroll = () => {
      if (typeof window === "undefined" || window.innerWidth <= MOBILE_BREAKPOINT) {
        return;
      }

      if (isLoadingMore || !hasMore || !isMountedRef.current) {
        clearPendingTimer();
        return;
      }

      const scrollTop = window.scrollY || window.pageYOffset || 0;
      const viewportHeight = window.innerHeight || 0;
      const fullHeight = document.documentElement.scrollHeight || 0;
      const remaining = fullHeight - (scrollTop + viewportHeight);

      if (remaining <= 380) {
        scheduleNextLoad();
      } else {
        clearPendingTimer();
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      clearPendingTimer();
      window.removeEventListener("scroll", onScroll);
    };
  }, [clearPendingTimer, enableScrollLoad, fetchKey, hasMore, isLoadingMore, loadNextPage]);

  return (
    <>
      <Movies movies={items} mediaType={mediaType} imageConfig={imageConfig} />

      {(isLoadingMore || loadError) && (
        <div className={`row-load-status mt-2 ${isLoadingMore ? "row-load-status-loading" : ""}`} aria-live="polite">
          {isLoadingMore ? <span className="inline-spinner" aria-hidden="true" /> : null}
          {isLoadingMore
            ? "Loading more titles..."
            : loadError
              ? "Could not load more. Keep scrolling to retry."
              : ""}
        </div>
      )}
    </>
  );
}
