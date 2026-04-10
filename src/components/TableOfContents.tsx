"use client";

import { cn } from "@/lib/utils";
import { TocHeading } from "@/hooks/useTableOfContents";

interface TableOfContentsProps {
  headings: TocHeading[];
  activeId?: string;
}

export function TableOfContents({ headings, activeId }: TableOfContentsProps) {
  return (
    <nav aria-label="Table of contents">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        On this page
      </p>
      <ul className="space-y-1.5">
        {headings.map((heading) => {
          const isActive = heading.id === activeId;
          return (
            <li key={heading.id} className={cn(heading.level === 3 && "pl-3")}>
              <a
                href={`#${heading.id}`}
                className={cn(
                  "block border-l-2 pl-2 text-sm leading-snug transition-colors duration-200",
                  isActive
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
                onClick={(e) => {
                  e.preventDefault();
                  const target = document.getElementById(heading.id);
                  if (target) {
                    target.scrollIntoView({ behavior: "smooth" });
                    history.pushState(null, "", `#${heading.id}`);
                  }
                }}
              >
                {heading.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
