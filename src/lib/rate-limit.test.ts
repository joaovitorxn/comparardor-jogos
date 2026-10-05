import { describe, expect, it } from "vitest";
import { RateLimiter } from "./rate-limit";

describe("RateLimiter", () => {
  it("allows up to the limit inside the window", () => {
    const rl = new RateLimiter(2, 1000);
    expect(rl.take("a", 0)).toBe(true);
    expect(rl.take("a", 100)).toBe(true);
    expect(rl.take("a", 200)).toBe(false);
  });

  it("keeps keys independent", () => {
    const rl = new RateLimiter(1, 1000);
    expect(rl.take("a", 0)).toBe(true);
    expect(rl.take("b", 0)).toBe(true);
    expect(rl.take("a", 10)).toBe(false);
  });

  it("frees slots as the window slides", () => {
    const rl = new RateLimiter(1, 1000);
    expect(rl.take("a", 0)).toBe(true);
    expect(rl.take("a", 999)).toBe(false);
    expect(rl.take("a", 1001)).toBe(true);
  });
});
