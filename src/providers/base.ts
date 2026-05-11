/**
 * debuga-llm-gateway — Base Provider
 *
 * Abstract base class for LLM providers.
 * Providers implement the OpenAI-compatible interface.
 */

import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ModelsResponse,
  ProviderConfig,
  ProviderHealthStatus,
  ProviderName,
} from "../types.js";

export abstract class BaseProvider {
  readonly name: ProviderName;
  protected baseUrl: string;
  protected apiKey?: string;
  protected timeoutMs: number;

  constructor(config: ProviderConfig) {
    this.name = config.name;
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.apiKey = config.apiKey;
    this.timeoutMs = config.timeoutMs;
  }

  /**
   * Send a chat completion request to the provider.
   */
  abstract chatCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse>;

  /**
   * Send a streaming chat completion request.
   * Returns a ReadableStream of SSE chunks.
   */
  abstract chatCompletionStream(
    request: ChatCompletionRequest
  ): Promise<ReadableStream<Uint8Array> | NodeJS.ReadableStream>;

  /**
   * List available models from the provider.
   */
  abstract listModels(): Promise<ModelsResponse>;

  /**
   * Check if the provider is healthy and reachable.
   */
  async checkHealth(): Promise<ProviderHealthStatus> {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/models`, {
        signal: controller.signal,
        headers: this.getHeaders(),
      });

      clearTimeout(timeout);

      return {
        name: this.name,
        healthy: response.ok,
        latencyMs: Date.now() - start,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        name: this.name,
        healthy: false,
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Build request headers for the provider.
   */
  protected getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  /**
   * Make a fetch request with timeout.
   */
  protected async fetchWithTimeout(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeout);
    }
  }
}
