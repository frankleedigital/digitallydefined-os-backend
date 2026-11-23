// src/services/kb/decisionLog.js
// ============================================================================
// CONTRACT C5 — EVERY RECOMMENDATION IS AUDITABLE.
//
// A decision record ties a recommendation to what it targets (ref_type +
// ref_id), who recommended it, its lifecycle status, the evidence behind it,
// and — on closure — the OUTCOME. That outcome loop is what lets the priority
// engine learn which recommendations actually paid off.
// ============================================================================

import { kbInsert, kbUpsert, kbRead } from './kbSupabase.js';
import { validateEvidence } from './evidence.js';

const TRANSITIONS = {
  pending: ['approved', 'rejected'],
  approved: ['executed', 'rejected'],
  executed: ['closed', 'rolled-back'],
  'rolled-back': ['closed'],
  rejected: ['closed'],
  closed: [],
};

/**
 * Record a decision (create). Validates evidence per C1.
 */
export async function recordDecision(input) {
  const { summary, kind = 'recommendation', recommendedBy = 'hermes',
    refType = null, refId = null, evidence: ev = [], status = 'pending', outcome = null } = input;
  if (!summary) return { ok: false, error: 'summary is required', row: null };
  const evList = Array.isArray(ev) ? ev : [];
  const { valid } = validateEvidence(evList, { min: 0 });
  const row = await kbInsert('decision_log', {
    kind, summary, recommended_by: recommendedBy,
    status, ref_type: refType, ref_id: refId ? String(refId) : null,
    outcome, evidence: evList,
  });
  return { ok: !!row, validEvidence: valid, row };
}

/**
 * Advance a decision's lifecycle (e.g. pending -> approved -> executed ->
 * closed). Records the outcome + closed_at so the audit trail is complete.
 */
export async function updateDecision(id, { status, outcome } = {}) {
  const rows = await kbRead('decision_log', `id=eq.${encodeURIComponent(id)}`);
  if (!rows.length) return { ok: false, error: 'decision not found', row: null };
  const cur = rows[0];
  if (status && !TRANSITIONS[cur.status] && cur.status !== status) {
    // allow explicit same-status no-op but guard illegal jumps
    if (!TRANSITIONS[cur.status] || !TRANSITIONS[cur.status].includes(status)) {
      return { ok: false, error: `illegal transition ${cur.status} -> ${status}`, row: cur };
    }
  }
  const patch = { ...cur, id: cur.id };
  if (status) patch.status = status;
  if (outcome != null) patch.outcome = outcome;
  if (status && ['closed', 'executed', 'rolled-back', 'rejected'].includes(status)) {
    patch.closed_at = new Date().toISOString();
  }
  const row = await kbUpsert('decision_log', patch, 'id');
  return { ok: !!row, row };
}

/**
 * Open (pending/approved/executed) decisions — used by the priority engine to
 * suppress re-recommending work that is already in flight.
 */
export async function openDecisions({ limit = 50 } = {}) {
  return kbRead('decision_log', `status=in.pending.approved.executed&limit=${limit}`);
}

/**
 * Did this ref ever get approved + executed? (feeds "work already in flight")
 */
export async function isInFlight(refType, refId) {
  if (!refType || refId == null) return false;
  const rows = await kbRead('decision_log', `ref_type=eq.${encodeURIComponent(refType)}&ref_id=eq.${encodeURIComponent(String(refId))}`);
  return rows.some((r) => ['approved', 'executed'].includes(r.status));
}

export default { recordDecision, updateDecision, openDecisions, isInFlight };
