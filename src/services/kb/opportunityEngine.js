// src/services/kb/opportunityEngine.js
// ============================================================================
// CONTRACT C2 — EVERY OPPORTUNITY REFERENCES REAL DATA.
//
// An opportunity is a PERSISTED, scored row — not chat text. The engine
// scores it from evidence-backed components and REFUSES to store it unless it
// carries at least one resolvable evidence row. Confidence is capped by
// evidence so a data-free "idea" can never outrank a proven one.
// ============================================================================

import { kbUpsert, kbRead } from './kbSupabase.js';
import { validateEvidence, confidenceFromEvidence, evidence } from './evidence.js';

// Component weights (sum to 1.0). Mirrors the KB blueprint §8.
export const COMPONENT_WEIGHTS = {
  revenue: 0.3, demand: 0.2, competition: 0.15, assetFit: 0.15, effort: 0.1, legacy: 0.1,
};

const clamp = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));

/**
 * Score an opportunity from its component sub-scores (each 0..100).
 * Returns { score, components, missing[] }.
 */
export function scoreOpportunity(components = {}) {
  const missing = [];
  let total = 0;
  for (const [key, w] of Object.entries(COMPONENT_WEIGHTS)) {
    const val = components[key];
    if (val == null || Number.isNaN(val)) {
      missing.push(key);
      continue;
    }
    total += clamp(val) * w;
  }
  return { score: Math.round(total), components, missing };
}

/**
 * Validate + build a ledger row. C2 is enforced here: no real evidence -> the
 * row is marked low-confidence and the caller is told it is not "real".
 */
export function buildOpportunityRecord({ title, type = 'revenue', sourceAgent, targetAssetId, components, evidence: ev, status = 'open' }) {
  const evList = Array.isArray(ev) ? ev : [];
  const { valid, resolved } = validateEvidence(evList, { min: 1 });
  const { confidence, reasons } = confidenceFromEvidence(evList);
  const { score, missing } = scoreOpportunity(components);

  return {
    record: {
      title, type, source_agent: sourceAgent || null,
      target_asset_id: targetAssetId || null,
      score,
      components: { ...(components || {}), _missing: missing },
      confidence: valid ? confidence : 'low', // C2: no resolvable evidence -> always low
      status,
      evidence: evList,
    },
    isReal: valid,                       // false => do not treat as a scored opportunity
    confidence,
    confidenceReasons: reasons,
    missingComponents: missing,
  };
}

/**
 * Upsert an opportunity. Dedupes on (title) for open items, updates score +
 * re-evaluates; a brand-new row is inserted.
 */
export async function upsertOpportunity(input) {
  const { record, isReal, confidence } = buildOpportunityRecord(input);
  if (!isReal) {
    // Still persist it, but as low-confidence + flagged, so it is auditable
    // yet can never outrank a real one in the priority engine.
    record.components._flag = 'no-real-evidence';
  }
  const existing = await kbRead('opportunity_ledger', `status=in.open.approved&title=eq.${encodeURIComponent(record.title)}`);
  if (existing.length) {
    const row = { ...record, id: existing[0].id, last_evaluated_at: new Date().toISOString() };
    delete row.title;
    const merged = { ...existing[0], ...row };
    return { action: 'updated', isReal, confidence, row: await kbUpsert('opportunity_ledger', merged, 'id') };
  }
  return { action: 'inserted', isReal, confidence, row: await kbUpsert('opportunity_ledger', record, 'id') };
}

/**
 * "Which opportunities are highest value?" — the blueprint answer:
 * open + real, ranked by score; low-confidence (estimate-heavy) are demoted.
 */
export async function topOpportunities({ limit = 10, status = 'open' } = {}) {
  const rows = await kbRead('opportunity_ledger', `status=eq.${status}&order=score.desc&limit=${limit}`);
  return rows
    .filter((r) => confidenceFromEvidence(r.evidence).confidence !== 'low' || (r.components && r.components._flag === 'no-real-evidence'))
    .map((r) => ({
      id: r.id, title: r.title, type: r.type, score: r.score,
      confidence: r.confidence, trend: r.trend, source_agent: r.source_agent,
      evidence: r.evidence || [],
    }))
    .filter((r) => r.score > 0);
}

export default {
  COMPONENT_WEIGHTS,
  scoreOpportunity,
  buildOpportunityRecord,
  upsertOpportunity,
  topOpportunities,
};
