import assert from 'node:assert/strict';
import { test } from 'node:test';
import { detectOpps } from '../src/agents/hermes/supervisorEval.js';
import { buildOpportunityRecord } from '../src/services/kb/opportunityEngine.js';

const agentId = 'growthAgent';
const realEvidence = [{ table: 'optimization_signals', id: 'signal-123', note: 'traffic growth' }];

test('detects an opportunity in a reply-only Hermes result with real evidence', () => {
  const opportunities = detectOpps({ reply: 'A quick win is to address this revenue gap.', evidence: realEvidence }, agentId, {});
  assert.equal(opportunities.length, 1);
  assert.equal(opportunities[0].source_agent, agentId);
  assert.deepEqual(opportunities[0].evidence, realEvidence);
});

test('detects an opportunity in data-based results and preserves engine attribution', () => {
  const opportunities = detectOpps({ data: { insight: 'underserved opportunity' }, evidence: realEvidence }, agentId, {});
  assert.equal(opportunities.length, 1);

  const { record, isReal } = buildOpportunityRecord(opportunities[0]);
  assert.equal(isReal, true);
  assert.equal(record.source_agent, agentId);
});

test('does not create an opportunity when evidence is missing', () => {
  assert.deepEqual(detectOpps({ reply: 'There is a revenue opportunity and a quick win.' }, agentId, {}), []);
});

test('does not treat synthetic agent registry attribution as real evidence', () => {
  const opportunities = detectOpps({
    reply: 'There is an opportunity to close a revenue gap.',
    evidence: [{ table: 'agent_registry', id: agentId, note: 'agent produced this text' }],
  }, agentId, {});
  assert.deepEqual(opportunities, []);
});

test('engine marks unresolved evidence as non-real while retaining source agent', () => {
  const { record, isReal } = buildOpportunityRecord({
    title: 'Opportunity from growthAgent',
    source_agent: agentId,
    evidence: [{ table: 'agent_registry', id: agentId }],
  });
  assert.equal(isReal, false);
  assert.equal(record.confidence, 'low');
  assert.equal(record.source_agent, agentId);
});
