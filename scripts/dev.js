// scripts/dev.js
// DigitallyDefined OS Backend — local development orchestrator.
//
// The backend is a Supabase Edge Functions project (Hermes is the Deno edge
// function at supabase/functions/hermes/index.ts), NOT a Vercel project and NOT
// a Node http server. Running the backend locally therefore requires the
// Supabase CLI + Docker Desktop:
//
//   1. supabase start                       -> boot the local Supabase stack
//   2. supabase functions serve hermes ...  -> run the Hermes edge function
//
// This script pre-checks the prerequisites, boots the local Supabase stack,
// then serves the Hermes function in the foreground so logs stream to the
// terminal. It never invokes `vercel dev`.
//
// Usage:
//   npm run dev

import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const envFile = path.join(root, ".env");

const hasCommand = (name) => {
  const r = spawnSync(name, ["--version"], {
    encoding: "utf8",
    shell: true,
    stdio: "ignore",
  });
  return r.status === 0;
};

const log = (msg) => console.log(`[dev] ${msg}`);

// ---------------------------------------------------------------------------
// 1. Prerequisite checks (fail fast with a clear message — no crash-recursion)
// ---------------------------------------------------------------------------
if (!hasCommand("docker")) {
  console.error("[dev] Docker Desktop is required for Supabase local development.");
  console.error("[dev] Install it from https://docs.docker.com/desktop/ and start it, then retry.");
  console.error("[dev] (Or run `supabase functions serve hermes --env-file .env` on a host with Docker.)");
  process.exit(1);
}

if (!hasCommand("supabase")) {
  console.error("[dev] Supabase CLI not found. Install it with: npm i -g supabase  (or npx supabase ...).");
  process.exit(1);
}

if (!fs.existsSync(envFile)) {
  console.error(`[dev] Missing ${envFile}. Copy .env.example to .env and set your real secrets.`);
  process.exit(1);
}

log("Prerequisites OK (docker + supabase CLI + .env).");

// ---------------------------------------------------------------------------
// 2. Boot the local Supabase stack (idempotent)
// ---------------------------------------------------------------------------
log("Starting local Supabase stack (supabase start) ...");
const startRes = spawnSync("supabase", ["start", "--ignore-health-check"], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
});
if (startRes.error) {
  console.error("[dev] Failed to launch `supabase start`:", startRes.error.message);
  process.exit(1);
}
if (startRes.status !== 0) {
  console.error("[dev] `supabase start` exited with status", startRes.status);
  process.exit(startRes.status ?? 1);
}

// ---------------------------------------------------------------------------
// 3. Serve the Hermes edge function in the foreground (watch logs)
// ---------------------------------------------------------------------------
log("Serving Hermes edge function on http://localhost:54321/functions/v1/hermes ...");
const serveArgs = [
  "functions",
  "serve",
  "hermes",
  "--env-file",
  envFile,
  "--no-verify-jwt",
];

const child = spawn("supabase", serveArgs, {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("error", (err) => {
  console.error("[dev] Failed to spawn supabase functions serve:", err.message);
  process.exit(1);
});

child.on("exit", (code) => {
  log(`Supabase functions serve exited (code ${code ?? 0}).`);
  process.exit(code ?? 0);
});