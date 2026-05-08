/**
 * Client-side helper for /api/tmdb.
 * All TMDB data flows through /api/tmdb — token stays server-side.
 */

export function buildTmdbUrl({ key, page = 1, ...rest } = {}) {
  const params = new URLSearchParams();
  params.set("key", key);
  params.set("page", String(page));

  for (const [k, v] of Object.entries(rest)) {
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      params.set(k, String(v));
    }
  }

  return `/api/tmdb?${params.toString()}`;
}

const inFlight = new Map();

export async function fetchTmdb(options = {}) {
  const { signal, ...rest } = options;
  const url = buildTmdbUrl(rest);

  if (signal) {
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
  }

  if (inFlight.has(url)) return inFlight.get(url);

  const promise = fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      return res.json();
    })
    .finally(() => inFlight.delete(url));

  inFlight.set(url, promise);
  return promise;
}
