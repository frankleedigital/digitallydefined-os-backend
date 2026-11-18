// src/agents/legacyOSAgent.js — Legacy OS Agent
// Purpose: Evaluate Plan · Protect · Operate 3-pillar readiness for Gen X women.
// Aligned with Pillar 5 & Flagship $297 Offer.

import { parseJsonReply } from '../services/ai.js';
import { aiRouter } from '../services/aiRouter.js';
import logger from '../utils/logger.js';

export async function evaluateLegacyOS(params = {}) {
  const planScore = Number(params.planScore || 60); // Freedom number & asset plan
  const protectScore = Number(params.protectScore || 40); // Estate docs & caregiving plan
  const operateScore = Number(params.operateScore || 50); // Daily biz OS & automations
  const mode = params.mode || 'freeMode';

  const overallScore = Math.round((planScore + protectScore + operateScore) / 3);

  const systemPrompt = 'You are the Legacy OS Sovereign Architect for Gen X women.\n' +
    'Evaluate Plan, Protect, and Operate readiness.\n' +
    'Return structured JSON with:\n' +
    '- planScore: number\n' +
    '- protectScore: number\n' +
    '- operateScore: number\n' +
    '- overallScore: number\n' +
    '- sovereignStatus: string (e.g. "Securing Foundation", "Growth Phase", "Sovereign Empire")\n' +
    '- pillarAnalysis: {plan: string, protect: string, operate: string}\n' +
    '- immediateNextStep: string';

  const userPrompt = `Evaluate LegacyOS readiness: Plan score ${planScore}/100, Protect score ${protectScore}/100, Operate score ${operateScore}/100.`;

  let result;
  try {
    result = await aiRouter.generate(null, userPrompt, { mode, systemPrompt, jsonMode: true });
  } catch (err) {
    result = { error: err.message };
  }
  if (result.error) {
    return {
      planScore,
      protectScore,
      operateScore,
      overallScore,
      sovereignStatus: overallScore > 75 ? 'Sovereign Empire' : overallScore > 50 ? 'Growth Phase' : 'Securing Foundation',
      pillarAnalysis: {
        plan: planScore < 70 ? 'Retirement gap math needs refinement. Lock in your freedom number.' : 'Plan pillar is solid.',
        protect: protectScore < 70 ? 'Caregiving exposure and estate documents need attention. Protect before scaling.' : 'Protection pillar is robust.',
        operate: operateScore < 70 ? 'Automations and digital asset infrastructure need consolidation.' : 'Operations run smoothly.',
      },
      immediateNextStep: protectScore < 70 ? 'Complete the 5 Estate Documents Checklist and Caregiver Benefits Guide.' : 'Launch your Flagship LegacyOS product offer.',
      provider: 'fallback',
      timestamp: Date.now(),
    };
  }

  const parsed = parseJsonReply(typeof result.reply === 'string' ? result.reply : JSON.stringify(result.reply));

  return {
    planScore: parsed?.planScore ?? planScore,
    protectScore: parsed?.protectScore ?? protectScore,
    operateScore: parsed?.operateScore ?? operateScore,
    overallScore: parsed?.overallScore ?? overallScore,
    sovereignStatus: parsed?.sovereignStatus || 'Securing Foundation',
    pillarAnalysis: parsed?.pillarAnalysis || { plan: '', protect: '', operate: '' },
    immediateNextStep: parsed?.immediateNextStep || 'Secure your digital asset foundation.',
    provider: result.provider || 'unknown',
    model: result.model || 'unknown',
    timestamp: Date.now(),
  };
}

export default { evaluateLegacyOS };
