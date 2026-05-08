import Image from "next/image";
import { notFound } from "next/navigation";
import BackButton from "@/components/BackButton";
import Movies from "@/components/Movies";
import {
  getConfiguredImageUrl,
  getTmdbImageConfig,
  tmdbFetch,
} from "@/lib/tmdb";

function buildFilmography(items) {
  const seen = new Set();

  return (items ?? [])
    .filter((item) => item?.id && (item?.media_type === "movie" || item?.media_type === "tv"))
    .filter((item) => {
      const key = `${item.media_type}:${item.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => {
      const popularityDelta = Number(b?.popularity || 0) - Number(a?.popularity || 0);
      if (popularityDelta !== 0) return popularityDelta;

      const dateA = a?.release_date || a?.first_air_date || "";
      const dateB = b?.release_date || b?.first_air_date || "";
      return dateB.localeCompare(dateA);
    });
}

export default async function PersonDetail({ params }) {
  const resolvedParams = await params;

  const [person, credits, imageConfig] = await Promise.all([
    tmdbFetch(`/person/${resolvedParams.id}`, { revalidate: 600 }),
    tmdbFetch(`/person/${resolvedParams.id}/combined_credits`, { revalidate: 600 }),
    getTmdbImageConfig(),
  ]);

  if (!person?.id) notFound();

  const profileUrl = getConfiguredImageUrl(person.profile_path, {
    config: imageConfig,
    type: "profile",
    variant: "lg",
  });
  const filmography = buildFilmography(credits?.cast);

  return (
    <>
      <div className="mb-4">
        <BackButton fallbackHref="/people" label="Back" />
      </div>

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
              sizes="(max-width: 1024px) 70vw, 280px"
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
              <span className="font-medium">Known For:</span>{" "}
              {person.known_for_department || "N/A"}
            </div>
            <div>
              <span className="font-medium">Birthday:</span> {person.birthday || "N/A"}
            </div>
            <div>
              <span className="font-medium">Place of Birth:</span>{" "}
              {person.place_of_birth || "N/A"}
            </div>
            <div>
              <span className="font-medium">Popularity:</span>{" "}
              {person.popularity?.toFixed?.(1) || "N/A"}
            </div>
          </div>

          <h3 className="section-title mt-6">Biography</h3>
          <p className="text-[16px] leading-[1.5] text-[rgba(0,0,0,0.82)] dark:text-white/88">
            {person.biography || "No biography available."}
          </p>
        </div>
      </div>

      {filmography.length ? (
        <section className="mt-8">
          <h3 className="section-title">Known For Filmography</h3>
          <Movies movies={filmography} imageConfig={imageConfig} />
        </section>
      ) : null}
    </>
  );
}
