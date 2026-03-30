import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
  {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false }
);

const rideSchema = new mongoose.Schema(
  {
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },
    pickup: { type: locationSchema, required: true },
    dropoff: { type: locationSchema, required: true },
    status: {
      type: String,
      enum: [
        "searching",
        "driver_assigned",
        "driver_arriving",
        "in_progress",
        "completed",
        "cancelled",
        "rejected",
      ],
      default: "searching",
    },
    fare: {
      baseFare: Number,
      distanceKm: Number,
      durationMinutes: Number,
      surgeMultiplier: Number,
      total: Number,
      currency: String,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "stripe"],
      default: "cash",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    timeline: [
      {
        label: String,
        at: { type: Date, default: Date.now },
      },
    ],
    tracking: [
      {
        lat: Number,
        lng: Number,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const Ride = mongoose.model("Ride", rideSchema);

