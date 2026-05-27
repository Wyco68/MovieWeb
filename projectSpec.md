# 1. Overview
- **Purpose**: A comprehensive directory for discovering movies, TV shows, and industry professionals.
- **Target users**: Movie and TV enthusiasts looking for information, trailers, and streaming sources.
- **System scope**: A read-only frontend interface consuming data from the external TMDb API.

# 2. Architecture
- **Frontend structure**: Next.js App Router paradigm. `app/` directory handles routing (`/movie`, `/tv`, `/person`, `/search`, `/discover`). `components/` contains reusable UI elements (cards, carousels, drawers).
- **Backend (Supabase + DB)**: None. This application operates entirely without a local backend database or Supabase.
- **Data flow**: 
  - Server components fetch initial data directly from TMDb using `lib/tmdb.js` with the secure `TMDB_TOKEN`.
  - Client components needing dynamic data fetch from the local proxy endpoint `/api/tmdb` to avoid exposing the TMDb token.

# 3. Features (DETAILED)
- **Home Dashboard**:
  - Description: Landing page showing curated lists (Popular, Trending, Top Rated).
  - User flow: User lands on `/` and scrolls horizontally through categorized media rows.
  - Edge cases: API failure gracefully falls back to empty states or error boundaries.
  - Constraints enforced: Handled by server-side fetch caching and retry logic.

- **Media Details (Movie/TV)**:
  - Description: Dedicated pages (`/movie/[id]`, `/tv/[id]`) showing synopsis, cast, trailers, and watch sources.
  - User flow: User clicks a media card -> navigates to details -> can play trailer or view seasons (for TV).
  - Edge cases: Missing posters or incomplete API data handled with fallbacks.
  
- **Search & Discovery**:
  - Description: Text search and category/genre browsing.
  - User flow: User enters query -> navigated to `/search` results. Alternatively browses `/discover`.
  - Edge cases: Empty search results show "No results found" UI.
  - Constraints enforced: Pagination limits enforced by TMDb API maximums (typically 500 pages).

# 4. Authentication & Authorization
- **Auth methods**: None implemented.
- **Session handling**: None. LocalStorage is used only for UI preferences (theme).
- **RLS explanation**: Not applicable as there is no database.

# 5. Database Design
- **Tables**: None.
- **Relationships**: None.
- **Constraints**: None.
- **Triggers**: None.
- **Important functions**: None. Data is strictly derived from the third-party TMDb API.

# 6. Realtime System
- **What updates in realtime**: Nothing. Data is cached and revalidated based on Next.js fetch configuration (e.g., `revalidate: 600` for popular movies).
- **How it's implemented**: ISR (Incremental Static Regeneration) via Next.js `fetch` cache options.

# 7. Security Model
- **RLS policies**: Not applicable.
- **Validation layers**: Client-side data parsing gracefully handles missing API fields.
- **Attack surface analysis**: Minimal. The primary attack surface is the proxy `/api/tmdb`, which could be subject to rate-limiting or DDoS. The strict CSP headers in `next.config.mjs` prevent XSS attacks.

# 8. Performance Considerations
- **Query design**: Batched `Promise.allSettled` fetches on the server to prevent waterfall loading. 
- **Client-side optimization**: `next/image` is intentionally bypassed (`unoptimized: true`) but custom image loaders point to optimized TMDb CDNs. In-flight requests are deduplicated in `lib/tmdb.js`. 

# 9. Known Limitations
- Completely dependent on TMDb API uptime and rate limits.
- No user accounts (cannot save favorites or create watchlists).
- Images are unoptimized by Next.js, relying entirely on TMDb's CDN performance.

# 10. Future Improvements (REALISTIC ONLY)
- Implement a local database (e.g., Supabase) to enable user authentication, saved watchlists, and user reviews.
- Add Redis-based rate limiting to the `/api/tmdb` proxy to prevent abuse.
- Enhance SEO with dynamic Opengraph image generation.
