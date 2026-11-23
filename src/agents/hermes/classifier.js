// src/agents/hermes/classifier.js - Hermes Intent Classifier
// Purpose: Classify a user message into the appropriate specialist agent type.
// Uses keyword patterns aligned with the 3 business properties:
//
//   FrancescaLavigne.com    → mindset/healing/spirituality topics
//   DigitallyDefined.store  → digital products, AI income, faceless marketing
//   DigitallyDefined.agency → SEO, lead gen, reputation, client acquisition
//
// IMPORTANT: Do NOT create separate agents for tasks (social posts, emails,
// roadmaps, captions, hashtags). These are tasks, not business functions.
//
// Agents represent BUSINESS FUNCTIONS only.
//
/** Classify a user message into an agent type.
 * @param {string} message - The user's message/query
 * @param {object} [context={}] - Additional context (job, model, etc.)
 * @returns {string} Agent name key
 */
export function classifyIntent(message, context = {}) {
  const lower = (message || '').toLowerCase();

  // ---- BusinessAgent: Agency strategy, SEO, lead gen, service offers ----
  if (
    /(\b(strategy|growth|client|reputation|seo|lead).*)/i.test(lower) ||
    /(\bagenc(y|e|s)\b|\bconsult(ing|ation)\b)/i.test(lower) ||
    /(\boffers?\b|\bservices?\b|\bpricing\b|\bproposal)/i.test(lower)
  ) {
    return 'businessAgent';
  }

  // ---- ContentAgent: Blog posts, email content, lead magnets, social posts ----
  if (
    /(\bblog\b|\bemail\b|\bnewsletter\b|\bsocial\b|\bpost\b|\bsales?\b|\bseo\b)/i.test(lower) ||
    /(\blanding?\bpage?|\bsales?\b|\blanding?\b)/i.test(lower)
  ) {
    return 'contentAgent';
  }

  // ---- GrowthAgent: Keyword clustering, topical authority, SEO strategy ----
  if (
    /(\bkeyword\b|\bseo\b|\btraffic?\b|\brank?\b|\bauthorit\b|\bclustering)/i.test(lower) ||
    /(\btopical?\b|\bmap?|opportunit?)/i.test(lower)
  ) {
    return 'growthAgent';
  }

  // ---- ProductAgent: Product creation, Gumroad strategy, product launches ----
  if (/(\bproduct?\b|\b(gum)?road?\b|\bprice?\b|\bbundle?\b|\blaunch?\b|\baffiliate)/i.test(lower)) {
    return 'productAgent';
  }

  // Default → businessAgent (strategic catch-all)
  return 'businessAgent';
}