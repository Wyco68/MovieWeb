import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getImageUrl, tmdbFetch } from "@/lib/tmdb";

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

export default async function TVShowDetail({ params }) {
  const resolvedParams = await params;
  const tv = await tmdbFetch(`/tv/${resolvedParams.id}`);

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

  const seasonsWithEpisodes = seasons.map((season) => {
    const detail = seasonDetails.find(
      (item) => item?.season_number === season.season_number,
    );

    return {
      ...season,
      episodes: detail?.episodes ?? [],
    };
  });

  const coverUrl = getImageUrl(tv.backdrop_path, "w1280");
  const firstAirYear = tv.first_air_date?.split("-")[0] ?? "N/A";
  const averageRuntime = Array.isArray(tv.episode_run_time)
    ? tv.episode_run_time[0]
    : null;

  return (
    <>
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

      <section className="mt-8 space-y-4">
        <h3 className="section-title">Seasons & Episodes</h3>
        {seasonsWithEpisodes.map((season) => {
          return (
            <div
              key={season.id || season.season_number}
              className="rounded-[8px] border border-[var(--app-panel-border)] p-4"
            >
              <h4 className="text-[18px] font-semibold tracking-[-0.2px]">
                {season.name || `Season ${season.season_number}`}
              </h4>
              <p className="mt-1 text-[13px] muted-label">
                Episodes: {season.episode_count ?? season.episodes.length}
              </p>

              <ul className="mt-3 space-y-2">
                {season.episodes.slice(0, 20).map((episode) => {
                  return (
                    <li
                      key={episode.id}
                      className="text-[14px] text-[rgba(0,0,0,0.82)] dark:text-white/84"
                    >
                      <span className="font-medium">E{episode.episode_number}:</span> {episode.name}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </section>
    </>
  );
}
