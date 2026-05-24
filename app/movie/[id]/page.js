import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/BackButton";
import HorizontalMediaRow from "@/components/HorizontalMediaRow";
import Persons from "@/components/Persons";
import TrailerPlayer from "@/components/TrailerPlayer";
import WatchSources from "@/components/WatchSources";
import { Clock, Star, Calendar } from "lucide-react";
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

export default async function MovieDetail({ params }) {
  const resolvedParams = await params;

  // ONE request with append_to_response
  const [movie, imageConfig] = await Promise.all([
    tmdbFetch(`/movie/${resolvedParams.id}`, {
      params: {
        append_to_response: "credits,videos,recommendations,similar,keywords,watch/providers",
      },
      revalidate: 600,
    }),
    getTmdbImageConfig(),
  ]);

  if (!movie?.id) notFound();

  const coverUrl = getConfiguredImageUrl(movie.backdrop_path, {
    config: imageConfig,
    type: "backdrop",
    variant: "lg",
  });
  const posterUrl = getConfiguredImageUrl(movie.poster_path, {
    config: imageConfig,
    type: "poster",
    variant: "lg",
  });
  const primaryImageUrl = coverUrl || posterUrl;
  const releaseYear = movie.release_date?.split("-")[0] ?? "N/A";

  const collectionResult = movie.belongs_to_collection?.id
    ? await tmdbFetch(`/collection/${movie.belongs_to_collection.id}`, { revalidate: 600 }).catch(() => null)
    : null;

  const videosData = movie.videos ?? { results: [] };
  const similar = movie.similar ?? { results: [], page: 1, total_pages: 1 };
  const recommendations = movie.recommendations ?? { results: [], page: 1, total_pages: 1 };
  const keywords = movie.keywords?.keywords ?? [];
  const watchProviders = movie["watch/providers"] ?? { results: {} };

  return (
    <div className="pb-16 flex flex-col">
      <div className="mb-4">
        <BackButton fallbackHref="/" label="Back" />
      </div>

      {/* Hero Banner Section */}
      <div className="relative w-[calc(100vw-2rem)] -ml-4 sm:-ml-0 sm:w-full md:rounded-lg overflow-hidden min-h-[450px] md:min-h-[500px] bg-[#1c1e54] mb-8">
        {coverUrl && (
          <Image
            src={coverUrl}
            alt={`${movie.title} backdrop`}
            fill
            priority
            className="object-cover opacity-40 mix-blend-overlay"
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1c1e54] via-[#1c1e54]/80 to-transparent md:bg-gradient-to-r md:from-[#1c1e54] md:via-[#1c1e54]/90 md:to-transparent" />
        
        <div className="relative h-full w-full p-4 md:p-8 flex flex-col md:flex-row items-end md:items-center gap-6 md:gap-10">
          <div className="w-[120px] md:w-[220px] shrink-0 rounded-lg overflow-hidden shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] border border-white/10 hidden sm:block z-10">
            {posterUrl ? (
              <Image
                src={posterUrl}
                alt={`${movie.title} poster`}
                width={220}
                height={330}
                className="w-full object-cover aspect-[2/3]"
                priority
              />
            ) : (
              <div className="w-full aspect-[2/3] bg-white/5 flex items-center justify-center">
                <span className="text-white/50 text-xs uppercase tracking-widest">No Poster</span>
              </div>
            )}
          </div>

          <div className="flex flex-col text-white z-10 w-full max-w-3xl pt-8 md:pt-0">
            <div className="flex flex-wrap gap-2 mb-3">
              {(movie.genres ?? []).map((genre) => (
                <Badge key={genre.id} variant="secondary" className="bg-white/10 text-white hover:bg-white/20 border-0 rounded-sm px-2.5 py-0.5 text-xs font-medium">
                  {genre.name}
                </Badge>
              ))}
            </div>

            <h1 className="text-3xl md:text-5xl font-light tracking-tight mb-2">
              {movie.title}
              <span className="text-white/60 text-2xl md:text-4xl ml-3 font-light">({releaseYear})</span>
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-white/80 mb-6 font-medium">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span>{movie.vote_average?.toFixed?.(1) || "N/A"}</span>
                <span className="text-white/40 text-xs">({movie.vote_count})</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-white/30" />
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 opacity-70" />
                <span>{formatRuntime(movie.runtime)}</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-white/30" />
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 opacity-70" />
                <span>{movie.release_date || "N/A"}</span>
              </div>
            </div>

            <p className="text-[15px] md:text-[16px] leading-relaxed text-white/90 mb-8 max-w-2xl">
              {movie.overview}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-10">
        <section>
          <TrailerPlayer
            videos={videosData?.results ?? []}
            title={movie.title || "Movie"}
            fallbackImageUrl={primaryImageUrl}
            fallbackImageAlt={`${movie.title} poster`}
            unavailableText="Trailer unavailable or blocked in your region for this title."
          />
        </section>

        <section>
          <WatchSources providersByRegion={watchProviders?.results ?? {}} />
        </section>

        <section>
          <Persons entityId={movie.id} mediaType="movie" imageConfig={imageConfig} />
        </section>

        {keywords.length > 0 && (
          <section className="bg-white dark:bg-[#1c1e54] p-5 rounded-lg border border-[var(--app-panel-border)]">
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#64748d] dark:text-white/60 mb-3">
              Keywords
            </h3>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword) => (
                <Badge
                  key={keyword.id}
                  variant="outline"
                  className="bg-transparent border-[#e5edf5] dark:border-white/10 text-[#273951] dark:text-white/80 px-3 py-1 font-medium rounded-[4px]"
                >
                  {keyword.name}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {collectionResult?.parts?.length > 0 && (
          <HorizontalMediaRow
            title={`Collection: ${collectionResult.name}`}
            items={collectionResult.parts}
            mediaType="movie"
            imageConfig={imageConfig}
            emptyLabel="No movies in this collection."
          />
        )}

        {similar?.results?.length > 0 && (
          <HorizontalMediaRow
            title="Similar Movies"
            items={similar?.results ?? []}
            mediaType="movie"
            imageConfig={imageConfig}
            emptyLabel="No similar movies found."
          />
        )}

        {recommendations?.results?.length > 0 && (
          <HorizontalMediaRow
            title="Recommendations"
            items={recommendations?.results ?? []}
            mediaType="movie"
            imageConfig={imageConfig}
            emptyLabel="No recommendations found."
          />
        )}
      </div>
    </div>
  );
}
