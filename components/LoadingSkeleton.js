export function LoadingCard({ layout = "grid" }) {
  const cardClass =
    layout === "row"
      ? "movie-card row-card p-1.5 text-center flex flex-col bg-white dark:bg-[#1c1e54] border border-[#e5edf5] dark:border-white/10"
      : "movie-card p-1.5 text-center flex flex-col bg-white dark:bg-[#1c1e54] border border-[#e5edf5] dark:border-white/10";

  return (
    <div className={cardClass} aria-hidden="true">
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[6px] bg-slate-200 dark:bg-slate-800 animate-pulse" />
      <div className="px-1 py-2 text-left">
        <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1" />
        <div className="h-2 w-1/2 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mt-2" />
      </div>
    </div>
  );
}

export default function LoadingSkeleton({ count = 12, layout = "grid" }) {
  const containerClass =
    layout === "row"
      ? "row-track"
      : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4";

  return (
    <div className={containerClass}>
      {Array.from({ length: count }).map((_, i) => (
        <LoadingCard key={i} layout={layout} />
      ))}
    </div>
  );
}
