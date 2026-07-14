/**
 * Cloudflare Pages Function: liveness probe for uptime monitors.
 * Answers "is the edge function serving requests" — it does NOT call TMDB or
 * Redis, so it stays green even when an upstream is degraded.
 */
export function onRequestGet() {
  return Response.json(
    { status: "ok", timestamp: Date.now() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
