import Image from "next/image";
import Link from "next/link";
import { getImageUrl } from "@/lib/tmdb";

export default function Movies({ movies }) {
  const safeMovies = Array.isArray(movies) ? movies : [];

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
      {safeMovies.map((movie) => (
        <div
          key={movie.id}
          className="movie-card p-2 text-center flex flex-col"
        >
          {movie.poster_path ? (
            <Link href={`/movie/${movie.id}`} className="poster-frame block">
              <Image
                src={getImageUrl(movie.poster_path, "w342")}
                alt={`${movie.title || "Movie"} poster`}
                width={342}
                height={513}
                sizes="(max-width: 640px) 100vw, 200px"
                className="w-full transition-transform duration-300 hover:scale-[1.04]"
              />
            </Link>
          ) : (
            <div className="w-full h-[300px] bg-slate-100 rounded-lg"></div>
          )}
          <div className="px-1 py-2">
            <h4 className="mt-1 text-[15px] leading-tight font-semibold tracking-[-0.2px]">
              {movie.title || "Untitled"}
            </h4>
            <span className="text-[12px] muted-label">
              {movie.release_date?.split("-")[0] ?? "N/A"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
