"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

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

export default function SeasonEpisodesSwitcher({ tvId, seasons }) {
  const orderedSeasons = useMemo(() => {
    return (seasons ?? [])
      .filter((season) => Number.isInteger(Number(season?.season_number)))
      .slice()
      .sort((a, b) => Number(a.season_number) - Number(b.season_number));
  }, [seasons]);

  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState(() => {
    return orderedSeasons[0]?.season_number ?? null;
  });

  const selectedSeason = useMemo(() => {
    return orderedSeasons.find((season) => {
      return Number(season.season_number) === Number(selectedSeasonNumber);
    }) ?? null;
  }, [orderedSeasons, selectedSeasonNumber]);

  const seasonEpisodes = useMemo(() => {
    return (selectedSeason?.episodes ?? [])
      .filter((episode) => Number.isInteger(Number(episode?.episode_number)))
      .slice()
      .sort((a, b) => Number(a.episode_number) - Number(b.episode_number));
  }, [selectedSeason]);

  if (!orderedSeasons.length) {
    return <p className="mt-3 text-[13px] muted-label">No season details available.</p>;
  }

  return (
    <section className="mt-8 space-y-4">
      <h3 className="section-title">Seasons & Episodes</h3>

      <div className="rounded-[999px] border border-[var(--app-panel-border)] bg-[var(--app-panel-bg)] p-1 overflow-x-auto">
        <div className="flex min-w-max gap-1">
          {orderedSeasons.map((season) => {
            const isActive = Number(season.season_number) === Number(selectedSeasonNumber);

            return (
              <button
                key={season.id || season.season_number}
                type="button"
                onClick={() => setSelectedSeasonNumber(season.season_number)}
                className={[
                  "rounded-[999px] px-4 py-2 text-[14px] font-semibold tracking-[-0.12px] whitespace-nowrap transition-colors duration-200",
                  isActive
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "text-[rgba(0,0,0,0.82)] hover:bg-black/6 dark:text-white/82 dark:hover:bg-white/12",
                ].join(" ")}
              >
                {season.name || `Season ${season.season_number}`}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-[8px] border border-[var(--app-panel-border)] bg-[color-mix(in_oklab,var(--app-panel-bg)_86%,#533afd_14%)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-[19px] font-semibold tracking-[-0.2px]">
            {selectedSeason?.name || `Season ${selectedSeason?.season_number}`}
          </h4>
          <span className="rounded-full border border-[var(--app-panel-border)] px-3 py-1 text-[12px] font-medium muted-label">
            Episodes: {selectedSeason?.episode_count ?? seasonEpisodes.length}
          </span>
        </div>

        {seasonEpisodes.length ? (
          <div className="mt-4 flex flex-col gap-3">
            {seasonEpisodes.map((episode) => {
              return (
                <Link
                  key={episode.id}
                  href={`/tv/${tvId}/season/${selectedSeason.season_number}/episode/${episode.episode_number}`}
                  className="rounded-[8px] border border-[var(--app-panel-border)] bg-[var(--app-panel-bg)] p-3 block no-underline transition-transform duration-200 hover:-translate-y-[2px]"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-[999px] border border-[var(--app-panel-border)] px-2 py-0.5 text-[11px] font-semibold tracking-[0.02em]">
                          {formatEpisodeCode(episode.episode_number)}
                        </span>

                        <h5 className="text-[14px] font-semibold leading-[1.3] text-[rgba(0,0,0,0.9)] dark:text-white/92">
                          {episode.name || "Untitled Episode"}
                        </h5>
                      </div>

                      <p className="mt-1 text-[11px] muted-label">
                        Air Date: {episode.air_date || "N/A"}
                      </p>
                    </div>

                    <span className="text-[11px] muted-label sm:shrink-0">
                      {formatRuntime(episode.runtime)}
                    </span>
                  </div>

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
    </section>
  );
}
