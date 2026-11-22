// src/services/kb/collectors/quizLeads.js
// ============================================================================
// COLLECTOR 7 (priority 2) — QUIZ → website_leads.
//
// The quiz pipeline writes leads (website_leads) and roadmaps (quiz_roadmaps)
// as separate rows joined by email, but never fills the lead's `persona`
// column. This collector backfills website_leads.persona / .stage from the
// matching quiz_roadmaps so the customer slice is complete and Hermes can
// segment by persona.
//
// - Idempotent: only patches a lead when its persona differs from the current
//   quiz result.
// - Provenance (C1): each patched lead carries evidence to its quiz_roadmaps
//   row.
// - Also raises a problem when a roadmap exists for an email that has no lead
//   row (orphaned lead-capture), which is a funnel-integrity signal.
// ============================================================================

import { kbRead, kbUpsert } from '../kbSupabase.js';
import { evidence } from '../evidence.js';
import { upsertProblem } from '../problemTracker.js';

export async function collectQuizLeads() {
  const roadmaps = await kbRead('quiz_roadmaps', 'limit=500');
  const leads = await kbRead('website_leads', 'limit=1000');
  const leadByEmail = new Map(leads.map((l) => [String(l.email || '').toLowerCase(), l]));

  let synced = 0;
  let orphans = 0;
  for (const q of roadmaps) {
    const email = String(q.email || '').toLowerCase();
    if (!email) continue;
    const lead = leadByEmail.get(email);

    if (!lead) {
      // A roadmap with no matching lead row = funnel integrity gap.
      orphans += 1;
      await upsertProblem({
        domain: 'data',
        title: `Quiz lead orphan: roadmap for ${q.email || email} has no website_leads row`,
        severity: 'P2',
        source_table: 'quiz_roadmaps',
        source_id: q.id,
        evidence: [evidence('quiz_roadmaps', q.id, 'persona=' + q.superpower + ' but no matching lead')],
      });
      continue;
    }

    // Sync persona + intent signals (only when they actually change).
    const persona = q.superpower || null;
    const stage = 'quiz-complete';
    const intent = lead.intent_signals && lead.intent_signals.length ? lead.intent_signals : [];
    if (lead.persona !== persona) {
      await kbUpsert('website_leads', {
        id: lead.id,
        persona,
        stage,
        intent_signals: intent.includes('persona:' + persona) ? intent : [...intent, 'persona:' + persona],
        updated_at: new Date().toISOString(),
      }, 'id');
      synced += 1;
    }
  }
  return { synced, orphans, roadmaps: roadmaps.length, leads: leads.length };
}

export default { collectQuizLeads };
