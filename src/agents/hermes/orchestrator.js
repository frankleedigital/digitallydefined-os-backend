// src/agents/hermes/orchestrator.js - Hermes Supervisory Orchestrator
// Receives routes, delegates to HermesSupervisor which reads context,
// selects agents by capability+telemetry, evaluates outputs, records decisions.
import { hermesSupervisor } from './supervisor.js';
import { agentRegistry } from '../index.js';

/** Main Hermes entry point.
 * @param {string} message - The user's message/query
 * @param {object} [context={}] - Additional context (job, model, etc.)
 * @returns {Promise<object>} Formatted Hermes response
 */
export async function handleHermesMessage(message, context = {}) {
  return hermesSupervisor.decide(message, context);
}

/** Get the Hermes orchestrator config. */
export function getOrchestratorConfig() {
  return {
    name: 'Hermes',
    role: 'supervisory-orchestrator',
    agentCount: Object.keys(agentRegistry).length,
    availableAgents: Object.keys(agentRegistry).join(','),
    providerChain: ['omniroute', 'vertex-gemini', 'agentrouter', 'cheap-inference'],
  };
}
