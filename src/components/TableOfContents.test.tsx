import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TableOfContents } from "./TableOfContents";
import { TocHeading } from "@/hooks/useTableOfContents";

const headings: TocHeading[] = [
  { id: "intro", text: "Introduction", level: 2 },
  { id: "background", text: "Background", level: 3 },
  { id: "conclusion", text: "Conclusion", level: 2 },
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("TableOfContents", () => {
  it("renders the correct number of nav links", () => {
    render(<TableOfContents headings={headings} />);
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });

  it("renders each heading's text as a link", () => {
    render(<TableOfContents headings={headings} />);
    expect(
      screen.getByRole("link", { name: "Introduction" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Background" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Conclusion" }),
    ).toBeInTheDocument();
  });

  it("sets correct href anchors on links", () => {
    render(<TableOfContents headings={headings} />);
    expect(screen.getByRole("link", { name: "Introduction" })).toHaveAttribute(
      "href",
      "#intro",
    );
    expect(screen.getByRole("link", { name: "Background" })).toHaveAttribute(
      "href",
      "#background",
    );
  });

  it("renders with accessible nav label", () => {
    render(<TableOfContents headings={headings} />);
    expect(
      screen.getByRole("navigation", { name: "Table of contents" }),
    ).toBeInTheDocument();
  });

  it("indents H3 list items with pl-3 class", () => {
    render(<TableOfContents headings={headings} />);
    const items = screen.getAllByRole("listitem");
    // Background (index 1) is H3 → should have pl-3
    expect(items[1]).toHaveClass("pl-3");
    // H2 items (index 0 and 2) should not
    expect(items[0]).not.toHaveClass("pl-3");
    expect(items[2]).not.toHaveClass("pl-3");
  });

  it("applies active styling to the active link", () => {
    render(<TableOfContents headings={headings} activeId="intro" />);
    const introLink = screen.getByRole("link", { name: "Introduction" });
    expect(introLink).toHaveClass("border-primary");
    expect(introLink).toHaveClass("text-foreground");
  });

  it("applies inactive styling to non-active links", () => {
    render(<TableOfContents headings={headings} activeId="intro" />);
    const conclusionLink = screen.getByRole("link", { name: "Conclusion" });
    expect(conclusionLink).toHaveClass("border-transparent");
    expect(conclusionLink).toHaveClass("text-muted-foreground");
  });

  it("all links are inactive (border-transparent) when no activeId is provided", () => {
    render(<TableOfContents headings={headings} />);
    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveClass("border-transparent");
    }
  });

  it("calls scrollIntoView with smooth behavior on click", () => {
    const mockScrollIntoView = vi.fn();
    const mockTarget = document.createElement("h2");
    mockTarget.id = "intro";
    mockTarget.scrollIntoView = mockScrollIntoView;
    vi.spyOn(document, "getElementById").mockReturnValue(mockTarget);

    render(<TableOfContents headings={headings} />);
    fireEvent.click(screen.getByRole("link", { name: "Introduction" }));

    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });
  });

  it("updates URL hash via history.pushState on click", () => {
    const pushStateSpy = vi.spyOn(history, "pushState");
    const mockTarget = document.createElement("h2");
    mockTarget.id = "intro";
    mockTarget.scrollIntoView = vi.fn();
    vi.spyOn(document, "getElementById").mockReturnValue(mockTarget);

    render(<TableOfContents headings={headings} />);
    fireEvent.click(screen.getByRole("link", { name: "Introduction" }));

    expect(pushStateSpy).toHaveBeenCalledWith(null, "", "#intro");
  });

  it("renders empty list when no headings are provided", () => {
    render(<TableOfContents headings={[]} />);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });
});
