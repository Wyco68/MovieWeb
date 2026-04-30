"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Movies from "@/components/Movies";

const PREFETCH_THRESHOLD = 800;

const SCROLL_DEBOUNCE_MS = 150;
const MOBILE_BREAKPOINT_QUERY = "(max-width: 960px)";

export default function HorizontalMediaRow({
  title,
  items: initialItems,
  mediaType,
  imageConfig,
  error,
  emptyLabel,
  fetchKey,
  fetchParams,
  initialPage = 1,
  initialTotalPages = 1,
}) {
  const safeItems = Array.isArray(initialItems) ? initialItems : [];
  const [items, setItems] = useState(safeItems);
  const [page, setPage] = useState(Math.max(1, initialPage));
  const [totalPages, setTotalPages] = useState(Math.max(1, initialTotalPages));
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const rowRef = useRef(null);
  const pendingTimerRef = useRef(null);
  const abortRef = useRef(null);
  const hasMore = page < totalPages;
  const hasPrevious = page > 1;

  const extraQs = useMemo(() => {
    if (!fetchParams) return "";
    const pairs = Object.entries(fetchParams)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
    return pairs.length ? "&" + pairs.join("&") : "";
  }, [fetchParams]);

  const clearPendingTimer = useCallback(() => {
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
  }, []);

  const fetchPage = useCallback(
    async (targetPage, { appendItems } = { appendItems: true }) => {
      if (!fetchKey || isLoadingMore) return;
      if (!Number.isFinite(targetPage) || targetPage < 1) return;

      const safeTargetPage = Math.max(1, Math.min(targetPage, totalPages));
      if (safeTargetPage === page && !appendItems) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoadingMore(true);
      setLoadError(false);

      try {
        const url = `/api/rows?key=${encodeURIComponent(fetchKey)}&page=${safeTargetPage}${extraQs}`;
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) throw new Error(`Row request failed: ${response.status}`);

        const payload = await response.json();
        const nextItems = Array.isArray(payload?.results) ? payload.results : [];
        const nextTotalPages = Number.parseInt(String(payload?.total_pages ?? totalPages), 10);
        const resolvedPage = Number.parseInt(String(payload?.page ?? safeTargetPage), 10) || safeTargetPage;

        setItems((current) => {
          if (!appendItems) {
            return nextItems;
          }

          const seen = new Set(
            current.map((item) => `${item?.media_type || mediaType || "movie"}:${item?.id}`),
          );
          const merged = [...current];

          for (const item of nextItems) {
            const itemKey = `${item?.media_type || mediaType || "movie"}:${item?.id}`;
            if (!seen.has(itemKey)) {
              seen.add(itemKey);
              merged.push(item);
            }
          }

          return merged;
        });

        setPage(resolvedPage);

        if (Number.isFinite(nextTotalPages) && nextTotalPages > 0) {
          setTotalPages(nextTotalPages);
        }
      } catch (err) {
        if (err?.name !== "AbortError") {
          setLoadError(true);
        }
      } finally {
        setIsLoadingMore(false);
      }
    },
    [extraQs, fetchKey, isLoadingMore, mediaType, page, totalPages],
  );

  const loadNextPage = useCallback(async () => {
    if (!hasMore) return;
    await fetchPage(page + 1, { appendItems: true });
  }, [fetchPage, hasMore, page]);

  const loadMobilePage = useCallback(
    async (targetPage) => {
      await fetchPage(targetPage, { appendItems: false });
      if (rowRef.current) {
        rowRef.current.scrollLeft = 0;
      }
    },
    [fetchPage],
  );

  const handleRowScroll = useCallback(
    (event) => {
      const element = event.currentTarget;

      if (isMobileViewport || !element || isLoadingMore || !hasMore) {
        clearPendingTimer();
        return;
      }

      const remaining = element.scrollWidth - element.scrollLeft - element.clientWidth;

      if (remaining <= PREFETCH_THRESHOLD) {
        if (!pendingTimerRef.current) {
          pendingTimerRef.current = setTimeout(() => {
            pendingTimerRef.current = null;
            void loadNextPage();
          }, SCROLL_DEBOUNCE_MS);
        }
      } else {
        clearPendingTimer();
      }
    },
    [clearPendingTimer, hasMore, isLoadingMore, isMobileViewport, loadNextPage],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT_QUERY);
    const updateViewport = () => {
      setIsMobileViewport(mediaQuery.matches);
    };

    updateViewport();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateViewport);
      return () => {
        mediaQuery.removeEventListener("change", updateViewport);
      };
    }

    mediaQuery.addListener(updateViewport);
    return () => {
      mediaQuery.removeListener(updateViewport);
    };
  }, []);

  useEffect(() => {
    return () => {
      clearPendingTimer();
      abortRef.current?.abort();
    };
  }, [clearPendingTimer]);

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
            showLoadingCard={isLoadingMore && !isMobileViewport}
          />

          {loadError ? (
            <div className="row-message mt-2">
              {isMobileViewport
                ? "Could not load. Use Previous/Next to retry."
                : "Could not load more. Keep scrolling to retry."}
            </div>
          ) : null}
          {isMobileViewport ? (
            <div className="mt-2 flex items-center justify-between gap-2 md:hidden">
              <button
                type="button"
                onClick={() => void loadMobilePage(page - 1)}
                disabled={!hasPrevious || isLoadingMore}
                className="h-9 rounded-[6px] border border-[var(--app-panel-border)] px-3 text-[12px] font-medium disabled:cursor-not-allowed disabled:opacity-45"
              >
                Previous
              </button>
              <span className="muted-label inline-flex min-h-5 items-center gap-1.5 text-[11px] tracking-[0.08em] uppercase">
                {isLoadingMore ? (
                  <>
                    <span className="inline-spinner" aria-hidden="true" />
                    Loading...
                  </>
                ) : (
                  <>Page {page} / {totalPages}</>
                )}
              </span>
              <button
                type="button"
                onClick={() => void loadMobilePage(page + 1)}
                disabled={!hasMore || isLoadingMore}
                className="h-9 rounded-[6px] bg-[#533afd] px-3 text-[12px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-45"
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="row-message">{emptyLabel || "No results available."}</div>
      )}
    </section>
  );
}
