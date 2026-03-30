import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/User.js";
import { Driver } from "../models/Driver.js";
import { Ride } from "../models/Ride.js";
import { Payment } from "../models/Payment.js";

export const getAdminDashboard = asyncHandler(async (_req, res) => {
  const [users, drivers, rides, payments, latestRides] = await Promise.all([
    User.countDocuments({ role: "user" }),
    Driver.countDocuments(),
    Ride.countDocuments(),
    Payment.find(),
    Ride.find()
      .populate("rider", "fullName")
      .populate("driver", "fullName")
      .sort({ createdAt: -1 })
      .limit(10),
  ]);

  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

  res.json({
    success: true,
    data: {
      metrics: {
        users,
        drivers,
        rides,
        totalRevenue: Number(totalRevenue.toFixed(2)),
      },
      latestRides,
    },
  });
});

export const getUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ success: true, data: users });
});

export const getDrivers = asyncHandler(async (_req, res) => {
  const drivers = await Driver.find().sort({ createdAt: -1 });
  res.json({ success: true, data: drivers });
});

export const getAllRides = asyncHandler(async (_req, res) => {
  const rides = await Ride.find()
    .populate("rider", "fullName email")
    .populate("driver", "fullName email vehicle")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: rides });
});
