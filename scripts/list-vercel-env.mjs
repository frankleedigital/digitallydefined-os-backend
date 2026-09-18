/**
 * scripts/list-vercel-env.mjs — list env var keys currently stored on Vercel.
 * Usage: node scripts/list-vercel-env.mjs [prefix]
 */
import fs from "node:fs";
import path from "node:path";

const TOKEN = process.env.VERCEL_TOKEN || JSON.parse(
  fs.readFileSync(
    path.join(process.env.APPDATA, "com.vercel.cli", "Data", "auth.json"),
    "utf8"
  )
).token;

const PROJECT_ID = "prj_VNDzkEW0hMASpUaIJSKGWkYTfuom";
const TEAM_ID = "team_HuCrwoK71yGo1yJDYP2r6ecC";
const prefix = process.argv[2] || "";

const res = await fetch(
  `https://api.vercel.com/v9/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}&decrypt=false&limit=100`,
  { headers: { Authorization: `Bearer ${TOKEN}` } }
);

if (!res.ok) {
  console.error("list failed:", res.status, await res.text());
  process.exit(1);
}

const body = await res.json();
if (process.env.DEBUG_RAW) console.log(JSON.stringify(body).slice(0, 800));

const env = body.env || body.envs || [];
const rows = env
  .filter((e) => (e.key || "").startsWith(prefix))
  .sort((a, b) => (a.key || "").localeCompare(b.key || ""));

console.log(`env vars matching "${prefix}" (${rows.length}):`);
for (const e of rows) {
  console.log(`  ${e.key}  [${(e.target || []).join(",")}]  id=${e.id}`);
}