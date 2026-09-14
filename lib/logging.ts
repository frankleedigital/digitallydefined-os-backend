/**
 * lib/logging.ts
 * Centralized, structured logging for DigitallyDefined OS.
 *
 * Goals:
 *   - One place to tune verbosity / destinations.
 *   - Consistent JSON-ish structured lines for tracing across the dashboard.
 *   - Safety: never throw from a logger.
 */
import { getEnv } from "./env.ts";

const LEVELS = ["debug", "info", "warn", "error"] as const;
type Level = (typeof LEVELS)[number];

/** The minimum level that actually emits to the console. Env: LOG_LEVEL (default "info"). */
function minLevel(): Level {
  const raw = getEnv("LOG_LEVEL", "info").toLowerCase();
  return LEVELS.includes(raw as Level) ? (raw as Level) : "info";
}

function levelRank(level: Level): number {
  return LEVELS.indexOf(level);
}

/** Render a single structured log line. */
function line(level: Level, message: string, meta?: Record<string, unknown>): void {
  if (levelRank(level) < levelRank(minLevel())) return;
  const record: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level,
    msg: message,
  };
  if (meta && typeof meta === "object") {
    for (const [k, v] of Object.entries(meta)) {
      if (v !== undefined && v !== null) record[k] = v;
    }
  }
  const text = JSON.stringify(record);
  if (level === "error") console.error(text);
  else if (level === "warn") console.warn ? console.warn(text) : console.log(text);
  else console.log(text);
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => line("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>) => line("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => line("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => line("error", message, meta),
  /** Convenience: log an arbitrary thrown value with a stable shape. */
  errorFrom: (label: string, err: unknown) =>
    line("error", label, { error: err instanceof Error ? err.message : String(err) }),
};

export default logger;