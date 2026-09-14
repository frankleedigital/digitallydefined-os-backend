/**
 * lib/env.ts
 * Portable environment access for DigitallyDefined OS.
 *
 * Works across runtimes:
 *   - Deno (Supabase Edge Functions):  Deno.env
 *   - Node.js:                          process.env
 *
 * All secrets should be read through this single helper so that:
 *   - lookups are centralized (no scattered Deno.env / process.env calls)
 *   - consumed values are trimmed by default
 *   - a hard failure mode is available for REQUIRED secrets
 */

type EnvLike = {
  get(key: string): string | undefined;
};

/**
 * Return the underlying environment object for whichever runtime is active.
 */
function env(): EnvLike {
  // Deno runtime
  /* @ts-ignore -- Deno is a global in the Deno runtime */
  if (typeof Deno !== "undefined" && Deno.env && typeof Deno.env.get === "function") {
    /* @ts-ignore */
    return Deno.env;
  }
  // Node runtime
  /* @ts-ignore */
  if (typeof process !== "undefined" && process.env) {
    /* @ts-ignore */
    return process.env;
  }
  // Unsupported runtime — return a safe no-op so the app can surface a config error.
  return { get: () => undefined };
}

/**
 * Read a config value. Returns `fallback` (default "") when missing/empty,
 * trimmed of surrounding whitespace.
 */
export function getEnv(key: string, fallback = ""): string {
  const raw = env().get(key);
  if (raw === undefined || raw === null) return fallback;
  const trimmed = String(raw).trim();
  return trimmed === "" ? fallback : trimmed;
}

/**
 * Read a boolean config flag (accepts "true"/"1"/"yes" case-insensitively).
 */
export function getEnvBool(key: string, fallback = false): boolean {
  const raw = getEnv(key, "");
  if (raw === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(raw).toLowerCase());
}

/**
 * Read an integer config value. Returns `fallback` when missing/NaN.
 */
export function getEnvInt(key: string, fallback: number): number {
  const raw = getEnv(key, "");
  if (raw === "") return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * REQUIRED secret accessor — throws a clear ConfigError if the value is unset.
 * Use this for secrets without which the code genuinely cannot run.
 */
export function requireEnv(key: string): string {
  const value = getEnv(key, "");
  if (value === "") {
    throw new Error(`[config] Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Validate that all named secrets are present. Returns the list of missing keys.
 * Useful for a `/health` style probe that must never crash on a missing secret.
 */
export function missingEnv(...keys: string[]): string[] {
  return keys.filter((k) => getEnv(k, "") === "");
}

export default { getEnv, getEnvBool, getEnvInt, requireEnv, missingEnv };