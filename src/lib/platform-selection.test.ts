import { describe, expect, it } from "vitest";
import { allPlatformCombinations, parsePlatforms, serializePlatforms } from "./platform-selection";

describe("platform selection", () => {
  it("reads only valid platforms, in a fixed order, without repeats", () => {
    expect(parsePlatforms("playstation-pc")).toEqual(["pc", "playstation"]);
    expect(parsePlatforms("xbox.xbox,lixo")).toEqual(["xbox"]);
  });

  it("treats nothing or everything as 'all' (empty list)", () => {
    expect(parsePlatforms("")).toEqual([]);
    expect(parsePlatforms(undefined)).toEqual([]);
    expect(parsePlatforms("pc-playstation-xbox-nintendo")).toEqual([]);
    expect(parsePlatforms("lixo")).toEqual([]);
  });

  it("serializes in the same canonical order", () => {
    expect(serializePlatforms(["playstation", "pc"])).toBe("pc-playstation");
    expect(serializePlatforms([])).toBe("");
  });

  it("lists the 14 personalized combinations, all distinct and valid", () => {
    const combos = allPlatformCombinations().map((c) => serializePlatforms(c));
    expect(combos).toHaveLength(14);
    expect(new Set(combos).size).toBe(14);
    for (const c of combos) expect(parsePlatforms(c).length).toBeGreaterThan(0);
  });
});
