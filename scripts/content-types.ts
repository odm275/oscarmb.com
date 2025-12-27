/**
 * Shared TypeScript interfaces for content extraction and pushing
 */

export interface ContentChunk {
  slug: string;
  title: string;
  content: string;
  metadata?: {
    contentType?: "project" | "career" | "page" | "social" | "navigation";
    enrichment?: string[];
  };
}

export interface ExtractedContent {
  timestamp: string;
  content: ContentChunk[];
}
