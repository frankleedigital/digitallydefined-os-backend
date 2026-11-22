// src/services/kb/priorityEngine.js
// ============================================================================
// "WHAT SHOULD I WORK ON TODAY?" — deterministic arbitration over the KB.
// Does NOT invent priorities; it ranks the open ledgers + in-flight work
// using the COO decision framework (blueprint §10).
// ============================================================================

import { openProblems } from './problemTracker.js';
import { topOpportunities } from './opportunityEngine.js';
import { openDecisions } from './decisionLog.js';

const SEV = { P0: 1.0, P1: 0.6, P2: 0.2 };

// Blueprint §10 weights (normalized).
const W = { severity: 0.4, opportunityValue: 0.25, assetCreation: 0.15, reach: 0.1, urgency: 0.1, effort: 0.1 };

function urgencyOf(item) {
  if (item.severity === 'P0') return 1.0;
  if (item.expiring) return 0.9;
  if (item.trend === 'decay') return 0.7;
  return item.severity === 'P1' ? 0.5 : 0.2;
}

/** Rank open items into today's work list + ignore list. */
export function computePriorities({ problems = [], opportunities = [], inFlight = [] } = {}) {
  const candidates = [];

  for (const p of problems) {
    if (inFlight.some((d) => d.ref_type === 'problem' && d.ref_id === p.id)) continue;
    const score =
      (W.severity * SEV[p.severity]) +
      (W.urgency * urgencyOf(p)) +
      (W.effort * 0.5); // problems are usually low-effort to mitigate
    candidates.push({
      kind: 'problem', id: p.id, title: p.title, severity: p.severity,
      domain: p.domain, source: `${p.source_table}/${p.source_id}`,
      owner_agent: p.owner || null, priority_score: Math.round(score * 100),
      evidence: p.evidence || [],
    });
  }

  for (const o of opportunities) {
    if (o.confidence === 'low') continue; // C2: estimates can't beat proven faults
    if (inFlight.some((d) => d.ref_type === 'opportunity' && d.ref_id === o.id)) continue;
    const score =
      (W.opportunityValue * (o.score || 0) / 100) +
      (W.urgency * urgencyOf(o)) +
      (W.effort * 0.3);
    candidates.push({
      kind: 'opportunity', id: o.id, title: o.title, type: o.type,
      confidence: o.confidence, score: o.score,
      owner_agent: o.source_agent || null,
      priority_score: Math.round(score * 100),
      evidence: o.evidence || [],
    });
  }

  // P0 problems always take the top slot regardless of computed score.
  candidates.sort((a, b) => {
    if (a.kind === 'problem' && a.severity === 'P0' && b.kind !== 'problem') return -1;
    if (b.kind === 'problem' && b.severity === 'P0' && a.kind !== 'problem') return 1;
    return b.priority_score - a.priority_score;
  });

  const priorities = candidates.slice(0, 3).map((c) => ({
    ...c,
    why_now: c.kind === 'problem'
      ? `Sev ${c.severity} fault on ${c.source}`
      : `Score ${c.score} (${c.type}); confidence ${c.confidence}`,
  }));

  // "What to ignore" — decaying or very-low items that did not make the cut.
  const ignored = opportunities
    .filter((o) => o.confidence === 'low' || o.trend === 'decay')
    .map((o) => ({ kind: 'opportunity', id: o.id, title: o.title, reason: o.trend === 'decay' ? 'decaying' : 'low-confidence (estimate-heavy)' }));

  return { priorities, ignored, candidates_count: candidates.length, computedAt: new Date().toISOString() };
}

/**
 * Run the full pipeline against the KB and return today's priorities.
 */
export async function determineToday({ limit = 10 } = {}) {
  const [problems, opps, decisions] = await Promise.all([
    openProblems({ limit: 25 }),
    topOpportunities({ limit }),
    openDecisions({ limit: 50 }),
  ]);
  const result = computePriorities({ problems, opportunities: opps, inFlight: decisions });
  return result;
}

export default { computePriorities, determineToday };
