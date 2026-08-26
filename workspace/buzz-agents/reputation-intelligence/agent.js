// reputation-intelligence/agent.js
// DigitallyDefined Reputation Intelligence Agent
// Execution Layer: Buzz Agents | Dependencies: OmniRoute

import { generateResponse } from '../lib/omniroute';
import { validateInput } from '../lib/validator';

const SYSTEM_PROMPT = `
You are the Reputation Intelligence Agent for DigitallyDefined. Analyze a user's digital footprint and generate a reputation improvement plan.

Tone: direct, practical, no hype. Faceless by design.

Output must be exactly JSON with no markdown formatting or extra text.
`;

export function reputationIntelligence(inputData) {
  const validation = validateInput({ inputData });
  if (!validation.valid) {
    throw new Error("Validation error: " + validation.error);
  }

  const result = generateResponse(SYSTEM_PROMPT, {
    input: inputData,
    question: "Analyze digital footprint and generate reputation improvement plan"
  });

  const parsed = parseResult(result);
  if (!parsed.valid) {
    throw new Error("Invalid output format: " + parsed.error);
  }

  return parsed.data;
}

function parseResult(text) {
  try {
    const clean = text.replace(/```json\s*/, "").replace(/```/, "").trim();
    const data = JSON.parse(clean);
    return { valid: true, data };
  } catch (e) {
    return { valid: false, error: "Parse error: " + e.message };
  }
}

export default reputationIntelligence;
