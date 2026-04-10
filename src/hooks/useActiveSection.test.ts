import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useActiveSection } from "./useActiveSection";

// ---------------------------------------------------------------------------
// IntersectionObserver mock helpers
// ---------------------------------------------------------------------------

type ObserverCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;

let triggerObserver: ObserverCallback;

function setupIntersectionObserverMock() {
  triggerObserver = () => {};

  vi.stubGlobal(
    "IntersectionObserver",
    vi.fn((callback: IntersectionObserverCallback) => {
      triggerObserver = (entries) =>
        callback(
          entries as IntersectionObserverEntry[],
          {} as IntersectionObserver,
        );
      return {
        observe: vi.fn(),
        disconnect: vi.fn(),
        unobserve: vi.fn(),
      };
    }),
  );
}

function makeEntry(
  id: string,
  isIntersecting: boolean,
  topOffset: number,
): Partial<IntersectionObserverEntry> {
  const el = document.getElementById(id)!;
  return {
    target: el,
    isIntersecting,
    boundingClientRect: { top: topOffset } as DOMRect,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useActiveSection", () => {
  beforeEach(() => {
    setupIntersectionObserverMock();
    document.body.innerHTML = `
      <h2 id="heading-1">Heading 1</h2>
      <h2 id="heading-2">Heading 2</h2>
      <h3 id="heading-3">Heading 3</h3>
    `;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("returns empty string when ids array is empty", () => {
    const { result } = renderHook(() => useActiveSection([]));
    expect(result.current).toBe("");
  });

  it("returns the first heading ID before the observer fires", () => {
    const { result } = renderHook(() =>
      useActiveSection(["heading-1", "heading-2", "heading-3"]),
    );
    expect(result.current).toBe("heading-1");
  });

  it("updates the active ID when a heading enters the observer zone", () => {
    const { result } = renderHook(() =>
      useActiveSection(["heading-1", "heading-2", "heading-3"]),
    );

    act(() => {
      triggerObserver([makeEntry("heading-2", true, 50)]);
    });

    expect(result.current).toBe("heading-2");
  });

  it("picks the topmost heading in document order when multiple are visible", () => {
    const { result } = renderHook(() =>
      useActiveSection(["heading-1", "heading-2", "heading-3"]),
    );

    act(() => {
      triggerObserver([
        makeEntry("heading-2", true, 200),
        makeEntry("heading-1", true, 100),
      ]);
    });

    // heading-1 comes first in the ids array (document order) → wins
    expect(result.current).toBe("heading-1");
  });

  it("keeps the last scrolled-past heading active when past the bottom of the page", () => {
    const { result } = renderHook(() =>
      useActiveSection(["heading-1", "heading-2", "heading-3"]),
    );

    // heading-2 becomes active
    act(() => {
      triggerObserver([makeEntry("heading-2", true, 50)]);
    });
    expect(result.current).toBe("heading-2");

    // Scroll further: all headings exit above the viewport
    act(() => {
      triggerObserver([
        makeEntry("heading-2", false, -100),
        makeEntry("heading-3", false, -50),
      ]);
    });

    // The last heading in document order that we've scrolled past is heading-3
    expect(result.current).toBe("heading-3");
  });

  it("resets to the first heading when scrolled back above all headings", () => {
    const { result } = renderHook(() =>
      useActiveSection(["heading-1", "heading-2", "heading-3"]),
    );

    // Scroll down past heading-1
    act(() => {
      triggerObserver([makeEntry("heading-1", false, -50)]);
    });

    // Scroll back up: heading-1 exits from below (top > 0)
    act(() => {
      triggerObserver([makeEntry("heading-1", false, 300)]);
    });

    // Now above all headings → first heading is active
    expect(result.current).toBe("heading-1");
  });
});
