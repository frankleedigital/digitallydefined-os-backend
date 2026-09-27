/**
 * notion-architect-reconcile.mjs — DB-wins schema reconciliation runner.
 *
 * Uses the Antigravity Notion Architect flow on EXISTING databases:
 * reads the live schema, diffs it against the writable architect contract,
 * and PATCHes only genuinely missing properties. Existing properties
 * (including live titles like "Month" / "Template Name") are untouched,
 * and read-only contract entries are never sent.
 *
 * Usage:
 *   # Always-on dry run: live read, no writes
 *   node scripts/notion-architect-reconcile.mjs
 *   node scripts/notion-architect-reconcile.mjs --db=money,monthly
 *
 *   # Controlled write: PATCH only the diff printed by the dry run
 *   node scripts/notion-architect-reconcile.mjs --apply
 *   node scripts/notion-architect-reconcile.mjs --apply --db=money,monthly
 *
 * Requires local .env: NOTION_API_KEY (read; also used for PATCH in --apply),
 * NOTION_*_DB_ID (the four UUID-style canonical databases).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const args = new Set(process.argv.slice(2));
const APPLY = args.has('--apply');

const onlyRaw = process.argv.find((a) => a.startsWith('--db=')) || '';
const ONLY = new Set(
  onlyRaw.replace(/^--db=/, '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
);

const dashless = (v) => String(v || '').replace(/-/g, '').toLowerCase();
const boxed = (v) => (v ? `${v.slice(0, 8)}-…-${v.slice(-4)}` : '(missing)');

// Minimal local .env loader (no external deps, secrets stay in process).
function loadLocalEnv() {
  const file = path.join(ROOT, '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}
loadLocalEnv();

const { NOTION_OS_DBS, notionPropName } =
  await import('../lib/notion-architect.js');

const TARGETS = ['money', 'monthly', 'reputation', 'templates'].filter((k) => !ONLY.size || ONLY.has(k));

const token = String(process.env.NOTION_API_KEY || '').trim();
if (!token) {
  console.error('NOTION_API_KEY is not configured in the local .env.');
  process.exit(1);
}

async function notion(pathname, method, body, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`https://api.notion.com/v1${pathname}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || `Notion API error: ${res.status}`);
    return data;
  } finally {
    clearTimeout(timer);
  }
}

function createPayload(prop) {
  switch (prop.type) {
    case 'title': return { title: {} };
    case 'rich_text': return { rich_text: {} };
    case 'email': return { email: {} };
    case 'url': return { url: {} };
    case 'number': return { number: { format: 'number' } };
    case 'date': return { date: {} };
    case 'select':
      return { select: { options: (prop.options || []).map((n) => ({ name: String(n) })) } };
    case 'multi_select':
      return { multi_select: { options: (prop.options || []).map((n) => ({ name: String(n) })) } };
    default: throw new Error(`Unsupported architect type: ${prop.type}`);
  }
}

const plan = [];
const failures = [];

for (const key of TARGETS) {
  const spec = NOTION_OS_DBS[key];
  if (!spec) { failures.push({ dbKey: key, reason: `Unknown architect DB key: ${key}` }); continue; }
  const rawId = String(process.env[spec.envVar] || '').trim();
  if (!rawId) { failures.push({ dbKey: key, reason: `${spec.envVar} is not configured` }); continue; }

  let live;
  try {
    live = await notion(`/databases/${rawId}`, 'GET');
  } catch (error) {
    failures.push({ dbKey: key, reason: error instanceof Error ? error.message : String(error) });
    continue;
  }
  const liveProps = live?.properties || {};
  const titleName = Object.keys(liveProps).find((n) => liveProps[n]?.type === 'title') || null;

  const toAdd = {};
  const skippedExisting = [];
  const skippedReadOnly = [];
  const typeMismatches = [];

  for (const prop of spec.properties) {
    if (prop.readOnly) { skippedReadOnly.push(notionPropName(prop)); continue; }
    const liveName = notionPropName(prop);
    if (liveProps[liveName] !== undefined && liveProps[liveName] !== null) {
      if (liveProps[liveName]?.type === prop.type) skippedExisting.push(liveName);
      else typeMismatches.push(`${liveName} (live: ${liveProps[liveName]?.type}, contract: ${prop.type})`);
      continue;
    }
    toAdd[liveName] = createPayload(prop);
  }

  plan.push({ dbKey: key, label: spec.label, envVar: spec.envVar, databaseId: rawId, titleName, toAdd, skippedExisting, skippedReadOnly, typeMismatches });
}

let pending = 0;
console.log(`\nNotion Architect reconcile — ${APPLY ? 'APPLY' : 'DRY RUN (no writes)'}\n`);
for (const p of plan) {
  const names = Object.keys(p.toAdd);
  pending += names.length;
  console.log(`[${p.dbKey}] ${p.label}`);
  console.log(`  databaseId : ${boxed(dashless(p.databaseId))}  title: "${p.titleName || '?'}"`);
  console.log(`  add        : ${names.length ? names.map((n) => `"${n}"`).join(', ') : '(none — already reconciled)'}`);
  console.log(`  existing   : ${p.skippedExisting.length ? p.skippedExisting.map((n) => `"${n}"`).join(', ') : '(none)'}`);
  console.log(`  read-only  : ${p.skippedReadOnly.length ? p.skippedReadOnly.map((n) => `"${n}"`).join(', ') : '(none)'}`);
  if (p.typeMismatches.length) console.log(`  MISMATCH   : ${p.typeMismatches.join('; ')}`);
  console.log('');
}
for (const f of failures) console.log(`[${f.dbKey}] FAILED: ${f.reason}\n`);

console.log(pending === 0 && failures.length === 0
  ? 'All targeted databases already match the writable contract. Nothing to patch.'
  : `${pending} propert${pending === 1 ? 'y' : 'ies'} would be added across ${plan.filter((p) => Object.keys(p.toAdd).length).length} database(s).`);

if (!APPLY) {
  console.log('\nDry run only — re-run with --apply to PATCH the diff above.');
  if (failures.length) process.exitCode = 1;
  process.exit(0);
}

console.log('\n--apply: patching…\n');
let applied = 0;
for (const p of plan) {
  const names = Object.keys(p.toAdd);
  if (!names.length) { console.log(`[${p.dbKey}] already reconciled — skipped.`); continue; }
  try {
    await notion(`/databases/${p.databaseId}`, 'PATCH', { properties: p.toAdd });
    applied += names.length;
    console.log(`[${p.dbKey}] patched: ${names.map((n) => `"${n}"`).join(', ')}`);
  } catch (error) {
    failures.push({ dbKey: p.dbKey, reason: error instanceof Error ? error.message : String(error) });
    console.log(`[${p.dbKey}] PATCH FAILED: ${error instanceof Error ? error.message : String(error)}`);
  }
}
console.log(`\nDone. Patched ${applied} propert${applied === 1 ? 'y' : 'ies'}.${failures.length ? ` ${failures.length} failure(s).` : ''}`);
if (failures.length) process.exitCode = 1;
