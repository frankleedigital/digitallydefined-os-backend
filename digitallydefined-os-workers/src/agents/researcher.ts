/**
 * src/agents/researcher.ts — Research Agent.
 *
 * Researches niches, competitors, audiences, and trends for product ideas.
 * Outputs research briefs that feed the outline → writer → design pipeline.
 */

import { BaseAgent } from "./baseAgent.js";
import type { AgentTask, AgentCollaborationResult, AgentArtifact } from "../types.js";

const SYSTEM_PROMPT = `You are the Research Agent for DigitallyDefined OS.
Research niches, competitors, audiences, and trends. Return a structured
research brief with niche viability, competitor gaps, audience insights, and
opportunity areas.`;

interface ResearchRequest {
  topic: string;
  niche?: string;
  depth?: "quick" | "deep";
}

export class ResearcherAgent extends BaseAgent {
  constructor(context: Record<string, unknown>) {
    super({
      name: "Research Agent",
      systemPrompt: SYSTEM_PROMPT,
      context,
    });
  }

  async run(task: AgentTask): Promise<AgentCollaborationResult> {
    const artifacts: AgentArtifact[] = [];
    const req = this.parseRequest(task.context);

    let brief: {
      topic: string;
      niche: string;
      viability: string;
      competitors: string[];
      audience: string[];
      opportunities: string[];
      recommendations: string[];
    };

    try {
      const llmOutput = await this.callAI(
        `Research topic: ${req.topic}\nNiche: ${req.niche ?? "general"}\nDepth: ${req.depth}\n\nReturn JSON with topic, niche, viability, competitors[], audience[], opportunities[], recommendations[].`,
      );
      let parsed = JSON.parse(llmOutput);
      let validated = parsed && typeof parsed === "object" && "topic" in parsed && "niche" in parsed && Array.isArray(parsed["competitors"] || []);
      brief = validated ? (parsed as typeof brief) : this.fallbackBrief(req);
    } catch (err) {
      console.warn(`[researcherAgent] LLM failed, using fallback:`, String(err));
      brief = this.fallbackBrief(req);
    }

    const doc = `# Research Brief: ${req.topic}\n\n## Niche: ${brief.niche}\n## Viability: ${brief.viability}\n\n## Competitors\n${brief.competitors.map((c) => `- ${c}`).join("\n")}\n\n## Audience\n${brief.audience.map((a) => `- ${a}`).join("\n")}\n\n## Opportunities\n${brief.opportunities.map((o) => `- ${o}`).join("\n")}\n\n## Recommendations\n${brief.recommendations.map((r) => `- ${r}`).join("\n")}`;
    artifacts.push(this.artifact("document", `Research Brief — ${req.topic}`, doc));

    return {
      taskId: task.id,
      agent: this.name,
      output: brief,
      artifacts,
      nextSteps: ["Pass brief to Outline Agent.", "Use opportunities to shape product."],
    };
  }

  private parseRequest(context: Record<string, unknown>): ResearchRequest {
    return {
      topic: String(context["topic"] ?? "digital marketing"),
      niche: context["niche"] ? String(context["niche"]) : undefined,
      depth: (context["depth"] === "deep" ? "deep" : "quick"),
    };
  }

  private fallbackBrief(req: ResearchRequest) {
    return {
      topic: req.topic,
      niche: req.niche ?? "general",
      viability: "medium",
      competitors: ["Competitor A", "Competitor B"],
      audience: ["Faceless digital marketers", "Small business owners"],
      opportunities: ["Underserved sub-niche", "Low-competition keyword"],
      recommendations: ["Start with a lead magnet", "Validate with a landing page"],
    };
  }
}

