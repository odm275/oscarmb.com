import { posts } from "#velite";

export type Post = (typeof posts)[number];

export type PostSummary = Omit<Post, "body">;

export type PostDetail = Post;

/**
 * Get all published posts, sorted by date descending
 */
export function getPosts(limit?: number): PostSummary[] {
  const published = posts
    .filter((post) => process.env.NODE_ENV === "development" || !post.draft)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    )
    .map(({ body, ...rest }) => rest);

  return limit ? published.slice(0, limit) : published;
}

/**
 * Get a single post by slug
 */
export function getPostBySlug(slug: string): PostDetail | null {
  const post = posts.find((p) => p.slug === slug);

  if (!post) return null;

  // In production, hide draft posts
  if (process.env.NODE_ENV !== "development" && post.draft) {
    return null;
  }

  return post;
}

/**
 * Get all post slugs for static generation
 */
export function getAllSlugs(): string[] {
  return posts
    .filter((post) => process.env.NODE_ENV === "development" || !post.draft)
    .map((post) => post.slug);
}
