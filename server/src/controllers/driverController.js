import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Driver } from "../models/Driver.js";
import { Ride } from "../models/Ride.js";
import { ApiError } from "../utils/apiError.js";
import { emitRideUpdate } from "../services/socketService.js";
import { calculateDistanceKm } from "../utils/geo.js";

export const updateDriverAvailability = asyncHandler(async (req, res) => {
  const driver = await Driver.findByIdAndUpdate(
    req.user.id,
    {
      isOnline: req.body.isOnline,
      status: "idle",
    },
    { new: true }
  );

  res.json({
    success: true,
    message: `Driver is now ${driver.isOnline ? "online" : "offline"}`,
    data: driver,
  });
});

export const updateDriverLocation = asyncHandler(async (req, res) => {
  const driver = await Driver.findByIdAndUpdate(
    req.user.id,
    { currentLocation: req.body.location },
    { new: true }
  );

  res.json({
    success: true,
    message: "Driver location updated",
    data: driver,
  });
});

export const getNearbyDrivers = asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;
  const parsedLat = Number(lat);
  const parsedLng = Number(lng);

  console.log("[drivers] nearby query", req.query);

  if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Valid lat and lng query parameters are required."
    );
  }

  const drivers = await Driver.find({ isOnline: true });
  const nearbyDrivers = drivers
    .map((driver) => ({
      ...driver.toObject(),
      distanceKm: calculateDistanceKm(
        { lat: parsedLat, lng: parsedLng },
        driver.currentLocation
      ),
    }))
    .filter((driver) => driver.distanceKm <= 8)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  res.json({ success: true, data: nearbyDrivers });
});

export const getDriverRides = asyncHandler(async (req, res) => {
  const rides = await Ride.find({ driver: req.user.id })
    .populate("rider", "fullName email phone")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: rides });
});

export const getDriverDashboard = asyncHandler(async (req, res) => {
  const [driver, rides] = await Promise.all([
    Driver.findById(req.user.id),
    Ride.find({ driver: req.user.id, status: "completed" }),
  ]);

  const totalTrips = rides.length;
  const earnings = rides.reduce((sum, ride) => sum + (ride.fare?.total || 0), 0);

  res.json({
    success: true,
    data: {
      driver,
      stats: {
        totalTrips,
        earnings: Number(earnings.toFixed(2)),
        rating: driver?.rating || 0,
      },
      recentRides: rides.slice(0, 5),
    },
  });
});

export const respondToRide = asyncHandler(async (req, res) => {
  const ride = await Ride.findById(req.params.rideId);

  if (!ride) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Ride not found");
  }

  if (req.body.action === "accept") {
    ride.driver = req.user.id;
    ride.status = "driver_assigned";
    ride.timeline.push({ label: "Driver accepted the ride" });
    await Driver.findByIdAndUpdate(req.user.id, {
      status: "assigned",
      isOnline: true,
    });
  } else {
    ride.status = "rejected";
    ride.timeline.push({ label: "Driver rejected the ride" });
  }

  await ride.save();
  await ride.populate("driver", "fullName phone vehicle rating currentLocation");
  emitRideUpdate(ride);

  res.json({
    success: true,
    message: `Ride ${req.body.action}ed successfully`,
    data: ride,
  });
});

export const updateRideStatusByDriver = asyncHandler(async (req, res) => {
  const ride = await Ride.findById(req.params.rideId);

  if (!ride) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Ride not found");
  }

  ride.status = req.body.status;
  ride.timeline.push({ label: `Ride status changed to ${req.body.status}` });

  if (req.body.status === "in_progress") {
    await Driver.findByIdAndUpdate(req.user.id, { status: "on_trip" });
  }

  if (req.body.status === "completed") {
    const driver = await Driver.findById(req.user.id);
    driver.status = "idle";
    driver.totalEarnings += ride.fare?.total || 0;
    await driver.save();
    ride.paymentStatus = ride.paymentMethod === "cash" ? "paid" : ride.paymentStatus;
  }

  await ride.save();
  await ride.populate("driver", "fullName phone vehicle rating currentLocation");
  emitRideUpdate(ride);

  res.json({ success: true, message: "Ride status updated", data: ride });
});
