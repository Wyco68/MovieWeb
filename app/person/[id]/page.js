import Image from "next/image";
import { notFound } from "next/navigation";
import { getImageUrl, tmdbFetch } from "@/lib/tmdb";

export default async function PersonDetail({ params }) {
  const resolvedParams = await params;
  const person = await tmdbFetch(`/person/${resolvedParams.id}`);

  if (!person?.id) {
    notFound();
  }

  const profileUrl = getImageUrl(person.profile_path, "w500");

  return (
    <>
      <h2 className="text-[clamp(2rem,3vw,3.5rem)] leading-[1.08] font-semibold tracking-[-0.28px]">
        {person.name}
      </h2>

      <div className="mt-4 grid gap-6 lg:grid-cols-[280px_1fr]">
        <div>
          {profileUrl ? (
            <Image
              src={profileUrl}
              alt={`${person.name} profile`}
              width={500}
              height={750}
              className="w-full h-auto rounded-[8px] border border-[var(--app-panel-border)]"
              priority
            />
          ) : (
            <div className="w-full min-h-[360px] rounded-[8px] border border-[var(--app-panel-border)] bg-slate-100 dark:bg-[#232435]" />
          )}
        </div>

        <div>
          <div className="grid gap-2 text-[14px] text-[rgba(0,0,0,0.78)] dark:text-white/80 sm:grid-cols-2">
            <div>
              <span className="font-medium">Known For:</span> {person.known_for_department || "N/A"}
            </div>
            <div>
              <span className="font-medium">Birthday:</span> {person.birthday || "N/A"}
            </div>
            <div>
              <span className="font-medium">Place of Birth:</span> {person.place_of_birth || "N/A"}
            </div>
            <div>
              <span className="font-medium">Popularity:</span> {person.popularity?.toFixed?.(1) || "N/A"}
            </div>
          </div>

          <h3 className="section-title mt-6">Biography</h3>
          <p className="text-[16px] leading-[1.5] text-[rgba(0,0,0,0.82)] dark:text-white/88">
            {person.biography || "No biography available."}
          </p>
        </div>
      </div>
    </>
  );
}
