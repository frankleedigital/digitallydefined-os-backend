// src/agents/retirementGap.js — Retirement Gap Agent
// Purpose: Calculate the retirement income gap, years to close, and required monthly yield.
// Aligned with Pillar 5 (Financial Resilience & Legacy).

import { parseJsonReply } from '../services/ai.js';
import { aiRouter } from '../services/aiRouter.js';
import logger from '../utils/logger.js';

export async function calculateRetirementGap(params = {}) {
  const currentIncome = Number(params.currentIncome || 5000);
  const targetRetirementIncome = Number(params.targetRetirementIncome || 8000);
  const currentAssets = Number(params.currentAssets || 75000);
  const monthlySavings = Number(params.monthlySavings || 1000);
  const mode = params.mode || 'freeMode';

  const monthlyGap = Math.max(0, targetRetirementIncome - currentIncome);
  const annualGap = monthlyGap * 12;
  const targetNestEgg = annualGap * 20; // 4% rule
  const gapToTarget = Math.max(0, targetNestEgg - currentAssets);
  const yearsToClose = monthlySavings > 0 ? Math.round((gapToTarget / (monthlySavings * 12)) * 10) / 10 : 99;

  const systemPrompt = 'You are a financial resilience and retirement gap strategist for Gen X women.\n' +
    'Provide a structured JSON response with:\n' +
    '- monthlyGap: number\n' +
    '- annualGap: number\n' +
    '- targetNestEgg: number\n' +
    '- yearsToClose: number\n' +
    '- narrative: string (inspiring, pragmatic, no-BS tone)\n' +
    '- strategicActions: string[] (3 actionable steps to close the gap using digital assets)';

  const userPrompt = `Calculate retirement gap for current income $${currentIncome}/mo, target retirement income $${targetRetirementIncome}/mo, current assets $${currentAssets}, monthly savings $${monthlySavings}/mo.`;

  let result;
  try {
    result = await aiRouter.generate(null, userPrompt, { mode, systemPrompt, jsonMode: true });
  } catch (err) {
    result = { error: err.message };
  }
  if (result.error) {
    // Fallback if AI gateway times out
    return {
      monthlyGap,
      annualGap,
      targetNestEgg,
      yearsToClose,
      narrative: `Your monthly retirement gap is $${monthlyGap.toLocaleString()}. With $${monthlySavings.toLocaleString()}/mo in savings, building digital income assets is your fastest accelerator to close this gap.`,
      strategicActions: [
        'Launch a $17 tripwire digital product to capture initial acquisition velocity.',
        'Build a $297 flagship asset (Notion OS / Digital Real Estate) to generate $2k/mo in passive MRR.',
        'Automate lead capture via the Digital Superpower Quiz to feed your Brevo email list.',
      ],
      provider: 'fallback',
      timestamp: Date.now(),
    };
  }

  const parsed = parseJsonReply(typeof result.reply === 'string' ? result.reply : JSON.stringify(result.reply));

  return {
    monthlyGap: parsed?.monthlyGap ?? monthlyGap,
    annualGap: parsed?.annualGap ?? annualGap,
    targetNestEgg: parsed?.targetNestEgg ?? targetNestEgg,
    yearsToClose: parsed?.yearsToClose ?? yearsToClose,
    narrative: parsed?.narrative || `Monthly gap: $${monthlyGap.toLocaleString()}.`,
    strategicActions: parsed?.strategicActions || ['Build digital assets to accelerate cash flow.'],
    provider: result.provider || 'unknown',
    model: result.model || 'unknown',
    timestamp: Date.now(),
  };
}

export default { calculateRetirementGap };
