"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tracks the currently active section heading based on scroll position.
 *
 * Uses IntersectionObserver with a top-biased rootMargin so only headings
 * near the top of the viewport are considered "active". The topmost heading
 * in document order among visible ones wins.
 *
 * Edge cases:
 * - Top of page (above all headings): first heading is active.
 * - Bottom of page (scrolled past the last heading): last heading stays active.
 * - Multiple headings visible: topmost in document order is active.
 *
 * @param ids Heading element IDs in document order.
 * @returns The ID of the currently active heading.
 */
export function useActiveSection(ids: string[]): string {
  const [activeId, setActiveId] = useState<string>("");
  const visibleIds = useRef<Set<string>>(new Set());
  const scrolledPastIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (ids.length === 0) return;

    visibleIds.current = new Set();
    scrolledPastIds.current = new Set();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id;
          if (entry.isIntersecting) {
            visibleIds.current.add(id);
            scrolledPastIds.current.delete(id);
          } else if (entry.boundingClientRect.top < 0) {
            // Heading exited above the viewport — we scrolled past it going down
            scrolledPastIds.current.add(id);
            visibleIds.current.delete(id);
          } else {
            // Heading exited below the viewport — we scrolled back up past it
            scrolledPastIds.current.delete(id);
            visibleIds.current.delete(id);
          }
        });

        if (visibleIds.current.size > 0) {
          // Pick the topmost heading in document order among visible ones
          const topmost = ids.find((id) => visibleIds.current.has(id));
          if (topmost) setActiveId(topmost);
        } else if (scrolledPastIds.current.size > 0) {
          // Past all headings (bottom of page): keep the last one active
          const lastPast = [...ids]
            .reverse()
            .find((id) => scrolledPastIds.current.has(id));
          if (lastPast) setActiveId(lastPast);
        } else {
          // Above all headings (top of page): first heading is active
          setActiveId(ids[0]);
        }
      },
      // Narrow band near the top of the viewport (20%–30% from top)
      { rootMargin: "-20% 0px -70% 0px" },
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
      visibleIds.current = new Set();
      scrolledPastIds.current = new Set();
    };
  }, [ids]);

  // Fallback before the observer fires on first render:
  // show the first heading as active (handles top-of-page on initial load).
  return activeId || ids[0] || "";
}
