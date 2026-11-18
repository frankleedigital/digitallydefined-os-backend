// src/agents/affiliateFlipper.js — Affiliate Flipper AI
// Purpose: Analyze TRAFFIC → PRODUCT MATCH to find undervalued traffic that can be
// flipped into high-paying affiliate commissions.
//
// TIER 1 (no external APIs): deterministic scoring engine + AI reasoning layer.
// Optional numeric signals (searchVolume, cpc, competition, commission, cookie,
// productPrice, recurring) may be supplied so a future Tier-2 data layer (e.g.
// Apify keyword/site actors) can feed REAL numbers into the same engine. When
// absent, the engine derives them from intent + niche economics heuristics.

import { parseJsonReply } from '../services/ai.js';
import { aiRouter } from '../services/aiRouter.js';

const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Number.isFinite(n) ? n : lo));

// ---- Intent detection (drives the Traffic Opportunity Score) ----
const TXN = /buy|price|cost|best|top|vs|versus|alternative|alternatives|review|reviews|for |software|tool|tools|platform|service|generator|template|templates|course|agency|agency|compare|comparison|deal|discount|cheap|cheap/;
const COMMERCIAL = /how to (make|build|start|get)|what is|why |should i|guide|tips|ideas|example|examples/;
function detectIntent(text = '') {
  const t = String(text).toLowerCase();
  if (TXN.test(t)) return 'transactional';
  if (/buy|best|top|vs|review|compare|alternatives/.test(t)) return 'commercial-investigation';
  if (COMMERCIAL.test(t)) return 'commercial';
  if (/how|what|why|tips|ideas|guide/.test(t)) return 'informational';
  return 'neutral';
}

// Niche → typical CPC band heuristic (used only when cpc is not supplied).
function estimateCpc(niche = '') {
  const n = String(niche).toLowerCase();
  const high = /(financ|insur|mortgage|legal|lawyer|b2b|saas|crm|erp|software|agency|invest|crypto|trading)/;
  const low = /(hobby|craft|diy|beauty|fashion|fitness|gaming|travel|food|pets)/;
  if (high.test(n)) return { cpc: 6, label: 'high' };
  if (low.test(n)) return { cpc: 0.6, label: 'low' };
  return { cpc: 2.5, label: 'medium' };
}

// Long-tail commercial keywords are typically less competitive than head terms.
function estimateCompetition(keyword = '', niche = '') {
  const kw = String(keyword).trim().split(/\s+/).filter(Boolean);
  const words = kw.length;
  if (words >= 4) return { value: 0.3, label: 'low' };
  if (words === 3) return { value: 0.55, label: 'medium' };
  return { value: 0.8, label: 'high' };
}

function estimateVolume(keyword = '', niche = '') {
  // Rough proxy only — real volume arrives in Tier 2.
  const words = String(keyword).trim().split(/\s+/).filter(Boolean).length;
  if (words >= 3) return 5000; // long-tail still gets steady searchers
  if (words === 2) return 25000;
  return 60000;
}

const gradeFor = (score) =>
  score >= 90 ? 'ELITE OPPORTUNITY' : score >= 80 ? 'STRONG' : score >= 60 ? 'GOOD' : score >= 40 ? 'WEAK' : 'AVOID';

const recommendFor = (score) =>
  score >= 80 ? 'PROMOTE' : score >= 40 ? 'INVESTIGATE' : 'AVOID';

export async function analyzeAffiliateFlip(params = {}) {
  const keyword = String(params.keyword || '').trim() || 'digital-asset';
  const niche = String(params.niche || '').trim();
  const productName = String(params.productName || params.product || '').trim();
  const productUrl = String(params.productUrl || '').trim();
  const affiliateUrl = String(params.affiliateUrl || '').trim();
  const recurring = params.recurring === true || /^(yes|true|recurring)$/i.test(String(params.recurring || ''));

  // ---- Optional real signals (Tier 2 feeds these) ----
  const cpcSupplied = Number(params.cpc);
  const compSupplied = params.competition != null ? String(params.competition) : null;
  const volumeSupplied = Number(params.searchVolume);
  const commission = Number(params.commission); // %
  const cookie = params.cookie != null ? Number(params.cookie) : null; // days
  const productPrice = Number(params.productPrice);

  // ---- Derived inputs (heuristic when absent) ----
  const intent = detectIntent(keyword + ' ' + (params.keywordList || ''));
  const cpc = cpcSupplied > 0 ? cpcSupplied : estimateCpc(niche || keyword).cpc;
  const competition = compSupplied ? compSupplied : estimateCompetition(keyword, niche).label;
  const volume = volumeSupplied > 0 ? volumeSupplied : estimateVolume(keyword, niche);

  // ================= TRAFFIC OPPORTUNITY SCORE (0-100) =================
  const intentScore = { transactional: 40, 'commercial-investigation': 30, commercial: 24, informational: 15, neutral: 18 }[intent] ?? 18;
  const volScore = volume >= 50000 ? 25 : volume >= 10000 ? 20 : volume >= 2000 ? 14 : 8;
  const cpcScore = cpc <= 1 ? 15 : cpc <= 3 ? 11 : cpc <= 6 ? 7 : 4; // low CPC = easier organic
  const compScore = competition === 'low' ? 20 : competition === 'medium' ? 11 : 4;
  const trafficScore = Math.round(clamp(intentScore + volScore + cpcScore + compScore));

  // ================= MONETIZATION SCORE (0-100) =================
  const commissionPct = commission > 0 ? commission : recurring ? 30 : 10; // default 30% recurring SaaS, 10% one-time
  const commissionScore =
    commissionPct >= 40 ? 40 : commissionPct >= 25 ? 36 : commissionPct >= 15 ? 30 : commissionPct >= 8 ? 20 : 10;
  const recurringScore = recurring ? 25 : 8;
  const price = productPrice > 0 ? productPrice : recurring ? 50 : 100;
  const epProxy = recurring ? price * 12 * (commissionPct / 100) : price * (commissionPct / 100);
  const epScore = epProxy >= 200 ? 20 : epProxy >= 60 ? 16 : epProxy >= 25 ? 12 : 8;
  const cookieScore = cookie == null ? (recurring ? 15 : 6) : cookie >= 90 ? 15 : cookie >= 30 ? 10 : cookie >= 7 ? 5 : 2;
  const monetizationScore = Math.round(clamp(commissionScore + recurringScore + epScore + cookieScore));

  // ================= AFFILIATE FLIP SCORE + GRADE =================
  const flipScore = Math.round(clamp(trafficScore * 0.45 + monetizationScore * 0.55));
  const grade = gradeFor(flipScore);
  const recommendation = recommendFor(flipScore);

  // ================= PROFIT ESTIMATION =================
  const clicksMonth = Math.round(volume * 0.05); // ~5% of searches click to a content asset
  const convRate = recurring ? 0.02 : 0.01; // SaaS 2%, physical ~1%
  const avgPayout = recurring ? price * (commissionPct / 100) * 0.1 : price * (commissionPct / 100); // recurring: ~1/mo per active sub
  const baseRevenue = Math.round(clicksMonth * convRate * avgPayout);
  const revenue = {
    monthlyVisitors: clicksMonth,
    projectedConversions: Math.round(clicksMonth * convRate),
    conservative: Math.round(baseRevenue * 0.5),
    realistic: baseRevenue,
    aggressive: Math.round(baseRevenue * 2.2),
    basis: recurring ? 'recurring SaaS commissions (compounding monthly)' : 'one-time affiliate commissions',
  };

  // ================= CONTENT OPPORTUNITY MATRIX =================
  const kw = keyword;
  const contentOpportunities = {
    topKeywords: [kw, `${kw} for business`, `best ${kw}`, `${kw} alternatives`, `${kw} vs`],
    supportingKeywords: [
      `how to use ${kw}`,
      `${kw} for beginners`,
      `${kw} pricing`,
      `${kw} review`,
      `is ${kw} worth it`,
    ],
    blogIdeas: [
      `How to Monetize ${kw} Traffic in 2026`,
      `The Real Costs & Returns of ${kw}: A Numbers Breakdown`,
      `Building an Affiliate Site Around ${kw} (Step by Step)`,
    ],
    reviewIdeas: [productName ? `Best ${productName} Alternatives Compared` : `${kw} Review (Honest Breakdown)`],
    comparisonIdeas: [`${kw} vs. the 3 Cheaper Options`, `Top 5 ${kw} Tools Ranked by ROI`],
    threadsPosts: [
      `Everyone's chasing ${kw} traffic. Here's how to flip low-competition ${kw} searches into ${recurring ? 'recurring' : 'one-time'} affiliate income.`,
      `Underrated play: ${kw}. Low CPC, real demand, ${recurring ? 'recurring commissions' : 'solid one-time payouts'}.`,
    ],
    redditOpportunities: [
      `Answer "anyone tried ${kw}?" threads with value-first recommendations`,
      `Build presence in r/${niche ? niche.replace(/\s+/g, '') : 'Entrepreneur'} around ${kw} use-cases`,
    ],
    pinterestIdeas: [`${kw} templates & free resources`, `${kw} for small business — visual checklist`, `Before/after ${kw} workflows`],
    emailFunnelIdeas: [
      `Free ${kw} scorecard → email opt-in → 3-part nurture → affiliate offer`,
      `Weekly ${kw} newsletter with a single hero affiliate link`,
    ],
    leadMagnetIdeas: [
      `The ${kw} Opportunity Finder (checklist + calculator)`,
      `10 Low-Competition ${kw} Keywords Worth Targeting`,
    ],
  };

  // ================= AI REASONING LAYER (with deterministic fallback) =================
  const systemPrompt =
    'You are the Affiliate Flipper AI for DigitallyDefined — an affiliate-revenue strategist for Gen X women building digital assets.\n' +
    'Be direct and no-BS. Explain WHY a traffic source can or cannot be flipped into profitable affiliate income.\n' +
    'Return structured JSON with:\n' +
    '- whyTraffic: string[] (3-4 concrete reasons about the traffic: intent, competition, CPC, underserved demand)\n' +
    '- whyMonetization: string[] (2-4 reasons about the payout: commission, recurring, EPC, cookie)\n' +
    '- verdict: string (one-paragraph, decisive explanation of the recommendation)\n' +
    '- risks: string[] (2-3 real risks or red flags)\n' +
    '- nextActions: string[] (3 concrete next actions to test this flip)';

  const userPrompt =
    `Affiliate flip analysis. Keyword: "${keyword}". Niche: ${niche || 'unspecified'}. ` +
    `Product: ${productName || 'unknown'}. Intent: ${intent}. Search volume (est): ${volume}. CPC: $${cpc}. Competition: ${competition}. ` +
    `Commission: ${commissionPct}%${recurring ? ' (recurring)' : ''}${cookie != null ? `, cookie ${cookie}d` : ''}. ` +
    `Traffic Opportunity Score: ${trafficScore}/100. Monetization Score: ${monetizationScore}/100. Affiliate Flip Score: ${flipScore}/100 (${grade}). ` +
    `Recommendation: ${recommendation}. Realistic monthly revenue: ~$${revenue.realistic}.`;

  let result;
  try {
    result = await aiRouter.generate(null, userPrompt, { mode: 'freeMode', systemPrompt, jsonMode: true });
  } catch (err) {
    result = { error: err.message };
  }

  const base = {
    input: { keyword, niche, productName, productUrl, affiliateUrl, recurring, intent },
    scores: {
      trafficOpportunityScore: trafficScore,
      monetizationScore,
      affiliateFlipScore: flipScore,
      grade,
    },
    recommendation,
    revenue,
    contentOpportunities,
    provider: null,
    model: null,
    timestamp: Date.now(),
  };

  if (result.error) {
    return {
      ...base,
      whyTraffic: [
        `${intent} intent around "${keyword}" means buyers, not just browsers — the traffic is monetizable, not just readable.`,
        `Competition is ${competition}; ${competition === 'low' ? 'long-tail terms are rankable for a new asset' : 'expect a content grind before ranking'}.`,
        `CPC of ~$${cpc} ${cpc <= 1 ? 'signals cheap traffic to acquire/defend' : 'signals advertisers value this demand'}.`,
      ],
      whyMonetization: [
        `Effective payout ${recurring ? 'is recurring' : 'is one-time'} at ${commissionPct}%${cookie != null ? ` with a ${cookie}-day cookie` : ''}.`,
        `${recurring ? 'Recurring commissions compound — each new customer keeps paying monthly, so the asset appreciates.' : 'One-time payouts require fresh traffic continuously to sustain revenue.'}`,
      ],
      verdict:
        flipScore >= 80
          ? `PROMOTE this flip: strong ${intent} traffic with ${recurring ? 'recurring' : 'solid'} affiliate economics. Move fast on content + email capture.`
          : flipScore >= 40
            ? `INVESTIGATE: the traffic is workable but the ${recurring ? 'payout' : 'competition'} needs a sharper angle before you commit.`
            : `AVOID as a priority: ${competition} competition and ${recurring ? 'modest recurring' : 'thin one-time'} payouts make this a slow burn.`,
      risks: [
        'Competition can spike quickly in high-intent niches — validate before heavy investment.',
        'Recurring commissions depend on churn; a poor product experience erodes the asset.',
        'Affiliate terms (commission/cookie) change without notice — keep a second offer in the pipeline.',
      ],
      nextActions: [
        `Publish 3 ranking articles for: "${kw} review", "best ${kw}", "${kw} alternatives".`,
        'Build the free lead magnet to capture email before the affiliate link fires.',
        'Stand up an email funnel: welcome + value + single hero affiliate offer.',
      ],
      provider: 'fallback',
      timestamp: Date.now(),
    };
  }

  const parsed = parseJsonReply(typeof result.reply === 'string' ? result.reply : JSON.stringify(result.reply));
  return {
    ...base,
    whyTraffic: Array.isArray(parsed?.whyTraffic) && parsed.whyTraffic.length ? parsed.whyTraffic : base.whyTraffic,
    whyMonetization: Array.isArray(parsed?.whyMonetization) && parsed.whyMonetization.length ? parsed.whyMonetization : base.whyMonetization,
    verdict: parsed?.verdict || base.verdict,
    risks: Array.isArray(parsed?.risks) && parsed.risks.length ? parsed.risks : base.risks,
    nextActions: Array.isArray(parsed?.nextActions) && parsed.nextActions.length ? parsed.nextActions : base.nextActions,
    provider: result.provider || 'unknown',
    model: result.model || 'unknown',
    timestamp: Date.now(),
  };
}

export default { analyzeAffiliateFlip };
