import { describe, expect, it } from "vitest";
import { franchiseKey, onePerFranchise, sameFranchise } from "./franchise";

const g = (title: string, publishers: string[] = ["Square Enix"]) => ({ title, developers: [], publishers });

describe("franchiseKey", () => {
  it("cuts at numerals, roman numerals and subtitles", () => {
    expect(franchiseKey("FINAL FANTASY VII REBIRTH")).toBe("final fantasy");
    expect(franchiseKey("FINAL FANTASY XVI")).toBe("final fantasy");
    expect(franchiseKey("Like a Dragon: Infinite Wealth")).toBe("like a");
    expect(franchiseKey("The Talos Principle 2")).toBe("talos principle");
    expect(franchiseKey("Hades II")).toBe("hades");
    expect(franchiseKey("Marvel's Spider-Man Remastered")).toBe("marvels spider");
  });
});

describe("sameFranchise", () => {
  it("needs the same key and a shared company", () => {
    expect(sameFranchise(g("Final Fantasy VII Remake"), g("Final Fantasy XVI"))).toBe(true);
    expect(sameFranchise(g("Call of Duty", ["Activision"]), g("Call of Juarez", ["Techland"]))).toBe(false);
  });
});

describe("onePerFranchise", () => {
  it("keeps one per franchise and fills with the rest when short", () => {
    const list = [g("Final Fantasy VII"), g("Final Fantasy XVI"), g("Hades", ["Supergiant"]), g("Final Fantasy X")];
    expect(onePerFranchise(list, 2, (x) => x).map((x) => x.title)).toEqual(["Final Fantasy VII", "Hades"]);
    expect(onePerFranchise(list, 4, (x) => x).map((x) => x.title)).toEqual(["Final Fantasy VII", "Hades", "Final Fantasy XVI", "Final Fantasy X"]);
  });
});
