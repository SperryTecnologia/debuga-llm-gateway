/**
 * debuga-llm-gateway — Cloud Provider
 *
 * Generic cloud provider that forwards requests to any
 * OpenAI-compatible API endpoint.
 */

import { BaseProvider } from "./base.js";
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ModelsResponse,
  ProviderConfig,
} from "../types.js";

export class CloudProvider extends BaseProvider {
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
        `Cloud provider error: HTTP ${response.status} — ${errorBody}`
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
        `Cloud provider stream error: HTTP ${response.status} — ${errorBody}`
      );
    }

    if (!response.body) {
      throw new Error("Cloud provider returned no stream body");
    }

    return response.body;
  }

  async listModels(): Promise<ModelsResponse> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/models`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Cloud provider models error: HTTP ${response.status}`);
    }

    return (await response.json()) as ModelsResponse;
  }
}
