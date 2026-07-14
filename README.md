# next-movies

A modern web app for discovering movies, TV shows, and actors. Built with the Next.js App Router and powered by The Movie Database (TMDb) API, shipped as a **fully static site** with a single edge function proxying TMDB.

## Core Features
- Browse popular, trending, and top-rated movies and TV shows
- Detailed pages for movies, TV series, and cast members
- Search with filters (type, genre, year, rating, language)
- Discover content by genre and curated sections
- In-app trailer playback and streaming/watch sources
- TV show season and episode guides
- Dark/Light mode toggle
- Fully responsive design

## Tech Stack
- **Framework**: Next.js 15 (App Router, static export — `output: "export"`)
- **Library**: React 19 (Client Components + client-side data fetching)
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React · **Components**: Radix UI, CVA
- **Data**: TMDb API (token stays server-side, inside the edge function)
- **Rate limiting** (optional): Upstash Redis, `@upstash/ratelimit` (sliding window)

## Architecture

```
Browser (static HTML/JS)
   │  every page is a Client Component that fetches on mount
   ▼
GET /api/tmdb   ──►  Edge function (functions/api/tmdb.js)
                       • holds TMDB_TOKEN (never sent to the browser)
                       • allow-listed keys + input validation
                       • bot / IP-ban / rate-limit guards (Upstash, optional)
                       • Cache-Control: s-maxage=600  → edge cache
                       ▼
                     TMDB API
```

Why this shape:

- **Static-first.** Pages ship as pre-rendered HTML and hydrate on the client. There is no
  Node server, no SSR, and no Incremental Static Regeneration.
- **One tiny function.** The only server-side code is the TMDB proxy. It exists solely so the
  API token never reaches the browser. Everything else is CDN-served static content.
- **Edge caching.** The proxy sets `Cache-Control: s-maxage=600, stale-while-revalidate=86400`,
  so the edge cache absorbs repeat requests and keeps TMDB call volume low.
- **Arbitrary detail routes.** `/movie/:id`, `/tv/:id`, `/person/:id`, `/genres/:id`, and the
  episode route accept any id. A static export can only pre-render one placeholder per dynamic
  route, so `public/_redirects` rewrites those paths to the placeholder shell and the Client
  Component reads the real id from the URL and fetches its data.

## Local Development

1. Clone and install:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your TMDb token (Upstash credentials are optional).
3. **UI-only dev** (fast refresh; the `/api/tmdb` function is *not* available, so data won't load):
   ```bash
   npm run dev
   ```
4. **Full-stack dev** (static build + the edge function, with data):
   ```bash
   npm run preview
   ```

## Commands

- `npm run dev` — Next.js dev server (UI only; no `/api/tmdb`)
- `npm run build` — static export to `out/`
- `npm run preview` — build + serve `out/` **with** functions locally
- `npm run lint` — ESLint
- `node --env-file=.env scripts/test-redis-connection.mjs` — Upstash connectivity check
- `node scripts/qa-audit.mjs <baseUrl>` — functional/security/perf audit against a running site

## Security

- **API key protection** — `TMDB_TOKEN` lives only in the edge function; the browser only calls `/api/tmdb`.
- **Rate limiting** — 120 API calls/min, 40 search/min per IP (sliding window via Upstash) inside the function.
- **Abuse protection** — repeated violations → 24h IP ban; empty/garbage User-Agents blocked.
- **Client IP** — client `X-Forwarded-For` is never trusted; the unspoofable `CF-Connecting-IP` header is used.
- **Input validation** — allow-listed proxy keys, sanitized search/discover params, page clamp.
- **CSP + security headers** — served from `public/_headers` at the edge.
- **No local database/auth** — no user data collected or stored.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Data doesn't load under `npm run dev` | Expected — `next dev` doesn't run the edge function. Use `npm run preview`. |
| 500 from `/api/tmdb` | `TMDB_TOKEN` not set in the environment. |
| Detail page shows "not found" | The id returned 404 from TMDB, or the `_redirects` rewrite is missing in `out/`. |
| Rate limiting never triggers locally | Expected — `CF-Connecting-IP` only exists behind the CDN. |
