import { Router } from "express";
import { body, query } from "express-validator";
import {
  cancelRide,
  createRide,
  getFareEstimate,
  getRideById,
  getUserRides,
} from "../controllers/rideController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";

const router = Router();

router.post(
  "/estimate",
  [
    body("pickup.address").notEmpty(),
    body("pickup.lat").isFloat(),
    body("pickup.lng").isFloat(),
    body("dropoff.address").notEmpty(),
    body("dropoff.lat").isFloat(),
    body("dropoff.lng").isFloat(),
  ],
  validate,
  getFareEstimate
);

router.get(
  "/estimate",
  [
    query("pickupAddress").notEmpty(),
    query("pickupLat").isFloat(),
    query("pickupLng").isFloat(),
    query("dropoffAddress").notEmpty(),
    query("dropoffLat").isFloat(),
    query("dropoffLng").isFloat(),
  ],
  validate,
  getFareEstimate
);

router.use(protect(["user"]));

router.post(
  "/",
  [
    body("pickup.address").notEmpty(),
    body("pickup.lat").isFloat(),
    body("pickup.lng").isFloat(),
    body("dropoff.address").notEmpty(),
    body("dropoff.lat").isFloat(),
    body("dropoff.lng").isFloat(),
    body("paymentMethod").optional().isIn(["cash", "card", "stripe"]),
  ],
  validate,
  createRide
);

router.get("/", getUserRides);
router.get("/:rideId", getRideById);
router.patch("/:rideId/cancel", cancelRide);

export default router;
