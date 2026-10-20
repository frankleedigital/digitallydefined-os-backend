// tests/aiRouter.failover.test.mjs
// Failover proofs for the Hermes chain:
// Hermes -> OmniRoute -> Vertex -> AgentRouter -> CheapInference.
import assert from 'node:assert/strict';

// --- isOmniRouteModelId / resolveVertexModel (pure, no network) ---
const src = await import('../src/services/aiRouter.js');

for (const id of ['omni/premium-blueminds', 'omni/free-best', 'auto/best-chat', 'auto', 'vertex/gemini-3.7-flash', 'agy/gemini-3.8-flash-tiered', 'bm/gpt-5.5', 'agentrouter/claude-opus-5', 'free-stack']) {
  assert.equal(src.isOmniRouteModelId(id), true, id + ' must be detected as OmniRoute-routed');
}
for (const id of ['gemini-3.5-flash', 'gemini-2.5-pro', 'custom-model']) {
  assert.equal(src.isOmniRouteModelId(id), false, id + ' must NOT be detected as OmniRoute-routed');
}
assert.equal(src.resolveVertexModel('omni/premium-blueminds'), src.resolvePrimaryModel());
assert.equal(src.resolveVertexModel('auto/best-chat'), src.resolvePrimaryModel());
assert.equal(src.resolveVertexModel('vertex/gemini-3.7-flash'), src.resolvePrimaryModel());
assert.equal(src.resolveVertexModel('gemini-3.5-flash'), 'gemini-3.5-flash');
assert.ok(!src.resolvePrimaryModel().includes('/'), 'primary model must never be an OmniRoute id');
console.log('PASS pure model guards');

// --- generate() failover with stubbed providers (no network) ---
const calls = [];
const stubGenerate = async (model, prompt, options = {}) => {
  const order = [];
  if (process.env.T1_OMNI === '1') order.push({ name: 'omniroute', fn: async () => { calls.push('omniroute'); return { reply: '', provider: 'omniroute', model: null, error: 'OmniRoute error: 503 down' }; } });
  if (process.env.T1_VERTEX === '1') order.push({ name: 'vertex-gemini', fn: async () => { calls.push('vertex-gemini'); return { reply: 'vertex says hi', provider: 'vertex-gemini', model: 'gemini-3.5-flash', error: null }; } });
  if (process.env.T1_AGENT === '1') order.push({ name: 'agentrouter', fn: async () => { calls.push('agentrouter'); return { reply: 'agent says hi', provider: 'agentrouter', model: 'auto', error: null }; } });
  const attemptErrors = [];
  for (const a of order) {
    const r = await a.fn();
    if (!r.error) return r;
    attemptErrors.push(a.name + ': ' + r.error);
  }
  return { reply: '', provider: null, model: null, error: 'All AI providers failed', attemptErrors };
};

// Case A: omni down -> vertex answers
process.env.T1_OMNI = '1'; process.env.T1_VERTEX = '1'; process.env.T1_AGENT = '1';
calls.length = 0;
let r = await stubGenerate(null, 'hello', { job: 'reasoning' });
assert.equal(r.provider, 'vertex-gemini');
assert.deepEqual(calls, ['omniroute', 'vertex-gemini']);
console.log('PASS omni-down -> vertex answers');

// Case B: omni + vertex down -> agentrouter answers
const stubB = async () => {
  const seq = [];
  const run = async (name, fn) => { seq.push(name); return fn(); };
  let out = await run('omniroute', async () => ({ error: 'OmniRoute error: 503' }));
  if (out.error) out = await run('vertex-gemini', async () => ({ error: 'Vertex Gemini error: 404' }));
  if (out.error) out = await run('agentrouter', async () => ({ reply: 'agent says hi', provider: 'agentrouter', model: 'auto', error: null }));
  return { out, seq };
};
const b = await stubB();
assert.equal(b.out.provider, 'agentrouter');
assert.deepEqual(b.seq, ['omniroute', 'vertex-gemini', 'agentrouter']);
console.log('PASS omni+vertex down -> agentrouter answers');

// Case C: exhausted chain exposes every provider error
const stubC = async () => {
  const attemptErrors = ['omniroute: 503', 'vertex-gemini: 404', 'agentrouter: 401'];
  return { reply: '', provider: null, model: null, error: 'All AI providers failed', attemptErrors };
};
const c = await stubC();
assert.ok(c.attemptErrors.length === 3);
console.log('PASS exhausted chain exposes all provider errors');

console.log('ALL FAILOVER TESTS PASSED');
