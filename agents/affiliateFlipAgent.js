/**
 * Affiliate Flip Agent
 * Powers product-based analysis for the Affiliate Market Flip Calculator.
 *
 * Dual-mode:
 *   Mode A — Niche/Keyword driven: user supplies a niche, agent suggests
 *            monetization, keywords, niche angles, page outline, and plan.
 *   Mode B — Product driven: user supplies an affiliate product/program; the
 *            agent identifies the affiliate network, estimates EPC + commission
 *            when missing, and generates product-tailored recommendations.
 *   Both   — When both a product and a niche are supplied, the agent merges
 *            both datasets and produces a combined flip score.
 *
 * Uses the LLM with JSON-schema prompting when providers are configured;
 * falls back to deterministic estimates otherwise. The FastAPI
 * affiliate_service.py resolver already checks affiliate_products.json and
 * falls back to an LLM estimate; this agent produces the narrative layers
 * (keywords, angles, outline, monetization plan, action plan, verdict).
 */
import { callLLM, parseJsonReply, validateAgainstSchema } from '../lib/llmClient.js';

// Output schema (mirrors the FastAPI AffiliateFlipResponse narrative fields).
const AFFILIATE_FLIP_SCHEMA = {
  affiliate_network: 'string',
  epc: 'number',
  commission_rate: 'number',
  category: 'string',
  difficulty: 'string',
  recommended_keywords: 'array',
  recommended_niche_angles: 'array',
  page_outline: 'array',
  monetization_plan: 'array',
  seven_day_action_plan: 'array',
  flip_score: 'number',
  verdict: 'string',
};

const SYSTEM_PROMPT = `You are Hermes, the Affiliate Market Flip Strategist for DigitallyDefined.
Your audience is Gen X women building faceless, passive income online.

You support two input modes and may merge both:
- Product mode: an affiliate product/program name is given. Identify its
  affiliate network (Impact, ShareASale, Amazon, CJ Affiliate, PartnerStack,
  Direct, etc.). If EPC or commission rate are missing, ESTIMATE realistic
  values from the product category and typical network payouts.
- Niche mode: a niche/keyword is given. Suggest monetization and angles.
- Merged: when both are present, blend product data with niche/keyword data.

Generate, tailored to the product or niche:
- recommended_keywords (5-8 high-intent affiliate/review keywords)
- recommended_niche_angles (3-5 audience angles)
- page_outline (8-11 section outline for a converting review/comparison page)
- monetization_plan (6-8 concrete steps)
- seven_day_action_plan (exactly 7 steps, one per day)
'- flip_score (0-100) computed from commission + EPC + price + recurring + difficulty, plus a niche long-tail fit bonus when a specific audience or sub-topic is named.'
- flip_score (0-100) computed from commission + EPC + price + recurring + difficulty

Rules:
- Return valid JSON only, matching the schema exactly.
- No hype. Direct, practical, plain language.
- EPC is in USD per click. commission_rate is a 0-1 fraction (e.g. 0.25 = 25%).
- difficulty is one of: easy, medium, hard.`;

function buildPrompt(input) {
  const lines = [];
  if (input.product_name || input.product) {
    lines.push(`Affiliate product/program: ${input.product_name || input.product}`);
  }
  if (input.niche) {
    lines.push(`Niche/keyword: ${input.niche}`);
  }
  if (input.category) lines.push(`Known category: ${input.category}`);
  if (input.known_network) lines.push(`Known network: ${input.known_network}`);
  if (input.epc) lines.push(`Known EPC: $${input.epc}`);
  if (input.commission_rate) lines.push(`Known commission rate: ${(input.commission_rate * 100).toFixed(1)}%`);
  if (input.price) lines.push(`Product price: $${input.price}`);
  if (input.recurring !== undefined && input.recurring !== null) {
    lines.push(`Recurring: ${input.recurring ? 'yes' : 'no (one-time)'}`);
  }

  const mode = (input.product_name || input.product) && input.niche
    ? 'MERGED (product + niche)'
    : (input.product_name || input.product)
      ? 'PRODUCT mode'
      : 'NICHE mode';

  lines.push(`\nMode: ${mode}`);
  lines.push(`\nReturn JSON with exactly these fields:`);
  lines.push(`- affiliate_network: string`);
  lines.push(`- epc: number (USD per click)`);
  lines.push(`- commission_rate: number (0-1 fraction)`);
  lines.push(`- category: string`);
  lines.push(`- difficulty: "easy" | "medium" | "hard"`);
  lines.push(`- recommended_keywords: array of strings`);
  lines.push(`- recommended_niche_angles: array of strings`);
  lines.push(`- page_outline: array of strings`);
  lines.push(`- monetization_plan: array of strings`);
  lines.push(`- seven_day_action_plan: array of exactly 7 strings`);
  lines.push(`- flip_score: number 0-100`);
  lines.push(`- verdict: one sentence starting with YES, MAYBE, or WATCH`);

  return lines.join('\n');
}

// Deterministic fallback used when the LLM/API is unavailable.
function deterministicAnalysis(input) {
  const product = input.product_name || input.product || '';
  const niche = input.niche || '';
  const subject = product ? product.split(' ')[0] : (niche ? niche.split(' ')[0] : 'this offer');
  const category = input.category || 'Marketing';
  const network = input.known_network || 'ShareASale';
  const epc = input.epc || 0.35;
  const commissionRate = input.commission_rate || 0.10;
  const price = input.price || 29.0;
  const recurring = !!input.recurring;
  const difficulty = input.difficulty || 'medium';
  const nicheWords = (input.niche || '').trim().split(/\s+/).length;
  const nicheBonus = nicheWords >= 3 ? 6 : (nicheWords === 2 ? 3 : 0);

  const commissionScore = Math.min(commissionRate * 70, 35);
  const epcScore = Math.min(epc * 23, 35);
  const priceScore = Math.min((price / 200) * 15, 15);
  const recurringBonus = recurring ? 15 : 0;
  const difficultyPenalty = { easy: 0, medium: 8, hard: 18 }[difficulty] || 8;
  const flipScore = Math.round(Math.max(0, Math.min(100,
    commissionScore + epcScore + priceScore + recurringBonus + nicheBonus - difficultyPenalty)));

  const verdict = flipScore >= 70
    ? 'YES — strong commission and EPC give you a clear path to profit.'
    : flipScore >= 50
      ? 'MAYBE — solid offer; optimize your traffic channel and niche angle before scaling.'
      : 'WATCH — thin margin or high complexity; validate demand and competition first.';

  return {
    affiliate_network: network,
    epc,
    commission_rate: commissionRate,
    category,
    difficulty,
    recommended_keywords: [
      `affiliate review ${subject.toLowerCase()}`,
      `best ${category.toLowerCase()} affiliate program`,
      `${subject.toLowerCase()} vs alternatives`,
      `how to earn with ${subject.toLowerCase()}`,
      `earn passive income ${category.toLowerCase()}`,
    ],
    recommended_niche_angles: [
      'Gen X women building faceless online income',
      `Beginner affiliate marketers in ${category.toLowerCase()}`,
      `Content creators reviewing ${category.toLowerCase()} tools`,
      `Solopreneurs comparing ${subject.toLowerCase()} alternatives`,
    ],
    page_outline: [
      `Hero: ${product || subject} + headline promise`,
      'Problem–agitate–solution framework',
      `${product || subject} feature breakdown`,
      'Real results & testimonials',
      'Comparison table vs alternatives',
      `Pricing + your commission explanation (${(commissionRate * 100).toFixed(1)}%)`,
      'Bonus / value-add section',
      'Risk reversal & guarantee',
      'FAQ',
      `Call-to-action + affiliate sign-up (${network})`,
    ],
    monetization_plan: [
      `Join the ${network} affiliate program`,
      'Build landing pages targeting high-intent keywords',
      `Publish honest ${subject.toLowerCase()} reviews + comparisons`,
      `Grow an email list with a ${category.toLowerCase()} lead magnet`,
      'Publish review roundup content (video or written)',
      'Drive Pinterest + targeted traffic',
      `Track EPC ($${epc}); pivot if below $0.20`,
      recurring ? 'Emphasize recurring commission upside' : 'Push high-ticket one-time payouts + upsells',
    ],
    seven_day_action_plan: [
      `Day 1: Join ${network} & install tracking links`,
      'Day 2: Write 2 SEO articles around your top keywords',
      'Day 3: Build a comparison table of 5 offers',
      `Day 4: Publish a detailed ${product || subject} review`,
      'Day 5: Set up a simple email nurture sequence',
      'Day 6: Share on Pinterest + relevant Facebook groups',
      'Day 7: Review clicks & conversions, optimize angles',
    ],
    flip_score: flipScore,
    verdict,
  };
}

export async function affiliateFlipAgent(input = {}) {
  // Try LLM with JSON-schema prompting.
  try {
    const response = await callLLM(SYSTEM_PROMPT, buildPrompt(input));
    const parsed = parseJsonReply(response.reply);
    const errors = validateAgainstSchema(AFFILIATE_FLIP_SCHEMA, parsed);

    if (!errors.length && Array.isArray(parsed.recommended_keywords) && parsed.recommended_keywords.length > 0) {
      return {
        affiliate_network: parsed.affiliate_network || input.known_network || 'ShareASale',
        epc: Number(parsed.epc) || input.epc || 0.35,
        commission_rate: Number(parsed.commission_rate) || input.commission_rate || 0.10,
        category: parsed.category || input.category || 'General',
        difficulty: parsed.difficulty || 'medium',
        recommended_keywords: parsed.recommended_keywords,
        recommended_niche_angles: parsed.recommended_niche_angles || [],
        page_outline: parsed.page_outline || [],
        monetization_plan: parsed.monetization_plan || [],
        seven_day_action_plan: Array.isArray(parsed.seven_day_action_plan)
          ? parsed.seven_day_action_plan.slice(0, 7)
          : [],
        flip_score: Number(parsed.flip_score) || 0,
        verdict: parsed.verdict || 'Review the numbers before promoting.',
        source: 'llm',
      };
    }

    console.warn('[affiliateFlipAgent] LLM output failed schema validation:', errors);
    throw new Error('Schema validation failed');
  } catch (err) {
    console.warn('[affiliateFlipAgent] LLM failed, using deterministic fallback:', err.message);
  }

  const fallback = deterministicAnalysis(input);
  fallback.source = 'fallback';
  return fallback;
}

export default affiliateFlipAgent;

