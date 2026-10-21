// src/agents/hermes/registry.js - Hermes Agent Registry
// Purpose: Register and provide access to the 4 specialist agents.
// Kept separate from the main agentRegistry so Hermes orchestration
// is decoupled from the general agent system.

import { BusinessAgent } from '../businessAgent.js';
import { ContentAgent } from '../contentAgent.js';
import { GrowthAgent } from '../growthAgent.js';
import { ProductAgent } from '../productAgent.js';

/** Map of agent names to agent constructors/configs. */
export const hermesAgentRegistry = {
  businessAgent: {
    name: 'businessAgent',
    handler: BusinessAgent,
    serves: ['digitallydefined.agency'],
    description:
      'Agency strategy, SEO recommendations, lead generation, service offers, client acquisition, reputation management, business growth',
  },

  contentAgent: {
    name: 'contentAgent',
    handler: ContentAgent,
    serves: [
      'francescalavigne.com',
      'digitallydefined.store',
      'digitallydefined.agency',
    ],
    description:
      'Blog posts, email content, lead magnets, social posts, sales copy, landing pages, content planning',
  },

  growthAgent: {
    name: 'growthAgent',
    handler: GrowthAgent,
    serves: [
      'francescalavigne.com',
      'digitallydefined.store',
      'digitallydefined.agency',
    ],
    description:
      'Keyword clustering, topical authority, SEO strategy, content maps, content opportunities, revenue opportunities, traffic growth',
  },

  productAgent: {
    name: 'productAgent',
    handler: ProductAgent,
    serves: ['digitallydefined.store'],
    description:
      'Product creation, product validation, Gumroad strategy, store strategy, pricing, bundles, product launches, affiliate opportunities',
  },
};

/** Get a Hermes agent by name. */
export function getHermesAgent(name) {
  return hermesAgentRegistry[name] || null;
}

/** List all Hermes agents. */
export function listHermesAgents() {
  return Object.entries(hermesAgentRegistry).map(([name, config]) => ({
    name,
    serves: config.serves,
    description: config.description,
  }));
}

/** Get all registered agent names. */
export function getHermesAgentNames() {
  return Object.keys(hermesAgentRegistry);
}