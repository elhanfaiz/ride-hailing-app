const { defineConfig } = require("@playwright/test");

const frontendBaseUrl = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:4173";
const backendPort = process.env.E2E_BACKEND_PORT || "5050";
const apiBaseUrl = process.env.E2E_API_URL || `http://localhost:${backendPort}/api`;
const socketUrl = process.env.E2E_SOCKET_URL || apiBaseUrl.replace(/\/api$/, "");
const mongoUri =
  process.env.E2E_MONGODB_URI || "mongodb://127.0.0.1:27017/uber-clone-playwright";
const reuseExistingServer = process.env.PLAYWRIGHT_REUSE_EXISTING_SERVER === "true";
const frontendPort = new URL(frontendBaseUrl).port || "4173";

process.env.PLAYWRIGHT_BASE_URL = frontendBaseUrl;
process.env.E2E_BACKEND_PORT = backendPort;
process.env.E2E_API_URL = apiBaseUrl;
process.env.E2E_SOCKET_URL = socketUrl;
process.env.E2E_MONGODB_URI = mongoUri;

module.exports = defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  reporter: [["list"], ["html", { open: "never" }]],
  outputDir: "test-results",
  use: {
    baseURL: frontendBaseUrl,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 45_000,
  },
  webServer: [
    {
      command: "npm --workspace server run start",
      url: apiBaseUrl.replace(/\/api$/, "/api/health"),
      reuseExistingServer,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        PORT: backendPort,
        CLIENT_URL: frontendBaseUrl,
        JWT_SECRET: process.env.JWT_SECRET || "playwright-jwt-secret",
        MONGODB_URI: mongoUri,
      },
    },
    {
      command: `npm --workspace client run dev -- --host localhost --port ${frontendPort} --strictPort`,
      url: frontendBaseUrl,
      reuseExistingServer,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        VITE_API_URL: apiBaseUrl,
        VITE_SOCKET_URL: socketUrl,
        VITE_MAPBOX_ACCESS_TOKEN: process.env.VITE_MAPBOX_ACCESS_TOKEN || "",
      },
    },
  ],
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
      },
    },
  ],
});
