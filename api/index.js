// /api/index.js
// Hardened unified API handler for Vercel with method validation, env test route, rate limiting, and masked external errors
// Optimized with Brevo email, multi-AI provider routing, caching, and timeouts

import { antigravityHandle } from '../lib/antigravity.js';

const ALLOWED_ORIGINS = [
  'https://dashboard.digitallydefined.online',
  'https://digitallydefined.online',
  'https://www.digitallydefined.online',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
];

// NOTE: Keep these lists in sync with supabase/functions/_shared/action-registry.ts
// (single source of truth). Duplicated here because this file is plain Node/Vercel JS
// and cannot import Deno TS modules.
const ALLOWED_ACTIONS = new Set([
  'status',
  'auth.verify',
  'test-env',
  'dashboard',
  'ai.recommendations',
  'brain.brief',
  'chat',
  'public.chat',
  'mentor.dev',
  'hermes.agent',
  'intelligence',
  'automation.sync',
  'automation.list',
  'automation.logs',
  'automation.events',
  'automation.run',
  'subscribe',
  'contact',
  'quiz.complete',
  'public.chat',
  'integration.googleAnalytics',
  'integration.social',
  'integration.email',
  'integration.community',
  // Integration start flows (dashboard Connect buttons).
  'integration.google.start',
  'integration.social.start',
  'integration.email.start',
  'integration.community.start',
  'license.verify',
  // Antigravity MCP (Notion Architect)
  'antigravity',
  'antigravity.createNotionPage',
  'antigravity.updateDatabase',
  'antigravity.buildTemplate',
  'antigravity.runAutomation',
  'antigravity.status',
  // Live website content store (primary path is the Supabase edge function;
  // mirrored here for the legacy Vercel dispatcher).
  'website.content',
  'website.edit',
]);

const GET_ONLY_ACTIONS = new Set([
  'status',
  'auth.verify',
  'test-env',
]);

// Read-only actions the dashboard issues over the JSON POST contract as well as
// via GET (older clients). These are write-free list/read endpoints, so either
// HTTP verb is safe. Kept in sync with supabase/functions/_shared/action-registry.ts.
const GET_OR_POST_ACTIONS = new Set([
  'dashboard',
  'automation.list',
  'automation.logs',
  'automation.events',
]);

const POST_ONLY_ACTIONS = new Set([
  'automation.sync',
  'automation.run',
]);

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 60;

// Rate limit store with cleanup to prevent memory leaks
const rateLimitStore = globalThis.__digitallyDefinedRateLimitStore || { map: new Map(), lastCleanup: Date.now() };
if (!globalThis.__digitallyDefinedRateLimitStore) {
  globalThis.__digitallyDefinedRateLimitStore = rateLimitStore;
}

// Cleanup old entries every 5 minutes
function cleanupRateLimitStore() {
  const now = Date.now();
  if (now - rateLimitStore.lastCleanup > 5 * 60 * 1000) {
    for (const [ip, bucket] of rateLimitStore.map.entries()) {
      if (now > bucket.resetAt) {
        rateLimitStore.map.delete(ip);
      }
    }
    rateLimitStore.lastCleanup = now;
  }
}

function getRateLimitMap() {
  cleanupRateLimitStore();
  return rateLimitStore.map;
}

const FETCH_TIMEOUT_MS = 5000;

// Accept base URL with or without a trailing "/v1"; always resolve to "<origin>/v1/chat/completions".
function omnirouteEndpoint(raw) {
  const base = String(raw || process.env.OMNIROUTE_BASE_URL || 'https://api.omniroute.ai/v1')
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/v1$/, '');
  return `${base}/v1/chat/completions`;
}

// AI Provider configuration — OmniRoute ONLY (single gateway).
// All AI calls go through OmniRoute, which routes to upstream providers itself.
// Required env: OMNIROUTE_API_KEY. Optional: OMNIROUTE_BASE_URL, OMNIROUTE_MODEL.
const AI_PROVIDERS = {
  omniroute: {
    baseUrl: process.env.OMNIROUTE_BASE_URL || 'https://api.omniroute.ai/v1',
    keyEnv: 'OMNIROUTE_API_KEY',
    models: ['auto'], // OmniRoute auto-selects best available model
    defaultModel: 'auto',
    priority: 0,
  },
};

// Cache for AI brief responses (20 minutes TTL)
const aiBriefCache = globalThis.__aiBriefCache || { data: null, expiry: 0 };
if (!globalThis.__aiBriefCache) {
  globalThis.__aiBriefCache = aiBriefCache;
}

// Cache for Brevo stats (15 minutes TTL)
const brevoCache = globalThis.__brevoCache || { data: null, expiry: 0 };
if (!globalThis.__brevoCache) {
  globalThis.__brevoCache = brevoCache;
}

const formatPct = (n) => `${Number.isFinite(n) ? n.toFixed(1) : '0.0'}%`;
const formatUSD = (n) => `$${Number.isFinite(n) ? n.toLocaleString() : '0'}`;

function safeNumber(value, fallback = 0) {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[$,%\s,]/g, '');
    const parsed = Number(cleaned);
    return Number.isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

function safeString(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function getJsonContentType(headers) {
  return headers.get('content-type') || '';
}

async function parseJsonSafe(res, fallback = null) {
  try {
    const contentType = getJsonContentType(res.headers);
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      return text ? JSON.parse(text) : fallback;
    }
    return await res.json();
  } catch {
    return fallback;
  }
}

// Strip common Markdown so AI replies render as clean plain text in the dashboard.
function stripMarkdown(raw) {
  let text = String(raw || '');
  // Remove fenced code blocks markers, keep inner content.
  text = text.replace(/```[\s\S]*?```/g, (block) => block.replace(/```/g, '').trim());
  text = text.replace(/`([^`]*)`/g, '$1');
  // Headings, blockquote, horizontal rules, task boxes.
  text = text.replace(/^#{1,6}\s+/gm, '');
  text = text.replace(/^>\s?/gm, '');
  text = text.replace(/^\s*([-*_])\s*\1\s*\1\s*$/gm, '');
  text = text.replace(/^\s*[-[\] ]\s*\[\s*[ xX]?\s*\]\s*/gim, '- ');
  // Emphasis markers (bold/italic/underline/strike), keep inner text.
  text = text.replace(/\*\*([^*\r\n]+)\*\*/g, '$1');
  text = text.replace(/__([^_\r\n]+)__/g, '$1');
  text = text.replace(/\*([^*\r\n]+)\*/g, '$1');
  text = text.replace(/_([^_\r\n]+)_/g, '$1');
  text = text.replace(/~~([^~\r\n]+)~~/g, '$1');
  // Links: keep only the label text.
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  // Bullet markers -> plain dash.
  text = text.replace(/^\s*[*+]\s+/gm, '- ');
  text = text.replace(/[~^]{1,}/g, '');
  text = text.replace(/\*/g, '');
  // Orphan markdown fencing.
  text = text.replace(/^```\s*/gm, '');
  text = text.replace(/```\s*$/gm, '');
  // Remove decorative symbols/emoji, keep letters/numbers/safe punctuation.
  text = text.replace(/[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2600}-\u{27BF}\u{00B7}\u{2022}\u{2023}\u{2043}\u{25A0}-\u{25FF}\u{2B00}-\u{2BFF}]/gu, '');
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
}

// Fetch with timeout protection
async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  }
}

function applyCors(req, res) {
  const origin = req.headers.origin;

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://dashboard.digitallydefined.online');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-api-key, apikey, x-user-id, X-User-Id'
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin');
}

function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

function applyRateLimit(req, res) {
  const ip = getClientIp(req);
  const now = Date.now();
  const map = getRateLimitMap();
  const bucket = map.get(ip);

  if (!bucket || now > bucket.resetAt) {
    const freshBucket = {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    };
    map.set(ip, freshBucket);
    res.setHeader('X-RateLimit-Limit', String(RATE_LIMIT_MAX_REQUESTS));
    res.setHeader('X-RateLimit-Remaining', String(RATE_LIMIT_MAX_REQUESTS - 1));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(freshBucket.resetAt / 1000)));
    return null;
  }

  if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    res.setHeader('Retry-After', String(retryAfter));
    res.setHeader('X-RateLimit-Limit', String(RATE_LIMIT_MAX_REQUESTS));
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));
    return {
      status: 429,
      body: { error: 'Too many requests. Please try again shortly.' },
    };
  }

  bucket.count += 1;
  res.setHeader('X-RateLimit-Limit', String(RATE_LIMIT_MAX_REQUESTS));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, RATE_LIMIT_MAX_REQUESTS - bucket.count)));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));
  return null;
}

function checkDashboardApiKey(req) {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.DASHBOARD_API_KEY;
  if (!expectedKey) return true;
  return apiKey === expectedKey;
}

function validateMethodForAction(req, action) {
  if (!action || action === 'status') return null;

  // FastAPI microservice proxy actions are forwarded verbatim (POST only).
  if (action.startsWith('fastapi.')) {
    return req.method !== 'POST'
      ? { status: 405, body: { error: `Method ${req.method} not allowed for action ${action}. Use POST.` } }
      : null;
  }

  if (!ALLOWED_ACTIONS.has(action)) {
    return {
      status: 404,
      body: { error: `Unknown action: ${action}` },
    };
  }

  if (GET_ONLY_ACTIONS.has(action) && req.method !== 'GET') {
    return {
      status: 405,
      body: { error: `Method ${req.method} not allowed for action ${action}. Use GET.` },
    };
  }

  if (POST_ONLY_ACTIONS.has(action) && req.method !== 'POST') {
    return {
      status: 405,
      body: { error: `Method ${req.method} not allowed for action ${action}. Use POST.` },
    };
  }

  // Read-only dashboard actions are issued over the JSON POST contract from the
  // frontend, but some older clients still hit them via GET. Allow either method
  // so the real dashboard remains functional (POST) and legacy callers keep working (GET).
  if (GET_OR_POST_ACTIONS.has(action) && !['GET', 'POST'].includes(req.method)) {
    return {
      status: 405,
      body: { error: `Method ${req.method} not allowed for action ${action}. Use GET or POST.` },
    };
  }

  return null;
}

function maskErrorDetails(err, source) {
  const message = err?.message || 'Unknown external service error';
  const isAuth = /unauthorized|forbidden|token|credential|secret|apikey|api key|access denied/i.test(message);
  const isRate = /rate limit|too many requests|quota/i.test(message);
  const isTimeout = /timeout|timed out|aborted/i.test(message);

  if (isAuth) {
    return `${source} request failed due to authentication or permission settings.`;
  }
  if (isRate) {
    return `${source} request was rate limited.`;
  }
  if (isTimeout) {
    return `${source} request timed out.`;
  }
  return `${source} request failed.`;
}

// ---- Notion snapshot for the dashboard Notion tab ----
// NotionTab expects a `notion` object keyed by database (ideas, content,
// automations, publishingQueue, approvals, buyerSignals, aiDrafts, ...). We read
// the configured production databases via the Notion API and return the most
// recent pages. When the Notion env vars aren't set (or a read fails) we degrade
// gracefully to the empty shape so the dashboard never errors, and we surface a
// `configured`/`error` flag for diagnostics.
const NOTION_SNAPSHOT_DB_KEYS = [
  ['ideas', 'NOTION_IDEAS_DB_ID'],
  ['content', 'NOTION_CONTENT_DB_ID'],
  ['automations', 'NOTION_AUTOMATIONS_DB_ID'],
  ['publishingQueue', 'NOTION_PUBLISHING_QUEUE_DB_ID'],
  ['approvals', 'NOTION_CONTENT_APPROVALS_DB_ID'],
  ['buyerSignals', 'NOTION_BUYER_SIGNALS_DB_ID'],
  ['aiDrafts', 'NOTION_AI_CONTENT_DRAFTS_DB_ID'],
];

function emptyNotionSnapshot() {
  return {
    configured: false,
    ideas: [],
    content: [],
    automations: [],
    publishingQueue: [],
    approvals: [],
    buyerSignals: [],
    aiDrafts: [],
    intakeAlerts: [],
    ideasAlerts: [],
    assets: [],
    money: [],
    monthly: [],
    reputation: [],
    templates: [],
  };
}

// Minimal Notion page-text extraction (first title property found).
function notionPageTitle(page) {
  try {
    const props = page?.properties || {};
    for (const prop of Object.values(props)) {
      const arr = prop?.title || [];
      if (Array.isArray(arr) && arr.length && arr[0]?.text?.content) {
        return arr[0].text.content;
      }
    }
  } catch {
    /* ignore */
  }
  return (page?.id || '').slice(0, 8);
}

// Pull a status from the first select/status property, if present.
function notionPageStatus(page) {
  try {
    const props = page?.properties || {};
    for (const prop of Object.values(props)) {
      if (prop?.select?.name) return prop.select.name;
      if (prop?.status?.name) return prop.status.name;
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function fetchNotionSnapshot() {
  const token = process.env.NOTION_API_KEY || process.env.NOTION_SECRET || '';
  const snapshot = emptyNotionSnapshot();

  if (!token) {
    snapshot.error = 'NOTION_API_KEY or NOTION_SECRET is not set in the backend environment.';
    return snapshot;
  }

  snapshot.configured = true;
  snapshot.error = null;

  let hadAuthError = false;
  for (const [key, envName] of NOTION_SNAPSHOT_DB_KEYS) {
    const dbId = (process.env[envName] || '').trim();
    if (!dbId) continue;
    try {
      const dbRes = await fetchWithTimeout(
        `https://api.notion.com/v1/databases/${dbId}/query`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ page_size: 25 }),
        },
      );
      if (!dbRes.ok) {
        if (dbRes.status === 401 || dbRes.status === 403) hadAuthError = true;
        continue;
      }
      const data = await parseJsonSafe(dbRes, { results: [] });
      const results = Array.isArray(data.results) ? data.results : [];
      snapshot[key] = results.map((page) => ({
        id: page?.id,
        pageId: page?.id,
        title: notionPageTitle(page),
        status: notionPageStatus(page) || 'ok',
        url: `https://notion.so/${(page?.id || '').replace(/-/g, '')}`,
        last_edited_time: page?.last_edited_time || null,
      }));
    } catch {
      // A single database failing must not fail the whole dashboard sync.
    }
  }

  if (hadAuthError) {
    snapshot.error =
      'Notion token is unauthorized for the configured databases. ' +
      'Verify NOTION_API_KEY/NOTION_SECRET and share each database with the Notion integration.';
  }

  return snapshot;
}

async function fetchFacebookGroup() {
  const groupId = process.env.FACEBOOK_GROUP_ID;
  const token = process.env.FACEBOOK_ACCESS_TOKEN;

  if (!groupId || !token) {
    return { name: null, member_count: 0, error: 'Facebook env vars not set' };
  }

  try {
    const url = new URL(`https://graph.facebook.com/v18.0/${groupId}`);
    url.searchParams.set('fields', 'name,member_count,privacy');
    url.searchParams.set('access_token', token);

    const res = await fetchWithTimeout(url.toString());
    const data = await parseJsonSafe(res, {});

    if (!res.ok) throw new Error(data?.error?.message || 'Facebook API error');

    return {
      name: data?.name || null,
      member_count: safeNumber(data?.member_count, 0),
      error: null,
      debug: null,
    };
  } catch (e) {
    return {
      name: null,
      member_count: 0,
      error: maskErrorDetails(e, 'Facebook API'),
      debug: process.env.NODE_ENV !== 'production' ? e.message || 'Facebook fetch failed' : null,
    };
  }
}

// Brevo (formerly Sendinblue) email marketing integration - replaces SendPulse
async function fetchBrevoStats() {
  const apiKey = process.env.BREVO_API_KEY;
  
  // Return cached data if still valid (15 min TTL)
  const now = Date.now();
  if (brevoCache.data && now < brevoCache.expiry) {
    return { ...brevoCache.data, fromCache: true };
  }

  if (!apiKey) {
    return {
      totalSubscribers: 0,
      emailOpenRate: '0.0%',
      emailClickRate: '0.0%',
      emailReplyRate: 'N/A',
      emailRevenuePerCampaign: '$0',
      topCampaigns: [],
      error: 'Brevo API key not set',
      debug: null,
    };
  }

  try {
    const headers = {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    };

    // Fetch contacts count and recent campaigns
    const [contactsRes, campaignsRes] = await Promise.all([
      fetchWithTimeout('https://api.brevo.com/v3/contacts?limit=1', { headers }),
      fetchWithTimeout('https://api.brevo.com/v3/emailCampaigns?limit=5', { headers }),
    ]);

    const contactsData = contactsRes.ok ? await parseJsonSafe(contactsRes, {}) : {};
    const campaignsData = campaignsRes.ok ? await parseJsonSafe(campaignsRes, {}) : {};

    if (!contactsRes.ok) {
      throw new Error(contactsData?.message || 'Brevo contacts request failed');
    }

    const totalSubscribers = safeNumber(contactsData?.count, 0);
    const campaigns = Array.isArray(campaignsData?.campaigns) ? campaignsData.campaigns : [];

    const withStats = campaigns.filter((c) => safeNumber(c?.stats?.sent, 0) > 0);

    const normalizedCampaigns = campaigns.slice(0, 5).map((c) => {
      const sent = safeNumber(c?.stats?.sent, 0);
      const opened = safeNumber(c?.stats?.uniqueOpened, 0);
      const clicked = safeNumber(c?.stats?.uniqueClicked, 0);
      return {
        name: c?.name || c?.subject || 'Campaign',
        openRate: sent > 0 ? formatPct((opened / sent) * 100) : '0.0%',
        clickRate: sent > 0 ? formatPct((clicked / sent) * 100) : '0.0%',
        revenue: '$0',
      };
    });

    const avgOpenRate = withStats.length
      ? withStats.reduce((sum, c) => {
          const sent = safeNumber(c?.stats?.sent, 0);
          const opened = safeNumber(c?.stats?.uniqueOpened, 0);
          return sum + (sent > 0 ? (opened / sent) * 100 : 0);
        }, 0) / withStats.length
      : 0;

    const avgClickRate = withStats.length
      ? withStats.reduce((sum, c) => {
          const sent = safeNumber(c?.stats?.sent, 0);
          const clicked = safeNumber(c?.stats?.uniqueClicked, 0);
          return sum + (sent > 0 ? (clicked / sent) * 100 : 0);
        }, 0) / withStats.length
      : 0;

    const result = {
      totalSubscribers,
      emailOpenRate: formatPct(avgOpenRate),
      emailClickRate: formatPct(avgClickRate),
      emailReplyRate: 'N/A',
      emailRevenuePerCampaign: '$0',
      topCampaigns: normalizedCampaigns,
      error: null,
      debug: null,
    };

    // Cache for 15 minutes
    brevoCache.data = result;
    brevoCache.expiry = now + 15 * 60 * 1000;

    return result;
  } catch (e) {
    const errorResult = {
      totalSubscribers: 0,
      emailOpenRate: '0.0%',
      emailClickRate: '0.0%',
      emailReplyRate: 'N/A',
      emailRevenuePerCampaign: '$0',
      topCampaigns: [],
      error: maskErrorDetails(e, 'Brevo API'),
      debug: process.env.NODE_ENV !== 'production' ? e.message || 'Brevo fetch failed' : null,
    };
    
    // Cache error briefly to avoid repeated failures
    brevoCache.data = errorResult;
    brevoCache.expiry = now + 2 * 60 * 1000;
    
    return errorResult;
  }
}

async function fetchSheetsData() {
  const sheetsUrl = process.env.SHEETS_WEBHOOK_URL;
  if (!sheetsUrl) return { data: null, error: 'Sheets webhook not set', debug: null };

  try {
    const url = new URL(sheetsUrl);
    url.searchParams.set('action', 'dashboard');
    url.searchParams.set('t', String(Date.now()));

    const res = await fetchWithTimeout(url.toString(), {
      headers: { 'Cache-Control': 'no-store' },
    });

    if (!res.ok) {
      throw new Error(`Sheets returned ${res.status}`);
    }

    return { data: await parseJsonSafe(res, null), error: null, debug: null };
  } catch (err) {
    console.error('Sheets fetch failed:', err);
    return {
      data: null,
      error: maskErrorDetails(err, 'Google Sheets webhook'),
      debug: process.env.NODE_ENV !== 'production' ? err.message || 'Sheets fetch failed' : null,
    };
  }
}

// AI brief with caching — OmniRoute first, direct Gemini fallback (Linode may be down)
async function runGeminiAgent(message, systemPrompt, options = {}) {
  const resolvedSystemPrompt = String(systemPrompt || 'You are the DigitallyDefined Operations AI. Be concise and actionable.').trim();
  const resolvedMessage = String(message || '').trim();
  const omnirouteKey = (process.env.OMNIROUTE_API_KEY || '').trim();
  const geminiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
  const omnirouteModel = process.env.OMNIROUTE_MODEL || process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  const geminiModel = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

  if (!omnirouteKey && !geminiKey) {
    throw new Error('No AI API key configured for Gemini agent responses.');
  }

  const requestBody = {
    messages: [
      { role: 'system', content: resolvedSystemPrompt },
      { role: 'user', content: resolvedMessage },
    ],
    ...(options.jsonMode ? { response_format: { type: 'json_object' } } : {}),
  };

  // Try OmniRoute first, then fall back to Gemini's OpenAI-compatible endpoint.
  const providers = [];
  if (omnirouteKey) {
    providers.push({
      name: 'omniroute',
      url: omnirouteEndpoint(process.env.OMNIROUTE_BASE_URL || 'https://api.omniroute.ai/v1'),
      key: omnirouteKey,
      model: omnirouteModel,
    });
  }
  if (geminiKey) {
    providers.push({
      name: 'gemini-direct',
      url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      key: geminiKey,
      model: geminiModel,
    });
  }

  let lastError = 'No AI provider attempted';
  for (const provider of providers) {
    try {
      const res = await fetchWithTimeout(provider.url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${provider.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...requestBody, model: provider.model }),
      }, 60000);

      const data = await parseJsonSafe(res, {});
      if (!res.ok) {
        throw new Error(data?.error?.message || `AI request failed with status ${res.status}`);
      }

      const raw = data?.choices?.[0]?.message?.content || '';
      const reply = String(raw).trim();
      if (!reply) {
        throw new Error('Gemini agent returned an empty response.');
      }

      return {
        reply,
        provider: provider.name,
        model: provider.model,
      };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.error(`[runGeminiAgent] ${provider.name} failed:`, lastError);
    }
  }

  throw new Error(lastError);
}

async function fetchAIBrief(context) {
  const now = Date.now();
  
  // Return cached data if still valid (20 min TTL)
  if (aiBriefCache.data && now < aiBriefCache.expiry) {
    return { ...aiBriefCache.data, fromCache: true };
  }

  // OmniRoute ONLY — single provider, no fallback providers.
  const omnirouteProvider = AI_PROVIDERS.omniroute;
  const apiKey = process.env[omnirouteProvider.keyEnv];
  const selectedProvider = apiKey ? omnirouteProvider : null;
  // Allow env override for model, otherwise use default
  const model = (apiKey && (process.env.OMNIROUTE_MODEL || omnirouteProvider.defaultModel)) || null;

  if (!selectedProvider || !apiKey) {
    return {
      working: ['AI brief unavailable — No AI provider API key set.'],
      slipping: [],
      nextActions: [],
      error: 'No AI provider configured',
      debug: null,
    };
  }

  const prompt = `You are analyzing a digital business dashboard for DigitallyDefined — a faceless digital asset business targeting Gen X women.
Current stats:
- Community members: ${context.communityCount}
- Community growth: ${context.communityGrowth}
- Email subscribers: ${context.emailSubscribers}
- Email open rate: ${context.emailOpenRate}
- Email click rate: ${context.emailClickRate}
- Top performing asset: ${context.topAsset}
- Revenue this period: ${context.revenue}
Respond ONLY with a JSON object in this exact format (no markdown, no extra text):
{
  "working": ["one sentence max per item, 2-3 items"],
  "slipping": ["one sentence max per item, 1-2 items"],
  "nextActions": ["one sentence max per item, 1-2 items"]
}`;

  try {
    // For OmniRoute and similar auto-routing providers, don't specify model to let them choose
    const requestBody = {
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    };
    
    // Only add model if it's not 'auto' (for providers like OmniRoute that auto-select)
    if (model !== 'auto') {
      requestBody.model = model;
    } else {
      // Some providers need a model field even for auto-selection
      requestBody.model = 'auto';
    }

    const res = await fetchWithTimeout(omnirouteEndpoint(selectedProvider.baseUrl), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await parseJsonSafe(res, {});
    if (!res.ok) {
      throw new Error(data?.error?.message || `${selectedProvider.keyEnv || selectedProvider.defaultModel} API error`);
    }

    const raw = data?.choices?.[0]?.message?.content || '{}';
    const cleaned = String(raw).replace(/```json|```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        working: ['AI returned non-JSON output.'],
        slipping: [],
        nextActions: ['Tighten prompt or validate model response.'],
      };
    }

    const result = {
      working: Array.isArray(parsed?.working) ? parsed.working : [],
      slipping: Array.isArray(parsed?.slipping) ? parsed.slipping : [],
      nextActions: Array.isArray(parsed?.nextActions) ? parsed.nextActions : [],
      error: null,
      debug: null,
      provider: Object.keys(AI_PROVIDERS).find(key => AI_PROVIDERS[key] === selectedProvider) || 'unknown',
    };

    // Cache for 20 minutes
    aiBriefCache.data = result;
    aiBriefCache.expiry = now + 20 * 60 * 1000;

    return result;
  } catch (err) {
    const providerKey = Object.keys(AI_PROVIDERS).find(key => AI_PROVIDERS[key] === selectedProvider) || 'AI';
    const errorResult = {
      working: ['Community is active and syncing.'],
      slipping: ['AI brief could not be generated right now.'],
      nextActions: [`Verify ${providerKey} credentials and model settings if this persists.`],
      error: maskErrorDetails(err, `${providerKey} API`),
      debug: process.env.NODE_ENV !== 'production' ? err.message || 'AI request failed' : null,
    };
    
    // Cache error briefly
    aiBriefCache.data = errorResult;
    aiBriefCache.expiry = now + 5 * 60 * 1000;
    
    return errorResult;
  }
}

function buildAlerts(checks) {
  const alerts = [];

  if (!checks.facebookEnvSet) {
    alerts.push({
      type: 'warning',
      source: 'Facebook',
      message: 'FACEBOOK_GROUP_ID or FACEBOOK_ACCESS_TOKEN not set in backend env vars.',
    });
  } else if (checks.facebookError) {
    alerts.push({
      type: 'critical',
      source: 'Facebook API',
      message: checks.facebookError,
    });
  }

  if (checks.emailError) {
    alerts.push({
      type: 'warning',
      source: 'Brevo',
      message: checks.emailError,
    });
  }

  if (checks.sheetsError) {
    alerts.push({
      type: 'info',
      source: 'Google Sheets',
      message: checks.sheetsError,
    });
  }

  if (!checks.aiProviderSet) {
    alerts.push({
      type: 'info',
      source: 'AI Brief',
      message: 'No AI provider API key set — AI Command Brief is using fallback text.',
    });
  } else if (checks.aiError) {
    alerts.push({
      type: 'info',
      source: `AI Brief (${checks.aiProvider})`,
      message: checks.aiError,
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      type: 'info',
      source: 'System',
      message: 'All systems syncing normally. No active alerts.',
    });
  }

  return alerts;
}

function buildEnvStatus() {
  // Check which AI providers are available
  const aiProviders = {};
  for (const [name, config] of Object.entries(AI_PROVIDERS)) {
    aiProviders[`${name}Set`] = !!process.env[config.keyEnv];
  }

  return {
    dashboardApiKeySet: !!process.env.DASHBOARD_API_KEY,
    facebookGroupIdSet: !!process.env.FACEBOOK_GROUP_ID,
    facebookAccessTokenSet: !!process.env.FACEBOOK_ACCESS_TOKEN,
    brevoApiKeySet: !!process.env.BREVO_API_KEY,
    sheetsWebhookUrlSet: !!process.env.SHEETS_WEBHOOK_URL,
    ...aiProviders,
    vercelEnv: process.env.VERCEL_ENV || 'unknown',
    nodeEnv: process.env.NODE_ENV || 'unknown',
  };
}

export default async function handler(req, res) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rateLimitResult = applyRateLimit(req, res);
  if (rateLimitResult) {
    return res.status(rateLimitResult.status).json(rateLimitResult.body);
  }

  const action = typeof req.query?.action === 'string'
    ? req.query.action
    : typeof req.body?.action === 'string'
      ? req.body.action
      : 'status';
  const methodValidation = validateMethodForAction(req, action);

  if (methodValidation) {
    return res.status(methodValidation.status).json(methodValidation.body);
  }

  try {
    if (action.startsWith('fastapi.')) {
      if (!checkDashboardApiKey(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      // Maps `fastapi.<sub>` to the FastAPI microservice route.
      const FASTAPI_ROUTES = {
        product: '/product-generator/generate',
        niche: '/niche/score',
        domain: '/domain/analyze',
        affiliate: '/affiliate/flip',
        rankrent: '/rank-rent/analyze',
        blueprint: '/blueprint/generate',
        roadmap: '/roadmap/generate',
        trends: '/trends',
      };
      const sub = action.replace('fastapi.', '');
      const route = FASTAPI_ROUTES[sub];
      if (!route) {
        return res.status(400).json({ error: `Unknown fastapi action: ${action}` });
      }

      const base = String(process.env.FASTAPI_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');
      const { action: _action, key: _key, ...rest } = req.body || {};
      // Frontends send { action, inputData }. FastAPI expects request fields at the
      // top level, so unwrap a single `inputData` envelope when present.
      const inputData = (rest.inputData && typeof rest.inputData === 'object' && !Array.isArray(rest.inputData))
        ? rest.inputData
        : rest;
      const upstream = await fetchWithTimeout(`${base}${route}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': process.env.FASTAPI_API_KEY || process.env.DASHBOARD_API_KEY || '',
        },
        body: JSON.stringify(inputData),
      });
      const text = await upstream.text();
      const contentType = upstream.headers.get('content-type') || 'application/json';
      return res.status(upstream.status).setHeader('content-type', contentType).send(text);
    }

    if (action === 'status') {
      return res.status(200).json({
        ok: true,
        service: 'digitallydefined-os-backend',
        environment: process.env.NODE_ENV === 'production' ? 'production' : process.env.VERCEL_ENV || 'development',
      });
    }

    if (action === 'test-env') {
      if (!checkDashboardApiKey(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      return res.status(200).json({
        status: 'ok',
        env: buildEnvStatus(),
      });
    }

    if (action === 'auth.verify') {
      if (!checkDashboardApiKey(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      return res.status(200).json({ ok: true });
    }

    if (action === 'ai.recommendations') {
      return res.status(200).json({
        recommendations: [
          "Update the Rank & Rent asset for 'CT Roofing' — competitor activity increased.",
          'Create a new review follow-up workflow for Customer OS.',
          'Sync Vault — 12 new assets detected.',
        ],
      });
    }

    if (action === 'chat' || action === 'public.chat' || action === 'hermes.agent') {
      if (!checkDashboardApiKey(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const message = String(req.body?.message || '').trim();
      if (!message) {
        return res.status(400).json({ error: 'A message is required' });
      }

      const userSystemPrompt = String(req.body?.systemPrompt || 'You are the DigitallyDefined Operations AI. Be concise, strategic, and actionable.').trim();
      const conversation = Array.isArray(req.body?.conversation) ? req.body.conversation : [];

      try {
        const result = await runGeminiAgent(
          `Current conversation context:\n${JSON.stringify(conversation.slice(-8))}\n\nUser request:\n${message}`,
          `${userSystemPrompt}\n\nOUTPUT FORMAT (strict): Respond in plain text only. No markdown, no code fences, no backticks, no emojis. Use plain paragraphs or simple dashes.`,
        );

        return res.status(200).json({
          ok: true,
          reply: stripMarkdown(result.reply),
          provider: result.provider,
          model: result.model,
        });
      } catch (error) {
        return res.status(502).json({
          error: error instanceof Error ? error.message : 'AI agent request failed',
        });
      }
    }

    if (action === 'intelligence') {
      if (!checkDashboardApiKey(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      return res.status(200).json({
        ok: true,
        success: true,
        data: {
          superpower: 'Builder',
          superpowerDescription: 'You are positioned to turn expertise into a faceless digital asset system.',
          recommendations: [
            'Nail a single niche before expanding the offer suite.',
            'Convert the top review gains into a repeatable content flywheel.',
            'Create one asset-focused automation instead of layering more work.',
          ],
          roadmap: {
            estimatedTime: '30-60 days',
            steps: [
              'Define the narrowest viable offer.',
              'Build one trusted asset that captures demand.',
              'Automate the follow-up flow behind that asset.',
            ],
          },
        },
      });
    }

    if (action === 'brain.brief') {
      return res.status(200).json({
        generatedAt: '2026-05-25T17:25:00-04:00',
        status: 'ok',
        daily_brief: {
          headline: 'One-sentence executive summary',
          summary: 'Short paragraph explaining what matters most today.',
          priority: 'high',
        },
        market_gaps: [
          {
            title: 'Underserved offer angle',
            why_it_matters: 'Why this looks profitable now',
            source: 'Notion + Perplexity + Sheets',
            confidence: 88,
            recommended_action: 'Create lead magnet or validate with content',
          },
        ],
        build_next: {
          asset_type: 'Lead magnet',
          title: 'Gen X digital income angle',
          reason: 'Best mix of demand, speed, and fit',
          cta: 'Draft in Notion AI agent',
        },
        stale_automations: [
          {
            name: 'Ideas Intake enrichment',
            tool: 'Gumloop',
            issue: 'No sync in 48 hours',
            severity: 'medium',
          },
        ],
        urgent_alerts: [
          {
            title: 'Meta insights sync failed',
            detail: 'Last successful pull was over 24h ago',
            action: 'Check Vercel env or token',
          },
        ],
        source_health: {
          notion: 'connected',
          antigravity: 'connected',
          google_sheets: 'connected',
          slack: 'connected',
          gumloop: 'connected',
          meta_api: 'connected',
        },
      });
    }

    if (action === 'automation.sync') {
      if (!checkDashboardApiKey(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Vault synced successfully',
        timestamp: Date.now(),
        data: {
          leads: 12,
          revenue: 48000,
          conversion: 0.18,
        },
      });
    }

    if (action === 'automation.list') {
      return res.status(200).json({
        status: 'success',
        automations: [
          { id: 'auto-001', name: 'Daily Vault Sync', status: 'active' },
          { id: 'auto-002', name: 'Lead Enrichment', status: 'active' },
        ],
      });
    }

    if (action === 'automation.logs') {
      return res.status(200).json({
        status: 'success',
        logs: [
          { id: 'log-001', event: 'Vault Sync Completed', timestamp: Date.now() },
          { id: 'log-002', event: 'Lead Enrichment Triggered', timestamp: Date.now() - 3600000 },
        ],
      });
    }

    if (action === 'automation.run') {
      if (!checkDashboardApiKey(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Dashboard command executed',
      });
    }

    if (action === 'automation.events') {
      return res.status(200).json({
        status: 'success',
        events: [{ id: 'evt-001', type: 'sync', timestamp: Date.now() }],
      });
    }

    if (action === 'dashboard') {
      if (!checkDashboardApiKey(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Parallel fetch with Brevo replacing SendPulse
      const [fbData, brevoData, sheetsResult] = await Promise.all([
        fetchFacebookGroup(),
        fetchBrevoStats(),
        fetchSheetsData(),
      ]);

      const sheetsData = sheetsResult.data;

      const communityCount = safeNumber(fbData?.member_count, safeNumber(sheetsData?.communityCount, 0));
      const revenueNumber = safeNumber(sheetsData?.revenue, NaN);
      const revenue = Number.isFinite(revenueNumber)
        ? formatUSD(revenueNumber)
        : safeString(sheetsData?.revenue, '$0');

      const leads = safeNumber(sheetsData?.leads, 0);
      const topAsset = safeString(sheetsData?.topAsset, 'N/A');
      const assetValue = safeString(sheetsData?.assetValue, '$0');

      const rawSiteHealth = sheetsData?.siteHealth;
      const siteHealth = typeof rawSiteHealth === 'number'
        ? rawSiteHealth <= 1
          ? `${Math.round(rawSiteHealth * 100)}%`
          : `${Math.round(rawSiteHealth)}%`
        : safeString(rawSiteHealth, '100%');

      const sentiment = safeString(sheetsData?.sentiment, 'Positive');
      const communityGrowth = safeString(sheetsData?.communityGrowth, '0%');
      const emailGrowth = safeString(sheetsData?.emailGrowth, '0%');
      const conversionRate = safeString(sheetsData?.conversionRate, '0%');
      const churnRisk = safeString(sheetsData?.churnRisk, 'Low');

      const aiBrief = await fetchAIBrief({
        communityCount,
        emailSubscribers: brevoData.totalSubscribers,
        emailOpenRate: brevoData.emailOpenRate,
        emailClickRate: brevoData.emailClickRate,
        topAsset,
        revenue,
        communityGrowth,
      });

      // Determine which AI provider is active for alerts
      let activeAiProvider = null;
      for (const [name, config] of Object.entries(AI_PROVIDERS)) {
        if (process.env[config.keyEnv]) {
          activeAiProvider = name;
          break;
        }
      }

      const alerts = buildAlerts({
        facebookError: fbData?.error,
        emailError: brevoData?.error,
        sheetsError: sheetsResult?.error,
        aiProviderSet: !!activeAiProvider,
        aiProvider: activeAiProvider,
        aiError: aiBrief?.error,
        facebookEnvSet: !!(process.env.FACEBOOK_GROUP_ID && process.env.FACEBOOK_ACCESS_TOKEN),
      });

      const community = Array.isArray(sheetsData?.community) ? sheetsData.community : [];
      const assets = Array.isArray(sheetsData?.assets) ? sheetsData.assets : [];
      const email = sheetsData?.email && typeof sheetsData.email === 'object' ? sheetsData.email : {};
      const topPosts = Array.isArray(sheetsData?.topPosts) ? sheetsData.topPosts : [];
      const campaigns = Array.isArray(sheetsData?.campaigns) && sheetsData.campaigns.length > 0
        ? sheetsData.campaigns
        : brevoData.topCampaigns;

      const debug = process.env.NODE_ENV !== 'production'
        ? {
            facebook: fbData?.debug || null,
            brevo: brevoData?.debug || null,
            sheets: sheetsResult?.debug || null,
            ai: aiBrief?.debug || null,
            aiProvider: activeAiProvider,
          }
        : undefined;

      // Notion data is fetched on demand by the Notion tab (context.includeNotion).
      const notionSnapshot =
        req.body?.context?.includeNotion === true
          ? await fetchNotionSnapshot()
          : emptyNotionSnapshot();

      const legacyDashboardPayload = {
        status: 'ok',
        community,
        assets,
        email,
        topPosts,
        campaigns,
        notion: notionSnapshot,
        revenue,
        leads,
        conversionRate,
        churnRisk,
        assetValue,
        topAsset,
        communityGrowth,
        emailGrowth,
        siteHealth,
        sentiment,
        sourceHealth: {
          facebook: fbData?.error ? 'warning' : 'ok',
          brevo: brevoData?.error ? 'warning' : 'ok',
          sheets: sheetsResult?.error ? 'warning' : 'ok',
          ai: aiBrief?.error ? 'warning' : 'ok',
        },
        aiBrief: {
          working: aiBrief.working,
          slipping: aiBrief.slipping,
          nextActions: aiBrief.nextActions,
          provider: aiBrief.provider,
        },
        alerts,
        metrics: {
          communityCount,
          communityGrowth,
          emailSubscribers: brevoData.totalSubscribers,
          emailGrowth,
          emailOpenRate: brevoData.emailOpenRate,
          emailClickRate: brevoData.emailClickRate,
          conversionRate,
          churnRisk,
          revenue,
          leads,
          topAsset,
          assetValue,
          siteHealth,
          sentiment,
        },
      };

      return res.status(200).json({
        ...legacyDashboardPayload,
        ...(debug ? { debug } : {}),
      });
    }

    // ---- Integration data + start flows (dashboard Connect buttons / Sync) ----
    // Mirrors supabase/functions/hermes/index.ts so the dashboard receives real
    // envelopes/data instead of a 404 "Unknown action".
    if (
      action === 'integration.google.start' ||
      action === 'integration.social.start' ||
      action === 'integration.email.start' ||
      action === 'integration.community.start'
    ) {
      return res.status(200).json({ success: true, message: 'Integration flow started' });
    }

    if (action === 'integration.googleAnalytics') {
      const b = req.body || {};
      if (!b.measurementId || !b.propertyId) {
        return res.status(400).json({ error: 'Missing measurementId or propertyId' });
      }
      return res.status(200).json({
        users30d: 1240,
        sessions30d: 1860,
        bounceRate: 0.42,
        topPages: [
          { path: '/', views: 640 },
          { path: '/digital-business-os', views: 310 },
          { path: '/blog/gen-x-women-reinvention', views: 210 },
        ],
        goalConversions: 88,
        revenue30d: 4200,
      });
    }

    if (action === 'integration.social') {
      const b = req.body || {};
      const entries = Object.entries(b.platforms || {});
      if (!entries.length) {
        return res.status(200).json({
          connected: false,
          platforms: {},
          followers: null,
          engagementRate: null,
          impressions30d: null,
          topPosts: [],
        });
      }
      return res.status(200).json({
        connected: true,
        platforms: Object.fromEntries(entries.map(([name]) => [name, { connected: true }])),
        followers: 4820,
        engagementRate: 0.038,
        impressions30d: 28400,
        topPosts: [
          { platform: 'facebook', title: 'Reinventing Your Digital Career', impressions: 4200 },
          { platform: 'instagram', title: 'Morning Brand Check-In', impressions: 3100 },
          { platform: 'youtube', title: 'How I Built an Automated Funnel', impressions: 2600 },
        ],
      });
    }

    if (action === 'integration.email') {
      const b = req.body || {};
      if (!b.provider || (!b.hasBrevo && !b.hasMailchimp)) {
        return res.status(400).json({ error: 'No email provider available' });
      }
      return res.status(200).json({
        subscribers: 3120,
        openRate: 0.282,
        clickRate: 0.114,
        campaigns: [
          { name: 'Authority Launch Sequence', openRate: 0.312, clickRate: 0.128 },
          { name: 'Evergreen Reputation Funnel', openRate: 0.264, clickRate: 0.104 },
          { name: 'Reinvention Reactivation', openRate: 0.298, clickRate: 0.118 },
        ],
        revenuePerCampaign: 1280,
      });
    }

    if (action === 'integration.community') {
      const b = req.body || {};
      if (!b.platform || (!b.hasFacebook && !b.hasDiscord && !b.hasMightyNetworks)) {
        return res.status(400).json({ error: 'No community platform available' });
      }
      return res.status(200).json({
        members: 1284,
        activeToday: 96,
        growth30d: 0.082,
        topMembers: [
          { name: 'Rena Walker', joinedAt: '2026-03-28', status: 'Active' },
          { name: 'Angela Brooks', joinedAt: '2026-03-31', status: 'Onboarding' },
          { name: 'Tasha Monroe', joinedAt: '2026-04-02', status: 'Subscribed' },
          { name: 'Nicole James', joinedAt: '2026-04-04', status: 'Engaged' },
        ],
      });
    }

    // ---- Antigravity MCP (Notion Architect) ----
    if (action.startsWith('antigravity')) {
      if (!checkDashboardApiKey(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      try {
        const tool = action === 'antigravity' ? (req.body?.tool || 'antigravity.status') : action;
        const result = await antigravityHandle({ tool, params: req.body?.params || req.body || {} });
        return res.status(200).json(result);
      } catch (error) {
        return res.status(502).json({
          error: error instanceof Error ? error.message : 'Antigravity MCP request failed',
        });
      }
    }

    return res.status(404).json({ error: `Unknown action: ${action}` });
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({
      error: 'Dashboard fetch failed',
      details: process.env.NODE_ENV !== 'production' ? err?.message || 'Unknown error' : 'An internal error occurred.',
    });
  }
}
