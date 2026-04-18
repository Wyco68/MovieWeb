export default function Loading() {
  return (
    <section className="loading-shell" aria-live="polite" aria-busy="true">
      <div className="flex flex-col items-center">
        <div className="spinner" />
        <p className="loading-label">Loading movies...</p>
      </div>
    </section>
  );
}
