// src/services/kb/collectors/index.js
// ============================================================================
// COLLECTOR RUNNER — runs all KB collectors in priority order.
//
// This is what a scheduled Vercel cron (or a manual POST) calls to keep the
// Knowledge Base live. Each collector is independent and returns a summary;
// a failure in one never blocks the others.
//
// Priority order (per KB roadmap):
//   1. ga4-signals      — GA4 → optimization_signals (traffic/demand facts)
//   2. quiz-leads       — Quiz → website_leads (persona/stage backfill)
//   3. product-sales    — Gumroad/PayPal purchases → product_registry (revenue)
//   4. notion-inventory — Notion DB asset inventory (record counts + health)
//   5. automation-execution — automation run telemetry (fires + completes)
//   6. integration-health — external system auth/publisher health
//   7. gumroad-products — Gumroad catalog sync
//   8. sop-importer     — SOP/doc versioning into sop_docs
//   9. automation-status — worker registry + health (complements execution)
// ============================================================================

import { collectIntegrationHealth } from './integrationHealth.js';
import { collectGumroadProducts } from './gumroadProducts.js';
import { collectProductSales } from './productSales.js';
import { collectSopDocs } from './sopImporter.js';
import { collectAutomationStatus } from './automationStatus.js';
import { collectGa4Signals } from './ga4Signals.js';
import { collectQuizLeads } from './quizLeads.js';
import { collectNotionInventory } from './notionInventory.js';
import { collectAutomationExecution } from './automationExecution.js';

const PRIORITY = [
  ['ga4-signals', collectGa4Signals],
  ['quiz-leads', collectQuizLeads],
  ['product-sales', collectProductSales],
  ['notion-inventory', collectNotionInventory],
  ['automation-execution', collectAutomationExecution],
  ['integration-health', collectIntegrationHealth],
  ['gumroad-products', collectGumroadProducts],
  ['sop-importer', collectSopDocs],
  ['automation-status', collectAutomationStatus],
];

/**
 * Run collectors. `only` (array of names) restricts to a subset; default = all.
 * @returns {{ ran: string[], results: object, startedAt, finishedAt }}
 */
export async function runCollectors({ only } = {}) {
  const startedAt = new Date().toISOString();
  const results = {};
  const ran = [];
  for (const [name, fn] of PRIORITY) {
    if (only && !only.includes(name)) continue;
    try {
      results[name] = await fn();
      ran.push(name);
    } catch (err) {
      results[name] = { error: err.message };
      // eslint-disable-next-line no-console
      console.warn(`[kb-collector] ${name} failed: ${err.message}`);
    }
  }
  return { ran, results, startedAt, finishedAt: new Date().toISOString() };
}

export {
  collectIntegrationHealth,
  collectGumroadProducts,
  collectProductSales,
  collectSopDocs,
  collectAutomationStatus,
  collectGa4Signals,
  collectQuizLeads,
  collectNotionInventory,
  collectAutomationExecution,
};

export default { runCollectors, PRIORITY };
