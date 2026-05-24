"use client";

import MovieCard from "./MovieCard";
import { LoadingCard } from "./LoadingSkeleton";

function resolveMediaType(item, fallbackType) {
  if (item?.media_type) return item.media_type;
  if (fallbackType) return fallbackType;
  if (item?.name && !item?.title) return "tv";
  return "movie";
}

export default function Movies({
  movies,
  mediaType: forcedMediaType,
  imageConfig,
  layout = "grid",
  containerRef,
  onContainerScroll,
  showLoadingCard = false,
  priorityFirstImage = false,
  priorityImageCount = 1,
}) {
  const safeMovies = Array.isArray(movies) ? movies : [];
  const containerClass =
    layout === "row"
      ? "row-track"
      : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 w-full";

  const priorityItemKeys = priorityFirstImage
    ? safeMovies.reduce((keys, item) => {
        if (keys.length >= Math.max(1, priorityImageCount)) return keys;
        const mediaType = resolveMediaType(item, forcedMediaType);
        const imagePath = mediaType === "person" ? item.profile_path : item.poster_path;
        if (imagePath) keys.push(`${mediaType}-${item.id}`);
        return keys;
      }, [])
    : [];

  return (
    <div className={containerClass} ref={containerRef} onScroll={onContainerScroll}>
      {safeMovies.map((item) => {
        const mediaType = resolveMediaType(item, forcedMediaType);
        const itemKey = `${mediaType}-${item.id}`;
        const isPriorityImage = priorityItemKeys.includes(itemKey);

        return (
          <MovieCard
            key={itemKey}
            item={item}
            mediaType={mediaType}
            imageConfig={imageConfig}
            layout={layout}
            isPriority={isPriorityImage}
          />
        );
      })}

      {showLoadingCard ? <LoadingCard layout={layout} /> : null}
    </div>
  );
}
