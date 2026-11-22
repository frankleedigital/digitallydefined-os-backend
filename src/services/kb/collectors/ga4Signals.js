// src/services/kb/collectors/ga4Signals.js
// ============================================================================
// COLLECTOR 6 (priority 1) — GA4 → optimization_signals.
//
// Pulls live GA4 metrics via the shared ga4 service and writes a
// provenance-tagged optimization_signals row, so the KB finally carries real
// "traffic" and "demand" facts. This is what lets HermesContextBuilder answer
// "what's trending / where are we slipping" from data, not guesses.
//
// - One signal row per run (event='ga4'), carrying the raw metrics + the
//   source that produced them in `payload`.
// - Writes `source_table`/`captured_at` provenance (C1) so downstream
//   opportunity scoring can trace the demand signal back to GA4.
// ============================================================================

import { kbUpsert } from '../kbSupabase.js';
import { evidence } from '../evidence.js';
import { fetchGa4 } from '../../ga4.js';

export async function collectGa4Signals() {
  const ga4 = await fetchGa4();
  if (!ga4 || ga4.error && ga4.users30d == null) {
    // Still record a provenance row (no metrics) so the KB knows traffic is
    // unavailable rather than silently empty.
    const stored = await kbUpsert('optimization_signals', {
      user_id: 'business',
      event: 'ga4',
      page: '/ga4-health',
      source_table: 'ga4',
      payload: { available: false, error: ga4.error, source: ga4.source },
      captured_at: new Date().toISOString(),
      evidence: [evidence('ga4', ga4.source, 'traffic unavailable: ' + (ga4.error || 'no data'))],
    });
    return { available: false, error: ga4.error, source: ga4.source, written: !!stored };
  }

  const stored = await kbUpsert('optimization_signals', {
    user_id: 'business',
    event: 'ga4',
    page: ga4.topPages && ga4.topPages[0] ? ga4.topPages[0].path : '/site',
    source_table: 'ga4',
    payload: {
      available: true,
      source: ga4.source,
      users30d: ga4.users30d,
      sessions30d: ga4.sessions30d,
      revenue30d: ga4.revenue30d,
      topPages: ga4.topPages || [],
      capturedAt: new Date().toISOString(),
    },
    captured_at: new Date().toISOString(),
    evidence: [evidence('ga4', ga4.source, `users30d=${ga4.users30d} sessions30d=${ga4.sessions30d}`)],
  });
  return { available: true, source: ga4.source, users30d: ga4.users30d, sessions30d: ga4.sessions30d, written: !!stored };
}

export default { collectGa4Signals };
