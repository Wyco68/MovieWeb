const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p";

const token = process.env.TMDB_TOKEN;

function getAuthHeaders() {
  if (!token) {
    throw new Error("Missing TMDB_TOKEN environment variable.");
  }

  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function tmdbFetch(endpoint, { params = {}, revalidate = 3600 } = {}) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  const url = `${TMDB_API_URL}${endpoint}${query ? `?${query}` : ""}`;

  const res = await fetch(url, {
    headers: getAuthHeaders(),
    next: { revalidate },
  });

  if (!res.ok) {
    throw new Error(`TMDB request failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export function getImageUrl(path, size = "w342") {
  if (!path) {
    return null;
  }

  return `${TMDB_IMAGE_URL}/${size}${path}`;
}