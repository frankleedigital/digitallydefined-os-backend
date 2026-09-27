/**
 * lib/antigravity.js
 * DigitallyDefined Antigravity MCP client - Notion Architect.
 * Native fetch implementation mirroring lib/notion-client.js.
 *
 * Architect-aware: page creates are normalized + validated against the
 * Notion Architect contract (lib/notion-architect.js) so free-form input
 * (e.g. an LLM proposal) can never produce a malformed Notion payload.
 */
import {
  NOTION_OS_DBS,
  getNotionDbId,
  getNotionPropName,
  getNotionTitleProp,
  getWritableNotionProps,
  notionPropName,
  resolveDbKeyForId,
  buildValidatedPageProperties,
  buildPageChildren,
} from './notion-architect.js';

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

/**
 * Create a page in a Notion database.
 *
 * Two paths:
 *  1. Architect path (preferred) — when the target DB is one of the 8 Notion OS
 *     databases (identified by an explicit `dbKey` or by reverse-looking-up
 *     `databaseId`), the input is run through normalizeNotionRecord →
 *     validateNotionRecord → buildNotionProperties. This guarantees the title
 *     property is named "Name", selects are canonicalized via the synonym table
 *     (so `status: 'live'` becomes `Published`), rich_text is clamped to the
 *     Notion 2000-char limit, and required fields are actually present.
 *  2. Raw path — an unknown database. We can't validate against a contract, so
 *     we emit a correctly-shaped title property. The previous implementation
 *     sent `{ title: [...] }` (a bare array) where Notion expects
 *     `{ title: [...] }` *inside* a named property object; Notion rejected it.
 *
 * @param {object}   opts
 * @param {string}   [opts.dbKey]         architect DB key (ideas|content|assets|money|monthly|reputation|automations|templates)
 * @param {string}   [opts.databaseId]    raw Notion database ID (used when dbKey is unknown)
 * @param {string}   [opts.title]         convenience for the "Name" property
 * @param {string}   [opts.status]        convenience for the "Status" property
 * @param {string}   [opts.content]       page body text → paragraph blocks
 * @param {object}   [opts.properties]    free-form property map
 * @param {string}   [opts.titleProperty] title property name for the raw path (default "Name")
 */
export async function antigravityCreateNotionPage({
  databaseId,
  dbKey,
  title,
  status,
  content,
  properties,
  titleProperty,
} = {}) {
  // 1. Which architect DB is this? Explicit dbKey wins, else reverse-lookup.
  const key = dbKey && NOTION_OS_DBS[dbKey] ? dbKey : resolveDbKeyForId(databaseId);

  // 2. Resolve the target database ID (explicit wins, else the architect env var).
  const resolvedId = databaseId || (key ? getNotionDbId(key) : null);
  if (!resolvedId) {
    throw new Error(
      'databaseId is required (or pass a dbKey whose NOTION_*_DB_ID env var is configured)'
    );
  }

  let notionProperties;

  if (key) {
    // ---- Architect path: normalize → validate → build ----
    const input = { ...(properties || {}) };
    if (title !== undefined && title !== null) input.Name = title;
    if (status !== undefined && status !== null) input.Status = status;

    const built = buildValidatedPageProperties(key, input);
    if (!built.ok) throw new Error(built.error);
    if (!built.properties || Object.keys(built.properties).length === 0) {
      throw new Error(`${NOTION_OS_DBS[key].label}: no writable properties after normalization`);
    }
    notionProperties = built.properties;
  } else {
    // ---- Raw path: unknown DB, no contract available ----
    const propName = titleProperty || 'Name';
    const name = String(title ?? properties?.[propName] ?? '').trim();
    if (!name) throw new Error('title is required for a non-architect database');
    notionProperties = {
      [propName]: { title: [{ text: { content: name.slice(0, 2000) } }] },
    };
  }

  const body = {
    parent: { database_id: resolvedId },
    properties: notionProperties,
  };

  // Only attach children when there is actual body content — Notion rejects an
  // empty children array.
  const children = buildPageChildren(content);
  if (children.length) body.children = children;

  return notionRest('/pages', 'POST', body);
}

/**
 * antigravityReconcileDatabase({ databaseId, dbKey } = {})
 *
 * The "build them" entry point used by the Antigravity Notion Architect flow.
 * Pure schema reconciliation for an EXISTING database:
 *   1. Reads the live database schema (`GET /databases/{id}`) — read-only.
 *   2. Diffs it against the writable Notion Architect contract
 *      (`getWritableNotionProps(dbKey)`).
 *   3. PATCHes only genuinely missing, writable properties. Existing
 *      properties (including renamed live titles such as "Month" or
 *      "Template Name") are left untouched. Read-only contract entries
 *      (e.g. CreatedTime) are never sent.
 *
 * Idempotent: call sites may repeat this safely. A second run with the same
 * contract reports wrote:false with every property in skippedExisting.
 *
 * Returns { databaseId, added: <names>, skippedExisting: <names>,
 *            skippedReadOnly: <names>, typeMismatches: <names> }.
 * A property whose live type differs from the contract type is reported in
 * typeMismatches and never patched (renaming/changing types in Notion
 * requires manual review).
 */
export async function antigravityReconcileDatabase({ databaseId, dbKey } = {}) {
  if (!databaseId) throw new Error('databaseId is required');
  if (!dbKey || !NOTION_OS_DBS[dbKey]) throw new Error(`Unknown architect DB key: ${dbKey}`);

  const live = await notionRest(`/databases/${databaseId}`, 'GET');
  const liveProps = (live && live.properties) || {};

  const wanted = getWritableNotionProps(dbKey);
  const addProps = {};
  const skippedExisting = [];
  const skippedReadOnly = [];
  const typeMismatches = [];

  for (const prop of wanted) {
    const liveName = notionPropName(prop);
    if (liveProps[liveName] !== undefined && liveProps[liveName] !== null) {
      if (liveProps[liveName]?.type === prop.type) {
        skippedExisting.push(liveName);
      } else {
        typeMismatches.push(`${liveName} (live: ${liveProps[liveName]?.type}, contract: ${prop.type})`);
      }
      continue;
    }
    addProps[liveName] = propertyCreatePayload(prop);
  }

  let updated = null;
  if (Object.keys(addProps).length > 0) {
    updated = await antigravityUpdateDatabase({ databaseId, payload: { properties: addProps } });
  }

  // Contract entries that exist only for reads (never written by the Architect).
  for (const prop of NOTION_OS_DBS[dbKey].properties) {
    if (prop.readOnly) skippedReadOnly.push(notionPropName(prop));
  }

  return {
    ok: true,
    dbKey,
    label: NOTION_OS_DBS[dbKey].label,
    databaseId,
    added: Object.keys(addProps),
    skippedExisting,
    skippedReadOnly,
    typeMismatches,
    wrote: updated !== null,
  };
}

/**
 * Translate an architect property spec into a Notion "add property" payload.
 * Select options from the contract are included so the canonical option set
 * ships with the new property.
 */
function propertyCreatePayload(prop) {
  const maxChars = prop.maxChars ?? 2000;
  switch (prop.type) {
    case 'title':
      return { title: {} };
    case 'rich_text':
      return { rich_text: {} };
    case 'email':
      return { email: {} };
    case 'url':
      return { url: {} };
    case 'number':
      return { number: { format: 'number' } };
    case 'date':
      return { date: {} };
    case 'select':
      return {
        select: {
          options: (Array.isArray(prop.options) ? prop.options : []).map((name) => ({ name: String(name) })),
        },
      };
    case 'multi_select':
      return {
        multi_select: {
          options: (Array.isArray(prop.options) ? prop.options : []).map((name) => ({ name: String(name) })),
        },
      };
    default:
      throw new Error(`Unsupported architect property type: ${prop.type}`);
  }
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
    case 'antigravity.reconcileDatabase': return { ok: true, result: await antigravityReconcileDatabase(params) };
    case 'antigravity.runAutomation': return { ok: true, result: await antigravityRunAutomation(params) };
    case 'antigravity.status': return { ok: true, result: antigravityStatus() };
    default: throw new Error(`Unknown Antigravity tool: ${tool}`);
  }
}

export default { antigravityStatus, antigravityCreateNotionPage, antigravityUpdateDatabase, antigravityBuildTemplate, antigravityReconcileDatabase, antigravityRunAutomation, antigravityHandle };