/**
 * src/workflows/notionBuilder.ts — Notion Workspace Builder Workflow.
 *
 * Orchestrates: Planner → Notion Architect (Antigravity) to turn a natural
 * language request into a fully deployed Notion workspace. Mirrors Objective 1
 * (Notion Template Generator) and Objective 2 (Business OS Generator).
 */

import { resolveAgent } from "../agents/index.js";
import type { AgentTask } from "../types.js";
import type {
  NotionBuilderInput,
  NotionBuilderOutput,
} from "./types.js";

function newTask(type: string, prompt: string, context: Record<string, unknown>): AgentTask {
  return {
    id: `task_${Date.now().toString(36)}`,
    type: type as any,
    prompt,
    context,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function runNotionBuilderWorkflow(
  input: NotionBuilderInput,
): Promise<NotionBuilderOutput> {
  const { prompt, businessType, workspaceName, liveMode = false } = input;

  // Step 1: Planner — build the build sequence
  const planner = resolveAgent("planner", { businessType });
  await planner.run(
    newTask("plan", `Plan a Notion workspace for: ${prompt}`, {
      goal: prompt,
      businessType,
    }),
  );

  // Step 2: Notion Architect (Antigravity) — design + deploy
  const architect = resolveAgent("notion_architect", { liveMode, workspaceName });
  const archResult = await architect.run(
    newTask("generate_workspace", prompt, { businessType, workspaceName }),
  );

  const out = archResult.output as Record<string, unknown> | null;
  const workspace = (out?.["workspace"] as Record<string, unknown> | undefined) ?? {};

  const w = workspace as Record<string, unknown>;
  const output: NotionBuilderOutput = {
    workspaceId: String(w["workspaceId"] ?? "workspace"),
    workspaceName: String(w["workspaceName"] ?? workspaceName ?? "Untitled"),
    databases: (Array.isArray(w["databases"]) ? w["databases"] : []) as NotionBuilderOutput["databases"],
    pages: (Array.isArray(w["pages"]) ? w["pages"] : []) as NotionBuilderOutput["pages"],
    automations: (Array.isArray(w["automations"]) ? w["automations"] : []) as NotionBuilderOutput["automations"],
    documentation: String(w["documentation"] ?? ""),
    url: String(w["url"] ?? ""),
    deployed: Boolean((out as Record<string, unknown>)["deployed"]),
  };

  return output;
}

