import { describe, expect, it } from "vitest";
import { bestByFamily, type PricedOffer } from "./best-by-family";
import { compareOffers } from "./stores";

const offer = (store: string, cents: number): PricedOffer => ({ store, platform: "pc", edition: "", cents, regularCents: 10000, discountPercent: 0 });

describe("compareOffers", () => {
  it("prefers Nuuvem only on a price tie", () => {
    const sorted = [{ store: "steam", cents: 5000 }, { store: "nuuvem", cents: 5000 }, { store: "gog", cents: 4000 }].sort(compareOffers);
    expect(sorted.map((o) => o.store)).toEqual(["gog", "nuuvem", "steam"]);
  });

  it("never beats a cheaper store", () => {
    expect([{ store: "nuuvem", cents: 5001 }, { store: "steam", cents: 5000 }].sort(compareOffers)[0].store).toBe("steam");
  });
});

describe("bestByFamily", () => {
  it("picks Nuuvem when it ties with another store, whatever the order", () => {
    for (const offers of [[offer("steam", 5000), offer("nuuvem", 5000)], [offer("nuuvem", 5000), offer("steam", 5000)]]) {
      expect(bestByFamily(offers).get("all")?.store).toBe("nuuvem");
    }
  });
});
