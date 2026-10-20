/**
 * src/workflows/index.ts — Workflow exports for DigitallyDefined OS.
 *
 * Long-running, multi-step orchestrations built on Cloudflare Workflows
 * semantics. Each workflow coordinates agents, Notion, and Vectorize to
 * deliver complete business outcomes.
 */

export { runNotionBuilderWorkflow } from "./notionBuilder.js";
export { runProductFactoryWorkflow } from "./productFactory.js";
export { runWorkspaceAuditWorkflow } from "./auditor.js";

export type {
  NotionBuilderInput,
  NotionBuilderOutput,
  ProductFactoryInput,
  ProductFactoryOutput,
  WorkspaceAuditInput,
  WorkspaceAuditOutput,
} from "./types.js";
