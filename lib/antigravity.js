/**
 * lib/antigravity.js
 * DigitallyDefined Antigravity MCP client - Notion Architect.
 * Native fetch implementation mirroring lib/notion-client.js.
 */
const ANTIGRAVITY_BASE = String(process.env.ANTIGRAVITY_URL || 'https://mcp.notion.com').trim().replace(/\/+$/, '');
const NOTION_API_BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

function antigravityConfig() {
  return {
    base: ANTIGRAVITY_BASE,
    apiKey: String(process.env.ANTIGRAVITY_API_KEY || '').trim(),
    notionToken: String(process.env.ANTIGRAVITY_NOTION_TOKEN || process.env.NOTION_API_KEY || '').trim(),
    workspaceId: String(process.env.ANTIGRAVITY_WORKSPACE_ID || '').trim(),
  };
}

function antigravityHeaders(extra = {}) {
  const { apiKey } = antigravityConfig();
  return { 'Content-Type': 'application/json', ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}), ...extra };
}

async function mcpPost(path, body, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${ANTIGRAVITY_BASE}${path}`, {
      method: 'POST', headers: antigravityHeaders(), body: JSON.stringify(body || {}), signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || data?.message || `Antigravity MCP error: ${res.status}`);
    return data;
  } finally { clearTimeout(timer); }
}

async function notionRest(path, method, body, timeoutMs = 30000) {
  const { notionToken } = antigravityConfig();
  if (!notionToken) throw new Error('ANTIGRAVITY_NOTION_TOKEN (or NOTION_API_KEY) is not configured');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${NOTION_API_BASE}${path}`, {
      method, headers: { Authorization: `Bearer ${notionToken}`, 'Notion-Version': NOTION_VERSION, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}), signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || `Notion API error: ${res.status}`);
    return data;
  } finally { clearTimeout(timer); }
}

export function antigravityStatus() {
  const cfg = antigravityConfig();
  return { configured: Boolean(cfg.notionToken), base: cfg.base, workspaceId: cfg.workspaceId || null, hasApiKey: Boolean(cfg.apiKey) };
}

export async function antigravityCreateNotionPage({ databaseId, title, status, content, properties } = {}) {
  if (!databaseId) throw new Error('databaseId is required');
  if (!title) throw new Error('title is required');
  return notionRest('/pages', 'POST', {
    parent: { database_id: databaseId },
    properties: { title: [{ text: { content: title } }] },
  });
}

export async function antigravityUpdateDatabase({ databaseId, payload } = {}) {
  if (!databaseId) throw new Error('databaseId is required');
  return notionRest(`/databases/${databaseId}`, 'PATCH', payload && typeof payload === 'object' ? payload : {});
}

export async function antigravityBuildTemplate({ name, schema, parentPageId } = {}) {
  if (!name) throw new Error('name is required');
  const db = await notionRest('/databases', 'POST', {
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ type: 'text', text: { content: name } }],
    ...(schema && typeof schema === 'object' ? schema : { properties: { Name: { title: {} } } }),
  });
  return { ok: true, databaseId: db?.id || null, url: db?.url || null, name };
}

export async function antigravityRunAutomation({ name, databaseId, input } = {}) {
  if (!name) throw new Error('name is required');
  try {
    const mcpResult = await mcpPost('/automations/run', {
      name,
      database_id: databaseId || null,
      workspace_id: antigravityConfig().workspaceId || null,
      input: input && typeof input === 'object' ? input : {},
    });
    if (mcpResult && typeof mcpResult === 'object' && !('error' in mcpResult)) {
      return { ok: true, mode: 'mcp', ...mcpResult };
    }
  } catch {
    // MCP unavailable - fall through to Notion page logging
  }
  const page = await antigravityCreateNotionPage({
    databaseId,
    title: `Automation run: ${name}`,
    status: 'Queued',
    content: typeof input === 'string' ? input : JSON.stringify(input || {}),
  });
  return { ok: true, mode: 'notion-log', pageId: page?.id || null, name };
}

export async function antigravityHandle({ tool, params } = {}) {
  switch (tool) {
    case 'antigravity.createNotionPage': return { ok: true, result: await antigravityCreateNotionPage(params) };
    case 'antigravity.updateDatabase': return { ok: true, result: await antigravityUpdateDatabase(params) };
    case 'antigravity.buildTemplate': return { ok: true, result: await antigravityBuildTemplate(params) };
    case 'antigravity.runAutomation': return { ok: true, result: await antigravityRunAutomation(params) };
    case 'antigravity.status': return { ok: true, result: antigravityStatus() };
    default: throw new Error(`Unknown Antigravity tool: ${tool}`);
  }
}

export default { antigravityStatus, antigravityCreateNotionPage, antigravityUpdateDatabase, antigravityBuildTemplate, antigravityRunAutomation, antigravityHandle };