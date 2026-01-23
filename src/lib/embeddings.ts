import { google } from "@ai-sdk/google";
import { embed } from "ai";

/**
 * Generate embedding using Google's text-embedding-004 model
 * Uses the same API key as chat responses (GOOGLE_GENERATIVE_AI_API_KEY)
 * Produces 768-dimensional vectors for semantic similarity
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: google.embedding("text-embedding-004"),
    value: text,
  });
  return embedding;
}
