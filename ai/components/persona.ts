/**
 * ai/components/persona.ts
 * Atomic AI skill: map quiz answers -> a Digital Superpower persona profile.
 *
 * Ported from agents/digitalSuperpowerAgent.js (persona + scoring logic only).
 * Pure/deterministic — no AI provider call. Generator/roadmap lives in
 * generator.ts; pipelines compose them.
 */

/** A single quiz answer value (persona owning that step). */
export type PersonaKey = "builder" | "creator" | "educator" | "strategist" | "connector";

export interface PersonaProfile {
  persona: string;
  superpowerName: string;
  superpowerDescription: string;
  strengths: string[];
  blindspots: string[];
  businessModel: string;
}

/** Official personas + their static copy. */
export const PERSONA_PROFILES: Record<PersonaKey, PersonaProfile> = {
  builder: {
    persona: "The Builder",
    superpowerName: "Digital Architect",
    superpowerDescription:
      "You turn ideas into infrastructure. Your superpower is building systems, assets, and automation that keep running on autopilot, freeing you to focus on what matters — family, legacy, and real wealth.",
    strengths: [
      "Turns complex workflows into simple, repeatable systems",
      "Tests small and scales what works",
      "Prefers tools and assets over talk and visibility",
    ],
    blindspots: [
      "May over-build before validating demand",
      "Can underestimate the importance of a clear monetization story",
      "Sometimes delays launch in search of a better system",
    ],
    businessModel: "Owner of faceless digital real estate (rank-and-rent, templates, micro-SaaS)",
  },
  creator: {
    persona: "The Creator",
    superpowerName: "Content Alchemist",
    superpowerDescription:
      "You think in story, insight, and audience experience. Your superpower is turning private insights into assets that keep generating value long after you publish them — faceless income without a public persona.",
    strengths: [
      "Turns insight into publishable assets without needing to be on camera",
      "Senses audience emotion and shapes messaging quickly",
      "Builds content that keeps generating value after publication",
    ],
    blindspots: [
      "Private output can feel invisible without a public persona",
      "Distribution may feel like self-promotion",
      "Monetization paths are not always clear for content-first models",
    ],
    businessModel: "Content-driven products with automated delivery pipelines",
  },
  educator: {
    persona: "The Educator",
    superpowerName: "Clarity Catalyst",
    superpowerDescription:
      "You learn deeply and translate complexity into simple, trusted paths for others. Your superpower is packaging hard-won knowledge into evergreen assets that compound over time — building authority without the spotlight.",
    strengths: [
      "Organizes confusing topics into simple, proven paths",
      "Builds trust through clarity and consistency",
      "Creates assets that serve audiences at scale",
    ],
    blindspots: [
      "May wait too long for the perfect curriculum",
      "Can underestimate the value of lightweight, scrappy content",
      "Sometimes struggles with self-promotion",
    ],
    businessModel: "Guides, templates, courses, and teaching systems on autopilot",
  },
  strategist: {
    persona: "The Strategist",
    superpowerName: "Opportunity Scout",
    superpowerDescription:
      "You prioritize outcomes over activity and cut through noise to find what actually works. Your superpower is choosing the right model and killing the rest — preventing wasted effort while others chase trends.",
    strengths: [
      "Chooses the right model and cuts the rest",
      "Prevents wasted effort by aligning assets with outcomes",
      "Makes faster decisions with less noise",
    ],
    blindspots: [
      "May over-plan and under-build",
      "Can delay launch waiting for the perfect model",
      "Sometimes needs a forcing function to commit to one asset",
    ],
    businessModel: "High-leverage planning tools and portfolio-style digital assets",
  },
  connector: {
    persona: "The Connector",
    superpowerName: "Network Weaver",
    superpowerDescription:
      "You see relationships, partnerships, and group dynamics that others miss. Your superpower is matching people, offers, and opportunities to create shared wins — building faceless income through network effects and referral systems.",
    strengths: [
      "Sees relationship opportunities others miss",
      "Creates win-win partnerships that compound",
      "Builds trust quickly through genuine connection",
    ],
    blindspots: [
      "May rely on relationships before building owned assets",
      "Can spread thin across too many people or offers",
      "Sometimes needs a clear monetization path separate from introductions",
    ],
    businessModel: "Community, referrals, and partner-offer ecosystems",
  },
};

/** Default recommended pathways per persona. */
export const PERSONA_PATHWAYS: Record<PersonaKey, string[]> = {
  builder: [
    "Rank-and-rent landing pages in local home services",
    "Template and checklist products for organized professionals",
    "Micro-SaaS wrappers for repetitive tasks",
  ],
  creator: [
    "Private content libraries with automated email delivery",
    "AI-assisted content repurpose pipelines",
    "Quiet hobby communities with faceless product sales",
  ],
  educator: [
    "Workbook and checklist products for niche professionals",
    "Email course sequences built on proven frameworks",
    "Notion template bundles for common workflows",
  ],
  strategist: [
    "Portfolio of small rank-and-rent assets",
    "Decision-framework products for busy professionals",
    "Automated lead-generation funnels with clear ROI tracking",
  ],
  connector: [
    "Referral and partner-introduction systems",
    "Micro-community platforms around shared values",
    "Affiliate and joint-venture ecosystems",
  ],
};
/** Tally how many answers point at each persona. */
export function scoreQuiz(answers: Record<string, unknown>): {
  topResult: PersonaKey;
  confidenceScore: number;
  counts: Record<string, number>;
} {
  const counts: Record<string, number> = {};
  for (const value of Object.values(answers)) {
    if (!value) continue;
    const key = String(value);
    counts[key] = (counts[key] || 0) + 1;
  }

  let topResult: PersonaKey = "builder";
  let topCount = 0;
  for (const [key, count] of Object.entries(counts)) {
    if (count > topCount) {
      topCount = count;
      topResult = key as PersonaKey;
    }
  }

  const total = Object.values(answers).filter((v) => v).length;
  const confidenceScore = total > 0 ? Math.round((topCount / total) * 1000) / 1000 : 0.5;
  return { topResult, confidenceScore, counts };
}

export interface InterpretedQuiz {
  superpowerName: string;
  superpowerDescription: string;
  persona: string;
  strengths: string[];
  blindspots: string[];
  businessModel: string;
  recommendedPathways: string[];
  confidenceScore: number;
  personaCounts: Record<string, number>;
}

/** Interpret raw quiz answers into a typed superpower profile. */
export function interpretQuizAnswers(answers: Record<string, unknown>): InterpretedQuiz {
  const { topResult, confidenceScore, counts } = scoreQuiz(answers);
  const profile = PERSONA_PROFILES[topResult] ?? PERSONA_PROFILES.builder;
  return {
    superpowerName: profile.superpowerName,
    superpowerDescription: profile.superpowerDescription,
    persona: profile.persona,
    strengths: profile.strengths,
    blindspots: profile.blindspots,
    businessModel: profile.businessModel,
    recommendedPathways: PERSONA_PATHWAYS[topResult],
    confidenceScore,
    personaCounts: counts,
  };
}

/** Dict-like profile accepted by the roadmap/generator component. */
export type PersonaProfileInput = InterpretedQuiz & Record<string, unknown>;

export default { PERSONA_PROFILES, PERSONA_PATHWAYS, scoreQuiz, interpretQuizAnswers };