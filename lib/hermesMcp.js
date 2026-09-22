/**
 * lib/hermesMcp.js
 * DigitallyDefined — Hermes MCP server builder (Streamable HTTP, MCP SDK).
 *
 * Builds a real @modelcontextprotocol `McpServer` that exposes Hermes's
 * capabilities as MCP tools. All LLM traffic flows through OmniRoute (the
 * single AI gateway) — same normalization + auth as lib/omniroute.js and
 * api/index.js.
 *
 * Required env: OMNIROUTE_API_KEY
 * Optional env: OMNIROUTE_BASE_URL (default https://api.omniroute.ai/v1),
 *               OMNIROUTE_MODEL    (default "auto")
 *
 * This module is transport-agnostic: the Vercel function (api/hermes-mcp.ts)
 * and the local server (scripts/hermes-mcp-server.mjs) both build a server
 * from here and attach their own StreamableHTTPServerTransport.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const DEFAULT_SYSTEM_PROMPT =
  "You are Hermes, the AI business partner for DigitallyDefined. Give short, high-level, no-bullshit business advice. Focus on priorities, risks, and the next move.";

// Accept base URL with or without a trailing "/v1"; always resolve to "<origin>/v1".
function normalizeOmnirouteBase(raw) {
  return (
    String(raw || process.env.OMNIROUTE_BASE_URL || "https://api.omniroute.ai/v1")
      .trim()
      .replace(/\/+$/, "")
      .replace(/\/v1$/, "") + "/v1"
  );
}

const OMNIROUTE_BASE_URL = normalizeOmnirouteBase(process.env.OMNIROUTE_BASE_URL);
const OMNIROUTE_API_KEY = (process.env.OMNIROUTE_API_KEY || "").trim();
const DEFAULT_MODEL = (process.env.OMNIROUTE_MODEL || "auto").trim();

// ---------------------------------------------------------------------------
// Active model (runtime-mutable)
// ---------------------------------------------------------------------------
// `setActiveModel()` swaps this in place. Every subsequent hermes.chat call
// reads it, so the swap IS the runtime reload — no process restart needed.
// ---------------------------------------------------------------------------
let activeModel = DEFAULT_MODEL;
let activeModelUpdatedAt = Date.now();
let activeModelSource = "env";

/** Return the model currently used by hermes.chat. */
export function getActiveModel() {
  return { model: activeModel, updatedAt: activeModelUpdatedAt, source: activeModelSource };
}

/**
 * Swap the active model for the Hermes runtime.
 * `modelId` may be any id the OmniRoute gateway accepts (auto/*, bm/*, vertex/*).
 */
export function setActiveModel(modelId = "") {
  const next = String(modelId || "").trim();
  if (!next) {
    return { ok: false, error: "setActiveModel requires a non-empty modelId" };
  }
  const previous = activeModel;
  activeModel = next;
  activeModelUpdatedAt = Date.now();
  activeModelSource = "setActiveModel";
  console.log(`[hermes-mcp] active model ${previous} -> ${next}`);
  return { ok: true, previous, model: activeModel, updatedAt: activeModelUpdatedAt };
}

/** Live OmniRoute model catalog (ids only), or null when unreachable. */
async function fetchModelCatalog(timeout = 15000) {
  if (!OMNIROUTE_API_KEY) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(`${OMNIROUTE_BASE_URL}/models`, {
      headers: { Authorization: `Bearer ${OMNIROUTE_API_KEY}` },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const body = await res.json();
    const ids = (body?.data || []).map((m) => m?.id).filter(Boolean);
    return ids.length ? ids : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Reply-parsing that tolerates both a standard OpenAI JSON body and an SSE
 * stream body (OmniRoute may stream even when stream:false is requested).
 */
async function extractReplyText(res) {
  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();

  if (!contentType.includes("text/event-stream") && !text.trimStart().startsWith("data:")) {
    const data = JSON.parse(text);
    return data?.choices?.[0]?.message?.content || "";
  }

  let reply = "";
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;
    const payload = trimmed.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;
    try {
      const parsed = JSON.parse(payload);
      const delta =
        parsed?.choices?.[0]?.delta?.content ||
        parsed?.choices?.[0]?.message?.content ||
        "";
      reply += delta;
    } catch {
      // skip malformed SSE chunk
    }
  }
  return reply;
}

/** Single OmniRoute attempt — no fallback models, no provider switching. */
async function omnirouteChat({ prompt, systemPrompt, model, timeout = 60000 }) {
  if (!OMNIROUTE_API_KEY) {
    throw new Error("OMNIROUTE_API_KEY not configured in environment variables");
  }
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    throw new Error("Invalid prompt: must be a non-empty string");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(`${OMNIROUTE_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OMNIROUTE_API_KEY}`,
      },
      body: JSON.stringify({
        model: model || activeModel || DEFAULT_MODEL,
        messages: [
          { role: "system", content: systemPrompt || DEFAULT_SYSTEM_PROMPT },
          { role: "user", content: prompt.trim() },
        ],
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = (await response.text()).slice(0, 200);
      throw new Error(
        `OmniRoute error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const reply = await extractReplyText(response);
    if (!reply) throw new Error("OmniRoute returned an empty response");
    return reply;
  } finally {
    clearTimeout(timer);
  }
}

/** Trim a mask for status output: show only the first 4 chars of the key. */
function maskKey(key) {
  if (!key) return "UNSET";
  if (key.length <= 8) return `${key.slice(0, 2)}…${"*".repeat(6)}`;
  return `${key.slice(0, 4)}…${"*".repeat(Math.min(12, key.length - 4))}`;
}
/**
 * Build a fresh Hermes MCP server with its tool registry.
 * One instance per transport/session.
 */
export function buildHermesMcpServer() {
  const server = new McpServer({
    name: "hermes-mcp",
    version: "1.0.0",
  });

  // ---- Tool: hermes.chat  (route a prompt through Hermes/OmniRoute)
  server.registerTool(
    "hermes.chat",
    {
      title: "Hermes Chat",
      description:
        "Send a prompt to Hermes (DigitallyDefined's AI business partner) and get an actionable reply. All AI traffic goes through the OmniRoute gateway, which resolves the model automatically.",
      inputSchema: z.object({
        prompt: z
          .string()
          .min(1)
          .describe("The user prompt / business question to send to Hermes."),
        systemPrompt: z
          .string()
          .optional()
          .describe("Optional system prompt override. Defaults to the Hermes partner prompt."),
        model: z
          .string()
          .optional()
          .describe('Optional model id. Leave empty for OmniRoute "auto" routing.'),
      }),
    },
    async (args) => {
      try {
        const reply = await omnirouteChat({
          prompt: args.prompt,
          systemPrompt: args.systemPrompt,
          model: args.model,
        });
        return { content: [{ type: "text", text: reply }] };
      } catch (err) {
        return {
          content: [{ type: "text", text: `ERROR: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  // ---- Tool: hermes.status  (connection-health diagnostics)
  server.registerTool(
    "hermes.status",
    {
      title: "Hermes Status",
      description:
        "Return connection-health diagnostic info: server identity, OmniRoute base URL, whether the API key is configured (masked), and current model.",
      inputSchema: z.object({}),
    },
    async () => {
      const text = [
        "Hermes MCP server is running.",
        `  name: hermes-mcp`,
        `  version: 1.0.0`,
        `  omniroute.base_url: ${OMNIROUTE_BASE_URL}`,
        `  omniroute.active_model: ${activeModel || "(unset)"}`,
        `  omniroute.env_default: ${DEFAULT_MODEL || "(unset)"}`,
        `  omniroute.model_source: ${activeModelSource}`,
        `  omniroute.api_key: ${maskKey(OMNIROUTE_API_KEY)}`,
      ].join("\n");
      return { content: [{ type: "text", text }] };
    }
  );

  // ---- Tool: hermes.setActiveModel  (switch the runtime model)
  server.registerTool(
    "hermes.setActiveModel",
    {
      title: "Set Active Model",
      description:
        "Switch the OmniRoute model used by every subsequent hermes.chat call. The change applies immediately (no restart). Returns the previous and new model id.",
      inputSchema: z.object({
        modelId: z
          .string()
          .min(1)
          .describe('The OmniRoute model id to activate, e.g. "auto/best-chat" or "bm/claude-sonnet-4-5".'),
      }),
    },
    async (args) => {
      const result = setActiveModel(args.modelId);
      const text = result.ok
        ? [
            `Active model updated.`,
            `  previous: ${result.previous}`,
            `  current:  ${result.model}`,
            `  updated:  ${new Date(result.updatedAt).toISOString()}`,
          ].join("\n")
        : `ERROR: ${result.error}`;
      return {
        content: [{ type: "text", text }],
        isError: !result.ok,
      };
    }
  );

  // ---- Tool: hermes.models  (inspect the live gateway catalog)
  server.registerTool(
    "hermes.models",
    {
      title: "List Models",
      description:
        "Return the current active model plus the live OmniRoute model catalog. Use `filter` to narrow the list by substring.",
      inputSchema: z.object({
        filter: z
          .string()
          .optional()
          .describe("Optional case-insensitive substring to filter model ids, e.g. \"claude\" or \"gemini\"."),
        limit: z
          .number()
          .int()
          .positive()
          .max(500)
          .optional()
          .describe("Maximum number of model ids to return (default 100)."),
      }),
    },
    async (args) => {
      const catalog = await fetchModelCatalog();
      const filter = String(args.filter || "").toLowerCase();
      const limit = args.limit || 100;

      if (!catalog) {
        return {
          content: [
            {
              type: "text",
              text: `Active model: ${activeModel}\n\nLive catalog unavailable (gateway unreachable or OMNIROUTE_API_KEY unset).`,
            },
          ],
        };
      }

      const filtered = (filter ? catalog.filter((id) => id.toLowerCase().includes(filter)) : catalog).slice(0, limit);
      const text = [
        `Active model: ${activeModel}`,
        `Catalog size: ${catalog.length}${filter ? ` (matching "${args.filter}": ${filtered.length})` : ""}`,
        "",
        ...filtered,
      ].join("\n");
      return { content: [{ type: "text", text }] };
    }
  );

  return server;
}

export default { buildHermesMcpServer, setActiveModel, getActiveModel };