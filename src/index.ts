/**
 * debuga-llm-gateway
 *
 * Gateway OpenAI-compatible para roteamento cloud/local
 * com fallback automático.
 *
 * Community skeleton da stack LLM do debuga.ai.
 * https://github.com/SperryTecnologia/debuga-llm-gateway
 */

import express from "express";
import { config } from "./config.js";
import { router } from "./router.js";
import { authMiddleware } from "./middleware/auth.js";
import { loggingMiddleware } from "./middleware/logging.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(loggingMiddleware);
app.use(authMiddleware);

// Routes
app.use(router);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log("");
  console.log("============================================================");
  console.log("  debuga-llm-gateway");
  console.log("============================================================");
  console.log("");
  console.log(`  Port:               ${config.port}`);
  console.log(`  Preferred provider: ${config.preferredProvider}`);
  console.log(`  Local inference:    ${config.enableLocalInference}`);
  console.log(`  Cloud URL:          ${config.cloud.baseUrl}`);
  console.log(`  vLLM URL:           ${config.local.baseUrl}`);
  console.log(`  Auth:               ${config.gatewayApiKey ? "enabled" : "disabled (open)"}`);
  console.log(`  Timeout:            ${config.requestTimeoutMs}ms`);
  console.log("");
  console.log(`  Health:  http://localhost:${config.port}/health`);
  console.log(`  Models:  http://localhost:${config.port}/v1/models`);
  console.log(`  Chat:    http://localhost:${config.port}/v1/chat/completions`);
  console.log("");
  console.log("============================================================");
  console.log("");
});

export default app;
