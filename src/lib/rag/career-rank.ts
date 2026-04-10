import careerData from "@/data/career.json";

interface CareerEntry {
  name: string;
  title: string;
  start: string;
}

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function deriveCareerSlug(entry: { name: string; title: string }): string {
  return `career:${toKebabCase(entry.name)}-${toKebabCase(entry.title)}`;
}

/**
 * Builds a Map<slug, recencyRank> from a list of career entries sorted by
 * start date descending (rank 0 = most recent). Throws loudly if any start
 * date cannot be parsed, so callers never silently get wrong ordering.
 */
export function buildCareerRankMap(
  careers: CareerEntry[],
): Map<string, number> {
  const sorted = [...careers].sort((a, b) => {
    const dateA = new Date(a.start).getTime();
    const dateB = new Date(b.start).getTime();
    if (isNaN(dateA)) {
      throw new Error(
        `Cannot parse start date "${a.start}" for career entry "${a.name}"`,
      );
    }
    if (isNaN(dateB)) {
      throw new Error(
        `Cannot parse start date "${b.start}" for career entry "${b.name}"`,
      );
    }
    return dateB - dateA;
  });
  return new Map(sorted.map((entry, idx) => [deriveCareerSlug(entry), idx]));
}

// Built once at module initialization; throws on bad dates (fast-fail).
const careerRankMap = buildCareerRankMap(careerData.career);

/**
 * Re-orders chunks so career entries appear in start-date descending order
 * (most recent first). Non-career chunks are placed after all career chunks,
 * sorted by similarity score. Within the career group, score is the tiebreaker.
 *
 * This is a pure function exported for independent unit testing.
 */
export function careerRecencyStrategy<
  T extends { slug: string; score: number },
>(chunks: T[]): T[] {
  return [...chunks].sort((a, b) => {
    const rankA = careerRankMap.get(a.slug) ?? Infinity;
    const rankB = careerRankMap.get(b.slug) ?? Infinity;
    if (rankA !== rankB) return rankA - rankB;
    return b.score - a.score;
  });
}
