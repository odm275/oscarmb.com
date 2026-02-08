import { google } from "@ai-sdk/google";
import { embed } from "ai";

/** Output dimension for RAG; must match stored embeddings. */
const EMBEDDING_DIMENSION = 768;

/**
 * Generate embedding using Google's gemini-embedding-001 model.
 * text-embedding-004 was removed from the v1beta API; gemini-embedding-001
 * is the supported embedding model. Uses outputDimensionality to produce
 * 768-dimensional vectors for compatibility with stored embeddings.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: google.embedding("gemini-embedding-001"),
    value: text,
    providerOptions: {
      google: { outputDimensionality: EMBEDDING_DIMENSION },
    },
  });
  return embedding;
}
