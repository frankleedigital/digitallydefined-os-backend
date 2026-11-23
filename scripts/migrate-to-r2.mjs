// scripts/migrate-to-r2.mjs
import { readdirSync, statSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { uploadBuffer } from "../lib/r2Storage.js";

const ROOT = process.argv[2] || "./uploads";
const files = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p); else files.push(p);
  }
}
walk(ROOT);
let ok = 0, fail = 0;
for (const f of files) {
  const key = relative(ROOT, f).replace(/\\/g, "/");
  try { await uploadBuffer(key, readFileSync(f)); console.log("OK", key); ok++; }
  catch (e) { console.error("FAIL", key, e.message); fail++; }
}
console.log(`Done: ${ok} uploaded, ${fail} failed`);
