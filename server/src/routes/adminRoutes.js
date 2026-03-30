import { Router } from "express";
import {
  getAdminDashboard,
  getAllRides,
  getDrivers,
  getUsers,
} from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect(["admin"]));

router.get("/dashboard", getAdminDashboard);
router.get("/users", getUsers);
router.get("/drivers", getDrivers);
router.get("/rides", getAllRides);

export default router;

