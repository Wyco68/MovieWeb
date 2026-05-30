# 1. Overview
- **Purpose**: A comprehensive directory for discovering movies, TV shows, and industry professionals.
- **Target users**: Movie and TV enthusiasts looking for information, trailers, and streaming sources.
- **System scope**: A read-only frontend interface consuming data from the external TMDb API, with a secured Edge proxy and Redis-backed abuse protection.

# 2. Architecture
- **Frontend structure**: Next.js App Router. `app/` handles routing (`/`, `/movie`, `/tv`, `/person`, `/search`, `/discover`, `/genres`, `/people`). `components/` contains reusable UI (cards, carousels, drawers, filters).
- **Backend (Supabase + DB)**: None. No local database or Supabase.
- **API layer**: Single Edge route `GET /api/tmdb` (`app/api/tmdb/route.js`) — whitelisted-key TMDB proxy with validation, rate limiting, and Redis caching.
- **Middleware**: `middleware.js` runs on `/api/*` — rejects empty User-Agent (403), checks IP bans in Upstash Redis (403).
- **Infrastructure**: Designed for Vercel deployment. Upstash Redis provides globally consistent rate limiting across Edge instances.
- **Data flow**:
  - Server components fetch initial data directly from TMDb via `lib/tmdb.js` using `TMDB_TOKEN` (Next.js fetch cache, `revalidate: 600`).
  - Client components fetch through `/api/tmdb` via `lib/api.js` so the TMDB token never reaches the browser.
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
  - Constraints enforced: Query length (2–50 chars), validated type/year/genre/rating params, pagination clamped to pages 1–5 on the proxy, search rate limit 30 req/min per IP.

# 4. Authentication & Authorization
- **Auth methods**: None implemented.
- **Session handling**: None. LocalStorage is used only for UI preferences (theme).
- **RLS explanation**: Not applicable — no database.

# 5. Database Design
- **Tables**: None.
- **Redis (Upstash)**: Ephemeral keys only — rate-limit counters, abuse counters, IP bans, and optional TMDB list response cache (300s TTL). No persistent user data.
- **Important functions**: `lib/rate-limit.js` (`checkRateLimit`), `lib/tmdb-cache.js`, `lib/redis.js`.

# 6. Realtime System
- **What updates in realtime**: Nothing. Data is cached and revalidated.
- **How it's implemented**:
  - Next.js ISR via `fetch` revalidate (600s) on server components.
  - HTTP `Cache-Control: s-maxage=600` on `/api/tmdb` responses.
  - Redis cache for static list endpoints (300s TTL) when Upstash is configured.

# 7. Security Model
- **RLS policies**: Not applicable.
- **Validation layers**:
  - `lib/search-params.js` — ID, language, year, media type, search query, rating sanitization.
  - `app/api/tmdb/route.js` — whitelisted `key` parameter, page clamp, per-key param validation.
  - Client-side parsing handles missing API fields gracefully.
- **Rate limiting** (Upstash Redis, sliding window):
  - General TMDB proxy: **60 req/min per IP** (`ratelimit:tmdb-api:{ip}`).
  - Search: **30 req/min per IP** (`ratelimit:tmdb-search:{ip}`).
  - Fallback: **10 req/min in-memory** per key when Redis is unavailable.
  - Abuse: **15 violations/hour** → **24h IP ban** (`ban:ip:{ip}`).
  - Violations logged as structured JSON to server logs.
- **Attack surface analysis**: Primary surface is `/api/tmdb`. Mitigated by parameter whitelist, rate limits, IP bans, empty-UA block, and strict CSP in `next.config.mjs`.

# 8. Performance Considerations
- **Query design**: Batched `Promise.allSettled` fetches on the server to prevent waterfall loading.
- **Client-side optimization**: `next/image` bypassed (`unoptimized: true`); TMDb CDN used directly. In-flight request deduplication in `lib/api.js`.
- **Redis command budget**: ~3–5 Upstash commands per `/api/tmdb` request (rate limit + optional cache). Free tier (500K commands/month) sufficient for typical personal/small-site traffic.
- **Edge Runtime**: `/api/tmdb` and middleware run on Vercel Edge for low latency globally.

# 9. Known Limitations
- Completely dependent on TMDb API uptime and rate limits.
- No user accounts (cannot save favorites or create watchlists).
- Images are unoptimized by Next.js, relying on TMDb CDN performance.
- Rate limiting and caching require Upstash env vars in production for global consistency; without them, a strict in-memory fallback applies per instance.

# 10. Future Improvements (REALISTIC ONLY)
- Implement a local database (e.g., Supabase) for user authentication, saved watchlists, and reviews.
- Enhance SEO with dynamic Open Graph image generation.
- Optional: enable `UPSTASH_RATELIMIT_ANALYTICS=true` for Upstash rate-limit dashboard metrics (uses extra Redis commands).
