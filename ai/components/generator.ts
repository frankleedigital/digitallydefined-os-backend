/**
 * ai/components/generator.ts
 * Atomic AI skill: generate deliverables — roadmaps, brand guidance, content plans.
 *
 * Ported from agents/roadmapAgent.js, agents/hermesBrandBuilder.js.
 * Uses the AI gateway (ai/gateway) for any LLM-backed generation;
 * includes deterministic fallbacks for when providers are unavailable.
 */