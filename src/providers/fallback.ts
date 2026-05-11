/**
 * debuga-llm-gateway — Fallback Router
 *
 * Implements provider selection and fallback logic:
 * - cloud: always use cloud provider
 * - local: always use vLLM local provider
 * - auto: try local first, fallback to cloud on failure
 */

import type { BaseProvider } from "./base.js";
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  PreferredProvider,
} from "../types.js";

export class FallbackRouter {
  private cloudProvider: BaseProvider;
  private localProvider: BaseProvider;
  private preferredProvider: PreferredProvider;
  private enableLocal: boolean;

  constructor(
    cloudProvider: BaseProvider,
    localProvider: BaseProvider,
    preferredProvider: PreferredProvider,
    enableLocal: boolean
  ) {
    this.cloudProvider = cloudProvider;
    this.localProvider = localProvider;
    this.preferredProvider = preferredProvider;
    this.enableLocal = enableLocal;
  }

  /**
   * Get the primary provider based on configuration.
   */
  getPrimaryProvider(): BaseProvider {
    if (this.preferredProvider === "local" && this.enableLocal) {
      return this.localProvider;
    }
    return this.cloudProvider;
  }

  /**
   * Get the fallback provider (opposite of primary).
   */
  getFallbackProvider(): BaseProvider | null {
    if (this.preferredProvider !== "auto") return null;
    if (!this.enableLocal) return null;
    // In auto mode, primary is local, fallback is cloud
    return this.cloudProvider;
  }

  /**
   * Execute a chat completion with fallback logic.
   */
  async chatCompletion(
    request: ChatCompletionRequest
  ): Promise<{ response: ChatCompletionResponse; provider: string }> {
    const primary = this.getPrimaryProvider();
    const fallback = this.getFallbackProvider();

    try {
      const response = await primary.chatCompletion(request);
      return { response, provider: primary.name };
    } catch (primaryError) {
      if (!fallback) {
        throw primaryError;
      }

      console.warn(
        `[Fallback] Primary provider "${primary.name}" failed: ${
          primaryError instanceof Error ? primaryError.message : "Unknown"
        }. Trying fallback "${fallback.name}"...`
      );

      try {
        const response = await fallback.chatCompletion(request);
        return { response, provider: fallback.name };
      } catch (fallbackError) {
        throw new Error(
          `All providers failed. Primary (${primary.name}): ${
            primaryError instanceof Error ? primaryError.message : "Unknown"
          }. Fallback (${fallback.name}): ${
            fallbackError instanceof Error
              ? fallbackError.message
              : "Unknown"
          }.`
        );
      }
    }
  }

  /**
   * Execute a streaming chat completion with fallback logic.
   */
  async chatCompletionStream(
    request: ChatCompletionRequest
  ): Promise<{
    stream: ReadableStream<Uint8Array> | NodeJS.ReadableStream;
    provider: string;
  }> {
    const primary = this.getPrimaryProvider();
    const fallback = this.getFallbackProvider();

    try {
      const stream = await primary.chatCompletionStream(request);
      return { stream, provider: primary.name };
    } catch (primaryError) {
      if (!fallback) {
        throw primaryError;
      }

      console.warn(
        `[Fallback] Primary provider "${primary.name}" stream failed. Trying fallback "${fallback.name}"...`
      );

      try {
        const stream = await fallback.chatCompletionStream(request);
        return { stream, provider: fallback.name };
      } catch (fallbackError) {
        throw new Error(
          `All providers failed for streaming. Primary (${primary.name}), Fallback (${fallback.name}).`
        );
      }
    }
  }

  /**
   * List models from the primary provider.
   */
  async listModels() {
    const primary = this.getPrimaryProvider();
    return primary.listModels();
  }
}
