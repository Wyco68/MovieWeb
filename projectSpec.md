# 1. Overview
- **Purpose**: A comprehensive directory for discovering movies, TV shows, and industry professionals.
- **Target users**: Movie and TV enthusiasts looking for information, trailers, and streaming sources.
- **System scope**: A read-only, statically-exported frontend consuming data from the external TMDb API, with a single secured edge proxy and Redis-backed abuse protection.

# 2. Architecture
- **Frontend structure**: Next.js App Router exported as a **fully static site** (`output: "export"`). `app/` handles routing (`/`, `/movie`, `/tv`, `/person`, `/search`, `/discover`, `/genres`, `/people`); every page is a Client Component that fetches its data on mount. `components/` contains reusable UI (cards, carousels, drawers, filters).
- **Backend (Supabase + DB)**: None. No local database or Supabase.
- **API layer**: Single Cloudflare **Pages Function** `GET /api/tmdb` (`functions/api/tmdb.js`) — whitelisted-key TMDB proxy with validation, rate limiting, and optional Redis caching. Reads config from `context.env`.
- **Guards**: There is no Next.js middleware. Bot/empty-UA rejection (403), IP-ban checks, and rate limiting all run inside the `/api/tmdb` function.
- **Infrastructure**: Cloudflare Pages (static assets + Pages Functions). **No Workers KV.** Upstash Redis (optional, external REST) provides globally consistent rate limiting.
- **Data flow**:
  - All pages are Client Components; dynamic detail routes read their id from the URL (see `lib/route-params.js`) because the site is served as static placeholder shells via `public/_redirects`.
  - Every TMDB call goes through `/api/tmdb` via `lib/api.js`, so `TMDB_TOKEN` never reaches the browser.
  - In-flight client requests are deduplicated in `lib/api.js`.

# 3. Features (DETAILED)
- **Home Dashboard**:
  - Description: Landing page showing curated lists (Popular, Trending, Top Rated).
  - User flow: User lands on `/` and scrolls horizontally through categorized media rows.
  - Edge cases: API failure gracefully falls back to empty states or error boundaries.
  - Constraints enforced: Server-side fetch caching and retry logic.

- **Media Details (Movie/TV)**:
  - Description: Dedicated pages (`/movie/[id]`, `/tv/[id]`) showing synopsis, cast, trailers, and watch sources.
  - User flow: User clicks a media card → navigates to details → can play trailer or view seasons (for TV).
  - Edge cases: Missing posters or incomplete API data handled with fallbacks.

- **Search & Discovery**:
  - Description: Text search and category/genre browsing with server-side filters.
  - User flow: User enters query → navigated to `/search` results. Alternatively browses `/discover` or `/genres/[id]`.
  - Edge cases: Empty search results show "No results found" UI.
  - Constraints enforced: Query length (2–50 chars), validated type/year/genre/rating params, pagination clamped to TMDB's 1–500 ceiling on the proxy, search rate limit 40 req/min per IP.

# 4. Authentication & Authorization
- **Auth methods**: None implemented.
- **Session handling**: None. LocalStorage is used only for UI preferences (theme).
- **RLS explanation**: Not applicable — no database.

# 5. Database Design
- **Tables**: None.
- **Redis (Upstash)**: Ephemeral keys only — rate-limit counters, abuse counters, IP bans, and optional TMDB list response cache (300s TTL). No persistent user data.
- **Important code**: rate limiting, IP bans, and the list cache are implemented inline in `functions/api/tmdb.js` (env-injected). Pure request validation lives in `lib/search-params.js`.

# 6. Realtime System
- **What updates in realtime**: Nothing. Data is cached at the edge.
- **How it's implemented**:
  - No ISR / no Node server — the site is a static export.
  - HTTP `Cache-Control: s-maxage=600, stale-while-revalidate=86400` on `/api/tmdb` responses, absorbed by Cloudflare's edge cache (no KV).
  - Optional Redis cache for static list endpoints (300s TTL) when Upstash is configured.

# 7. Security Model
- **RLS policies**: Not applicable.
- **Validation layers**:
  - `lib/search-params.js` — ID, language, year, media type, search query, rating sanitization.
  - `functions/api/tmdb.js` — whitelisted `key` parameter, page clamp, per-key param validation.
  - Client-side parsing handles missing API fields gracefully.
- **Rate limiting** (Upstash Redis, sliding window; per IP via `ratelimit:tmdb:{ip}`):
  - General TMDB proxy: **120 req/min per IP**.
  - Search: **40 req/min per IP**.
  - Fallback: **30 req/min in-memory** per key when Redis is unavailable.
  - Abuse: **15 violations/hour** → **24h IP ban** (`ban:ip:{ip}`).
  - Violations logged as structured JSON to server logs.
- **Attack surface analysis**: Primary surface is `/api/tmdb`. Mitigated by parameter whitelist, rate limits, IP bans, empty-UA block, and strict CSP in `public/_headers`.

# 8. Performance Considerations
- **Query design**: Batched `Promise.all`/`Promise.allSettled` client fetches per page to avoid waterfalls.
- **Client-side optimization**: `next/image` bypassed (`unoptimized: true`); TMDb CDN used directly. In-flight request deduplication in `lib/api.js`.
- **Edge caching**: `/api/tmdb` responses are cached at the Cloudflare edge via `Cache-Control` (no KV), keeping TMDB call volume low.
- **Redis command budget**: ~3–5 Upstash commands per uncached `/api/tmdb` request (rate limit + optional cache). Free tier (500K commands/month) is sufficient for typical personal/small-site traffic.
- **Runtime**: `/api/tmdb` runs as a Cloudflare Pages Function; all page routes are static assets on the CDN.

# 9. Known Limitations
- Completely dependent on TMDb API uptime and rate limits.
- No user accounts (cannot save favorites or create watchlists).
- Images are unoptimized by Next.js, relying on TMDb CDN performance.
- Rate limiting and caching require Upstash env vars in production for global consistency; without them, a strict in-memory fallback applies per instance.

# 10. Future Improvements (REALISTIC ONLY)
- Implement a local database (e.g., Supabase) for user authentication, saved watchlists, and reviews.
- Enhance SEO with dynamic Open Graph image generation.
- Optional: enable `UPSTASH_RATELIMIT_ANALYTICS=true` for Upstash rate-limit dashboard metrics (uses extra Redis commands).
