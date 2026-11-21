// src/services/kb/evidence.js
// ============================================================================
// CONTRACT C1 — EVIDENCE TRACING IS MANDATORY.
//
// Every KB ledger row (opportunity, problem, telemetry, brief, decision,
// integration status) carries an `evidence` array. An evidence item is a
// pointer to a real row the claim is based on:
//
//   { table: "product_purchases", id: "<row>", note: "3 sales this week", ts? }
//
// The functions here build and VALIDATE evidence. Validation is what turns
// C1 from a convention into an enforced rule: a row that claims a number but
// cannot point at the data that produced it is rejected (or, for briefs, its
// confidence is capped). Nothing in the KB may be asserted without a source.
// ============================================================================

/** Build a well-formed evidence item. `id` may be null only when `note` is set
 *  and the caller explicitly allows "no-row" evidence (rare). */
export function evidence(table, id, note, ts) {
  const item = { table: String(table || ''), id: id != null ? String(id) : null };
  if (note) item.note = String(note);
  if (ts) item.ts = ts;
  return item;
}

/**
 * Validate an evidence array against a requirement.
 *
 * @param {Array} list   - the evidence array to check
 * @param {object} opts
 * @param {number} opts.min - minimum number of RESOLVED items (table AND id) required
 * @returns {{ valid: boolean, resolved: number, missing: string[], items: Array }}
 */
export function validateEvidence(list, { min = 1 } = {}) {
  const items = Array.isArray(list) ? list : [];
  const resolved = items.filter(
    (e) => e && typeof e === 'object' && e.table && e.id != null
  );
  const missing = min > resolved.length
    ? [`requires >=${min} evidence item(s) with table+id; found ${resolved.length}`]
    : [];
  return {
    valid: missing.length === 0,
    resolved: resolved.length,
    missing,
    items,
  };
}

/**
 * Derive a confidence tier from how much real data backs a claim.
 *   - >=3 resolved evidence rows AND no estimate flags  -> 'high'
 *   - >=1 resolved evidence row                        -> 'medium'
 *   - 0 resolved evidence rows                         -> 'low'
 * This is how "every opportunity references real data" (C2) is enforced:
 * an opportunity with no resolvable evidence can never be trusted.
 *
 * @param {Array} list - evidence items
 * @returns {{ confidence: 'low'|'medium'|'high', resolved: number, reasons: string[] }}
 */
export function confidenceFromEvidence(list) {
  const { resolved } = validateEvidence(list, { min: 0 });
  const hasEstimate =
    Array.isArray(list) && list.some((e) => e && e.estimate === true);
  let confidence;
  const reasons = [];
  if (resolved === 0) {
    confidence = 'low';
    reasons.push('no resolvable evidence rows');
  } else if (resolved < 3 || hasEstimate) {
    confidence = 'medium';
    if (resolved < 3) reasons.push(`${resolved} evidence row(s); need >=3 for high`);
    if (hasEstimate) reasons.push('contains estimate flags');
  } else {
    confidence = 'high';
    reasons.push(`${resolved} evidence rows`);
  }
  return { confidence, resolved, reasons };
}

export default { evidence, validateEvidence, confidenceFromEvidence };
