import embeddingsData from "@/data/embeddings.json";

interface EmbeddingChunk {
  slug: string;
  title: string;
  content: string;
  embedding: number[];
}

// Cache the embeddings in memory
let cachedEmbeddings: EmbeddingChunk[] | null = null;

/**
 * Load embeddings from JSON file (cached)
 */
export function loadEmbeddings(): EmbeddingChunk[] {
  if (cachedEmbeddings) {
    return cachedEmbeddings;
  }

  cachedEmbeddings = embeddingsData as EmbeddingChunk[];
  return cachedEmbeddings;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);

  if (magnitude === 0) {
    return 0;
  }

  return dotProduct / magnitude;
}

/** Career slugs in recency order (newest first). Used to order career chunks in context. */
const CAREER_SLUG_RECENCY_ORDER = [
  "career:cvs-health-co-branding-brand-senior-software-engineer",
  "career:freelance-full-stack-engineer",
  "career:poetic-software-developer",
] as const;

function careerRecencyRank(slug: string): number {
  const idx = CAREER_SLUG_RECENCY_ORDER.indexOf(slug as (typeof CAREER_SLUG_RECENCY_ORDER)[number]);
  return idx === -1 ? CAREER_SLUG_RECENCY_ORDER.length : idx;
}

/**
 * Retrieve the most relevant content chunks for a query.
 * Career chunks in the result are ordered by recency (newest first) so the model sees current experience first.
 */
export function retrieveContext(
  queryEmbedding: number[],
  topK: number = 5,
): { content: string; title: string; slug: string; score: number }[] {
  const embeddings = loadEmbeddings();

  // Calculate similarity scores for all chunks
  const scored = embeddings.map((chunk) => ({
    ...chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  // Sort by score (highest first) and take top K
  const topResults = scored.sort((a, b) => b.score - a.score).slice(0, topK);

  // Order career chunks by recency (newest first) so experience answers lead with current role
  const ordered = [...topResults].sort((a, b) => {
    const aCareer = careerRecencyRank(a.slug);
    const bCareer = careerRecencyRank(b.slug);
    if (aCareer !== bCareer) return aCareer - bCareer;
    return b.score - a.score;
  });

  // Return without the embedding vectors (they're large)
  return ordered.map(({ embedding, ...rest }) => rest);
}

/**
 * Format retrieved context into a string for the system prompt
 */
export function formatContext(
  results: { content: string; title: string; slug: string; score: number }[],
): string {
  if (results.length === 0) {
    return "No relevant context found.";
  }

  return results
    .map(
      (r, i) =>
        `[${i + 1}] ${r.title}\n${r.content}`,
    )
    .join("\n\n---\n\n");
}

