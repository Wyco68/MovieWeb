import Image from "next/image";
import Link from "next/link";
import { getConfiguredImageUrl } from "@/lib/tmdb";

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
}) {
  const safeMovies = Array.isArray(movies) ? movies : [];

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
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
            className="movie-card p-2 text-center flex flex-col"
          >
            {imagePath ? (
              <Link href={getMediaLink(item, mediaType)} className="poster-frame block">
                <Image
                  src={getConfiguredImageUrl(imagePath, {
                    config: imageConfig,
                    type: mediaType === "person" ? "profile" : "poster",
                    variant: "md",
                  })}
                  alt={`${displayTitle} poster`}
                  width={342}
                  height={513}
                  loading="lazy"
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 28vw, 180px"
                  className="w-full transition-transform duration-300 hover:scale-[1.04]"
                />
              </Link>
            ) : (
              <div className="w-full h-[300px] bg-slate-100 dark:bg-[#1c1e54] rounded-lg"></div>
            )}
            <div className="px-1 py-2">
              <h4 className="mt-1 text-[15px] leading-tight font-semibold tracking-[-0.2px]">
                {displayTitle}
              </h4>
              <span className="text-[12px] muted-label">
                {subtitle}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
