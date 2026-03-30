const trimTrailingSlashes = (value) => value.replace(/\/+$/, "");

export const resolveApiBaseUrl = ({ env = {}, origin } = {}) => {
  const configuredApiUrl = env.VITE_API_URL?.trim();

  if (configuredApiUrl) {
    return trimTrailingSlashes(configuredApiUrl);
  }

  if (origin) {
    return `${trimTrailingSlashes(origin)}/api`;
  }

  return "/api";
};

export const resolveSocketUrl = ({ env = {}, apiBaseUrl, origin } = {}) => {
  const configuredSocketUrl = env.VITE_SOCKET_URL?.trim();

  if (configuredSocketUrl) {
    return trimTrailingSlashes(configuredSocketUrl);
  }

  const normalizedApiBaseUrl = apiBaseUrl || resolveApiBaseUrl({ env, origin });

  if (
    normalizedApiBaseUrl.startsWith("http://") ||
    normalizedApiBaseUrl.startsWith("https://")
  ) {
    return normalizedApiBaseUrl.replace(/\/api$/, "");
  }

  if (origin) {
    return trimTrailingSlashes(origin);
  }

  return "";
};

