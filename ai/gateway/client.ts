/**
 * ai/gateway/client.ts
 * SINGLE ENTRY POINT for all AI calls in DigitallyDefined OS.
 *
 * Consolidated from:
 *   - supabase/functions/_shared/omniroute.ts  (Deno — production path)
 *   - lib/llmClient.js                          (Node port)
 *   - supabase/functions/_shared/aiRouter.ts    (thin model selection)
 *
 * Design rules:
 *   - No module outside /ai/ should talk to a model provider directly.
 *   - Configuration is env-driven (never hard-coded endpoints/models).
 *   - Every public call returns a normalized `AiResult` (never throws by contract).
 *   - Router (router.ts) owns model selection + fallback + retry; this client
 *     owns the raw HTTP transport for a single provider attempt.
 */

import { getEnv, getEnvBool } from "../../lib/env.ts";
import { AiMessage, AiOptions, AiProviderId, AiResult } from "../types.ts";
import { hermesSystemPrompt } from "../../prompts/hermesSystemPrompt.ts";
import type { JsonValue } from "../../lib/types.ts";

/** Canonical resolved OmniRoute chat-completions endpoint. */
export function omnirouteEndpoint(raw?: string | null): string {
  const base = (raw ?? getEnv("OMNIROUTE_BASE_URL", "https://api.omniroute.ai/v1"))
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/v1$/, "");
  return `${base}/v1/chat/completions`;
}

/** Canonical resolved direct-Gemini chat-completions endpoint. */
export function geminiEndpoint(raw?: string | null): string {
  const base = (
    raw ??
    getEnv("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai")
  )
    .trim()
    .replace(/\/+$/, "");
  return `${base}/chat/completions`;
}

/** Default Hermes partner system prompt (shared across every component). */
export const DEFAULT_SYSTEM_PROMPT = hermesSystemPrompt;

export const DEFAULT_MODEL = () => getEnv("OMNIROUTE_MODEL", "auto");
export const GEMINI_MODEL = () => getEnv("GEMINI_MODEL", "gemini-3.6-flash");

function omnirouteKey(): string {
  return getEnv("OMNIROUTE_API_KEY");
}
function geminiKey(): string {
  return getEnv("GEMINI_API_KEY", getEnv("GOOGLE_API_KEY"));
}

export function omnirouteConfigured(): boolean {
  return omnirouteKey() !== "" || getEnvBool("OMNIROUTE_DISABLED", false);
}
export function geminiConfigured(): boolean {
  return geminiKey() !== "";
}

/** Build the standard [system, user] message array used by most calls. */
export function buildMessages(prompt: string, systemPrompt: string): AiMessage[] {
  return [
    { role: "system", content: systemPrompt || DEFAULT_SYSTEM_PROMPT },
    { role: "user", content: String(prompt).trim() },
  ];
}
/** Helper for the error path — normalized failed result. */
function failed(error: string, provider: AiProviderId | null = null): AiResult {
  return { reply: "", provider, model: null, error };
}

/**
 * Extract the assistant reply from either a standard JSON chat body or an SSE
 * stream body (OmniRoute may stream even when stream:false is requested).
 */
export async function extractReply(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (!contentType.includes("text/event-stream") && !text.trimStart().startsWith("data:")) {
    try {
      const data = JSON.parse(text);
      return data?.choices?.[0]?.message?.content || "";
    } catch {
      return "";
    }
  }

  let reply = "";
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;
    const payload = trimmed.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;
    try {
      const parsed = JSON.parse(payload);
      reply += parsed?.choices?.[0]?.delta?.content
        || parsed?.choices?.[0]?.message?.content
        || "";
    } catch {
      // Skip malformed SSE chunk
    }
  }
  return reply;
}

async function withTimeout<T>(timeoutMs: number, fn: () => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fn();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Single raw attempt against a provider (no retry/fallback here — the router
 * owns that). Used internally by the router; exported for tests.
 */
export async function attemptChat(
  provider: AiProviderId,
  messages: AiMessage[],
  opts: AiOptions,
): Promise<AiResult> {
  const { model, jsonMode, timeout = 60_000, metadata } = opts;
  const systemPrompt = messages.find((m) => m.role === "system")?.content || DEFAULT_SYSTEM_PROMPT;
  const userPrompt = messages.find((m) => m.role === "user")?.content || "";
  const requestBody: Record<string, unknown> = {
    model: model || DEFAULT_MODEL(),
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  };
  if (jsonMode) requestBody.response_format = { type: "json_object" };
  if (metadata) requestBody.metadata = metadata;

  const endpoint = provider === "gemini-direct" ? geminiEndpoint() : omnirouteEndpoint();
  const key = provider === "gemini-direct" ? geminiKey() : omnirouteKey();

  if (!key) return failed(`${provider} API key not configured`, provider);

  try {
    const response = await withTimeout(timeout, () =>
      fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }),
    );
    if (!response.ok) {
      const errorText = await response.text();
      return failed(`${provider} error: ${response.status} ${response.statusText} - ${errorText.slice(0, 200)}`, provider);
    }
    const reply = await extractReply(response);
    if (!reply) return failed(`${provider} returned an empty response`, provider);

    let data: JsonValue | null = null;
    if (jsonMode) {
      try {
        data = JSON.parse(reply) as JsonValue;
      } catch {
        // Leave data null — caller may still use raw reply.
      }
    }
    return { reply, provider, model: model || DEFAULT_MODEL(), error: null, data };
  } catch (error) {
    return failed(`${provider} request failed: ${error instanceof Error ? error.message : String(error)}`, provider);
  }
}

export default { omnirouteEndpoint, geminiEndpoint, DEFAULT_SYSTEM_PROMPT, DEFAULT_MODEL, buildMessages, extractReply, attemptChat, omnirouteConfigured, geminiConfigured };