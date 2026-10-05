import { describe, expect, it } from "vitest";
import { parsePsConceptPage } from "./psstore";

// Reproduz a estrutura real da página (bloco "env:" com o cache do Apollo), reduzida ao essencial.
function page(cache: Record<string, unknown>, conceptId = "10002648") {
  const block = JSON.stringify({ args: { conceptId }, cache });
  return `<html><script id="env:abc" type="application/json">{"args":{},"cache":{}}</script><script id="env:def" type="application/json">${block}</script></html>`;
}

const product = (ctas: string[], titleId = "PPSA03355_00") => ({
  "Product:UP2125-PPSA03355_00-1": {
    __typename: "Product",
    id: "UP2125-PPSA03355_00-1",
    name: "Hades",
    npTitleId: titleId,
    webctas: ctas.map((c) => ({ __ref: `GameCTA:${c}` })),
  },
});

const cta = (id: string, price: Record<string, unknown>) => ({
  [`GameCTA:${id}`]: { __typename: "GameCTA", id, price: { currencyCode: "BRL", ...price } },
});

describe("parsePsConceptPage", () => {
  it("reads the regular purchase price and sale end", () => {
    const html = page({
      ...product(["BUY"]),
      ...cta("BUY", { basePriceValue: 12450, discountedValue: 3735, serviceBranding: ["NONE"], endTime: "1791442740000" }),
    });
    expect(parsePsConceptPage(html, "10002648")).toEqual({
      productId: "UP2125-PPSA03355_00-1",
      title: "Hades",
      platform: "ps5",
      price: { currency: "BRL", priceCents: 3735, regularPriceCents: 12450, discountPercent: 70 },
      saleEndsAt: new Date(1791442740000),
    });
  });

  it("ignores PS Plus-only prices", () => {
    const html = page({
      ...product(["PLUS", "BUY"]),
      ...cta("PLUS", { basePriceValue: 12450, discountedValue: 4980, serviceBranding: ["PS_PLUS"] }),
      ...cta("BUY", { basePriceValue: 12450, discountedValue: 12450, serviceBranding: ["NONE"] }),
    });
    expect(parsePsConceptPage(html, "10002648")?.price.priceCents).toBe(12450);
  });

  it("detects PS4 titles and free games", () => {
    const html = page({ ...product(["F"], "CUSA12345_00"), ...cta("F", { isFree: true, serviceBranding: ["NONE"] }) });
    const r = parsePsConceptPage(html, "10002648");
    expect(r?.platform).toBe("ps4");
    expect(r?.price.priceCents).toBe(0);
  });

  it("returns null for other concepts or unbuyable products", () => {
    expect(parsePsConceptPage(page({ ...product(["X"]), ...cta("X", { basePriceValue: 100 }) }), "999")).toBeNull();
    expect(parsePsConceptPage(page({ ...product(["P"]), ...cta("P", { basePriceValue: 100, serviceBranding: ["PS_PLUS"] }) }), "10002648")).toBeNull();
  });
});
