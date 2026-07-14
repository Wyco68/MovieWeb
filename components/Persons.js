import Image from "next/image";
import Link from "next/link";
import { getConfiguredImageUrl } from "@/lib/tmdb-image";

export default function Persons({ imageConfig, credits }) {
  // `credits` (from the detail payload's append_to_response=credits) is always
  // provided by the caller; no separate fetch is needed.
  const casts = (credits?.cast ?? []).slice(0, 15);

  if (!casts.length) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-medium tracking-tight text-[#061b31] dark:text-white">
          Top Cast
        </h3>
      </div>
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10 snap-x">
          {casts.map((person) => (
            <div
              key={`cast-${person.id}`}
              className="flex-none w-[140px] snap-start movie-card p-1.5 flex flex-col bg-white dark:bg-[#1c1e54] border border-[#e5edf5] dark:border-white/10 rounded-lg transition-transform hover:-translate-y-1 hover:shadow-md"
            >
              <Link href={`/person/${person.id}`} className="block no-underline h-full flex flex-col">
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[6px] bg-slate-100 dark:bg-slate-800">
                  {person.profile_path ? (
                    <Image
                      src={getConfiguredImageUrl(person.profile_path, {
                        config: imageConfig,
                        type: "profile",
                        variant: "sm",
                      })}
                      alt={person.name || "Person"}
                      fill
                      loading="lazy"
                      sizes="140px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
                        No Photo
                      </span>
                    </div>
                  )}
                </div>
                <div className="px-1 py-2 flex flex-col flex-1 justify-center">
                  <div className="text-[13px] font-semibold tracking-tight text-[#061b31] dark:text-white leading-tight line-clamp-1">
                    {person.name || "Unknown"}
                  </div>
                  <div className="text-[11px] text-[#64748d] dark:text-[#a1b0c0] mt-0.5 line-clamp-2 leading-tight">
                    {person.character || "-"}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
