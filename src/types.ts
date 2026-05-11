/**
 * debuga-llm-gateway — Type Definitions
 *
 * OpenAI-compatible types for the gateway skeleton.
 * These types mirror the OpenAI Chat Completions API format.
 */

// ---- Request Types ----

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
  stream?: boolean;
}

// ---- Response Types ----

export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finish_reason: "stop" | "length" | "content_filter" | null;
}

export interface ChatCompletionUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage: ChatCompletionUsage;
}

// ---- Streaming Types ----

export interface ChatCompletionChunkDelta {
  role?: "assistant";
  content?: string;
}

export interface ChatCompletionChunkChoice {
  index: number;
  delta: ChatCompletionChunkDelta;
  finish_reason: "stop" | "length" | "content_filter" | null;
}

export interface ChatCompletionChunk {
  id: string;
  object: "chat.completion.chunk";
  created: number;
  model: string;
  choices: ChatCompletionChunkChoice[];
}

// ---- Provider Types ----

export type ProviderName = "cloud" | "local";
export type PreferredProvider = "cloud" | "local" | "auto";

export interface ProviderConfig {
  name: ProviderName;
  baseUrl: string;
  apiKey?: string;
  timeoutMs: number;
}

export interface ProviderHealthStatus {
  name: ProviderName;
  healthy: boolean;
  latencyMs?: number;
  error?: string;
}

export interface ModelInfo {
  id: string;
  object: "model";
  created: number;
  owned_by: string;
}

export interface ModelsResponse {
  object: "list";
  data: ModelInfo[];
}

// ---- Gateway Types ----

export interface GatewayConfig {
  port: number;
  preferredProvider: PreferredProvider;
  enableLocalInference: boolean;
  gatewayApiKey: string;
  requestTimeoutMs: number;
  cloud: ProviderConfig;
  local: ProviderConfig;
}

export interface HealthResponse {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  gateway: {
    version: string;
    uptime: number;
    preferredProvider: PreferredProvider;
  };
  providers: ProviderHealthStatus[];
}
