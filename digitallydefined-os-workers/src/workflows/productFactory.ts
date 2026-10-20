/**
 * src/workflows/productFactory.ts — Digital Product Factory Workflow.
 *
 * Orchestrates: Researcher → Planner (outline) → Content Agent (writer) →
 * Product Publisher Agent to create a complete digital product and store all
 * outputs in Notion. Mirrors Objective 3 (Digital Product Factory).
 */

import { resolveAgent } from "../agents/index.js";
import type { AgentTask } from "../types.js";
import type {
  ProductFactoryInput,
  ProductFactoryOutput,
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

export async function runProductFactoryWorkflow(
  input: ProductFactoryInput,
): Promise<ProductFactoryOutput> {
  const { topic, productType, price = 0 } = input;
  const artifacts: Array<{ kind: string; title: string }> = [];

  // Agent 1: Research
  const researcher = resolveAgent("researcher", {});
  const research = await researcher.run(
    newTask("research", `Research a ${productType} about ${topic}`, {
      topic,
      niche: productType,
      depth: "deep",
    }),
  );
  artifacts.push({ kind: "research", title: `Research — ${topic}` });

  // Agent 2: Planner (outline)
  const planner = resolveAgent("planner", {});
  const outline = await planner.run(
    newTask("outline", `Outline a ${productType} about ${topic}`, {
      goal: `Create a ${productType} about ${topic}`,
      businessType: productType,
    }),
  );
  artifacts.push({ kind: "outline", title: `Outline — ${topic}` });

  // Agent 3: Content Agent (writer)
  const writer = resolveAgent("content", {});
  const content = await writer.run(
    newTask("write", `Write a ${productType} about ${topic}`, {
      platform: "Notion",
      contentType: "Ebook",
      topic,
      tone: "professional",
      goal: "educate and convert",
    }),
  );
  artifacts.push({ kind: "content", title: `Content — ${topic}` });

  // Agent 4/5: Product Publisher
  const publisher = resolveAgent("product_publisher", {});
  const product = await publisher.run(
    newTask("publish", `Publish ${productType} about ${topic}`, {
      productType,
      topic,
      content: ((content.output as Record<string, unknown> | null)?.["content"] as string) ?? "",
      price,
    }),
  );
  artifacts.push({ kind: "product", title: `Product — ${((product.output as Record<string, unknown> | null)?.["name"] as string) ?? topic}` });

  return {
    research: (research.output as Record<string, unknown> | null) ?? {},
    outline: (outline.output as Record<string, unknown> | null) ?? {},
    content: (content.output as Record<string, unknown> | null) ?? {},
    product: (product.output as Record<string, unknown> | null) ?? {},
    artifacts,
  };
}
