// src/agents/hermes/supervisorEval.js
// Output evaluation, opportunity detection, problem detection for HermesSupervisor
import { validateEvidence, confidenceFromEvidence } from '../../services/kb/evidence.js';

export function evaluate(result, ctx, am) {
  const issues = [], ev = [];
  let evaluable = true, conf = 'low', score = 0;
  if (result.error || result.degraded) {
    evaluable = false; issues.push('Agent error/degraded');
    return { evaluable, confidence: conf, issues, evidence: ev, score };
  }
  const evV = validateEvidence(result.evidence, { min: 1 });
  if (!evV.valid) issues.push('No evidence tracing (C1)');
  else { ev.push(...result.evidence); conf = 'medium'; }
  const cf = confidenceFromEvidence(result.evidence);
  if (cf.confidence === 'high') conf = 'high';
  else if (cf.confidence === 'medium' && conf !== 'high') conf = 'medium';
  const s = JSON.stringify(result).toLowerCase();
  for (const sig of ['builder', 'roadmap', '30-60 days', 'static', 'placeholder']) {
    if (s.includes(sig)) {
      issues.push(`Possible hardcoded: "${sig}"`);
      if (conf === 'high') conf = 'medium';
    }
  }
  score = conf === 'high' ? 1 : conf === 'medium' ? 0.6 : 0.3;
  return { evaluable, confidence: conf, issues, evidence: ev, score, validated: evV.valid };
}

export function detectOpps(result, aid, ctx) {
  const opps = [];

  const textParts = [];
  if (result.data && typeof result.data === 'string') textParts.push(result.data);
  else if (result.data && typeof result.data === 'object') textParts.push(JSON.stringify(result.data));
  if (result.reply && typeof result.reply === 'string') textParts.push(result.reply);
  if (result.text && typeof result.text === 'string') textParts.push(result.text);
  if (result.message && typeof result.message === 'string') textParts.push(result.message);

  const s = textParts.join(' ').toLowerCase();
  const found = ['opportunity', 'gap', 'underserved', 'quick win', 'revenue', 'monetiz'].filter(x => s.includes(x));

  if (found.length === 0) return opps;

  const rawEvidence = Array.isArray(result.evidence) ? result.evidence : [];
  const realEvidence = rawEvidence.filter((e) => e && typeof e === 'object' && e.table && e.id != null && e.table !== 'agent_registry');

  if (realEvidence.length === 0) return opps;

  const opp = {
    title: `Opportunity from ${aid}`,
    type: 'revenue',
    source_agent: aid,
    score: 50,
    confidence: 'medium',
    status: 'open',
    evidence: realEvidence,
    components: { detection: 100, evidence: 50 }
  };

  opps.push(opp);
  return opps;
}

export function detectProbs(result, aid, ctx, ev) {
  const probs = [];
  if (result.error || result.degraded) {
    probs.push({
      domain: 'agent', title: `Agent ${aid} failed`, severity: 'P1',
      source_table: 'agent_telemetry', source_id: aid,
      evidence: [{ table: 'agent_telemetry', id: aid, note: result.error || 'degraded' }],
      mitigation: [{ action: 'retry', agent: aid }]
    });
  }
  if (ev.confidence === 'low' && result && !result.error) {
    probs.push({
      domain: 'agent', title: `Agent ${aid} low confidence`, severity: 'P2',
      source_table: 'agent_telemetry', source_id: aid,
      evidence: ev.evidence || [], mitigation: [{ action: 'review', agent: aid }]
    });
  }
  if (ctx.dataGaps?.length) {
    probs.push({
      domain: 'data', title: `Missing data: ${ctx.dataGaps.join(', ')}`, severity: 'P2',
      source_table: 'optimization_signals', source_id: 'context_gaps',
      evidence: ctx.dataGaps.map((g, i) => ({ table: 'context', id: `g_${i}`, note: g })),
      mitigation: ctx.dataGaps.map(g => ({ action: 'collect', area: g }))
    });
  }
  return probs;
}
