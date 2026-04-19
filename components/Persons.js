import Image from "next/image";
import { getImageUrl, tmdbFetch } from "@/lib/tmdb";

export default async function Persons({ movie }) {
  const data = await tmdbFetch(`/movie/${movie.id}/credits`);
  const casts = data?.cast ?? [];

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
      {casts.map((cast) => (
        <div
          key={cast.id}
          className="movie-card text-center flex flex-col justify-between p-2"
        >
          {cast.profile_path ? (
            <Image
              src={getImageUrl(cast.profile_path, "w185")}
              alt={cast.name || "Cast member"}
              width={185}
              height={278}
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
        </div>
      ))}
    </div>
  );
}
