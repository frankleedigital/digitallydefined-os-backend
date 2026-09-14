/**
 * ai/types.ts
 * Strongly-typed contract for every AI interaction.
 *
 * All AI calls in DigitallyDefined OS pass through the AI gateway
 * (ai/gateway/client.ts) and are typed by the interfaces below. This is the
 * single place the shape of an AI request/response is defined.
 */

import type { JsonValue } from "../lib/types.ts";

/** Providers the gateway may route to. */
export type AiProviderId = "omniroute" | "gemini-direct";

/** Quality tier — drives model selection (see ai/gateway/router.ts). */
export type AiQuality = "high" | "medium" | "low";

/** A single message in a chat conversation. */
export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Options every AI call accepts. */
export interface AiOptions {
  /** Explicit model override (else router picks via env + quality). */
  model?: string;
  /** System prompt override (else a component/pipeline default). */
  systemPrompt?: string;
  /** Force the provider to respond in JSON object mode. */
  jsonMode?: boolean;
  /** Request timeout in ms (default 60_000). */
  timeout?: number;
  /** Quality tier — only used when the router must choose a model. */
  quality?: AiQuality;
  /** Number of retries before giving up (default 1). */
  maxRetries?: number;
  /** Passed to the runtime fetch call; consumers may ignore. */
  metadata?: Record<string, unknown>;
}

/** Normalized result of any AI call. Never throws by contract. */
export interface AiResult {
  /** The full assistant reply text (empty on error). */
  reply: string;
  /** Provider that ultimately served the reply, or null. */
  provider: AiProviderId | null;
  /** Model that served the reply, or null. */
  model: string | null;
  /** Non-null when the call ultimately failed. */
  error: string | null;
  /** Parsed JSON when jsonMode was requested AND reply was JSON-parseable. */
  data?: JsonValue | null;
}

/**
 * Public, typed input for the dashboard-facing `ai-gateway` edge function.
 * This is the stable contract the digitallydefined-dashboard posts to.
 */
export interface AiGatewayRequest {
  /** Hermes action name, e.g. "chat", "brain.brief", "ai.recommendations". */
  action: string;
  prompt?: string;
  conversation?: AiMessage[];
  /** Nested pipeline/component payload. */
  payload?: JsonValue;
  model?: string;
  systemPrompt?: string;
  jsonMode?: boolean;
}

/** Typed response envelope for the dashboard-facing `ai-gateway` edge function. */
export interface AiGatewayResponse<T = JsonValue> {
  ok: boolean;
  reply?: string;
  data?: T;
  error?: string;
  provider?: string | null;
  model?: string | null;
  schema?: string;
  timestamp?: number;
}