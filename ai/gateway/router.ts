/**
 * ai/gateway/router.ts
 * Model selection + fallback + retry for AI calls in DigitallyDefined OS.
 *
 * Consolidated from supabase/functions/_shared/aiRouter.ts.
 *
 * Responsibilities:
 *   - Pick a default model from env (OMNIROUTE_MODEL) by quality tier.
 *   - Try OmniRoute first; on failure fall back to direct Gemini.
 *   - Retry a bounded number of times before surfacing an error.
 *   - Return normalized `AiResult` (never throws by contract).
 */

import { attemptChat, omnirouteConfigured, geminiConfigured } from "./client.ts";
import { AiMessage, AiOptions, AiProviderId, AiResult, AiQuality } from "../types.ts";
import { buildMessages } from "./client.ts";
import { getEnv } from "../../lib/env.ts";

/** Primary + fallback provider order used for every call. */
export const PROVIDER_ORDER: AiProviderId[] = ["omniroute", "gemini-direct"];

/** Env-driven model for a given quality tier. Falls back to OMNIROUTE_MODEL. */
export function defaultModelFor(_quality: AiQuality): string {
  // Currently OmniRoute handles its own model fan-out ("auto"); expose the
  // standard env override for callers who want an explicit model.
  return getEnv("OMNIROUTE_MODEL", "auto");
}

/**
 * Parse a JSON reply, tolerating markdown fences and stray prose.
 * Returns null when not parseable.
 */export function parseJsonReply(reply: string): unknown | null {
  if (!reply || typeof reply !== "string") return null;
  let cleaned = reply
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try extracting the first balanced {...} block as a final fallback.
    const start = cleaned.indexOf("{");
    if (start < 0) return null;
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = start; i < cleaned.length; i++) {
      const ch = cleaned[i];
      if (escaped) { escaped = false; continue; }
      if (ch === "\\") { escaped = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          try {
            return JSON.parse(cleaned.slice(start, i + 1));
          } catch {
            return null;
          }
        }
      }
    }
    return null;
  }
}

/**
 * Highest-level gateway call: OmniRoute → Gemini fallback with bounded retry.
 * Guaranteed to return a normalized `AiResult`.
 */
export async function run(prompt: string, options: AiOptions = {}): Promise<AiResult> {
  const quality = options.quality ?? "medium";
  const model = options.model || defaultModelFor(quality);
  const messages: AiMessage[] = buildMessages(prompt, options.systemPrompt ?? "");
  const attempts = 1 + Math.max(0, Math.min(options.maxRetries ?? 1, 3));

  // Primary then fallback provider ordering for every call.
  const candidates = PROVIDER_ORDER;
  let lastError: string | null = null;

  for (let i = 0; i < attempts; i++) {
    for (const provider of candidates) {
      if (provider === "gemini-direct" && !geminiConfigured()) continue;
      if (provider === "omniroute" && !omnirouteConfigured()) continue;
      const result = await attemptChat(provider, messages, options);
      if (!result.error) return result;
      lastError = result.error;
      // Do not fall for provider config absent.
      if (result.error.includes("not configured")) break; // nothing to retry
    }
    // Small backoff between retries.
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, 300 * (i + 1)));
  }

  return { reply: "", provider: null, model: null, error: lastError ?? "All AI providers failed" };
}

export default { run, defaultModelFor, parseJsonReply, PROVIDER_ORDER };
