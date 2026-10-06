import { describe, expect, it } from "vitest";
import { isDifferentGame, parseReleaseDate, releaseMatches } from "./release-date";

describe("parseReleaseDate", () => {
  it("reads the Steam format and ignores vague dates", () => {
    expect(parseReleaseDate("24/mar./2023")?.getUTCFullYear()).toBe(2023);
    expect(parseReleaseDate("A ser anunciada")).toBeNull();
    expect(parseReleaseDate(null)).toBeNull();
  });
});

describe("releaseMatches", () => {
  const remake = parseReleaseDate("24/mar./2023");
  it("rejects a console version released long before the catalog game (2005 port vs 2023 remake)", () => {
    expect(releaseMatches(remake, new Date("2021-01-22"))).toBe(false);
    expect(releaseMatches(remake, new Date("2005-01-11"))).toBe(false);
  });

  it("accepts later ports and releases within a year", () => {
    expect(releaseMatches(remake, new Date("2023-03-24"))).toBe(true);
    expect(releaseMatches(remake, new Date("2024-06-01"))).toBe(true);
    // Monster Hunter Rise: Switch em jan/2021, PC em jan/2022 — mesmo jogo
    expect(releaseMatches(parseReleaseDate("12/jan./2022"), new Date("2021-03-26"))).toBe(true);
  });

  it("accepts when a date is missing", () => {
    expect(releaseMatches(null, new Date("2000-01-01"))).toBe(true);
    expect(releaseMatches(remake, null)).toBe(true);
  });
});

describe("isDifferentGame", () => {
  const remake = { release: parseReleaseDate("24/mar./2023"), platforms: ["PC", "PS5", "PS4", "Xbox Series X|S", "Switch 2"] };

  it("flags the 2005 Switch version of Resident Evil 4 when the catalog game is the remake", () => {
    expect(isDifferentGame(remake, { platform: "switch", releasedAt: new Date("2021-01-22") })).toBe(true);
  });

  it("keeps same-game ports: IGDB lists the Switch, or the date fits", () => {
    // Untitled Goose Game: o Switch saiu antes do PC (Steam), mas o IGDB lista o Switch
    expect(isDifferentGame({ release: parseReleaseDate("23/set./2020"), platforms: ["PC", "Switch"] }, { platform: "switch", releasedAt: new Date("2019-09-20") })).toBe(false);
    // IGDB incompleto, mas a data bate
    expect(isDifferentGame(remake, { platform: "switch", releasedAt: new Date("2023-05-01") })).toBe(false);
  });

  it("does nothing when IGDB platforms are unknown or for Switch 2 editions", () => {
    expect(isDifferentGame({ release: remake.release, platforms: [] }, { platform: "switch", releasedAt: new Date("2005-01-01") })).toBe(false);
    expect(isDifferentGame(remake, { platform: "switch2", releasedAt: new Date("2021-01-22") })).toBe(false);
  });
});
