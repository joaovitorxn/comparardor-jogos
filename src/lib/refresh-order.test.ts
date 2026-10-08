import { describe, expect, it } from "vitest";
import { isSamePrice, pickForRefresh } from "./refresh-order";

// da mais antiga para a mais nova, como vem do banco
const row = (id: number, discount: number | null) => ({ id, discount });
const ids = (rows: { id: number }[]) => rows.map((r) => r.id);

describe("pickForRefresh", () => {
  it("takes everything when it fits under the cap", () => {
    const rows = [row(1, null), row(2, 50), row(3, null)];
    expect(pickForRefresh(rows, 10)).toEqual(rows);
  });

  it("puts discounted offers first, up to 70% of the cap, and fills the rest with the oldest", () => {
    // 10 ofertas: 1..5 sem desconto (as mais antigas), 6..10 com desconto; limite 5 → 4 com desconto (70% de 5, arredondado) + a mais antiga
    const rows = [1, 2, 3, 4, 5].map((i) => row(i, null)).concat([6, 7, 8, 9, 10].map((i) => row(i, 30)));
    expect(ids(pickForRefresh(rows, 5))).toEqual([1, 6, 7, 8, 9]);
  });

  it("never starves undiscounted offers: the oldest ones still get a share", () => {
    const rows = [row(1, null), row(2, null)].concat(Array.from({ length: 20 }, (_, i) => row(i + 3, 40)));
    const picked = ids(pickForRefresh(rows, 10));
    expect(picked).toContain(1);
    expect(picked).toHaveLength(10);
  });

  it("falls back to the oldest when there are few discounted offers", () => {
    const rows = [row(1, null), row(2, null), row(3, null), row(4, 20), row(5, null)];
    expect(ids(pickForRefresh(rows, 3))).toEqual([1, 2, 4]);
  });
});

describe("isSamePrice", () => {
  const stored = { priceCents: 5999, priceRegularCents: 7999, priceCurrency: "BRL" };
  const read = { priceCents: 5999, regularPriceCents: 7999, currency: "BRL" };

  it("is true only when price, regular price and currency all match", () => {
    expect(isSamePrice(stored, read)).toBe(true);
    expect(isSamePrice(stored, { ...read, priceCents: 4999 })).toBe(false);
    expect(isSamePrice(stored, { ...read, regularPriceCents: 9999 })).toBe(false);
    expect(isSamePrice(stored, { ...read, currency: "USD" })).toBe(false);
  });

  it("is false for an offer that has no stored price yet", () => {
    expect(isSamePrice({ priceCents: null, priceRegularCents: null, priceCurrency: null }, read)).toBe(false);
  });
});
