import { Router } from "express";
import { body } from "express-validator";
import {
  getCurrentAccount,
  loginDriver,
  loginUser,
  registerDriver,
  registerUser,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";

const router = Router();

const userRegisterValidation = [
  body("fullName").notEmpty(),
  body("email").isEmail(),
  body("password").isLength({ min: 6 }),
  body("phone").notEmpty(),
];

const userLoginValidation = [
  body("email").isEmail(),
  body("password").notEmpty(),
];

router.post("/register", userRegisterValidation, validate, registerUser);
router.post("/login", userLoginValidation, validate, loginUser);

router.post(
  "/drivers/register",
  [
    body("fullName").notEmpty(),
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
    body("phone").notEmpty(),
    body("vehicle.make").notEmpty(),
    body("vehicle.model").notEmpty(),
    body("vehicle.color").notEmpty(),
    body("vehicle.plateNumber").notEmpty(),
  ],
  validate,
  registerDriver
);

router.post(
  "/drivers/login",
  [body("email").isEmail(), body("password").notEmpty()],
  validate,
  loginDriver
);

router.get("/me", protect(["user", "driver", "admin"]), getCurrentAccount);

export default router;
