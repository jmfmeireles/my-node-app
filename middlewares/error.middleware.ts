import type { Request, Response } from "express";
import { ValidationError } from "sequelize";

interface AppError extends Error {
  status?: number;
  details?: unknown;
}

export const errorMiddleware = (
  err: AppError,
  req: Request,
  res: Response,
) => {
  console.error(err.stack);

  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: {
        message: "Validation error",
        details: err.errors.map((e) => e.message),
      },
    });
  }

  // Handle generic 404 errors
  if (err.status === 404) {
    return res.status(404).json({
      error: {
        message: "Resource not found",
        details: err.message || null,
      },
    });
  }

  // Default to 500 Server Error for unhandled errors
  res.status(err.status || 500).json({
    error: {
      message: err.message || "Internal Server Error",
      details: err.details || null,
    },
  });
};
