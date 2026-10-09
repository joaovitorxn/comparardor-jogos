import { describe, expect, it } from "vitest";
import { pickFeaturedDeals, type DealGame, type GameSummary } from "./queries";

function deal(id: number, over: Partial<GameSummary> = {}): GameSummary {
  const game: DealGame = {
    id,
    slug: `g${id}`,
    title: `Game ${id}`,
    coverUrl: null,
    releaseDate: "2025",
    criticRating: 85,
    criticRatingCount: 10,
    metacritic: 85,
    userScore: 90,
    userReviewCount: 500,
    historyLowCents: 2000,
    developers: [`dev${id}`],
    publishers: [`pub${id}`],
    genres: ["Ação"],
  };
  return {
    game,
    bestPriceCents: 2000,
    regularPriceCents: 10000,
    maxDiscount: 80,
    storeCount: 2,
    bestStore: "steam",
    bestPlatform: null,
    families: [],
    stores: ["steam"],
    ...over,
  };
}

const ids = (list: GameSummary[]) => list.map((s) => s.game.id);

describe("hype no ranking de destaque", () => {
  it("1 voto não muda a ordem, 10 votos mudam", () => {
    // jogo 1 tem 80% de desconto, jogo 2 tem 60% (cerca de 3,75 pontos a menos)
    const base = [deal(1), deal(2, { maxDiscount: 60 })];
    expect(ids(pickFeaturedDeals(base, Infinity))).toEqual([1, 2]);
    expect(ids(pickFeaturedDeals([deal(1), deal(2, { maxDiscount: 60, hypes: 1 })], Infinity))).toEqual([1, 2]);
    expect(ids(pickFeaturedDeals([deal(1), deal(2, { maxDiscount: 60, hypes: 10 })], Infinity))).toEqual([2, 1]);
  });

  it("jogo fraco com muitos hypes não passa à frente de jogo forte", () => {
    const weak = deal(1, { maxDiscount: 25, hypes: 5000 });
    const strong = deal(2);
    expect(ids(pickFeaturedDeals([weak, strong], Infinity))).toEqual([2, 1]);
  });
});
