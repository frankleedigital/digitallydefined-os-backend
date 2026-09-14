/**
 * lib/errors.ts
 * Centralized, typed error hierarchy for DigitallyDefined OS.
 *
 * Every thrown error in the new code paths should derive from `AppError` so that
 * edge functions can map errors to HTTP status codes + safe client messages
 * without leaking internal details.
 */

/** Base application error with an optional HTTP status and machine `code`. */
export class AppError extends Error {
  /** HTTP status to surface to the client (default 500). */
  status: number;
  /** Short machine-readable code, e.g. "config", "ai_provider", "validation". */
  code: string;

  constructor(message: string, opts: { status?: number; code?: string; cause?: unknown } = {}) {
    super(message);
    this.name = "AppError";
    this.status = opts.status ?? 500;
    this.code = opts.code ?? "error";
    if (opts.cause !== undefined && this.cause === undefined) {
      /* @ts-ignore */
      this.cause = opts.cause;
    }
  }
}

/** Missing/invalid configuration, missing env secret. */
export class ConfigError extends AppError {
  constructor(message: string, opts: { cause?: unknown } = {}) {
    super(message, { status: 500, code: "config_error", ...opts });
    this.name = "ConfigError";
  }
}

/** Client-supplied input failed validation. */
export class ValidationError extends AppError {
  constructor(message: string, opts: { cause?: unknown } = {}) {
    super(message, { status: 400, code: "validation_error", ...opts });
    this.name = "ValidationError";
  }
}

/** The caller is not authorized (bad/missing API key, wrong scope). */
export class AuthError extends AppError {
  constructor(message = "Unauthorized", opts: { cause?: unknown } = {}) {
    super(message, { status: 401, code: "auth_error", ...opts });
    this.name = "AuthError";
  }
}

/** A resource or route was not found. */
export class NotFoundError extends AppError {
  constructor(message = "Not found", opts: { cause?: unknown } = {}) {
    super(message, { status: 404, code: "not_found", ...opts });
    this.name = "NotFoundError";
  }
}

/** An upstream AI provider failed or timed out. */
export class AiProviderError extends AppError {
  /** The provider that failed, e.g. "omniroute" or "gemini". */
  provider: string;

  constructor(message: string, provider: string, opts: { cause?: unknown } = {}) {
    super(message, { status: 502, code: "ai_provider_error", ...opts });
    this.name = "AiProviderError";
    this.provider = provider;
  }
}

/** A Supabase Postgres REST call failed. */
export class DatabaseError extends AppError {
  constructor(message: string, opts: { cause?: unknown } = {}) {
    super(message, { status: 502, code: "database_error", ...opts });
    this.name = "DatabaseError";
  }
}

/**
 * Map any Error to an `AppError` (idempotent — AppError passes through).
 * Guarantees the caller always receives a typed error with a safe message.
 */
export function toAppError(err: unknown, fallbackMessage = "Internal error"): AppError {
  if (err instanceof AppError) return err;
  const message = err instanceof Error ? (err as Error).message : String(err);
  return new AppError(message || fallbackMessage, { cause: err });
}

/** Extract a short, safe (non-stack) message from any thrown value. */
export function errorMessage(err: unknown): string {
  if (err instanceof Error) return (err as Error).message || "Unknown error";
  return String(err);
}

export default { AppError, ConfigError, ValidationError, AuthError, NotFoundError, AiProviderError, DatabaseError, toAppError, errorMessage };