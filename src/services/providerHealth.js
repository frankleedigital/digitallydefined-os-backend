// src/services/providerHealth.js — part 1/2: checks
import env from '../config/env.js';

async function timedFetch(url, opts = {}, timeoutMs = 12000) {
  const start = Date.now();
  try {
    const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(timeoutMs) });
    return { res, latencyMs: Date.now() - start };
  } catch (err) {
    return { res: null, latencyMs: Date.now() - start, error: err.message || String(err) };
  }
}

function base(status, extra = {}) {
  return { status, latency: null, authenticated: false, reachable: false, availableModels: [], ...extra };
}

export async function checkOmniRoute() {
  const started = Date.now();
  if (!env.omniroute.apiKey || !env.omniroute.baseUrl) {
    return { provider: 'omniroute', ...base('unhealthy'), latency: Date.now() - started, error: 'OMNIROUTE_API_KEY or OMNIROUTE_BASE_URL not configured' };
  }
  const url = String(env.omniroute.baseUrl).replace(/\/+$/, '') + '/models';
  const { res, latencyMs, error } = await timedFetch(url, { headers: { Authorization: 'Bearer ' + env.omniroute.apiKey } });
  if (!res) return { provider: 'omniroute', ...base('unhealthy'), latency: latencyMs, error: error || 'unreachable' };
  if (res.status === 401 || res.status === 403) return { provider: 'omniroute', ...base('unhealthy'), latency: latencyMs, authenticated: false, reachable: true, error: 'auth failed HTTP ' + res.status };
  if (!res.ok) return { provider: 'omniroute', ...base('degraded'), latency: latencyMs, authenticated: true, reachable: true, error: 'HTTP ' + res.status };
  let count = 0;
  try { const d = await res.json(); const l = Array.isArray(d) ? d : d.data || d.models || []; count = Array.isArray(l) ? l.length : 0; } catch { /* noop */ }
  return { provider: 'omniroute', status: 'healthy', latency: latencyMs, authenticated: true, reachable: true, availableModels: [], modelCount: count };
}

export async function checkVertex() {
  const started = Date.now();
  const apiKey = env.gemini.apiKey;
  const model = env.vertex.model || env.gemini.model || 'gemini-3.5-flash';
  if (!apiKey) return { provider: 'vertex-gemini', ...base('unhealthy'), latency: Date.now() - started, error: 'GEMINI_API_KEY not configured' };
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(apiKey);
  const { res, latencyMs, error } = await timedFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: 'ok' }] }] }) }, 20000);
  if (!res) return { provider: 'vertex-gemini', ...base('unhealthy'), latency: latencyMs, error: error || 'unreachable' };
  if (res.status === 400 || res.status === 403) return { provider: 'vertex-gemini', ...base('unhealthy'), latency: latencyMs, authenticated: false, reachable: true, error: 'auth/quota failed HTTP ' + res.status };
  if (!res.ok) return { provider: 'vertex-gemini', ...base('degraded'), latency: latencyMs, authenticated: true, reachable: true, error: 'HTTP ' + res.status };
  return { provider: 'vertex-gemini', status: 'healthy', latency: latencyMs, authenticated: true, reachable: true, availableModels: [model] };
}

export async function checkAgentRouter() {
  const started = Date.now();
  if (!env.agentrouter.apiKey) return { provider: 'agentrouter', ...base('unhealthy'), latency: Date.now() - started, error: 'AGENTROUTER_API_KEY not configured' };
  const url = String(env.agentrouter.baseUrl || 'https://agentrouter.org/v1').replace(/\/+$/, '') + '/models';
  const { res, latencyMs, error } = await timedFetch(url, { headers: { Authorization: 'Bearer ' + env.agentrouter.apiKey } });
  if (!res) return { provider: 'agentrouter', ...base('unhealthy'), latency: latencyMs, error: error || 'unreachable' };
  if (res.status === 401 || res.status === 403) return { provider: 'agentrouter', ...base('unhealthy'), latency: latencyMs, authenticated: false, reachable: true, error: 'auth failed HTTP ' + res.status };
  if (!res.ok) return { provider: 'agentrouter', ...base('degraded'), latency: latencyMs, authenticated: true, reachable: true, error: 'HTTP ' + res.status };
  let models = [];
  try { const d = await res.json(); const l = Array.isArray(d) ? d : d.data || d.models || []; if (Array.isArray(l)) models = l.map((m) => m.id || m.name || m).filter(Boolean).slice(0, 50); } catch { /* noop */ }
  return { provider: 'agentrouter', status: 'healthy', latency: latencyMs, authenticated: true, reachable: true, availableModels: models };
}

export async function checkCheapInference() {
  const started = Date.now();
  if (!env.cheaperInference.apiKey || !env.cheaperInference.baseUrl) return { provider: 'cheap-inference', ...base('unhealthy'), latency: Date.now() - started, error: 'CHEAPER_INFERENCE_* not configured' };
  const url = String(env.cheaperInference.baseUrl).replace(/\/+$/, '') + '/models';
  const { res, latencyMs, error } = await timedFetch(url, { headers: { Authorization: 'Bearer ' + env.cheaperInference.apiKey } });
  if (!res) return { provider: 'cheap-inference', ...base('unhealthy'), latency: latencyMs, error: error || 'unreachable' };
  if (res.status === 401 || res.status === 403) return { provider: 'cheap-inference', ...base('unhealthy'), latency: latencyMs, authenticated: false, reachable: true, error: 'auth failed HTTP ' + res.status };
  if (!res.ok) return { provider: 'cheap-inference', ...base('degraded'), latency: latencyMs, authenticated: true, reachable: true, error: 'HTTP ' + res.status };
  let models = [];
  try { const d = await res.json(); const l = Array.isArray(d) ? d : d.data || d.models || []; if (Array.isArray(l)) models = l.map((m) => m.id || m.name || m).filter(Boolean).slice(0, 50); } catch { /* noop */ }
  return { provider: 'cheap-inference', status: 'healthy', latency: latencyMs, authenticated: true, reachable: true, availableModels: models };
}


/** Run all provider health checks in parallel. */
export async function checkAllProviders() {
  const [omniroute, vertex, agentrouter, cheapInference] = await Promise.all([
    checkOmniRoute().catch((e) => ({ provider: 'omniroute', status: 'unhealthy', error: e.message })),
    checkVertex().catch((e) => ({ provider: 'vertex-gemini', status: 'unhealthy', error: e.message })),
    checkAgentRouter().catch((e) => ({ provider: 'agentrouter', status: 'unhealthy', error: e.message })),
    checkCheapInference().catch((e) => ({ provider: 'cheap-inference', status: 'unhealthy', error: e.message })),
  ]);
  const order = ['omniroute', 'vertex-gemini', 'agentrouter', 'cheap-inference'];
  const byName = { omniroute, 'vertex-gemini': vertex, agentrouter, 'cheap-inference': cheapInference };
  const activeProvider = order.find((p) => byName[p].status === 'healthy') || null;
  return {
    activeProvider,
    providerHealth: byName,
    fallbackOrder: order,
    providerLatencies: Object.fromEntries(order.map((p) => [p, byName[p].latency])),
    currentModel: activeProvider === 'vertex-gemini' ? (env.vertex.model || env.gemini.model || 'gemini-3.5-flash')
      : activeProvider === 'agentrouter' ? env.agentrouter.model
      : activeProvider === 'cheap-inference' ? env.cheaperInference.model
      : activeProvider === 'omniroute' ? (env.omniroute.model || 'auto') : null,
    checkedAt: Date.now(),
  };
}

export async function fetchAgentRouterModels() {
  const health = await checkAgentRouter();
  return { provider: 'agentrouter', status: health.status, models: health.availableModels || [], latency: health.latency, error: health.error || null };
}

export default { checkOmniRoute, checkVertex, checkAgentRouter, checkCheapInference, checkAllProviders, fetchAgentRouterModels };