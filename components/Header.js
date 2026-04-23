"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

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
    if (pathname !== "/search") {
      return undefined;
    }

    const trimmed = query.trim();

    if (!trimmed || trimmed === lastPushedRef.current) {
      return undefined;
    }

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.set("q", trimmed);
      router.replace(`/search?${params.toString()}`);
      lastPushedRef.current = trimmed;
    }, 450);

    return () => {
      clearTimeout(timer);
    };
  }, [pathname, query, router, searchParams]);

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = query.trim();

    if (!trimmed) {
      router.push("/");
      return;
    }

    if (trimmed === lastPushedRef.current && pathname === "/search") {
      return;
    }

    const params = new URLSearchParams({ q: trimmed });
    router.push(`/search?${params.toString()}`);
    lastPushedRef.current = trimmed;
  }

  return (
    <nav className="app-nav mt-4 px-4 py-3 flex items-center justify-between gap-3">
      <Link href="/" className="no-underline hover:opacity-90 flex flex-col">
        <span className="nav-brand-title font-semibold text-[18px] tracking-[-0.26px]">
          NextFlix
        </span>
        <span className="nav-brand-subtitle text-[11px] uppercase tracking-[0.14em]">
          Cinematic Explorer
        </span>
      </Link>
      <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-[460px] items-center">
        <Input
          type="text"
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search movies, TV shows, people"
        />
        <Button type="submit" className="min-w-[104px] font-medium">
          Find
        </Button>
      </form>
    </nav>
  );
}
