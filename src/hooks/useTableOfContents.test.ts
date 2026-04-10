import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTableOfContents } from "./useTableOfContents";

function makeContainer(
  headings: { tag: string; id: string; text: string }[],
): HTMLElement {
  const container = document.createElement("div");
  headings.forEach(({ tag, id, text }) => {
    const el = document.createElement(tag);
    el.id = id;
    el.textContent = text;
    container.appendChild(el);
  });
  return container;
}

describe("useTableOfContents", () => {
  it("returns empty array before refCallback is called", () => {
    const { result } = renderHook(() => useTableOfContents());
    expect(result.current[0]).toEqual([]);
  });

  it("extracts H2 and H3 headings in document order", () => {
    const { result } = renderHook(() => useTableOfContents());
    const container = makeContainer([
      { tag: "h2", id: "intro", text: "Introduction" },
      { tag: "h3", id: "background", text: "Background" },
      { tag: "h2", id: "conclusion", text: "Conclusion" },
    ]);

    act(() => {
      result.current[1](container);
    });

    expect(result.current[0]).toEqual([
      { id: "intro", text: "Introduction", level: 2 },
      { id: "background", text: "Background", level: 3 },
      { id: "conclusion", text: "Conclusion", level: 2 },
    ]);
  });

  it("skips headings that have no id attribute", () => {
    const { result } = renderHook(() => useTableOfContents());
    const container = document.createElement("div");

    const withId = document.createElement("h2");
    withId.id = "has-id";
    withId.textContent = "Has ID";

    const noId = document.createElement("h2");
    noId.textContent = "No ID";

    container.appendChild(withId);
    container.appendChild(noId);

    act(() => {
      result.current[1](container);
    });

    expect(result.current[0]).toHaveLength(1);
    expect(result.current[0][0].id).toBe("has-id");
  });

  it("strips the anchor added by rehype-autolink-headings", () => {
    const { result } = renderHook(() => useTableOfContents());
    const container = document.createElement("div");
    const h2 = document.createElement("h2");
    h2.id = "my-heading";

    // rehype-autolink-headings prepends or appends an <a> element
    const anchor = document.createElement("a");
    anchor.textContent = "#";
    h2.appendChild(anchor);
    h2.appendChild(document.createTextNode("My Heading"));
    container.appendChild(h2);

    act(() => {
      result.current[1](container);
    });

    // Should contain only the text-node content, not the anchor "#"
    expect(result.current[0][0].text).toBe("My Heading");
  });

  it("returns empty array for a container with no H2/H3 headings", () => {
    const { result } = renderHook(() => useTableOfContents());
    const container = document.createElement("div");
    container.innerHTML = "<p>Just a paragraph</p><h4 id='h4'>H4 heading</h4>";

    act(() => {
      result.current[1](container);
    });

    expect(result.current[0]).toEqual([]);
  });

  it("handles duplicate heading text with distinct IDs", () => {
    const { result } = renderHook(() => useTableOfContents());
    const container = makeContainer([
      { tag: "h2", id: "section-1", text: "Section" },
      { tag: "h2", id: "section-2", text: "Section" },
    ]);

    act(() => {
      result.current[1](container);
    });

    expect(result.current[0]).toHaveLength(2);
    expect(result.current[0][0].id).toBe("section-1");
    expect(result.current[0][1].id).toBe("section-2");
  });

  it("handles headings with special characters in text", () => {
    const { result } = renderHook(() => useTableOfContents());
    const container = makeContainer([
      { tag: "h2", id: "special", text: "C++ & TypeScript: What's New?" },
    ]);

    act(() => {
      result.current[1](container);
    });

    expect(result.current[0][0].text).toBe("C++ & TypeScript: What's New?");
  });
});
