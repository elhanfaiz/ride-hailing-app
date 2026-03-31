import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";
import rideRoutes from "./routes/rideRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

export const createApp = () => {
  const app = express();

  // Allowed frontend URLs
  const allowedOrigins = [
    process.env.CLIENT_URL,
    "https://ride-hailing-app-client.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000"
  ];

  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  };

  app.use((req, res, next) => {
    res.header("Vary", "Origin");
    next();
  });

  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));

  app.use(express.json());
  app.use(morgan("dev"));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      success: true,
      message: "API is running",
      timestamp: new Date().toISOString(),
    });
  });

  // Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/rides", rideRoutes);
  app.use("/api/drivers", driverRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/admin", adminRoutes);

  // Error handlers
  app.use(notFound);
  app.use(errorHandler);

  return app;
};
