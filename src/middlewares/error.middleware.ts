/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from "express";
import HttpStatusCode from "../core/utils/httpResponse";

const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(HttpStatusCode.HTTP_NOT_FOUND);
  next(error);
};

const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode =
    res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode); // Set status code if not already set

  res.json({
    success: false,
    message: err instanceof Error ? err.message : "Internal Server Error", // Default message if err.message is missing
    stack:
      process.env.NODE_ENV === "production"
        ? null
        : err instanceof Error
        ? err.stack
        : null, // Hide stack trace in production
  });

  return;
};

export { notFound, errorHandler };
