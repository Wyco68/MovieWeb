import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/BackButton";
import Movies from "@/components/Movies";
import Persons from "@/components/Persons";
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

function formatEpisodeCode(episodeNumber) {
  const e = String(episodeNumber ?? 0).padStart(2, "0");
  return `E${e}`;
}

function getOverviewSnippet(text) {
  if (!text) {
    return "No episode overview available.";
  }

  if (text.length <= 120) {
    return text;
  }

  return `${text.slice(0, 117)}...`;
}

export default async function TVShowDetail({ params }) {
  const resolvedParams = await params;
  const [tv, imageConfig] = await Promise.all([
    tmdbFetch(`/tv/${resolvedParams.id}`),
    getTmdbImageConfig(),
  ]);

  if (!tv?.id) {
    notFound();
  }

  const seasons = Array.isArray(tv.seasons) ? tv.seasons : [];
  const seasonDetails = await Promise.all(
    seasons
      .filter((season) => typeof season.season_number === "number")
      .map((season) => {
        return tmdbFetch(`/tv/${tv.id}/season/${season.season_number}`);
      }),
  );

  const seasonsWithEpisodes = seasons
    .map((season) => {
      const detail = seasonDetails.find(
        (item) => item?.season_number === season.season_number,
      );

      return {
        ...season,
        episodes: detail?.episodes ?? [],
      };
    })
    .filter((season) => season.season_number !== 0);

  const coverUrl = getConfiguredImageUrl(tv.backdrop_path, {
    config: imageConfig,
    type: "backdrop",
    variant: "lg",
  });
  const firstAirYear = tv.first_air_date?.split("-")[0] ?? "N/A";
  const averageRuntime = Array.isArray(tv.episode_run_time)
    ? tv.episode_run_time[0]
    : null;

  const [similar, recommendations] = await Promise.all([
    tmdbFetch(`/tv/${tv.id}/similar`),
    tmdbFetch(`/tv/${tv.id}/recommendations`),
  ]);

  return (
    <>
      <div className="mb-4">
        <BackButton fallbackHref="/tv" label="Back" />
      </div>

      <h2 className="text-[clamp(2rem,3vw,3.5rem)] leading-[1.08] font-semibold tracking-[-0.28px]">
        {tv.name}
        <span className="ml-1 muted-label text-[0.6em]">({firstAirYear})</span>
      </h2>

      <div className="mb-4 mt-3 flex flex-wrap gap-2">
        {(tv.genres ?? []).map((genre) => {
          return (
            <Badge key={genre.id} variant="outline">
              {genre.name}
            </Badge>
          );
        })}
      </div>

      {coverUrl ? (
        <Image
          src={coverUrl}
          alt={`${tv.name} backdrop`}
          width={1280}
          height={720}
          sizes="(max-width: 768px) 100vw, 900px"
          className="w-full h-auto rounded-[6px] border border-[var(--app-panel-border)]"
          priority
        />
      ) : null}

      <div className="mt-4 grid gap-2 text-[14px] text-[rgba(0,0,0,0.78)] dark:text-white/80 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <span className="font-medium">First Air Date:</span> {tv.first_air_date || "N/A"}
        </div>
        <div>
          <span className="font-medium">Average Runtime:</span> {formatRuntime(averageRuntime)}
        </div>
        <div>
          <span className="font-medium">Rating:</span> {tv.vote_average?.toFixed?.(1) || "N/A"}
        </div>
        <div>
          <span className="font-medium">Votes:</span> {tv.vote_count ?? "N/A"}
        </div>
        <div>
          <span className="font-medium">Seasons:</span> {tv.number_of_seasons ?? seasonsWithEpisodes.length}
        </div>
        <div>
          <span className="font-medium">Episodes:</span> {tv.number_of_episodes ?? "N/A"}
        </div>
      </div>

      <p className="mt-4 text-[17px] leading-[1.45] tracking-[-0.22px] text-[rgba(0,0,0,0.82)] dark:text-white/88">
        {tv.overview || "No overview available."}
      </p>

      <section className="mt-8">
        <Persons entityId={tv.id} mediaType="tv" imageConfig={imageConfig} />
      </section>

      <section className="mt-8 space-y-4">
        <h3 className="section-title">Seasons & Episodes</h3>
        {seasonsWithEpisodes.map((season) => {
          const seasonEpisodes = (season.episodes ?? [])
            .slice()
            .sort((a, b) => (a.episode_number ?? 0) - (b.episode_number ?? 0));

          return (
            <div
              key={season.id || season.season_number}
              className="rounded-[8px] border border-[var(--app-panel-border)] bg-[color-mix(in_oklab,var(--app-panel-bg)_86%,#533afd_14%)] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-[19px] font-semibold tracking-[-0.2px]">
                  {season.name || `Season ${season.season_number}`}
                </h4>
                <span className="rounded-full border border-[var(--app-panel-border)] px-3 py-1 text-[12px] font-medium muted-label">
                  Episodes: {season.episode_count ?? seasonEpisodes.length}
                </span>
              </div>

              {seasonEpisodes.length ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {seasonEpisodes.map((episode) => {
                    return (
                      <Link
                        key={episode.id}
                        href={`/tv/${tv.id}/season/${season.season_number}/episode/${episode.episode_number}`}
                        className="rounded-[8px] border border-[var(--app-panel-border)] bg-[var(--app-panel-bg)] p-3 block no-underline transition-transform duration-200 hover:-translate-y-[2px]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="rounded-[999px] border border-[var(--app-panel-border)] px-2 py-0.5 text-[11px] font-semibold tracking-[0.02em]">
                            {formatEpisodeCode(episode.episode_number)}
                          </span>
                          <span className="text-[11px] muted-label">
                            {formatRuntime(episode.runtime)}
                          </span>
                        </div>

                        <h5 className="mt-2 text-[14px] font-semibold leading-[1.3] text-[rgba(0,0,0,0.9)] dark:text-white/92">
                          {episode.name || "Untitled Episode"}
                        </h5>

                        <p className="mt-1 text-[11px] muted-label">
                          Air Date: {episode.air_date || "N/A"}
                        </p>

                        <p className="mt-2 text-[12px] leading-[1.45] text-[rgba(0,0,0,0.78)] dark:text-white/78">
                          {getOverviewSnippet(episode.overview)}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-3 text-[13px] muted-label">No episode details available.</p>
              )}
            </div>
          );
        })}
      </section>

      <section className="mt-8">
        <h3 className="section-title">Similar Shows</h3>
        <Movies movies={similar?.results ?? []} mediaType="tv" imageConfig={imageConfig} />
      </section>

      <section className="mt-8">
        <h3 className="section-title">Recommendations</h3>
        <Movies movies={recommendations?.results ?? []} mediaType="tv" imageConfig={imageConfig} />
      </section>
    </>
  );
}
