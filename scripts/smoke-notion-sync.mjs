#!/usr/bin/env node
// scripts/smoke-notion-sync.mjs
// Smoke test for the Supabase `notion-sync` Scheduled Edge Function.
//
// - Sends the shared x-api-key header.
// - Always forces dry-run (body { dryRun:true }), so NOTHING is written to
//   Notion, even if NOTION_LIVE_MODE is true in the deployed environment.
// - Prints status, JSON response, and dry-run scanned/created/skipped counts.
// - Exits non-zero on HTTP >= 400 or a response.error field.
//
// Env:
//   DASHBOARD_API_KEY             (required — shared key the endpoint expects)
//   NOTION_SYNC_URL               (optional — full endpoint; default = Supabase edge)
//   VITE_SUPABASE_URL             (optional — base for deriving the edge URL)

const SUPABASE_REF = "dijjlppdljpcgyoakdnq";

function resolveEndpoint() {
  if (process.env.NOTION_SYNC_URL) return process.env.NOTION_SYNC_URL;
  const base = (process.env.VITE_SUPABASE_URL || `https://${SUPABASE_REF}.supabase.co`).replace(/\/+$/, "");
  return `${base}/functions/v1/notion-sync`;
}

function out(msg = "") {
  console.log(msg);
}

function fail(msg) {
  console.error(`\nSMOKE TEST FAILED: ${msg}`);
  process.exit(1);
}

async function main() {
  const apiKey = (process.env.DASHBOARD_API_KEY || process.env.VITE_DASHBOARD_API_KEY || "").trim();
  if (!apiKey) {
    fail("DASHBOARD_API_KEY is not set. Set it (or VITE_DASHBOARD_API_KEY) so the endpoint can authenticate you.");
  }

  const endpoint = resolveEndpoint();
  out(`POST ${endpoint}`);
  out("(forced dry-run — nothing will be written to Notion)\n");

  const started = Date.now();
  let res;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ dryRun: true }),
    });
  } catch (err) {
    fail(`request failed: ${err && err.message ? err.message : err}`);
  }

  const ms = Date.now() - started;
  const text = await res.text();

  out(`Status: ${res.status} (${ms}ms)`);
  out(`Response:`);
  out(text);

  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }

  if (res.status >= 400) {
    fail(`HTTP ${res.status} (${res.statusText || "error"})`);
  }
  if (data && data.error) {
    fail(`response.error: ${data.error}`);
  }

  if (data && Array.isArray(data.sources)) {
    let scanned = 0;
    let created = 0;
    let skipped = 0;
    for (const s of data.sources) {
      scanned += s.scanned || 0;
      created += s.created || 0;
      skipped += s.skipped || 0;
    }
    out(
      `Dry-run counts — scanned: ${scanned}, created(candidate): ${created}, skipped(already-synced): ${skipped}`
    );
    out(`Live mode: ${data.live === true ? "ON" : "off"} (forced dry-run: ${data.forcedDryRun === true ? "yes" : "no"})`);
  }

  out(`\nSMOKE TEST PASSED (dry-run; nothing written to Notion)`);
  process.exit(0);
}

main();