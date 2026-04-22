const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p";

const TMDB_IMAGE_VARIANTS = {
  poster: {
    sm: "w185",
    md: "w342",
    lg: "w500",
    xl: "w780",
  },
  backdrop: {
    sm: "w300",
    md: "w780",
    lg: "w1280",
    xl: "original",
  },
  profile: {
    sm: "w185",
    md: "h632",
    lg: "w780",
    xl: "original",
  },
};

function getConfiguredSize(availableSizes, preferredSize) {
  if (!Array.isArray(availableSizes) || !availableSizes.length) {
    return preferredSize;
  }

  if (preferredSize && availableSizes.includes(preferredSize)) {
    return preferredSize;
  }

  return availableSizes[availableSizes.length - 1];
}

export function getConfiguredImageUrl(
  path,
  { config, type = "poster", variant = "md", size } = {},
) {
  if (!path) {
    return null;
  }

  const resolvedType = TMDB_IMAGE_VARIANTS[type] ? type : "poster";
  const defaultSize = TMDB_IMAGE_VARIANTS[resolvedType][variant] || "w342";
  const preferredSize = size || defaultSize;

  const sizeCollection =
    resolvedType === "backdrop"
      ? config?.backdrop_sizes
      : resolvedType === "profile"
        ? config?.profile_sizes
        : config?.poster_sizes;

  const resolvedSize = getConfiguredSize(sizeCollection, preferredSize);
  const baseUrl = config?.secure_base_url || `${TMDB_IMAGE_URL}/`;

  return `${baseUrl}${resolvedSize}${path}`;
}

export function getImageUrl(path, size = "w342") {
  if (!path) {
    return null;
  }

  return `${TMDB_IMAGE_URL}/${size}${path}`;
}
