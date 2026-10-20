/**
 * src/types.ts — Shared TypeScript types for DigitallyDefined OS Workers.
 *
 * Single source of truth for request/response shapes, agent messages,
 * Notion payloads, and workflow state used across /workers, /api, /agents,
 * /notion, /templates, /workflows, /vectorize.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

/** Minimal authenticated request context extracted from headers/session. */
export interface RequestContext {
  userId: string;
  workspaceId?: string;
  apiKey?: string;
  liveMode: boolean;
  phase21Approval: boolean;
}

/** Standard API envelope. */
export interface ApiResponse<T = Json> {
  ok: boolean;
  data?: T;
  error?: string;
  action?: string;
  requestId: string;
  timestamp: string;
}

/** A natural-language workspace generation request. */
export interface WorkspaceGenerationRequest {
  prompt: string;
  businessType?: string;
  templateId?: string;
  workspaceName?: string;
  liveMode?: boolean;
}

/** Result of building a Notion workspace. */
export interface NotionWorkspaceResult {
  workspaceId: string;
  workspaceName: string;
  databases: NotionDatabaseRef[];
  pages: NotionPageRef[];
  automations: NotionAutomationRef[];
  documentation: string;
  url: string;
}

/** Reference to a created Notion database. */
export interface NotionDatabaseRef {
  key: string;
  databaseId: string;
  name: string;
  url: string;
  propertyCount: number;
}

/** Reference to a created Notion page. */
export interface NotionPageRef {
  pageId: string;
  title: string;
  databaseId?: string;
  url: string;
}

/** Reference to a configured automation. */
export interface NotionAutomationRef {
  name: string;
  type: string;
  status: "configured" | "pending" | "failed";
  detail?: string;
}

/** Notion property definition used when designing database schemas. */
export interface NotionPropertyDef {
  name: string;
  type:
    | "title"
    | "rich_text"
    | "number"
    | "select"
    | "multi_select"
    | "status"
    | "date"
    | "checkbox"
    | "url"
    | "email"
    | "phone_number"
    | "formula"
    | "relation"
    | "rollup";
  required?: boolean;
  options?: string[];
  relation?: { databaseId: string; name: string };
  rollup?: {
    relationPropertyName: string;
    targetPropertyName: string;
    aggregation: "sum" | "count" | "average" | "median" | "min" | "max";
  };
  formula?: { expression: string };
  readOnly?: boolean;
  synonyms?: string[];
}

/** Notion database schema design. */
export interface NotionDatabaseSchema {
  key: string;
  name: string;
  label: string;
  description?: string;
  isSystem?: boolean;
  parent: { type: "workspace" | "page"; pageId?: string };
  properties: NotionPropertyDef[];
  views?: NotionViewDef[];
  dedupKeys?: string[];
}

/** Notion view definition. */
export interface NotionViewDef {
  name: string;
  type: "table" | "board" | "gallery" | "list" | "calendar";
  filter?: Json;
  sort?: Json[];
}

/** Agent task message passed between agents / durable objects. */
export interface AgentTask {
  id: string;
  type:
    | "research"
    | "outline"
    | "write"
    | "design"
    | "publish"
    | "plan"
    | "audit"
    | "build_template"
    | "generate_workspace";
  prompt: string;
  context: Record<string, unknown>;
  status: "pending" | "in_progress" | "completed" | "failed";
  result?: Json;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

/** Agent collaboration result. */
export interface AgentCollaborationResult {
  taskId: string;
  agent: string;
  output: Json;
  artifacts: AgentArtifact[];
  nextSteps: string[];
}

/** An artifact produced by an agent (stored in Notion / Vectorize). */
export interface AgentArtifact {
  kind: "notion_page" | "notion_database" | "document" | "outline" | "checklist" | "metadata";
  title: string;
  content: string;
  notionId?: string;
  vectorId?: string;
}

/** Template definition from the library. */
export interface TemplateDef {
  id: string;
  name: string;
  category: string;
  description: string;
  prompt: string;
  databases: NotionDatabaseSchema[];
  pages: Array<{ title: string; content?: string; databaseKey?: string }>;
  automations: string[];
  starterContent: string[];
  tags: string[];
  seo: { title: string; description: string; tags: string[] };
  createdAt: string;
}

/** Workspace audit finding. */
export interface AuditFinding {
  severity: "info" | "warning" | "critical";
  category: "duplicate" | "missing_relation" | "missing_template" | "optimization" | "dashboard";
  title: string;
  description: string;
  databaseId?: string;
  recommendation: string;
  effort: "low" | "medium" | "high";
}

/** Audit report. */
export interface WorkspaceAuditReport {
  workspaceId: string;
  workspaceName: string;
  scannedAt: string;
  databasesScanned: number;
  findings: AuditFinding[];
  implementationPlan: string[];
  score: number; // 0-100
}

/** Vector search result. */
export interface VectorSearchResult {
  id: string;
  score: number;
  metadata: Json;
  content: string;
}

/** Durable Object state for an agent session. */
export interface AgentSessionState {
  sessionId: string;
  tasks: AgentTask[];
  artifacts: AgentArtifact[];
  createdAt: string;
  updatedAt: string;
}
