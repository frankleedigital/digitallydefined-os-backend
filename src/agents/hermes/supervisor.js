// src/agents/hermes/supervisor.js
// Hermes Supervisory Orchestrator — reads HermesContextBuilder before every
// decision, dispatches to all agents through the unified registry, selects
// agents by capability + telemetry + data availability, evaluates outputs,
// records decisions/opportunities/problems, and explains selections.
import { agentRegistry, executeAgent } from '../index.js';
import { buildContext } from '../../services/kb/HermesContextBuilder.js';
import { recordDecision } from '../../services/kb/decisionLog.js';
import { upsertOpportunity } from '../../services/kb/opportunityEngine.js';
import { upsertProblem } from '../../services/kb/problemTracker.js';
import { kbRead } from '../../services/kb/kbSupabase.js';
import { evaluate as evalOutput, detectOpps, detectProbs } from './supervisorEval.js';

const W = { capability: 0.5, telemetry: 0.3, data: 0.2 };

function kw(text) {
  return new Set(String(text || '').toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 2));
}

function capMatch(agent, k) {
  const t = `${agent.capability || ''} ${agent.description || ''} ${agent.name || ''}`.toLowerCase();
  const kk = Array.from(k);
  return kk.length ? kk.filter(x => t.includes(x)).length / kk.length : 0;
}

async function telScore(aid) {
  const rows = await kbRead('agent_telemetry', `agent_id=eq.${encodeURIComponent(aid)}&order=created_at.desc&limit=50`);
  if (!rows.length) return { s: 0.5, n: 0, sr: 0, al: null };
  const succ = rows.filter(r => r.outcome === 'success').length;
  const lat = rows.filter(r => r.latency_ms).map(r => r.latency_ms);
  const al = lat.length ? lat.reduce((a, b) => a + b, 0) / lat.length : null;
  return { s: (succ / rows.length) * 0.7 + (al ? Math.max(0, Math.min(1, 1 - (al - 1000) / 9000)) : 0.5) * 0.3, n: rows.length, sr: succ / rows.length, al };
}

function dataAvail(agent, ctx) {
  const ds = agent.data_sources || [];
  if (!ds.length) return 0.5;
  const keys = Object.keys(ctx || {});
  return ds.filter(x => keys.includes(x)).length / ds.length;
}

export class HermesSupervisor {
  async decide(goal, scope = {}) {
    // Req 1: Read HermesContextBuilder before every decision
    const ctx = await buildContext(scope);

    // Req 2, 3, 9, 10: Select agent by capability + telemetry + data availability
    const sel = await this.selectAgent(goal, ctx);
    if (!sel.agent) {
      await upsertProblem({
        domain: 'data', title: `No agent for: ${String(goal).slice(0, 80)}`,
        severity: 'P2', source_table: 'agent_registry', source_id: 'all',
        evidence: [{ table: 'agent_registry', id: 'all', note: 'No agent met threshold' }]
      });
      return { ok: false, error: 'No suitable agent', reason: sel.reason, ctx, gaps: ctx.dataGaps || [] };
    }

    // Req 4: Execute agent — Hermes receives all outputs
    let r;
    try { r = await executeAgent(sel.agent, { message: goal, context: ctx, scope, invoker: 'hermes-supervisor' }); }
    catch (e) { r = { error: e.message, degraded: true }; }

    // Req 5: Evaluate output before returning
    const ev = evalOutput(r, ctx, sel.agentMeta);

    // Req 6: Record decision to decision_log
    const dec = await recordDecision({
      kind: 'recommendation', summary: `Routed to ${sel.agentMeta.name}`,
      recommendedBy: 'hermes-supervisor', refType: 'agent_selection', refId: sel.agent,
      status: ev.evaluable ? 'pending' : 'rejected', outcome: ev.confidence, evidence: ev.evidence
    });

    // Req 7: Record detected opportunities to opportunity_ledger
    for (const o of detectOpps(r, sel.agent, ctx)) await upsertOpportunity(o);

    // Req 8: Record detected problems to problem_ledger
    for (const p of detectProbs(r, sel.agent, ctx, ev)) await upsertProblem(p);

    return {
      ok: ev.evaluable, agent: sel.agent, agentName: sel.agentMeta.name,
      score: sel.score, reason: sel.reason, result: r, evaluation: ev,
      decisionId: dec.row?.id, ctx, gaps: ctx.dataGaps || [], ts: Date.now()
    };
  }

  async selectAgent(goal, ctx) {
    const k = kw(goal);
    const c = [];
    for (const [aid, am] of Object.entries(agentRegistry)) {
      if (am.active === false) continue;
      const cm = capMatch(am, k);
      const t = await telScore(aid);
      const d = dataAvail(am, ctx);
      const s = W.capability * cm + W.telemetry * t.s + W.data * d;
      c.push({ agent: aid, agentMeta: am, cap: cm, tel: t.s, telN: t.n, data: d, total: s });
    }
    c.sort((a, b) => b.total - a.total);
    const b = c[0];
    if (!b || b.total < 0.15) {
      return { agent: null, agentMeta: null, score: 0,
        reason: `No agent met threshold (best: ${b ? b.total.toFixed(2) : 'none'})`,
        candidates: c.slice(0, 5) };
    }
    return {
      agent: b.agent, agentMeta: b.agentMeta, score: b.total,
      reason: `Cap ${(b.cap * 100).toFixed(0)}%; Tel ${b.telN > 0 ? (b.tel * 100).toFixed(0) + '% (' + b.telN + ' runs)' : 'none'}; Data ${(b.data * 100).toFixed(0)}%. Over ${c[1] ? c[1].agentMeta.name : 'none'}`,
      candidates: c.slice(0, 5)
    };
  }
}

export const hermesSupervisor = new HermesSupervisor();
export default hermesSupervisor;
