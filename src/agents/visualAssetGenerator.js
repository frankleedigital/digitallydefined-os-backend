// src/agents/visualAssetGenerator.js — Visual Asset & SVG Generator AI Agent
// Purpose: Generates production-ready SVG cover graphics, badges, banner specs,
// and social visual cards strictly adhering to DigitallyDefined Flat Soft Brutalism standards.
// (0px border-radius, 1px solid #111111 borders, #FFFCF9 bg, #FFFFFF cards, #F18B25 orange accent).

import { parseJsonReply } from '../services/ai.js';
import { aiRouter } from '../services/aiRouter.js';

export async function generateVisualAsset(params = {}) {
  const title = String(params.title || params.assetTitle || 'DIGITAL ASSET EMPIRE').trim();
  const subtitle = String(params.subtitle || params.tagline || 'NO MORE EXCUSES. OWN YOUR POWER.').trim();
  const assetType = String(params.assetType || params.type || 'product-cover').trim(); // product-cover | badge | social-card | banner

  const systemPrompt =
    'You are the Visual Asset & SVG Generator for DigitallyDefined.\n' +
    'Your mission: generate clean, production-ready SVG code and visual design specifications for digital product covers, social cards, badges, and banners.\n' +
    'STRICT AESTHETIC — FLAT SOFT BRUTALISM:\n' +
    '- Strictly 0px border-radius (square edges only).\n' +
    '- 1px solid #111111 borders on cards and containers.\n' +
    '- ZERO drop shadows or blur filters (flat solid geometry).\n' +
    '- Colors: Background #FFFCF9, Cards #FFFFFF, Primary Text #111111, Accent Orange #F18B25, Accent Aqua #47B7D4, Alert Red #C20F0A.\n' +
    '- Typography: Inter Bold uppercase for titles, DM Sans for body text.\n\n' +
    'Return a structured JSON response with:\n' +
    '- assetType: string\n' +
    '- svgCode: string (Complete, valid self-contained <svg>...</svg> markup with inline brutalist styling)\n' +
    '- designSpecs: { background: string, cardColor: string, primaryColor: string, accentColor: string, fontFamily: string }\n' +
    '- exportInstructions: string[]';

  const userPrompt = `Generate a Flat Soft Brutalism ${assetType} with Title: "${title}" and Subtitle/Tagline: "${subtitle}". Output valid SVG markup and specs.`;

  let result;
  try {
    result = await aiRouter.generate(null, userPrompt, { mode: 'freeMode', systemPrompt, jsonMode: true });
  } catch (err) {
    result = { error: err.message };
  }

  // Fallback deterministic SVG generator
  const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <rect width="800" height="500" fill="#FFFCF9" />
  <rect x="40" y="40" width="720" height="420" fill="#FFFFFF" stroke="#111111" stroke-width="2" />
  <rect x="40" y="40" width="720" height="70" fill="#111111" />
  <text x="65" y="85" fill="#2A9D5C" font-family="Inter, sans-serif" font-weight="800" font-size="14" letter-spacing="2">DIGITALLYDEFINED OS</text>
  <rect x="65" y="150" width="120" height="28" fill="#F18B25" stroke="#111111" stroke-width="1" />
  <text x="75" y="169" fill="#111111" font-family="Inter, sans-serif" font-weight="800" font-size="11">VERIFIED ASSET</text>
  <text x="65" y="240" fill="#111111" font-family="Inter, sans-serif" font-weight="800" font-size="32" letter-spacing="-0.5">${escapeXml(title)}</text>
  <text x="65" y="290" fill="#5F5F5F" font-family="DM Sans, sans-serif" font-weight="600" font-size="16">${escapeXml(subtitle)}</text>
  <line x1="65" y1="360" x2="735" y2="360" stroke="#111111" stroke-width="1" />
  <text x="65" y="410" fill="#111111" font-family="Inter, sans-serif" font-weight="800" font-size="13">NO-BS BIG BESTIE EDITION</text>
  <rect x="610" y="390" width="125" height="40" fill="#F18B25" stroke="#111111" stroke-width="1" />
  <text x="630" y="415" fill="#111111" font-family="Inter, sans-serif" font-weight="800" font-size="12">CLAIM ASSET</text>
</svg>`;

  const base = {
    assetType,
    svgCode: fallbackSvg,
    designSpecs: {
      background: '#FFFCF9',
      cardColor: '#FFFFFF',
      primaryColor: '#111111',
      accentColor: '#F18B25',
      fontFamily: 'Inter / DM Sans',
    },
    exportInstructions: [
      'Copy the SVG code and save as an .svg file',
      'Open in Illustrator, Figma, or browser to render',
      'Zero border-radius and 1px solid black frames applied per brand rules',
    ],
    timestamp: Date.now(),
  };

  if (result.error) {
    return { ...base, provider: 'fallback-svg-generator' };
  }

  const parsed = parseJsonReply(typeof result.reply === 'string' ? result.reply : JSON.stringify(result.reply));
  return {
    assetType,
    svgCode: parsed?.svgCode || fallbackSvg,
    designSpecs: parsed?.designSpecs || base.designSpecs,
    exportInstructions: Array.isArray(parsed?.exportInstructions) ? parsed.exportInstructions : base.exportInstructions,
    provider: result.provider || 'unknown',
    model: result.model || 'unknown',
    timestamp: Date.now(),
  };
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default { generateVisualAsset };
