"use client";

import Image from "next/image";
import Link from "next/link";
import { getConfiguredImageUrl } from "@/lib/tmdb-image";

function resolveMediaType(item, fallbackType) {
  if (item?.media_type) {
    return item.media_type;
  }

  if (fallbackType) {
    return fallbackType;
  }

  if (item?.name && !item?.title) {
    return "tv";
  }

  return "movie";
}

function getMediaLink(item, mediaType) {
  if (mediaType === "tv") {
    return `/tv/${item.id}`;
  }

  if (mediaType === "person") {
    return `/person/${item.id}`;
  }

  return `/movie/${item.id}`;
}

export default function Movies({
  movies,
  mediaType: forcedMediaType,
  imageConfig,
  layout = "grid",
  containerRef,
  onContainerScroll,
}) {
  const safeMovies = Array.isArray(movies) ? movies : [];
  const containerClass =
    layout === "row"
      ? "row-track"
      : "grid grid-cols-4 gap-1.5 sm:grid-cols-4 md:gap-2 lg:grid-cols-5 xl:grid-cols-6";

  const cardClass =
    layout === "row"
      ? "movie-card row-card p-1.5 text-center flex flex-col"
      : "movie-card p-1 text-center flex flex-col";

  return (
    <div className={containerClass} ref={containerRef} onScroll={onContainerScroll}>
      {safeMovies.map((item) => {
        const mediaType = resolveMediaType(item, forcedMediaType);
        const imagePath = mediaType === "person" ? item.profile_path : item.poster_path;
        const displayTitle = item.title || item.name || "Untitled";
        const subtitle =
          mediaType === "person"
            ? item.known_for_department || "Person"
            : item.release_date?.split("-")[0] || item.first_air_date?.split("-")[0] || "N/A";

        return (
          <div
            key={`${mediaType}-${item.id}`}
            className={cardClass}
          >
            <Link href={getMediaLink(item, mediaType)} className="poster-frame block">
              {imagePath ? (
                <Image
                  src={getConfiguredImageUrl(imagePath, {
                    config: imageConfig,
                    type: mediaType === "person" ? "profile" : "poster",
                    variant: layout === "row" ? "sm" : "sm",
                  })}
                  alt={`${displayTitle} poster`}
                  width={120}
                  height={180}
                  loading="lazy"
                  sizes={layout === "row" 
                    ? "(max-width: 640px) 30vw, (max-width: 1024px) 18vw, 120px"
                    : "(max-width: 480px) 22vw, (max-width: 640px) 18vw, (max-width: 768px) 15vw, (max-width: 1024px) 14vw, 180px"
                  }
                  className="w-full transition-transform duration-300 hover:scale-[1.04]"
                />
              ) : (
                <div className={`w-full rounded-lg bg-gradient-to-br from-[#5b45ff]/25 via-[#533afd]/18 to-[#0d253d]/20 dark:from-[#5b45ff]/30 dark:via-[#2f2f75]/40 dark:to-[#0d253d]/55 border border-white/20 dark:border-white/15 flex items-center justify-center ${layout === "row" ? "h-[200px]" : "h-[140px]"}`}>
                  <span className={`font-medium uppercase tracking-[0.08em] text-white/78 ${layout === "row" ? "text-[10px]" : "text-[9px]"}`}>
                    No Photo
                  </span>
                </div>
              )}
            </Link>
            <div className={`px-0.5 ${layout === "row" ? "py-1" : "py-1"}`}>
              <h4 className={`mt-0.5 leading-tight font-semibold tracking-[-0.2px] ${layout === "row" ? "text-[13px]" : "text-[11px]"}`}>
                {displayTitle}
              </h4>
              <span className={`muted-label ${layout === "row" ? "text-[11px]" : "text-[10px]"}`}>
                {subtitle}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
