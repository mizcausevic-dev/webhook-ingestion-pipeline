import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  const error = new Error(`Route ${req.method} ${req.originalUrl} was not found.`) as Error & {
    statusCode?: number;
  };
  error.statusCode = 404;
  next(error);
}

export function errorHandler(
  error: Error & { statusCode?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: "ValidationError",
      message: "Request validation failed.",
      details: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }))
    });
  }

  return res.status(error.statusCode || 500).json({
    error: error.name || "ApplicationError",
    message: error.message || "An unexpected error occurred."
  });
}
