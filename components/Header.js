"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SEARCH_QUERY_MAX, SEARCH_QUERY_MIN } from "@/lib/search-params";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Search } from "lucide-react";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialQuery = useMemo(() => String(searchParams?.get("q") ?? ""), [searchParams]);
  const [query, setQuery] = useState(initialQuery);
  const lastPushedRef = useRef(initialQuery.trim());

  useEffect(() => {
    setQuery(initialQuery);
    lastPushedRef.current = initialQuery.trim();
  }, [initialQuery]);

  useEffect(() => {
    if (pathname !== "/search") return undefined;

    const trimmed = query.trim();
    if (!trimmed || trimmed.length < SEARCH_QUERY_MIN || trimmed === lastPushedRef.current) return undefined;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.set("q", trimmed.slice(0, SEARCH_QUERY_MAX));
      router.replace(`/search?${params.toString()}`);
      lastPushedRef.current = trimmed.slice(0, SEARCH_QUERY_MAX);
    }, 600);

    return () => clearTimeout(timer);
  }, [pathname, query, router, searchParams]);

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = query.trim().slice(0, SEARCH_QUERY_MAX);

    if (!trimmed) {
      router.push("/");
      return;
    }

    if (trimmed.length < SEARCH_QUERY_MIN) return;

    if (trimmed === lastPushedRef.current && pathname === "/search") return;

    const params = new URLSearchParams({ q: trimmed });
    router.push(`/search?${params.toString()}`);
    lastPushedRef.current = trimmed;
  }

  return (
    <nav className="app-nav sticky top-3 z-50 mx-4 mb-6 mt-4 flex min-w-0 items-center justify-between gap-4 rounded-lg border border-[var(--app-nav-border)] bg-[var(--app-nav-bg)] px-5 py-3 shadow-md backdrop-blur-xl transition-all">
      <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2 no-underline hover:opacity-90">
        <div className="flex flex-col">
          <span className="nav-brand-title text-xl font-semibold tracking-tight text-[#061b31] dark:text-white">
            NextFlix
          </span>
          <span className="nav-brand-subtitle text-[10px] font-medium uppercase tracking-widest text-[#64748d] dark:text-white/70">
            Cinematic Explorer
          </span>
        </div>
      </Link>
      
      <form
        onSubmit={handleSubmit}
        className="flex min-w-0 flex-1 max-w-md items-center gap-2 relative"
      >
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
          <Input
            type="text"
            name="q"
            value={query}
            maxLength={SEARCH_QUERY_MAX}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search movies, shows, or people..."
            className="w-full bg-white/50 pl-9 dark:bg-black/20 border-[#e5edf5] dark:border-white/10 focus-visible:ring-[#533afd] rounded-md transition-shadow"
          />
        </div>
        <Button type="submit" className="bg-[#533afd] text-white hover:bg-[#4434d4] shrink-0 font-medium tracking-tight rounded-md">
          Search
        </Button>
      </form>
    </nav>
  );
}
