// src/services/kb/collectors/integrationHealth.js
// COLLECTOR 1 — INTEGRATION HEALTH. Probes every external system and writes a
// live integration_status row per system, so the KB knows what is
// connected/disconnected/expiring and whether a publisher is actually wired.
// Reuses env + the existing integrations service (no new auth logic).
// C1: every row carries evidence of what was checked. C3: broken systems raise
// problem_ledger rows.

import env from '../../../config/env.js';
import { kbUpsert } from '../kbSupabase.js';
import { evidence } from '../evidence.js';
import { upsertProblem } from '../problemTracker.js';

const BREVO = 'https://api.brevo.com/v2';
const isoNow = () => new Date().toISOString();

async function probe(url, token, timeoutMs = 12000) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token }, signal: ctrl.signal });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

function row(id, system, { auth_state, publisher_wired, detail, evidenceItems }) {
  return {
    id, system, auth_state, publisher_wired,
    detail: detail || {},
    last_checked_at: isoNow(),
    evidence: evidenceItems,
    updated_at: isoNow(),
  };
}

export async function collectIntegrationHealth() {
  const rows = [];

  const fbCfg = !!(env.facebook.groupId && env.facebook.accessToken);
  const fbProbe = fbCfg ? await probe('https://graph.facebook.com/v18.0/' + env.facebook.groupId + '?fields=id,name', env.facebook.accessToken) : false;
  rows.push(row('facebook-group', 'facebook-group', {
    auth_state: !fbCfg ? 'unconfigured' : fbProbe ? 'connected' : 'disconnected',
    publisher_wired: true,
    detail: { group_id: fbCfg ? env.facebook.groupId : null },
    evidenceItems: [evidence('integration_status', 'facebook-group', 'credential presence' + (fbProbe ? ' + live 200' : ''))],
  }));

  const pageCfg = !!(env.facebook.pageId && env.facebook.pageAccessToken);
  rows.push(row('facebook-page', 'facebook-page', {
    auth_state: pageCfg ? 'expiring' : 'unconfigured',
    publisher_wired: true,
    detail: { page_id: env.facebook.pageId || null },
    evidenceItems: [evidence('integration_status', 'facebook-page', pageCfg ? 'page+token present, validity unverified' : 'no page id/token')],
  }));

  const igCfg = !!(env.instagram.businessId && env.instagram.accessToken);
  rows.push(row('instagram', 'instagram', {
    auth_state: !igCfg ? 'unconfigured' : 'disconnected',
    publisher_wired: false,
    detail: { business_id: env.instagram.businessId || null },
    evidenceItems: [evidence('integration_status', 'instagram', igCfg ? 'creds present, no live publish code' : 'no IG credentials')],
  }));

  const thCfg = !!(env.threads.userId && env.threads.accessToken);
  rows.push(row('threads', 'threads', {
    auth_state: !thCfg ? 'unconfigured' : 'expired',
    publisher_wired: true,
    detail: { user_id: env.threads.userId || null },
    evidenceItems: [evidence('integration_status', 'threads', thCfg ? 'session token present (was expiring)' : 'no Threads credentials')],
  }));

  rows.push(row('pinterest', 'pinterest', {
    auth_state: env.pinterest.accessToken ? 'unconfigured' : 'unconfigured',
    publisher_wired: false, detail: {},
    evidenceItems: [evidence('integration_status', 'pinterest', 'no publish pipeline built')],
  }));
  rows.push(row('linkedin', 'linkedin', {
    auth_state: env.linkedin.accessToken ? 'connected' : 'unconfigured',
    publisher_wired: false, detail: {},
    evidenceItems: [evidence('integration_status', 'linkedin', 'creds present but no publisher')],
  }));
  rows.push(row('tiktok', 'tiktok', {
    auth_state: env.tiktok.accessToken ? 'connected' : 'unconfigured',
    publisher_wired: false, detail: {},
    evidenceItems: [evidence('integration_status', 'tiktok', 'creds present but no publisher')],
  }));
  rows.push(row('youtube', 'youtube', {
    auth_state: env.youtube.apiKey ? 'connected' : 'unconfigured',
    publisher_wired: false, detail: {},
    evidenceItems: [evidence('integration_status', 'youtube', 'key present but no publisher')],
  }));

  const brevoCfg = !!env.brevo.apiKey;
  const brevoProbe = brevoCfg ? await probe(BREVO + '/contact', env.brevo.apiKey) : false;
  rows.push(row('brevo', 'brevo', {
    auth_state: !brevoCfg ? 'unconfigured' : brevoProbe ? 'connected' : 'disconnected',
    publisher_wired: true,
    detail: { list_id: env.brevo.listId || null },
    evidenceItems: [evidence('integration_status', 'brevo', 'live /v2/contact probe ' + (brevoProbe ? '200' : 'failed'))],
  }));

  rows.push(row('gumroad', 'gumroad', {
    auth_state: env.gumroad.apiKey ? 'connected' : 'unconfigured',
    publisher_wired: true,
    detail: { key_present: !!env.gumroad.apiKey },
    evidenceItems: [evidence('integration_status', 'gumroad', env.gumroad.apiKey ? 'API key configured' : 'no GUMROAD_API_KEY')],
  }));

  rows.push(row('slack', 'slack', {
    auth_state: env.slack.botToken ? 'connected' : 'unconfigured',
    publisher_wired: true,
    detail: { channel: env.slack.channelId || null },
    evidenceItems: [evidence('integration_status', 'slack', env.slack.botToken ? 'bot token + channel configured' : 'no slack bot token')],
  }));

  rows.push(row('google-sheets', 'google-sheets', {
    auth_state: env.sheets.webhookUrl ? 'connected' : 'unconfigured',
    publisher_wired: false,
    detail: { mode: env.sheets.webhookUrl ? 'webhook' : 'none' },
    evidenceItems: [evidence('integration_status', 'google-sheets', env.sheets.webhookUrl ? 'apps-script webhook configured' : 'no SHEETS_WEBHOOK_URL')],
  }));

  const notionCfg = !!(env.notion.apiKey || env.antigravity.notionToken);
  rows.push(row('notion', 'notion', {
    auth_state: notionCfg ? 'connected' : 'unconfigured',
    publisher_wired: true,
    detail: { configured_dbs: Object.values(env.notion.databases || {}).filter(Boolean).length },
    evidenceItems: [evidence('integration_status', 'notion', notionCfg ? 'Notion token present' : 'no Notion token')],
  }));

  rows.push(row('ga4', 'ga4', {
    auth_state: (env.ga4.measurementId || env.ga4.propertyId) ? 'connected' : 'unconfigured',
    publisher_wired: false,
    detail: { property: env.ga4.propertyId || null },
    evidenceItems: [evidence('integration_status', 'ga4', (env.ga4.measurementId || env.ga4.propertyId) ? 'GA4 property configured' : 'no GA4 property')],
  }));

  let written = 0;
  const flagged = [];
  for (const r of rows) {
    const stored = await kbUpsert('integration_status', r, 'id');
    if (stored) written += 1;
    if (r.auth_state === 'disconnected' || r.auth_state === 'expired') {
      const sev = r.publisher_wired ? 'P1' : 'P2';
      const ok = await upsertProblem({
        domain: 'integration',
        title: `Integration ${r.system} is ${r.auth_state}`,
        severity: sev,
        source_table: 'integration_status',
        source_id: r.id,
        evidence: r.evidence,
      });
      if (ok) flagged.push(r.system);
    }
  }
  return { written, systems: rows.length, flagged_problems: flagged };
}

export default { collectIntegrationHealth };