/**
 * src/index.ts — DigitallyDefined OS Workers entry point.
 *
 * Cloudflare Worker that:
 * - Receives HTTP requests and routes them to /api handlers
 * - Processes AI workflows (workspace builder, product factory, auditor)
 * - Deploys Notion assets via the NotionClient
 * - Saves structured logs
 * - Triggers Antigravity agents through Durable Object sessions
 * - Exposes health, templates, agents, and vectorize search endpoints
 */

import { handleRequest } from "./api/routes.js";
import type { AppEnv } from "./api/routes.js";

/**
 * AgentSession Durable Object — stateful session for multi-step agent
 * collaboration. Holds task queue + artifacts for a single orchestration run.
 */
export class AgentSession {
  private readonly state: DurableObjectState;

  constructor(state: DurableObjectState, _env: AppEnv) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    if (method === "POST" && url.pathname.endsWith("/session/state")) {
      const body = (await request.json()) as {
        sessionId: string;
        tasks: unknown[];
        artifacts: unknown[];
      };
      await this.state.storage.put("session", {
        sessionId: body.sessionId,
        tasks: body.tasks,
        artifacts: body.artifacts,
        updatedAt: new Date().toISOString(),
      });
      return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
    }

    if (method === "GET" && url.pathname.endsWith("/session/state")) {
      const stored = (await this.state.storage.get("session")) as
        | { sessionId: string; tasks: unknown[]; artifacts: unknown[]; updatedAt: string }
        | undefined;
      return new Response(JSON.stringify(stored ?? null), { headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ ok: false, error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * Structured request logging middleware.
 */
async function logRequest(request: Request, handler: () => Promise<Response>): Promise<Response> {
  const start = Date.now();
  let status = 0;
  let error = "";
  try {
    const response = await handler();
    status = response.status;
    return response;
  } catch (err) {
    status = 500;
    error = err instanceof Error ? err.message : String(err);
    throw err;
  } finally {
    const duration = Date.now() - start;
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        level: "info",
        message: "request",
        method: request.method,
        path: new URL(request.url).pathname,
        status,
        durationMs: duration,
        error,
        timestamp: new Date().toISOString(),
      }),
    );
  }
}

export default {
  async fetch(
    request: Request,
    env: AppEnv,
    ctx: ExecutionContext,
  ): Promise<Response> {
    return logRequest(request, () => handleRequest(request, env, ctx));
  },
} satisfies ExportedHandler<AppEnv>;
