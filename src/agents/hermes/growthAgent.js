// src/agents/hermes/growthAgent.js - GrowthAgent
// Purpose: Handles SEO strategy, keyword clustering, topical authority,
// content maps, content opportunities, revenue opportunities, traffic growth.
// Serves: francescalavigne.com, digitallydefined.store, digitallydefined.agency
//
// Handled via aiRouter.generate() with full failover chain.
// Never direct provider calls.
//==============================================================================
import { aiRouter } from '../services/aiRouter.js';
import { parseJsonReply } from '../services/ai.js';
import logger from '../utils/logger.js';

/** System prompt for GrowthAgent. */
const GROWTH_SYSTEM_PROMPT =
  'You are Hermes — Francesca\'s AI growth strategist. You analyze keyword ' +
  'clusters, topical authority, SEO strategy, content maps, content ' +
  'opportunities, revenue opportunities, and traffic growth for the ' +
  'DigitallyDefined ecosystem. ' +
  'You provide data-driven insights, not hype. No markdown, no code fences, ' +
  'no emojis. 3-8 sentences. Always end with a next step. ' +
  'Never say "as an AI". You are Francesca\'s growth strategist. ';

 /** User prompt constructor for GrowthAgent. */
function buildGrowthPrompt(message, context = {}) {
  const { focus = 'general', metrics, competitors, timeline } = context;

  const parts = [
    `Analyze growth opportunities for:`,
    `Focus: ${focus || 'general strategy'}`,
    `Timeline: ${timeline || 'ongoing'}`,
    `Message: ${message}`,
    `Competitors to consider: ${competitors || 'none specified'}`,
    `Key metrics to track: ${metrics || 'traffic, revenue, engagement'}`,
  ];

  return parts.join('\n\n');
}

/** GrowthAgent handler — processes growth/SEO strategy queries. */
export async function growthAgentHandler(params) {
  const { message, context } = params;
  const focus = context.focus || 'general';

  const systemPrompt = GROWTH_SYSTEM_PROMPT;
  const userPrompt = buildGrowthPrompt(message, context);

  try {
    const result = await aiRouter.generate(null, userPrompt, {
      mode: 'freeMode',
      systemPrompt,
      jsonMode: false,
    });

    if (result.error) {
      throw new Error(result.error || 'Growth agent AI failed');
    }

    // Attach execution metadata
    return {
      reply: result.reply || 'I am here but I did not get a growth response.',
      provider: result.provider || 'unknown',
      model: result.model || 'unknown',
      latencyMs: result.latencyMs ?? null,
      totalLatencyMs: result.totalLatencyMs ?? null,
      attempts: result.attempts || [],
      attemptErrors: result.attemptErrors || [],
      // Attach growth-specific fields
      classification: 'growthAgent',
    };
  } catch (error) {
    logger.error('GrowthAgent execution failed', { error: error.message });
    throw error;
  }
}

export default { growthAgentHandler };