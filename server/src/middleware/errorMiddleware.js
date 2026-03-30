import { StatusCodes } from "http-status-codes";

export const notFound = (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
};

export const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;

  res.status(statusCode).json({
    success: false,
    message: error.message || "Something went wrong",
    details: error.details || null,
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
  });
};

