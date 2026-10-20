/**
 * src/agents/templateBuilder.ts — Template Builder Agent.
 *
 * Generates Notion database templates and page templates from natural-language
 * prompts. Produces schema definitions, starter pages, views, and documentation
 * that can be stored in the Templates Library and deployed on demand.
 */

import { BaseAgent } from "./baseAgent.js";
import type { AgentTask, AgentCollaborationResult, AgentArtifact, TemplateDef, Json, NotionPropertyDef } from "../types.js";

const SYSTEM_PROMPT = `You are the Template Builder Agent for DigitallyDefined OS.
Given a natural-language template request, design a Notion template package:
database schema, properties, views, starter pages, and documentation. Return
a structured template definition as JSON.`;

export class TemplateBuilderAgent extends BaseAgent {
  constructor(context: Record<string, unknown>) {
    super({
      name: "Template Builder Agent",
      systemPrompt: SYSTEM_PROMPT,
      context,
    });
  }

  async run(task: AgentTask): Promise<AgentCollaborationResult> {
    const artifacts: AgentArtifact[] = [];
    const { prompt } = task;

    let template: TemplateDef;
    try {
      const llmOutput = await this.callAI(
        `Template request: ${prompt}\n\nReturn JSON with: name, category, description, databases[{key,name,properties[{name,type,options?}]}], pages[{title,content}], tags[], starterContent[].`,
      );
      template = this.normalizeTemplate(JSON.parse(llmOutput), prompt);
    } catch (err) {
      console.warn(`[templateBuilder] LLM failed, using fallback:`, String(err));
      template = this.fallbackTemplate(prompt);
    }

    const doc = this.renderTemplateDoc(template);
    artifacts.push(
      this.artifact("document", `${template.name} — Template Specification`, doc),
    );
    artifacts.push(
      this.artifact("document", template.name, JSON.stringify(template, null, 2)),
    );

    return {
      taskId: task.id,
      agent: this.name,
      output: { template: template as unknown as Json, stored: false } as unknown as Json,
      artifacts,
      nextSteps: ["Save template to the Templates Library DB.", "Deploy template into a customer workspace."],
    };
  }

  private normalizeTemplate(raw: unknown, prompt: string): TemplateDef {
    const t = raw as Record<string, unknown>;
    return {
      id: `tpl_${Date.now().toString(36)}`,
      name: String(t["name"] ?? "Untitled Template"),
      category: String(t["category"] ?? "General"),
      description: String(t["description"] ?? ""),
      prompt,
      databases: (t["databases"] as Array<Record<string, unknown>> ?? []).map((d) => ({
        key: String(d["key"] ?? "templates"),
        name: String(d["name"] ?? "Database"),
        label: String(d["name"] ?? "Database"),
        description: String(d["description"] ?? ""),
        isSystem: false,
        parent: { type: "workspace" },
        properties: (d["properties"] as Array<Record<string, unknown>> ?? []).map((p) => ({
          name: String(p["name"] ?? "Name"),
          type: String(p["type"] ?? "rich_text") as NotionPropertyDef["type"],
          required: Boolean(p["required"]),
          options: Array.isArray(p["options"]) ? (p["options"] as string[]) : [],
        })),
      })),
      pages: (t["pages"] as Array<Record<string, unknown>> ?? []).map((p) => ({
        title: String(p["title"] ?? "Untitled Page"),
        content: String(p["content"] ?? ""),
      })),
      automations: [],
      starterContent: (t["starterContent"] as Array<Record<string, unknown>> ?? []).map((c) =>
        String(c["content"] ?? c["title"] ?? ""),
      ),
      tags: Array.isArray(t["tags"]) ? (t["tags"] as string[]) : [],
      seo: {
        title: String(t["name"] ?? "Untitled Template"),
        description: String(t["description"] ?? ""),
        tags: Array.isArray(t["tags"]) ? (t["tags"] as string[]) : [],
      },
      createdAt: new Date().toISOString(),
    };
  }

  private fallbackTemplate(prompt: string): TemplateDef {
    return this.normalizeTemplate(
      {
        name: "Business System Template",
        category: "Operations",
        description: `Template generated from: ${prompt}`,
        databases: [
          {
            key: "templates",
            name: "Template DB",
            properties: [
              { name: "Name", type: "title", required: true },
              { name: "Category", type: "select", options: ["Marketing", "Operations"] },
              { name: "Status", type: "status", options: ["Draft", "Published"] },
            ],
          },
        ],
        pages: [{ title: "Overview", content: `Overview for: ${prompt}` }],
        tags: ["template", "business"],
        starterContent: [{ title: "Starter", content: `Starter content for: ${prompt}` }],
      },
      prompt,
    );
  }

  private renderTemplateDoc(t: TemplateDef): string {
    return `# ${t.name}\n\n${t.description}\n\n## Category: ${t.category}\n\n## Databases\n${t.databases.map((d) => `- ${d.name} (${d.properties.length} properties)`).join("\n")}\n\n## Pages\n${t.pages.map((p) => `- ${p.title}`).join("\n")}\n\n## Tags\n${t.tags.join(", ")}\n`;
  }
}




