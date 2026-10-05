import { describe, expect, it } from "vitest";
import { formatDuration } from "./format";

describe("formatDuration", () => {
  it("uses minutes below one hour", () => {
    expect(formatDuration(45 * 60)).toBe("45 min");
    expect(formatDuration(10)).toBe("1 min");
  });

  it("rounds to half hours below 20h", () => {
    expect(formatDuration(38296)).toBe("10,5 h"); // 10,64 h
    expect(formatDuration(76556)).toBe("21 h");
  });

  it("rounds to whole hours from 20h on", () => {
    expect(formatDuration(475_560)).toBe("132 h");
  });
});
