import { describe, expect, it } from "vitest";
import { bestByFamily, type PricedOffer } from "./best-by-family";

const offer = (store: string, platform: PricedOffer["platform"], cents: number, edition = "Padrão"): PricedOffer => ({
  store,
  platform,
  edition,
  cents,
  regularCents: cents,
  discountPercent: 0,
});

describe("bestByFamily", () => {
  it("keeps the cheapest offer per platform family and overall", () => {
    const best = bestByFamily([offer("steam", "pc", 4000), offer("gog", "pc", 3500), offer("psstore", "ps5", 9000), offer("psstore", "ps4", 7000)]);
    expect(best.get("all")?.store).toBe("gog");
    expect(best.get("pc")?.cents).toBe(3500);
    expect(best.get("playstation")).toMatchObject({ cents: 7000, platform: "ps4" });
    expect(best.has("xbox")).toBe(false);
  });

  it("counts Xbox Play Anywhere for PC players too", () => {
    const best = bestByFamily([offer("steam", "pc", 5000), offer("xbox", "xbox", 3000, "Play Anywhere")]);
    expect(best.get("pc")?.store).toBe("xbox");
    expect(best.get("xbox")?.cents).toBe(3000);
  });

  it("does not count regular Xbox offers for PC", () => {
    const best = bestByFamily([offer("steam", "pc", 5000), offer("xbox", "xbox", 3000)]);
    expect(best.get("pc")?.store).toBe("steam");
  });

  it("groups Switch and Switch 2 together", () => {
    const best = bestByFamily([offer("nintendo", "switch2", 9000), offer("nintendo", "switch", 6000)]);
    expect(best.get("nintendo")?.platform).toBe("switch");
  });
});
