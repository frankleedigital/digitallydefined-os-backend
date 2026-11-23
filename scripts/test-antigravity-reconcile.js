import { test } from 'node:test';
import assert from 'node:assert/strict';

import { detectOpps } from '../src/agents/hermes/supervisorEval.js';
import { buildOpportunityRecord, scoreOpportunity } from '../src/services/kb/opportunityEngine.js';

// Mock handler that mimics the Hermes agent handler
async function mockHandleHermesMessage(goal, context = {}) {
  return mockResults.get(goal) || { ok: false, error: 'not mocked' };
}

const mockResults = new Map();

test('detectOpps: detects opportunity from result.data', () => {
  const result = {
    data: 'Found a revenue opportunity in the Gen X market segment',
    evidence: [{ table: 'product_purchases', id: 'p1', note: 'sale data' }]
  };

  const result2 = detectOpps(result, 'productAgent', {});

  assert.strictEqual(result2.length, 1);
  assert.strictEqual(result2[0].title, 'Opportunity from productAgent');
  assert.strictEqual(result2[0].type, 'revenue');
  assert.strictEqual(result2[0].source_agent, 'productAgent');
  assert.strictEqual(result2[0].confidence, 'medium');
  assert.strictEqual(result2[0].status, 'open');
  assert.strictEqual(result2[0].score, 50);
  assert.ok(result2[0].evidence.length > 0);
});

test('detectOpps: detects opportunity from result.reply', () => {
  const result = {
    reply: 'I see an opportunity to improve revenue through better onboarding',
    evidence: [{ table: 'quiz_results', id: 'q1', note: 'quiz data' }]
  };

  const result2 = detectOpps(result, 'growthAgent', {});

  assert.strictEqual(result2.length, 1);
  assert.strictEqual(result2[0].title, 'Opportunity from growthAgent');
  assert.strictEqual(result2[0].type, 'revenue');
  assert.strictEqual(result2[0].source_agent, 'growthAgent');
  assert.strictEqual(result2[0].score, 50);
});

test('detectOpps: detects opportunity from result.text', () => {
  const result = {
    text: 'There is an opportunity gap in the product roadmap',
    evidence: [{ table: 'roadmaps', id: 'r1', note: 'roadmap data' }]
  };

  const result2 = detectOpps(result, 'productAgent', {});

  assert.strictEqual(result2.length, 1);
  assert.strictEqual(result2[0].source_agent, 'productAgent');
});

test('detectOpps: returns empty array when no relevant data found', () => {
  const result = {
    response: 'Nothing relevant here',
    evidence: []
  };

  const result2 = detectOpps(result, 'businessAgent', {});

  assert.strictEqual(result2.length, 0);
});

test('detectOpps: generates evidence trail for opportunity', () => {
  const result = {
    data: 'Found revenue opportunity in Gen X market',
    evidence: [
      { table: 'quiz_results', id: 'q1', note: 'Quiz personas show demand' },
      { table: 'product_purchases', id: 'p1', note: 'Revenue data exists' }
    ]
  };

  const result2 = detectOpps(result, 'businessAgent', {});

  assert.strictEqual(result2[0].evidence.length, 3);
  assert.strictEqual(result2[0].evidence[0].table, 'quiz_results');
  assert.strictEqual(result2[0].evidence[1].table, 'product_purchases');
  assert.strictEqual(result2[0].evidence[2].table, 'agent_registry');
  assert.strictEqual(result2[0].evidence[2].note, 'Agent businessAgent detected opportunity');
});

test('buildOpportunityRecord: creates opportunity record with evidence', () => {
  const result = buildOpportunityRecord({
    title: 'Revenue Opportunity',
    type: 'revenue',
    sourceAgent: 'productAgent',
    components: { revenue: 80, demand: 60 },
    evidence: [{ table: 'product_purchases', id: 'p1', note: 'sale data' }]
  });

  assert.strictEqual(result.isReal, true);
  assert.strictEqual(result.confidence, 'medium');
  assert.strictEqual(result.record.score, 36); // 80*0.3 + 60*0.2 = 24+12 = 36
});

test('buildOpportunityRecord: rejects opportunity without evidence', () => {
  const result = buildOpportunityRecord({
    title: 'No Evidence Opportunity',
    type: 'revenue',
    sourceAgent: 'testAgent',
    components: { revenue: 80 },
    evidence: []
  });

  assert.strictEqual(result.isReal, false);
  assert.strictEqual(result.confidence, 'low');
});