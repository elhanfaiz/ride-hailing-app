import { Router } from "express";
import { body } from "express-validator";
import {
  createPayment,
  getPaymentsForUser,
} from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";

const router = Router();

router.use(protect(["user"]));

router.post(
  "/",
  [body("rideId").notEmpty(), body("provider").optional().isIn(["mock", "stripe", "cash"])],
  validate,
  createPayment
);

router.get("/", getPaymentsForUser);

export default router;

