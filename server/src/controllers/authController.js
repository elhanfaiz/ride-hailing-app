import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/User.js";
import { Driver } from "../models/Driver.js";
import { generateToken } from "../utils/generateToken.js";

const buildAuthResponse = (account, role) => ({
  token: generateToken({ id: account._id, role }),
  account: {
    ...account.toObject(),
    password: undefined,
  },
  role,
});

export const registerUser = asyncHandler(async (req, res) => {
  const normalizedEmail = req.body.email?.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new ApiError(StatusCodes.CONFLICT, "A user with this email already exists");
  }

  const user = await User.create({
    ...req.body,
    email: normalizedEmail,
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "User account created successfully",
    data: buildAuthResponse(user, user.role),
  });
});

export const loginUser = asyncHandler(async (req, res) => {
  const normalizedEmail = req.body.email?.trim().toLowerCase();
  console.log("[auth] user login attempt", { email: normalizedEmail });
  const user = await User.findOne({ email: normalizedEmail }).select("+password");

  if (!user || !(await user.comparePassword(req.body.password))) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
  }

  res.json({
    success: true,
    message: "User logged in successfully",
    data: buildAuthResponse(user, user.role),
  });
});

export const registerDriver = asyncHandler(async (req, res) => {
  const normalizedEmail = req.body.email?.trim().toLowerCase();
  const existingDriver = await Driver.findOne({ email: normalizedEmail });

  if (existingDriver) {
    throw new ApiError(StatusCodes.CONFLICT, "A driver with this email already exists");
  }

  const driver = await Driver.create({
    ...req.body,
    email: normalizedEmail,
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Driver account created successfully",
    data: buildAuthResponse(driver, "driver"),
  });
});

export const loginDriver = asyncHandler(async (req, res) => {
  const normalizedEmail = req.body.email?.trim().toLowerCase();
  console.log("[auth] driver login attempt", { email: normalizedEmail });
  const driver = await Driver.findOne({ email: normalizedEmail }).select("+password");

  if (!driver || !(await driver.comparePassword(req.body.password))) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
  }

  res.json({
    success: true,
    message: "Driver logged in successfully",
    data: buildAuthResponse(driver, "driver"),
  });
});

export const getCurrentAccount = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      role: req.user.role,
      profile: req.user.profile,
    },
  });
});
