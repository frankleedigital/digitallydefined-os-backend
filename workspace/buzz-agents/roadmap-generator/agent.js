// roadmap-generator/agent.js
// DigitallyDefined Roadmap Generator Agent
// Execution Layer: Buzz Agents | Dependencies: OmniRoute, Supabase

import { generateResponse } from '../lib/omniroute';
import { saveData } from '../lib/supabase';
import { validateInput } from '../lib/validator';

const SYSTEM_PROMPT = `
You are the Roadmap Generator Agent for DigitallyDefined. Generate a personalized digital roadmap based on the user's superpower.

Tone: direct, practical, no hype. Faceless by design.

Output must be exactly JSON with no markdown formatting or extra text.
`;

export function roadmapGenerator(inputData) {
  const validation = validateInput({ inputData });
  if (!validation.valid) {
    throw new Error("Validation error: " + validation.error);
  }

  const result = generateResponse(SYSTEM_PROMPT, {
    input: inputData,
    question: "Generate personalized digital roadmap based on superpower"
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

export default roadmapGenerator;
