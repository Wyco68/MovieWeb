import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import BackButton from "@/components/BackButton";
import TrailerPlayer from "@/components/TrailerPlayer";
import {
  getConfiguredImageUrl,
  getTmdbImageConfig,
  tmdbFetch,
} from "@/lib/tmdb";

function formatRuntime(minutes) {
  if (!minutes || Number.isNaN(Number(minutes))) return "N/A";
  const totalMinutes = Number(minutes);
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  if (!hours) return `${remainingMinutes}m`;
  return `${hours}h ${remainingMinutes}m`;
}

function formatEpisodeCode(seasonNumber, episodeNumber) {
  return `S${String(seasonNumber ?? 0).padStart(2, "0")}E${String(episodeNumber ?? 0).padStart(2, "0")}`;
}

export default async function EpisodeDetailPage({ params }) {
  const resolvedParams = await params;
  const { id: tvId, seasonNumber, episodeNumber } = resolvedParams;
  const currentSeasonNumber = Number(seasonNumber);
  const currentEpisodeNumber = Number(episodeNumber);

  const [tv, episode, seasonDetails, episodeVideosResult, imageConfig] = await Promise.all([
    tmdbFetch(`/tv/${tvId}`, { revalidate: 600 }),
    tmdbFetch(`/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`, { revalidate: 600 }),
    tmdbFetch(`/tv/${tvId}/season/${seasonNumber}`, { revalidate: 600 }).catch(() => ({ episodes: [] })),
    tmdbFetch(`/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}/videos`, { revalidate: 600 }).catch(() => ({ results: [] })),
    getTmdbImageConfig(),
  ]);

  if (!tv?.id || !episode?.id) notFound();

  const stillUrl = getConfiguredImageUrl(episode.still_path, {
    config: imageConfig,
    type: "backdrop",
    variant: "md",
  });
  const tvBackdropUrl = getConfiguredImageUrl(tv.backdrop_path, {
    config: imageConfig,
    type: "backdrop",
    variant: "lg",
  });
  const tvPosterUrl = getConfiguredImageUrl(tv.poster_path, {
    config: imageConfig,
    type: "poster",
    variant: "lg",
  });
  const fallbackImageUrl = stillUrl || tvBackdropUrl || tvPosterUrl;

  const seasonNumbers = (tv.seasons ?? [])
    .map((season) => Number(season?.season_number))
    .filter((num) => Number.isInteger(num) && num > 0)
    .sort((a, b) => a - b);

  const seasonIndex = seasonNumbers.indexOf(currentSeasonNumber);
  const previousSeasonNumber = seasonIndex > 0 ? seasonNumbers[seasonIndex - 1] : null;
  const nextSeasonNumber =
    seasonIndex !== -1 && seasonIndex < seasonNumbers.length - 1
      ? seasonNumbers[seasonIndex + 1]
      : null;

  const episodesInSeason = (seasonDetails?.episodes ?? [])
    .filter((ep) => Number.isInteger(Number(ep?.episode_number)))
    .sort((a, b) => Number(a.episode_number) - Number(b.episode_number));

  const currentEpisodeIndex = episodesInSeason.findIndex(
    (ep) => Number(ep.episode_number) === currentEpisodeNumber,
  );

  let previousEpisodeTarget =
    currentEpisodeIndex > 0
      ? { seasonNumber: currentSeasonNumber, episode: episodesInSeason[currentEpisodeIndex - 1] }
      : null;
  let nextEpisodeTarget =
    currentEpisodeIndex !== -1 && currentEpisodeIndex < episodesInSeason.length - 1
      ? { seasonNumber: currentSeasonNumber, episode: episodesInSeason[currentEpisodeIndex + 1] }
      : null;

  if (!previousEpisodeTarget || !nextEpisodeTarget) {
    const [previousSeasonDetails, nextSeasonDetails] = await Promise.all([
      !previousEpisodeTarget && previousSeasonNumber
        ? tmdbFetch(`/tv/${tvId}/season/${previousSeasonNumber}`, { revalidate: 600 }).catch(() => null)
        : Promise.resolve(null),
      !nextEpisodeTarget && nextSeasonNumber
        ? tmdbFetch(`/tv/${tvId}/season/${nextSeasonNumber}`, { revalidate: 600 }).catch(() => null)
        : Promise.resolve(null),
    ]);

    if (!previousEpisodeTarget && previousSeasonDetails?.episodes?.length) {
      const prevEps = previousSeasonDetails.episodes
        .filter((ep) => Number.isInteger(Number(ep?.episode_number)))
        .sort((a, b) => Number(a.episode_number) - Number(b.episode_number));
      const prevEp = prevEps[prevEps.length - 1];
      if (prevEp) previousEpisodeTarget = { seasonNumber: previousSeasonNumber, episode: prevEp };
    }

    if (!nextEpisodeTarget && nextSeasonDetails?.episodes?.length) {
      const nextEps = nextSeasonDetails.episodes
        .filter((ep) => Number.isInteger(Number(ep?.episode_number)))
        .sort((a, b) => Number(a.episode_number) - Number(b.episode_number));
      const nextEp = nextEps[0];
      if (nextEp) nextEpisodeTarget = { seasonNumber: nextSeasonNumber, episode: nextEp };
    }
  }

  return (
    <>
      <div className="mb-4">
        <BackButton fallbackHref={`/tv/${tvId}`} label="Back to Series" alwaysRedirectToFallback />
      </div>

      <h2 className="text-[clamp(2rem,3vw,3.5rem)] leading-[1.08] font-semibold tracking-[-0.28px]">
        {tv.name}
      </h2>
      <p className="mt-2 text-[13px] muted-label">
        {formatEpisodeCode(seasonNumber, episodeNumber)} &mdash;{" "}
        {episode.name || "Untitled Episode"}
      </p>

      <div className="mt-4">
        <TrailerPlayer
          videos={episodeVideosResult?.results ?? []}
          title={episode.name || "Episode"}
          fallbackImageUrl={fallbackImageUrl}
          fallbackImageAlt={episode.name || "Episode still"}
          unavailableText="Trailer unavailable or blocked in your region for this episode."
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {previousEpisodeTarget ? (
          <Link
            href={`/tv/${tvId}/season/${previousEpisodeTarget.seasonNumber}/episode/${previousEpisodeTarget.episode.episode_number}`}
            className="rounded-[8px] border border-[var(--app-panel-border)] bg-[var(--app-panel-bg)] px-4 py-3 no-underline transition-transform duration-200 hover:-translate-y-[2px]"
          >
            <p className="text-[11px] uppercase tracking-[0.06em] muted-label">⬅ Previous Episode</p>
            <p className="mt-1 text-[14px] font-semibold text-[rgba(0,0,0,0.88)] dark:text-white/92">
              {formatEpisodeCode(
                previousEpisodeTarget.seasonNumber,
                previousEpisodeTarget.episode.episode_number,
              )}
              : {previousEpisodeTarget.episode.name || "Untitled Episode"}
            </p>
          </Link>
        ) : (
          <div className="rounded-[8px] border border-[var(--app-panel-border)] bg-[var(--app-panel-bg)] px-4 py-3 opacity-65">
            <p className="text-[11px] uppercase tracking-[0.06em] muted-label">⬅ Previous Episode</p>
            <p className="mt-1 text-[14px] font-semibold text-[rgba(0,0,0,0.72)] dark:text-white/76">
              Not available
            </p>
          </div>
        )}

        {nextEpisodeTarget ? (
          <Link
            href={`/tv/${tvId}/season/${nextEpisodeTarget.seasonNumber}/episode/${nextEpisodeTarget.episode.episode_number}`}
            className="rounded-[8px] border border-[var(--app-panel-border)] bg-[var(--app-panel-bg)] px-4 py-3 no-underline text-left transition-transform duration-200 hover:-translate-y-[2px] sm:text-right"
          >
            <p className="text-[11px] uppercase tracking-[0.06em] muted-label">Next Episode ➡</p>
            <p className="mt-1 text-[14px] font-semibold text-[rgba(0,0,0,0.88)] dark:text-white/92">
              {formatEpisodeCode(
                nextEpisodeTarget.seasonNumber,
                nextEpisodeTarget.episode.episode_number,
              )}
              : {nextEpisodeTarget.episode.name || "Untitled Episode"}
            </p>
          </Link>
        ) : (
          <div className="rounded-[8px] border border-[var(--app-panel-border)] bg-[var(--app-panel-bg)] px-4 py-3 opacity-65 sm:text-right">
            <p className="text-[11px] uppercase tracking-[0.06em] muted-label">Next Episode ➡</p>
            <p className="mt-1 text-[14px] font-semibold text-[rgba(0,0,0,0.72)] dark:text-white/76">
              Not available
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-2 text-[14px] text-[rgba(0,0,0,0.78)] dark:text-white/80 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <span className="font-medium">Air Date:</span> {episode.air_date || "N/A"}
        </div>
        <div>
          <span className="font-medium">Runtime:</span> {formatRuntime(episode.runtime)}
        </div>
        <div>
          <span className="font-medium">Rating:</span>{" "}
          {episode.vote_average?.toFixed?.(1) || "N/A"}
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
