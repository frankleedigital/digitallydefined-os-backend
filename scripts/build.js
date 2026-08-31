/**
 * scripts/build.js
 * DigitallyDefined — terminating validation build for the Vercel serverless deploy.
 *
 * This project is serverless (Vercel `api/` functions + Supabase Edge Functions),
 * so there is no static bundle to emit — Vercel bundles the `api/*` functions
 * itself from vercel.json. The `build` script exists so Vercel / CI have a
 * defined, *terminating* build stage (its absence caused Vercel CLI to ask
 * "No framework detected?" interactively and hang).
 *
 * It runs three bounded, non-destructive checks and exits:
 *   1. type-checks the TypeScript API functions (tsc --noEmit)
 *   2. syntax-checks every Vercel `api/*.js` serverless entrypoint
 *   3. verifies required secrets are present in the env (non-blocking: warns)
 *
 * Usage: npm run build
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const log = (m) => console.log(`[build] ${m}`);
const fail = (m) => {
  console.error(`[build] ${m}`);
  process.exit(1);
};

// Guard against being re-run as a watched / long-lived process.
const MAX_RUNTIME_MS = 120_000;
setTimeout(() => {
  console.error("[build] timed out after 120s — build never terminates, aborting.");
  process.exit(1);
}, MAX_RUNTIME_MS);

// ---- 1. Type-check the TypeScript serverless entrypoints -------------------
log("step 1/3: type-checking api/*.ts (tsc --noEmit) ...");
const tsconfig = path.join(root, "tsconfig.json");
if (fs.existsSync(tsconfig)) {
  const tsc = spawnSync(
    "npx",
    ["--no-install", "tsc", "--noEmit", "-p", tsconfig],
    { cwd: root, encoding: "utf8", shell: process.platform === "win32" }
  );
  if (tsc.status !== 0) {
    console.error(tsc.stdout || tsc.stderr || "(tsc produced no output)");
    fail("tsc type-check failed");
  }
} else {
  log("tsconfig.json not found — skipping type-check");
}
log("type-check OK");

// ---- 2. Syntax-check the plain-JS serverless entrypoints ------------------
log("step 2/3: syntax-checking api/*.js ...");
const apiDir = path.join(root, "api");
let jsCount = 0;
if (fs.existsSync(apiDir)) {
  const jsFiles = fs.readdirSync(apiDir).filter((f) => f.endsWith(".js"));
  for (const f of jsFiles) {
    const r = spawnSync("node", ["--check", path.join(apiDir, f)], {
      cwd: root,
      encoding: "utf8",
      shell: process.platform === "win32",
    });
    if (r.status !== 0) {
      console.error(r.stderr || r.stdout || "");
      fail(`syntax error in api/${f}`);
    }
    jsCount += 1;
  }
}
log(`syntax-check OK (${jsCount} api/*.js file(s))`);

// ---- 3. Warn (not fail) on missing required secrets -----------------------
log("step 3/3: checking required secrets ...");
const REQUIRED = ["DASHBOARD_API_KEY", "OMNIROUTE_API_KEY", "SUPABASE_URL"];
const missing = REQUIRED.filter((k) => !process.env[k] || String(process.env[k]).trim() === "");
if (missing.length) {
  log(`WARNING: these env vars are UNSET: ${missing.join(", ")} (deploy will build, runtime may error)`);
} else {
  log("all required secrets present");
}

log("build complete ✓");
process.exit(0);