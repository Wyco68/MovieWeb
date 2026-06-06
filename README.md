# next-movies

A modern, production-grade web application for discovering movies, TV shows, and actors. Built with Next.js App Router, powered by The Movie Database (TMDb) API, and protected with Upstash Redis rate limiting on Vercel Edge.

## Core Features
- Browse popular, trending, and top-rated movies and TV shows
- View detailed information for movies, TV series, and cast members
- Search with filters (type, genre, year, rating, language)
- Discover content by genre and curated sections
- Watch trailers directly within the application
- View available streaming/watch sources
- TV show season and episode guides
- Dark/Light mode theme toggle
- Fully responsive design

## Tech Stack
- **Framework**: Next.js 15 (App Router, Server Components, Edge Runtime)
- **Library**: React 19
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Components**: Radix UI, Class Variance Authority (CVA)
- **Data Source**: TMDb API
- **Rate limiting & cache**: Upstash Redis, @upstash/ratelimit (sliding window)

## Architecture

```
Browser
  ├─ Server pages (/, /movie/[id], …)  →  lib/tmdb.js  →  TMDB API (token server-side)
  └─ Client fetches (infinite scroll, search)  →  /api/tmdb  →  TMDB API
                                                    ↑
                                              middleware.js (IP ban, UA check)
                                              rate limit + Redis cache
```

- **`GET /api/tmdb`** — Edge proxy with whitelisted keys, input validation, rate limits, and optional Redis response cache.
- **`middleware.js`** — Guards all `/api/*` routes (empty User-Agent → 403, banned IP → 403).

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in the values (see below).
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TMDB_TOKEN` | Yes | TMDb API Read Access Token (v4) |
| `UPSTASH_REDIS_REST_URL` | Production | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Production | Upstash Redis REST token |
| `UPSTASH_RATELIMIT_ANALYTICS` | No | Set to `true` to enable Upstash rate-limit analytics (extra Redis commands) |

Create a free Redis database at [console.upstash.com](https://console.upstash.com/redis) → open your database → **REST API** tab → copy URL and token.

Without Upstash credentials the app still runs locally using a strict in-memory rate-limit fallback (not globally consistent across instances).

## Development Commands

- `npm run dev` — start the development server
- `npm run lint` — ESLint
- `npm run build` / `npm run start` — production build and server
- `node scripts/validate-rate-limit.mjs` — rate limit tests using local fallback (**0 Redis commands**)
- `node --env-file=.env scripts/validate-rate-limit.mjs --redis` — same tests against Upstash (~15–25 commands; use sparingly on free tier)
- `node --env-file=.env scripts/test-redis-connection.mjs` — Upstash ping/read/write (~4 commands)

## Deployment (Vercel)

1. Push to the Git remote **connected to Vercel** (this project uses both GitLab and GitHub — keep them in sync):
   ```bash
   git push gitlab main
   git push origin main
   ```
2. Set environment variables in Vercel → **Settings → Environment Variables**:
   - `TMDB_TOKEN` (required)
   - `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (recommended for production)
3. Confirm **Root Directory** is empty (repo root) and **Framework Preset** is Next.js.
4. Deploy and open the **Production** deployment URL from the Vercel dashboard (not an old preview link).

Alternatively, connect **Upstash Redis** from the Vercel Marketplace to inject Redis env vars automatically.

### Build warnings (usually safe to ignore)

| Warning | Meaning |
|---------|---------|
| `Using edge runtime on a page currently disables static generation` | Only applies to routes explicitly set to Edge; `/api/tmdb` now uses the default Node.js runtime. |
| `Node.js functions are compiled from ESM to CommonJS` | Normal Next.js behavior unless you add `"type": "module"` to `package.json` (not required). |

### If you see 404 on Vercel

1. **Check which Git remote Vercel deploys** — if you push only to GitLab but Vercel watches GitHub, production will be stale or missing files like `middleware.js`.
2. **Verify the deployment status is Ready** (not Error or Canceled) in Vercel → Deployments.
3. **Set `TMDB_TOKEN`** — missing token causes server errors on data pages, not always obvious in the UI.
4. **Test these URLs** on your production domain:
   - `/` — homepage
   - `/api/tmdb?key=popular_movies&page=1` — should return JSON

## Security

- **API key protection** — `TMDB_TOKEN` stays server-side; the browser only calls `/api/tmdb`.
- **Rate limiting** — middleware on `/api/tmdb` and `/search` only: 120 API calls/min, 40 search/min per IP; sliding window via Upstash Redis. Normal page browsing is not rate-limited.
- **Abuse protection** — repeated violations trigger a 24h IP ban; scraper User-Agents blocked on page routes; empty/short UA blocked everywhere.
- **IP trust** — client `X-Forwarded-For` is never trusted; Vercel uses `x-vercel-forwarded-for`. Set `TRUSTED_PROXY=true` only behind a sanitizing reverse proxy.
- **Input validation** — whitelisted proxy keys, sanitized search/discover params, page clamp (1–5).
- **CSP** — theme/scroll init in `/public/*.js`; `script-src` includes `'unsafe-inline'` because Next.js requires inline hydration scripts. Strict headers in `next.config.mjs`.
- **No local database/auth** — no user data collected or stored.

## Project Documentation

- `projectSpec.md` — detailed system specification
- `project-analysis.json` — structured project metadata for tooling/AI context
