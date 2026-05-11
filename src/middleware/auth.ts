/**
 * debuga-llm-gateway — Auth Middleware
 *
 * Simple API key authentication for the gateway.
 * This is a lab/skeleton implementation — not enterprise-grade security.
 *
 * Clients must include: Authorization: Bearer <GATEWAY_API_KEY>
 */

import type { Request, Response, NextFunction } from "express";
import { config } from "../config.js";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip auth for health check
  if (req.path === "/health") {
    next();
    return;
  }

  // If no API key is configured, skip auth (open mode)
  if (!config.gatewayApiKey) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      error: {
        message: "Missing Authorization header",
        type: "authentication_error",
        code: "missing_api_key",
      },
    });
    return;
  }

  const token = authHeader.replace(/^Bearer\s+/i, "");

  if (token !== config.gatewayApiKey) {
    res.status(401).json({
      error: {
        message: "Invalid API key",
        type: "authentication_error",
        code: "invalid_api_key",
      },
    });
    return;
  }

  next();
}
