import { describe, expect, it } from "vitest";
import { searchTerm, titleAcronyms } from "./search-text";

describe("searchTerm", () => {
  it("normalizes case, accents and roman numerals", () => {
    expect(searchTerm("II")).toBe("2");
    expect(searchTerm("Pokémon")).toBe("pokemon");
    expect(searchTerm("V")).toBe("5");
    expect(searchTerm("Valheim")).toBe("valheim");
  });

  it("drops empty terms", () => {
    expect(searchTerm("—")).toBeNull();
  });
});

describe("titleAcronyms", () => {
  it("builds the acronyms players type", () => {
    expect(titleAcronyms("Grand Theft Auto V")).toEqual(expect.arrayContaining(["gta", "gta5", "gtav"]));
    expect(titleAcronyms("Red Dead Redemption 2")).toEqual(expect.arrayContaining(["rdr", "rdr2"]));
    expect(titleAcronyms("Baldur's Gate 3")).toEqual(expect.arrayContaining(["bg", "bg3"]));
  });

  it("uses only the main title before subtitles", () => {
    expect(titleAcronyms("The Witcher 3: Wild Hunt")).toEqual(expect.arrayContaining(["tw", "tw3"]));
    expect(titleAcronyms("The Elder Scrolls V: Skyrim Special Edition")).toEqual(expect.arrayContaining(["tes", "tes5", "es5"]));
  });

  it("skips single-word titles", () => {
    expect(titleAcronyms("Hades")).toEqual([]);
    expect(titleAcronyms("Hades II")).toEqual([]);
  });
});
