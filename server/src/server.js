import http from "http";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { registerSocketHandlers } from "./services/socketService.js";
import { setSocketServer } from "./config/socket.js";

dotenv.config();

const PRODUCTION_CLIENT_ORIGIN = "https://ride-hailing-app-client.vercel.app";
const localhostOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;
const vercelPreviewOriginPattern = /^https:\/\/(?:[a-z0-9-]+\.)*vercel\.app$/i;

const normalizeOrigin = (value) => value?.trim().replace(/\/+$/, "");

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  const normalizedOrigin = normalizeOrigin(origin);

  if (
    normalizedOrigin === PRODUCTION_CLIENT_ORIGIN ||
    vercelPreviewOriginPattern.test(normalizedOrigin)
  ) {
    return true;
  }

  return localhostOriginPattern.test(normalizedOrigin);
};

const createSocketServer = (server) =>
  new Server(server, {
    cors: {
      origin(origin, callback) {
        if (isAllowedOrigin(origin)) {
          return callback(null, true);
        }

        return callback(new Error(`Socket.IO CORS blocked for origin: ${origin}`));
      },
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    },
  });

const listenWithPortFallback = (server, preferredPort, maxAttempts = 10) =>
  new Promise((resolve, reject) => {
    const startPort = Number(preferredPort) || 5000;

    const tryListen = (port, attemptsLeft) => {
      const onError = (error) => {
        server.off("listening", onListening);

        if (error.code === "EADDRINUSE" && attemptsLeft > 0) {
          const nextPort = port + 1;
          console.warn(
            `[Server] Port ${port} is already in use. Retrying on port ${nextPort}...`
          );
          setImmediate(() => tryListen(nextPort, attemptsLeft - 1));
          return;
        }

        reject(error);
      };

      const onListening = () => {
        server.off("error", onError);
        resolve(port);
      };

      server.once("error", onError);
      server.once("listening", onListening);
      server.listen(port);
    };

    tryListen(startPort, maxAttempts);
  });

const bootstrap = async () => {
  console.log("[Server] Starting backend bootstrap...");

  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);
  const io = createSocketServer(server);

  setSocketServer(io);
  registerSocketHandlers(io);
  console.log("[Socket.IO] Socket server initialized");

  const preferredPort = process.env.PORT || 5000;
  const activePort = await listenWithPortFallback(server, preferredPort);
  console.log(`Server running on port ${activePort}`);
};

bootstrap().catch((error) => {
  console.error("[Server] Failed to bootstrap server", {
    message: error.message,
    code: error.code,
    stack: error.stack,
  });
  process.exit(1);
});
