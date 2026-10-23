// src/agents/quiz.js - Quiz Agent
// Purpose: Process quiz answers and generate superpower profile.
// Note: Quiz submission is primarily handled by Supabase Edge Functions (/functions/v1/quiz-submit).
// This agent provides a fallback/alternative for the intelligence pipeline.

import { parseJsonReply } from '../services/ai.js';
import { aiRouter } from '../services/aiRouter.js';
import { quizRequestSchema } from '../schemas/quiz.js';
import logger from '../utils/logger.js';

// The five canonical personas. These match the public quiz's question bank
// and the copy in the persona library, and they are the five pathways the
// nurture sequence forks on (see SUPERPOWER_QUIZ_MASTER_FUNNEL.md).
// The quiz page scores deterministically in the browser and posts the result,
// so this is a fallback + enrichment map, not the source of truth.
const SUPERPOWER_PROFILES = {
  creator: {
    name: 'The Creator',
    description: 'You think in content, story, and audience experience. Your superpower is turning insight into assets that keep working after you publish them.',
    businessModel: 'Content-driven products with automated delivery pipelines',
    pathways: ['Private content libraries with automated email delivery', 'AI-assisted content repurpose pipelines', 'Quiet hobby communities with faceless product sales'],
  },
  builder: {
    name: 'The Builder',
    description: 'You care about infrastructure, templates, and repeatable systems. Your superpower is making complex income paths simple enough to run without constant oversight.',
    businessModel: 'Owner of faceless digital real estate (rank-and-rent, templates, micro-SaaS)',
    pathways: ['Rank-and-rent landing pages in local home services', 'Template and checklist products for organized professionals', 'Micro-SaaS wrappers for repetitive tasks'],
  },
  educator: {
    name: 'The Educator',
    description: 'You learn deeply and want to translate that into trust. Your superpower is organizing what others find confusing into simple, proven paths.',
    businessModel: 'Guides, templates, courses, and teaching systems on autopilot',
    pathways: ['Workbook and checklist products for niche professionals', 'Email course sequences built on proven frameworks', 'Notion template bundles for common workflows'],
  },
  connector: {
    name: 'The Connector',
    description: 'You see relationships, partnerships, and group dynamics. Your superpower is matching people, offers, and opportunities in ways that create shared wins.',
    businessModel: 'Community, referrals, and partner-offer ecosystems',
    pathways: ['Referral and partner-introduction systems', 'Micro-community platforms around shared values', 'Affiliate and joint-venture ecosystems'],
  },
  strategist: {
    name: 'The Strategist',
    description: 'You prioritize outcomes over activity. Your superpower is choosing the right model and cutting the rest, which prevents wasted effort.',
    businessModel: 'High-leverage planning tools and portfolio-style digital assets',
    pathways: ['Portfolio of small rank-and-rent assets', 'Decision-framework products for busy professionals', 'Automated lead-generation funnels with clear ROI tracking'],
  },
  // Legacy aliases kept so older payloads still resolve to a profile.
  architect: {
    name: 'The Architect',
    description: 'You see systems where others see chaos. Your superpower is building scalable frameworks.',
    businessModel: 'Templates, Playbooks, Frameworks',
    pathways: ['Notion template marketplace', 'Systems consulting', 'Course on organization'],
  },
  automator: {
    name: 'The Automator',
    description: 'You eliminate manual work with code and workflows. Your superpower is leverage.',
    businessModel: 'Automation Templates, Workflows, Tools',
    pathways: ['Make/Zapier templates', 'Custom automation agency', 'SaaS micro-tools'],
  },
  researcher: {
    name: 'The Researcher',
    description: 'You dig deep and find gold. Your superpower is insight synthesis.',
    businessModel: 'Research Reports, Data Products, Intelligence',
    pathways: ['Market intelligence newsletter', 'Competitor analysis packs', 'Trend forecasting'],
  },
};

const CANONICAL_PERSONAS = ['creator', 'builder', 'educator', 'connector', 'strategist'];

// The concrete first three steps for each persona. These are the same steps
// the public quiz shows on screen, so the emailed roadmap and the result page
// the customer just read never disagree.
const ROADMAP_STEPS = {
  creator: [
    'Pick one niche and one offer. One. Not three.',
    'Write three posts this week in that niche — one problem, one method, one story.',
    'Turn your best post into a free checklist and hand it out in the group.',
  ],
  builder: [
    'Choose the one asset model you will run: rank-and-rent, template product, or micro-tool.',
    'Map the workflow end to end on paper before you build anything.',
    'Ship version one in a weekend. Ugly is fine — live is what matters.',
  ],
  educator: [
    'Document one micro-system you already use — the checklist you actually follow.',
    'Turn it into a one-page guide and give it away in the group.',
    'Sell the next level: a template pack or short course from the same system.',
  ],
  connector: [
    'Map one community or partner path inside your niche.',
    'Make one introduction that costs you nothing and helps someone.',
    'Build the referral loop: every happy customer points at the next one.',
  ],
  strategist: [
    'Score one idea against the niche scorecard and kill it if the numbers are wrong.',
    'Write the offer: one sentence, one price, one promise.',
    'Choose the single metric that proves it worked. Ignore the rest for 30 days.',
  ],
};

function inferSuperpower(answers, explicit) {
  // The quiz page scores deterministically in the browser and posts the
  // persona it derived. That value wins — otherwise the email and the page
  // the customer just saw would disagree about who they are.
  const given = String(explicit || '').trim().toLowerCase();
  if (given && SUPERPOWER_PROFILES[given]) return given;

  // Fallback heuristic based on answer patterns.
  const answerValues = Object.values(answers || {}).join(' ').toLowerCase();

  if (answerValues.includes('system') || answerValues.includes('organize') || answerValues.includes('framework')) return 'architect';
  if (answerValues.includes('create') || answerValues.includes('content') || answerValues.includes('write')) return 'creator';
  if (answerValues.includes('strateg') || answerValues.includes('plan') || answerValues.includes('position')) return 'strategist';
  if (answerValues.includes('communit') || answerValues.includes('connect') || answerValues.includes('network')) return 'connector';
  if (answerValues.includes('automat') || answerValues.includes('workflow') || answerValues.includes('tool')) return 'automator';
  if (answerValues.includes('research') || answerValues.includes('analyz') || answerValues.includes('data')) return 'researcher';

  // Default to builder
  return 'builder';
}

/**
 * Process quiz answers and generate superpower profile.
 * @param {object} params - Request parameters
 * @param {object} params.answers - Quiz answers
 * @param {'freeMode'|'proMode'|'ultraMode'} [params.mode='freeMode'] - AI mode
 * @returns {Promise<object>} Quiz result with superpower profile
 */
export async function processQuiz(params) {
  const validated = quizRequestSchema.parse(params);
  const { answers, mode } = validated;
  const explicitPersona = validated.persona || validated.superpower || '';

  // Determine superpower: the browser-scored persona wins, heuristic is fallback.
  const superpowerKey = inferSuperpower(answers, explicitPersona);
  const profile = SUPERPOWER_PROFILES[superpowerKey];

  // Build niche from superpower
  const niche = `Faceless ${profile.name} building digital assets`;

  // Use AI to generate detailed profile if in pro/ultra mode
  let aiEnhanced = null;
  if (mode === 'proMode' || mode === 'ultraMode') {
    const systemPrompt = 'You are a career coach for Gen X women building faceless digital businesses. ' +
      'Given quiz answers, provide a detailed superpower profile with specific business model recommendations.';
    
    const userPrompt = 'Quiz answers: ' + JSON.stringify(answers) +
      '\n\nPrimary superpower: ' + profile.name +
      '\n\nGenerate a detailed profile with: strengths, blindspots, business model, pathways, confidence score, and next action.';

    try {
      const result = await aiRouter.generate(null, userPrompt, { mode, systemPrompt, jsonMode: true });
      if (!result.error) {
        aiEnhanced = parseJsonReply(typeof result.reply === 'string' ? result.reply : JSON.stringify(result.reply));
      }
    } catch (err) {
      logger.warn('AI quiz enhancement failed, using defaults', { error: err.message });
    }
  }

  return {
    superpower: superpowerKey,
    superpowerName: profile.name,
    superpowerDescription: profile.description,
    persona: profile.name,
    personaKey: superpowerKey,
    personaDescription: 'You are a ' + profile.name.toLowerCase() + '. ' + profile.description,
    strengths: aiEnhanced?.strengths || ['Systems thinking', 'Pattern recognition', 'Scalable execution'],
    blindspots: aiEnhanced?.blindspots || ['Perfectionism', 'Over-engineering', 'Analysis paralysis'],
    businessModel: profile.businessModel,
    recommendedPathways: profile.pathways,
    confidenceScore: aiEnhanced?.confidenceScore || 78,
    energyLevel: aiEnhanced?.energyLevel || 'High',
    burnoutRisk: aiEnhanced?.burnoutRisk || 'Low',
    privacyNeeds: aiEnhanced?.privacyNeeds || 'High',
    overwhelmLevel: aiEnhanced?.overwhelmLevel || 'Moderate',
    readinessLevel: aiEnhanced?.readinessLevel || 'Ready to start',
    facelessComfort: aiEnhanced?.facelessComfort || 'Comfortable',
    profitabilityScore: aiEnhanced?.profitabilityScore || 82,
    competitionLevel: aiEnhanced?.competitionLevel || 'Medium',
    trendStrength: aiEnhanced?.trendStrength || 'Growing',
    nicheViability: aiEnhanced?.nicheViability || 'High',
    audienceInsight: aiEnhanced?.audienceInsight || 'Gen X women want systems, not more information',
    opportunityGaps: aiEnhanced?.opportunityGaps || ['No done-with-you implementation', 'Missing community accountability'],
    niche,
    superpowerNiche: niche,
    personaNiche: niche,
    roadmapSteps: aiEnhanced?.roadmapSteps || ROADMAP_STEPS[superpowerKey] || [
      'Define your signature framework',
      'Build your first digital asset',
      'Create a lead magnet',
      'Launch to warm audience',
    ],
    estimatedTime: aiEnhanced?.estimatedTime || '30-60 days',
    tools: aiEnhanced?.tools || ['Notion', 'Canva', 'Email platform'],
    aiTools: aiEnhanced?.aiTools || ['Claude', 'ChatGPT', 'Perplexity'],
    nextAction: aiEnhanced?.nextAction || 'Map your expertise to a teachable framework',
    mode: mode,
    provider: aiEnhanced?.provider || 'local-logic',
    model: aiEnhanced?.model || 'rule-based',
    timestamp: Date.now(),
  };
}

export default { processQuiz };