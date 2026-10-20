// src/lib/quiz/personas.js — persona display copy + server-aligned profiles

export const PERSONAS = {
  creator: {
    title: 'The Creator', tagline: 'Private output. Public leverage.',
    description: 'You think in content, story, and audience experience. Your superpower is turning insight into assets that keep working after you publish them.',
    superpowerName: 'Content Alchemist',
    recommendedFirstStep: 'Start with one automated content asset tied to a niche offer.',
    toolPreference: 'Content Planner, AI writing assistants, simple publishing pipelines',
    businessModel: 'Content-driven products with automated delivery pipelines',
    recommendedPathways: ['Private content libraries with automated email delivery', 'AI-assisted content repurpose pipelines', 'Quiet hobby communities with faceless product sales'],
  },
  builder: {
    title: 'The Builder', tagline: 'Systems first. Visibility later.',
    description: 'You care about infrastructure, templates, and repeatable systems. Your superpower is making complex income paths simple enough to run without constant oversight.',
    superpowerName: 'Digital Architect',
    recommendedFirstStep: 'Pick one rank-and-rent or digital asset model and map its workflow.',
    toolPreference: 'Niche Profitability Scorecard, SOP builders, asset trackers',
    businessModel: 'Owner of faceless digital real estate (rank-and-rent, templates, micro-SaaS)',
    recommendedPathways: ['Rank-and-rent landing pages in local home services', 'Template and checklist products for organized professionals', 'Micro-SaaS wrappers for repetitive tasks'],
  },
  educator: {
    title: 'The Educator', tagline: 'Clarity compounds.',
    description: 'You learn deeply and want to translate that into trust. Your superpower is organizing what others find confusing into simple, proven paths.',
    superpowerName: 'Clarity Catalyst',
    recommendedFirstStep: 'Document one micro-system you already use and turn it into a checklist.',
    toolPreference: 'Workbook templates, PDF engines, email courses',
    businessModel: 'Guides, templates, courses, and teaching systems on autopilot',
    recommendedPathways: ['Workbook and checklist products for niche professionals', 'Email course sequences built on proven frameworks', 'Notion template bundles for common workflows'],
  },
  connector: {
    title: 'The Connector', tagline: 'Network effects beat noise.',
    description: 'You see relationships, partnerships, and group dynamics. Your superpower is matching people, offers, and opportunities in ways that create shared wins.',
    superpowerName: 'Network Weaver',
    recommendedFirstStep: 'Map one community or partner path inside your niche.',
    toolPreference: 'Community CTAs, referral systems, partnership trackers',
    businessModel: 'Community, referrals, and partner-offer ecosystems',
    recommendedPathways: ['Referral and partner-introduction systems', 'Micro-community platforms around shared values', 'Affiliate and joint-venture ecosystems'],
  },
  strategist: {
    title: 'The Strategist', tagline: 'Direction beats speed.',
    description: 'You prioritize outcomes over activity. Your superpower is choosing the right model and cutting the rest, which prevents wasted effort.',
    superpowerName: 'Opportunity Scout',
    recommendedFirstStep: 'Run the Niche Profitability Scorecard before building anything new.',
    toolPreference: 'Scorecards, revenue models, portfolio trackers',
    businessModel: 'High-leverage planning tools and portfolio-style digital assets',
    recommendedPathways: ['Portfolio of small rank-and-rent assets', 'Decision-framework products for busy professionals', 'Automated lead-generation funnels with clear ROI tracking'],
  },
};

export function getPersona(key) {
  return PERSONAS[key] || PERSONAS.builder;
}
