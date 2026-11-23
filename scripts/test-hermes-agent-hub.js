import { test } from 'node:test';
import assert from 'node:assert/strict';

const mockResults = new Map();

async function mockHandleHermesMessage(goal, context = {}) {
  return mockResults.get(goal) || { ok: false, error: 'not mocked' };
}

test('agents.orchestrate returns success:true for a successful run', async () => {
  mockResults.set('test goal', {
    ok: true,
    agent: 'brandSupervisor',
    result: { plan: 'do something' },
    evaluation: { score: 0.8, confidence: 'high' },
    decisionId: 'dec-123',
  });

  const { handleAgentsOrchestrate } = await import('../src/agents/hub.js');

  const result = await handleAgentsOrchestrate({ goal: 'test goal' }, mockHandleHermesMessage);

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.agent, 'brandSupervisor');
  assert.strictEqual(result.goal, 'test goal');
  assert.deepStrictEqual(result.plan, { plan: 'do something' });
  assert.strictEqual(result.evaluation.score, 0.8);
  assert.strictEqual(result.decisionId, 'dec-123');
  assert.strictEqual(result.degraded, false);
});

test('agents.orchestrate returns success:false on failed orchestration', async () => {
  mockResults.set('fail goal', {
    ok: false,
    error: 'No suitable agent',
    reason: 'No agent met threshold',
  });

  const { handleAgentsOrchestrate } = await import('../src/agents/hub.js');

  const result = await handleAgentsOrchestrate({ goal: 'fail goal' }, mockHandleHermesMessage);

  assert.strictEqual(result.success, false);
  assert.strictEqual(result.goal, 'fail goal');
  assert.strictEqual(result.degraded, true);
});

test('agents.orchestrate returns success:false when no agent is selected', async () => {
  mockResults.set('no agent goal', {
    ok: false,
    error: 'No suitable agent',
    reason: 'No agent met threshold',
  });

  const { handleAgentsOrchestrate } = await import('../src/agents/hub.js');

  const result = await handleAgentsOrchestrate({ goal: 'no agent goal' }, mockHandleHermesMessage);

  assert.strictEqual(result.success, false);
  assert.strictEqual(result.goal, 'no agent goal');
  assert.strictEqual(result.degraded, true);
});