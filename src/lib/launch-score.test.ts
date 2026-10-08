import { describe, expect, it } from "vitest";
import { launchScore } from "./launch-score";

const big = { maxRegularCents: 29_900, families: 2, stores: 3, quality: 60 }; // AAA recém-lançado, ainda sem crítica
const indie = { maxRegularCents: 2_500, families: 1, stores: 1, quality: 55 };

describe("launchScore", () => {
  it("ranks a big multi-platform release above a small one-store release", () => {
    expect(launchScore(big)).toBeGreaterThan(launchScore(indie));
  });

  it("caps the price weight at R$ 250", () => {
    expect(launchScore({ ...big, maxRegularCents: 25_000 })).toBe(launchScore({ ...big, maxRegularCents: 60_000 }));
  });

  it("rewards good reviews but ignores a missing score (55 = no score yet)", () => {
    expect(launchScore({ ...big, quality: 90 })).toBeGreaterThan(launchScore({ ...big, quality: 55 }));
    expect(launchScore({ ...big, quality: 40 })).toBe(launchScore({ ...big, quality: 55 }));
  });

  it("does not let many key stores for the same PC game outweigh platforms", () => {
    const manyStores = { ...indie, maxRegularCents: 15_000, stores: 6 };
    const manyPlatforms = { ...indie, maxRegularCents: 15_000, families: 4 };
    expect(launchScore(manyPlatforms)).toBeGreaterThan(launchScore(manyStores));
  });
});

describe("launchScore: freshness and review pace", () => {
  const base = { maxRegularCents: 29_900, families: 2, stores: 3, quality: 60 };

  it("lets a big release from yesterday beat the same game from three weeks ago", () => {
    expect(launchScore({ ...base, daysSinceRelease: 1 })).toBeGreaterThan(launchScore({ ...base, daysSinceRelease: 21 }));
  });

  it("gives no extra points after 30 days and counts days 0 to 3 the same", () => {
    expect(launchScore({ ...base, daysSinceRelease: 0 })).toBe(launchScore({ ...base, daysSinceRelease: 3 }));
    expect(launchScore({ ...base, daysSinceRelease: 45 })).toBe(launchScore({ ...base, daysSinceRelease: 30 }));
  });

  it("rewards reviews per day, so a fast-selling new release outranks a slow one with the same total", () => {
    expect(launchScore({ ...base, reviews: 6000, daysSinceRelease: 6 })).toBeGreaterThan(launchScore({ ...base, reviews: 6000, daysSinceRelease: 28 }));
  });
});
