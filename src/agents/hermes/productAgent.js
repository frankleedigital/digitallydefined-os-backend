// src/agents/hermes/productAgent.js - ProductAgent
// Purpose: Handles product creation, validation, Gumroad strategy, store
// strategy, pricing, bundles, product launches, affiliate opportunities.
// Serves: digitallydefined.store
//
// Handled via aiRouter.generate() with full failover chain.
// Never direct provider calls.
//==============================================================================
import { aiRouter } from '../services/aiRouter.js';
import { parseJsonReply } from '../services/ai.js';
import logger from '../utils/logger.js';

/** System prompt for ProductAgent. */
const PRODUCT_SYSTEM_PROMPT =
  'You are Hermes — Francesca\'s AI product strategist for DigitallyDefined.store. ' +
  'You handle product creation, validation, Gumroad strategy, store strategy, ' +
  'pricing, bundles, product launches, and affiliate opportunities. ' +
  'You provide practical, actionable guidance. No markdown, no code fences, ' +
  'no emojis. 3-8 sentences. Always end with a next step. ' +
  'Never say "as an AI". You are Francesca\'s product strategist. ';

 /** User prompt constructor for ProductAgent. */
function buildProductPrompt(message, context = {}) {
  const { focus = 'general', pricePoint, bundle, launch, affiliate } = context;

  const parts = [
    `Provide product strategy for:`,
    `Focus: ${focus || 'general product strategy'}`,
    `Price point: ${pricePoint || 'not specified'}`,
    `Bundle: ${bundle || 'not specified'}`,
    `Launch: ${launch || 'not specified'}`,
    `Affiliate: ${affiliate || 'not specified'}`,
    `Message: ${message}`,
  ];

  return parts.join('\n\n');
}

/** ProductAgent handler — processes product strategy queries. */
export async function productAgentHandler(params) {
  const { message, context } = params;
  const focus = context.focus || 'general';

  const systemPrompt = PRODUCT_SYSTEM_PROMPT;
  const userPrompt = buildProductPrompt(message, context);

  try {
    const result = await aiRouter.generate(null, userPrompt, {
      mode: 'freeMode',
      systemPrompt,
      jsonMode: false,
    });

    if (result.error) {
      throw new Error(result.error || 'Product agent AI failed');
    }

    // Attach execution metadata
    return {
      reply: result.reply || 'I am here but I did not get a product response.',
      provider: result.provider || 'unknown',
      model: result.model || 'unknown',
      latencyMs: result.latencyMs ?? null,
      totalLatencyMs: result.totalLatencyMs ?? null,
      attempts: result.attempts || [],
      attemptErrors: result.attemptErrors || [],
      // Attach product-specific fields
      classification: 'productAgent',
    };
  } catch (error) {
    logger.error('ProductAgent execution failed', { error: error.message });
    throw error;
  }
}

export default { productAgentHandler };