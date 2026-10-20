/**
 * src/notion/client.ts — Notion API client for DigitallyDefined OS Workers.
 *
 * Thin, typed wrapper around the Notion REST API with retries, timeouts,
 * structured error handling, and live-mode gating. Mirrors the backend's
 * src/services/notion.js contract but targets Cloudflare Workers (fetch).
 */

import { requireNotion } from "../config/env.js";
import type { Env } from "../config/env.js";
import type { NotionPropertyDef, NotionDatabaseSchema } from "../types.js";

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;

export class NotionError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "NotionError";
    this.status = status;
  }
}

export interface NotionClientDeps {
  env: Env;
  fetch?: typeof fetch;
}

function notionHeaders(token: string, version: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Notion-Version": version,
    "Content-Type": "application/json",
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class NotionClient {
  private readonly token: string;
  private readonly base: string;
  private readonly version: string;
  private readonly fetch: typeof fetch;

  constructor({ env, fetch: customFetch }: NotionClientDeps) {
    requireNotion(env);
    this.token = env.NOTION_API_KEY!;
    this.base = env.NOTION_API_BASE ?? "https://api.notion.com";
    this.version = env.NOTION_API_VERSION ?? "2022-06-28";
    this.fetch = customFetch ?? fetch;
  }

  private async request<T = unknown>(
    path: string,
    opts: {
      method?: string;
      body?: unknown;
      timeoutMs?: number;
    } = {},
  ): Promise<T> {
    const { method = "GET", body, timeoutMs = DEFAULT_TIMEOUT_MS } = opts;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    let lastError: unknown = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await this.fetch(`${this.base}${path}`, {
          method,
          headers: notionHeaders(this.token, this.version),
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        const responseText = await response.text();

        if (!response.ok) {
          throw new NotionError(
            `Notion API error (${response.status}): ${responseText.slice(0, 500)}`,
            response.status,
          );
        }

        if (!responseText) return {} as unknown as T;
        return (JSON.parse(responseText) as T) ?? ({} as unknown as T);
      } catch (error) {
        lastError = error;
        if (error instanceof NotionError && error.status !== 429 && error.status !== 500) {
          throw error;
        }
        if (error instanceof Error && error.name === "AbortError") {
          throw new NotionError("Notion API request timed out");
        }
        if (attempt < MAX_RETRIES - 1) {
          await sleep(Math.min(1000 * 2 ** attempt, 8000));
        }
      }
    }
    clearTimeout(timeoutId);
    throw lastError;
  }

  /*───────────────────────── Databases ─────────────────────────*/

  async listDatabases(): Promise<{
    results: Array<{ id: string; title: string; url: string }>;
  }> {
    return this.request<{ results: unknown[] }>("/databases").then((r) => ({
      results: (r.results as Array<{ id: string; title: unknown; url: string }>).map((d) => ({
        id: d.id,
        title: Array.isArray(d.title) ? d.title.map((t) => (t as { plain_text?: string }).plain_text ?? "").join("") : "",
        url: d.url,
      })),
    }));
  }

  async createDatabase(schema: NotionDatabaseSchema): Promise<{
    id: string;
    url: string;
    name: string;
  }> {
    const properties = this.normalizeProperties(schema.properties);
    const payload: Record<string, unknown> = {
      parent: schema.parent,
      title: [{ type: "text", text: { content: schema.name } }],
      properties,
    };
    if (schema.description) {
      payload["description"] = [{ type: "text", text: { content: schema.description } }];
    }

    const result = await this.request<{ id: string; url: string }>("/databases", {
      method: "POST",
      body: payload,
    });

    return { id: result.id, url: result.url, name: schema.name };
  }

  async updateDatabase(databaseId: string, properties: NotionPropertyDef[]): Promise<void> {
    await this.request(`/databases/${databaseId}`, {
      method: "PATCH",
      body: { properties: this.normalizeProperties(properties) },
    });
  }

  async queryDatabase(
    databaseId: string,
    opts: { filter?: unknown; sorts?: unknown[]; pageSize?: number } = {},
  ): Promise<{ results: unknown[]; has_more: boolean; next_cursor?: string }> {
    const { filter, sorts, pageSize = 100 } = opts;
    const payload: Record<string, unknown> = { page_size: Math.min(pageSize, 100) };
    if (filter) payload["filter"] = filter;
    if (sorts) payload["sorts"] = sorts;
    return this.request<{ results: unknown[]; has_more: boolean; next_cursor?: string }>(
      `/databases/${databaseId}/query`,
      { method: "POST", body: payload },
    );
  }

  /*───────────────────────── Pages ─────────────────────────*/

  async getPage(pageId: string): Promise<unknown> {
    return this.request(`/pages/${pageId}`);
  }

  async createPage(params: {
    databaseId: string;
    properties?: Record<string, unknown>;
    title?: string;
    children?: unknown[];
  }): Promise<{ id: string; url: string }> {
    const payload: Record<string, unknown> = {
      parent: { database_id: params.databaseId },
      properties: { ...params.properties },
    };
    if (params.title) {
      payload["properties"] = { ...(payload["properties"] as Record<string, unknown>), title: [{ type: "text", text: { content: params.title } }] };
    }
    if (params.children) {
      payload["children"] = params.children;
    }
    return this.request<{ id: string; url: string }>("/pages", {
      method: "POST",
      body: payload,
    });
  }

  async updatePage(pageId: string, properties: Record<string, unknown>): Promise<void> {
    await this.request(`/pages/${pageId}`, {
      method: "PATCH",
      body: { properties },
    });
  }

  async appendBlocks(pageId: string, children: unknown[]): Promise<void> {
    await this.request(`/blocks/${pageId}/children`, {
      method: "POST",
      body: { children },
    });
  }

  /*───────────────────────── Schema helpers ─────────────────────────*/

  /** Map internal NotionPropertyDef[] → Notion API property map. */
  normalizeProperties(properties: NotionPropertyDef[]): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const prop of properties) {
      switch (prop.type) {
        case "title":
          out[prop.name] = { title: {} };
          break;
        case "rich_text":
          out[prop.name] = { rich_text: {} };
          break;
        case "number":
          out[prop.name] = { number: { format: "number" } };
          break;
        case "select":
          out[prop.name] = {
            select: {
              options: (prop.options ?? []).map((o) => ({ name: o, color: "default" })),
            },
          };
          break;
        case "multi_select":
          out[prop.name] = {
            multi_select: {
              options: (prop.options ?? []).map((o) => ({ name: o, color: "default" })),
            },
          };
          break;
        case "status":
          out[prop.name] = {
            status: {
              options: (prop.options ?? []).map((o) => ({ name: o, color: "default" })),
            },
          };
          break;
        case "date":
          out[prop.name] = { date: {} };
          break;
        case "checkbox":
          out[prop.name] = { checkbox: {} };
          break;
        case "url":
          out[prop.name] = { url: {} };
          break;
        case "email":
          out[prop.name] = { email: {} };
          break;
        case "phone_number":
          out[prop.name] = { phone_number: {} };
          break;
        case "formula":
          out[prop.name] = { formula: { expression: prop.formula?.expression ?? "" } };
          break;
        case "relation":
          out[prop.name] = {
            relation: {
              database_id: prop.relation?.databaseId,
              ...(prop.relation?.name ? { synced_property_name: prop.relation.name } : {}),
            },
          };
          break;
        case "rollup":
          out[prop.name] = {
            rollup: {
              relation_property_name: prop.rollup?.relationPropertyName,
              target_property_name: prop.rollup?.targetPropertyName,
              ...(prop.rollup?.aggregation && { function: prop.rollup.aggregation }),
            },
          };
          break;
      }
    }
    return out;
  }
}
