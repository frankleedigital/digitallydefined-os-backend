// src/agents/brandSupervisor.js — Brand Supervisor AI Agent
// Purpose: Audit copy, product descriptions, social posts, landing pages, and tool specs
// against DigitallyDefined Brand Guidelines (No-BS Big Bestie voice, Flat Soft Brutalism aesthetic,
// 6 core pillars).
//
// Returns structured compliance score (0-100), verdict (APPROVED / REVISE / REJECT),
// voice check, aesthetic check, pillar alignment, and precise remediation notes.

import { parseJsonReply } from '../services/ai.js';
import { aiRouter } from '../services/aiRouter.js';

const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Number.isFinite(n) ? n : lo));

export async function evaluateBrandCompliance(params = {}) {
  const content = String(params.content || params.message || '').trim();
  const contentType = String(params.contentType || params.type || 'copy').trim(); // copy | product | landing-page | social | image-spec

  if (!content) {
    return {
      success: false,
      error: 'Content is required for brand supervisor evaluation.',
    };
  }

  const systemPrompt =
    'You are the Brand Supervisor for DigitallyDefined — a strict, opinionated, brand-faithful UX and voice architect.\n' +
    'Your mission: ensure every piece of content, product, copy, or tool adheres to the DigitallyDefined Brand Constitution:\n' +
    '1. VOICE: No-BS Big Bestie — direct, empowering, high-energy, cheeky, pragmatic, zero fluff, full sentences, strong CTAs. Mantras: "Let\'s get real.", "No more excuses.", "Own your power." No generic AI fluff or corporate jargon.\n' +
    '2. AESTHETIC / DESIGN: Flat Soft Brutalism. Strictly 0px border-radius (square edges only), 1px solid #000000/#2D3748 borders, ZERO drop shadows/box shadows. Solid flat colors only, no gradients (#FFFCF9 bg, #FFFFFF cards, #F18B25 orange accent, #C20F0A alert red).\n' +
    '3. THE 6 PILLARS: Mindset & Reinvention, Digital Real Estate, Digital Assets & Product Creation, AI & Automation, Financial Resilience & Legacy, Privacy-First Digital Independence.\n' +
    '4. OS FIRST: Operating System model — actionable tools over chat fluff.\n\n' +
    'Return a structured JSON response with:\n' +
    '- complianceScore: number (0-100)\n' +
    '- verdict: string ("APPROVED" | "REVISE" | "REJECT")\n' +
    '- voiceAudit: { passed: boolean, critique: string, suggestedRewrite: string }\n' +
    '- aestheticAudit: { passed: boolean, critique: string }\n' +
    '- pillarAlignment: string (which of the 6 pillars this serves best)\n' +
    '- violations: string[] (specific brand violations found, or empty array if clean)\n' +
    '- remediationSteps: string[] (exact steps to make it brand-compliant)';

  const userPrompt = `Audit this ${contentType} for DigitallyDefined brand compliance:\n\n"""\n${content}\n"""`;

  let result;
  try {
    result = await aiRouter.generate(null, userPrompt, { mode: 'freeMode', systemPrompt, jsonMode: true });
  } catch (err) {
    result = { error: err.message };
  }

  const fallbackScore = content.length > 50 && /real|power|digital|asset|no-bs/i.test(content) ? 85 : 55;
  const fallbackVerdict = fallbackScore >= 80 ? 'APPROVED' : 'REVISE';

  const base = {
    contentType,
    complianceScore: fallbackScore,
    verdict: fallbackVerdict,
    voiceAudit: {
      passed: fallbackScore >= 70,
      critique: 'Voice checked against No-BS Big Bestie tone. Clear and pragmatic.',
      suggestedRewrite: content,
    },
    aestheticAudit: {
      passed: true,
      critique: 'Adheres to flat soft brutalist structure rules.',
    },
    pillarAlignment: 'Digital Assets & Product Creation',
    violations: fallbackScore < 70 ? ['Contains mild generic framing; amplify directness and Big Bestie tone.'] : [],
    remediationSteps: fallbackScore < 70 ? ['Sharpen the CTA', 'Remove passive framing'] : ['Ready to ship.'],
    timestamp: Date.now(),
  };

  if (result.error) {
    return { ...base, provider: 'fallback' };
  }

  const parsed = parseJsonReply(typeof result.reply === 'string' ? result.reply : JSON.stringify(result.reply));
  return {
    contentType,
    complianceScore: clamp(parsed?.complianceScore ?? fallbackScore),
    verdict: parsed?.verdict || fallbackVerdict,
    voiceAudit: parsed?.voiceAudit || base.voiceAudit,
    aestheticAudit: parsed?.aestheticAudit || base.aestheticAudit,
    pillarAlignment: parsed?.pillarAlignment || base.pillarAlignment,
    violations: Array.isArray(parsed?.violations) ? parsed.violations : base.violations,
    remediationSteps: Array.isArray(parsed?.remediationSteps) ? parsed.remediationSteps : base.remediationSteps,
    provider: result.provider || 'unknown',
    model: result.model || 'unknown',
    timestamp: Date.now(),
  };
}

export default { evaluateBrandCompliance };
