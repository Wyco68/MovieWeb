import Image from "next/image";
import Link from "next/link";
import { getConfiguredImageUrl } from "@/lib/tmdb-image";

export default function MovieCard({
  item,
  mediaType,
  imageConfig,
  layout = "grid",
  isPriority = false,
}) {
  const imagePath = mediaType === "person" ? item.profile_path : item.poster_path;
  const displayTitle = item.title || item.name || "Untitled";
  const subtitle =
    mediaType === "person"
      ? item.known_for_department || "Person"
      : item.release_date?.split("-")[0] || item.first_air_date?.split("-")[0] || "N/A";

  const getMediaLink = () => {
    if (mediaType === "tv") return `/tv/${item.id}`;
    if (mediaType === "person") return `/person/${item.id}`;
    return `/movie/${item.id}`;
  };

  const cardClass =
    layout === "row"
      ? "movie-card row-card p-1.5 text-center flex flex-col bg-white dark:bg-[#1c1e54]"
      : "movie-card p-1.5 text-center flex flex-col bg-white dark:bg-[#1c1e54]";

  return (
    <div className={cardClass}>
      <Link href={getMediaLink()} className="poster-frame block relative aspect-[2/3] w-full overflow-hidden rounded-[6px] bg-[#f6f9fc] dark:bg-[#0d253d]">
        {imagePath ? (
          <Image
            src={getConfiguredImageUrl(imagePath, {
              config: imageConfig,
              type: mediaType === "person" ? "profile" : "poster",
              variant: "sm",
            })}
            alt={`${displayTitle} poster`}
            fill
            priority={isPriority}
            loading={isPriority ? undefined : "lazy"}
            sizes={
              layout === "row"
                ? "(max-width: 640px) 35vw, (max-width: 1024px) 25vw, 160px"
                : "(max-width: 480px) 45vw, (max-width: 640px) 30vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 200px"
            }
            className="object-cover transition-transform duration-300 hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center border border-white/20">
            <span className="font-medium uppercase tracking-[0.08em] text-muted-foreground text-[10px]">
              No Photo
            </span>
          </div>
        )}
      </Link>
      <div className="px-1 py-2 text-left">
        <h4 className="mt-1 truncate text-sm font-semibold tracking-tight text-[#061b31] dark:text-white">
          {displayTitle}
        </h4>
        <span className="truncate text-xs text-[#64748d] dark:text-[#a1b0c0]">
          {subtitle}
        </span>
      </div>
    </div>
  );
}
