"use client";

import { useTableOfContents } from "@/hooks/useTableOfContents";
import { TableOfContents } from "./TableOfContents";

interface BlogPostContentAreaProps {
  children: React.ReactNode;
}

/**
 * Client wrapper for blog post MDX content that extracts headings and renders
 * a sticky table-of-contents sidebar in the left gutter at xl+ viewports.
 *
 * The TOC is hidden below the xl breakpoint (1280px) and only shown when the
 * post contains at least 2 H2 headings.
 *
 * Positioning: fixed left sidebar using `left: calc(50% - 620px)` which places
 * the TOC right edge flush with the root `max-w-3xl` container's left edge
 * (50vw − 384px), with a 16px gap and 220px width (384 + 16 + 220 = 620).
 */
export function BlogPostContentArea({ children }: BlogPostContentAreaProps) {
  const [headings, contentRef] = useTableOfContents();
  const h2Count = headings.filter((h) => h.level === 2).length;
  const showToc = h2Count >= 2;

  return (
    <>
      {showToc && (
        <div
          className="hidden xl:block"
          style={{
            position: "fixed",
            top: "5rem",
            left: "calc(50% - 620px)",
            width: "220px",
            maxHeight: "calc(100vh - 5rem - 2rem)",
            overflowY: "auto",
          }}
        >
          <TableOfContents headings={headings} />
        </div>
      )}
      <main
        ref={contentRef}
        className="prose prose-lg max-w-none dark:prose-invert"
      >
        {children}
      </main>
    </>
  );
}
