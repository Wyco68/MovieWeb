"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/BackButton";
import HorizontalMediaRow from "@/components/HorizontalMediaRow";
import Persons from "@/components/Persons";
import SeasonEpisodesSwitcher from "@/components/SeasonEpisodesSwitcher";
import TrailerPlayer from "@/components/TrailerPlayer";
import WatchSources from "@/components/WatchSources";
import Loading from "@/app/loading";
import { fetchTmdb } from "@/lib/api";
import { isValidId } from "@/lib/search-params";
import { getConfiguredImageUrl } from "@/lib/tmdb-image";
import { routeId } from "@/lib/route-params";

const imageConfig = null;

function formatRuntime(minutes) {
  if (!minutes || Number.isNaN(Number(minutes))) return "N/A";
  const totalMinutes = Number(minutes);
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  if (!hours) return `${remainingMinutes}m`;
  return `${hours}h ${remainingMinutes}m`;
}

function NotFound() {
  return (
    <>
      <div className="mb-4">
        <BackButton fallbackHref="/tv" label="Back" />
      </div>
      <h2 className="text-2xl font-semibold">TV show not found</h2>
      <p className="mt-2 muted-label">This title could not be loaded.</p>
    </>
  );
}

export default function TVDetailView() {
  const [state, setState] = useState({ status: "loading", tv: null, seasons: [] });

  useEffect(() => {
    let active = true;
    const id = routeId();

    if (!isValidId(id)) {
      setState({ status: "notfound", tv: null, seasons: [] });
      return undefined;
    }

    fetchTmdb({ key: "tv_detail", tvId: id })
      .then(async (tv) => {
        if (!tv?.id) throw new Error("not found");

        const rawSeasons = (Array.isArray(tv.seasons) ? tv.seasons : []).filter(
          (s) => typeof s.season_number === "number" && s.season_number > 0,
        );

        // Prefetch only the first available season's episodes; the rest load
        // lazily inside SeasonEpisodesSwitcher.
        const firstSeasonNumber = rawSeasons[0]?.season_number ?? null;
        const prefetchedSeasonData =
          firstSeasonNumber !== null
            ? await fetchTmdb({ key: "tv_season", tvId: tv.id, season: firstSeasonNumber }).catch(() => null)
            : null;

        const seasonsForSwitcher = rawSeasons.map((season) => {
          if (season.season_number === firstSeasonNumber && prefetchedSeasonData?.episodes) {
            return { ...season, episodes: prefetchedSeasonData.episodes };
          }
          return { ...season, episodes: [] };
        });

        if (active) setState({ status: "ready", tv, seasons: seasonsForSwitcher });
      })
      .catch(() => {
        if (active) setState({ status: "notfound", tv: null, seasons: [] });
      });

    return () => {
      active = false;
    };
  }, []);

  if (state.status === "loading") return <Loading />;
  if (state.status === "notfound") return <NotFound />;

  const tv = state.tv;
  const seasonsForSwitcher = state.seasons;

  const coverUrl = getConfiguredImageUrl(tv.backdrop_path, {
    config: imageConfig,
    type: "backdrop",
    variant: "lg",
  });
  const posterUrl = getConfiguredImageUrl(tv.poster_path, {
    config: imageConfig,
    type: "poster",
    variant: "lg",
  });
  const primaryImageUrl = coverUrl || posterUrl;
  const firstAirYear = tv.first_air_date?.split("-")[0] ?? "N/A";
  const averageRuntime = Array.isArray(tv.episode_run_time) ? tv.episode_run_time[0] : null;

  const videosData = tv.videos ?? { results: [] };
  const similar = tv.similar ?? { results: [], page: 1, total_pages: 1 };
  const recommendations = tv.recommendations ?? { results: [], page: 1, total_pages: 1 };
  const keywords = tv.keywords?.results ?? [];
  const watchProviders = tv["watch/providers"] ?? { results: {} };

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
        {(tv.genres ?? []).map((genre) => (
          <Badge key={genre.id} variant="outline">
            {genre.name}
          </Badge>
        ))}
      </div>

      <div className="mt-1">
        <TrailerPlayer
          videos={videosData?.results ?? []}
          title={tv.name || "TV Show"}
          fallbackImageUrl={primaryImageUrl}
          fallbackImageAlt={`${tv.name} poster`}
          unavailableText="Trailer unavailable or blocked in your region for this title."
        />
      </div>

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
          <span className="font-medium">Seasons:</span>{" "}
          {tv.number_of_seasons ?? seasonsForSwitcher.length}
        </div>
        <div>
          <span className="font-medium">Episodes:</span> {tv.number_of_episodes ?? "N/A"}
        </div>
      </div>

      <p className="mt-4 text-[17px] leading-[1.45] tracking-[-0.22px] text-[rgba(0,0,0,0.82)] dark:text-white/88">
        {tv.overview || "No overview available."}
      </p>

      {keywords.length ? (
        <section className="mt-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] muted-label">
            Keywords
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <Badge
                key={keyword.id}
                variant="outline"
                className="px-4 py-1.5 text-[15px] font-semibold tracking-[-0.12px]"
              >
                {keyword.name}
              </Badge>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <Persons imageConfig={imageConfig} credits={tv.credits} />
      </section>

      <WatchSources providersByRegion={watchProviders?.results ?? {}} />

      <SeasonEpisodesSwitcher tvId={tv.id} seasons={seasonsForSwitcher} />

      {similar?.results?.length > 0 && (
        <div className="mt-8">
          <HorizontalMediaRow
            title="Similar Shows"
            items={similar?.results ?? []}
            mediaType="tv"
            imageConfig={imageConfig}
            emptyLabel="No similar shows found."
          />
        </div>
      )}

      {recommendations?.results?.length > 0 && (
        <div className="mt-8">
          <HorizontalMediaRow
            title="Recommendations"
            items={recommendations?.results ?? []}
            mediaType="tv"
            imageConfig={imageConfig}
            emptyLabel="No recommendations found."
          />
        </div>
      )}
    </>
  );
}
