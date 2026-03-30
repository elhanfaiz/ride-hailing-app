import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
    },
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
    amount: { type: Number, required: true },
    currency: { type: String, default: "usd" },
    provider: {
      type: String,
      enum: ["mock", "stripe", "cash"],
      default: "mock",
    },
    status: {
      type: String,
      enum: ["created", "paid", "failed", "refunded"],
      default: "created",
    },
    transactionId: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Payment = mongoose.model("Payment", paymentSchema);

