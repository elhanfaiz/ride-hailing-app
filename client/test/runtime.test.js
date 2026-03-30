import test from "node:test";
import assert from "node:assert/strict";
import { resolveApiBaseUrl, resolveSocketUrl } from "../src/utils/runtime.js";

test("resolveApiBaseUrl prefers VITE_API_URL", () => {
  const result = resolveApiBaseUrl({
    env: {
      VITE_API_URL: "http://localhost:5001/api/",
    },
    origin: "http://localhost:5173",
  });

  assert.equal(result, "http://localhost:5001/api");
});

test("resolveApiBaseUrl falls back to current origin", () => {
  const result = resolveApiBaseUrl({
    env: {},
    origin: "http://localhost:5173",
  });

  assert.equal(result, "http://localhost:5173/api");
});

test("resolveSocketUrl prefers explicit socket env", () => {
  const result = resolveSocketUrl({
    env: {
      VITE_SOCKET_URL: "http://localhost:5002/",
      VITE_API_URL: "http://localhost:5001/api",
    },
    apiBaseUrl: "http://localhost:5001/api",
    origin: "http://localhost:5173",
  });

  assert.equal(result, "http://localhost:5002");
});

test("resolveSocketUrl derives from API base URL", () => {
  const result = resolveSocketUrl({
    env: {},
    apiBaseUrl: "http://localhost:5001/api",
    origin: "http://localhost:5173",
  });

  assert.equal(result, "http://localhost:5001");
});

test("resolveSocketUrl falls back to current origin for relative API base URL", () => {
  const result = resolveSocketUrl({
    env: {},
    apiBaseUrl: "/api",
    origin: "http://localhost:5176",
  });

  assert.equal(result, "http://localhost:5176");
});

