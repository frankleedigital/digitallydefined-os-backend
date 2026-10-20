/**
 * src/api/routes.ts — HTTP API routes for DigitallyDefined OS Workers.
 *
 * Route handler registered on the main Worker. All endpoints return a standard
 * ApiResponse envelope and enforce API-key auth where required.
 */

import type { RequestContext, ApiResponse } from "../types.js";
import type { Env } from "../config/env.js";
import {
  runNotionBuilderWorkflow,
} from "../workflows/notionBuilder.js";
import type { NotionBuilderInput } from "../workflows/types.js";
import {
  runProductFactoryWorkflow,
} from "../workflows/productFactory.js";
import type { ProductFactoryInput } from "../workflows/types.js";
import {
  runWorkspaceAuditWorkflow,
} from "../workflows/auditor.js";
import type { WorkspaceAuditInput } from "../workflows/types.js";
import { resolveAgent, listAgents } from "../agents/index.js";
import { listTemplates, getTemplate, searchTemplates } from "../templates/index.js";
import { semanticSearch } from "../vectorize/index.js";
import { requireNotion, requirePhase21Approval } from "../config/env.js";

export interface AppEnv extends Env {
  AGENT_SESSION: DurableObjectNamespace;
  AI?: unknown;
  VECTORIZE?: unknown;
}

function requestId(): string {
  return `req_${crypto.randomUUID?.() ?? Date.now().toString(36)}`;
}

function now(): string {
  return new Date().toISOString();
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function apiResponse<T>(data: ApiResponse<T>): Response {
  return json(data, data.ok ? 200 : data.error ? 400 : 500);
}

function cors(preflight = false): Response {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key, x-user-id",
  };
  if (preflight) return new Response(null, { status: 204, headers });
  return new Response(null, { status: 200, headers });
}

function extractContext(headers: Headers): RequestContext {
  const apiKey = headers.get("x-api-key") ?? headers.get("apikey") ?? undefined;
  const userId = headers.get("x-user-id") ?? "anonymous";
  return { userId, apiKey, liveMode: false, phase21Approval: false };
}

function enforceApiKey(context: RequestContext, env: Env): Response | null {
  if (!env.DASHBOARD_API_KEY) return null;
  if (context.apiKey !== env.DASHBOARD_API_KEY) {
    return apiResponse({ ok: false, error: "Invalid or missing x-api-key", requestId: requestId(), timestamp: now() });
  }
  return null;
}

export async function handleRequest(
  request: Request,
  env: AppEnv,
  _ctx: ExecutionContext,
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const method = request.method;

  if (method === "OPTIONS") return cors(true);

  const context = extractContext(request.headers);
  const authError = enforceApiKey(context, env);
  if (authError) return authError;

  /*──────────────── Health ────────────────*/
  if (path === "/api/health" && method === "GET") {
    return apiResponse({
      ok: true,
      data: {
        service: "digitallydefined-os-workers",
        version: "1.0.0",
        time: now(),
        notionConfigured: Boolean(env.NOTION_API_KEY),
        liveMode: Boolean(env.NOTION_LIVE_MODE),
        phase21Approval: Boolean(env.NOTION_PHASE21_LIVE_APPROVAL),
      },
      requestId: requestId(),
      timestamp: now(),
    });
  }

  /*──────────────── Templates ────────────────*/
  if (path === "/api/templates" && method === "GET") {
    const q = url.searchParams.get("q") ?? "";
    const templates = q ? searchTemplates(q) : listTemplates();
    return apiResponse({ ok: true, data: { templates, count: templates.length }, requestId: requestId(), timestamp: now() });
  }

  if (path.startsWith("/api/templates/") && method === "GET") {
    const id = path.split("/").pop() ?? "";
    const template = getTemplate(id);
    if (!template) {
      return apiResponse({ ok: false, error: "Template not found", requestId: requestId(), timestamp: now() });
    }
    return apiResponse({ ok: true, data: { template }, requestId: requestId(), timestamp: now() });
  }

  /*──────────────── Agents ────────────────*/
  if (path === "/api/agents" && method === "GET") {
    return apiResponse({ ok: true, data: { agents: listAgents() }, requestId: requestId(), timestamp: now() });
  }

  if (path === "/api/agent/run" && method === "POST") {
    const body = (await request.json()) as {
      type: string;
      prompt: string;
      context?: Record<string, unknown>;
    };
    if (!body.type || !body.prompt) {
      return apiResponse({ ok: false, error: "type and prompt are required", requestId: requestId(), timestamp: now() });
    }
    try {
      const agent = resolveAgent(body.type as any, body.context ?? {});
      const task = {
        id: `task_${Date.now().toString(36)}`,
        type: body.type,
        prompt: body.prompt,
        context: body.context ?? {},
        status: "pending",
        createdAt: now(),
        updatedAt: now(),
      } as any;
      const result = await agent.run(task);
      return apiResponse({ ok: true, data: result, requestId: requestId(), timestamp: now() });
    } catch (err) {
      return apiResponse({ ok: false, error: String(err), requestId: requestId(), timestamp: now() });
    }
  }

  /*──────────────── Workflows ────────────────*/
  if (path === "/api/workspace/build" && method === "POST") {
    const body = (await request.json()) as NotionBuilderInput;
    if (!body.prompt) {
      return apiResponse({ ok: false, error: "prompt is required", requestId: requestId(), timestamp: now() });
    }
    try {
      const output = await runNotionBuilderWorkflow(body);
      return apiResponse({ ok: true, data: output, requestId: requestId(), timestamp: now() });
    } catch (err) {
      return apiResponse({ ok: false, error: String(err), requestId: requestId(), timestamp: now() });
    }
  }

  if (path === "/api/product/factory" && method === "POST") {
    const body = (await request.json()) as ProductFactoryInput;
    if (!body.topic) {
      return apiResponse({ ok: false, error: "topic is required", requestId: requestId(), timestamp: now() });
    }
    try {
      const output = await runProductFactoryWorkflow(body);
      return apiResponse({ ok: true, data: output, requestId: requestId(), timestamp: now() });
    } catch (err) {
      return apiResponse({ ok: false, error: String(err), requestId: requestId(), timestamp: now() });
    }
  }

  if (path === "/api/workspace/audit" && method === "POST") {
    const body = (await request.json()) as WorkspaceAuditInput;
    if (!body.workspaceId) {
      return apiResponse({ ok: false, error: "workspaceId is required", requestId: requestId(), timestamp: now() });
    }
    try {
      const output = await runWorkspaceAuditWorkflow(body);
      return apiResponse({ ok: true, data: output, requestId: requestId(), timestamp: now() });
    } catch (err) {
      return apiResponse({ ok: false, error: String(err), requestId: requestId(), timestamp: now() });
    }
  }

  /*──────────────── Vectorize / Search ────────────────*/
  if (path === "/api/vectorize/search" && method === "POST") {
    const body = (await request.json()) as { query: string; topK?: number };
    if (!body.query) {
      return apiResponse({ ok: false, error: "query is required", requestId: requestId(), timestamp: now() });
    }
    const results = await semanticSearch({ env: env as { AI?: unknown; VECTORIZE?: unknown }, query: body.query, topK: body.topK ?? 5 });
    return apiResponse({ ok: true, data: { results, count: results.length }, requestId: requestId(), timestamp: now() });
  }

  /*──────────────── Notion Proxy ────────────────*/
  if (path.startsWith("/api/notion") && method === "POST") {
    try {
      requireNotion(env);
      requirePhase21Approval(env);
      const target = path.replace(/^\/api\/notion/, "");
      const body = await request.text();
      const upstream = await fetch(`https://api.notion.com${target}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.NOTION_API_KEY}`,
          "Notion-Version": env.NOTION_API_VERSION ?? "2022-06-28",
          "Content-Type": "application/json",
        },
        body: body || undefined,
      });
      const text = await upstream.text();
      return new Response(text, {
        status: upstream.status,
        headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
      });
    } catch (err) {
      return apiResponse({ ok: false, error: String(err), requestId: requestId(), timestamp: now() });
    }
  }

  return apiResponse({ ok: false, error: "Not found", requestId: requestId(), timestamp: now() });
}
