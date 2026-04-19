import Link from "next/link";
import { Button } from "@/components/ui/button";
import { tmdbFetch } from "@/lib/tmdb";

export default async function Sidebar() {
  const data = await tmdbFetch("/genre/movie/list");
  const genres = data?.genres ?? [];

  return (
    <aside className="sidebar-panel flex flex-col gap-2 p-3">
      <Button className="justify-start" variant="outline" asChild>
        <Link href="/">All Movies</Link>
      </Button>
      <Button className="justify-start" variant="outline" asChild>
        <Link href="/tv">TV Shows</Link>
      </Button>
      <Button className="justify-start" variant="outline" asChild>
        <Link href="/people">People</Link>
      </Button>
      {genres.map((genre) => {
        return (
          <Button
            key={genre.id}
            className="justify-start"
            variant="outline"
            asChild
          >
            <Link href={`/genres/${genre.name}/${genre.id}`}>{genre.name}</Link>
          </Button>
        );
      })}
    </aside>
  );
}
