/**
 * src/workflows/types.ts — Shared input/output types for OS workflows.
 */

export interface NotionBuilderInput {
  prompt: string;
  businessType?: string;
  workspaceName?: string;
  liveMode?: boolean;
}

export interface NotionBuilderOutput {
  workspaceId: string;
  workspaceName: string;
  databases: Array<{ key: string; databaseId: string; name: string; url: string }>;
  pages: Array<{ pageId: string; title: string; url: string }>;
  automations: Array<{ name: string; type: string; status: string }>;
  documentation: string;
  url: string;
  deployed: boolean;
}

export interface ProductFactoryInput {
  topic: string;
  productType: string;
  price?: number;
}

export interface ProductFactoryOutput {
  research: unknown;
  outline: unknown;
  content: unknown;
  product: unknown;
  artifacts: Array<{ kind: string; title: string }>;
}

export interface WorkspaceAuditInput {
  workspaceId: string;
  databaseIds?: string[];
}

export interface WorkspaceAuditOutput {
  workspaceId: string;
  workspaceName: string;
  score: number;
  findings: Array<{
    severity: string;
    category: string;
    title: string;
    description: string;
    recommendation: string;
    effort: string;
  }>;
  implementationPlan: string[];
}
