#!/usr/bin/env node
/**
 * api-key-healthcheck.mjs
 *
 * Probes every API key in digitallydefined-os-backend/.env against its
 * upstream service and prints a pass/fail table.
 *
 * Usage:
 *   cd digitallydefined-os-backend
 *   node scripts/api-key-healthcheck.mjs          # readable table
 *   node scripts/api-key-healthcheck.mjs --json   # machine-readable JSON
 *
 * Exit code: 0 = all keys pass, 1 = one or more fail, 2 = config error
 */

import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const c = {
  reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m',
  yellow: '\x1b[33m', cyan: '\x1b[36m', dim: '\x1b[2m',
};
function log(msg, col = 'reset') { process.stdout.write(`${c[col] ?? ''}${msg}${c.reset}\n`); }
function pad(s, n) { return s.padEnd(n); }

// ── Check definitions ────────────────────────────────────────────────────────
const checks = [
  // Core auth & DB
  { key: 'DASHBOARD_API_KEY', label: 'Dashboard API key',
    async check(env) {
      if (!env.DASHBOARD_API_KEY) return null;
      const base = env.vercelUrl || 'https://digitallydefined-os-backend.vercel.app';
      const t = Date.now();
      try {
        const r = await fetch(`${base}/api/hermes/status`, { headers: { 'x-api-key': env.DASHBOARD_API_KEY }, signal: AbortSignal.timeout(10000) });
        if (r.status === 401) return { ok: false, latency: Date.now()-t, detail: 'HTTP 401' };
        if (!r.ok) return { ok: false, latency: Date.now()-t, detail: `HTTP ${r.status}` };
        return { ok: true, latency: Date.now()-t, detail: 'ok' };
      } catch(e) { return { ok: false, latency: Date.now()-t, detail: e.message }; }
    }},
  { key: 'SUPABASE_ANON_KEY', label: 'Supabase anon key',
    async check(env) {
      if (!env.SUPABASE_ANON_KEY) return null;
      const t = Date.now();
      try {
        const r = await fetch(`${env.SUPABASE_URL}/rest/v1/`, {
          headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${env.SUPABASE_ANON_KEY}` },
          signal: AbortSignal.timeout(8000),
        });
        if (r.status===401||r.status===403) return { ok:false, latency:Date.now()-t, detail:'invalid' };
        return { ok:true, latency:Date.now()-t, detail:`HTTP ${r.status}` };
      } catch(e) { return { ok:false, latency:Date.now()-t, detail:e.message }; }
    }},
  { key: 'NOTION_API_KEY', label: 'Notion integration',
    async check(env) {
      if (!env.NOTION_API_KEY) return null;
      const t = Date.now();
      try {
        const r = await fetch('https://api.notion.com/v1/users/me', {
          headers: { Authorization: `Bearer ${env.NOTION_API_KEY}`, 'Notion-Version':'2022-06-28' },
          signal: AbortSignal.timeout(8000),
        });
        if (r.status===401||r.status===403) return { ok:false, latency:Date.now()-t, detail:'invalid token' };
        if (!r.ok) return { ok:false, latency:Date.now()-t, detail:`HTTP ${r.status}` };
        const d = await r.json().catch(()=>null);
        return { ok:true, latency:Date.now()-t, detail: d?.name || 'token valid' };
      } catch(e) { return { ok:false, latency:Date.now()-t, detail:e.message }; }
    }},
  { key: 'GEMINI_API_KEY', label: 'Gemini direct API',
    async check(env) {
      if (!env.GEMINI_API_KEY) return null;
      const model = env.GEMINI_MODEL || 'gemini-3.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;
      const t = Date.now();
      try {
        const r = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({contents:[{parts:[{text:'ok'}]}]}), signal:AbortSignal.timeout(15000) });
        if (r.status===400||r.status===403) return { ok:false, latency:Date.now()-t, detail:`auth/quota HTTP ${r.status}` };
        if (!r.ok) return { ok:false, latency:Date.now()-t, detail:`HTTP ${r.status}` };
        const d = await r.json().catch(()=>null);
        const txt = d?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return { ok: txt.trim().length>0, latency:Date.now()-t, detail: txt.trim().slice(0,40) || 'responded' };
      } catch(e) { return { ok:false, latency:Date.now()-t, detail:e.message }; }
    }},
  { key: 'VERTEX_API_KEY', label: 'Vertex AI (Gemini)',
    async check(env) {
      if (!env.VERTEX_API_KEY || !env.VERTEX_PROJECT_ID) return null;
      const model = env.VERTEX_MODEL || 'gemini-3.5-flash';
      const url = `https://${env.VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/${env.VERTEX_PROJECT_ID}/locations/${env.VERTEX_LOCATION}/publishers/google/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.VERTEX_API_KEY)}`;
      const t = Date.now();
      try {
        const r = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({contents:[{parts:[{text:'ok'}]}]}), signal:AbortSignal.timeout(20000) });
        if (r.status===401||r.status===403) return { ok:false, latency:Date.now()-t, detail:`auth HTTP ${r.status}` };
        if (!r.ok) return { ok:false, latency:Date.now()-t, detail:`HTTP ${r.status}` };
        return { ok:true, latency:Date.now()-t, detail:'vertex responds' };
      } catch(e) { return { ok:false, latency:Date.now()-t, detail:e.message }; }
    }},
  { key: 'OMNIROUTE_API_KEY', label: 'OmniRoute (local Docker)',
    async check(env) {
      if (!env.OMNIROUTE_API_KEY || !env.OMNIROUTE_BASE_URL) return null;
      if (env.OMNIROUTE_BASE_URL.includes('ai.digitallydefined.online'))
        return { ok:false, latency:0, detail:'BASE_URL points at dead host' };
      const url = env.OMNIROUTE_BASE_URL.replace(/\/+$/,'') + '/models';
      const t = Date.now();
      try {
        const r = await fetch(url, { headers:{Authorization:`Bearer ${env.OMNIROUTE_API_KEY}`}, signal:AbortSignal.timeout(8000) });
        if (r.status===401||r.status===403) return { ok:false, latency:Date.now()-t, detail:`auth HTTP ${r.status}` };
        if (!r.ok) return { ok:false, latency:Date.now()-t, detail:`HTTP ${r.status}` };
        return { ok:true, latency:Date.now()-t, detail:'gateway reachable' };
      } catch(e) { return { ok:false, latency:Date.now()-t, detail:e.message }; }
    }},
  { key: 'BREVO_API_KEY', label: 'Brevo email',
    async check(env) {
      if (!env.BREVO_API_KEY) return null;
      const t = Date.now();
      try {
        const r = await fetch('https://api.brevo.com/v3/smtp/email', {
          headers:{'api-key':env.BREVO_API_KEY}, signal:AbortSignal.timeout(8000) });
        if (r.status===401||r.status===403) return { ok:false, latency:Date.now()-t, detail:'invalid key' };
        return { ok:true, latency:Date.now()-t, detail:`HTTP ${r.status} (key valid)` };
      } catch(e) { return { ok:false, latency:Date.now()-t, detail:e.message }; }
    }},
  { key: 'FACEBOOK_ACCESS_TOKEN', label: 'Facebook Graph',
    async check(env) {
      if (!env.FACEBOOK_ACCESS_TOKEN) return null;
      const t = Date.now();
      try {
        const r = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${encodeURIComponent(env.FACEBOOK_ACCESS_TOKEN)}`,
          { signal:AbortSignal.timeout(8000) });
        if (r.status===401) return { ok:false, latency:Date.now()-t, detail:'token expired' };
        if (!r.ok) return { ok:false, latency:Date.now()-t, detail:`HTTP ${r.status}` };
        const d = await r.json().catch(()=>null);
        return { ok:true, latency:Date.now()-t, detail: d?.name || 'valid' };
      } catch(e) { return { ok:false, latency:Date.now()-t, detail:e.message }; }
    }},
  { key: 'GUMROAD_API_KEY', label: 'Gumroad API',
    async check(env) {
      if (!env.GUMROAD_API_KEY) return null;
      const t = Date.now();
      try {
        const r = await fetch('https://api.gumroad.com/v2/products', {
          headers:{Authorization:`Bearer ${env.GUMROAD_API_KEY}`}, signal:AbortSignal.timeout(8000) });
        if (r.status===401) return { ok:false, latency:Date.now()-t, detail:'key invalid' };
        return { ok:true, latency:Date.now()-t, detail:'Gumroad authenticated' };
      } catch(e) { return { ok:false, latency:Date.now()-t, detail:e.message }; }
    }},
  { key: 'EXA_API_KEY', label: 'Exa search',
    async check(env) {
      if (!env.EXA_API_KEY) return null;
      const t = Date.now();
      try {
        const r = await fetch('https://search.exa.ai/v1/query', {
          method:'POST', headers:{'x-api-key':env.EXA_API_KEY,'Content-Type':'application/json'},
          body:JSON.stringify({query:'test',maxResults:1}), signal:AbortSignal.timeout(10000) });
        if (r.status===401) return { ok:false, latency:Date.now()-t, detail:'key invalid' };
        return { ok:true, latency:Date.now()-t, detail:'Exa authenticated' };
      } catch(e) { return { ok:false, latency:Date.now()-t, detail:e.message }; }
    }},
  { key: 'TELEGRAM_BOT_TOKEN', label: 'Telegram bot',
    async check(env) {
      if (!env.TELEGRAM_BOT_TOKEN) return null;
      const t = Date.now();
      try {
        const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getMe`, { signal:AbortSignal.timeout(8000) });
        if (!r.ok) return { ok:false, latency:Date.now()-t, detail:`HTTP ${r.status}` };
        const d = await r.json().catch(()=>null);
        return { ok:true, latency:Date.now()-t, detail:`@${d?.result?.username||'bot'} OK` };
      } catch(e) { return { ok:false, latency:Date.now()-t, detail:e.message }; }
    }},
  { key: 'SLACK_BOT_TOKEN', label: 'Slack bot',
    async check(env) {
      if (!env.SLACK_BOT_TOKEN) return null;
      const t = Date.now();
      try {
        const r = await fetch('https://slack.com/api/auth.test', {
          headers:{Authorization:`Bearer ${env.SLACK_BOT_TOKEN}`}, signal:AbortSignal.timeout(8000) });
        if (!r.ok) return { ok:false, latency:Date.now()-t, detail:`HTTP ${r.status}` };
        const d = await r.json().catch(()=>null);
        return { ok:d?.ok, latency:Date.now()-t, detail:d?.url ?? (d?.error||'?') };
      } catch(e) { return { ok:false, latency:Date.now()-t, detail:e.message }; }
    }},
  { key: 'AGENTOPS_API_KEY', label: 'AgentOps',
    async check(env) {
      if (!env.AGENTOPS_API_KEY) return null;
      const t = Date.now();
      try {
        const r = await fetch('https://api.agentops.ai/v2/projects', {
          headers:{'X-AgentOps-API-Key':env.AGENTOPS_API_KEY}, signal:AbortSignal.timeout(8000) });
        if (r.status===401||r.status===403) return { ok:false, latency:Date.now()-t, detail:'key invalid' };
        return { ok:true, latency:Date.now()-t, detail:'AgentOps authenticated' };
      } catch(e) { return { ok:false, latency:Date.now()-t, detail:e.message }; }
    }},
];

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const jsonFlag = process.argv.includes('--json');

  // Load .env from os-backend explicitly
  const dotEnvPath = join(ROOT, '.env');
  let raw;
  try { raw = readFileSync(dotEnvPath, 'utf-8'); }
  catch { log('ERROR: cannot read .env — run from inside digitallydefined-os-backend/', 'red'); process.exit(2); }

  raw.split('\n').forEach(line => {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (!m) return;
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1,-1);
    if (!process.env[m[1]]) process.env[m[1]] = val;
  });

  const results = [];
  for (const chk of checks) {
    const r = await chk.check(process.env);
    results.push({ ...chk, ...(r || {}) });
  }

  if (jsonFlag) { console.log(JSON.stringify(results, null, 2)); process.exit(0); }

  log('');
  log(`${pad('',4)} ${pad('Key',28)} ${pad('Status',10)} ${pad('Latency',10)} Detail`, 'cyan');
  log('─'.repeat(90));

  let pass = 0, fail = 0, skip = 0;
  for (const r of results) {
    const status = !('ok' in r) ? '⊘ SKIP' : r.ok ? '✓ PASS' : '✗ FAIL';
    const col    = !('ok' in r) ? 'dim' : r.ok ? 'green' : 'red';
    const latency = r.latency != null ? `${r.latency}ms` : '—';
    const detail  = r.detail ?? (!('ok' in r) ? 'not configured' : '');
    log(`${pad('',4)} ${pad(r.label,28)} ${pad(status,10)} ${pad(latency,10)} ${detail}`, col);
    if (!('ok' in r)) skip++; else if (r.ok) pass++; else fail++;
  }

  log('─'.repeat(90));
  log(`  Totals: ${pass} passed · ${fail} failed · ${skip} skipped`, fail > 0 ? 'red' : 'green');
  log('');
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => { log(`Unexpected error: ${e.message}`, 'red'); process.exit(2); });

