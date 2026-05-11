/**
 * debuga-llm-gateway — Health Utilities
 *
 * Aggregates health status from all configured providers.
 */

import type { BaseProvider } from "../providers/base.js";
import type { HealthResponse, PreferredProvider, ProviderHealthStatus } from "../types.js";

const startTime = Date.now();
const VERSION = "0.1.0";

/**
 * Build a health response by checking all providers.
 */
export async function buildHealthResponse(
  providers: BaseProvider[],
  preferredProvider: PreferredProvider
): Promise<HealthResponse> {
  const checks: ProviderHealthStatus[] = await Promise.all(
    providers.map((p) => p.checkHealth())
  );

  const allHealthy = checks.every((c) => c.healthy);
  const anyHealthy = checks.some((c) => c.healthy);

  let status: "ok" | "degraded" | "error";
  if (allHealthy) {
    status = "ok";
  } else if (anyHealthy) {
    status = "degraded";
  } else {
    status = "error";
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    gateway: {
      version: VERSION,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      preferredProvider,
    },
    providers: checks,
  };
}
