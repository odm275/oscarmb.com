import type { Root, Element, ElementContent } from "hast";

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

function headingLevel(node: ElementContent): HeadingLevel | null {
  if (node.type !== "element" || !HEADING_TAGS.has(node.tagName)) return null;
  return parseInt(node.tagName[1], 10) as HeadingLevel;
}

function makeSection(id: string, children: ElementContent[]): Element {
  return {
    type: "element",
    tagName: "section",
    properties: { id },
    children,
  };
}

/**
 * Wraps sibling runs of content into nested `<section>` elements based on
 * heading hierarchy. Each heading's `id` is moved to its wrapping section.
 *
 * Uses a stack to track open sections. When a heading of the same or higher
 * rank is encountered, all deeper open sections are closed and nested into
 * their parent. This produces correct nesting in a single pass.
 */
function sectionize(children: ElementContent[]): ElementContent[] {
  const result: ElementContent[] = [];

  // Stack of open sections: { level, id, children[] }
  const stack: {
    level: HeadingLevel;
    id: string;
    children: ElementContent[];
  }[] = [];

  for (const node of children) {
    const level = headingLevel(node);

    if (level !== null) {
      const heading = node as Element;
      const id = (heading.properties?.id as string) ?? "";

      // Remove the id from the heading — it moves to the <section>
      if (heading.properties) {
        delete heading.properties.id;
      }

      // Close all open sections at this level or deeper (>= level number
      // means same rank or lower rank heading, e.g. h2 closes h2 and h3)
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        const closed = stack.pop()!;
        const sectionNode = makeSection(closed.id, closed.children);
        if (stack.length > 0) {
          stack[stack.length - 1].children.push(sectionNode);
        } else {
          result.push(sectionNode);
        }
      }

      // Open a new section for this heading
      stack.push({ level, id, children: [heading] });
    } else {
      // Non-heading content goes into the innermost open section
      if (stack.length > 0) {
        stack[stack.length - 1].children.push(node);
      } else {
        // Preamble content (before any heading) — leave unwrapped
        result.push(node);
      }
    }
  }

  // Close all remaining open sections (innermost first)
  while (stack.length > 0) {
    const closed = stack.pop()!;
    const sectionNode = makeSection(closed.id, closed.children);
    if (stack.length > 0) {
      stack[stack.length - 1].children.push(sectionNode);
    } else {
      result.push(sectionNode);
    }
  }

  return result;
}

/**
 * Rehype plugin that wraps content between headings into nested `<section>`
 * elements. The heading's `id` (from rehype-slug) is moved to the section.
 *
 * Must run after rehype-slug and rehype-autolink-headings in the plugin chain.
 */
export function rehypeSectionWrap() {
  return (tree: Root) => {
    tree.children = sectionize(
      tree.children as ElementContent[],
    ) as Root["children"];
  };
}
