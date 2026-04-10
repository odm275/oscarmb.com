import { describe, it, expect, vi } from "vitest";
import {
  formatChunks,
  careerRecencyStrategy,
  buildCareerRankMap,
  retrieveChunks,
  getContextForQuery,
} from "./index";

// ---------------------------------------------------------------------------
// Mock declarations (hoisted by Vitest — must be at module top level)
// ---------------------------------------------------------------------------

vi.mock("@generated/embeddings.json", () => ({
  default: {
    _warning: "test",
    embeddings: [
      {
        slug: "page-a",
        title: "Page A",
        content: "Content A",
        embedding: [0, 1, 0],
      },
      {
        slug: "page-b",
        title: "Page B",
        content: "Content B",
        embedding: [1, 0, 0],
      },
      {
        slug: "career:cvs-health-co-branding-brand-senior-software-engineer",
        title: "Career: CVS",
        content: "CVS content",
        embedding: [0.9, 0.1, 0],
      },
      {
        slug: "career:freelance-full-stack-engineer",
        title: "Career: Freelance",
        content: "Freelance content",
        embedding: [0.8, 0.2, 0],
      },
      {
        slug: "career:poetic-software-developer",
        title: "Career: Poetic",
        content: "Poetic content",
        embedding: [0.7, 0.3, 0],
      },
    ],
  },
}));

vi.mock("@/lib/embeddings", () => ({
  generateEmbedding: vi.fn().mockResolvedValue([1, 0, 0]),
}));

// ---------------------------------------------------------------------------
// formatChunks
// ---------------------------------------------------------------------------

describe("formatChunks", () => {
  it("returns the fallback string when the chunk list is empty", () => {
    expect(formatChunks([])).toBe("No relevant context found.");
  });

  it("formats chunks with numbered headers separated by ---", () => {
    const chunks = [
      { slug: "a", title: "Alpha", content: "Content A", score: 0.9 },
      { slug: "b", title: "Beta", content: "Content B", score: 0.8 },
    ];
    const result = formatChunks(chunks);
    expect(result).toContain("[1] Alpha\nContent A");
    expect(result).toContain("[2] Beta\nContent B");
    expect(result).toContain("---");
  });
});

// ---------------------------------------------------------------------------
// retrieveChunks
// ---------------------------------------------------------------------------

describe("retrieveChunks", () => {
  it("returns top-K chunks sorted by cosine similarity (highest score first)", () => {
    // Query [1, 0, 0] → page-b embedding [1,0,0] has similarity 1 (best)
    const results = retrieveChunks([1, 0, 0], { topK: 2 });
    expect(results[0].slug).toBe("page-b");
    expect(results[0].score).toBeCloseTo(1);
    expect(results).toHaveLength(2);
  });

  it("respects the topK option", () => {
    const results = retrieveChunks([1, 0, 0], { topK: 1 });
    expect(results).toHaveLength(1);
  });

  it("strips embedding vectors from returned chunks", () => {
    const results = retrieveChunks([1, 0, 0], { topK: 1 });
    expect(results[0]).not.toHaveProperty("embedding");
  });
});

// ---------------------------------------------------------------------------
// getContextForQuery
// ---------------------------------------------------------------------------

describe("getContextForQuery", () => {
  it("returns formatted context and chunk list for a valid query", async () => {
    const { context, chunks } = await getContextForQuery("test query");

    expect(context).not.toBe("No relevant context found.");
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0]).toMatchObject({
      slug: expect.any(String),
      score: expect.any(Number),
    });
  });

  it("applies career-recency ordering so the most recent career entry leads", async () => {
    const { chunks } = await getContextForQuery("career experience");
    const cvsIdx = chunks.findIndex((c) => c.slug.includes("cvs"));
    const freelanceIdx = chunks.findIndex((c) => c.slug.includes("freelance"));
    if (cvsIdx !== -1 && freelanceIdx !== -1) {
      // CVS (Oct 2022) should appear before Freelance (Oct 2020)
      expect(cvsIdx).toBeLessThan(freelanceIdx);
    }
  });
});

// ---------------------------------------------------------------------------
// careerRecencyStrategy
// ---------------------------------------------------------------------------

describe("careerRecencyStrategy", () => {
  const cvs = {
    slug: "career:cvs-health-co-branding-brand-senior-software-engineer",
    score: 0.7,
    title: "CVS",
    content: "",
  };
  const freelance = {
    slug: "career:freelance-full-stack-engineer",
    score: 0.9,
    title: "Freelance",
    content: "",
  };
  const poetic = {
    slug: "career:poetic-software-developer",
    score: 0.6,
    title: "Poetic",
    content: "",
  };
  const other = { slug: "page-x", score: 0.95, title: "Other", content: "" };

  it("places career chunks in start-date descending order (CVS first, Poetic last)", () => {
    const result = careerRecencyStrategy([poetic, freelance, cvs]);
    expect(result[0].slug).toBe(cvs.slug); // Oct 2022 → most recent
    expect(result[1].slug).toBe(freelance.slug); // Oct 2020
    expect(result[2].slug).toBe(poetic.slug); // Dec 2018
  });

  it("places non-career chunks after all career chunks, sorted by score descending", () => {
    const other2 = { slug: "page-y", score: 0.5, title: "Other2", content: "" };
    const result = careerRecencyStrategy([other2, poetic, other, cvs]);
    expect(result[0].slug).toBe(cvs.slug);
    expect(result[1].slug).toBe(poetic.slug);
    expect(result[2].slug).toBe(other.slug); // score 0.95
    expect(result[3].slug).toBe(other2.slug); // score 0.5
  });

  it("does not mutate the input array", () => {
    const input = [poetic, cvs, freelance];
    const inputCopy = [...input];
    careerRecencyStrategy(input);
    expect(input).toEqual(inputCopy);
  });
});

// ---------------------------------------------------------------------------
// buildCareerRankMap (startup validation)
// ---------------------------------------------------------------------------

describe("buildCareerRankMap", () => {
  it("throws a descriptive error when a career entry has an unparseable start date", () => {
    const badCareers = [
      { name: "Company A", title: "Engineer", start: "not-a-date" },
      { name: "Company B", title: "Engineer", start: "Jan 2020" },
    ];
    expect(() => buildCareerRankMap(badCareers)).toThrow(
      /Cannot parse start date "not-a-date" for career entry "Company A"/,
    );
  });

  it("assigns rank 0 to the most recent entry", () => {
    const careers = [
      { name: "Old Co", title: "Dev", start: "Jan 2018" },
      { name: "New Co", title: "Engineer", start: "Jan 2022" },
    ];
    const map = buildCareerRankMap(careers);
    expect(map.get("career:new-co-engineer")).toBe(0);
    expect(map.get("career:old-co-dev")).toBe(1);
  });
});
