/**
 * src/agents/productPublisher.ts — Product Publisher Agent.
 *
 * Packages completed digital products (ebooks, lead magnets, templates) into
 * marketplace-ready assets: descriptions, SEO metadata, tags, Gumroad-ready
 * product records. Stores results in Notion + Vectorize.
 */

import { BaseAgent } from "./baseAgent.js";
import type { AgentTask, AgentCollaborationResult, AgentArtifact } from "../types.js";

const SYSTEM_PROMPT = `You are the Product Publisher Agent for DigitallyDefined OS.
Package a finished digital product for the marketplace: generate product name,
description, SEO metadata, tags, pricing, and Gumroad-ready asset list. Return
a structured product record as JSON.`;

interface ProductInput {
  productType: string;
  topic: string;
  content: string;
  price?: number;
}

export class ProductPublisherAgent extends BaseAgent {
  constructor(context: Record<string, unknown>) {
    super({
      name: "Product Publisher Agent",
      systemPrompt: SYSTEM_PROMPT,
      context,
    });
  }

  async run(task: AgentTask): Promise<AgentCollaborationResult> {
    const artifacts: AgentArtifact[] = [];
    const input = this.parseInput(task.context);

    let product: {
      name: string;
      category: string;
      description: string;
      seoTitle: string;
      seoDescription: string;
      tags: string[];
      price: number;
      gumroadAssets: string[];
      launchChecklist: string[];
    };

    try {
      const llmOutput = await this.callAI(
        `Product: ${input.productType} — ${input.topic}\nPrice: $${input.price ?? 0}\n\nReturn JSON with name, category, description, seoTitle, seoDescription, tags[], price, gumroadAssets[], launchChecklist[].`,
      );
      let parsed = JSON.parse(llmOutput);
      let validated = parsed && typeof parsed === "object" && "name" in parsed && "price" in parsed && Array.isArray(parsed["tags"] || []);
      product = validated ? (parsed as typeof product) : this.fallbackProduct(input);
    } catch (err) {
      console.warn(`[productPublisher] LLM failed, using fallback:`, String(err));
      product = this.fallbackProduct(input);
    }

    const doc = `# Product: ${product.name}\n\n## Category: ${product.category}\n## Price: $${product.price}\n\n${product.description}\n\n## SEO\nTitle: ${product.seoTitle}\nDescription: ${product.seoDescription}\n\n## Tags\n${product.tags.join(", ")}\n\n## Gumroad Assets\n${product.gumroadAssets.map((a) => `- ${a}`).join("\n")}\n\n## Launch Checklist\n${product.launchChecklist.map((c) => `- [ ] ${c}`).join("\n")}`;
    artifacts.push(this.artifact("document", `Product Page — ${product.name}`, doc));
    artifacts.push(
      this.artifact("metadata", `${product.name} — SEO + Metadata`, JSON.stringify(product, null, 2)),
    );

    return {
      taskId: task.id,
      agent: this.name,
      output: product,
      artifacts,
      nextSteps: ["Create Gumroad product page.", "Add product to the Marketplace Products DB in Notion."],
    };
  }

  private parseInput(context: Record<string, unknown>): ProductInput {
    return {
      productType: String(context["productType"] ?? "lead magnet"),
      topic: String(context["topic"] ?? "digital marketing"),
      content: String(context["content"] ?? ""),
      price: typeof context["price"] === "number" ? context["price"] : undefined,
    };
  }

  private fallbackProduct(input: ProductInput) {
    return {
      name: `${input.topic} ${input.productType}`,
      category: "Lead Magnet",
      description: `A ${input.productType} about ${input.topic}.`,
      seoTitle: `${input.topic} — ${input.productType}`,
      seoDescription: `Download the ${input.topic} ${input.productType}.`,
      tags: ["lead magnet", input.topic],
      price: input.price ?? 0,
      gumroadAssets: ["product page", "checkout link", "delivery email"],
      launchChecklist: ["Write sales copy", "Set up Gumroad", "Create delivery email", "Announce launch"],
    };
  }
}

