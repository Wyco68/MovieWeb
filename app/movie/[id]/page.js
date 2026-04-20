import Image from "next/image";
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

export default async function Movie({ params }) {
  const resolvedParams = await params;
  const [movie, imageConfig] = await Promise.all([
    tmdbFetch(`/movie/${resolvedParams.id}`),
    getTmdbImageConfig(),
  ]);

  if (!movie?.id) {
    notFound();
  }

  const coverUrl = getConfiguredImageUrl(movie.backdrop_path, {
    config: imageConfig,
    type: "backdrop",
    variant: "lg",
  });
  const releaseYear = movie.release_date?.split("-")[0] ?? "N/A";

  const [similar, recommendations, collection] = await Promise.all([
    tmdbFetch(`/movie/${movie.id}/similar`),
    tmdbFetch(`/movie/${movie.id}/recommendations`),
    movie.belongs_to_collection?.id
      ? tmdbFetch(`/collection/${movie.belongs_to_collection.id}`)
      : Promise.resolve(null),
  ]);

  return (
    <>
      <div className="mb-4">
        <BackButton fallbackHref="/" label="Back" />
      </div>

      <h2 className="text-[clamp(2rem,3vw,3.5rem)] leading-[1.08] font-semibold tracking-[-0.28px]">
        {movie.title}
        <span className="ml-1 muted-label text-[0.6em]">({releaseYear})</span>
      </h2>

      <div className="mb-4 mt-3 flex flex-wrap gap-2">
        {(movie.genres ?? []).map((genre) => {
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
          alt={`${movie.title} backdrop`}
          width={1280}
          height={720}
          sizes="(max-width: 768px) 100vw, 900px"
          className="w-full h-auto rounded-[6px] border border-[var(--app-panel-border)]"
          priority
        />
      ) : null}

      <div className="mt-4 grid gap-2 text-[14px] text-[rgba(0,0,0,0.78)] dark:text-white/80 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <span className="font-medium">Release Date:</span> {movie.release_date || "N/A"}
        </div>
        <div>
          <span className="font-medium">Runtime:</span> {formatRuntime(movie.runtime)}
        </div>
        <div>
          <span className="font-medium">Rating:</span> {movie.vote_average?.toFixed?.(1) || "N/A"}
        </div>
        <div>
          <span className="font-medium">Votes:</span> {movie.vote_count ?? "N/A"}
        </div>
      </div>

      <p className="mt-4 text-[17px] leading-[1.45] tracking-[-0.22px] text-[rgba(0,0,0,0.82)] dark:text-white/88">
        {movie.overview}
      </p>

      <section className="mt-8">
        <Persons entityId={movie.id} mediaType="movie" imageConfig={imageConfig} />
      </section>

      {collection?.parts?.length ? (
        <section className="mt-8">
          <h3 className="section-title">Collection: {collection.name}</h3>
          <Movies movies={collection.parts} imageConfig={imageConfig} />
        </section>
      ) : null}

      <section className="mt-8">
        <h3 className="section-title">Similar Movies</h3>
        <Movies movies={similar?.results ?? []} imageConfig={imageConfig} />
      </section>

      <section className="mt-8">
        <h3 className="section-title">Recommendations</h3>
        <Movies movies={recommendations?.results ?? []} imageConfig={imageConfig} />
      </section>
    </>
  );
}
