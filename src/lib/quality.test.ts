import { describe, expect, it } from "vitest";
import { blendedQuality, userScoreAsRating } from "./quality";

const none = { criticRating: null, criticRatingCount: null, metacritic: null, userScore: null, userReviewCount: null };

describe("blendedQuality", () => {
  it("is neutral (55) without any rating", () => {
    expect(blendedQuality(none)).toBe(55);
  });

  it("keeps the old critic-only behavior", () => {
    expect(blendedQuality({ ...none, criticRating: 90, criticRatingCount: 10 })).toBeGreaterThan(80);
    // com uma análise só, a nota é puxada para 60
    expect(blendedQuality({ ...none, criticRating: 90, criticRatingCount: 1 })).toBeLessThan(70);
  });

  it("lets players carry a new release that critics have not reviewed yet", () => {
    expect(blendedQuality({ ...none, userScore: 95, userReviewCount: 5000 })).toBeGreaterThan(85);
  });

  it("ignores a handful of player reviews", () => {
    expect(blendedQuality({ ...none, userScore: 100, userReviewCount: 5 })).toBe(55);
  });

  it("lowers a game critics like but players dislike", () => {
    const critics = blendedQuality({ ...none, criticRating: 85, criticRatingCount: 20 });
    const both = blendedQuality({ ...none, criticRating: 85, criticRatingCount: 20, userScore: 45, userReviewCount: 3000 });
    expect(both).toBeLessThan(critics);
  });

  it("maps Steam percentages onto the critic scale", () => {
    expect(userScoreAsRating(70)).toBeCloseTo(60, 0);
    expect(userScoreAsRating(95)).toBeGreaterThan(90);
    expect(userScoreAsRating(100)).toBeLessThanOrEqual(100);
  });
});
