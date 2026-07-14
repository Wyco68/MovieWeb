/**
 * Client-side route param helpers.
 *
 * Dynamic detail routes are served as a single static "placeholder" shell via
 * Cloudflare `_redirects` rewrites (see public/_redirects), so the real id is
 * not available from the exported HTML — it must be read from the live URL in
 * the browser. These helpers parse `window.location.pathname` and return null
 * during server prerender (when there is no window).
 */

export function pathSegments() {
  if (typeof window === "undefined") return [];
  return window.location.pathname.split("/").filter(Boolean);
}

/** /movie/123 -> "123", /tv/123 -> "123", etc. (id is the 2nd segment). */
export function routeId() {
  return pathSegments()[1] ?? null;
}

/** /tv/123/season/2/episode/5 -> { tvId, seasonNumber, episodeNumber }. */
export function episodeParams() {
  const seg = pathSegments();
  return {
    tvId: seg[1] ?? null,
    seasonNumber: seg[3] ?? null,
    episodeNumber: seg[5] ?? null,
  };
}
