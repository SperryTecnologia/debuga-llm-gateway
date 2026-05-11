/**
 * debuga-llm-gateway — Configuration
 *
 * Loads configuration from environment variables.
 * All values use safe defaults for local development.
 */

import dotenv from "dotenv";
import type { GatewayConfig, PreferredProvider } from "./types.js";

dotenv.config();

function getEnv(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

function getEnvInt(key: string, fallback: number): number {
  const val = process.env[key];
  if (!val) return fallback;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? fallback : parsed;
}

function getEnvBool(key: string, fallback: boolean): boolean {
  const val = process.env[key]?.toLowerCase();
  if (val === "true" || val === "1") return true;
  if (val === "false" || val === "0") return false;
  return fallback;
}

function getPreferredProvider(): PreferredProvider {
  const val = getEnv("PREFERRED_PROVIDER", "cloud").toLowerCase();
  if (val === "cloud" || val === "local" || val === "auto") return val;
  return "cloud";
}

export function loadConfig(): GatewayConfig {
  const timeoutMs = getEnvInt("REQUEST_TIMEOUT_MS", 60000);

  return {
    port: getEnvInt("PORT", 3100),
    preferredProvider: getPreferredProvider(),
    enableLocalInference: getEnvBool("ENABLE_LOCAL_INFERENCE", false),
    gatewayApiKey: getEnv("GATEWAY_API_KEY", ""),
    requestTimeoutMs: timeoutMs,
    cloud: {
      name: "cloud",
      baseUrl: getEnv("CLOUD_PROVIDER_URL", "http://localhost:9000/v1"),
      apiKey: getEnv("CLOUD_PROVIDER_API_KEY", ""),
      timeoutMs,
    },
    local: {
      name: "local",
      baseUrl: getEnv("VLLM_URL", "http://localhost:8000/v1"),
      timeoutMs,
    },
  };
}

export const config = loadConfig();
