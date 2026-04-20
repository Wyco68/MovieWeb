import Image from "next/image";
import Link from "next/link";
import { getConfiguredImageUrl, tmdbFetch } from "@/lib/tmdb";

export default async function Persons({ movie, imageConfig }) {
  const data = await tmdbFetch(`/movie/${movie.id}/credits`);
  const casts = data?.cast ?? [];

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
      {casts.map((cast) => (
        <div
          key={cast.id}
          className="movie-card text-center flex flex-col justify-between p-2"
        >
          <Link href={`/person/${cast.id}`} className="block no-underline">
            {cast.profile_path ? (
              <Image
                src={getConfiguredImageUrl(cast.profile_path, {
                  config: imageConfig,
                  type: "profile",
                  variant: "sm",
                })}
                alt={cast.name || "Cast member"}
                width={185}
                height={278}
                loading="lazy"
                sizes="(max-width: 640px) 40vw, (max-width: 1024px) 24vw, 160px"
                className="w-full h-auto rounded-lg"
              />
            ) : (
              <div className="w-full h-[278px] bg-slate-200 dark:bg-[#2a2a2d] rounded-lg"></div>
            )}
            <div className="p-2">
              <div className="text-[14px] leading-tight font-medium tracking-[-0.18px]">
                {cast.name || "Unknown"}
              </div>
              <span className="text-[12px] muted-label">
                {cast.character || "-"}
              </span>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}
