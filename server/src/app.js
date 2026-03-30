import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";
import rideRoutes from "./routes/rideRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

const localhostOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) {
    return true;
  }

  return localhostOriginPattern.test(origin);
};

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

export const createApp = () => {
  const app = express();

  app.use((req, res, next) => {
    res.header("Vary", "Origin");
    next();
  });
  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));
  app.use(express.json());
  app.use(morgan("dev"));

  app.get("/api/health", (_req, res) => {
    res.json({
      success: true,
      message: "Uber Clone API is healthy",
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/rides", rideRoutes);
  app.use("/api/drivers", driverRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/admin", adminRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
