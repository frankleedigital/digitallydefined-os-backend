// src/agents/wealthCalculator.js — Wealth Calculator Agent
// Purpose: Project net-worth trajectory and digital asset appreciation.
// Privacy-first: computations happen server-side but no PII is stored.

import { parseJsonReply } from '../services/ai.js';
import { aiRouter } from '../services/aiRouter.js';
import logger from '../utils/logger.js';

export async function calculateWealth(params = {}) {
  const netWorth = Number(params.netWorth || 150000);
  const monthlyIncome = Number(params.monthlyIncome || 5000);
  const monthlyExpense = Number(params.monthlyExpense || 4200);
  const digitalAssetValue = Number(params.digitalAssetValue || 5000);
  const digitalMRR = Number(params.digitalMRR || 200);
  const mode = params.mode || 'freeMode';

  const monthlySurplus = monthlyIncome - monthlyExpense + digitalMRR;
  const projection12mo = netWorth + (monthlySurplus * 12);
  const projection24mo = netWorth + (monthlySurplus * 24);
  const projection36mo = netWorth + (monthlySurplus * 36);

  const systemPrompt = 'You are a wealth trajectory analyst for Gen X women building digital assets.\n' +
    'Provide a structured JSON response with:\n' +
    '- currentNetWorth: number\n' +
    '- projection12mo: number (12-month projected net worth)\n' +
    '- projection24mo: number\n' +
    '- projection36mo: number\n' +
    '- assetGrowthRate: string (monthly % growth of digital assets)\n' +
    '- narrative: string (direct, empowering, no-BS)\n' +
    '- accelerators: string[] (3 ways to accelerate wealth through digital assets)';

  const userPrompt = `Wealth trajectory analysis: net worth $${netWorth.toLocaleString()}, monthly income $${monthlyIncome.toLocaleString()}, expenses $${monthlyExpense.toLocaleString()}, digital asset portfolio $${digitalAssetValue.toLocaleString()} (MRR: $${digitalMRR}).`;

  const result = await aiRouter.generate(null, userPrompt, { mode, systemPrompt, jsonMode: true });
  if (result.error) {
    return {
      currentNetWorth: netWorth,
      projection12mo,
      projection24mo,
      projection36mo,
      assetGrowthRate: digitalMRR > 0 ? `${((digitalMRR / Math.max(digitalAssetValue, 1)) * 100).toFixed(1)}%/mo` : '0%',
      narrative: `Current trajectory adds $${(monthlySurplus * 12).toLocaleString()} per year. Digital asset MRR of $${digitalMRR} is your compound accelerator.`,
      accelerators: [
        'Increase digital MRR by launching one new $17-47 product per quarter.',
        'Reinvest 50% of digital revenue into traffic acquisition for the quiz funnel.',
        'Build one Rank-and-Rent property to add $500-1,500/mo in passive income.',
      ],
      provider: 'fallback',
      timestamp: Date.now(),
    };
  }

  const parsed = parseJsonReply(typeof result.reply === 'string' ? result.reply : JSON.stringify(result.reply));

  return {
    currentNetWorth: parsed?.currentNetWorth ?? netWorth,
    projection12mo: parsed?.projection12mo ?? projection12mo,
    projection24mo: parsed?.projection24mo ?? projection24mo,
    projection36mo: parsed?.projection36mo ?? projection36mo,
    assetGrowthRate: parsed?.assetGrowthRate || '—',
    narrative: parsed?.narrative || `Net worth trajectory: $${projection12mo.toLocaleString()} in 12 months.`,
    accelerators: parsed?.accelerators || ['Build more digital assets.'],
    provider: result.provider || 'unknown',
    model: result.model || 'unknown',
    timestamp: Date.now(),
  };
}

export default { calculateWealth };
