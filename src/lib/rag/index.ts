import { generateEmbedding } from "@/lib/embeddings";
import { retrieveChunks as _retrieveChunks } from "./store";
import { careerRecencyStrategy } from "./career-rank";

export { careerRecencyStrategy } from "./career-rank";
export { buildCareerRankMap } from "./career-rank";

/** A single retrieved context chunk, safe to expose to callers (no embedding vector). */
export interface ContextChunk {
  slug: string;
  title: string;
  content: string;
  score: number;
}

/**
 * Formats retrieved chunks into a prompt-ready string.
 * Returns the "no context" fallback when the chunk list is empty.
 */
export function formatChunks(chunks: ContextChunk[]): string {
  if (chunks.length === 0) return "No relevant context found.";
  return chunks
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.content}`)
    .join("\n\n---\n\n");
}

/**
 * Scores all stored chunks against a pre-computed query embedding and returns
 * the top-K results. Prefer {@link getContextForQuery} for most callers.
 */
export function retrieveChunks(
  queryEmbedding: number[],
  options?: { topK?: number },
): ContextChunk[] {
  return _retrieveChunks(queryEmbedding, options);
}

/**
 * Primary entry point: embeds the query, retrieves relevant chunks, applies
 * career-recency ordering, and returns a formatted context string.
 *
 * @param query - The user's natural-language query.
 * @param options.topK - Maximum number of chunks to include (default: 5).
 */
export async function getContextForQuery(
  query: string,
  options?: { topK?: number },
): Promise<{ context: string; chunks: ContextChunk[] }> {
  const embedding = await generateEmbedding(query);
  const rawChunks = _retrieveChunks(embedding, options);
  const chunks = careerRecencyStrategy(rawChunks);
  const context = formatChunks(chunks);
  return { context, chunks };
}
