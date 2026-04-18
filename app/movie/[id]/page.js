import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import Persons from "@/components/Persons";
import { getImageUrl, tmdbFetch } from "@/lib/tmdb";

export default async function Movie({ params }) {
  const resolvedParams = await params;
  const movie = await tmdbFetch(`/movie/${resolvedParams.id}`);

  if (!movie?.id) {
    notFound();
  }

  const coverUrl = getImageUrl(movie.backdrop_path, "w1280");
  const releaseYear = movie.release_date?.split("-")[0] ?? "N/A";

  return (
    <>
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
          className="w-full h-auto rounded-xl border border-black/8"
          priority
        />
      ) : null}
      <p className="mt-4 text-[17px] leading-[1.45] tracking-[-0.22px] text-[rgba(0,0,0,0.82)]">
        {movie.overview}
      </p>
      <div className="mt-8">
        <h3 className="section-title">Starring</h3>
        <Persons movie={movie} />
      </div>
    </>
  );
}
