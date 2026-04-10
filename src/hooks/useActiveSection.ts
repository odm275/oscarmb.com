"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tracks the currently active section heading based on scroll position.
 *
 * Uses IntersectionObserver with a top-biased rootMargin so only sections
 * near the top of the viewport are considered "active". When multiple
 * sections are visible (e.g. a parent h2 and its nested h3), the innermost
 * section — the one that contains no other visible section — wins.
 *
 * Edge cases:
 * - Top of page (above all headings): first heading is active.
 * - Bottom of page (scrolled past the last heading): last heading stays active.
 * - Multiple sibling sections visible: topmost in document order is active.
 *
 * @param ids Section element IDs in document order.
 * @returns The ID of the currently active section.
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
            scrolledPastIds.current.add(id);
            visibleIds.current.delete(id);
          } else {
            scrolledPastIds.current.delete(id);
            visibleIds.current.delete(id);
          }
        });

        if (visibleIds.current.size > 0) {
          const visibleList = ids.filter((id) => visibleIds.current.has(id));
          const innermost =
            visibleList.find((id) => {
              const el = document.getElementById(id);
              if (!el) return false;
              return !visibleList.some((otherId) => {
                if (otherId === id) return false;
                const otherEl = document.getElementById(otherId);
                return otherEl && el.contains(otherEl);
              });
            }) ?? visibleList[0];
          if (innermost) setActiveId(innermost);
        } else if (scrolledPastIds.current.size > 0) {
          const lastPast = [...ids]
            .reverse()
            .find((id) => scrolledPastIds.current.has(id));
          if (lastPast) setActiveId(lastPast);
        } else {
          setActiveId(ids[0]);
        }
      },
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
