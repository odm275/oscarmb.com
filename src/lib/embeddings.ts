import { pipeline } from "@xenova/transformers";

// Global embedding pipeline instance (cached)
let embeddingPipeline: any = null;

/**
 * Initialize the embedding model (lazy loading)
 * This will download ~25MB on first run, then cache locally
 */
async function initEmbeddingModel() {
  if (!embeddingPipeline) {
    embeddingPipeline = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
    );
  }
  return embeddingPipeline;
}

/**
 * Generate embedding using local Transformers.js model
 * This is completely free and runs locally - no API calls needed!
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const extractor = await initEmbeddingModel();
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}
