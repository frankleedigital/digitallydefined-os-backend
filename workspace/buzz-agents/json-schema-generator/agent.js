// json-schema-generator/agent.js
// DigitallyDefined JSON Schema Generator Agent
// Execution Layer: Buzz Agents | Dependencies: OmniRoute

import { generateResponse } from '../lib/omniroute';
import { validateInput } from '../lib/validator';

const SYSTEM_PROMPT = `
You are the JSON Schema Generator Agent for DigitallyDefined. Generate clean, validated JSON schemas.

Tone: direct, practical, no hype. Faceless by design.

Output must be exactly JSON with no markdown formatting or extra text.
`;

export function jsonSchemaGenerator(inputData) {
  const validation = validateInput({ inputData });
  if (!validation.valid) {
    throw new Error("Validation error: " + validation.error);
  }

  const result = generateResponse(SYSTEM_PROMPT, {
    input: inputData,
    question: "Generate clean validated JSON schema"
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

export default jsonSchemaGenerator;
