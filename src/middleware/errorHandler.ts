/**
 * debuga-llm-gateway — Error Handler Middleware
 *
 * Catches unhandled errors and returns OpenAI-compatible error responses.
 */

import type { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(`[Error] ${err.message}`);

  const statusCode = (err as any).statusCode || 500;
  const errorType =
    statusCode >= 500 ? "server_error" : "invalid_request_error";

  res.status(statusCode).json({
    error: {
      message: err.message || "Internal server error",
      type: errorType,
      code: statusCode >= 500 ? "internal_error" : "bad_request",
    },
  });
}
