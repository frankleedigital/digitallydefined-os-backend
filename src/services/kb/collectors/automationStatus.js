// src/services/kb/collectors/automationStatus.js
// ============================================================================
// COLLECTOR 5 — AUTOMATION STATUS.
//
// Writes a real `automation_status` row for every worker in the ecosystem and
// computes health from observable signals, so the Automations panel finally
// reflects reality instead of the no-op `automation.list` literal.
//
// Health rule (no false positives):
//   - known-failing / not-wired workers are flagged from integration_status
//     (a worker can't be healthy if its upstream platform is down).
//   - on-demand workers default to 'unknown' until the dispatcher records a
//     run; scheduled workers default to their last observed status.
//   - C3: a failing worker raises a problem_ledger row.
// ============================================================================

import { kbRead, kbUpsert } from '../kbSupabase.js';
import { evidence } from '../evidence.js';
import { upsertProblem } from '../problemTracker.js';

// The worker catalog (idempotent registry; statuses are observed, not faked).
const WORKERS = [
  { id: 'make-publisher', worker_id: 'make-publisher', kind: 'make-webhook', schedule: 'daily 8:00 EST', owner: 'contentAgent' },
  { id: 'post-publisher', worker_id: 'post-publisher', kind: 'supabase-edge', schedule: 'on-demand', owner: 'contentAgent' },
  { id: 'brevo-sync', worker_id: 'brevo-sync', kind: 'brevo-api', schedule: 'real-time', owner: 'businessAgent' },
  { id: 'notion-architect', worker_id: 'notion-architect', kind: 'antigravity-mcp', schedule: 'on-demand + Phase 21', owner: 'notionArchitect' },
  { id: 'analytics-loop', worker_id: 'analytics-loop', kind: 'supabase-edge', schedule: 'daily 6:00 EST', owner: 'businessAgent' },
];

// Which integration_status row each worker depends on (for the health rule).
const DEPENDS = {
  'make-publisher': null,
  'post-publisher': null,
  'brevo-sync': 'brevo',
  'notion-architect': 'notion',
  'analytics-loop': null,
};

export async function collectAutomationStatus() {
  const integ = await kbRead('integration_status');
  const integById = new Map(integ.map((r) => [r.id, r]));
  let written = 0;
  const failed = [];

  for (const w of WORKERS) {
    const dep = DEPENDS[w.id] ? integById.get(DEPENDS[w.id]) : null;
    const upstreamDown = dep && ['disconnected', 'expired', 'unconfigured'].includes(dep.auth_state);

    const prev = (await kbRead('automation_status', `id=eq.${encodeURIComponent(w.id)}&limit=1`))[0];
    const lastStatus = prev ? prev.last_status : 'never';
    let health = 'unknown';
    if (upstreamDown) health = 'failing';
    else if (lastStatus === 'failed') health = 'failing';
    else if (lastStatus === 'success') health = 'healthy';
    else health = 'unknown'; // on-demand, not yet observed

    const row = await kbUpsert('automation_status', {
      id: w.id,
      worker_id: w.worker_id,
      kind: w.kind,
      schedule: w.schedule,
      owner: w.owner,
      last_run_at: prev ? prev.last_run_at : null,
      last_status: lastStatus,
      health,
      evidence: [evidence('automation_status', w.id, `upstream ${DEPENS(w)} ${upstreamDown ? 'down (' + dep.auth_state + ')' : 'ok'}`)],
      updated_at: new Date().toISOString(),
    }, 'id');
    if (row) written += 1;

    if (health === 'failing') {
      failed.push(w.id);
      await upsertProblem({
        domain: 'automation',
        title: `Automation ${w.id} failing (last_status ${lastStatus}, upstream ${dep ? dep.auth_state : 'n/a'})`,
        severity: 'P1',
        source_table: 'automation_status',
        source_id: w.id,
        evidence: [evidence('automation_status', w.id, `last_status=${lastStatus}`)],
      });
    }
  }
  return { written, workers: WORKERS.length, failing: failed };
}
function DEPENS(w) {
  const m = { 'brevo-sync': 'brevo', 'notion-architect': 'notion' };
  return m[w.id] || 'none';
}

export default { collectAutomationStatus };
