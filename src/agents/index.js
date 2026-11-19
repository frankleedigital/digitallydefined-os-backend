// src/agents/index.js - Agent Registry
// Purpose: Central registry of all AI agents.

import logger from '../utils/logger.js';
import { analyzeNiche } from './niche.js';
import { generateRoadmap } from './roadmap.js';
import { generateScorecard } from './scorecard.js';
import { generateProduct } from './product.js';
import { generateVisualAsset } from './visualAssetGenerator.js';
import { generateSocialContent } from './social.js';
import { identifyTrends } from './trends.js';
import { analyzeCompetition } from './competition.js';
import { analyzeAudience } from './audience.js';
import { identifyOpportunities } from './opportunities.js';
import { processQuiz } from './quiz.js';

// Financial Resilience agents (Phase B)
import { calculateRetirementGap } from './retirementGap.js';
import { calculateWealth } from './wealthCalculator.js';
import { generateAssetPlan } from './assetPlan.js';
import { evaluateLegacyOS } from './legacyOSAgent.js';

// Revenue & Affiliate agent
import { analyzeAffiliateFlip } from './affiliateFlipper.js';

// Notion Architect agent
import { notionArchitect } from './notionArchitect.js';

// Brand & Governance agent
import { evaluateBrandCompliance } from './brandSupervisor.js';

// Hermes specialist agents (Phase 2)
import { businessAgentHandler } from '../agents/hermes/businessAgent.js';
import { contentAgentHandler } from '../agents/hermes/contentAgent.js';
import { growthAgentHandler } from '../agents/hermes/growthAgent.js';
import { productAgentHandler } from '../agents/hermes/productAgent.js';

/** Agent registry for clean access to all agents. */
export const agentRegistry = {
  niche: {
    name: 'Niche Agent',
    description: 'Analyze niche markets, demand, competition, and monetization',
    handler: analyzeNiche,
    inputSchema: 'nicheRequestSchema',
  },
  roadmap: {
    name: 'Roadmap Agent',
    description: 'Generate strategic roadmaps with phases and milestones',
    handler: generateRoadmap,
    inputSchema: 'roadmapRequestSchema',
  },
  scorecard: {
    name: 'Scorecard Agent',
    description: 'Evaluate business performance across multiple dimensions',
    handler: generateScorecard,
    inputSchema: 'scorecardRequestSchema',
  },
  product: {
    name: 'Product Generator',
    description: 'Generate product concepts, features, and launch strategies',
    handler: generateProduct,
    inputSchema: 'productRequestSchema',
  },
  visualAsset: {
    name: 'Visual Asset & SVG Generator',
    description: 'Generate production-ready SVG cover graphics, badges, banners, and social cards in Flat Soft Brutalism',
    handler: generateVisualAsset,
  },
  social: {
    name: 'Social Agent',
    description: 'Create social media content for various platforms',
    handler: generateSocialContent,
    inputSchema: 'socialRequestSchema',
  },
  trends: {
    name: 'Trends Agent',
    description: 'Identify trending topics and emerging opportunities',
    handler: identifyTrends,
    inputSchema: 'trendsRequestSchema',
  },
  competition: {
    name: 'Competition Agent',
    description: 'Analyze the competitive landscape for a niche',
    handler: analyzeCompetition,
    inputSchema: 'competitionRequestSchema',
  },
  audience: {
    name: 'Audience Agent',
    description: 'Generate audience insights and personas for a niche',
    handler: analyzeAudience,
    inputSchema: 'audienceRequestSchema',
  },
  opportunities: {
    name: 'Opportunities Agent',
    description: 'Identify market gaps, quick wins, and product opportunities for a niche',
    handler: identifyOpportunities,
    inputSchema: 'opportunitiesRequestSchema',
  },
  quiz: {
    name: 'Quiz Agent',
    description: 'Process quiz answers and generate a superpower profile',
    handler: processQuiz,
    inputSchema: 'quizRequestSchema',
  },

  // Phase B: Financial Resilience agents
  retirementGap: {
    name: 'Retirement Gap Agent',
    description: 'Calculate retirement income gap, years to close, and required monthly asset yield',
    handler: calculateRetirementGap,
  },
  wealthCalculator: {
    name: 'Wealth Calculator Agent',
    description: 'Project net-worth trajectory and digital asset appreciation over 12/24/36 months',
    handler: calculateWealth,
  },
  assetPlan: {
    name: 'Asset Plan Agent',
    description: 'Recommend which digital assets to build or acquire to close the retirement gap',
    handler: generateAssetPlan,
  },
  legacyOS: {
    name: 'Legacy OS Agent',
    description: 'Evaluate Plan, Protect, Operate 3-pillar readiness for sovereign financial independence',
    handler: evaluateLegacyOS,
  },

  // Revenue & Affiliate agent
  affiliateFlipper: {
    name: 'Affiliate Flipper AI',
    description:
      'Analyze TRAFFIC → PRODUCT MATCH to find undervalued, monetizable traffic and flip it into high-paying (often recurring) affiliate commissions',
    handler: analyzeAffiliateFlip,
  },

  // Brand & Governance agent
  brandSupervisor: {
    name: 'Brand Enforcement AI',
    description: 'Active Brand Enforcement System. Automatically identifies violations, refactors copy, strips non-compliant styling, and generates 100% compliant production-ready assets.',
    handler: evaluateBrandCompliance,
  },

  // Notion OS Architect agent
  notionArchitect: {
    name: 'Notion OS Architect',
    description: 'Notion Product Architect that designs, builds, audits, optimizes, documents, and maintains premium Notion-based digital products for the DigitallyDefined ecosystem.',
    handler: notionArchitect,
  },

  // Phase 2: Hermes specialist agents
  businessAgent: {
    name: 'BusinessAgent',
    description:
      'Agency strategy, SEO recommendations, lead generation, service offers, client acquisition, reputation management, business growth',
    handler: businessAgentHandler,
    // No inputSchema — uses free-form message + context
  },
  contentAgent: {
    name: 'ContentAgent',
    description:
      'Blog posts, email content, lead magnets, social posts, sales copy, landing pages, content planning',
    handler: contentAgentHandler,
    // No inputSchema — uses free-form message + context
  },
  growthAgent: {
    name: 'GrowthAgent',
    description:
      'Keyword clustering, topical authority, SEO strategy, content maps, content opportunities, revenue opportunities, traffic growth',
    handler: growthAgentHandler,
    // No inputSchema — uses free-form message + context
  },
  productAgent: {
    name: 'ProductAgent',
    description:
      'Product creation, product validation, Gumroad strategy, store strategy, pricing, bundles, product launches, affiliate opportunities',
    handler: productAgentHandler,
    // No inputSchema — uses free-form message + context
  },
};

/** Get agent by name. */
export function getAgent(name) {
  return agentRegistry[name] || null;
}

/** List all available agents. */
export function listAgents() {
  return Object.entries(agentRegistry).map(([name, config]) => ({
    name,
    ...config,
  }));
}

/** Execute an agent by name with params. */
export async function executeAgent(name, params) {
  const agent = getAgent(name);
  if (!agent) {
    throw new Error('Unknown agent: ' + name + '. Available: ' + Object.keys(agentRegistry).join(', '));
  }

  logger.info('Executing agent', { agent: name, params: Object.keys(params) });

  try {
    const result = await agent.handler(params);
    logger.info('Agent execution completed', { agent: name, success: true });
    return result;
  } catch (error) {
    logger.error('Agent execution failed', { agent: name, error: error.message });
    throw error;
  }
}