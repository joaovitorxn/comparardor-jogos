import { describe, expect, it } from "vitest";
import { userScoreInfo } from "./user-score";

describe("userScoreInfo", () => {
  it("has no label with few reviews", () => {
    expect(userScoreInfo(100, 9)).toBeNull();
  });

  it("follows the Steam bands for positive scores", () => {
    expect(userScoreInfo(97, 2000)?.label).toBe("Extremamente positivas");
    expect(userScoreInfo(97, 120)?.label).toBe("Muito positivas");
    expect(userScoreInfo(85, 20)?.label).toBe("Positivas");
    expect(userScoreInfo(75, 300)?.label).toBe("Majoritariamente positivas");
  });

  it("calls the middle mixed and the bottom negative", () => {
    expect(userScoreInfo(55, 400)).toEqual({ label: "Mistas", tone: "mixed" });
    expect(userScoreInfo(30, 400)).toEqual({ label: "Majoritariamente negativas", tone: "bad" });
    expect(userScoreInfo(10, 900)?.label).toBe("Extremamente negativas");
    expect(userScoreInfo(10, 100)?.label).toBe("Muito negativas");
  });
});
