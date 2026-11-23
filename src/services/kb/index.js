// src/services/kb/index.js
// ============================================================================
// BUSINESS KNOWLEDGE BASE — public surface.
//
// One import gives every part of the system (collectors, the unified router,
// detectors, the command plane) access to the KB with the five mandatory
// contracts already enforced:
//   C1 evidence tracing   -> evidence + every ledger row
//   C2 opportunity data    -> opportunityEngine (refuses real-data-less rows)
//   C3 problem source      -> problemTracker (requires source_table + source_id)
//   C4 agent telemetry     -> kbTelemetry.recordAgentRun (wrapExecuteAgent)
//   C5 auditable recs      -> decisionLog (lifecycle + outcome)
// ============================================================================

import evidence, { evidence as evidenceItem, validateEvidence, confidenceFromEvidence } from './evidence.js';
import { kbRead, kbUpsert, kbInsert, isKbConfigured } from './kbSupabase.js';
import telemetry, { recordAgentRun } from './kbTelemetry.js';
import { buildContext } from './HermesContextBuilder.js';
import * as opportunityEngine from './opportunityEngine.js';
import * as problemTracker from './problemTracker.js';
import * as decisionLog from './decisionLog.js';
import * as priorityEngine from './priorityEngine.js';

export {
  evidence, evidenceItem, validateEvidence, confidenceFromEvidence,
  kbRead, kbUpsert, kbInsert, isKbConfigured,
  recordAgentRun, telemetry,
  buildContext,
  opportunityEngine, problemTracker, decisionLog, priorityEngine,
};

export default {
  evidence,
  supabase: { kbRead, kbUpsert, kbInsert, isKbConfigured },
  telemetry,
  context: { buildContext },
  opportunities: opportunityEngine,
  problems: problemTracker,
  decisions: decisionLog,
  priorities: priorityEngine,
};
