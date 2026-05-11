/**
 * debuga-llm-gateway — Provider Tests
 *
 * Tests for cloud and vLLM providers.
 * Uses mocked fetch (no real API calls).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CloudProvider } from "../src/providers/cloud.js";
import { VllmProvider } from "../src/providers/vllm.js";
import type { ProviderConfig, ChatCompletionResponse } from "../src/types.js";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const MOCK_RESPONSE: ChatCompletionResponse = {
  id: "chatcmpl-test-123",
  object: "chat.completion",
  created: Date.now(),
  model: "test-model",
  choices: [
    {
      index: 0,
      message: { role: "assistant", content: "Hello! How can I help?" },
      finish_reason: "stop",
    },
  ],
  usage: {
    prompt_tokens: 10,
    completion_tokens: 8,
    total_tokens: 18,
  },
};

const cloudConfig: ProviderConfig = {
  name: "cloud",
  baseUrl: "http://mock-cloud:9000/v1",
  apiKey: "mock-cloud-key",
  timeoutMs: 5000,
};

const vllmConfig: ProviderConfig = {
  name: "local",
  baseUrl: "http://mock-vllm:8000/v1",
  timeoutMs: 5000,
};

beforeEach(() => {
  mockFetch.mockReset();
});

describe("CloudProvider", () => {
  const provider = new CloudProvider(cloudConfig);

  it("should send chat completion request to cloud", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_RESPONSE,
    });

    const result = await provider.chatCompletion({
      model: "test-model",
      messages: [{ role: "user", content: "Hello" }],
    });

    expect(result.id).toBe("chatcmpl-test-123");
    expect(result.choices[0].message.content).toBe("Hello! How can I help?");
    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock-cloud:9000/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer mock-cloud-key",
        }),
      })
    );
  });

  it("should throw on cloud provider error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    });

    await expect(
      provider.chatCompletion({
        model: "test-model",
        messages: [{ role: "user", content: "Hello" }],
      })
    ).rejects.toThrow("Cloud provider error: HTTP 500");
  });

  it("should include API key in headers", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ object: "list", data: [] }),
    });

    await provider.listModels();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer mock-cloud-key",
        }),
      })
    );
  });

  it("should check health via /models endpoint", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
    });

    const health = await provider.checkHealth();
    expect(health.name).toBe("cloud");
    expect(health.healthy).toBe(true);
    expect(health.latencyMs).toBeDefined();
  });

  it("should report unhealthy on connection error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Connection refused"));

    const health = await provider.checkHealth();
    expect(health.healthy).toBe(false);
    expect(health.error).toBe("Connection refused");
  });
});

describe("VllmProvider", () => {
  const provider = new VllmProvider(vllmConfig);

  it("should send chat completion request to vLLM", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_RESPONSE,
    });

    const result = await provider.chatCompletion({
      model: "Qwen/Qwen2.5-Coder-7B-Instruct-AWQ",
      messages: [{ role: "user", content: "Hello" }],
    });

    expect(result.choices[0].message.content).toBe("Hello! How can I help?");
    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock-vllm:8000/v1/chat/completions",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("should not include API key for local vLLM", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ object: "list", data: [] }),
    });

    await provider.listModels();

    const callHeaders = mockFetch.mock.calls[0][1].headers;
    expect(callHeaders.Authorization).toBeUndefined();
  });

  it("should check health via /health endpoint", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
    });

    const health = await provider.checkHealth();
    expect(health.name).toBe("local");
    expect(health.healthy).toBe(true);

    // Should call /health, not /v1/models
    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock-vllm:8000/health",
      expect.any(Object)
    );
  });
});
