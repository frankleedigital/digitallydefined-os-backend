// src/agents/hub.js — Agent Hub: browse, categorize, and launch the specialist
// agent system WITHOUT a chat dependency. Thin, additive layer over the
// existing agentRegistry + hermes orchestrator. No new AI logic.
//
// Powers the Agent Hub dashboard tab:
//   agents.list        -> all launchable agents grouped by OS category
//   agents.run         -> launch a single agent with its input params
//   agents.orchestrate -> hand a goal to the Business Partner orchestrator

import { agentRegistry, executeAgent } from './index.js';
import { handleHermesMessage } from './hermes/orchestrator.js';

// The 5 DigitallyDefined agent categories (per the OS architecture directive).
export const AGENT_CATEGORIES = {
  discovery: {
    label: 'Discovery',
    tagline: 'Find the best opportunities',
    color: '#F18B25',
    agents: {
      quiz: 'Digital Superpower',
      niche: 'Niche Intelligence',
      opportunities: 'Opportunity Scanner',
      trends: 'Trend Intelligence',
      competition: 'Competition Scout',
      audience: 'Audience Insight',
      scorecard: 'Performance Scorecard',
    },
  },
  creation: {
    label: 'Creation',
    tagline: 'Turn expertise into digital assets',
    color: '#47B7D4',
    agents: {
      product: 'Product Generator',
      productAgent: 'Offer Architect',
      roadmap: 'Authority Blueprint',
    },
  },
  content: {
    label: 'Content',
    tagline: 'Create visibility and traffic',
    color: '#2A9D5C',
    agents: {
      social: 'Social Content',
      contentAgent: 'Content Repurposer',
    },
  },
  digitalRealEstate: {
    label: 'Digital Real Estate',
    tagline: 'Acquire and grow scalable assets',
    color: '#8B5CF6',
    agents: {
      growthAgent: 'Rank-and-Rent / Growth',
    },
  },
  financialResilience: {
    label: 'Financial Resilience',
    tagline: 'Close the retirement gap and build a legacy',
    color: '#C20F0A',
    agents: {
      retirementGap: 'Retirement Gap',
      wealthCalculator: 'Wealth Calculator',
      assetPlan: 'Asset Plan',
      legacyOS: 'Legacy OS',
    },
  },
  revenue: {
    label: 'Revenue & Affiliate',
    tagline: 'Flip traffic into high-paying affiliate income',
    color: '#D4A017',
    agents: {
      affiliateFlipper: 'Affiliate Flipper AI',
    },
  },
  governance: {
    label: 'Brand & Governance',
    tagline: 'Ensure brand fidelity across all assets',
    color: '#2A9D5C',
    agents: {
      brandSupervisor: 'Brand Supervisor AI',
    },
  },
};

// What each launchable agent needs as input. Drives the Agent Hub forms.
export const AGENT_INPUT_SPECS = {
  quiz: { fields: [{ name: 'answers', label: 'Quiz answers (JSON)', type: 'json', required: true }] },
  niche: {
    fields: [
      { name: 'niche', label: 'Niche / topic', type: 'text', required: true },
      { name: 'audience', label: 'Target audience', type: 'text', required: false },
    ],
  },
  opportunities: {
    fields: [
      { name: 'niche', label: 'Niche / topic', type: 'text', required: true },
      { name: 'budget', label: 'Budget tier', type: 'select', options: ['low', 'medium', 'high'], required: false },
    ],
  },
  trends: { fields: [{ name: 'niche', label: 'Niche / topic', type: 'text', required: true }] },
  competition: { fields: [{ name: 'niche', label: 'Niche / topic', type: 'text', required: true }] },
  audience: { fields: [{ name: 'niche', label: 'Niche / topic', type: 'text', required: true }] },
  scorecard: { fields: [{ name: 'niche', label: 'Business / niche', type: 'text', required: true }] },
  product: { fields: [{ name: 'niche', label: 'Niche / topic', type: 'text', required: true }] },
  roadmap: { fields: [{ name: 'niche', label: 'Niche / topic', type: 'text', required: true }] },
  social: {
    fields: [
      { name: 'niche', label: 'Topic / product', type: 'text', required: true },
      { name: 'platform', label: 'Platform', type: 'text', required: false },
    ],
  },
  retirementGap: {
    fields: [
      { name: 'currentIncome', label: 'Current monthly income ($)', type: 'text', required: true },
      { name: 'targetRetirementIncome', label: 'Target retirement income ($/mo)', type: 'text', required: true },
      { name: 'currentAssets', label: 'Current liquid assets ($)', type: 'text', required: false },
      { name: 'monthlySavings', label: 'Monthly savings ($)', type: 'text', required: false },
    ],
  },
  wealthCalculator: {
    fields: [
      { name: 'netWorth', label: 'Current net worth ($)', type: 'text', required: true },
      { name: 'monthlyIncome', label: 'Monthly income ($)', type: 'text', required: true },
      { name: 'monthlyExpense', label: 'Monthly expenses ($)', type: 'text', required: true },
      { name: 'digitalAssetValue', label: 'Digital asset portfolio value ($)', type: 'text', required: false },
      { name: 'digitalMRR', label: 'Digital asset monthly recurring revenue ($)', type: 'text', required: false },
    ],
  },
  assetPlan: {
    fields: [
      { name: 'monthlyGap', label: 'Monthly retirement gap ($)', type: 'text', required: true },
      { name: 'persona', label: 'Digital superpower persona', type: 'select', options: ['builder', 'strategist', 'creator', 'educator'], required: false },
    ],
  },
  legacyOS: {
    fields: [
      { name: 'planScore', label: 'Plan pillar score (0-100)', type: 'text', required: false },
      { name: 'protectScore', label: 'Protect pillar score (0-100)', type: 'text', required: false },
      { name: 'operateScore', label: 'Operate score (0-100)', type: 'text', required: false },
    ],
  },
  affiliateFlipper: {
    fields: [
      { name: 'keyword', label: 'Keyword', type: 'text', required: true },
      { name: 'niche', label: 'Niche', type: 'text', required: false },
      { name: 'productName', label: 'Product name', type: 'text', required: false },
      { name: 'productUrl', label: 'Product URL', type: 'text', required: false },
      { name: 'affiliateUrl', label: 'Affiliate program URL', type: 'text', required: false },
      { name: 'commission', label: 'Commission (%)', type: 'text', required: false },
      { name: 'cookie', label: 'Cookie duration (days)', type: 'text', required: false },
      { name: 'recurring', label: 'Commission type', type: 'select', options: ['one-time', 'recurring'], required: false },
    ],
  },
  brandSupervisor: {
    fields: [
      { name: 'content', label: 'Content / Copy / Product Pitch / URL Spec', type: 'text', required: true },
      { name: 'contentType', label: 'Content Type', type: 'select', options: ['copy', 'product', 'landing-page', 'social', 'image-spec'], required: false },
    ],
  },
  productAgent: { fields: [{ name: 'message', label: 'What should the agent do?', type: 'text', required: true }] },
  contentAgent: { fields: [{ name: 'message', label: 'What should the agent do?', type: 'text', required: true }] },
  growthAgent: { fields: [{ name: 'message', label: 'What should the agent do?', type: 'text', required: true }] },
  businessAgent: { fields: [{ name: 'message', label: 'What should the agent do?', type: 'text', required: true }] },
};

/**
 * agents.list — every launchable agent grouped by OS category, with its
 * input spec and a "launchable" flag (false for Phase-B agents that have no
 * backend handler yet, so the hub can render them as coming-soon).
 */
export function handleAgentsList() {
  const registryNames = new Set(Object.keys(agentRegistry));
  const categories = Object.entries(AGENT_CATEGORIES).map(([key, cat]) => ({
    key,
    label: cat.label,
    tagline: cat.tagline,
    color: cat.color,
    agents: Object.entries(cat.agents).map(([name, display]) => ({
      name,
      displayName: display,
      description: agentRegistry[name]?.description || '',
      launchable: registryNames.has(name),
      input: AGENT_INPUT_SPECS[name] || { fields: [] },
    })),
  }));

  const orchestrator = handleHermesMessage
    ? { available: true, name: 'AI Business Partner', description: 'Routes a goal across multiple agents and returns an action plan.' }
    : { available: false };

  return {
    success: true,
    totalAgents: Object.keys(agentRegistry).length,
    launchableAgents: [...registryNames],
    categories,
    orchestrator,
    timestamp: Date.now(),
  };
}

/**
 * agents.run — launch a single specialist agent by name with its params.
 * Returns a structured result (never a chat reply) so the hub can render it.
 */
export async function handleAgentsRun(params = {}) {
  const agent = String(params.agent || '').trim();
  const agentParams = params.params || {};
  if (!agent || !agentRegistry[agent]) {
    return {
      success: false,
      error: 'Unknown agent: ' + agent + '. Launchable: ' + Object.keys(agentRegistry).join(', '),
    };
  }
  try {
    const result = await executeAgent(agent, agentParams);
    return {
      success: !result?.error,
      agent,
      data: result,
      provider: result?.provider || null,
      model: result?.model || null,
      timestamp: Date.now(),
    };
  } catch (err) {
    return { success: false, agent, error: err.message, timestamp: Date.now() };
  }
}

/**
 * agents.orchestrate — hand a goal to the Business Partner orchestrator.
 * It classifies intent, runs the right specialist, and returns a plan.
 */
export async function handleAgentsOrchestrate(params = {}) {
  const goal = String(params.goal || params.message || '').trim();
  if (!goal) {
    return { success: false, error: 'A goal is required to orchestrate across agents.' };
  }
  try {
    const result = await handleHermesMessage(goal, { context: params.context || {} });
    return {
      success: !result?.degraded,
      goal,
      plan: result,
      classification: result.classification,
      degraded: !!result.degraded,
      timestamp: Date.now(),
    };
  } catch (err) {
    return { success: false, goal, error: err.message, timestamp: Date.now() };
  }
}

export default { AGENT_CATEGORIES, AGENT_INPUT_SPECS, handleAgentsList, handleAgentsRun, handleAgentsOrchestrate };
