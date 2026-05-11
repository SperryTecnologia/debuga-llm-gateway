/**
 * debuga-llm-gateway — Router
 *
 * Express router with OpenAI-compatible endpoints:
 * - GET  /health
 * - GET  /v1/models
 * - POST /v1/chat/completions
 */

import { Router } from "express";
import type { Request, Response } from "express";
import { config } from "./config.js";
import { CloudProvider } from "./providers/cloud.js";
import { VllmProvider } from "./providers/vllm.js";
import { FallbackRouter } from "./providers/fallback.js";
import { buildHealthResponse } from "./utils/health.js";
import { setupSSEHeaders, pipeStream } from "./utils/stream.js";
import type { ChatCompletionRequest } from "./types.js";

// Initialize providers
const cloudProvider = new CloudProvider(config.cloud);
const localProvider = new VllmProvider(config.local);

const fallbackRouter = new FallbackRouter(
  cloudProvider,
  localProvider,
  config.preferredProvider,
  config.enableLocalInference
);

// Collect active providers for health checks
const activeProviders = [cloudProvider];
if (config.enableLocalInference) {
  activeProviders.push(localProvider);
}

export const router = Router();

/**
 * GET /health — Gateway and provider health status
 */
router.get("/health", async (_req: Request, res: Response) => {
  try {
    const health = await buildHealthResponse(
      activeProviders,
      config.preferredProvider
    );
    const statusCode = health.status === "error" ? 503 : 200;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(500).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /v1/models — List available models
 */
router.get("/v1/models", async (_req: Request, res: Response) => {
  try {
    const models = await fallbackRouter.listModels();
    res.json(models);
  } catch (error) {
    res.status(502).json({
      error: {
        message: `Failed to list models: ${
          error instanceof Error ? error.message : "Unknown"
        }`,
        type: "server_error",
        code: "provider_error",
      },
    });
  }
});

/**
 * POST /v1/chat/completions — Chat completion (streaming and non-streaming)
 */
router.post(
  "/v1/chat/completions",
  async (req: Request, res: Response) => {
    const body = req.body as ChatCompletionRequest;

    // Basic validation
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      res.status(400).json({
        error: {
          message: "messages is required and must be a non-empty array",
          type: "invalid_request_error",
          code: "invalid_messages",
        },
      });
      return;
    }

    try {
      // Streaming
      if (body.stream) {
        setupSSEHeaders(res);

        const { stream, provider } = await fallbackRouter.chatCompletionStream(body);
        res.setHeader("X-Provider", provider);

        await pipeStream(stream, res);
        return;
      }

      // Non-streaming
      const { response, provider } = await fallbackRouter.chatCompletion(body);
      res.setHeader("X-Provider", provider);
      res.json(response);
    } catch (error) {
      // Don't send error if headers already sent (streaming)
      if (res.headersSent) {
        res.end();
        return;
      }

      res.status(502).json({
        error: {
          message: `Chat completion failed: ${
            error instanceof Error ? error.message : "Unknown"
          }`,
          type: "server_error",
          code: "provider_error",
        },
      });
    }
  }
);
