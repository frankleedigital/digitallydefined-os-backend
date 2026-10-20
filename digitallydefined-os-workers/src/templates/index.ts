/**
 * src/templates/index.ts — Template Library for DigitallyDefined OS.
 *
 * In-memory registry of template definitions. In production this is backed by
 * the Notion Templates Library DB and Vectorize for semantic search.
 */

import type { TemplateDef } from "../types.js";

const TEMPLATES: TemplateDef[] = [
  {
    id: "tpl-content-planning",
    name: "Content Planning System",
    category: "Marketing",
    description:
      "A content planning system for a faceless digital marketing business — ideas, content library, assets, automations.",
    prompt:
      "I want a content planning system for a faceless digital marketing business.",
    databases: [],
    pages: [],
    automations: ["Publish to Social", "Idea to Content"],
    starterContent: ["Weekly Content Plan"],
    tags: ["content", "marketing", "faceless"],
    seo: {
      title: "Content Planning System — Notion Template",
      description: "Plan and execute faceless digital marketing content.",
      tags: ["content", "marketing", "notion"],
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: "tpl-client-onboarding",
    name: "Client Onboarding System",
    category: "Operations",
    description:
      "A complete client onboarding operating system — clients, projects, tasks, SOPs, CRM views.",
    prompt: "Build me a client onboarding system.",
    databases: [],
    pages: [],
    automations: ["Welcome Email", "Task Creation"],
    starterContent: [],
    tags: ["onboarding", "crm", "operations"],
    seo: {
      title: "Client Onboarding System — Notion Template",
      description: "Onboard clients with a structured operating system.",
      tags: ["onboarding", "crm", "notion"],
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: "tpl-lead-magnet",
    name: "Lead Magnet Factory",
    category: "Product",
    description: "A lead magnet production workspace — outline, launch checklist, social posts.",
    prompt: "Create a lead magnet about faceless marketing.",
    databases: [],
    pages: [],
    automations: ["Asset Delivery"],
    starterContent: ["Lead Magnet Draft"],
    tags: ["lead magnet", "product", "marketing"],
    seo: {
      title: "Lead Magnet Factory — Notion Template",
      description: "Build and launch lead magnets fast.",
      tags: ["lead magnet", "product", "notion"],
    },
    createdAt: new Date().toISOString(),
  },
];

export function listTemplates(): TemplateDef[] {
  return TEMPLATES;
}

export function getTemplate(id: string): TemplateDef | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function searchTemplates(query: string): TemplateDef[] {
  const q = query.toLowerCase();
  return TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q)),
  );
}

export default { listTemplates, getTemplate, searchTemplates };
