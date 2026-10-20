/**
 * src/agents/plannerAgent.ts — Planning Agent.
 *
 * Breaks business goals into step-by-step build sequences, roadmaps, and
 * action plans. Mirrors the existing roadmapAgent pattern but generalized
 * for any OS objective.
 */

import { BaseAgent } from "./baseAgent.js";
import type { AgentTask, AgentCollaborationResult, AgentArtifact } from "../types.js";

const SYSTEM_PROMPT = `You are the Planning Agent for DigitallyDefined OS.
Break a business goal into a prioritized, step-by-step build sequence with
time estimates, tools, and next actions. Return JSON with steps, estimatedTime,
tools, aiTools, and nextAction.`;

interface PlanRequest {
  goal: string;
  businessType?: string;
  constraints?: string[];
}

export class PlannerAgent extends BaseAgent {
  constructor(context: Record<string, unknown>) {
    super({
      name: "Planning Agent",
      systemPrompt: SYSTEM_PROMPT,
      context,
    });
  }

  async run(task: AgentTask): Promise<AgentCollaborationResult> {
    const artifacts: AgentArtifact[] = [];
    const req = this.parseRequest(task.context);

    let plan: {
      steps: string[];
      estimatedTime: string;
      tools: string[];
      aiTools: string[];
      nextAction: string;
    };

    try {
      const llmOutput = await this.callAI(
        `Goal: ${req.goal}\nBusiness type: ${req.businessType ?? "general"}\nConstraints: ${(req.constraints ?? []).join(", ") || "none"}\n\nReturn JSON with steps, estimatedTime, tools, aiTools, nextAction.`,
      );
      let parsed = JSON.parse(llmOutput);
      plan = parsed && parsed.steps && Array.isArray(parsed.steps) ? parsed : this.fallbackPlan(req);
    } catch (err) {
      console.warn(`[plannerAgent] LLM failed, using fallback:`, String(err));
      plan = this.fallbackPlan(req);
    }

    const doc = `# Build Plan: ${req.goal}\n\nEstimated time: ${plan.estimatedTime}\n\n## Steps\n${plan.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n## Tools\n${plan.tools.join(", ")}\n\n## AI Tools\n${plan.aiTools.join(", ")}\n\n## Next Action\n${plan.nextAction}`;
    artifacts.push(this.artifact("document", "Build Plan", doc));

    return {
      taskId: task.id,
      agent: this.name,
      output: plan,
      artifacts,
      nextSteps: ["Execute the first step.", "Track progress in the OS dashboard."],
    };
  }

  private parseRequest(context: Record<string, unknown>): PlanRequest {
    return {
      goal: String(context["goal"] ?? "build a business system"),
      businessType: context["businessType"] ? String(context["businessType"]) : undefined,
      constraints: Array.isArray(context["constraints"]) ? (context["constraints"] as string[]) : [],
    };
  }

  private fallbackPlan(req: PlanRequest) {
    return {
      steps: [
        `Define the scope for: ${req.goal}`,
        "Research the market and competition",
        "Design the system architecture",
        "Build the MVP",
        "Test and iterate",
      ],
      estimatedTime: "4-6 weeks",
      tools: ["Notion", "Cloudflare Workers", "Supabase"],
      aiTools: ["Cloudflare AI"],
      nextAction: `Define the scope for: ${req.goal}`,
    };
  }
}

