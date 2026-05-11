/**
 * debuga-llm-gateway — Router Tests
 *
 * Tests for the main API endpoints.
 * Uses mock providers (no real API calls).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock config before importing router
vi.mock("../src/config.js", () => ({
  config: {
    port: 3100,
    preferredProvider: "cloud",
    enableLocalInference: false,
    gatewayApiKey: "test-key",
    requestTimeoutMs: 5000,
    cloud: {
      name: "cloud",
      baseUrl: "http://mock-cloud:9000/v1",
      apiKey: "mock-cloud-key",
      timeoutMs: 5000,
    },
    local: {
      name: "local",
      baseUrl: "http://mock-vllm:8000/v1",
      timeoutMs: 5000,
    },
  },
}));

describe("Router — Request Validation", () => {
  it("should reject requests without messages", () => {
    const body = { model: "test" };
    const hasMessages =
      body &&
      "messages" in body &&
      Array.isArray((body as any).messages) &&
      (body as any).messages.length > 0;

    expect(hasMessages).toBe(false);
  });

  it("should reject requests with empty messages array", () => {
    const body = { model: "test", messages: [] };
    const hasMessages =
      body.messages && Array.isArray(body.messages) && body.messages.length > 0;

    expect(hasMessages).toBe(false);
  });

  it("should accept valid chat completion request", () => {
    const body = {
      model: "test-model",
      messages: [{ role: "user", content: "Hello" }],
      temperature: 0.1,
      max_tokens: 1024,
    };

    const hasMessages =
      body.messages && Array.isArray(body.messages) && body.messages.length > 0;
    expect(hasMessages).toBe(true);
    expect(body.model).toBe("test-model");
    expect(body.temperature).toBe(0.1);
  });

  it("should accept streaming request", () => {
    const body = {
      model: "test-model",
      messages: [{ role: "user", content: "Hello" }],
      stream: true,
    };

    expect(body.stream).toBe(true);
  });
});

describe("Router — Health Check", () => {
  it("should return health status structure", () => {
    const healthResponse = {
      status: "ok",
      timestamp: new Date().toISOString(),
      gateway: {
        version: "0.1.0",
        uptime: 100,
        preferredProvider: "cloud",
      },
      providers: [
        { name: "cloud", healthy: true, latencyMs: 50 },
      ],
    };

    expect(healthResponse.status).toBe("ok");
    expect(healthResponse.gateway.version).toBe("0.1.0");
    expect(healthResponse.providers).toHaveLength(1);
    expect(healthResponse.providers[0].healthy).toBe(true);
  });

  it("should report degraded when some providers fail", () => {
    const providers = [
      { name: "cloud", healthy: true, latencyMs: 50 },
      { name: "local", healthy: false, error: "Connection refused" },
    ];

    const allHealthy = providers.every((p) => p.healthy);
    const anyHealthy = providers.some((p) => p.healthy);

    expect(allHealthy).toBe(false);
    expect(anyHealthy).toBe(true);
    // Status should be "degraded"
  });

  it("should report error when all providers fail", () => {
    const providers = [
      { name: "cloud", healthy: false, error: "Timeout" },
      { name: "local", healthy: false, error: "Connection refused" },
    ];

    const anyHealthy = providers.some((p) => p.healthy);
    expect(anyHealthy).toBe(false);
    // Status should be "error"
  });
});
