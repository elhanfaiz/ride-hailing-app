import Stripe from "stripe";
import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { Ride } from "../models/Ride.js";
import { Payment } from "../models/Payment.js";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export const createPayment = asyncHandler(async (req, res) => {
  const ride = await Ride.findById(req.body.rideId);

  if (!ride) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Ride not found");
  }

  const paymentPayload = {
    ride: ride._id,
    rider: ride.rider,
    driver: ride.driver,
    amount: ride.fare.total,
    currency: ride.fare.currency,
  };

  if (req.body.provider === "stripe" && stripe) {
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(ride.fare.total * 100),
      currency: ride.fare.currency,
      metadata: { rideId: ride._id.toString() },
    });

    const payment = await Payment.create({
      ...paymentPayload,
      provider: "stripe",
      transactionId: intent.id,
      status: "created",
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: { payment, clientSecret: intent.client_secret },
    });
  }

  const payment = await Payment.create({
    ...paymentPayload,
    provider: req.body.provider || "mock",
    transactionId: `mock_${Date.now()}`,
    status: "paid",
  });

  ride.paymentStatus = "paid";
  await ride.save();

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Payment captured successfully",
    data: payment,
  });
});

export const getPaymentsForUser = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ rider: req.user.id })
    .populate("ride")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: payments });
});

