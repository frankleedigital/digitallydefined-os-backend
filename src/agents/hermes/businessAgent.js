// src/agents/hermes/businessAgent.js - BusinessAgent
// Purpose: Handles agency strategic planning, SEO recommendations,
// lead generation, service offers, client acquisition, reputation management,
// and business growth for DigitallyDefined.agency.
//
// Handled via aiRouter.generate() with full failover chain (OmniRoute →
// Vertex Gemini → AgentRouter → Cheap Inference). Never direct provider calls.
//
// Serves: DigitallyDefined.agency
//==============================================================================
import { aiRouter } from '../services/aiRouter.js';
import { parseJsonReply, validateAgainstSchema } from '../services/ai.js';
import logger from '../utils/logger.js';

/** System prompt for BusinessAgent. */
const BUSINESS_SYSTEM_PROMPT =
  'You are Hermes — Francesca\'s AI business partner at DigitallyDefined. agency. ' +
  'You provide strategic guidance, SEO recommendations, lead generation ideas,' +
  ' service offers, client acquisition advice, reputation management insights,' +
  ' and business growth strategy. ' +
  'You speak as a trusted co-founder, not a corporate bot. ' +
  'Lead with the answer, then explain. 3-8 sentences. No markdown, no code fences, no emojis. ' +
  'Always end with a next step. ' +
  'Never say "as an AI". You are her partner. ';

 /** User prompt constructor for BusinessAgent. */
 function buildBusinessPrompt(message, context = {}) {
  const { job = 'reasoning', context: ctxContext = '' } = context;

  const base = `
Create a strategic business response for:
- Focus: ${job === 'reasoning' ? 'strategic analysis' : job}
- Context: ${ctxContext || 'general business advice'}

Message: ${message}

Return a structured response with:
- summary: One sentence: what's working, what's not
- revenue_signals: { trend: "growing|stable|declining|insufficient_data", top_product: "name or null", top_lead_source: "name or null }
- growth_opportunities: ["opp 1", "opp 2", "opp 3"]
- risk_flags: ["risk 1", "risk 2"]
- recommended_next_action: "single most important next step"
- confidence: "high|medium|low"

Return ONLY valid JSON matching this schema. No prose, no preamble, no markdown.`;

  return base;
}

/** BusinessAgent handler — processes strategic business queries. */
export async function businessAgentHandler(params) {
  const { message, context } = params;
  const job = context.job || 'reasoning';

  const systemPrompt = BUSINESS_SYSTEM_PROMPT;
  const userPrompt = buildBusinessPrompt(message, context);

  try {
    const result = await aiRouter.generate(null, userPrompt, {
      mode: 'ultraMode',
      job,
      systemPrompt,
      jsonMode: true,
    });

    if (result.error) {
      throw new Error(result.error || 'Business agent AI failed');
    }

    // Attach execution metadata
    return {
      reply: result.reply || 'I am here but I did not get a structured response.',
      provider: result.provider || 'unknown',
      model: result.model || 'unknown',
      latencyMs: result.latencyMs ?? null,
      totalLatencyMs: result.totalLatencyMs ?? null,
      attempts: result.attempts || [],
      attemptErrors: result.attemptErrors || [],
      // Attach business-specific fields
      classification: 'businessAgent',
    };
  } catch (error) {
    logger.error('BusinessAgent execution failed', { error: error.message });
    throw error;
  }
}

export default { businessAgentHandler };