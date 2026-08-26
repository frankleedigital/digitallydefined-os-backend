import { generateResponse } from '../lib/omniroute';
import { saveQuizResult } from '../lib/supabase';
import { validateInput } from '../lib/validator';

const SYSTEM_PROMPT = `
You are the Digital Superpower Quiz Agent for DigitallyDefined. Your purpose is to identify a user's digital superpower through a structured personality-based quiz, then recommend their pathway for building faceless digital real estate.

Tone: direct, practical, no hype, no urgency. Speak like a seasoned digital marketer who's seen it all. No gurus. No influencers. Just systems.

Your superpower classification options:
- Builder: You like to create systems, automate processes, and build infrastructure
- Creator: You excel at producing content, writing, and storytelling
- Educator: You enjoy teaching, mentoring, and creating learning systems
- Strategist: You love analyzing markets, finding opportunities, and making data-driven decisions
- Connector: You thrive at building networks, communities, and relationships

Output must be exactly JSON with no markdown formatting or extra text.
`;

export async function quizAgent(userAnswers, metadata = {}) {
  const validation = validateInput({ userAnswers, metadata }, {
    userAnswers: { required: true, type: 'array' },
    metadata: { required: false, type: 'object' }
  });
  
  if (!validation.valid) {
    throw new Error('Validation error: ' + validation.error);
  }

  const result = await generateResponse(SYSTEM_PROMPT, {
    userAnswers,
    metadata,
    question: "Identify the user's digital superpower and recommend pathways based on their quiz answers."
  });

  const parsed = parseQuizResult(result);
  if (!parsed.valid) {
    throw new Error('Invalid output format: ' + parsed.error);
  }

  await saveQuizResult({
    superpowerName: parsed.data.superpowerName,
    superpowerDescription: parsed.data.superpowerDescription,
    recommendedPathways: parsed.data.recommendedPathways,
    confidenceScore: parsed.data.confidenceScore,
    metadata
  });

  return parsed.data;
}

function parseQuizResult(text) {
  try {
    const cleanText = text.replace(/```json\s*/, '').replace(/```/, '').trim();
    const data = JSON.parse(cleanText);
    
    const required = ['superpowerName', 'superpowerDescription', 'recommendedPathways', 'confidenceScore'];
    for (const field of required) {
      if (data[field] === undefined) {
        return { valid: false, error: 'Missing required field: ' + field };
      }
    }
    
    if (data.confidenceScore < 0 || data.confidenceScore > 1) {
      return { valid: false, error: 'confidenceScore must be between 0 and 1' };
    }
    
    if (!Array.isArray(data.recommendedPathways) || data.recommendedPathways.length === 0) {
      return { valid: false, error: 'recommendedPathways must be a non-empty array' };
    }
    
    return { valid: true, data };
  } catch (e) {
    return { valid: false, error: 'Failed to parse JSON: ' + e.message };
  }
}

export default quizAgent;
