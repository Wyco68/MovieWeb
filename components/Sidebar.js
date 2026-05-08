import Link from "next/link";
import { Button } from "@/components/ui/button";
import { tmdbFetch } from "@/lib/tmdb";

export default async function Sidebar() {
  const data = await tmdbFetch("/genre/movie/list", { revalidate: 86400 });
  const genres = data?.genres ?? [];

  const primaryLinks = [
    { href: "/", label: "All Movies" },
    { href: "/tv", label: "TV Shows" },
    { href: "/people", label: "People" },
    { href: "/discover", label: "Discover" },
  ];

  return (
    <aside className="sidebar-panel p-3">
      <div className="flex flex-col gap-2">
        {primaryLinks.map((item) => (
          <Button
            key={item.href}
            className="sidebar-primary-link w-full justify-between h-auto min-h-[58px] px-4 py-3"
            variant="secondary"
            asChild
          >
            <Link href={item.href}>
              <span className="sidebar-primary-link-texts">
                <span className="sidebar-primary-link-title">{item.label}</span>
              </span>
              <span className="sidebar-primary-link-arrow" aria-hidden="true">
                &rarr;
              </span>
            </Link>
          </Button>
        ))}
      </div>

      <div className="my-4 h-px bg-[var(--sidebar-panel-border)]" />

      <div>
        <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] muted-label">
          Browse By Genre
        </p>
        <div className="grid grid-cols-1 gap-2">
          {genres.map((genre) => (
            <Button
              key={genre.id}
              className="sidebar-genre-link w-full justify-start"
              variant="outline"
              size="sm"
              asChild
            >
              <Link href={`/genres/${genre.id}`}>{genre.name}</Link>
            </Button>
          ))}
        </div>
      </div>
    </aside>
  );
}
