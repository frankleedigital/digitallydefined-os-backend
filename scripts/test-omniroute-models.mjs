/**
 * scripts/test-omniroute-models.mjs
 * Test OmniRoute models with tiny prompts, record pass/fail + latency.
 * Usage: node scripts/test-omniroute-models.mjs [model-filter-regex] [max-tests]
 */

import fs from "node:fs";

const BASE = process.env.OMNI_BASE || "http://localhost:20128";
const KEY = process.env.OMNI_KEY;
if (!KEY) {
  console.error("Set OMNI_KEY (OmniRoute API key) before running this script.");
  process.exit(1);
}
const filter = process.argv[2] || "";
const maxTests = Number(process.argv[3] || 200);

// Fetch catalog
const catRes = await fetch(`${BASE}/v1/models`, {
  headers: { Authorization: `Bearer ${KEY}` },
});
const catalog = (await catRes.json())?.data?.map((m) => m.id) ?? [];

const filtered = catalog.filter((id) => {
  if (!filter) return true;
  try { return new RegExp(filter, "i").test(id); } catch { return true; }
});

// Dedupe: skip the "parent-less alias" duplicates (provider/ prefixed twice)
const seen = new Set();
const models = filtered.filter((id) => {
  if (seen.has(id)) return false;
  seen.add(id);
  return true;
}).slice(0, maxTests);

console.log(`Testing ${models.length} of ${catalog.length} models (filter: "${filter || "all"}")...`);

const results = [];
const CONCURRENCY = 8;
let idx = 0;

async function testOne(modelId) {
  const started = Date.now();
  try {
    const res = await fetch(`${BASE}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: "user", content: "Reply with exactly: OK" }],
        max_tokens: 10,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(30000),
    });
    const text = await res.text();
    let body = {};
    try { body = JSON.parse(text); } catch { /* non-JSON */ }
    const content = body?.choices?.[0]?.message?.content ?? "";
    const latency = Date.now() - started;
    if (res.ok && content.trim()) {
      return { model: modelId, ok: true, latency, reply: content.trim().slice(0, 40) };
    }
    const errMsg = (body?.error?.message || body?.error || text || `HTTP ${res.status}`).toString().slice(0, 90);
    return { model: modelId, ok: false, latency, error: errMsg };
  } catch (err) {
    return { model: modelId, ok: false, latency: Date.now() - started, error: (err?.message || String(err)).slice(0, 90) };
  }
}

async function worker() {
  while (idx < models.length) {
    const modelId = models[idx++];
    const result = await testOne(modelId);
    results.push(result);
    const mark = result.ok ? "✓" : "✗";
    console.log(` ${mark} ${result.model} (${result.latency}ms)${result.ok ? "" : " — " + result.error}`);
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

// Save results
const passed = results.filter((r) => r.ok).sort((a, b) => a.latency - b.latency);
const failed = results.filter((r) => !r.ok);
fs.writeFileSync(
  process.argv[4] || "scripts/omniroute-model-test-results.json",
  JSON.stringify({ testedAt: new Date().toISOString(), passed, failed }, null, 2)
);
console.log(`\nDone. ${passed.length} passed, ${failed.length} failed.`);
console.log("Passed (sorted by latency):");
passed.slice(0, 30).forEach((r) => console.log(`  ${r.model} — ${r.latency}ms`));