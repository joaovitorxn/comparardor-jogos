import { describe, expect, it } from "vitest";
import { hypeBonus, parseHyped, serializeHyped } from "./hype";

describe("hypeBonus", () => {
  it("é zero sem votos e ignora valores inválidos", () => {
    expect(hypeBonus(0)).toBe(0);
    expect(hypeBonus(-3)).toBe(0);
    expect(hypeBonus(Number.NaN)).toBe(0);
  });

  it("cresce devagar: 1 voto vale pouco, 10 votos valem mais", () => {
    expect(hypeBonus(1)).toBeCloseTo(1.8, 1);
    expect(hypeBonus(10)).toBeCloseTo(6.2, 1);
    expect(hypeBonus(10)).toBeGreaterThan(hypeBonus(1));
  });

  it("tem teto em 12", () => {
    expect(hypeBonus(100)).toBe(12);
    expect(hypeBonus(1_000_000)).toBe(12);
  });
});

describe("cookie dos hypes", () => {
  it("vai e volta", () => {
    expect(parseHyped(serializeHyped([3, 10, 7]))).toEqual([3, 10, 7]);
  });

  it("ignora lixo e vazio", () => {
    expect(parseHyped(undefined)).toEqual([]);
    expect(parseHyped("")).toEqual([]);
    expect(parseHyped("12.abc.-4.0.7.1.5")).toEqual([12, 7, 1, 5]);
  });

  it("guarda só os 200 mais recentes", () => {
    const ids = Array.from({ length: 300 }, (_, i) => i + 1);
    const back = parseHyped(serializeHyped(ids));
    expect(back).toHaveLength(200);
    expect(back.at(-1)).toBe(300);
  });
});
