// facebook-community-agent/agent.js
// DigitallyDefined Facebook Community Agent
// Execution Layer: Buzz Agents | Dependencies: OmniRoute, Supabase, AntiGravity

import { generateResponse } from '../lib/omniroute';
import { saveData } from '../lib/supabase';
import { triggerWorkflow } from '../lib/anti-gravity';
import { validateInput } from '../lib/validator';

const SYSTEM_PROMPT = `
You are the Facebook Community Agent for DigitallyDefined. Monitor, analyze, and generate insights for the DigitallyDefined Facebook Community.

Support engagement, identify member needs, and produce actionable recommendations for Gen X women.

Tone: practical, no hype, faceless-by-design. Supportive but direct. Focus on community health and actionable insights.

Output must be exactly JSON with no markdown formatting or extra text.
`;

export function facebookCommunityAgent(inputData) {
  const validation = validateInput({ inputData }, {
    communityPosts: { required: true, type: 'array' },
    timeRange: { required: false, type: 'string' },
    engagementMetrics: { required: false, type: 'object' },
    memberQuestions: { required: false, type: 'array' },
    moderationFlags: { required: false, type: 'array' }
  });
  
  if (!validation.valid) {
    throw new Error("Validation error: " + validation.error);
  }

  const result = generateResponse(SYSTEM_PROMPT, {
    input: inputData,
    question: "Analyze Facebook community content and generate engagement insights and recommendations"
  });

  const parsed = parseResult(result);
  if (!parsed.valid) {
    throw new Error("Invalid output format: " + parsed.error);
  }

  // Save insights to Supabase
  saveData(parsed.data);

  // Trigger AntiGravity workflows for weekly digests and risk alerts
  if (parsed.data.riskAlerts && parsed.data.riskAlerts.length > 0) {
    triggerWorkflow('community-risk-alert', {
      alerts: parsed.data.riskAlerts,
      severity: parsed.data.riskAlerts.length > 5 ? 'high' : 'medium'
    });
  }

  if (parsed.data.summaryDigest) {
    triggerWorkflow('weekly-community-digest', {
      summary: parsed.data.summaryDigest,
      trendingTopics: parsed.data.trendingTopics
    });
  }

  return parsed.data;
}

function parseResult(text) {
  try {
    const clean = text.replace(/```json\s*/, "").replace(/```/, "").trim();
    const data = JSON.parse(clean);

    // Validate required output fields
    const required = ['trendingTopics', 'memberNeeds', 'contentRecommendations', 'communityHealthScore', 'riskAlerts', 'summaryDigest'];
    for (const field of required) {
      if (data[field] === undefined) {
        return { valid: false, error: "Missing required field: " + field };
      }
    }

    // Validate communityHealthScore is 0-100
    if (data.communityHealthScore < 0 || data.communityHealthScore > 100) {
      return { valid: false, error: "communityHealthScore must be between 0 and 100" };
    }

    return { valid: true, data };
  } catch (e) {
    return { valid: false, error: "Parse error: " + e.message };
  }
}

export default facebookCommunityAgent;
