import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";

// KV-backed incremental cache so Next.js `fetch(..., { next: { revalidate } })`
// results persist across requests/isolates on the Workers free tier, keeping
// TMDB API calls low. Backed by the NEXT_INC_CACHE_KV binding in wrangler.jsonc.
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
});
