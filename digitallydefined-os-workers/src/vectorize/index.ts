/**
 * src/vectorize/index.ts — Vectorize integration for DigitallyDefined OS.
 *
 * Manages the Cloudflare Vectorize index used for semantic search over
 * template knowledge, SOPs, prompt libraries, and training examples.
 */

import type { Json, VectorSearchResult } from "../types.js";

/**
 * Semantic search over stored knowledge. Generates an embedding for the query
 * via Cloudflare AI, then queries Vectorize for the most similar vectors.
 */
export async function semanticSearch({
  env,
  query,
  topK = 5,
}: {
  env: { AI?: unknown; VECTORIZE?: unknown };
  query: string;
  topK?: number;
}): Promise<VectorSearchResult[]> {
  const ai = (env as { AI?: unknown }).AI;
  const vectorize = (env as { VECTORIZE?: unknown }).VECTORIZE;

  if (!ai || !vectorize) {
    return [];
  }

  // 1. Embed the query
  const embedding = await embedText(ai, query);

  // 2. Query Vectorize
  const v = vectorize as unknown as {
    query: (args: { vector: number[]; topK?: number; returnMetadata?: boolean }) => Promise<{
      matches: Array<{ id: string; score: number; metadata?: unknown }>;
    }>;
  };

  const results = await v.query({ vector: embedding, topK });
  return results.matches.map((m) => ({
    id: m.id,
    score: m.score,
    metadata: (m.metadata ?? {}) as Json,
    content: String((m.metadata as { content?: string })?.content ?? ""),
  }));
}

/**
 * Upsert a knowledge vector into Vectorize.
 */
export async function upsertKnowledge({
  env,
  id,
  content,
  metadata,
}: {
  env: { AI?: unknown; VECTORIZE?: unknown };
  id: string;
  content: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const ai = (env as { AI?: unknown }).AI;
  const vectorize = (env as { VECTORIZE?: unknown }).VECTORIZE;
  if (!ai || !vectorize) return;

  const vector = await embedText(ai, content);

  const v = vectorize as unknown as {
    upsert: (args: { vectors: Array<{ id: string; values: number[]; metadata?: Record<string, unknown> }> }) => Promise<void>;
  };
  await v.upsert({
    vectors: [{ id, values: vector, metadata: { content, ...metadata } }],
  });
}

/**
 * Generate an embedding vector for text using Cloudflare AI.
 */
export async function embedText(ai: unknown, text: string): Promise<number[]> {
  const a = ai as unknown as {
    run: (model: string, inputs: { text: string[] }) => Promise<{ shape: number[]; data: number[][] }>;
  };
  const response = await a.run("@cf/baai/bge-base-en-v1.5", { text: [text] });
  return response.data[0] ?? [];
}

/**
 * Index a batch of knowledge documents into Vectorize.
 */
export async function indexKnowledgeBatch({
  env,
  documents,
}: {
  env: { AI?: unknown; VECTORIZE?: unknown };
  documents: Array<{ id: string; content: string; metadata?: Record<string, unknown> }>;
}): Promise<void> {
  for (const doc of documents) {
    await upsertKnowledge({ env, ...doc });
  }
}

export default { semanticSearch, upsertKnowledge, indexKnowledgeBatch };
