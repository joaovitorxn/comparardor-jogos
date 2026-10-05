import { describe, expect, it } from "vitest";
import { priceRarity } from "./rarity";

describe("priceRarity", () => {
  it("has no rarity below 30%", () => {
    expect(priceRarity(0)).toBeNull();
    expect(priceRarity(29)).toBeNull();
  });

  it("changes tier exactly at each threshold", () => {
    expect(priceRarity(30)?.id).toBe("rare");
    expect(priceRarity(49)?.id).toBe("rare");
    expect(priceRarity(50)?.id).toBe("epic");
    expect(priceRarity(69)?.id).toBe("epic");
    expect(priceRarity(70)?.id).toBe("legendary");
    expect(priceRarity(89)?.id).toBe("legendary");
    expect(priceRarity(90)?.id).toBe("mythic");
    expect(priceRarity(100)?.id).toBe("mythic");
  });
});
