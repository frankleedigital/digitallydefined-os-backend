// src/services/socialContentEngine.js
// Autonomous Social Media Content Engine for DigitallyDefined
// Generates fresh, high-converting social posts using Gemini 3.5 Flash and dispatches them 3x daily.

import { callVertexGemini } from './aiRouter.js';
import { publishToMetaChannels } from './metaPublisher.js';
import { publishToMake } from './makePublisher.js';

const POST_THEMES = [
  {
    slot: 'morning',
    focus: 'Mindset & Reality Check (Digital Superpower Quiz)',
    promptInstruction: 'Write a bold, punchy, high-energy post about why Gen X women should stop getting overwhelmed by "guru" online advice and focus on their natural strengths. Hook the reader immediately with "Let\'s get real." Strong CTA: Take the free Digital Superpower Quiz to find your exact digital asset roadmap.',
    link: 'https://digitallydefined.store/quiz',
    cta: 'Take the free Digital Superpower Quiz right now to uncover your roadmap:',
    hashtags: ['#GenXWomen', '#DigitalSuperpower', '#DigitallyDefined', '#OwnYourPower', '#SystemsOverScrolling']
  },
  {
    slot: 'midday',
    focus: 'Financial Clarity & The Math (Freedom Number Calculator)',
    promptInstruction: 'Write a pragmatic, clear, no-fluff post breaking down why most people never leave their 9-to-5 because they do not know their exact "Freedom Number". Explain the difference between vague revenue goals and actual monthly freedom math. Strong CTA: Run your numbers through the Financial Freedom Calculator.',
    link: 'https://digitallydefined.store/financial-hub',
    cta: 'Calculate your exact monthly Freedom Number in under 3 minutes:',
    hashtags: ['#FreedomNumber', '#FinancialClarity', '#GenXMoney', '#DigitalAssets', '#DigitallyDefined']
  },
  {
    slot: 'evening',
    focus: 'Execution & Asset Building (Automated Asset Engine)',
    promptInstruction: 'Write an empowering, direct post about moving from "learning" to "building". Emphasize why 2026 is the year of faceless digital income assets and automated systems rather than constant social media hustling. Hook with "No more excuses. Own your power." Strong CTA: Explore the Automated Asset Engine.',
    link: 'https://digitallydefined.store/store',
    cta: 'Start building your automated digital asset ecosystem today:',
    hashtags: ['#AutomatedAssetEngine', '#FacelessBusiness', '#DigitalRealEstate', '#GenXEntrepreneurs', '#DigitallyDefined']
  }
];

/**
 * Generate a brand-compliant social post using Gemini
 * @param {string} [timeOfDay] - 'morning' | 'midday' | 'evening' or random if omitted
 */
export async function generateSocialPost(timeOfDay) {
  const currentHour = new Date().getUTCHours();
  let theme;

  if (timeOfDay) {
    theme = POST_THEMES.find(t => t.slot === timeOfDay) || POST_THEMES[0];
  } else if (currentHour >= 12 && currentHour < 17) {
    // 12:00 - 17:00 UTC (~8am - 1pm EST) -> morning slot
    theme = POST_THEMES[0];
  } else if (currentHour >= 17 && currentHour < 22) {
    // 17:00 - 22:00 UTC (~1pm - 6pm EST) -> midday slot
    theme = POST_THEMES[1];
  } else {
    // Evening / Night slot
    theme = POST_THEMES[2];
  }

  const systemPrompt = `You are the DigitallyDefined Lead Brand Voice.
VOICE GUIDELINES:
- No-BS Big Bestie: Direct, empowering, high-energy, cheeky, pragmatic, zero fluff, full sentences, strong CTAs.
- Core mantras: "Let's get real.", "No more excuses.", "Own your power."
- Target Audience: Gen X Women (ages 40-60) building privacy-first digital income assets.
- NEVER use bro-marketing, get-rich-quick hype, fake passive income promises, "hey girl", or spammy emojis (use at most 1-2 clean emojis).
- Keep total copy under 150 words. Punchy, readable, spaced with line breaks.

OUTPUT FORMAT:
Return ONLY the post text (without hashtags or URL at the bottom, as those are appended automatically).`;

  const userPrompt = `Focus: ${theme.focus}\nInstruction: ${theme.promptInstruction}\nWrite the post copy now:`;
  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

  const geminiResponse = await callVertexGemini(
    'gemini-3.5-flash-lite',
    fullPrompt,
    { temperature: 0.7, max_tokens: 300 }
  );

  const rawCopy = geminiResponse?.content || geminiResponse?.reply || geminiResponse?.text || '';
  const cleanCopy = rawCopy.replace(/^["']|["']$/g, '').trim();

  return {
    slot: theme.slot,
    focus: theme.focus,
    content: cleanCopy,
    link: theme.link,
    callToAction: theme.cta,
    hashtags: theme.hashtags
  };
}

/**
 * Generate and automatically publish a scheduled post across Meta & Make
 */
export async function runAutoPost(timeOfDay) {
  const post = await generateSocialPost(timeOfDay);

  const results = {
    generatedPost: post,
    metaDirect: null,
    makeWebhook: null,
    timestamp: new Date().toISOString()
  };

  // 1. Direct Meta Publishing (Facebook Page)
  try {
    results.metaDirect = await publishToMetaChannels({
      content: post.content,
      link: post.link,
      callToAction: post.callToAction,
      hashtags: post.hashtags,
      platforms: ['facebook']
    });
  } catch (err) {
    results.metaDirect = { success: false, error: err.message };
  }

  // 2. Make.com Webhook (for Multi-channel scenarios & logs)
  try {
    results.makeWebhook = await publishToMake({
      content: post.content,
      link: post.link,
      callToAction: post.callToAction,
      hashtags: post.hashtags,
      platforms: ['facebook', 'instagram', 'threads'],
      metadata: {
        slot: post.slot,
        focus: post.focus
      }
    });
  } catch (err) {
    results.makeWebhook = { success: false, error: err.message };
  }

  return results;
}

export default {
  POST_THEMES,
  generateSocialPost,
  runAutoPost
};
