/**
 * debuga-llm-gateway — Logging Middleware
 *
 * Simple request logging for development and debugging.
 */

import type { Request, Response, NextFunction } from "express";

export function loggingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();
  const { method, path } = req;

  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const timestamp = new Date().toISOString();

    console.log(
      `[${timestamp}] ${method} ${path} → ${status} (${duration}ms)`
    );
  });

  next();
}
