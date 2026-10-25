// src/services/aiRouter.js - AI provider routing
// ============================================================================
// PRIMARY:   OmniRoute                 (API gateway - uses your tunnel)
// FALLBACK1: Vertex AI Gemini          (direct Gemini API - GEMINI_API_KEY)
// FALLBACK2: AgentRouter               (OpenAI-compatible - AGENTROUTER_API_KEY)
// FALLBACK3: Cheap Inference           (OpenAI-compatible - CHEAPER_INFERENCE_*)
// FALLBACK4: OpenRouter                (optional - only if OPENROUTER_API_KEY)
// FALLBACK5: Agnes                     (optional - only if AGNES_API_KEY)
// ============================================================================
// Chain: Hermes -> OmniRoute -> Vertex -> AgentRouter -> CheapInference
//        -> OpenRouter -> Agnes -> degraded response.
// A single provider failure NEVER takes Hermes offline.
// ============================================================================
import env from '../config/env.js';
import constants from '../config/constants.js';
import logger from '../utils/logger.js';

const DEFAULT_TIMEOUT = constants.AI_TIMEOUT_MS;

// Model resolution
//
// NOTE: `mode` is accepted for call-site compatibility but is intentionally not
// used to pick a model. Model selection is per-JOB (see JOB_MODELS below), not
// per-mode. Older code assumed mode freeMode/proMode/ultraMode chose the model;
// it never did, so every call silently used env.omniroute.model.
export function resolvePrimaryModel() {
  // Direct Gemini API model — NEVER an OmniRoute omni/* or vertex/* id.
  // gemini-2.5-flash and gemini-2.0-flash are retired by Google (404);
  // gemini-3.5-flash verified live 2026-10-20.
  return env.vertex.model || env.gemini.model || 'gemini-3.5-flash';
}

/** True when `id` is an OmniRoute-routed id that Vertex/Direct APIs cannot use. */
export function isOmniRouteModelId(id) {
  const v = String(id || '').trim();
  // OmniRoute-prefixed ids: omni/*, auto/*, vertex/*, agy/*, bm/*, agentrouter/*,
  // cheaperinference/*, static-best/*, free-stack/*
  if (/^(omni|auto|vertex|agy|bm|agentrouter|cheaperinference|static-best|free-stack)\//i.test(v)) return true;
  // Bare omni/auto keywords (no slash) are also OmniRoute-routed.
  if (/^(omni|auto)\b/i.test(v)) return true;
  // Composite OmniRoute combo ids (no slash): free-stack, free-best, etc.
  if (/^(free-stack|free-best|free-fast|auto-best|auto-cheap|auto-free|static-best)\b/i.test(v)) return true;
  return false;
}

/** Resolve a safe model id for the direct-Gemini fallback path. */
export function resolveVertexModel(requested) {
  const v = String(requested || '').trim();
  if (v && !isOmniRouteModelId(v) && !v.includes('/')) return v;
  return resolvePrimaryModel();
}
export function openrouterModel() {
  return env.openrouter.model || 'openai/gpt-4o-mini';
}
export function agnesModel() {
  return env.agnes.model || 'default';
}

/**
 * Per-job OmniRoute model, chosen for what the job actually needs.
 *
 * These are your gateway combos, so OmniRoute handles the provider selection
 * and failover internally. Each is overridable per-job via JOB_MODEL_OVERRIDES
 * (JSON object) so you can retune one job without touching code.
 *
 *   chat      - conversational coaching, needs a natural voice
 *   reasoning - strategy/analysis, needs depth
 *   coding    - must emit valid complete files
 *   vision    - reads images/screenshots
 *   json      - strict structured output
 *   fast      - short latency-sensitive summaries
 */
export const JOB_MODELS = {
  chat: process.env.AI_MODEL_CHAT || 'auto/best-chat',
  reasoning: process.env.AI_MODEL_REASONING || 'auto/best-reasoning',
  coding: process.env.AI_MODEL_CODING || 'auto/best-coding',
  vision: process.env.AI_MODEL_VISION || 'auto/best-vision',
  json: process.env.AI_MODEL_JSON || 'auto/best-chat',
  fast: process.env.AI_MODEL_FAST || 'auto/best-fast',
  fallback: process.env.AI_MODEL_FALLBACK || 'auto/best-free',
};

export const JOB_TYPES = Object.keys(JOB_MODELS);

/** Resolve the OmniRoute model id for a job type. */
export function resolveJobModel(job) {
  const key = JOB_TYPES.includes(job) ? job : 'chat';
  return JOB_MODELS[key] || JOB_MODELS.chat;
}

// Provider availability
export function isVertexConfigured() {
  return !!(env.gemini.apiKey && env.gemini.apiKey.length > 0);
}
export function isOpenRouterConfigured() {
  return !!(env.openrouter.apiKey && env.openrouter.apiKey.length > 0);
}
export function isAgentRouterConfigured() {
  return !!(env.agentrouter.apiKey && env.agentrouter.apiKey.length > 0);
}
export function isCheapInferenceConfigured() {
  return !!(env.cheaperInference.apiKey && env.cheaperInference.baseUrl);
}
export function agentRouterModel() {
  return env.agentrouter.model || 'auto';
}
export function cheapInferenceModel() {
  return env.cheaperInference.model || 'auto';
}
export function isAgnesConfigured() {
  return !!(env.agnes.apiKey && env.agnes.baseUrl);
}
export function isOmniRouteConfigured() {
  // OmniRoute is enabled when API key and base URL are provided.
  return !!(env.omniroute.apiKey && env.omniroute.baseUrl && env.omniroute.baseUrl.length > 0);
}

// Shared helpers
async function withTimeout(timeoutMs, fn) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fn(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

function failed(provider, error) {
  return { reply: '', provider, model: null, error };
}

// FALLBACK1: Vertex AI Gemini — direct Google Generative Language API.
// NEVER receives OmniRoute ids (omni/*, auto/*, vertex/*); they are
// sanitized via resolveVertexModel(). Independent of OmniRoute.
export async function callVertexGemini(model, prompt, options = {}) {
  const { systemPrompt, jsonMode, timeout = DEFAULT_TIMEOUT } = options;
  const apiKey = env.gemini.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
  if (!apiKey) return failed('vertex-gemini', 'GEMINI_API_KEY not configured');

  const modelId = resolveVertexModel(model);
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(modelId) + ':generateContent';

  const body = {
    contents: [{ role: 'user', parts: [{ text: String(prompt).trim() }] }],
  };
  if (systemPrompt) body.systemInstruction = { parts: [{ text: systemPrompt }] };
  if (jsonMode) body.generationConfig = { responseMimeType: 'application/json' };

  try {
    const response = await withTimeout(timeout, (signal) => fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal,
    }));
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return failed('vertex-gemini', 'Vertex Gemini error: ' + response.status + ' ' + errText.slice(0, 200));
    }
    const data = await response.json();
    const parts = data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts;
    const reply = Array.isArray(parts) ? parts.map((p) => p.text || '').join('') : '';
    if (!reply) return failed('vertex-gemini', 'Vertex Gemini returned an empty response');
    return { reply, provider: 'vertex-gemini', model: modelId, error: null };
  } catch (error) {
    if (error.name === 'AbortError') return failed('vertex-gemini', 'Vertex Gemini request timed out');
    return failed('vertex-gemini', 'Vertex Gemini request failed: ' + (error.message || String(error)));
  }
}

// FALLBACK2: AgentRouter (OpenAI-compatible chat/completions).
// Credentials: AGENTROUTER_API_KEY (+ optional AGENTROUTER_BASE_URL,
// AGENTROUTER_MODEL). Independent of OmniRoute.
export async function callAgentRouter(model, prompt, options = {}) {
  const { systemPrompt, jsonMode, timeout = DEFAULT_TIMEOUT } = options;
  if (!isAgentRouterConfigured()) return failed('agentrouter', 'AGENTROUTER_API_KEY not configured');

  const modelId = model && !isOmniRouteModelId(model) ? model : agentRouterModel();
  const baseUrl = String(env.agentrouter.baseUrl || 'https://agentrouter.org/v1').replace(/\/+$/, '');
  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: String(prompt).trim() });
  const body = { model: modelId, messages, stream: false };
  if (jsonMode) body.response_format = { type: 'json_object' };

  try {
    const response = await withTimeout(timeout, (signal) => fetch(baseUrl + '/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + env.agentrouter.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal,
    }));
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return failed('agentrouter', 'AgentRouter error: ' + response.status + ' ' + errText.slice(0, 200));
    }
    const data = await response.json();
    const reply = data && data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '';
    if (!reply) return failed('agentrouter', 'AgentRouter returned an empty response');
    return { reply, provider: 'agentrouter', model: data.model || modelId, error: null };
  } catch (error) {
    if (error.name === 'AbortError') return failed('agentrouter', 'AgentRouter request timed out');
    return failed('agentrouter', 'AgentRouter request failed: ' + (error.message || String(error)));
  }
}

// FALLBACK3: Cheap Inference (OpenAI-compatible chat/completions).
// Credentials: CHEAPER_INFERENCE_API_KEY + CHEAPER_INFERENCE_BASE_URL
// (+ optional CHEAPER_INFERENCE_MODEL). Independent of OmniRoute.
export async function callCheapInference(model, prompt, options = {}) {
  const { systemPrompt, jsonMode, timeout = DEFAULT_TIMEOUT } = options;
  if (!isCheapInferenceConfigured()) return failed('cheap-inference', 'CHEAPER_INFERENCE_API_KEY or CHEAPER_INFERENCE_BASE_URL not configured');

  const modelId = model && !isOmniRouteModelId(model) ? model : cheapInferenceModel();
  const baseUrl = String(env.cheaperInference.baseUrl).replace(/\/+$/, '');
  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: String(prompt).trim() });
  const body = { model: modelId, messages, stream: false };
  if (jsonMode) body.response_format = { type: 'json_object' };

  try {
    const response = await withTimeout(timeout, (signal) => fetch(baseUrl + '/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + env.cheaperInference.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal,
    }));
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return failed('cheap-inference', 'Cheap Inference error: ' + response.status + ' ' + errText.slice(0, 200));
    }
    const data = await response.json();
    const reply = data && data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '';
    if (!reply) return failed('cheap-inference', 'Cheap Inference returned an empty response');
    return { reply, provider: 'cheap-inference', model: data.model || modelId, error: null };
  } catch (error) {
    if (error.name === 'AbortError') return failed('cheap-inference', 'Cheap Inference request timed out');
    return failed('cheap-inference', 'Cheap Inference request failed: ' + (error.message || String(error)));
  }
}

// FALLBACK 4: OpenRouter (OpenAI-compatible chat/completions)
export async function callOpenRouter(model, prompt, options = {}) {
  const { systemPrompt, jsonMode, timeout = DEFAULT_TIMEOUT } = options;
  if (!isOpenRouterConfigured()) return failed('openrouter', 'OPENROUTER_API_KEY not configured');

  const modelId = model || openrouterModel();
  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: String(prompt).trim() });
  const body = { model: modelId, messages, stream: false };
  if (jsonMode) body.response_format = { type: 'json_object' };

  try {
    const response = await withTimeout(timeout, (signal) => fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + env.openrouter.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal,
    }));
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return failed('openrouter', 'OpenRouter error: ' + response.status + ' ' + errText.slice(0, 200));
    }
    const data = await response.json();
    const reply = data && data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '';
    if (!reply) return failed('openrouter', 'OpenRouter returned an empty response');
    return { reply, provider: 'openrouter', model: data.model || modelId, error: null };
  } catch (error) {
    if (error.name === 'AbortError') return failed('openrouter', 'OpenRouter request timed out');
    return failed('openrouter', 'OpenRouter request failed: ' + (error.message || String(error)));
  }
}

// FALLBACK 2: Agnes (OpenAI-compatible chat/completions)
export async function callAgnes(model, prompt, options = {}) {
  const { systemPrompt, jsonMode, timeout = DEFAULT_TIMEOUT } = options;
  if (!isAgnesConfigured()) return failed('agnes', 'AGNES_API_KEY or AGNES_BASE_URL not configured');

  const modelId = model || agnesModel();
  const baseUrl = String(env.agnes.baseUrl).replace(/\/+$/, '');
  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: String(prompt).trim() });
  const body = { model: modelId, messages, stream: false };
  if (jsonMode) body.response_format = { type: 'json_object' };

  try {
    const response = await withTimeout(timeout, (signal) => fetch(baseUrl + '/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + env.agnes.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal,
    }));
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return failed('agnes', 'Agnes error: ' + response.status + ' ' + errText.slice(0, 200));
    }
    const data = await response.json();
    const reply = data && data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '';
    if (!reply) return failed('agnes', 'Agnes returned an empty response');
    return { reply, provider: 'agnes', model: data.model || modelId, error: null };
  } catch (error) {
    if (error.name === 'AbortError') return failed('agnes', 'Agnes request timed out');
    return failed('agnes', 'Agnes request failed: ' + (error.message || String(error)));
  }
}

// Active OmniRoute call — uses env.omniroute.baseUrl + Bearer token.
export async function callOmniRoute(model, prompt, options = {}) {
  const { systemPrompt, jsonMode, timeout = DEFAULT_TIMEOUT } = options;
  const { baseUrl, apiKey, model: defaultModel } = env.omniroute;
  if (!apiKey || !baseUrl) return failed('omniroute', 'OMNIROUTE_API_KEY or OMNIROUTE_BASE_URL not configured');

  const modelId = model || defaultModel || 'auto';
  const messages = buildMessages(prompt, systemPrompt);

  try {
    const response = await withTimeout(timeout, (signal) => fetch(baseUrl + '/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        messages,
        stream: false,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
      signal,
    }));

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return failed('omniroute', 'OmniRoute error: ' + response.status + ' ' + errText.slice(0, 200));
    }

    const data = await response.json();
    const reply = data && data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : '';
    return { reply, provider: 'omniroute', model: data.model || modelId, error: null };
  } catch (error) {
    if (error.name === 'AbortError') return failed('omniroute', 'OmniRoute request timed out');
    return failed('omniroute', 'OmniRoute request failed: ' + (error.message || String(error)));
  }
}

function buildMessages(prompt, systemPrompt) {
  return [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    { role: 'user', content: String(prompt).trim() },
  ];
}

// Unified routing: OmniRoute (primary) -> Vertex Gemini -> AgentRouter
// -> Cheap Inference -> OpenRouter -> Agnes -> error
//
// `options.job` selects the OmniRoute model (see JOB_MODELS). An explicit
// `model` argument still wins for OmniRoute, but is NEVER leaked into
// providers that cannot resolve OmniRoute ids (Vertex sanitizes via
// resolveVertexModel(); AgentRouter/CheapInference fall back to their own
// configured models when given an OmniRoute id).
//
// Every attempt is logged with [HERMES]/[OMNIROUTE]/[VERTEX]/[AGENTROUTER]/
// [CHEAP-INFERENCE] tags including provider, model, latency, status, error
// and fallback reason. Nothing is hidden.
export async function generate(model, prompt, options = {}) {
  const job = options.job || 'chat';
  const omnirouteModel = model || resolveJobModel(job);
  const t0 = Date.now();
  const tag = (p) => '[' + String(p).toUpperCase().replace(/[^A-Z]+/g, '-') + ']';
  console.log('[HERMES] generate start', JSON.stringify({ job, requestedModel: model || null, omnirouteModel, ts: new Date().toISOString() }));
  const attempts = [];

  // PRIMARY: OmniRoute (when configured)
  if (isOmniRouteConfigured()) {
    attempts.push({ name: 'omniroute', model: omnirouteModel, fn: () => callOmniRoute(omnirouteModel, prompt, options) });
  } else {
    console.log('[HERMES] skip omniroute (not configured)');
  }

  // FALLBACK1: Vertex Gemini (when configured) — sanitized model, independent.
  if (isVertexConfigured()) {
    attempts.push({ name: 'vertex-gemini', model: resolveVertexModel(omnirouteModel), fn: () => callVertexGemini(omnirouteModel, prompt, options) });
  } else {
    console.log('[HERMES] skip vertex-gemini (GEMINI_API_KEY not configured)');
  }

  // FALLBACK2: AgentRouter (when configured)
  if (isAgentRouterConfigured()) {
    attempts.push({ name: 'agentrouter', model: agentRouterModel(), fn: () => callAgentRouter(null, prompt, options) });
  } else {
    console.log('[HERMES] skip agentrouter (AGENTROUTER_API_KEY not configured)');
  }

  // FALLBACK3: Cheap Inference (when configured)
  if (isCheapInferenceConfigured()) {
    attempts.push({ name: 'cheap-inference', model: cheapInferenceModel(), fn: () => callCheapInference(null, prompt, options) });
  } else {
    console.log('[HERMES] skip cheap-inference (CHEAPER_INFERENCE_* not configured)');
  }

  // FALLBACK4: OpenRouter (when configured)
  if (isOpenRouterConfigured()) {
    attempts.push({ name: 'openrouter', fn: () => callOpenRouter(openrouterModel(), prompt, options) });
  }

  // FALLBACK5: Agnes (when configured)
  if (isAgnesConfigured()) {
    attempts.push({ name: 'agnes', fn: () => callAgnes(agnesModel(), prompt, options) });
  }

  const attemptErrors = [];
  let lastError = null;
  for (const attempt of attempts) {
    const start = Date.now();
    try {
      const result = await attempt.fn();
      const latencyMs = Date.now() - start;
      if (!result.error) {
        console.log(tag(attempt.name) + ' OK', JSON.stringify({ provider: attempt.name, model: result.model, latencyMs, status: 'ok' }));
        logger.info('AI provider succeeded', { provider: attempt.name, model: result.model, latencyMs });
        result.latencyMs = latencyMs;
        result.attempts = attempts.map((a) => a.name);
        result.attemptErrors = attemptErrors;
        result.totalLatencyMs = Date.now() - t0;
        return result;
      }
      lastError = result.error;
      attemptErrors.push(attempt.name + ': ' + result.error);
      console.log(tag(attempt.name) + ' FAIL', JSON.stringify({ provider: attempt.name, model: result.model || attempt.model || null, latencyMs, status: 'failed', error: result.error, fallbackReason: 'trying next provider' }));
      logger.warn('AI provider failed, trying next', { provider: attempt.name, error: result.error, latencyMs });
    } catch (error) {
      const latencyMs = Date.now() - start;
      lastError = error.message || String(error);
      attemptErrors.push(attempt.name + ' threw: ' + lastError);
      console.log(tag(attempt.name) + ' THREW', JSON.stringify({ provider: attempt.name, latencyMs, status: 'threw', error: lastError, fallbackReason: 'trying next provider' }));
      logger.warn('AI provider threw, trying next', { provider: attempt.name, error: lastError, latencyMs });
    }
  }

  const error = 'All AI providers failed. Last error: ' + (lastError || 'no provider available');
  console.log('[HERMES] EXHAUSTED', JSON.stringify({ job, attempts: attempts.map((a) => a.name), attemptErrors, totalLatencyMs: Date.now() - t0 }));
  logger.error('AI routing exhausted', { error, job, attemptErrors });
  return { reply: '', provider: null, model: null, error, attemptErrors, attempts: attempts.map((a) => a.name) };
}

// Diagnostics
export function providerOrder() {
  const order = [];
  if (isOmniRouteConfigured()) order.push('omniroute');
  if (isVertexConfigured()) order.push('vertex-gemini');
  if (isAgentRouterConfigured()) order.push('agentrouter');
  if (isCheapInferenceConfigured()) order.push('cheap-inference');
  if (isOpenRouterConfigured()) order.push('openrouter');
  if (isAgnesConfigured()) order.push('agnes');
  return order;
}

export function fallbackChain(mode) {
  return providerOrder().slice(1).map((p) => ({ provider: p, model: resolveModel(p, mode) }));
}

export function resolveModel(provider, mode) {
  if (provider === 'omniroute') return env.omniroute.model || 'auto';
  if (provider === 'vertex-gemini' || !provider) return resolvePrimaryModel(mode);
  if (provider === 'agentrouter') return agentRouterModel();
  if (provider === 'cheap-inference') return cheapInferenceModel();
  if (provider === 'openrouter') return openrouterModel();
  if (provider === 'agnes') return agnesModel();
  return resolvePrimaryModel(mode);
}

export function describeRouting() {
  return {
    primary: isOmniRouteConfigured() ? 'omniroute' : (isVertexConfigured() ? 'vertex-gemini' : null),
    fallbackOrder: providerOrder().slice(1),
    omniroute: isOmniRouteConfigured(),
    omnirouteUrl: env.omniroute.baseUrl || null,
    omnirouteModel: env.omniroute.model || 'auto',
    vertex: isVertexConfigured(),
    vertexModel: resolvePrimaryModel(),
    vertexProjectId: env.vertex.projectId || null,
    vertexLocation: env.vertex.location,
    agentrouter: isAgentRouterConfigured(),
    agentrouterModel: agentRouterModel(),
    cheapInference: isCheapInferenceConfigured(),
    cheapInferenceModel: cheapInferenceModel(),
    fallbacks: providerOrder().slice(1),
  };
}

export function logRouting() {
  const info = describeRouting();
  logger.info('AI routing configured', info);
  if (info.primary === 'omniroute') {
    console.log('[aiRouter] PRIMARY  -> omniroute (' + info.omnirouteModel + ') at ' + info.omnirouteUrl);
  } else {
    console.log('[aiRouter] PRIMARY  -> vertex-gemini (' + info.vertexModel + ')');
  }
  console.log('[aiRouter] FALLBACK -> ' + (info.fallbacks.length ? info.fallbacks.join(' -> ') : 'none configured'));
  return info;
}

export const aiRouter = {
  generate,
  callVertexGemini,
  callAgentRouter,
  callCheapInference,
  callOpenRouter,
  callAgnes,
  callOmniRoute,
  isVertexConfigured,
  isAgentRouterConfigured,
  isCheapInferenceConfigured,
  isOpenRouterConfigured,
  isAgnesConfigured,
  isOmniRouteConfigured,
  isOmniRouteModelId,
  resolveVertexModel,
  resolvePrimaryModel,
  providerOrder,
  resolveModel,
  fallbackChain,
  describeRouting,
  logRouting,
};

export default aiRouter;