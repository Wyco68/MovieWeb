export const SEARCH_QUERY_MIN = 2;
export const SEARCH_QUERY_MAX = 50;

const MEDIA_TYPES = ["all", "movie", "tv", "person"];

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
