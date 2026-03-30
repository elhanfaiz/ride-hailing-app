import { Driver } from "../models/Driver.js";
import { Ride } from "../models/Ride.js";
import { getSocketServer } from "../config/socket.js";
import { calculateDistanceKm, estimateDurationMinutes } from "../utils/geo.js";

const onlineDrivers = new Map();

export const registerSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on("driver:join", async ({ driverId }) => {
      if (!driverId) return;
      onlineDrivers.set(driverId, socket.id);
      await Driver.findByIdAndUpdate(driverId, { lastSocketId: socket.id });
      socket.join(`driver:${driverId}`);
      console.log(`[Socket.IO] Driver joined room driver:${driverId}`);
    });

    socket.on("user:join", ({ userId }) => {
      if (!userId) return;
      socket.join(`user:${userId}`);
      console.log(`[Socket.IO] User joined room user:${userId}`);
    });

    socket.on("ride:subscribe", ({ rideId }) => {
      if (!rideId) return;
      socket.join(`ride:${rideId}`);
      console.log(`[Socket.IO] Socket ${socket.id} subscribed to ride:${rideId}`);
    });

    socket.on("driver:location", async ({ driverId, rideId, location }) => {
      if (!driverId || !location) return;

      await Driver.findByIdAndUpdate(driverId, { currentLocation: location });
      io.to("dashboard:admins").emit("admin:driver-location", { driverId, location });

      if (rideId) {
        const ride = await Ride.findByIdAndUpdate(
          rideId,
          {
          $push: {
            tracking: {
              lat: location.lat,
              lng: location.lng,
              timestamp: new Date(),
            },
          },
          },
          { new: true }
        );

        const destination = ride?.status === "in_progress" ? ride?.dropoff : ride?.pickup;
        const etaMinutes = destination
          ? estimateDurationMinutes(
              calculateDistanceKm(
                { lat: Number(location.lat), lng: Number(location.lng) },
                { lat: Number(destination.lat), lng: Number(destination.lng) }
              )
            )
          : null;

        const payload = {
          driverId,
          rideId,
          location,
          etaMinutes,
        };

        if (ride?.rider) {
          io.to(`user:${ride.rider.toString()}`).emit("ride:driver-location", payload);
        }

        io.to(`driver:${driverId}`).emit("ride:driver-location", payload);
      }
    });

    socket.on("admin:join", () => {
      socket.join("dashboard:admins");
      console.log(`[Socket.IO] Admin socket ${socket.id} joined dashboard:admins`);
    });

    socket.on("disconnect", async () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
      const driverEntry = [...onlineDrivers.entries()].find(
        ([, socketId]) => socketId === socket.id
      );

      if (driverEntry) {
        const [driverId] = driverEntry;
        onlineDrivers.delete(driverId);
        await Driver.findByIdAndUpdate(driverId, { lastSocketId: null });
      }
    });
  });
};

export const emitRideUpdate = (ride, eventName = "ride:updated") => {
  const io = getSocketServer();
  if (!io) return;

  if (ride.rider) {
    io.to(`user:${ride.rider.toString()}`).emit(eventName, ride);
  }

  if (ride.driver) {
    io.to(`driver:${ride.driver.toString()}`).emit(eventName, ride);
  }

  io.to(`ride:${ride._id.toString()}`).emit(eventName, ride);
  io.to("dashboard:admins").emit("admin:ride-updated", ride);
};

export const getOnlineDriverSocket = (driverId) => onlineDrivers.get(driverId);
