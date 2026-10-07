import { describe, expect, it } from "vitest";
import type { PriceSeries } from "@/db/queries";
import { computeVerdict } from "./verdict";

const DAY = 86_400_000;
const now = Date.parse("2026-10-07T12:00:00Z");
/** Série de uma loja: [dias atrás, centavos], do mais antigo para o mais recente. */
const series = (...steps: [number, number][]): PriceSeries[] => [
  { store: "steam", points: steps.map(([d, c]) => [now - d * DAY, c]), trackedSince: null },
];
const run = (s: PriceSeries[], currentCents: number, historicLowCents: number | null = null) =>
  computeVerdict({ series: s, currentCents, historicLowCents, now, hasSteam: true });

describe("computeVerdict", () => {
  it("says buy at the lowest price ever", () => {
    const v = run(series([400, 10000], [300, 5000], [250, 10000], [100, 5000], [30, 10000], [3, 4000]), 4000, 4000);
    expect(v?.kind).toBe("buy");
    expect(v?.title).toBe("Menor preço já registrado");
    expect(v?.daysAtCurrent).toBe(3);
  });

  it("says wait when the price was lower several times and today's is well above", () => {
    const v = run(series([400, 10000], [300, 5000], [280, 10000], [200, 5000], [180, 10000], [100, 5100], [90, 10000]), 10000, 5000);
    expect(v?.kind).toBe("wait");
    expect(v?.nearLowCount).toBe(3);
  });

  it("does not tell people to wait over a few reais", () => {
    const v = run(series([400, 800], [300, 400], [280, 800], [200, 400], [180, 800]), 800, 400);
    expect(v?.kind).toBe("neutral");
  });

  it("has no opinion with short history, free games or flat prices", () => {
    expect(run(series([30, 10000], [10, 5000]), 5000)).toBeNull();
    expect(run(series([400, 0], [10, 0]), 0)).toBeNull();
    expect(run(series([400, 10000], [10, 10000]), 10000)).toBeNull();
  });
});
