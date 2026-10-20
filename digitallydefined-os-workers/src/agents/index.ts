/**
 * src/agents/index.ts — Agent registry for DigitallyDefined OS.
 *
 * Registers all available agents and resolves an agent by type. Used by the
 * worker router and Durable Object sessions to dispatch tasks.
 */

import { BaseAgent } from "./baseAgent.js";
import { NotionArchitectAgent } from "./notionArchitect.js";
import { TemplateBuilderAgent } from "./templateBuilder.js";
import { ContentAgent } from "./contentAgent.js";
import { PlannerAgent } from "./plannerAgent.js";
import { ResearcherAgent } from "./researcher.js";
import { ProductPublisherAgent } from "./productPublisher.js";
import type { AgentTask } from "../types.js";

export type AgentType =
  | "notion_architect"
  | "template_builder"
  | "content"
  | "planner"
  | "researcher"
  | "product_publisher";

export interface AgentRegistryEntry {
  type: AgentType;
  label: string;
  description: string;
}

export const AGENT_REGISTRY: AgentRegistryEntry[] = [
  {
    type: "notion_architect",
    label: "Notion Architect (Antigravity)",
    description: "Designs and deploys Notion workspace databases, schemas, and relations.",
  },
  {
    type: "template_builder",
    label: "Template Builder Agent",
    description: "Generates Notion templates from natural-language prompts.",
  },
  {
    type: "content",
    label: "Content Agent",
    description: "Writes social posts, articles, scripts, and launch copy.",
  },
  {
    type: "planner",
    label: "Planning Agent",
    description: "Breaks goals into step-by-step build sequences and roadmaps.",
  },
  {
    type: "researcher",
    label: "Research Agent",
    description: "Researches niches, competitors, and audiences for product ideas.",
  },
  {
    type: "product_publisher",
    label: "Product Publisher Agent",
    description: "Packages and publishes digital products to Notion + marketplace.",
  },
];

const AGENT_CONSTRUCTORS: Record<AgentType, new (context: Record<string, unknown>) => BaseAgent> = {
  notion_architect: NotionArchitectAgent,
  template_builder: TemplateBuilderAgent,
  content: ContentAgent,
  planner: PlannerAgent,
  researcher: ResearcherAgent,
  product_publisher: ProductPublisherAgent,
};

/** Resolve a registered agent instance by type. */
export function resolveAgent(type: AgentType, context: Record<string, unknown>): BaseAgent {
  const Constructor = AGENT_CONSTRUCTORS[type];
  if (!Constructor) {
    throw new Error(`Unknown agent type: ${type}. Available: ${Object.keys(AGENT_CONSTRUCTORS).join(", ")}`);
  }
  return new Constructor(context);
}

/** List all registered agents. */
export function listAgents(): AgentRegistryEntry[] {
  return AGENT_REGISTRY;
}

export type { AgentTask };
export default { resolveAgent, listAgents, AGENT_REGISTRY };
