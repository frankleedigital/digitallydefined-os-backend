// src/agents/assetPlan.js — Asset Plan Agent
// Purpose: Recommend which digital assets to build/acquire to close the retirement gap.
// Bridges Pillar 2 (Digital Real Estate) with Pillar 5 (Financial Resilience).

import { parseJsonReply } from '../services/ai.js';
import { aiRouter } from '../services/aiRouter.js';
import logger from '../utils/logger.js';

export async function generateAssetPlan(params = {}) {
  const monthlyGap = Number(params.monthlyGap || 3000);
  const currentAssets = params.currentAssets || [];
  const persona = params.persona || 'builder';
  const mode = params.mode || 'freeMode';

  const systemPrompt = 'You are a digital asset portfolio strategist for Gen X women.\n' +
    'Given a monthly income gap, recommend which digital assets to build or acquire.\n' +
    'Return structured JSON with:\n' +
    '- monthlyGapTarget: number\n' +
    '- recommendedAssets: [{name, type, estimatedMRR, effortLevel, timeToRevenue, description}]\n' +
    '- totalProjectedMRR: number (sum of all recommended assets)\n' +
    '- gapCoverage: string (% of gap covered by this plan)\n' +
    '- narrative: string (direct, actionable)\n' +
    '- priorityOrder: string[] (which asset to build first, second, third)';

  const userPrompt = `Build an asset plan to close a $${monthlyGap}/mo retirement income gap. ` +
    `Current assets: ${currentAssets.length ? JSON.stringify(currentAssets) : 'none yet'}. ` +
    `Persona type: ${persona}. Focus on faceless digital products, Notion suites, digital real estate, and automated systems.`;

  const result = await aiRouter.generate(null, userPrompt, { mode, systemPrompt, jsonMode: true });
  if (result.error) {
    const plan = [
      { name: 'LegacyOS Bundle', type: 'flagship', estimatedMRR: 1500, effortLevel: 'Medium', timeToRevenue: '30 days', description: '$297 Plan-Protect-Operate suite' },
      { name: 'Freedom Number Hub', type: 'tripwire', estimatedMRR: 400, effortLevel: 'Low', timeToRevenue: '7 days', description: '$17 financial dashboard tool' },
      { name: 'Niche Authority Site', type: 'digital-real-estate', estimatedMRR: 800, effortLevel: 'High', timeToRevenue: '90 days', description: 'Rank-and-rent property generating lease income' },
      { name: '50 GenX AI Prompts', type: 'product', estimatedMRR: 300, effortLevel: 'Low', timeToRevenue: '14 days', description: '$27 standalone digital product' },
    ];
    return {
      monthlyGapTarget: monthlyGap,
      recommendedAssets: plan,
      totalProjectedMRR: plan.reduce((s, a) => s + a.estimatedMRR, 0),
      gapCoverage: `${Math.min(100, Math.round((plan.reduce((s, a) => s + a.estimatedMRR, 0) / monthlyGap) * 100))}%`,
      narrative: `To close your $${monthlyGap.toLocaleString()}/mo gap, prioritize the LegacyOS flagship ($297) and one Rank-and-Rent property.`,
      priorityOrder: plan.map(a => a.name),
      provider: 'fallback',
      timestamp: Date.now(),
    };
  }

  const parsed = parseJsonReply(typeof result.reply === 'string' ? result.reply : JSON.stringify(result.reply));

  return {
    monthlyGapTarget: parsed?.monthlyGapTarget ?? monthlyGap,
    recommendedAssets: parsed?.recommendedAssets || [],
    totalProjectedMRR: parsed?.totalProjectedMRR ?? 0,
    gapCoverage: parsed?.gapCoverage || '—',
    narrative: parsed?.narrative || 'Asset plan generated.',
    priorityOrder: parsed?.priorityOrder || [],
    provider: result.provider || 'unknown',
    model: result.model || 'unknown',
    timestamp: Date.now(),
  };
}

export default { generateAssetPlan };
