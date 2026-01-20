import { defineCollection, defineConfig, s } from "velite";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

const posts = defineCollection({
  name: "Post",
  pattern: "posts/**/*.mdx",
  schema: s
    .object({
      title: s.string().max(99),
      slug: s.slug("posts"),
      summary: s.string().optional(),
      publishedAt: s.isodate(),
      updatedAt: s.isodate().optional(),
      tags: s.array(s.string()).default([]),
      image: s.string().optional(),
      draft: s.boolean().default(false),
      coAuthors: s.array(s.string()).optional(),
      body: s.mdx(),
    })
    .transform((data) => ({
      ...data,
      readingTime: `${Math.ceil(data.body.split(/\s+/g).length / 200)} min read`,
    })),
});

export default defineConfig({
  root: "src/content",
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "[name]-[hash:6].[ext]",
    clean: true,
  },
  collections: { posts },
  mdx: {
    rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings],
  },
});
