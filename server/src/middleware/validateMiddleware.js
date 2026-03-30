import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "../utils/apiError.js";

export const validate = (req, _res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const details = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
      value: error.value,
      location: error.location,
    }));

    return next(
      new ApiError(
        StatusCodes.BAD_REQUEST,
        `Validation failed: ${details.map((error) => `${error.field} ${error.message}`).join(", ")}`,
        details
      )
    );
  }

  next();
};
