import { describe, expect, it } from "vitest";
import { parseBrl } from "./push-client";

describe("parseBrl", () => {
  it("accepts the usual ways of typing a price", () => {
    expect(parseBrl("R$ 25,90")).toBe(2590);
    expect(parseBrl("25,9")).toBe(2590);
    expect(parseBrl("25.90")).toBe(2590);
    expect(parseBrl("25")).toBe(2500);
    expect(parseBrl("1.299,90")).toBe(129990);
    expect(parseBrl("1.299")).toBe(129900);
  });

  it("rejects empty or zero values", () => {
    expect(parseBrl("")).toBeNull();
    expect(parseBrl("R$")).toBeNull();
    expect(parseBrl("0")).toBeNull();
  });
});
