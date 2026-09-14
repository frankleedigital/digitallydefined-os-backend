/**
 * lib/types.ts
 * Shared primitive types for DigitallyDefined OS.
 * These are intentionally runtime-runtime-agnostic (Deno + Node).
 */

/** A generic JSON object (the common shape of payloads/records throughout the app). */
export type JsonRecord = Record<string, unknown>;

/** A JSON value: null, boolean, number, string, array, or object. */
export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

/** Standard result envelope used by edge functions and services. */
export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  /** Optional provider/model trace for AI-backed responses. */
  provider?: string | null;
  model?: string | null;
  timestamp?: number;
}

/** Pagination contract shared by list endpoints. */
export interface Page<T = unknown> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}