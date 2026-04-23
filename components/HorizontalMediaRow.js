"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Movies from "@/components/Movies";

export default function HorizontalMediaRow({
  title,
  items: initialItems,
  mediaType,
  imageConfig,
  error,
  emptyLabel,
  fetchKey,
  initialPage = 1,
  initialTotalPages = 1,
}) {
  const safeItems = Array.isArray(initialItems) ? initialItems : [];
  const [items, setItems] = useState(safeItems);
  const [page, setPage] = useState(Math.max(1, initialPage));
  const [totalPages, setTotalPages] = useState(Math.max(1, initialTotalPages));
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const rowRef = useRef(null);
  const pendingTimerRef = useRef(null);
  const hasMore = page < totalPages;
  const MOBILE_BREAKPOINT = 960;

  const clearPendingTimer = useCallback(() => {
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
  }, []);

  const loadNextPage = useCallback(async () => {
    if (!fetchKey || isLoadingMore || !hasMore) {
      return;
    }

    const nextPage = page + 1;

    setIsLoadingMore(true);
    setLoadError(false);

    try {
      const response = await fetch(`/api/rows?key=${encodeURIComponent(fetchKey)}&page=${nextPage}`);

      if (!response.ok) {
        throw new Error(`Row request failed: ${response.status}`);
      }

      const payload = await response.json();
      const nextItems = Array.isArray(payload?.results) ? payload.results : [];
      const nextTotalPages = Number.parseInt(String(payload?.total_pages ?? totalPages), 10);

      setItems((current) => {
        const seen = new Set(current.map((item) => `${item?.media_type || mediaType || "movie"}:${item?.id}`));
        const merged = [...current];

        nextItems.forEach((item) => {
          const itemKey = `${item?.media_type || mediaType || "movie"}:${item?.id}`;

          if (!seen.has(itemKey)) {
            seen.add(itemKey);
            merged.push(item);
          }
        });

        return merged;
      });

      setPage(Number.parseInt(String(payload?.page ?? nextPage), 10) || nextPage);

      if (Number.isFinite(nextTotalPages) && nextTotalPages > 0) {
        setTotalPages(nextTotalPages);
      }
    } catch {
      setLoadError(true);
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchKey, hasMore, isLoadingMore, mediaType, page, totalPages]);

  const handleRowScroll = useCallback(
    (event) => {
      const element = event.currentTarget;

      if (!element || isLoadingMore || !hasMore) {
        clearPendingTimer();
        return;
      }

      const remaining = element.scrollWidth - element.scrollLeft - element.clientWidth;

      if (remaining <= 220) {
        if (!pendingTimerRef.current) {
          pendingTimerRef.current = setTimeout(() => {
            pendingTimerRef.current = null;
            void loadNextPage();
          }, 0);
        }
      } else {
        clearPendingTimer();
      }
    },
    [clearPendingTimer, hasMore, isLoadingMore, loadNextPage],
  );

  useEffect(() => {
    return () => {
      clearPendingTimer();
    };
  }, [clearPendingTimer]);

  useEffect(() => {
    const onScroll = () => {
      if (typeof window === "undefined" || window.innerWidth <= MOBILE_BREAKPOINT) {
        clearPendingTimer();
        return;
      }

      if (isLoadingMore || !hasMore) {
        clearPendingTimer();
        return;
      }

      const scrollTop = window.scrollY || window.pageYOffset || 0;
      const viewportHeight = window.innerHeight || 0;
      const fullHeight = document.documentElement.scrollHeight || 0;
      const remaining = fullHeight - (scrollTop + viewportHeight);

      if (remaining <= 420) {
        if (!pendingTimerRef.current) {
          pendingTimerRef.current = setTimeout(() => {
            pendingTimerRef.current = null;
            void loadNextPage();
          }, 280);
        }
      } else {
        clearPendingTimer();
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      clearPendingTimer();
      window.removeEventListener("scroll", onScroll);
    };
  }, [clearPendingTimer, hasMore, isLoadingMore, loadNextPage]);

  return (
    <section className="row-section">
      <div className="row-title-wrap">
        <h3 className="section-title mb-0 border-b-0 pb-0">{title}</h3>
      </div>

      {error ? (
        <div className="row-message row-message-error" role="status">
          This section is temporarily unavailable.
        </div>
      ) : items.length ? (
        <div className="horizontal-row" role="region" aria-label={title}>
          <Movies
            movies={items}
            mediaType={mediaType}
            imageConfig={imageConfig}
            layout="row"
            containerRef={rowRef}
            onContainerScroll={handleRowScroll}
          />

          {(isLoadingMore || loadError) && (
            <div className={`row-load-status ${isLoadingMore ? "row-load-status-loading" : ""}`} aria-live="polite" style={{ opacity: 0, position: 'absolute' }}>
              {isLoadingMore ? <span className="inline-spinner" aria-hidden="true" /> : null}
              {isLoadingMore ? "Loading more..." : loadError ? "Could not load more. Keep scrolling to retry." : ""}
            </div>
          )}
        </div>
      ) : (
        <div className="row-message">{emptyLabel || "No results available."}</div>
      )}
    </section>
  );
}
