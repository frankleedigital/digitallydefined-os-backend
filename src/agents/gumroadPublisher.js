// src/agents/gumroadPublisher.js — Gumroad Publisher Orchestrator
// Purpose: one-click "market this product on Gumroad" pipeline for the
// Digital Products tab. Runs the DD specialist chain in order:
//
//   1. Brand Supervisor (brandSupervisor)  — enforce DD brand guidelines
//   2. Gumroad listing writer              — No-BS Big Bestie copy (title, price, description, bullets, tags)
//   3. Visual Asset Generator x2           — Flat Soft Brutalism cover + thumbnail (SVG + specs)
//   4. Gumroad publish                     — best-effort: creates a DRAFT product via the Gumroad v2 API
//                                            when GUMROAD_API_KEY is configured
//
// The pipeline NEVER breaks the run for the optional publish step: if the
// key is missing or the API fails, the result is "publish-ready" with the full
// listing + assets so the owner can finish in the Gumroad UI.
//
// Output is a single structured bundle the dashboard renders as a card:
//   { success, product, brand, listing, assets: { cover, thumbnail }, publish, steps, provider, model, timestamp }

import { parseJsonReply } from '../services/ai.js';
import { aiRouter } from '../services/aiRouter.js';
import { evaluateBrandCompliance } from './brandSupervisor.js';
import { generateVisualAsset } from './visualAssetGenerator.js';

const clampNum = (n) => {
  const v = Number(String(n ?? '0').replace(/[^0-9.]/g, ''));
  return Number.isFinite(v) ? Math.round(v * 100) : 0; // cents
};

function fallbackListing(product, enforcedCopy) {
  const bullets = String(enforcedCopy || '')
    .split(/\n+/)
    .map((s) => s.replace(/^[-•*\d.)\s]+/, '').trim())
    .filter((s) => s.length > 15)
    .slice(0, 7);
  return {
    title: product.name.toUpperCase(),
    price: String(product.price || 0),
    currency: 'usd',
    description: enforcedCopy || product.description || '',
    bullets: bullets.length ? bullets : [product.description || product.name],
    tags: ['digital assets', 'gen x women', 'financial independence', 'ai automation', 'legacy planning'],
    launchNote: `Let's get real. ${product.name} just went live — stop managing your future from chaos. Claim it now.`,
    source: 'fallback-listing-engine',
  };
}

async function writeGumroadListing(product, enforcedCopy) {
  const systemPrompt =
    'You are the Gumroad Listing Writer for DigitallyDefined — voice: No-BS Big Bestie ' +
    '(direct, empowering, high-energy, cheeky, pragmatic, zero fluff, full sentences, strong CTAs). ' +
    'Mantras you may weave in naturally: "Let\'s get real.", "No more excuses.", "Own your power." ' +
    'Audience: Gen X women (40-60) who run family operations, care for aging parents, and want digital ' +
    'cash flow and financial independence before retirement. ' +
    'Output STRICT JSON only, no markdown fences:\n' +
    '{\n' +
    '  "title": "short punchy product title (max 60 chars)",\n' +
    '  "price": "suggested USD price as a number string, e.g. \"29.99\"",\n' +
    '  "currency": "usd",\n' +
    '  "description": "Gumroad product description in No-BS voice. Plain text, short lines, no markdown. Open with the reader\'s problem, end with a direct CTA. Max ~250 words.",\n' +
    '  "bullets": ["5-7 benefit bullets, each max 90 chars, imperative voice"],\n' +
    '  "tags": ["4-6 Gumroad tags, lowercase phrases"],\n' +
    '  "launchNote": "one-line launch message for email/social, No-BS voice"\n' +
    '}';

  const userPrompt =
    `Market this DigitallyDefined product on Gumroad.\n\n` +
    `PRODUCT NAME: ${product.name}\n` +
    `${product.tier ? `TIER: ${product.tier}\n` : ''}` +
    `${product.persona ? `TARGET PERSONA: ${product.persona}\n` : ''}` +
    `${product.profitHook ? `AI PROFIT HOOK: ${product.profitHook}\n` : ''}` +
    `CURRENT PRICE: ${product.price || 'set your suggestion'}\n\n` +
    `BRAND-ENFORCED BRIEF (already audited by the Brand Supervisor — build the listing from THIS, keep it compliant):\n` +
    `---\n${enforcedCopy}\n---\n\n` +
    `Return the JSON listing now.`;

  let result;
  try {
    result = await aiRouter.generate(null, userPrompt, { mode: 'freeMode', systemPrompt, jsonMode: true });
  } catch (err) {
    result = { error: err.message };
  }
  if (result?.error) return { listing: null, error: result.error, provider: null, model: null };

  const parsed = parseJsonReply(typeof result.reply === 'string' ? result.reply : JSON.stringify(result.reply)) || {};
  const listing = {
    title: String(parsed.title || product.name).trim(),
    price: String(parsed.price || product.price || 0).trim(),
    currency: String(parsed.currency || 'usd').trim().toLowerCase(),
    description: String(parsed.description || enforcedCopy || product.description || '').trim(),
    bullets: Array.isArray(parsed.bullets) ? parsed.bullets.map((b) => String(b)).filter(Boolean).slice(0, 10) : [],
    tags: Array.isArray(parsed.tags) ? parsed.tags.map((t) => String(t).toLowerCase()).filter(Boolean).slice(0, 8) : [],
    launchNote: String(parsed.launchNote || '').trim(),
    source: `llm:${result.provider || 'unknown'}`,
  };
  return { listing, provider: result.provider || null, model: result.model || null };
}

async function publishToGumroadDraft(listing) {
  const apiKey = process.env.GUMROAD_API_KEY;
  if (!apiKey) {
    return {
      status: 'publish-ready',
      published: false,
      reason: 'GUMROAD_API_KEY is not configured on the backend — the listing and assets are ready to paste into Gumroad in one minute.',
      url: null,
      gumroadProductId: null,
    };
  }
  const body = {
    name: listing.title || 'DigitallyDefined product',
    price: clampNum(listing.price),
    currency: listing.currency || 'usd',
    published: 0, // DRAFT — owner reviews before it goes live
  };
  try {
    const resp = await fetch('https://api.gumroad.com/v2/products?access_token=' + encodeURIComponent(apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || !data.success) {
      return {
        status: 'failed',
        published: false,
        reason: `Gumroad API responded ${resp.ok ? 'success=false' : resp.status}: ${data.message || 'unknown error'} — the listing bundle below is publish-ready manually.`,
        url: null,
        gumroadProductId: null,
      };
    }
    const pid = data.data?.product_id ?? data.product_id ?? null;
    const short = data.data?.short_url ?? data.short_url ?? (pid ? String(pid) : null);
    return {
      status: 'draft-created',
      published: false,
      reason: 'Draft product created in Gumroad — review the draft in your Gumroad dashboard, attach the cover/thumbnail below, then hit Publish.',
      url: short ? `https://gumroad.com/l/${short}` : 'https://gumroad.com/dashboard/products',
      gumroadProductId: pid,
    };
  } catch (err) {
    return {
      status: 'failed',
      published: false,
      reason: 'Gumroad API unreachable (' + err.message + ') — the listing bundle below is publish-ready manually.',
      url: null,
      gumroadProductId: null,
    };
  }
}

export async function marketProduct(params = {}) {
  const product = {
    name: String(params.name || params.productName || '').trim(),
    description: String(params.description || params.brief || '').trim(),
    price: params.price != null && String(params.price).trim() !== '' ? String(params.price).trim() : '',
    tier: String(params.tier || '').trim(),
    persona: String(params.persona || '').trim(),
    profitHook: String(params.profitability || params.profitHook || '').trim(),
    demandScore: params.demandScore != null ? params.demandScore : null,
    gumroadUrl: params.gumroadUrl || null,
  };

  if (!product.name && !product.description) {
    return { success: false, error: 'A product name or brief is required to start the marketing pipeline.' };
  }
  if (!product.name) product.name = 'Untitled DigitallyDefined Product';

  const steps = [];
  const step = (name, status, detail) => steps.push({ name, status, detail, at: Date.now() });

  // ── STEP 1 · Brand Supervisor ─────────────────────────────────────────
  const brief = [
    product.name,
    product.description,
    product.persona ? `Audience: ${product.persona}` : '',
    product.profitHook ? `Hook: ${product.profitHook}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  let brand = null;
  try {
    brand = await evaluateBrandCompliance({ content: brief, contentType: 'product' });
    if (brand?.error) {
      step('Brand Supervisor', 'failed', brand.error);
      return { success: false, error: 'Brand audit failed: ' + brand.error, steps };
    }
    step(
      'Brand Supervisor',
      'ok',
      `verdict ${brand.verdict} · compliance ${brand.complianceScore}/100`
    );
  } catch (err) {
    step('Brand Supervisor', 'failed', err.message);
    return { success: false, error: 'Brand Supervisor crashed: ' + err.message, steps };
  }
  const enforcedCopy = brand.enforcedOutput || brief;

  // ── STEP 2 · Gumroad listing copy ─────────────────────────────────────
  let listing = null;
  let listingMeta = {};
  try {
    const out = await writeGumroadListing(product, enforcedCopy);
    listing = out.listing || fallbackListing(product, enforcedCopy);
    listingMeta = out;
    step('Listing Copywriter', out.listing ? 'ok' : 'fallback', out.error ? `LLM failed (${out.error}) — deterministic listing generated instead` : 'No-BS listing generated');
  } catch (err) {
    listing = fallbackListing(product, enforcedCopy);
    step('Listing Copywriter', 'fallback', err.message);
  }

  // ── STEP 3 · Cover + thumbnail (parallel, Flat Soft Brutalism) ────────
  const subtitle =
    listing.bullets[0] ||
    product.profitHook ||
    "NO MORE EXCUSES. OWN YOUR POWER.";
  let cover = null;
  let thumbnail = null;
  try {
    const [c, t] = await Promise.all([
      generateVisualAsset({ title: listing.title, subtitle, assetType: 'product-cover' }),
      generateVisualAsset({ title: listing.title, subtitle, assetType: 'product-thumbnail' }),
    ]);
    cover = c;
    thumbnail = t;
    step('Visual Assets', 'ok', 'cover + thumbnail generated (SVG, Flat Soft Brutalism)');
  } catch (err) {
    cover = await generateVisualAsset({ title: listing.title, subtitle, assetType: 'product-cover' }).catch(() => null);
    thumbnail = await generateVisualAsset({ title: listing.title, subtitle, assetType: 'product-thumbnail' }).catch(() => null);
    step('Visual Assets', cover || thumbnail ? 'partial' : 'failed', err.message);
  }

  // ── STEP 4 · Publish to Gumroad (best-effort DRAFT) ────────────────────
  let publish;
  try {
    publish = await publishToGumroadDraft(listing);
    step('Gumroad Publish', publish.published ? 'ok' : publish.status, publish.reason);
  } catch (err) {
    publish = { status: 'failed', published: false, reason: err.message, url: null, gumroadProductId: null };
    step('Gumroad Publish', 'failed', err.message);
  }

  return {
    success: true,
    pipeline: ['Brand Supervisor', 'Listing Copywriter', 'Visual Assets', 'Gumroad Publish'],
    product,
    brand: {
      complianceScore: brand.complianceScore,
      verdict: brand.verdict,
      pillarAlignment: brand.pillarAlignment,
      modificationsApplied: brand.modificationsApplied,
      enforcedOutput: brand.enforcedOutput,
    },
    listing,
    assets: { cover, thumbnail },
    publish,
    steps,
    provider: listingMeta.provider || brand.provider || null,
    model: listingMeta.model || brand.model || null,
    timestamp: Date.now(),
  };
}

export default { marketProduct };
