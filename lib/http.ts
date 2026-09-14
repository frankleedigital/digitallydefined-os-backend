/**
 * lib/http.ts
 * Shared HTTP helpers for Supabase Edge Functions (and Deno handlers).
 *
 * Supersedes the scattered CORS/JSON helpers previously copied per-function
 * (see supabase/functions/_shared/cors-utils.ts). Keeps the same allowlist so
 * behaviour is unchanged for existing dashboard clients.
 */
import { getEnv } from "./env.ts";
import { toAppError, errorMessage } from "./errors.ts";
import { ApiResponse, JsonValue } from "./types.ts";

/** Origin allowlist — keep in sync with cors-utils.ts / hermes/index.ts. */
export const DEFAULT_ALLOWED_ORIGINS = [
  "https://dashboard.digitallydefined.online",
  "https://digitallydefined.online",
  "https://www.digitallydefined.online",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
];

function isAllowed(origin: string, allowlist: string[]): boolean {
  if (!origin) return false;
  if (allowlist.includes(origin)) return true;
  // Allow a configurable preview domain (VERCEL_URL style) if set.
  const preview = getEnv("ALLOWED_ORIGIN_EXTRA", "");
  if (preview && origin === preview) return true;
  return origin.includes("localhost");
}

/** Conventionally echo back the given origin (or fall back to the dashboard). */
export function corsHeaders(
  origin = "",
  allowlist: string[] = DEFAULT_ALLOWED_ORIGINS,
): Record<string, string> {
  const allowed = isAllowed(origin, allowlist) ? origin : "https://dashboard.digitallydefined.online";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, apikey, Authorization, x-api-key, x-user-id, Mcp-Session-Id",
    "Access-Control-Expose-Headers": "Mcp-Session-Id",
    "Vary": "Origin",
    "Access-Control-Max-Age": "86400",
  };
}

/** Shortcut to build a JSON Response with CORS applied. */
export function jsonResponse(
  body: ApiResponse | JsonValue,
  status = 200,
  origin = "",
  extra: Record<string, string> = {},
): Response {
  const headers = { "Content-Type": "application/json", ...corsHeaders(origin), ...extra };
  return new Response(JSON.stringify(body), { status, headers });
}

/** 200 JSON success. */
export function ok(data: unknown, origin = "", extra?: Record<string, string>): Response {
  return jsonResponse({ ok: true, data, timestamp: Date.now() }, 200, origin, extra);
}

/** Error Response from any thrown value. Maps AppError → status; hides internals. */
export function err(
  error: unknown,
  origin = "",
  fallbackMessage = "Internal error",
): Response {
  const appErr = toAppError(error, fallbackMessage);
  // Do not leak internal error text for 500s — send a safe, generic message.
  const message = appErr.status >= 500 && !(error instanceof Error && appErr.code !== "config_error")
    ? "Internal error"
    : errorMessage(appErr);
  return jsonResponse(
    { ok: false, error: message, timestamp: Date.now() },
    appErr.status,
    origin,
  );
}

/** Handle a CORS preflight (OPTIONS) — returns a 204, or null for other methods. */
export function handleCors(req: Request, allowlist?: string[]): Response | null {
  if (req.method === "OPTIONS") {
    const headers = corsHeaders(req.headers.get("origin") || "", allowlist);
    return new Response("ok", { status: 204, headers });
  }
  return null;
}

/**
 * Read and JSON-parse a request body, tolerating empty/invalid JSON where a
 * caller may send `{}` (some legacy clients post an empty body).
 */
export async function readJsonBody(req: Request): Promise<Record<string, unknown>> {
  const text = await req.text();
  if (!text || !text.trim()) return {};
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/** Parse `?action=...` from a URL for GET-dispatch endpoints. */
export function queryParam(url: URL, key: string): string {
  return (url.searchParams.get(key) || "").trim();
}

export default { corsHeaders, jsonResponse, ok, err, handleCors, readJsonBody, queryParam, DEFAULT_ALLOWED_ORIGINS };