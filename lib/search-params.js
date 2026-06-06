export const SEARCH_QUERY_MIN = 2;
export const SEARCH_QUERY_MAX = 50;
export const TMDB_PAGE_MAX = 5;

const MEDIA_TYPES = ["all", "movie", "tv", "person"];

const ALLOWED_SORT_BY = new Set([
  "popularity.asc",
  "popularity.desc",
  "release_date.asc",
  "release_date.desc",
  "primary_release_date.asc",
  "primary_release_date.desc",
  "vote_average.asc",
  "vote_average.desc",
  "vote_count.asc",
  "vote_count.desc",
  "first_air_date.asc",
  "first_air_date.desc",
]);

export function clampPage(raw) {
  const parsed = Number.parseInt(String(raw || "1"), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  if (parsed > TMDB_PAGE_MAX) return TMDB_PAGE_MAX;
  return parsed;
}

export function isValidGenreList(value) {
  const v = String(value || "").trim();
  if (!v) return true;
  return /^\d{1,8}(,\d{1,8})*$/.test(v);
}

export function isValidSortBy(value) {
  const v = String(value || "").trim();
  if (!v) return false;
  return ALLOWED_SORT_BY.has(v);
}

export function isValidId(value) {
  return /^\d{1,8}$/.test(String(value || "").trim());
}

export function isValidLanguage(value) {
  const lang = String(value || "").trim();
  if (!lang) return true;
  return /^[a-z]{2}(-[A-Z]{2})?$/.test(lang);
}

export function isValidYear(value) {
  const y = String(value || "").trim();
  if (!y) return true;
  return /^(19|20)\d{2}$/.test(y);
}

export function isValidMediaType(value) {
  return MEDIA_TYPES.includes(value);
}

export function sanitizeSearchQuery(raw) {
  const q = String(raw ?? "").trim();
  if (q.length < SEARCH_QUERY_MIN || q.length > SEARCH_QUERY_MAX) return "";
  return q;
}

export function sanitizeRating(raw) {
  const value = String(raw ?? "").trim();
  if (!value) return "";
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 10) return "";
  return String(parsed);
}

export function sanitizeSearchPageParams(raw = {}) {
  const q = sanitizeSearchQuery(raw.q);
  const mediaType = isValidMediaType(raw.type) ? raw.type : "all";

  const genreRaw = String(raw.genre ?? "").trim();
  const genre = isValidId(genreRaw) ? genreRaw : "";

  const yearRaw = String(raw.year ?? "").trim();
  const year = yearRaw && isValidYear(yearRaw) ? yearRaw : "";

  const languageRaw = String(raw.language ?? "").trim();
  const language = languageRaw && isValidLanguage(languageRaw) ? languageRaw : "";

  const rating = sanitizeRating(raw.rating);

  return { q, mediaType, genre, year, language, rating };
}

export function parseRatingNumber(rating) {
  const sanitized = sanitizeRating(rating);
  if (!sanitized) return undefined;
  return Number(sanitized);
}

export function sanitizeDiscoverParams(raw = {}) {
  const media = raw.media === "tv" ? "tv" : "movie";

  const genreRaw = String(raw.with_genres ?? raw.genre ?? "").trim();
  const with_genres = isValidGenreList(genreRaw) ? genreRaw : "";

  const languageRaw = String(raw.with_original_language ?? raw.language ?? "").trim();
  const with_original_language =
    languageRaw && isValidLanguage(languageRaw) ? languageRaw : "";

  const yearRaw = String(raw.year ?? "").trim();
  const year = yearRaw && isValidYear(yearRaw) ? yearRaw : "";

  const rating = sanitizeRating(raw["vote_average.gte"] ?? raw.rating ?? "");

  const sortRaw = String(raw.sort_by ?? "popularity.desc").trim();
  const sort_by = isValidSortBy(sortRaw) ? sortRaw : "popularity.desc";

  return { media, with_genres, with_original_language, year, rating, sort_by };
}
