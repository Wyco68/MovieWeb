import Image from "next/image";
import Link from "next/link";
import { getConfiguredImageUrl, tmdbFetch } from "@/lib/tmdb";

export default async function Persons({ entityId, mediaType = "movie", imageConfig }) {
  const data = await tmdbFetch(`/${mediaType}/${entityId}/credits`, { revalidate: 600 });
  const casts = (data?.cast ?? []).slice(0, 12);

  if (!casts.length) return null;

  return (
    <div>
      <h4 className="text-[22px] font-bold tracking-[-0.3px] text-[rgba(0,0,0,0.9)] dark:text-white">
        Cast
      </h4>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] md:gap-4">
        {casts.map((person) => (
          <div
            key={`cast-${person.id}`}
            className="movie-card text-center flex flex-col justify-between p-1.5 sm:p-2"
          >
            <Link href={`/person/${person.id}`} className="block no-underline">
              {person.profile_path ? (
                <Image
                  src={getConfiguredImageUrl(person.profile_path, {
                    config: imageConfig,
                    type: "profile",
                    variant: "sm",
                  })}
                  alt={person.name || "Person"}
                  width={185}
                  height={278}
                  loading="lazy"
                  sizes="(max-width: 640px) 42vw, (max-width: 1024px) 26vw, 160px"
                  className="w-full h-auto rounded-[6px]"
                />
              ) : (
                <div className="w-full h-[220px] sm:h-[278px] rounded-[6px] bg-gradient-to-br from-[#5b45ff]/25 via-[#533afd]/18 to-[#0d253d]/20 dark:from-[#5b45ff]/30 dark:via-[#2f2f75]/40 dark:to-[#0d253d]/55 border border-white/20 dark:border-white/15 flex flex-col items-center justify-center gap-2">
                  <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/78">
                    No Photo
                  </span>
                </div>
              )}
              <div className="p-1.5 sm:p-2">
                <div className="text-[13px] sm:text-[14px] leading-tight font-medium tracking-[-0.18px]">
                  {person.name || "Unknown"}
                </div>
                <span className="text-[11px] sm:text-[12px] muted-label">
                  {person.character || "-"}
                </span>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
