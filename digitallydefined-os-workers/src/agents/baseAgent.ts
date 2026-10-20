/**
 * src/agents/baseAgent.ts — Base class for all DigitallyDefined OS agents.
 *
 * Agents receive a task, run reasoning (LLM via Cloudflare AI or deterministic
 * fallback), emit artifacts, and report status. Designed to run inside Durable
 * Objects for stateful, long-running multi-step collaboration.
 */

import type {
  AgentTask,
  AgentArtifact,
  AgentCollaborationResult,
} from "../types.js";

export interface AgentOptions {
  name: string;
  systemPrompt: string;
  context?: Record<string, unknown>;
}

export abstract class BaseAgent {
  readonly name: string;
  readonly systemPrompt: string;
  protected readonly context: Record<string, unknown>;

  constructor(options: AgentOptions) {
    this.name = options.name;
    this.systemPrompt = options.systemPrompt;
    this.context = options.context ?? {};
  }

  /**
   * Run the agent against a task. Subclasses implement the core reasoning.
   * Returns artifacts plus a next-steps hint for downstream agents.
   */
  abstract run(task: AgentTask): Promise<AgentCollaborationResult>;

  /**
   * Call Cloudflare Workers AI (text generation). Falls back to a deterministic
   * stub when the AI binding is unavailable so agents stay functional offline.
   */
  protected async callAI(prompt: string): Promise<string> {
    const ai = (globalThis as unknown as { AI?: { run: (model: string, inputs: unknown) => Promise<unknown> } }).AI;
    if (!ai) {
      return JSON.stringify({
        fallback: true,
        agent: this.name,
        message: "AI binding unavailable — deterministic stub used.",
        promptEcho: prompt.slice(0, 200),
      });
    }

    const response = await ai.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        { role: "system", content: this.systemPrompt },
        { role: "user", content: prompt },
      ],
    });

    if (response && typeof response === "object" && "response" in response) {
      return String((response as { response: string }).response);
    }
    return String(response ?? "");
  }

  /** Emit a single artifact. */
  protected artifact(
    kind: AgentArtifact["kind"],
    title: string,
    content: string,
    notionId?: string,
  ): AgentArtifact {
    return { kind, title, content, notionId };
  }
}
