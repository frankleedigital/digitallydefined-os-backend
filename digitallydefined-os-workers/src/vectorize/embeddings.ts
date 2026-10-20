/**
 * src/vectorize/embeddings.ts — Embedding helpers for Cloudflare AI.
 *
 * Re-exports core embedding functions with typed signatures for use across
 * agents and workflows.
 */

import { embedText } from "./index.js";

/** Embed a single piece of text for semantic storage/search. */
export async function embed(ai: unknown, text: string): Promise<number[]> {
  return embedText(ai, text);
}

/** Embed multiple texts in sequence. */
export async function embedBatch(
  ai: unknown,
  texts: string[],
): Promise<Array<{ index: number; vector: number[] }>> {
  const results = [];
  for (let i = 0; i < texts.length; i++) {
    const t = texts[i];
    if (t === undefined) continue;
    results.push({ index: i, vector: await embedText(ai, t) });
  }
  return results;
}

export default { embed, embedBatch };
