export const dynamic = "force-dynamic";

/**
 * Liveness probe for Docker/nginx/uptime monitors.
 * Intentionally does NOT call TMDB or Redis: it answers "is the Node process
 * serving requests", not "are upstreams healthy" — upstream failures already
 * degrade gracefully in the app and must not restart the container.
 */
export async function GET() {
  return Response.json(
    { status: "ok", uptime: Math.round(process.uptime()) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
