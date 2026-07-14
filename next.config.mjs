/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static HTML export — the whole site ships as static assets to Cloudflare
  // Pages. No Node server, no Workers KV, no incremental cache. TMDB data is
  // fetched client-side through the /api/tmdb Pages Function (see functions/).
  output: "export",

  reactStrictMode: true,

  images: {
    // Required for `output: "export"` — Cloudflare Pages serves images directly
    // from TMDB's CDN; no Next.js image optimization server runs.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],
  },

  // NOTE: security headers live in public/_headers, not in next.config's
  // headers(). A static export has no server to run headers() at request time,
  // so Cloudflare Pages applies them from the _headers file at the edge.
};

export default nextConfig;
