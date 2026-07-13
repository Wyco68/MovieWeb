# next-movies

A modern, production-grade web application for discovering movies, TV shows, and actors. Built with the Next.js App Router, powered by The Movie Database (TMDb) API, and deployed to Cloudflare Workers with Upstash Redis rate limiting.

🔗 **Live:** [nextmovies.wyco-dev.com](https://nextmovies.wyco-dev.com)

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
- **Framework**: Next.js 15 (App Router, Server Components)
- **Library**: React 19
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React · **Components**: Radix UI, CVA
- **Data**: TMDb API (token stays server-side)
- **Rate limiting & cache**: Upstash Redis, `@upstash/ratelimit` (sliding window)
- **Hosting**: Cloudflare Workers via [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare)

## Architecture

```
Browser
  ├─ Server pages (/, /movie/[id], …)  →  lib/tmdb.js  →  TMDB API (token server-side)
  └─ Client fetches (infinite scroll, search)  →  /api/tmdb  →  TMDB API
                                                    ↑
                                              middleware.js (UA check, IP ban,
                                              rate limit) + Upstash Redis cache
```

- **`GET /api/tmdb`** — proxy with allow-listed keys, input validation, rate limits, and Redis response cache. Keeps `TMDB_TOKEN` off the client.
- **`middleware.js`** — guards routes: empty/scraper User-Agent → 403, banned IP → 403, sliding-window rate limit on `/api/*` and `/search`.

## Local Development

1. Clone and install:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in the values (see [Environment Variables](#environment-variables)).
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000).

To exercise the **actual Cloudflare Workers runtime** locally (recommended before deploying),
copy your secrets into `.dev.vars` and run:
```bash
npm run preview   # opennextjs-cloudflare build && preview (workerd)
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TMDB_TOKEN` | Yes | TMDb API Read Access Token (v4). Server-side only. |
| `UPSTASH_REDIS_REST_URL` | Production | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Production | Upstash Redis REST token |
| `NEXT_PUBLIC_SITE_URL` | Production | Canonical URL for metadata/OG (inlined at build) |
| `UPSTASH_RATELIMIT_ANALYTICS` | No | `true` to enable Upstash analytics (extra Redis commands) |

Create a free Redis database at [console.upstash.com](https://console.upstash.com/redis) → **REST API** tab → copy URL and token. Full reference: [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md). Without Upstash credentials the app still runs using a per-isolate in-memory rate-limit fallback (not globally consistent).

## Commands

- `npm run dev` — development server
- `npm run build` — Next.js production build
- `npm run preview` — build + run on the Workers runtime locally (`workerd`)
- `npm run deploy` — build + deploy to Cloudflare Workers
- `npm run lint` — ESLint
- `npm run cf-typegen` — generate Cloudflare binding types
- `node scripts/validate-rate-limit.mjs` — rate-limit tests using local fallback (0 Redis commands)
- `node --env-file=.env scripts/test-redis-connection.mjs` — Upstash ping/read/write (~4 commands)

## Deployment (Cloudflare Workers)

Deploys via the OpenNext adapter — the full app (SSR, `/api/tmdb`, middleware) runs on Workers.

**Manual:**
```bash
npm run deploy
```

**Automatic (GitHub → Workers Builds):** connect the repo once in the Cloudflare dashboard
(Workers & Pages → your Worker → Settings → Builds), set the production branch to `main`, add the
build variables/secrets, and every push to `main` builds and deploys.

One-time setup (KV cache namespace, secrets, custom domain, GitHub connection) and troubleshooting
are documented in **[docs/CLOUDFLARE.md](docs/CLOUDFLARE.md)**.

## Security

- **API key protection** — `TMDB_TOKEN` stays server-side; the browser only calls `/api/tmdb`.
- **Rate limiting** — `/api/tmdb` and `/search` only: 120 API calls/min, 40 search/min per IP (sliding window via Upstash). Normal page browsing is not rate-limited.
- **Abuse protection** — repeated violations → 24h IP ban; scraper User-Agents blocked on page routes; empty/short UA blocked everywhere.
- **Client IP** — client `X-Forwarded-For` is never trusted; the unspoofable `CF-Connecting-IP` header (set by Cloudflare) is used for limiting and bans.
- **Input validation** — allow-listed proxy keys, sanitized search/discover params, page clamp (1–5).
- **CSP + security headers** — defined in `next.config.mjs`, applied through OpenNext.
- **No local database/auth** — no user data collected or stored.

## Troubleshooting

| Symptom | Fix |
|---|---|
| 500 on data pages | `TMDB_TOKEN` secret missing/typo — `wrangler secret list` |
| `KV namespace ... not valid` | Create the KV namespace and paste its real id into `wrangler.jsonc` (see docs/CLOUDFLARE.md) |
| Rate limiting never triggers locally | Expected — `CF-Connecting-IP` only exists behind Cloudflare, not in `next dev` |
| Preview differs from prod | Use `npm run preview` (real `workerd`), not `npm run dev` |
