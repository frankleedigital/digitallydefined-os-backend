/**
 * src/config/env.ts — Environment variable validation for Cloudflare Workers.
 *
 * Reads bindings + vars from wrangler.toml / .dev.vars and exposes a
 * validated, typed config object. Missing required vars throw at startup
 * (in live mode) so misconfiguration is caught early.
 */

import { z } from "zod";

const EnvSchema = z.object({
  NOTION_API_KEY: z.string().min(1, "NOTION_API_KEY is required").optional(),
  NOTION_API_VERSION: z.string().default("2022-06-28"),
  NOTION_API_BASE: z.string().url().default("https://api.notion.com"),
  NOTION_LIVE_MODE: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  NOTION_PHASE21_LIVE_APPROVAL: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  DASHBOARD_API_KEY: z.string().min(1, "DASHBOARD_API_KEY is required").optional(),
  ANTIGRAVITY_URL: z.string().url().optional(),
  ANTIGRAVITY_API_KEY: z.string().optional(),
  ANTIGRAVITY_NOTION_TOKEN: z.string().optional(),
  ANTIGRAVITY_WORKSPACE_ID: z.string().optional(),
  ENVIRONMENT: z.string().default("development"),
});

export interface Env {
  NOTION_API_KEY?: string;
  NOTION_API_VERSION: string;
  NOTION_API_BASE: string;
  NOTION_LIVE_MODE: boolean;
  NOTION_PHASE21_LIVE_APPROVAL: boolean;
  DASHBOARD_API_KEY?: string;
  ANTIGRAVITY_URL?: string;
  ANTIGRAVITY_API_KEY?: string;
  ANTIGRAVITY_NOTION_TOKEN?: string;
  ANTIGRAVITY_WORKSPACE_ID?: string;
  ENVIRONMENT: string;
  // Cloudflare bindings (typed via wrangler types at runtime)
  AI?: unknown;
  VECTORIZE?: unknown;
  AGENT_SESSION?: unknown;
}

export function parseEnv(raw: Record<string, unknown>): Env {
  return EnvSchema.parse(raw) as Env;
}

export function requireNotion(env: Env): void {
  if (!env.NOTION_API_KEY) {
    throw new Error(
      "NOTION_API_KEY is not configured. Set it in .dev.vars (dev) or Workers secrets (prod).",
    );
  }
  if (!env.NOTION_LIVE_MODE) {
    throw new Error(
      "NOTION_LIVE_MODE is not enabled. Write operations to Notion are disabled.",
    );
  }
}

export function requirePhase21Approval(env: Env): void {
  requireNotion(env);
  if (!env.NOTION_PHASE21_LIVE_APPROVAL) {
    throw new Error(
      "NOTION_PHASE21_LIVE_APPROVAL is not enabled. Phase 21 (live) writes require explicit approval.",
    );
  }
}
