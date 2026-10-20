/**
 * src/notion/schema.ts — Canonical Notion database schemas for DigitallyDefined OS.
 *
 * Mirrors the backend Antigravity 8-core OS databases plus the new AI OS
 * schemas (Templates Library, Marketplace, Prompt Library, SOP Library).
 * These are the contracts agents design and deploy into customer workspaces.
 */

import type { NotionDatabaseSchema, NotionPropertyDef } from "../types.js";

export function prop(
  name: string,
  type: NotionPropertyDef["type"],
  opts: Partial<NotionPropertyDef> = {},
): NotionPropertyDef {
  return { name, type, ...opts };
}

export const OS_DATABASES: Record<string, NotionDatabaseSchema> = {
  assets: {
    key: "assets",
    name: "Digital Assets DB",
    label: "Digital Assets",
    description: "Repository of all digital products, lead magnets, templates, and assets.",
    isSystem: true,
    parent: { type: "workspace" },
    properties: [
      prop("Name", "title", { required: true }),
      prop("URL", "url"),
      prop("Status", "select", {
        options: ["Draft", "Published", "Paused", "Scheduled", "Archived"],
      }),
      prop("Niche", "rich_text"),
      prop("AssetValue", "number"),
      prop("Created", "date"),
    ],
  },
  ideas: {
    key: "ideas",
    name: "Ideas & Intake DB",
    label: "Ideas & Intake",
    description: "Capture business, content, and product ideas from any source.",
    isSystem: true,
    parent: { type: "workspace" },
    properties: [
      prop("Name", "title", { required: true }),
      prop("Status", "select", {
        options: ["Draft", "Published", "Archived"],
      }),
      prop("Source", "rich_text"),
      prop("Niche", "rich_text"),
      prop("Created", "date"),
    ],
  },
  money: {
    key: "money",
    name: "Money Snapshot DB",
    label: "Money Snapshot",
    description: "Monthly revenue, expenses, and net income tracking.",
    isSystem: true,
    parent: { type: "workspace" },
    properties: [
      prop("Name", "title", { required: true }),
      prop("Month", "date"),
      prop("Revenue", "number"),
      prop("Expenses", "number"),
      prop("Net", "number"),
      prop("Created", "date", { readOnly: true }),
    ],
  },
  monthly: {
    key: "monthly",
    name: "Monthly Review DB",
    label: "Monthly Review",
    description: "Monthly wins, risks, and next actions.",
    isSystem: true,
    parent: { type: "workspace" },
    properties: [
      prop("Name", "title", { required: true }),
      prop("Period", "date"),
      prop("Wins", "rich_text"),
      prop("Risks", "rich_text"),
      prop("NextActions", "rich_text"),
      prop("Created", "date", { readOnly: true }),
    ],
  },
  reputation: {
    key: "reputation",
    name: "Reputation Signals DB",
    label: "Reputation Signals",
    description: "Buyer signals, testimonials, and social proof tracking.",
    isSystem: true,
    parent: { type: "workspace" },
    properties: [
      prop("Name", "title", { required: true }),
      prop("Signal", "select", { options: ["Lead", "Testimonial", "Referral", "Review"] }),
      prop("Score", "number"),
      prop("Source", "rich_text"),
      prop("Created", "date"),
    ],
  },
  content: {
    key: "content",
    name: "Content Blocks DB",
    label: "Content Blocks",
    description: "Content library — posts, articles, scripts, and copy.",
    isSystem: true,
    parent: { type: "workspace" },
    properties: [
      prop("Name", "title", { required: true }),
      prop("ContentType", "select", {
        options: ["Social Post", "Article", "Script", "Email", "Ad Copy"],
      }),
      prop("Status", "select", {
        options: ["Draft", "Scheduled", "Published", "Archived"],
      }),
      prop("Platform", "select", {
        options: ["LinkedIn", "X", "Instagram", "Facebook", "TikTok", "Email"],
      }),
      prop("Created", "date"),
    ],
  },
  automations: {
    key: "automations",
    name: "Automations Log DB",
    label: "Automations Log",
    description: "Log of running automations, triggers, and outcomes.",
    isSystem: true,
    parent: { type: "workspace" },
    properties: [
      prop("Name", "title", { required: true }),
      prop("Status", "select", {
        options: ["Active", "Paused", "Failed", "Completed"],
      }),
      prop("Source", "rich_text"),
      prop("Superpower", "rich_text"),
      prop("Created", "date"),
    ],
  },
  templates: {
    key: "templates",
    name: "Templates Library DB",
    label: "Templates Library",
    description: "Catalog of Notion templates, ebooks, and digital products.",
    isSystem: true,
    parent: { type: "workspace" },
    properties: [
      prop("Name", "title", { required: true }),
      prop("Format", "select", {
        options: ["Notion", "Ebook", "Checklist", "Toolkit", "Course"],
      }),
      prop("Category", "select", {
        options: ["Marketing", "Operations", "Sales", "Product", "Finance"],
      }),
      prop("Price", "number"),
      prop("URL", "url"),
      prop("Created", "date"),
    ],
  },
};

/** ─── AI OS Extension Schemas ─────────────────────────────────────────── */

export const AI_OS_DATABASES: Record<string, NotionDatabaseSchema> = {
  promptLibrary: {
    key: "promptLibrary",
    name: "Prompt Library DB",
    label: "Prompt Library",
    description: "Versioned prompt library for AI agents and workflows.",
    isSystem: true,
    parent: { type: "workspace" },
    properties: [
      prop("Name", "title", { required: true }),
      prop("Category", "select", {
        options: ["Research", "Outline", "Write", "Design", "Publish", "Audit"],
      }),
      prop("Prompt", "rich_text", { required: true }),
      prop("Model", "select", { options: ["cf-llama", "cf-mixtral", "auto"] }),
      prop("Version", "number"),
      prop("Created", "date"),
    ],
  },
  sopLibrary: {
    key: "sopLibrary",
    name: "SOP Library DB",
    label: "SOP Library",
    description: "Standard operating procedures for business operations.",
    isSystem: true,
    parent: { type: "workspace" },
    properties: [
      prop("Name", "title", { required: true }),
      prop("Department", "select", {
        options: ["Content", "Product", "Marketing", "Operations", "Customer"],
      }),
      prop("Steps", "rich_text"),
      prop("Owner", "rich_text"),
      prop("ReviewDate", "date"),
      prop("Created", "date"),
    ],
  },
  marketplaceProducts: {
    key: "marketplaceProducts",
    name: "Marketplace Products DB",
    label: "Marketplace Products",
    description: "Digital products for sale — lead magnets, ebooks, templates, bundles.",
    isSystem: true,
    parent: { type: "workspace" },
    properties: [
      prop("Name", "title", { required: true }),
      prop("Category", "select", {
        options: ["Lead Magnet", "Ebook", "Template", "Bundle", "Course"],
      }),
      prop("Price", "number"),
      prop("Status", "select", {
        options: ["Draft", "Active", "Archived"],
      }),
      prop("GumroadUrl", "url"),
      prop("SEO Description", "rich_text"),
      prop("Created", "date"),
    ],
  },
  customers: {
    key: "customers",
    name: "Customers DB",
    label: "Customers",
    description: "Customer records and purchase history.",
    isSystem: true,
    parent: { type: "workspace" },
    properties: [
      prop("Name", "title", { required: true }),
      prop("Email", "email"),
      prop("LifetimeValue", "number"),
      prop("Status", "select", {
        options: ["Lead", "Customer", "VIP", "Churned"],
      }),
      prop("Created", "date"),
    ],
  },
  affiliates: {
    key: "affiliates",
    name: "Affiliates DB",
    label: "Affiliates",
    description: "Affiliate partners, referral links, and commission tracking.",
    isSystem: true,
    parent: { type: "workspace" },
    properties: [
      prop("Name", "title", { required: true }),
      prop("Email", "email"),
      prop("CommissionRate", "number"),
      prop("Referrals", "number"),
      prop("Status", "select", { options: ["Active", "Paused", "Removed"] }),
      prop("Created", "date"),
    ],
  },
};

export function getAllDatabaseSchemas(): Record<string, NotionDatabaseSchema> {
  return { ...OS_DATABASES, ...AI_OS_DATABASES };
}

export function getDatabaseSchema(key: string): NotionDatabaseSchema {
  const schema = getAllDatabaseSchemas()[key];
  if (!schema) {
    throw new Error(`Unknown Notion database schema key: ${key}`);
  }
  return schema;
}

export const OS_CREATION_ORDER: string[] = [
  "templates",
  "assets",
  "ideas",
  "content",
  "automations",
  "money",
  "monthly",
  "reputation",
];

export const AI_OS_CREATION_ORDER: string[] = [
  "promptLibrary",
  "sopLibrary",
  "marketplaceProducts",
  "customers",
  "affiliates",
];
