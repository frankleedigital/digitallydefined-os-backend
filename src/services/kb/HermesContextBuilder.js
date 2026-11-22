// src/services/kb/HermesContextBuilder.js
// ============================================================================
// HERMES CONTEXT BUILDER — the single aggregator that finally gives every
// agent live business context (the "AI can't see the business" root fix).
//
// buildContext(scope) pulls LIVE rows from the KB and returns ONE object:
//   { scope, revenue, integrations, automations, customer, signals, sops,
//     openOpportunities, openProblems, dataGaps, snapshotId, assembledAt }
//
// Design rules:
//   - PULL, DON'T INFER: every section is real rows. Nothing is generated.
//   - EVIDENCE TRACED: revenue figures carry their source table + row ids (C1).
//   - DATA GAPS EXPLICIT: a missing/empty section becomes a dataGaps entry,
//     so downstream agents can never silently fill the void with numbers.
//   - GRACEFUL: if Supabase is not configured, sections come back empty and
//     a gap is recorded instead of throwing.
// ============================================================================

import { kbRead } from './kbSupabase.js';
import { evidence } from './evidence.js';

/** Revenue aggregation over product_registry + product_purchases. */
async function buildRevenue() {
  const products = await kbRead('product_registry');
  const purchases = await kbRead('product_purchases', 'limit=500');
  const byProduct = new Map();
  for (const p of purchases) {
    const key = p.product_name || 'unknown';
    const agg = byProduct.get(key) || { count: 0, revenue_cents: 0, last_sale_at: null, purchase_ids: [] };
    if (p.status === 'completed' || p.status === 'delivered') {
      agg.count += 1;
      agg.revenue_cents += Math.round((Number(p.product_price) || 0) * 100);
    }
    if (p.created_at && (!agg.last_sale_at || p.created_at > agg.last_sale_at)) {
      agg.last_sale_at = p.created_at;
    }
    if (agg.purchase_ids.length < 10) agg.purchase_ids.push(String(p.id));
    byProduct.set(key, agg);
  }
  const productsOut = products.map((pr) => {
    const agg = byProduct.get(pr.name);
    return {
      id: pr.id,
      slug: pr.slug,
      name: pr.name,
      status: pr.status,
      price_cents: pr.price_cents,
      sales_30d: agg ? agg.count : 0,
      revenue_cents_30d: agg ? agg.revenue_cents : 0,
      last_sale_at: pr.last_sale_at || (agg && agg.last_sale_at) || null,
      dormant_days: pr.last_sale_at ? Math.floor((Date.now() - new Date(pr.last_sale_at).getTime()) / 86400000) : null,
    };
  });
  // C1: trace each product's revenue to its purchase rows (or record the gap).
  const evidenceItems = [];
  for (const p of productsOut) {
    const row = byProduct.get(p.name);
    const ev = row && row.purchase_ids.length
      ? row.purchase_ids.map((id) => evidence('product_purchases', id, `sale of ${p.name}`))
      : [{ table: 'product_registry', id: p.id, note: 'no purchases recorded; revenue = 0', estimate: false }];
    p.evidence = ev;
    evidenceItems.push(...ev);
  }
  const totalRevenue = [...byProduct.values()].reduce((s, a) => s + a.revenue_cents, 0);
  return { products: productsOut, total_revenue_cents: totalRevenue, evidence: evidenceItems };
}

/** Integration health — only non-healthy systems are surfaced to stay compact. */
async function buildIntegrations() {
  const rows = await kbRead('integration_status');
  return rows
    .filter((r) => (r.auth_state && r.auth_state !== 'connected') || r.publisher_wired === false)
    .map((r) => ({
      id: r.id,
      system: r.system,
      auth_state: r.auth_state,
      publisher_wired: r.publisher_wired,
      expires_at: r.expires_at,
      last_checked_at: r.last_checked_at,
      evidence: r.evidence || [],
    }));
}

/** Automation health — real, from automation_status (no more fake panel). */
async function buildAutomations() {
  const rows = await kbRead('automation_status');
  return rows
    .filter((r) => r.last_status === 'failed' || r.health === 'failing' || r.health === 'degraded')
    .map((r) => ({
      id: r.id,
      worker_id: r.worker_id,
      last_status: r.last_status,
      health: r.health,
      last_error: r.last_error,
      last_run_at: r.last_run_at,
      evidence: r.evidence || [],
    }));
}

/** Customer slice — leads + their quiz persona (privacy: no raw PII). */
async function buildCustomer(scope) {
  const leadRows = await kbRead('website_leads', 'limit=50');
  const roadmaps = scope && scope.email
    ? await kbRead('quiz_roadmaps', `email=eq.${encodeURIComponent(scope.email)}&limit=5`)
    : [];
  return {
    leads: leadRows.map((l) => ({
      id: l.id,
      source: l.source,
      persona: l.persona,
      stage: l.stage,
      intent_signals: l.intent_signals || [],
      created_at: l.created_at,
      evidence: [evidence('website_leads', l.id, 'lead record')],
    })),
    quiz: roadmaps.map((q) => ({
      id: q.id,
      superpower: q.superpower,
      source: q.source,
      evidence: [evidence('quiz_roadmaps', q.id, 'quiz persona')],
    })),
  };
}

/** Demand signals — raw optimization_signals, provenance-tagged. */
async function buildSignals() {
  const rows = await kbRead('optimization_signals', 'limit=50&order=captured_at.desc');
  return rows.map((s) => ({
    id: s.id,
    event: s.event,
    page: s.page,
    source_table: s.source_table,
    captured_at: s.captured_at,
    payload: s.payload,
    evidence: s.id ? [evidence('optimization_signals', s.id, s.source_table || 'signal')] : [],
  }));
}

/** Relevant SOPs the agent should apply. */
async function buildSops() {
  const rows = await kbRead('sop_docs', 'active=eq.true&limit=25');
  return rows.map((s) => ({
    id: s.id,
    title: s.title,
    owner: s.owner,
    version: s.version,
    body_ref: s.body_ref,
  }));
}

/** Open ledgers — what is already in flight (drives "what to work on today"). */
async function buildLedgers() {
  const [opps, probs] = await Promise.all([
    kbRead('opportunity_ledger', 'status=in.open.approved&order=score.desc&limit=25'),
    kbRead('problem_ledger', 'status=in.open.mitigating&order=severity.asc&limit=25'),
  ]);
  return {
    openOpportunities: opps.map((o) => ({
      id: o.id, title: o.title, type: o.type, score: o.score,
      confidence: o.confidence, status: o.status, source_agent: o.source_agent,
      trend: o.trend, evidence: o.evidence || [],
    })),
    openProblems: probs.map((p) => ({
      id: p.id, title: p.title, domain: p.domain, severity: p.severity,
      source_table: p.source_table, source_id: p.source_id, status: p.status,
      evidence: p.evidence || [],
    })),
  };
}

/**
 * Assemble the context.
 * @param {object} scope - { email?, productSlug?, assetType?, domain? }
 */
export async function buildContext(scope = {}) {
  const gaps = [];
  const [revenue, integrations, automations, customer, signals, sops, ledgers] =
    await Promise.all([
      buildRevenue(), buildIntegrations(), buildAutomations(),
      buildCustomer(scope), buildSignals(), buildSops(), buildLedgers(),
    ]);

  if (!revenue.products.length && !revenue.evidence.length) gaps.push('revenue: no product data in registry');
  if (!integrations.length) gaps.push('integrations: no integration_status rows yet (health probe not run)');
  if (!automations.length) gaps.push('automations: no failed/degraded workers (or automation_status unpopulated)');
  if (!customer.leads.length && !customer.quiz.length) gaps.push('customer: no leads or quiz for this scope');
  if (!signals.length) gaps.push('signals: no optimization_signals captured yet');
  if (!sops.length) gaps.push('sops: no machine-readable SOP docs imported');
  if (!ledgers.openOpportunities.length && !ledgers.openProblems.length) gaps.push('ledgers: no open opportunities or problems');

  return {
    scope,
    revenue, integrations, automations, customer, signals, sops,
    ...ledgers,
    dataGaps: gaps,
    snapshotId: 'ctx-' + Date.now().toString(36),
    assembledAt: new Date().toISOString(),
  };
}

export default { buildContext };
