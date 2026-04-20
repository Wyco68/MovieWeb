import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import BackButton from "@/components/BackButton";
import {
  getConfiguredImageUrl,
  getTmdbImageConfig,
  tmdbFetch,
} from "@/lib/tmdb";

function formatRuntime(minutes) {
  if (!minutes || Number.isNaN(Number(minutes))) {
    return "N/A";
  }

  const totalMinutes = Number(minutes);
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (!hours) {
    return `${remainingMinutes}m`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function formatEpisodeCode(seasonNumber, episodeNumber) {
  const season = String(seasonNumber ?? 0).padStart(2, "0");
  const episode = String(episodeNumber ?? 0).padStart(2, "0");
  return `S${season}E${episode}`;
}

export default async function EpisodeDetailPage({ params }) {
  const resolvedParams = await params;

  const tvId = resolvedParams.id;
  const seasonNumber = resolvedParams.seasonNumber;
  const episodeNumber = resolvedParams.episodeNumber;

  const [tv, episode, imageConfig] = await Promise.all([
    tmdbFetch(`/tv/${tvId}`),
    tmdbFetch(`/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`),
    getTmdbImageConfig(),
  ]);

  if (!tv?.id || !episode?.id) {
    notFound();
  }

  const stillUrl = getConfiguredImageUrl(episode.still_path, {
    config: imageConfig,
    type: "backdrop",
    variant: "md",
  });

  return (
    <>
      <div className="mb-4">
        <BackButton fallbackHref={`/tv/${tvId}`} label="Back" />
      </div>

      <h2 className="text-[clamp(2rem,3vw,3.5rem)] leading-[1.08] font-semibold tracking-[-0.28px]">
        {tv.name}
      </h2>
      <p className="mt-2 text-[13px] muted-label font-medium">
        {formatEpisodeCode(seasonNumber, episodeNumber)} - {episode.name || "Untitled Episode"}
      </p>

      {stillUrl ? (
        <Image
          src={stillUrl}
          alt={episode.name || "Episode still"}
          width={1280}
          height={720}
          sizes="(max-width: 768px) 100vw, 900px"
          className="mt-4 w-full h-auto rounded-[6px] border border-[var(--app-panel-border)]"
          priority
        />
      ) : (
        <div className="mt-4 w-full min-h-[260px] rounded-[6px] border border-[var(--app-panel-border)] bg-gradient-to-br from-[#5b45ff]/25 via-[#533afd]/18 to-[#0d253d]/20 dark:from-[#5b45ff]/30 dark:via-[#2f2f75]/40 dark:to-[#0d253d]/55 flex items-center justify-center">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/80">
            No Photo
          </span>
        </div>
      )}

      <div className="mt-4 grid gap-2 text-[14px] text-[rgba(0,0,0,0.78)] dark:text-white/80 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <span className="font-medium">Air Date:</span> {episode.air_date || "N/A"}
        </div>
        <div>
          <span className="font-medium">Runtime:</span> {formatRuntime(episode.runtime)}
        </div>
        <div>
          <span className="font-medium">Rating:</span> {episode.vote_average?.toFixed?.(1) || "N/A"}
        </div>
        <div>
          <span className="font-medium">Votes:</span> {episode.vote_count ?? "N/A"}
        </div>
      </div>

      <section className="mt-6">
        <h3 className="section-title">Overview</h3>
        <p className="text-[16px] leading-[1.5] text-[rgba(0,0,0,0.82)] dark:text-white/88">
          {episode.overview || "No episode overview available."}
        </p>
      </section>

      {Array.isArray(episode.guest_stars) && episode.guest_stars.length ? (
        <section className="mt-8">
          <h3 className="section-title">Guest Stars</h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
            {episode.guest_stars.slice(0, 12).map((star) => {
              const profileUrl = getConfiguredImageUrl(star.profile_path, {
                config: imageConfig,
                type: "profile",
                variant: "sm",
              });

              return (
                <Link
                  key={star.id}
                  href={`/person/${star.id}`}
                  className="movie-card text-center flex flex-col justify-between p-2 no-underline"
                >
                  {profileUrl ? (
                    <Image
                      src={profileUrl}
                      alt={star.name || "Guest star"}
                      width={185}
                      height={278}
                      loading="lazy"
                      sizes="(max-width: 640px) 40vw, (max-width: 1024px) 24vw, 160px"
                      className="w-full h-auto rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-[278px] rounded-lg bg-gradient-to-br from-[#5b45ff]/25 via-[#533afd]/18 to-[#0d253d]/20 dark:from-[#5b45ff]/30 dark:via-[#2f2f75]/40 dark:to-[#0d253d]/55 border border-white/20 dark:border-white/15 flex items-center justify-center">
                      <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/78">
                        No Photo
                      </span>
                    </div>
                  )}

                  <div className="p-2">
                    <p className="text-[14px] font-semibold tracking-[-0.18px] text-[rgba(0,0,0,0.88)] dark:text-white/92">
                      {star.name || "Unknown"}
                    </p>
                    <p className="text-[12px] muted-label">{star.character || "-"}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </>
  );
}
