// src/services/kb/collectors/automationExecution.js
// ============================================================================
// COLLECTOR 9 (priority 5) — AUTOMATION EXECUTION TELEMETRY.
//
// Records each observed automation run into `automation_execution`, giving
// Hermes a timeline of whether automations actually fire and complete
// successfully (not just whether their last status looks healthy).
//
// Sources:
//   - automation_status (worker registry + last_run_at / last_status)
//   - future: the automation dispatcher inserts directly when automations run
//
// The collector reconciles automation_status into execution history: for each
// worker with a last_run_at, it creates/updates one execution row keyed by
// run_id (= last_run_at ISO), deduplicated so repeated cron runs don't
// double-count. C1 evidence tracing is mandatory.
// ============================================================================

import { kbRead, kbUpsert } from '../kbSupabase.js';
import { evidence } from '../evidence.js';
import { upsertProblem } from '../problemTracker.js';

/** Reconcile automation_status into automation_execution history. */
export async function collectAutomationExecution() {
  const workers = await kbRead('automation_status');
  const executions = await kbRead('automation_execution', 'limit=1000');
  const existingRunIds = new Set(executions.map((e) => e.run_id));

  let written = 0;
  const failingWorkers = [];

  for (const w of workers) {
    if (!w.last_run_at) continue; // never run — nothing to telemetry yet

    const runId = `run:${w.id}:${w.last_run_at}`;
    if (existingRunIds.has(runId)) continue; // already recorded

    const status = w.last_status || 'unknown';
    const evidenceItems = [
      evidence('automation_status', w.id, `worker ${w.id} last_status=${status}`),
    ];

    await kbUpsert(
      'automation_execution',
      {
        run_id: runId,
        worker_id: w.id,
        kind: w.kind || null,
        schedule: w.schedule || null,
        started_at: w.last_run_at,
        finished_at: w.last_run_at, // no separate finished_at yet; dispatcher will refine
        duration_ms: null,
        status: status === 'success' ? 'success' : status === 'failed' ? 'failed' : status,
        output_summary: {},
        error: w.last_error || null,
        retry_count: 0,
        evidence: evidenceItems,
      },
      'run_id'
    );
    written += 1;

    if (w.last_status === 'failed') {
      failingWorkers.push(w.id);
    }
  }

  // Raise problems for workers that keep failing (consecutive failures).
  const recentFailures = await kbRead(
    'automation_execution',
    `status=eq.failed&order=created_at.desc&limit=20`
  );
  const failedByWorker = new Map();
  for (const e of recentFailures) {
    if (!failedByWorker.has(e.worker_id)) failedByWorker.set(e.worker_id, []);
    failedByWorker.get(e.worker_id).push(e);
  }
  for (const [wid, fails] of failedByWorker) {
    if (fails.length >= 2) {
      await upsertProblem({
        domain: 'automation',
        title: `Automation ${wid} has ${fails.length} consecutive failed runs`,
        severity: 'P1',
        source_table: 'automation_execution',
        source_id: wid,
        evidence: fails.slice(0, 3).map((e) =>
          evidence('automation_execution', e.id, `failed run ${e.run_id}: ${e.error || 'no error'}`)
        ),
      });
    }
  }

  return { written, workers: workers.length, failing: failingWorkers };
}

export default { collectAutomationExecution };
