import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { Ride } from "../models/Ride.js";
import { Driver } from "../models/Driver.js";
import { estimateFare } from "../utils/fare.js";
import { emitRideUpdate, getOnlineDriverSocket } from "../services/socketService.js";
import { getSocketServer } from "../config/socket.js";

const resolveEstimatePayload = (req) => ({
  pickup: req.body?.pickup || {
    address: req.query.pickupAddress,
    lat: Number(req.query.pickupLat),
    lng: Number(req.query.pickupLng),
  },
  dropoff: req.body?.dropoff || {
    address: req.query.dropoffAddress,
    lat: Number(req.query.dropoffLat),
    lng: Number(req.query.dropoffLng),
  },
});

const assignNearestDriver = async (ride) => {
  const drivers = await Driver.find({ isOnline: true, status: "idle" });
  if (!drivers.length) return null;

  const [nearestDriver] = drivers;
  ride.driver = nearestDriver._id;
  ride.status = "searching";
  ride.timeline.push({ label: "Ride offer sent to a nearby driver" });
  nearestDriver.status = "assigned";

  await Promise.all([ride.save(), nearestDriver.save()]);
  return nearestDriver;
};

export const getFareEstimate = asyncHandler(async (req, res) => {
  const { pickup, dropoff } = resolveEstimatePayload(req);

  console.log("[rides] fare estimate payload", { pickup, dropoff });

  if (
    !pickup?.address ||
    !dropoff?.address ||
    !Number.isFinite(Number(pickup?.lat)) ||
    !Number.isFinite(Number(pickup?.lng)) ||
    !Number.isFinite(Number(dropoff?.lat)) ||
    !Number.isFinite(Number(dropoff?.lng))
  ) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Pickup and dropoff must include address, lat, and lng."
    );
  }

  const fare = estimateFare(
    { ...pickup, lat: Number(pickup.lat), lng: Number(pickup.lng) },
    { ...dropoff, lat: Number(dropoff.lat), lng: Number(dropoff.lng) }
  );
  res.json({ success: true, data: fare });
});

export const createRide = asyncHandler(async (req, res) => {
  console.log("[rides] create payload", req.body);

  const fare = estimateFare(req.body.pickup, req.body.dropoff);

  const ride = await Ride.create({
    rider: req.user.id,
    pickup: req.body.pickup,
    dropoff: req.body.dropoff,
    fare,
    paymentMethod: req.body.paymentMethod || "cash",
    timeline: [{ label: "Ride requested by user" }],
  });

  const driver = await assignNearestDriver(ride);
  await ride.populate("rider", "fullName email phone");
  await ride.populate("driver", "fullName phone vehicle rating currentLocation");

  const io = getSocketServer();
  if (driver && io) {
    const driverSocketId = getOnlineDriverSocket(driver._id.toString());
    if (driverSocketId) {
      io.to(driverSocketId).emit("ride:new-request", ride);
    }
  }

  emitRideUpdate(ride, "ride:created");

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: driver
      ? "Ride created and driver assigned"
      : "Ride created. Waiting for nearby drivers.",
    data: ride,
  });
});

export const getUserRides = asyncHandler(async (req, res) => {
  const rides = await Ride.find({ rider: req.user.id })
    .populate("driver", "fullName phone vehicle rating currentLocation")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: rides });
});

export const getRideById = asyncHandler(async (req, res) => {
  const ride = await Ride.findById(req.params.rideId)
    .populate("rider", "fullName email phone")
    .populate("driver", "fullName phone vehicle rating currentLocation");

  if (!ride) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Ride not found");
  }

  res.json({ success: true, data: ride });
});

export const cancelRide = asyncHandler(async (req, res) => {
  const ride = await Ride.findById(req.params.rideId);

  if (!ride) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Ride not found");
  }

  if (ride.rider.toString() !== req.user.id) {
    throw new ApiError(StatusCodes.FORBIDDEN, "You can only cancel your own ride");
  }

  ride.status = "cancelled";
  ride.timeline.push({ label: "Ride cancelled by user" });
  await ride.save();

  if (ride.driver) {
    await Driver.findByIdAndUpdate(ride.driver, { status: "idle" });
  }

  await ride.populate("driver", "fullName phone vehicle rating currentLocation");
  emitRideUpdate(ride);

  res.json({ success: true, message: "Ride cancelled successfully", data: ride });
});
