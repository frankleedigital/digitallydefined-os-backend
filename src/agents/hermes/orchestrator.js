// src/agents/hermes/orchestrator.js - Hermes Orchestrator
// Purpose: Receives routes, classifies intent, delegates to specialist agents,
// formats responses, provides fallbacks. Hermes is the AI operating system layer.
//
// Hermes does NOT talk directly to providers.
// Hermes does NOT talk directly to Gemini/OmniRoute/CheapInference.
// Hermes communicates ONLY with specialist agents via executeAgent().
//==============================================================================
import { executeAgent } from '../index.js';
import { classifyIntent } from './classifier.js';
import { getAgent } from '../index.js';

/** Main Hermes entry point.
 * Receives a user message, classifies intent, executes the appropriate
 * specialist agent, and formats the final response.
 *
 * @param {string} message - The user's message/query
 * @param {object} [context={}] - Additional context (job, model, etc.)
 * @returns {Promise<object>} Formatted Hermes response
 */
export async function handleHermesMessage(message, context = {}) {
  // 1. Classify intent into agent type
  const agentName = classifyIntent(message, context);

  // 2. Track execution attempts
  const attemptErrors = [];
  const attempts = [];

  // 3. Execute the classified specialist agent
  try {
    const result = await executeAgent(agentName, { message, context });

    if (!result.error) {
      // Success — attach execution metadata and return
      return {
        ...result,
        attempts,
        attemptErrors,
        classification: agentName,
        executedAt: Date.now(),
      };
    }

    // Agent returned error but no throw — log and continue to fallback
    attemptErrors.push(agentName + ': ' + result.error);
    attempts.push({ name: agentName, error: result.error });
  } catch (error) {
    attemptErrors.push(agentName + ' threw: ' + error.message);
    attempts.push({ name: agentName, error: error.message });
  }

  // 4. If all agents fail — return degraded Hermes response
  // Never 500s: degraded response is the safe path
  return {
    reply:
      'Hermes is not answering right now. Your data is safe - try again in a moment.',
    provider: null,
    model: null,
    degraded: true,
    error: 'All specialist agents failed',
    attemptErrors,
    attempts,
    classification: 'exhausted',
    executedAt: Date.now(),
  };
}

/** Get the Hermes orchestrator config. */
export function getOrchestratorConfig() {
  return {
    name: 'Hermes',
    role: 'orchestrator',
    agentCount: Object.keys(agentRegistry).length,
    availableAgents: Object.keys(agentRegistry).join(', '),
    providerChain: ['omniroute', 'vertex-gemini', 'agentrouter', 'cheap-inference'],
  };
}