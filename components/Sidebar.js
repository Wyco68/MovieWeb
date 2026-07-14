import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MOVIE_GENRES } from "@/lib/genres";
import { Film, Tv, Users, Compass, ChevronRight } from "lucide-react";

export default function Sidebar() {
  // TMDB's movie genre list is effectively static, so it's bundled locally
  // (lib/genres.js) instead of fetched — no request, no token, works at build.
  const genres = MOVIE_GENRES;

  const primaryLinks = [
    { href: "/", label: "All Movies", icon: Film },
    { href: "/tv", label: "TV Shows", icon: Tv },
    { href: "/people", label: "People", icon: Users },
    { href: "/discover", label: "Discover", icon: Compass },
  ];

  return (
    <aside className="sidebar-panel p-3 h-full">
      <div className="flex flex-col gap-2">
        {primaryLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.href}
              className="sidebar-primary-link w-full justify-between h-auto min-h-[58px] px-4 py-3 group"
              variant="secondary"
              asChild
            >
              <Link href={item.href}>
                <span className="sidebar-primary-link-texts items-center gap-3">
                  <Icon className="w-5 h-5 text-white/90 group-hover:text-white transition-colors" />
                  <span className="sidebar-primary-link-title group-hover:translate-x-0.5 transition-transform">{item.label}</span>
                </span>
                <span className="sidebar-primary-link-arrow text-white/70 group-hover:text-white transition-colors" aria-hidden="true">
                  <ChevronRight className="w-4 h-4" />
                </span>
              </Link>
            </Button>
          );
        })}
      </div>

      <div className="my-5 h-px w-full bg-gradient-to-r from-transparent via-[var(--sidebar-panel-border)] to-transparent" />

      <div>
        <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748d] dark:text-white/60">
          Browse By Genre
        </p>
        <div className="grid grid-cols-1 gap-1.5">
          {genres.map((genre) => (
            <Button
              key={genre.id}
              className="sidebar-genre-link w-full justify-start font-medium text-[#273951] dark:text-white/80 hover:bg-[#533afd]/10 hover:text-[#533afd] dark:hover:bg-white/10 dark:hover:text-white border-transparent hover:border-[#533afd]/20 transition-all rounded-[6px]"
              variant="ghost"
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
