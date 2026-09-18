/**
 * scripts/push-vercel-env.mjs
 * Push the backend's required environment variables to Vercel (production)
 * using the Vercel REST API — non-interactive, idempotent (upsert=true).
 *
 * Usage:
 *   node scripts/push-vercel-env.mjs
 *
 * Reads values from .env (local, git-ignored) and upserts only the keys the
 * serverless runtime actually needs. Secrets never leave the machine except
 * to Vercel's encrypted env store.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const TOKEN = process.env.VERCEL_TOKEN || readVercelCliToken();
const PROJECT_ID = "prj_VNDzkEW0hMASpUaIJSKGWkYTfuom";
const TEAM_ID = "team_HuCrwoK71yGo1yJDYP2r6ecC";

function readVercelCliToken() {
  const candidates = [
    path.join(process.env.APPDATA || "", "com.vercel.cli", "Data", "auth.json"),
    path.join(process.env.HOME || "", ".local", "share", "com.vercel.cli", "auth.json"),
  ];
  for (const file of candidates) {
    try {
      const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
      if (parsed.token) return parsed.token;
    } catch {
      // try next candidate
    }
  }
  throw new Error("No Vercel token found. Set VERCEL_TOKEN or run `vercel login`.");
}

function parseEnvFile(file) {
  const out = {};
  const text = fs.readFileSync(file, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && value && value !== "***") out[key] = value;
  }
  return out;
}

// Keys the Vercel serverless runtime reads (see api/index.js + lib/*).
const WANTED = [
  "DASHBOARD_API_KEY",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OMNIROUTE_BASE_URL",
  "OMNIROUTE_API_KEY",
  "OMNIROUTE_MODEL",
  "GEMINI_API_KEY",
  "GEMINI_MODEL",
  "GEMINI_BASE_URL",
  "NOTION_API_KEY",
  "NOTION_IDEAS_DB_ID",
  "NOTION_CONTENT_DB_ID",
  "NOTION_AUTOMATIONS_DB_ID",
  "NOTION_COMMAND_CENTER_DB_ID",
  "NOTION_DIGITAL_ASSETS_DB_ID",
  "NOTION_PUBLISHING_QUEUE_DB_ID",
  "NOTION_CONTENT_APPROVALS_DB_ID",
  "NOTION_BUYER_SIGNALS_DB_ID",
  "NOTION_AI_CONTENT_DRAFTS_DB_ID",
  "BREVO_API_KEY",
  "BREVO_LIST_ID",
  "FACEBOOK_GROUP_ID",
  "FACEBOOK_ACCESS_TOKEN",
  "INSTAGRAM_BUSINESS_ID",
  "INSTAGRAM_ACCESS_TOKEN",
  "SHEETS_WEBHOOK_URL",
  "GUMROAD_API_KEY",
  "THREADS_APP_ID",
  "THREADS_APP_SECRET",
  "THREADS_USER_ID",
  "THREADS_ACCESS_TOKEN",
];

const envPath = path.join(root, ".env");
if (!fs.existsSync(envPath)) {
  console.error("[env:push] .env not found at", envPath);
  process.exit(1);
}

const local = parseEnvFile(envPath);

// The local .env has DASHBOARD_API_KEY masked ("Digita...2026"); the real value
// the dashboard frontend sends (VITE_DASHBOARD_API_KEY) is the canonical one.
local.DASHBOARD_API_KEY = "DigitallyDefined-OS-2026";

// NOTE: No other secrets are hardcoded here. OmniRoute/Gemini credentials must
// exist in the local .env (git-ignored) — this script only uploads what .env
// already contains, so real keys never enter version control.

const entries = WANTED.filter((k) => local[k]).map((k) => [k, local[k]]);

if (!entries.length) {
  console.error("[env:push] no matching keys found in .env");
  process.exit(1);
}

console.log(`[env:push] pushing ${entries.length} variable(s) to Vercel production...`);

const url = `https://api.vercel.com/v10/projects/${PROJECT_ID}/env?upsert=true&teamId=${TEAM_ID}`;

let ok = 0;
for (const [key, value] of entries) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key,
      value,
      type: "encrypted",
      target: ["production", "preview", "development"],
    }),
  });

  if (res.ok) {
    ok += 1;
    console.log(`  ✓ ${key}`);
  } else {
    const body = await res.text();
    console.error(`   ${key} → ${res.status} ${body.slice(0, 200)}`);
  }
}

console.log(`[env:push] done — ${ok}/${entries.length} set.`);
if (ok !== entries.length) process.exit(1);