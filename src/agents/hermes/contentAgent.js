// src/agents/hermes/contentAgent.js - ContentAgent
// Purpose: Handles content creation across all formats and properties.
// Serves: francescalavigne.com, digitallydefined.store, digitallydefined.agency
//
// Handled via aiRouter.generate() with full failover chain.
// Never direct provider calls.
//==============================================================================
import { aiRouter } from '../services/aiRouter.js';
import { parseJsonReply } from '../services/ai.js';
import logger from '../utils/logger.js';

/** System prompt for ContentAgent. */
const CONTENT_SYSTEM_PROMPT =
  'You are Hermes — Francesca\'s AI content creator. You create blog posts,' +
  ' email sequences, lead magnets, social media posts, sales copy, landing' +
  ' pages, and content plans for the DigitallyDefined ecosystem. ' +
  'You write in Francesca\'s voice: warm but direct, no fluff, no hype, no ' +
  'income promises. No markdown, no code fences, no emojis. 3-8 sentences. ' +
  'Always end with a next step or call to action. ' +
  'Never say "as an AI". You are Francesca\'s content creator. ';

 /** User prompt constructor for ContentAgent. */
function buildContentPrompt(message, context = {}) {
  const { type = 'general', topic, tone, audience, goals } = context;

  const typeGuides = {
    blog: 'Write a complete blog post. Include: headline, 3-8 sentence body, next step.',
    email: 'Write an email sequence. Include: subject line, 3-5 email bodies, next step for each.',
    social: 'Write social media posts. Include: post text, 3 hashtags, next step.',
    landing: 'Write landing page copy. Include: headline, value proposition, benefits, call to action.',
    general: 'Create content. Include: headline, body, next step.',
  };

  const guide = typeGuides[type] || typeGuides.general;

  const parts = [
    `Create: ${guide}`,
    `Topic: ${topic || 'general'}`,
    `Tone: ${tone || 'conversational'}`,
    `Audience: ${audience || 'Francesca\'s readers'}`,
    `Goals: ${goals || 'engagement and value'}`,
    `Message: ${message}`,
  ];

  return parts.join('\n\n');
}

/** ContentAgent handler — processes content creation queries. */
export async function contentAgentHandler(params) {
  const { message, context } = params;
  const type = context.type || 'general';

  const systemPrompt = CONTENT_SYSTEM_PROMPT;
  const userPrompt = buildContentPrompt(message, context);

  try {
    const result = await aiRouter.generate(null, userPrompt, {
      mode: 'freeMode',
      systemPrompt,
      jsonMode: false,
    });

    if (result.error) {
      throw new Error(result.error || 'Content agent AI failed');
    }

    // Attach execution metadata
    return {
      reply: result.reply || 'I am here but I did not get a content response.',
      provider: result.provider || 'unknown',
      model: result.model || 'unknown',
      latencyMs: result.latencyMs ?? null,
      totalLatencyMs: result.totalLatencyMs ?? null,
      attempts: result.attempts || [],
      attemptErrors: result.attemptErrors || [],
      // Attach content-specific fields
      classification: 'contentAgent',
    };
  } catch (error) {
    logger.error('ContentAgent execution failed', { error: error.message });
    throw error;
  }
}

export default { contentAgentHandler };