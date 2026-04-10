import embeddingsData from "@generated/embeddings.json";

interface StoredChunk {
  slug: string;
  title: string;
  content: string;
  embedding: number[];
}

let cachedChunks: StoredChunk[] | null = null;

function getChunks(): StoredChunk[] {
  if (cachedChunks) return cachedChunks;
  const data = embeddingsData as unknown as { embeddings: StoredChunk[] };
  cachedChunks = data.embeddings;
  return cachedChunks;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dot / magnitude;
}

export interface ScoredChunk {
  slug: string;
  title: string;
  content: string;
  score: number;
}

/**
 * Scores all stored chunks against the provided query embedding, returns the
 * top-K results sorted by cosine similarity (highest first). Embedding vectors
 * are stripped from the result.
 */
export function retrieveChunks(
  queryEmbedding: number[],
  options: { topK?: number } = {},
): ScoredChunk[] {
  const { topK = 5 } = options;
  const chunks = getChunks();

  return chunks
    .map(({ embedding, ...rest }) => ({
      ...rest,
      score: cosineSimilarity(queryEmbedding, embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
