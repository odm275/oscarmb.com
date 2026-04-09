"use client";

import { useCallback, useState } from "react";

export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

/**
 * Extracts H2 and H3 headings from a DOM element via a callback ref.
 * Returns [headings, refCallback] — attach refCallback to the content container.
 *
 * Uses a callback ref (not useEffect + setState) so heading extraction runs
 * in the ref callback, not synchronously inside an effect body.
 */
export function useTableOfContents(): [
  TocHeading[],
  (el: HTMLElement | null) => void,
] {
  const [headings, setHeadings] = useState<TocHeading[]>([]);

  const refCallback = useCallback((el: HTMLElement | null) => {
    if (!el) return;

    const elements = el.querySelectorAll("h2, h3");
    const extracted: TocHeading[] = [];

    elements.forEach((node) => {
      const id = node.id;
      if (!id) return;

      // Strip the autolink anchor added by rehype-autolink-headings;
      // collect only text nodes to get the clean heading text.
      const text =
        Array.from(node.childNodes)
          .filter((child) => child.nodeType === Node.TEXT_NODE)
          .map((child) => child.textContent)
          .join("")
          .trim() ||
        node.textContent?.trim() ||
        "";

      const level = node.tagName === "H2" ? 2 : (3 as 2 | 3);
      extracted.push({ id, text, level });
    });

    setHeadings(extracted);
  }, []);

  return [headings, refCallback];
}
