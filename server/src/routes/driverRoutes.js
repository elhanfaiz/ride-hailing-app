import { Router } from "express";
import { body, query } from "express-validator";
import {
  getDriverDashboard,
  getDriverRides,
  getNearbyDrivers,
  respondToRide,
  updateDriverAvailability,
  updateDriverLocation,
  updateRideStatusByDriver,
} from "../controllers/driverController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";

const router = Router();

router.get(
  "/nearby",
  [query("lat").isFloat(), query("lng").isFloat()],
  validate,
  getNearbyDrivers
);

router.use(protect(["driver"]));

router.patch(
  "/availability",
  [body("isOnline").isBoolean()],
  validate,
  updateDriverAvailability
);

router.patch(
  "/location",
  [
    body("location.lat").isFloat(),
    body("location.lng").isFloat(),
    body("location.address").optional().isString(),
  ],
  validate,
  updateDriverLocation
);

router.get("/rides", getDriverRides);
router.get("/dashboard", getDriverDashboard);
router.patch(
  "/rides/:rideId/respond",
  [body("action").isIn(["accept", "reject"])],
  validate,
  respondToRide
);
router.patch(
  "/rides/:rideId/status",
  [body("status").isIn(["driver_arriving", "in_progress", "completed"])],
  validate,
  updateRideStatusByDriver
);

export default router;

