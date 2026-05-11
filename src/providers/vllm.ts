/**
 * debuga-llm-gateway — vLLM Provider
 *
 * Local vLLM provider. Connects to a vLLM instance running
 * on the same network or machine.
 *
 * vLLM natively exposes an OpenAI-compatible API, so this
 * provider follows the same pattern as the cloud provider.
 */

import { BaseProvider } from "./base.js";
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ModelsResponse,
  ProviderConfig,
} from "../types.js";

export class VllmProvider extends BaseProvider {
  constructor(config: ProviderConfig) {
    super(config);
  }

  async chatCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ ...request, stream: false }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(
        `vLLM provider error: HTTP ${response.status} — ${errorBody}`
      );
    }

    return (await response.json()) as ChatCompletionResponse;
  }

  async chatCompletionStream(
    request: ChatCompletionRequest
  ): Promise<ReadableStream<Uint8Array> | NodeJS.ReadableStream> {
    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ ...request, stream: true }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(
        `vLLM provider stream error: HTTP ${response.status} — ${errorBody}`
      );
    }

    if (!response.body) {
      throw new Error("vLLM provider returned no stream body");
    }

    return response.body;
  }

  async listModels(): Promise<ModelsResponse> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/models`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`vLLM provider models error: HTTP ${response.status}`);
    }

    return (await response.json()) as ModelsResponse;
  }

  /**
   * vLLM-specific health check using the /health endpoint.
   */
  async checkHealth() {
    const start = Date.now();
    try {
      // vLLM exposes a dedicated /health endpoint at the root
      const healthUrl = this.baseUrl.replace(/\/v1\/?$/, "/health");
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(healthUrl, {
        signal: controller.signal,
      });

      clearTimeout(timeout);

      return {
        name: this.name as const,
        healthy: response.ok,
        latencyMs: Date.now() - start,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        name: this.name as const,
        healthy: false,
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
