export const dynamic = "force-dynamic";

/**
 * Liveness probe for uptime monitors.
 * Intentionally does NOT call TMDB or Redis: it answers "is the Worker
 * serving requests", not "are upstreams healthy" — upstream failures already
 * degrade gracefully in the app.
 */
export async function GET() {
  return Response.json(
    { status: "ok", timestamp: Date.now() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
