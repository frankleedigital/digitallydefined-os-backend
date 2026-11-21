// src/services/kb/problemTracker.js
// ============================================================================
// CONTRACT C3 — EVERY PROBLEM REFERENCES A REAL SOURCE.
//
// A problem is a fault attached to a concrete row: source_table + source_id.
// Without both, it cannot be tracked, deduped, or verified as resolved, so
// the tracker rejects it. This is what makes "detect problems" a monitoring
// system instead of the LLM imagining issues.
// ============================================================================

import { kbUpsert, kbRead } from './kbSupabase.js';
import { validateEvidence } from './evidence.js';

const SEVERITY_ORDER = { P0: 0, P1: 1, P2: 2 };

/**
 * Validate + build a problem record. C3 enforced: source_table AND source_id
 * are mandatory. Evidence is checked but a problem can exist with a source
 * even before a supporting evidence row is attached.
 */
export function buildProblemRecord({
  domain = 'integration', title, severity = 'P2',
  source_table, source_id, owner, status = 'open',
  mitigation, evidence: ev,
}) {
  const errors = [];
  if (!source_table) errors.push('source_table is required (C3)');
  if (source_id == null || source_id === '') errors.push('source_id is required (C3)');
  if (!title) errors.push('title is required');
  const evList = Array.isArray(ev) ? ev : [];
  const { valid } = validateEvidence(evList, { min: 0 });
  if (!valid && evList.length === 0 && errors.length === 0) {
    errors.push('at least one of source_table/source_id or an evidence item is required');
  }
  return {
    record: {
      domain, title, severity,
      source_table: source_table || null,
      source_id: source_id != null ? String(source_id) : null,
      owner: owner || null,
      status,
      mitigation: mitigation || [],
      evidence: evList,
    },
    errors,
    ok: errors.length === 0,
  };
}

/**
 * Upsert a problem. Dedupes on (source_table, source_id) so the same fault
 * never creates duplicate rows; re-opening updates status instead.
 */
export async function upsertProblem(input) {
  const { record, errors, ok } = buildProblemRecord(input);
  if (!ok) return { ok: false, errors, row: null };
  const existing = await kbRead(
    'problem_ledger',
    `source_table=eq.${encodeURIComponent(record.source_table)}&source_id=eq.${encodeURIComponent(record.source_id)}`
  );
  if (existing.length) {
    const merged = { ...existing[0], ...record, id: existing[0].id };
    return { ok: true, action: 'updated', row: await kbUpsert('problem_ledger', merged, 'id') };
  }
  return { ok: true, action: 'inserted', row: await kbUpsert('problem_ledger', record, 'id') };
}

/**
 * "What is broken?" — open/mitigating problems, P0 first.
 */
export async function openProblems({ limit = 25 } = {}) {
  const rows = await kbRead('problem_ledger', `status=in.open.mitigating&limit=${limit}`);
  return rows
    .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9))
    .map((p) => ({
      id: p.id, title: p.title, domain: p.domain, severity: p.severity,
      source_table: p.source_table, source_id: p.source_id,
      status: p.status, owner: p.owner, evidence: p.evidence || [],
    }));
}

export default { buildProblemRecord, upsertProblem, openProblems };
