import axios from "axios";
import { resolveApiBaseUrl } from "../utils/runtime";

export const API_BASE_URL = resolveApiBaseUrl({
  env: import.meta.env,
  origin: typeof window !== "undefined" ? window.location.origin : undefined,
});

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("uber-clone-token");
  config.headers = config.headers ?? {};

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  console.log("[API request]", {
    method: config.method,
    url: `${config.baseURL}${config.url}`,
    params: config.params,
    data: config.data,
    hasToken: Boolean(token),
    apiBaseUrl: API_BASE_URL,
  });

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("[API error]", {
      method: error.config?.method,
      url: `${error.config?.baseURL || ""}${error.config?.url || ""}`,
      status: error.response?.status,
      data: error.response?.data,
    });

    return Promise.reject(error);
  }
);

export default api;
