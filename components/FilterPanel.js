"use client";

import { useState } from "react";
import { SEARCH_QUERY_MAX } from "@/lib/search-params";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";

export default function FilterPanel({ q, mediaType, genre, year, language, rating, genreMap }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-6 rounded-lg border border-[var(--app-panel-border)] bg-white dark:bg-[#1c1e54] shadow-sm">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer sm:cursor-default"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 text-[#061b31] dark:text-white font-medium">
          <SlidersHorizontal className="w-4 h-4 text-[#533afd]" />
          <span>Filters & Sort</span>
        </div>
        <Button variant="ghost" size="sm" className="sm:hidden h-8 w-8 p-0" aria-label="Toggle filters">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>
      
      <div className={`px-4 pb-4 pt-0 sm:block ${isOpen ? 'block' : 'hidden'}`}>
        <div className="h-px w-full bg-[var(--app-panel-border)] mb-4 sm:hidden" />
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
          <input type="hidden" name="q" defaultValue={q} maxLength={SEARCH_QUERY_MAX} />

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#64748d] dark:text-white/60 ml-1">Type</label>
            <select
              name="type"
              defaultValue={mediaType}
              className="h-10 w-full rounded-md border border-[#e5edf5] dark:border-white/10 bg-white dark:bg-[#0d253d] px-3 text-sm focus:border-[#533afd] focus:ring-1 focus:ring-[#533afd] outline-none transition-shadow"
            >
              <option value="all">All Types</option>
              <option value="movie">Movies</option>
              <option value="tv">TV Shows</option>
              <option value="person">People</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#64748d] dark:text-white/60 ml-1">Genre</label>
            <select
              name="genre"
              defaultValue={genre}
              className="h-10 w-full rounded-md border border-[#e5edf5] dark:border-white/10 bg-white dark:bg-[#0d253d] px-3 text-sm focus:border-[#533afd] focus:ring-1 focus:ring-[#533afd] outline-none transition-shadow"
            >
              <option value="">All Genres</option>
              {Array.from(genreMap.entries()).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#64748d] dark:text-white/60 ml-1">Year</label>
            <Input
              name="year"
              defaultValue={year}
              placeholder="e.g. 2023"
              inputMode="numeric"
              maxLength={4}
              pattern="(19|20)\d{2}"
              title="Enter a 4-digit year between 1900 and 2099"
              className="h-10 bg-white dark:bg-[#0d253d] border-[#e5edf5] dark:border-white/10"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#64748d] dark:text-white/60 ml-1">Language</label>
            <Input
              name="language"
              defaultValue={language}
              placeholder="e.g. en"
              maxLength={5}
              pattern="[a-z]{2}(-[A-Z]{2})?"
              title="Use a language code like en or en-US"
              className="h-10 bg-white dark:bg-[#0d253d] border-[#e5edf5] dark:border-white/10"
            />
          </div>

          <div className="flex gap-3 sm:col-span-2 lg:col-span-1">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#64748d] dark:text-white/60 ml-1">Min Rating</label>
              <Input
                name="rating"
                defaultValue={rating}
                placeholder="0-10"
                inputMode="decimal"
                maxLength={4}
                pattern="(10(\.0)?|[0-9](\.\d)?)"
                title="Enter a rating between 0 and 10"
                className="h-10 bg-white dark:bg-[#0d253d] border-[#e5edf5] dark:border-white/10"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                className="h-10 bg-[#533afd] hover:bg-[#4434d4] text-white px-6 w-full sm:w-auto font-medium"
              >
                Apply
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
