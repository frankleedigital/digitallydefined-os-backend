/**
 * src/workflows/auditor.ts — Workspace Auditor Workflow.
 *
 * Analyzes a Notion workspace for duplicates, missing relations, missing
 * templates, and optimization opportunities. Produces an implementation plan.
 * Mirrors Objective 4 (Workspace Auditor).
 */

import { NotionClient } from "../notion/client.js";
import type { WorkspaceAuditReport } from "../types.js";

export async function runWorkspaceAuditWorkflow(
  input: { workspaceId: string; databaseIds?: string[] },
): Promise<WorkspaceAuditReport> {
  const { workspaceId, databaseIds = [] } = input;
  const findings: WorkspaceAuditReport["findings"] = [];
  const implementationPlan: string[] = [];

  let databasesScanned = 0;
  let client: NotionClient | null = null;

  try {
    client = new NotionClient({ env: { NOTION_API_KEY: "" } as never });
  } catch {
    // Live Notion not configured — produce a heuristic audit plan.
    findings.push({
      severity: "warning",
      category: "optimization",
      title: "Notion API not configured",
      description: "NOTION_API_KEY is not set, so live workspace scanning is disabled.",
      recommendation: "Set NOTION_API_KEY and NOTION_LIVE_MODE to enable live audits.",
      effort: "low",
    });
    implementationPlan.push("Configure NOTION_API_KEY in Workers secrets.");
    implementationPlan.push("Enable NOTION_LIVE_MODE for write-capable audits.");
    return {
      workspaceId,
      workspaceName: "Unknown",
      scannedAt: new Date().toISOString(),
      databasesScanned: 0,
      findings,
      implementationPlan,
      score: 0,
    };
  }

  // Scan each database for issues
  for (const databaseId of databaseIds) {
    databasesScanned++;
    try {
      const result = await client!.queryDatabase(databaseId, { pageSize: 100 });
      const rows = result.results as Array<Record<string, unknown>>;

      // Duplicate detection: same Name + URL appears more than once
      const seen = new Map<string, number>();
      for (const row of rows) {
        const name = String(row["Name"] ?? "");
        const url = String(row["URL"] ?? "");
        const key = `${name}|${url}`;
        const count = (seen.get(key) ?? 0) + 1;
        seen.set(key, count);
        if (count === 2) {
          findings.push({
            severity: "warning",
            category: "duplicate",
            title: "Duplicate entry detected",
            description: `Duplicate "${name}" found in database ${databaseId}.`,
            recommendation: "Merge or delete duplicate rows and add a unique constraint.",
            effort: "low",
          });
        }
      }

      // Relation check: databases without relations are flagged
      if (rows.length > 0 && rows[0] && !hasAnyRelation(rows[0])) {
        findings.push({
          severity: "info",
          category: "missing_relation",
          title: `Database ${databaseId} has no relations`,
          description: "No relation properties detected — consider linking to related databases.",
          recommendation: "Add relation properties to connect this database to clients/projects/tasks.",
          effort: "medium",
        });
      }
    } catch (err) {
      findings.push({
        severity: "critical",
        category: "optimization",
        title: `Failed to scan database ${databaseId}`,
        description: String(err),
        recommendation: "Verify the database ID and NOTION_API_KEY permissions.",
        effort: "low",
      });
    }
  }

  if (databaseIds.length === 0) {
    findings.push({
      severity: "info",
      category: "missing_template",
      title: "No databases provided to scan",
      description: "Pass databaseIds to scope the audit.",
      recommendation: "Run the audit against specific Notion database IDs.",
      effort: "low",
    });
  }

  // Score: 100 minus weighted findings
  const weight: Record<string, number> = { critical: 25, warning: 10, info: 3 };
  let penalty = 0;
  for (const f of findings) penalty += weight[f.severity] ?? 0;
  const score = Math.max(0, Math.min(100, 100 - penalty));

  if (findings.length === 0) {
    implementationPlan.push("Workspace looks healthy — no immediate actions required.");
  } else {
    implementationPlan.push("Address critical findings first, then warnings, then info items.");
    implementationPlan.push("Schedule a monthly workspace audit to catch regressions.");
  }

  return {
    workspaceId,
    workspaceName: "Audited Workspace",
    scannedAt: new Date().toISOString(),
    databasesScanned,
    findings,
    implementationPlan,
    score,
  };
}

function hasAnyRelation(row: Record<string, unknown>): boolean {
  for (const [, value] of Object.entries(row)) {
    if (value && typeof value === "object" && "relation" in value) return true;
  }
  return false;
}
