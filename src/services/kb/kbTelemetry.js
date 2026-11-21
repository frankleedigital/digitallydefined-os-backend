// src/services/kb/kbTelemetry.js
// ============================================================================
// CONTRACT C4 — EVERY AGENT RUN RECORDS TELEMETRY.
//
// executeAgent() is the single chokepoint for all agent runs (the Hermes
// orchestrator, the AgentHub, cron, and manual calls all flow through it).
// wrapExecuteAgent() intercepts that function and writes one
// agent_telemetry row per run — success, degraded, or thrown error.
//
// Design rules:
//   - Fire-and-forget: a telemetry write must NEVER block or fail the agent
//     run. On write failure we log and continue.
//   - input_hash: SHA-256 of the input object (privacy + dedupe); the raw
//     input is NOT stored.
//   - outcome: 'success' | 'degraded' | 'error', mapped from the handler.
//   - context_snapshot_id: the KB context snapshot the agent saw, when the
//     caller attached one (set by HermesContextBuilder).
// ============================================================================

import { createHash } from 'node:crypto';
import { kbUpsert, kbRead } from './kbSupabase.js';

const SHA = (s) =>
  createHash('sha256').update(String(s)).digest('hex');

/** Map a raw agent result to a telemetry outcome + error class. */
function classify(result, threw, errMsg) {
  if (threw) return { outcome: 'error', error_class: errMsg ? errMsg.slice(0, 120) : null };
  if (result && result.degraded) return { outcome: 'degraded', error_class: 'degraded-response' };
  if (result && result.error) return { outcome: 'error', error_class: String(result.error).slice(0, 120) };
  return { outcome: 'success', error_class: null };
}

/** Best-effort seed of agent_registry so telemetry's FK always resolves. */
async function ensureAgentRow(agentId, agentMeta = {}) {
  const existing = await kbRead('agent_registry', `id=eq.${encodeURIComponent(agentId)}`);
  if (existing.length) return existing[0];
  await kbUpsert(
    'agent_registry',
    {
      id: agentId,
      display_name: agentMeta.name || agentId,
      capability: agentMeta.capability || null,
      category: agentMeta.category || null,
      description: agentMeta.description || null,
    },
    'id'
  );
  return null;
}

/**
 * Build a telemetry record for one run.
 */
function buildTelemetry(agentId, agent, result, threw, errMsg, startedAt, params, agentMeta) {
  const { outcome, error_class } = classify(result, threw, errMsg);
  const provider = !threw && result ? result.provider || null : null;
  const model = !threw && result ? result.model || null : null;
  const latencyMs =
    !threw && result && Number.isFinite(result.latencyMs)
      ? result.latencyMs
      : Math.round(Date.now() - startedAt);
  return {
    agent_id: agentId,
    invoker: (params && params.invoker) || 'unknown',
    input_hash: SHA(JSON.stringify((params && params.input) || {})),
    model,
    provider,
    outcome,
    error_class,
    latency_ms: latencyMs,
    cost_units: (!threw && result && result.costUnits) || null,
    context_snapshot_id:
      (params && params.contextSnapshotId) ||
      (result && result.contextSnapshotId) ||
      null,
    // C1: even telemetry carries provenance. When no context snapshot is
    // available we record that explicitly rather than leaving it blank.
    evidence:
      (params && params.contextSnapshotId) || (result && result.contextSnapshotId)
        ? [{ table: 'ai_briefs', id: String((params && params.contextSnapshotId) || result.contextSnapshotId), note: 'context snapshot the agent read' }]
        : [{ table: 'agent_telemetry', id: 'run', note: 'no context snapshot attached; run is input-only' }],
  };
}

/**
 * Run an agent handler and ALWAYS write telemetry. The original return value
 * (or thrown error) is preserved, so this is transparent to callers.
 *
 * @param {string} agentId
 * @param {object} agent - registry entry (used to seed agent_registry)
 * @param {Function} run - async () => result  (the real handler call)
 * @param {object} params - caller params (may carry input / contextSnapshotId / invoker)
 */
export async function recordAgentRun(agentId, agent, run, params = {}) {
  const startedAt = Date.now();
  await ensureAgentRow(agentId, agent).catch(() => {});

  let result;
  let threw = false;
  let errMsg;
  try {
    result = await run();
  } catch (err) {
    threw = true;
    errMsg = err && err.message ? err.message : String(err);
    result = null;
  }

  // Fire-and-forget: telemetry must never block or fail the agent.
  const rec = buildTelemetry(agentId, agent, result, threw, errMsg, startedAt, params, agent);
  kbUpsert('agent_telemetry', rec, null).catch((e) => {
    // eslint-disable-next-line no-console
    console.warn(`[kb] telemetry write failed for ${agentId}: ${e.message}`);
  });

  if (threw) throw new Error(errMsg || 'agent run threw');
  return result;
}

export const telemetry = {
  sha: SHA,
  classify,
  buildTelemetry,
  recordAgentRun,
};
export default telemetry;
