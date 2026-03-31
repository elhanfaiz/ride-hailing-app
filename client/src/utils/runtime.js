const PRODUCTION_API_URL = "https://ride-hailing-app-5at1.onrender.com/api";
const PRODUCTION_FRONTEND_ORIGIN = "https://ride-hailing-app-client.vercel.app";
const localhostOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;
const vercelPreviewOriginPattern = /^https:\/\/(?:[a-z0-9-]+\.)*vercel\.app$/i;

const trimTrailingSlashes = (value) => value.replace(/\/+$/, "");

export const resolveApiBaseUrl = ({ env = {}, origin } = {}) => {
  const configuredApiUrl = env.VITE_API_URL?.trim();

  if (configuredApiUrl) {
    return trimTrailingSlashes(configuredApiUrl);
  }

  const normalizedOrigin = origin ? trimTrailingSlashes(origin) : "";

  if (
    normalizedOrigin === PRODUCTION_FRONTEND_ORIGIN ||
    vercelPreviewOriginPattern.test(normalizedOrigin)
  ) {
    return PRODUCTION_API_URL;
  }

  if (localhostOriginPattern.test(normalizedOrigin)) {
    return `${normalizedOrigin}/api`;
  }

  return PRODUCTION_API_URL;
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

  const normalizedOrigin = origin ? trimTrailingSlashes(origin) : "";

  if (
    normalizedOrigin === PRODUCTION_FRONTEND_ORIGIN ||
    vercelPreviewOriginPattern.test(normalizedOrigin)
  ) {
    return PRODUCTION_API_URL.replace(/\/api$/, "");
  }

  if (localhostOriginPattern.test(normalizedOrigin)) {
    return normalizedOrigin;
  }

  return PRODUCTION_API_URL.replace(/\/api$/, "");
};
