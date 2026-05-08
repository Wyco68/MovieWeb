import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/BackButton";
import InfiniteMoviesGrid from "@/components/InfiniteMoviesGrid";
import Movies from "@/components/Movies";
import Persons from "@/components/Persons";
import TrailerPlayer from "@/components/TrailerPlayer";
import WatchSources from "@/components/WatchSources";
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

  // ONE request with append_to_response — replaces 6 separate fetches
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

  // Optional second request only if movie belongs to a collection
  const collectionResult = movie.belongs_to_collection?.id
    ? await tmdbFetch(`/collection/${movie.belongs_to_collection.id}`, { revalidate: 600 }).catch(() => null)
    : null;

  const videosData = movie.videos ?? { results: [] };
  const similar = movie.similar ?? { results: [], page: 1, total_pages: 1 };
  const recommendations = movie.recommendations ?? { results: [], page: 1, total_pages: 1 };
  const keywords = movie.keywords?.keywords ?? [];
  const watchProviders = movie["watch/providers"] ?? { results: {} };

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
        {(movie.genres ?? []).map((genre) => (
          <Badge key={genre.id} variant="outline">
            {genre.name}
          </Badge>
        ))}
      </div>

      <div className="mt-1">
        <TrailerPlayer
          videos={videosData?.results ?? []}
          title={movie.title || "Movie"}
          fallbackImageUrl={primaryImageUrl}
          fallbackImageAlt={`${movie.title} poster`}
          unavailableText="Trailer unavailable or blocked in your region for this title."
        />
      </div>

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
        <Persons entityId={movie.id} mediaType="movie" imageConfig={imageConfig} />
      </section>

      <WatchSources providersByRegion={watchProviders?.results ?? {}} />

      {collectionResult?.parts?.length ? (
        <section className="mt-8">
          <h3 className="section-title">Collection: {collectionResult.name}</h3>
          <Movies movies={collectionResult.parts} imageConfig={imageConfig} />
        </section>
      ) : null}

      <section className="mt-8">
        <h3 className="section-title">Similar Movies</h3>
        <InfiniteMoviesGrid
          initialItems={similar?.results ?? []}
          imageConfig={imageConfig}
          fetchKey="movie_similar"
          fetchParams={{ movieId: movie.id }}
          initialPage={similar?.page ?? 1}
          initialTotalPages={similar?.total_pages ?? 1}
          enableScrollLoad={false}
        />
      </section>

      <section className="mt-8">
        <h3 className="section-title">Recommendations</h3>
        <InfiniteMoviesGrid
          initialItems={recommendations?.results ?? []}
          imageConfig={imageConfig}
          fetchKey="movie_recommendations"
          fetchParams={{ movieId: movie.id }}
          initialPage={recommendations?.page ?? 1}
          initialTotalPages={recommendations?.total_pages ?? 1}
          enableScrollLoad={false}
        />
      </section>
    </>
  );
}
