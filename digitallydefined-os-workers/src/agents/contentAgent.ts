/**
 * src/agents/contentAgent.ts — Content Agent.
 *
 * Writes social posts, articles, scripts, email copy, and launch content from
 * briefs. Outputs are stored as artifacts (ready to be saved to the Content
 * Blocks DB in Notion).
 */

import { BaseAgent } from "./baseAgent.js";
import type { AgentTask, AgentCollaborationResult, AgentArtifact } from "../types.js";

const SYSTEM_PROMPT = `You are the Content Agent for DigitallyDefined OS.
Write high-converting, faceless digital marketing content: social posts,
articles, video scripts, email sequences, and launch copy. Match the requested
tone and platform. Return the content plus a short brief summary.`;

interface ContentBrief {
  platform: string;
  contentType: string;
  topic: string;
  tone: string;
  goal: string;
  targetAudience?: string;
}

export class ContentAgent extends BaseAgent {
  constructor(context: Record<string, unknown>) {
    super({
      name: "Content Agent",
      systemPrompt: SYSTEM_PROMPT,
      context,
    });
  }

  async run(task: AgentTask): Promise<AgentCollaborationResult> {
    const artifacts: AgentArtifact[] = [];
    const brief = this.parseBrief(task.context);
    const prompt = this.buildPrompt(brief);

    let content: string;
    try {
      content = await this.callAI(prompt);
    } catch (err) {
      console.warn(`[contentAgent] LLM failed, using fallback:`, String(err));
      content = this.fallbackContent(brief);
    }

    const title = `${brief.contentType} — ${brief.topic} (${brief.platform})`;
    artifacts.push(this.artifact("document", title, content));

    return {
      taskId: task.id,
      agent: this.name,
      output: { content, platform: brief.platform, type: brief.contentType },
      artifacts,
      nextSteps: ["Save to the Content Blocks DB in Notion.", "Schedule or publish."],
    };
  }

  private parseBrief(context: Record<string, unknown>): ContentBrief {
    return {
      platform: String(context["platform"] ?? "LinkedIn"),
      contentType: String(context["contentType"] ?? "Social Post"),
      topic: String(context["topic"] ?? "digital marketing"),
      tone: String(context["tone"] ?? "professional"),
      goal: String(context["goal"] ?? "engagement"),
      targetAudience: context["targetAudience"] ? String(context["targetAudience"]) : undefined,
    };
  }

  private buildPrompt(b: ContentBrief): string {
    return `Write a ${b.contentType} for ${b.platform}.\nTopic: ${b.topic}\nTone: ${b.tone}\nGoal: ${b.goal}\n${b.targetAudience ? `Target audience: ${b.targetAudience}` : ""}\n\nReturn only the content, ready to publish.`;
  }

  private fallbackContent(b: ContentBrief): string {
    return `[${b.platform}] ${b.contentType} about ${b.topic}\n\nThis is fallback content generated because the AI binding was unavailable. Replace with AI-generated copy.\n\nGoal: ${b.goal}\nTone: ${b.tone}`;
  }
}


