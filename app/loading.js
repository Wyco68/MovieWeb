export default function Loading() {
  return (
    <section className="loading-shell" aria-live="polite" aria-busy="true">
      <div className="w-full space-y-6">
        <div className="hero-skeleton" />

        <div className="space-y-6">
          <div className="row-skeleton">
            <div className="row-skeleton-title" />
            <div className="row-skeleton-track">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={`skeleton-row-a-${index}`} className="row-skeleton-card" />
              ))}
            </div>
          </div>

          <div className="row-skeleton">
            <div className="row-skeleton-title" />
            <div className="row-skeleton-track">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={`skeleton-row-b-${index}`} className="row-skeleton-card" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
