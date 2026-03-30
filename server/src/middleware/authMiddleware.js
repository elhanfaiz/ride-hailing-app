import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/User.js";
import { Driver } from "../models/Driver.js";

const resolveModel = (role) => (role === "driver" ? Driver : User);

export const protect = (allowedRoles = []) => async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const Model = resolveModel(decoded.role);
    const account = await Model.findById(decoded.id);

    if (!account) {
      return next(new ApiError(StatusCodes.UNAUTHORIZED, "Account no longer exists"));
    }

    req.user = {
      id: account._id.toString(),
      role: decoded.role,
      profile: account,
    };

    if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
      return next(new ApiError(StatusCodes.FORBIDDEN, "Access denied"));
    }

    next();
  } catch (_error) {
    next(new ApiError(StatusCodes.UNAUTHORIZED, "Invalid or expired token"));
  }
};

