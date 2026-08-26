// digital-wealth-calculator/agent.js
// DigitallyDefined Digital Wealth Calculator Agent
// Execution Layer: Buzz Agents | Dependencies: OmniRoute, Supabase

import { generateResponse } from '../lib/omniroute';
import { saveData } from '../lib/supabase';
import { validateInput } from '../lib/validator';

const SYSTEM_PROMPT = `
You are the Digital Wealth Calculator Agent for DigitallyDefined. Calculate digital asset revenue potential based on user inputs.

Tone: direct, practical, no hype. Faceless by design.

Output must be exactly JSON with no markdown formatting or extra text.
`;

export function digitalWealthCalculator(inputData) {
  const validation = validateInput({ inputData });
  if (!validation.valid) {
    throw new Error("Validation error: " + validation.error);
  }

  const result = generateResponse(SYSTEM_PROMPT, {
    input: inputData,
    question: "Calculate digital asset revenue potential"
  });

  const parsed = parseResult(result);
  if (!parsed.valid) {
    throw new Error("Invalid output format: " + parsed.error);
  }

  saveData(parsed.data);

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

export default digitalWealthCalculator;
