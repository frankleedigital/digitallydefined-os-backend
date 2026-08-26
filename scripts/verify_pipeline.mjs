// scripts/verify_pipeline.mjs
// End-to-end pipeline test:
//   1. Sends synthetic website events to the `analytics` Edge Function
//   2. Confirms they appear in the aggregated overview
//   3. (Optional) runs the AI Business Partner recommendation pass
//
// Usage:
//   node scripts/verify_pipeline.mjs                 # ingest + read
//   node scripts/verify_pipeline.mjs --recommend     # + AI analysis
//
// Env (or defaults below):
//   SUPABASE_URL, DASHBOARD_API_KEY

const SUPABASE_URL = (process.env.SUPABASE_URL || "https://dijjlppdljpcgyoakdnq.supabase.co").replace(/\/+$/, "");
const API_KEY = process.env.DASHBOARD_API_KEY || "DigitallyDefined-OS-2026";
const ENDPOINT = `${SUPABASE_URL}/functions/v1/analytics`;
const RUN_RECOMMEND = process.argv.includes("--recommend");

const sessionId = `verify_${Date.now()}`;

async function callAnalytics(action, extra = {}) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
    body: JSON.stringify({ action, ...extra }),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response (${res.status}): ${text.slice(0, 200)}`);
  }
  return { status: res.status, data };
}

async function main() {
  console.log(`→ Endpoint: ${ENDPOINT}`);

  // 1. Health probe
  const health = await fetch(ENDPOINT, { method: "GET" });
  console.log(`1. Edge function reachable: ${health.ok ? "YES" : `NO (${health.status})`}`);
  if (!health.ok) process.exit(1);

  // 2. Trigger website events (the same payload shape tracking.js sends)
  const events = [
    { event_type: "session_start", page: "/", session_id: sessionId, metadata: { user_agent: "verify-pipeline" } },
    { event_type: "page_view", page: "/", session_id: sessionId },
    { event_type: "cta_click", page: "/", session_id: sessionId, metadata: { label: "Verify CTA" } },
    { event_type: "scroll_depth", page: "/", session_id: sessionId, metadata: { depth: 75 }, value: 45 },
    { event_type: "quiz_start", page: "/quiz", session_id: sessionId },
    { event_type: "quiz_complete", page: "/quiz", session_id: sessionId, email: "pipeline-verify@digitallydefined.online", metadata: { superpower: "builder" } },
    { event_type: "form_submit", page: "/contact", session_id: sessionId, email: "pipeline-verify@digitallydefined.online" },
    { event_type: "product_interest", page: "/products", session_id: sessionId, product_name: "Digital Superpower Quiz" },
  ];
  const track = await callAnalytics("track", { events });
  console.log(`2. Ingested events: ${JSON.stringify(track.data)}`);
  if (!track.data.ok) process.exit(1);

  // 3. Confirm the events surface in the overview
  const overview = await callAnalytics("overview", { days: 7 });
  const d = overview.data;
  console.log(`3. Overview (7d):`);
  console.log(`   page_views        : ${d.traffic?.page_views}`);
  console.log(`   sessions          : ${d.traffic?.unique_sessions}`);
  console.log(`   leads             : ${d.leads?.total}`);
  console.log(`   cta_clicks        : ${d.conversions?.cta_clicks}`);
  console.log(`   quiz started/done : ${d.funnels?.quiz?.started}/${d.funnels?.quiz?.completed}`);
  console.log(`   products          : ${(d.products || []).map((p) => `${p.product_name}=${p.interest_count}`).join(", ") || "none"}`);
  console.log(`   raw_event_counts  : ${JSON.stringify(d.raw_event_counts)}`);

  const pass =
    (d.raw_event_counts?.page_view || 0) >= 1 &&
    (d.raw_event_counts?.quiz_complete || 0) >= 1 &&
    (d.leads?.total || 0) >= 1;

  console.log(pass ? "\n✓ PIPELINE VERIFIED END-TO-END" : "\n✗ VERIFICATION FAILED — events did not surface");
  if (!pass) process.exit(1);

  // 4. Optional AI Business Partner analysis
  if (RUN_RECOMMEND) {
    console.log("\n4. Running AI Business Partner analysis…");
    const rec = await callAnalytics("recommend", { days: 30 });
    console.log(rec.data.analysis || JSON.stringify(rec.data));
  }
}

main().catch((err) => {
  console.error("✗ Verification error:", err.message);
  process.exit(1);
});